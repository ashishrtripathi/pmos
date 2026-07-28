import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const imageName = searchParams.get("name");

  if (!imageName) {
    return NextResponse.json({ error: "Missing image name parameter" }, { status: 400 });
  }

  // Sanitize path — prevent directory traversal
  const sanitized = path.basename(imageName.replace(/\.\./g, ""));
  const imagePath = path.join(
    process.env.HOME || process.env.USERPROFILE || "C:\\Users\\ashis",
    ".pmos",
    "projects",
    params.slug,
    "journey",
    "screens",
    sanitized
  );

  // Also try with .png extension if no extension provided
  let finalPath = imagePath;
  if (!path.extname(sanitized)) {
    for (const ext of [".png", ".jpg", ".jpeg", ".gif", ".webp"]) {
      const testPath = imagePath + ext;
      if (fs.existsSync(testPath)) {
        finalPath = testPath;
        break;
      }
    }
  }

  if (!fs.existsSync(finalPath)) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Determine content type
  const ext = path.extname(finalPath).toLowerCase();
  const contentType: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };

  const buffer = fs.readFileSync(finalPath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType[ext] || "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
