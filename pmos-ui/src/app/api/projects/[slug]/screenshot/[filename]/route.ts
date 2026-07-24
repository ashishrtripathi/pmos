import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PMOS_HOME = path.join(
  process.env.USERPROFILE || process.env.HOME || "",
  ".pmos"
);

export async function GET(
  request: Request,
  { params }: { params: { slug: string; filename: string } }
) {
  const screenshotPath = path.join(
    PMOS_HOME, "projects", params.slug, "journey", "screenshots", params.filename
  );

  if (!fs.existsSync(screenshotPath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = fs.readFileSync(screenshotPath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
