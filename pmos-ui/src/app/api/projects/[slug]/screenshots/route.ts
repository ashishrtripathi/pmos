import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSourceLocation } from "@/lib/pmos";

const PMOS_HOME = path.join(
  process.env.USERPROFILE || process.env.HOME || "",
  ".pmos"
);

const SCREENSHOTS_DIR = (slug: string) =>
  path.join(PMOS_HOME, "projects", slug, "journey", "screenshots");

// Detect UI entry points from a project
function detectUI(rootDir: string) {
  const indexPath = path.join(rootDir, "public", "index.html");
  const hasIndex = fs.existsSync(indexPath);

  let serverPort = 3002;
  const packageJsonPath = path.join(rootDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const scripts = pkg.scripts || {};
    for (const cmd of Object.values(scripts) as string[]) {
      const portMatch = cmd.match(/--port\s+(\d+)/);
      if (portMatch && (cmd.includes("start") || cmd.includes("server"))) {
        serverPort = parseInt(portMatch[1]);
      }
    }
  }

  return { hasIndex, serverPort, uiUrl: hasIndex ? `http://localhost:${serverPort}` : null };
}

// Parse the HTML to find step/section structure
function detectUISteps(html: string): { stepNumber: number; id: string; title: string }[] {
  const steps: { stepNumber: number; id: string; title: string }[] = [];

  // Look for step indicators: <div class="step" id="step-N">Title</div>
  const stepRegex = /id="step-(\d+)"[^>]*>([^<]+)</g;
  let match;
  while ((match = stepRegex.exec(html)) !== null) {
    steps.push({
      stepNumber: parseInt(match[1]),
      id: `step-${match[1]}`,
      title: match[2].trim(),
    });
  }

  return steps;
}

// Detect card/section structure from HTML
function detectSections(html: string): { id: string; title: string }[] {
  const sections: { id: string; title: string }[] = [];
  const cardRegex = /id="([^"]*-card)"[^>]*>[\s\S]*?<h2>([^<]+)<\/h2>/g;
  let match;
  while ((match = cardRegex.exec(html)) !== null) {
    sections.push({ id: match[1], title: match[2].trim() });
  }
  return sections;
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
  const ui = detectUI(rootDir);

  // Read the actual HTML
  const indexPath = path.join(rootDir, "public", "index.html");
  const html = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf-8") : "";

  // Detect steps and sections from the actual HTML
  const steps = detectUISteps(html);
  const sections = detectSections(html);

  // Check for existing screenshots
  const screenshotDir = SCREENSHOTS_DIR(params.slug);
  const existingScreenshots = fs.existsSync(screenshotDir)
    ? fs.readdirSync(screenshotDir).filter((f) => f.endsWith(".png"))
    : [];

  return NextResponse.json({
    ui,
    steps,
    sections,
    existingScreenshots,
    screenshotDir: screenshotDir,
  });
}

// POST: trigger screenshot capture using Playwright
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const source = getSourceLocation(params.slug);
  if (!source?.localPath) {
    return NextResponse.json({ error: "No source location" }, { status: 404 });
  }

  const rootDir = source.localPath;
  const ui = detectUI(rootDir);
  if (!ui.uiUrl) {
    return NextResponse.json({ error: "No UI detected in project" }, { status: 400 });
  }

  // Ensure screenshot dir exists
  const screenshotDir = SCREENSHOTS_DIR(params.slug);
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // Read HTML to detect steps
  const indexPath = path.join(rootDir, "public", "index.html");
  const html = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf-8") : "";
  const steps = detectUISteps(html);
  const sections = detectSections(html);

  // Build the Playwright capture script
  const scriptContent = `
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');

const SCREENSHOT_DIR = ${JSON.stringify(screenshotDir)};
const UI_URL = ${JSON.stringify(ui.uiUrl)};
const API_PORT = ${ui.serverPort};

function waitForPort(port, ms = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http.get('http://127.0.0.1:' + port + '/', (res) => resolve(true))
        .on('error', () => Date.now() - start > ms ? reject(new Error('timeout')) : setTimeout(check, 1000));
    };
    check();
  });
}

async function main() {
  // Check if server is running
  let running = false;
  try { await new Promise((r, j) => http.get('http://127.0.0.1:' + API_PORT + '/', r).on('error', j)); running = true; } catch {}
  
  if (!running) {
    console.log('Server not running on port ' + API_PORT);
    console.log('Start it first: cd ' + ${JSON.stringify(rootDir)} + ' && npx tsx server/index.ts');
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });

  const steps = ${JSON.stringify(steps)};
  const sections = ${JSON.stringify(sections)};

  // Step 1: Capture the initial UI state (all cards visible, step 1 active)
  console.log('Capturing initial state...');
  const page = await context.newPage();
  await page.goto(UI_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: require('path').join(SCREENSHOT_DIR, '01-initial.png') });
  console.log('  ✓ 01-initial.png');

  // Step 2: Fill in subject and show the form
  console.log('Capturing configured state...');
  await page.fill('#subject', 'The History of Artificial Intelligence');
  await page.waitForTimeout(500);
  await page.screenshot({ path: require('path').join(SCREENSHOT_DIR, '02-subject-entered.png') });
  console.log('  ✓ 02-subject-entered.png');

  // Step 3: If there are sections/cards, capture each visible one
  for (const section of sections) {
    const card = await page.$('#' + section.id);
    if (card) {
      const visible = await card.isVisible();
      if (visible) {
        console.log('Capturing section: ' + section.title);
        await card.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        const safeFilename = section.id.replace(/[^a-z0-9-]/g, '_');
        await page.screenshot({ path: require('path').join(SCREENSHOT_DIR, safeFilename + '.png') });
        console.log('  ✓ ' + safeFilename + '.png');
      }
    }
  }

  await browser.close();
  console.log('\\nDone! Screenshots saved to: ' + SCREENSHOT_DIR);
  const files = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png'));
  console.log('Captured ' + files.length + ' screenshots');
}

main().catch(e => { console.error(e.message); process.exit(1); });
`;

  const scriptPath = path.join(screenshotDir, "_capture.js");
  fs.writeFileSync(scriptPath, scriptContent, "utf-8");

  return NextResponse.json({
    ok: true,
    message: "Capture script generated",
    scriptPath,
    instructions: `Run: node "${scriptPath}"`,
    steps: steps.map((s) => s.title),
    uiUrl: ui.uiUrl,
    serverPort: ui.serverPort,
  });
}
