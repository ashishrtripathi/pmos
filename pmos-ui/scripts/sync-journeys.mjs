// Sync persona journey markdown files into PostBase persona_journeys docs.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDB } from "@postbase/client/db.js";

const BASE = "http://localhost:8081/api/db";
const SLUG = "pmos";
const JOURNEY_DIR = "C:/Users/ashis/.pmos/projects/pmos/journey";
const db = getDB({ baseUrl: BASE });

const personas = ["dev", "agent", "priya"];
let ok = 0;
for (const id of personas) {
  const p = join(JOURNEY_DIR, `persona-${id}.md`);
  const md = readFileSync(p, "utf8");
  await db.collection("persona_journeys").doc(`${SLUG}::${id}`).set({ markdown: md });
  console.log(`synced pmos::${id} (${md.length} chars)`);
  ok++;
}
console.log(`done: ${ok}/${personas.length} docs synced`);
