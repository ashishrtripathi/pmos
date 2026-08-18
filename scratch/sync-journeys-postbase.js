const path = require("path");
const os = require("os");
const fs = require("fs");

async function syncJourneysToPostBase(slug) {
  const pmosDir = path.join(os.homedir(), ".pmos");
  const journeyDir = path.join(pmosDir, "projects", slug, "journey");
  const postbaseUrl = `http://localhost:8081/api/db/journeys/${slug}`;

  if (!fs.existsSync(journeyDir)) return;

  const files = fs.readdirSync(journeyDir).filter((f) => f.startsWith("persona-") && f.endsWith(".md"));
  const journeys = [];

  for (const file of files) {
    const filePath = path.join(journeyDir, file);
    const content = fs.readFileSync(filePath, "utf8");

    const nameMatch = content.match(/#\s*Customer Journey\s*[—–-]\s*(.+?)\s*\((.+?)\)/);
    const personaMatch = content.match(/\*\*Persona\*\*:\s*([^\r\n]+)/);
    const quoteMatch = content.match(/\*\*Quote\*\*:\s*["']?([^\r\n"']+)["']?/);
    const imageMatch = content.match(/\*\*Image\*\*:\s*([^\r\n]+)/);

    const personaName = nameMatch ? nameMatch[1].trim() : file.replace("persona-", "").replace(".md", "");
    const role = nameMatch ? nameMatch[2].trim() : "Product User";
    const quote = quoteMatch ? quoteMatch[1].trim() : "";
    const personaBlurb = personaMatch ? personaMatch[1].trim() : "";
    const avatarUrl = imageMatch ? imageMatch[1].trim() : "";
    const personaId = file.replace(".md", "").replace("persona-", "");

    // Steps
    const steps = [];
    const tableRegex = /\|\s*\*\*(\d+)\.\s*(.+?)\*\*\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|/g;
    let match;
    while ((match = tableRegex.exec(content)) !== null) {
      steps.push({
        stepNumber: parseInt(match[1]),
        name: match[2].trim(),
        activity: match[3].trim(),
        tasks: match[4].split(",").map((t) => t.trim()).filter(Boolean),
        painPoints: match[5].split(",").map((p) => p.trim()).filter(Boolean),
        screen: match[6].trim(),
        stories: [],
      });
    }

    journeys.push({
      personaId,
      personaName,
      role,
      quote,
      personaBlurb,
      avatarUrl,
      avatarId: `avatar-${personaId}`,
      demographics: { age: 32, location: "United States", job: role },
      steps,
      rawMarkdown: content,
    });
  }

  console.log(`[${slug}] Prepared ${journeys.length} journeys:`, journeys.map(j => `${j.personaName} (${j.avatarId})`));

  try {
    const res = await fetch(postbaseUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: journeys }),
    });
    console.log(`[${slug}] PostBase HTTP response:`, res.status);
  } catch (err) {
    console.warn(`[${slug}] PostBase sync error:`, err.message);
  }
}

async function run() {
  await syncJourneysToPostBase("pmos");
  await syncJourneysToPostBase("voxstyle");
}

run();
