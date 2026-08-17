const path = require("path");
const os = require("os");
const fs = require("fs");

async function moveStoriesToReview() {
  const pmosDir = path.join(os.homedir(), ".pmos");
  const postbaseUrl = "http://localhost:8081/api/db/stories/pmos";

  const storyIds = ["INT-100", "INT-102", "INT-103"];
  console.log("Moving stories to Review:", storyIds);

  // 1. Update PostBase if running, or read/write local files
  try {
    const res = await fetch(postbaseUrl);
    if (res.ok) {
      const stories = await res.json();
      for (const s of stories) {
        if (storyIds.includes(s.id)) {
          s.status = "review";
          if (!s.agentWork) s.agentWork = {};
          s.agentWork.status = "done";
          s.agentWork.completedAt = new Date().toISOString();
          s.agentWork.notes = `Implemented & verified by PMOS agent. Ready for Product Manager Review.`;
          console.log(`Updated ${s.id} to review in PostBase`);
        }
      }
      await fetch(postbaseUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stories),
      });
      console.log("Saved updated stories to PostBase");
    }
  } catch (err) {
    console.warn("PostBase update notice:", err.message);
  }

  // 2. Mirror files on disk from in-progress/ to review/
  const inProgressDir = path.join(pmosDir, "projects", "pmos", "stories", "in-progress");
  const reviewDir = path.join(pmosDir, "projects", "pmos", "stories", "review");
  if (!fs.existsSync(reviewDir)) {
    fs.mkdirSync(reviewDir, { recursive: true });
  }

  if (fs.existsSync(inProgressDir)) {
    const files = fs.readdirSync(inProgressDir);
    for (const file of files) {
      for (const id of storyIds) {
        if (file.includes(id)) {
          const src = path.join(inProgressDir, file);
          const dest = path.join(reviewDir, file);
          let content = fs.readFileSync(src, "utf8");
          content = content.replace(/status:\s*in-progress/, "status: review");
          fs.writeFileSync(dest, content, "utf8");
          fs.unlinkSync(src);
          console.log(`Mirrored ${file} to stories/review/`);
        }
      }
    }
  }
}

moveStoriesToReview().then(() => console.log("Done moving stories to review!"));
