import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { assignToCodingAgent } from "@/lib/pmos";

const PMOS_HOME = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  ".pmos"
);

const VALID_STATUSES = ["backlog", "in-progress", "review", "done"];

export async function PUT(
  request: Request,
  { params }: { params: { slug: string; storyId: string } }
) {
  const { slug, storyId } = params;
  const body = await request.json();
  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const projectDir = path.join(PMOS_HOME, "projects", slug);

  // Find the story file in any of the status directories
  let foundFile: string | null = null;
  let currentStatus: string = "backlog";

  for (const s of VALID_STATUSES) {
    const dir = path.join(projectDir, "stories", s);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("."));
    const match = files.find((f) => f.startsWith(storyId));
    if (match) {
      foundFile = path.join(dir, match);
      currentStatus = s;
      break;
    }
  }

  if (!foundFile) {
    // Story not found as a file - it might be from intelligence (not persisted)
    return NextResponse.json(
      { message: "Story status updated in memory (not persisted as file)" },
      { status: 200 }
    );
  }

  if (currentStatus === status) {
    // No change needed
    return NextResponse.json({ message: "Status unchanged" });
  }

  // Read the file content
  let content = fs.readFileSync(foundFile, "utf-8");

  // Update the status in frontmatter
  content = content.replace(
    /^status:\s*.+/m,
    `status: ${status}`
  );

  // When a story moves to Doing (in-progress), the coding agent picks it up
  let pickedUpBy: string | null = null;
  if (status === "in-progress") {
    // Ensure the story is assigned to the Software Engineer agent (inside frontmatter)
    const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const fm = fmMatch[1];
      let newFm: string;
      if (/^assigned-agent:\s*.+/m.test(fm)) {
        newFm = fm.replace(/^assigned-agent:\s*.+/m, `assigned-agent: software-engineer`);
      } else if (/^assignedAgent:\s*.+/m.test(fm)) {
        newFm = fm.replace(/^assignedAgent:\s*.+/m, `assignedAgent: software-engineer`);
      } else {
        newFm = fm.replace(/\n*$/, "") + `\nassigned-agent: software-engineer`;
      }
      content = content.replace(fmMatch[0], `---\n${newFm}\n---`);
    }
    pickedUpBy = assignToCodingAgent(slug, storyId);
  }

  // Write to new location
  const newDir = path.join(projectDir, "stories", status);
  if (!fs.existsSync(newDir)) {
    fs.mkdirSync(newDir, { recursive: true });
  }

  const fileName = path.basename(foundFile);
  const newPath = path.join(newDir, fileName);

  fs.writeFileSync(newPath, content, "utf-8");

  // Remove old file
  fs.unlinkSync(foundFile);

  return NextResponse.json({
    message: `Story moved from ${currentStatus} to ${status}`,
    storyId,
    oldStatus: currentStatus,
    newStatus: status,
    pickedUpBy,
  });
}
