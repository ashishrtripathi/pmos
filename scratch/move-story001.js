const path = require("path");
const os = require("os");
const fs = require("fs");

async function moveStory001ToReview() {
  const pmosDir = path.join(os.homedir(), ".pmos");
  const postbaseUrl = "http://localhost:8081/api/db/stories/pmos";

  // 1. Update PostBase
  try {
    const res = await fetch(postbaseUrl);
    const raw = await res.json();
    const items = raw?.data?.items || raw?.items || [];
    for (const s of items) {
      if (s.id === "STORY-001") {
        s.status = "review";
        if (!s.agentWork) s.agentWork = {};
        s.agentWork.status = "done";
        s.agentWork.completedAt = new Date().toISOString();
        s.agentWork.notes = "Implemented dark mode toggle in sidebar with theme persistence and Tailwind dark variables. Ready for PM Review.";
      }
    }
    const putRes = await fetch(postbaseUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    console.log("PostBase PUT status:", putRes.status);
  } catch (err) {
    console.warn("PostBase update notice:", err.message);
  }

  // 2. Mirror on disk
  const src = path.join(pmosDir, "projects", "pmos", "stories", "in-progress", "STORY-001-add-dark-mode-support.md");
  const destDir = path.join(pmosDir, "projects", "pmos", "stories", "review");
  const dest = path.join(destDir, "STORY-001-add-dark-mode-support.md");
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  if (fs.existsSync(src)) {
    let content = fs.readFileSync(src, "utf8");
    content = content.replace(/status:\s*in-progress/, "status: review");
    fs.writeFileSync(dest, content, "utf8");
    fs.unlinkSync(src);
    console.log("Mirrored STORY-001 to stories/review/");
  }
}

moveStory001ToReview().then(() => console.log("Done moving STORY-001 to review!"));
