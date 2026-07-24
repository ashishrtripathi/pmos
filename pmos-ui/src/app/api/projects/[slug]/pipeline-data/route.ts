import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSourceLocation } from "@/lib/pmos";

// Read scenes from Root.tsx by parsing the scene objects
function extractScenesFromRoot(rootDir: string): any[] {
  const rootPath = path.join(rootDir, "src", "Root.tsx");
  if (!fs.existsSync(rootPath)) return [];

  const content = fs.readFileSync(rootPath, "utf-8");

  // Match scene objects in the Root.tsx — handles both JS object and JSON-like syntax
  const scenes: any[] = [];
  // Try to find each scene block
  const sceneBlockRegex = /\{\s*sceneNumber:\s*(\d+)[^}]*voiceoverLine:\s*["'`](.*?)["'`][^}]*midgroundPrompt:\s*["'`](.*?)["'`][^}]*foregroundPrompt:\s*["'`](.*?)["'`][^}]*sceneType:\s*["'`](.*?)["'`]/gs;

  let match;
  while ((match = sceneBlockRegex.exec(content)) !== null) {
    scenes.push({
      sceneNumber: parseInt(match[1]),
      voiceoverLine: match[2],
      midgroundPrompt: match[3],
      foregroundPrompt: match[4],
      sceneType: match[5],
    });
  }

  return scenes;
}

// List assets in a directory
function listAssets(dir: string, ext: string): { name: string; size: number }[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .map((f) => ({ name: f, size: fs.statSync(path.join(dir, f)).size }));
}

// Detect UI entry point — looks for index.html, or reads dev server port from package.json
function detectUI(rootDir: string) {
  const packageJsonPath = path.join(rootDir, "package.json");
  const indexPath = path.join(rootDir, "public", "index.html");
  const hasIndex = fs.existsSync(indexPath);

  let devPort: number | null = null;
  let serverPort: number | null = null;

  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const scripts = pkg.scripts || {};

    // Look for port numbers in scripts
    for (const cmd of Object.values(scripts) as string[]) {
      const portMatch = cmd.match(/--port\s+(\d+)/);
      if (portMatch) {
        const port = parseInt(portMatch[1]);
        if (cmd.includes("studio") || cmd.includes("dev")) devPort = port;
        if (cmd.includes("start") || cmd.includes("server")) serverPort = port;
      }
    }
  }

  return {
    hasIndexHtml: hasIndex,
    indexUrl: hasIndex ? `http://localhost:${serverPort || 3002}` : null,
    devUrl: devPort ? `http://localhost:${devPort}` : null,
    serverPort: serverPort || (hasIndex ? 3002 : null),
    devPort,
  };
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const source = getSourceLocation(params.slug);
  if (!source) {
    return NextResponse.json({ error: "No source location configured" }, { status: 404 });
  }

  const rootDir = source.localPath;
  if (!rootDir || !fs.existsSync(rootDir)) {
    return NextResponse.json({ error: "Source directory not found", path: rootDir }, { status: 404 });
  }

  // Detect UI
  const ui = detectUI(rootDir);

  // Extract scenes
  const scenes = extractScenesFromRoot(rootDir);

  // List assets
  const processedDir = path.join(rootDir, "public", "assets", "processed");
  const rawDir = path.join(rootDir, "public", "assets", "raw");
  const audioDir = path.join(rootDir, "public", "audio");
  const outDir = path.join(rootDir, "out");

  const processedAssets = listAssets(processedDir, ".png");
  const audioFiles = listAssets(audioDir, ".mp3");
  const videoFiles = fs.existsSync(outDir)
    ? fs.readdirSync(outDir).filter((f) => f.endsWith(".mp4")).map((f) => ({
        name: f,
        size: fs.statSync(path.join(outDir, f)).size,
      }))
    : [];

  // Detect static file URLs (relative to the server that serves public/)
  const baseUrl = ui.indexUrl || `http://localhost:${ui.serverPort || 3002}`;

  return NextResponse.json({
    sourcePath: rootDir,
    ui,
    scenes,
    processedAssets: {
      total: processedAssets.length,
      byType: {
        raw: processedAssets.filter((a) => a.name.includes("_raw")).length,
        nobg: processedAssets.filter((a) => a.name.includes("_nobg")).length,
        halftone: processedAssets.filter((a) => a.name.includes("_halftone")).length,
      },
      items: processedAssets.map((a) => {
        const match = a.name.match(/scene(\d+)_(raw|nobg|halftone)/);
        return {
          ...a,
          type: match?.[2] || "unknown",
          scene: parseInt(match?.[1] || "0"),
          url: `${baseUrl}/assets/processed/${a.name}`,
        };
      }),
    },
    audioFiles: {
      total: audioFiles.length,
      items: audioFiles.map((a) => {
        const match = a.name.match(/scene_(\d+)/);
        return {
          ...a,
          scene: parseInt(match?.[1] || "0"),
          url: `${baseUrl}/audio/${a.name}`,
        };
      }),
    },
    video: {
      exists: videoFiles.length > 0,
      size: videoFiles[0]?.size || 0,
      url: videoFiles.length > 0 ? `${baseUrl}/video/${videoFiles[0].name}` : null,
    },
  });
}
