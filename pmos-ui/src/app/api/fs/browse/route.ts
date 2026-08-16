import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let requestedPath = searchParams.get("path") || "";

  // If empty, default to user's home directory or workspace
  if (!requestedPath.trim()) {
    requestedPath = process.env.USERPROFILE || process.env.HOME || process.cwd();
  }

  try {
    const resolvedPath = path.resolve(requestedPath);

    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({
        currentPath: resolvedPath,
        parentPath: path.dirname(resolvedPath) !== resolvedPath ? path.dirname(resolvedPath) : null,
        directories: [],
        error: `Path does not exist: ${resolvedPath}`,
      });
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      return NextResponse.json({
        currentPath: resolvedPath,
        parentPath: path.dirname(resolvedPath),
        directories: [],
        error: `Path is not a directory: ${resolvedPath}`,
      });
    }

    const entries = fs.readdirSync(resolvedPath, { withFileTypes: true });
    const directories = [];

    for (const entry of entries) {
      // Skip hidden/system directories
      if (entry.name.startsWith(".") && entry.name !== ".git") continue;
      if (entry.name === "node_modules" || entry.name === "$RECYCLE.BIN") continue;

      if (entry.isDirectory()) {
        const fullSubPath = path.join(resolvedPath, entry.name);
        let hasPackageJson = false;
        let hasGit = false;

        try {
          hasPackageJson = fs.existsSync(path.join(fullSubPath, "package.json"));
          hasGit = fs.existsSync(path.join(fullSubPath, ".git"));
        } catch {
          // ignore permission errors
        }

        directories.push({
          name: entry.name,
          path: fullSubPath,
          hasPackageJson,
          hasGit,
        });
      }
    }

    // Sort alphabetically
    directories.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    const parent = path.dirname(resolvedPath);
    const parentPath = parent !== resolvedPath ? parent : null;

    return NextResponse.json({
      currentPath: resolvedPath,
      parentPath,
      directories,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        currentPath: requestedPath,
        parentPath: null,
        directories: [],
        error: err.message || "Failed to read directory",
      },
      { status: 500 }
    );
  }
}
