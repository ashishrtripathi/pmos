import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSourceLocation } from "@/lib/pmos";

// Parse the real HTML to extract step structure
function parseUISteps(html: string) {
  const steps: {
    number: number;
    title: string;
    description: string;
    fields: string[];
    cardId: string;
    actions: string[];
  }[] = [];

  // Find step indicators: <div class="step active" id="step-N">Title</div>
  const stepRegex = /id="step-(\d+)"[^>]*>([^<]+)</g;
  let match;
  while ((match = stepRegex.exec(html)) !== null) {
    steps.push({
      number: parseInt(match[1]),
      title: match[2].trim(),
      description: "",
      fields: [],
      cardId: "",
      actions: [],
    });
  }

  // Find cards: <div class="card" id="...-card">
  // Each card has an h2 with the step title
  const cardRegex = /id="([^"]*-card)"[\s\S]*?<h2[^>]*>([^<]+)<\/h2>([\s\S]*?)(?=<div class="card"|<div class="cost-tracker"|<\/div>\s*<\/div>\s*<\/div>\s*$)/g;
  while ((match = cardRegex.exec(html)) !== null) {
    const cardId = match[1];
    const title = match[2].trim();
    const content = match[3];

    // Extract form fields from this card
    const fieldRegex = /<label[^>]*>([^<]+)<\/label>/g;
    let fieldMatch;
    const fields: string[] = [];
    while ((fieldMatch = fieldRegex.exec(content)) !== null) {
      fields.push(fieldMatch[1].trim());
    }

    // Extract button actions
    const btnRegex = /onclick="([^"]+)\(\)"[^>]*>([^<]+)<\/button>/g;
    let btnMatch;
    const actions: string[] = [];
    while ((btnMatch = btnRegex.exec(content)) !== null) {
      actions.push(btnMatch[2].trim());
    }

    // Find the matching step
    const step = steps.find((s) => title.includes(s.title) || s.title.includes(title));
    if (step) {
      step.cardId = cardId;
      step.description = content.match(/<p[^>]*>([^<]+)<\/p>/)?.[1]?.trim() || "";
      step.fields = fields;
      step.actions = actions;
    } else if (fields.length > 0 || actions.length > 0) {
      // Unmatched card with content — try to associate with existing step by number
      const numMatch = title.match(/^(\d+)/);
      const num = numMatch ? parseInt(numMatch[1]) : null;
      const target = num ? steps.find((s) => s.number === num) : null;
      if (target) {
        target.cardId = cardId;
        target.description = target.description || content.match(/<p[^>]*>([^<]+)<\/p>/)?.[1]?.trim() || "";
        target.fields = target.fields.length ? target.fields : fields;
        target.actions = target.actions.length ? target.actions : actions;
      }
    }
  }

  return steps;
}

// Extract buttons/actions from HTML
function parseUIActions(html: string) {
  const actions: { label: string; onclick: string; type: string }[] = [];
  const btnRegex = /<button[^>]*(?:class="([^"]*)")?[^>]*onclick="([^"]*)"[^>]*>([^<]+)<\/button>/g;
  let match;
  while ((match = btnRegex.exec(html)) !== null) {
    actions.push({
      type: match[1] || "default",
      onclick: match[2],
      label: match[3].trim(),
    });
  }
  return actions;
}

// Detect cost tracker info
function parseCostTracker(html: string) {
  const hasCostTracker = html.includes("cost-tracker") || html.includes("total-cost");
  const hasHalftonePreview = html.includes("halftone-modal") || html.includes("halftone-preview");
  return { hasCostTracker, hasHalftonePreview };
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const source = getSourceLocation(params.slug);
  if (!source?.localPath) {
    return NextResponse.json({ error: "No source location" }, { status: 404 });
  }

  const rootDir = source.localPath;
  
  // Find UI entry points
  const htmlPaths = [
    path.join(rootDir, "public", "index.html"),
    path.join(rootDir, "index.html"),
    path.join(rootDir, "app", "index.html"),
  ];

  const htmlPath = htmlPaths.find((p) => fs.existsSync(p));
  if (!htmlPath) {
    return NextResponse.json({ 
      error: "No UI entry point found",
      checked: htmlPaths.map((p) => path.relative(rootDir, p)),
    }, { status: 404 });
  }

  const html = fs.readFileSync(htmlPath, "utf-8");
  const steps = parseUISteps(html);
  const actions = parseUIActions(html);
  const features = parseCostTracker(html);

  // Detect server port
  let serverPort = 3002;
  const pkgPath = path.join(rootDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    for (const cmd of Object.values(pkg.scripts || {}) as string[]) {
      const portMatch = cmd.match(/--port\s+(\d+)/);
      if (portMatch && (cmd.includes("start") || cmd.includes("server"))) {
        serverPort = parseInt(portMatch[1]);
      }
    }
  }

  // Check if server is running
  let serverRunning = false;
  try {
    const http = require("http");
    await new Promise<void>((resolve, reject) => {
      http.get(`http://127.0.0.1:${serverPort}/`, (res: any) => {
        serverRunning = res.statusCode === 200;
        resolve();
      }).on("error", () => reject());
    });
  } catch {
    serverRunning = false;
  }

  return NextResponse.json({
    htmlPath: path.relative(rootDir, htmlPath),
    serverPort,
    serverRunning,
    uiUrl: serverRunning ? `http://localhost:${serverPort}` : null,
    steps,
    actions,
    features,
    htmlLength: html.length,
  });
}
