import fs from "fs";
import path from "path";
import os from "os";
import type { Story } from "@/types/pmos";

export interface AionDispatchResult {
  success: boolean;
  dispatchedTo: "aionui-db" | "aionui-queue" | "filesystem";
  conversationId?: string;
  taskId?: string;
  command: string;
  agentId: string;
  notes?: string;
}

export function getAionUiDbPath(): string | null {
  const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  const dbPath = path.join(appData, "AionUi", "aionui", "aionui-backend.db");
  return fs.existsSync(dbPath) ? dbPath : null;
}

/**
 * Automatically dispatches a PMOS story directly into AionUi.
 * Writes to AionUi SQLite database (team_tasks, mailbox) and PMOS shared queue.
 */
export async function dispatchStoryToAionUi(
  slug: string,
  story: Story,
  sourcePath?: string
): Promise<AionDispatchResult> {
  const command = `PMOS: implement story ${story.id} for ${slug}`;
  let agentId = story.assignedAgent;
  if (!agentId) {
    if (story.category === "UX/Product" || story.persona) agentId = "ux-designer";
    else if (story.category === "Technical" || story.category === "Code Analysis") agentId = "software-engineer";
    else if (story.category === "Critical Issue" || story.category === "High Priority Issue") agentId = "qa-engineer";
    else agentId = "software-engineer";
  }

  const now = Date.now();
  const taskId = `pmos-${slug}-${story.id}-${now}`;

  const criteriaText = Array.isArray(story.acceptanceCriteria) && story.acceptanceCriteria.length > 0
    ? story.acceptanceCriteria.map((ac) => {
        if (typeof ac === "string") return `- ${ac}`;
        return `- Scenario: ${ac.scenario || "Default"}\n  Given: ${Array.isArray(ac.given) ? ac.given.join(", ") : ac.given || "clean state"}\n  When: ${ac.when || "executed"}\n  Then: ${ac.then || "succeeds"}`;
      }).join("\n")
    : story.description || story.title;

  const promptContent = `PMOS: implement story ${story.id} for ${slug}

Target Project: ${slug}
Codebase Location: ${sourcePath || path.join(os.homedir(), ".pmos", "projects", slug)}
Story ID: ${story.id}
Title: ${story.title}
Assigned Persona: ${agentId}
Target Persona: ${story.persona || "User"}
Estimated Labor: ${story.estimatedHours || (story.points ? story.points * 0.35 : 1)}h

Acceptance Criteria:
${criteriaText}`;

  // 1. Write to PMOS shared filesystem queue
  const pmosDir = path.join(os.homedir(), ".pmos");
  const queueFile = path.join(pmosDir, "agent-dispatch-queue.json");
  const projectQueueFile = path.join(pmosDir, "projects", slug, "agent-dispatch-queue.json");

  try {
    let existing: any[] = [];
    if (fs.existsSync(queueFile)) {
      try {
        existing = JSON.parse(fs.readFileSync(queueFile, "utf8"));
      } catch {}
    }
    const entry = {
      taskId,
      slug,
      storyId: story.id,
      title: story.title,
      agentId,
      command,
      prompt: promptContent,
      dispatchedAt: new Date().toISOString(),
      status: "in-progress",
    };
    const updated = [entry, ...existing.filter((e) => e.storyId !== story.id)];
    fs.mkdirSync(path.dirname(queueFile), { recursive: true });
    fs.writeFileSync(queueFile, JSON.stringify(updated, null, 2), "utf8");
    fs.mkdirSync(path.dirname(projectQueueFile), { recursive: true });
    fs.writeFileSync(projectQueueFile, JSON.stringify(updated.filter((e) => e.slug === slug), null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write filesystem queue", err);
  }

  // 2. Write directly to AionUi SQLite Database (team_tasks & mailbox)
  const dbPath = getAionUiDbPath();
  if (dbPath) {
    try {
      const { DatabaseSync } = require("node:sqlite");
      const db = new DatabaseSync(dbPath);

      // Insert into team_tasks table in AionUi
      const taskStmt = db.prepare(`
        INSERT OR REPLACE INTO team_tasks (id, team_id, subject, description, status, owner, blocked_by, blocks, metadata, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      taskStmt.run(
        taskId,
        "pmos",
        `PMOS [${story.id}]: ${story.title}`,
        promptContent,
        "in-progress",
        agentId,
        "[]",
        "[]",
        JSON.stringify({ slug, storyId: story.id, category: story.category }),
        now,
        now
      );

      // Insert into mailbox table in AionUi
      const mailboxStmt = db.prepare(`
        INSERT OR REPLACE INTO mailbox (id, team_id, to_agent_id, from_agent_id, type, content, summary, files, read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      mailboxStmt.run(
        `msg-${now}`,
        "pmos",
        agentId,
        "pmos-ui",
        "task_assignment",
        promptContent,
        `Implement ${story.id}: ${story.title}`,
        JSON.stringify([story.filePath || ""]),
        0,
        now
      );

      // Find most recent active conversation in AionUi
      const convRow = db.prepare("SELECT id FROM conversations ORDER BY updated_at DESC LIMIT 1").get() as { id: string } | undefined;
      const activeConvId = convRow?.id;

      return {
        success: true,
        dispatchedTo: "aionui-db",
        conversationId: activeConvId,
        taskId,
        command,
        agentId,
        notes: `Automatically routed to AionUi (${agentId}) in task queue & mailbox`,
      };
    } catch (err) {
      console.warn("Direct SQLite insert to AionUi failed, fallback to queue", err);
    }
  }

  return {
    success: true,
    dispatchedTo: "aionui-queue",
    taskId,
    command,
    agentId,
    notes: `Queued in PMOS agent registry for AionUi`,
  };
}
