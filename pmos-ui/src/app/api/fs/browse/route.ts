import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

// GET: Browse local filesystem directories
export async function GET(request: Request) {
  const url = new URL(request.url);
  const dirPath = url.searchParams.get("path") || "";

  // Default to home directory
  const homeDir = os.homedir();
  const targetPath = dirPath || homeDir;

  try {
    // Resolve and normalize
    const resolved = path.resolve(targetPath);

    // List contents
    const entries = fs.readdirSync(resolved, { withFileTypes: true });

    // Filter to directories only, sort alphabetically
    const directories = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules")
      .map((e) => {
        const fullPath = path.join(resolved, e.name);
        let hasPackageJson = false;
        let hasGit = false;
        try {
          hasPackageJson = fs.existsSync(path.join(fullPath, "package.json"));
          hasGit = fs.existsSync(path.join(fullPath, ".git"));
        } catch {
          // Permission error — skip
        }
        return {
          name: e.name,
          path: fullPath,
          hasPackageJson,
          hasGit,
        };
      })
      .sort((a, b) => {
        // Git repos first, then package.json projects, then alphabetical
        if (a.hasGit !== b.hasGit) return a.hasGit ? -1 : 1;
        if (a.hasPackageJson !== b.hasPackageJson) return a.hasPackageJson ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    // Parent directory
    const parent = path.dirname(resolved);

    return NextResponse.json({
      currentPath: resolved,
      parentPath: parent !== resolved ? parent : null,
      directories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Cannot read directory", currentPath: targetPath, parentPath: null, directories: [] },
      { status: 400 }
    );
  }
}
