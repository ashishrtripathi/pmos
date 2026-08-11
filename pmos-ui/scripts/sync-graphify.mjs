// Register graphify project in PostBase (projects + source_location collections).
import { readFileSync } from "node:fs";
import { getDB } from "@postbase/client/db.js";

const BASE = "http://localhost:8081/api/db";
const db = getDB({ baseUrl: BASE });

const projectMd = readFileSync("C:/Users/ashis/.pmos/projects/graphify/project.md", "utf8");
const sourceLocation = JSON.parse(
  readFileSync("C:/Users/ashis/.pmos/projects/graphify/source-location.json", "utf8")
);
const registry = JSON.parse(
  readFileSync("C:/Users/ashis/.pmos/registry.json", "utf8")
);

await db.collection("registry").doc("main").set(registry);
console.log("synced registry/main (graphify added)");

await db.collection("projects").doc("graphify").set({ markdown: projectMd });
console.log("synced projects/graphify");

await db.collection("source_location").doc("graphify").set(sourceLocation);
console.log("synced source_location/graphify");

await db.collection("pipeline").doc("graphify").set({ state: {} });
console.log("synced pipeline/graphify (fresh)");
