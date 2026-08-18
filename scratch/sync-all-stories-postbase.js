const path = require("path");
const os = require("os");
const fs = require("fs");

async function syncAllToPostBase() {
  const pmosDir = path.join(os.homedir(), ".pmos");
  const projectDir = path.join(pmosDir, "projects", "pmos", "stories");
  const postbaseUrl = "http://localhost:8081/api/db/stories/pmos";

  const allStories = [];

  const subdirs = ["backlog", "in-progress", "review", "done", "log"];
  for (const dir of subdirs) {
    const fullDir = path.join(projectDir, dir);
    if (!fs.existsSync(fullDir)) continue;
    const files = fs.readdirSync(fullDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const filePath = path.join(fullDir, file);
      const raw = fs.readFileSync(filePath, "utf8");

      const idMatch = raw.match(/id:\s*([^\r\n]+)/);
      const titleMatch = raw.match(/title:\s*["']?([^\r\n"']+)["']?/);
      const pointsMatch = raw.match(/points:\s*([^\r\n]+)/);
      const agentMatch = raw.match(/assigned-agent:\s*([^\r\n]+)/);
      const valueMatch = raw.match(/estimated-value:\s*([^\r\n]+)/);
      const catMatch = raw.match(/category:\s*([^\r\n]+)/);
      const priorityMatch = raw.match(/priority:\s*([^\r\n]+)/);
      const effortMatch = raw.match(/effort:\s*([^\r\n]+)/);
      const personaMatch = raw.match(/persona:\s*["']?([^\r\n"']+)["']?/);
      const roleMatch = raw.match(/persona-role:\s*["']?([^\r\n"']+)["']?/);

      // Extract Use Case from markdown body
      const asAMatch = raw.match(/- \*\*As a\*\*\s*([^\r\n]+)/i);
      const iWantMatch = raw.match(/- \*\*I want(?: to)?\*\*\s*([^\r\n]+)/i);
      const soThatMatch = raw.match(/- \*\*so that\*\*\s*([^\r\n]+)/i);

      const title = titleMatch ? titleMatch[1].trim() : file.replace(".md", "");
      const useCase = {
        asA: (asAMatch?.[1] || roleMatch?.[1] || personaMatch?.[1] || "Product Manager").trim(),
        iWant: (iWantMatch?.[1] || title).trim(),
        soThat: (soThatMatch?.[1] || "I can achieve business value").trim(),
      };

      const points = pointsMatch ? Number(pointsMatch[1]) : 3;
      const hours = Math.max(1, Math.round(points * 0.35));
      const tokens = points * 6000;

      allStories.push({
        id: idMatch ? idMatch[1].trim() : file,
        title,
        points,
        estimatedHours: hours,
        estimatedTokens: tokens,
        status: dir === "in-progress" ? "in-progress" : dir,
        assignedAgent: agentMatch ? agentMatch[1].trim() : "software-engineer",
        estimatedValue: valueMatch ? Number(valueMatch[1]) : 10000,
        category: catMatch ? catMatch[1].trim() : "General",
        priority: priorityMatch ? priorityMatch[1].trim() : "medium",
        effort: effortMatch ? effortMatch[1].trim() : "M",
        source: "intelligence",
        persona: personaMatch ? personaMatch[1].trim() : undefined,
        personaRole: roleMatch ? roleMatch[1].trim() : undefined,
        useCase,
        filePath,
      });
    }
  }

  console.log(`Prepared ${allStories.length} stories to sync to PostBase`);
  for (const s of allStories) {
    console.log(`- ${s.id}: ${s.title} | I want: ${s.useCase.iWant}`);
  }

  try {
    const putRes = await fetch(postbaseUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: allStories }),
    });
    console.log("PostBase sync HTTP status:", putRes.status);
  } catch (err) {
    console.warn("PostBase sync notice (PostBase may be offline):", err.message);
  }
}

syncAllToPostBase();
