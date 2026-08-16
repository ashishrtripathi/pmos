import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import type { Story } from "@/types/pmos";

export interface AionDispatchResult {
  success: boolean;
  dispatchedTo: "aionui-db" | "aionui-queue" | "filesystem";
  conversationId?: string;
  assistantId?: string;
  assistantName?: string;
  taskId?: string;
  command: string;
  agentId: string;
  notes?: string;
}

export const PMOS_ASSISTANTS: Record<string, { id: string; name: string }> = {
  "software-engineer": { id: "custom-1786033360254-e2b5", name: "PMOS Software Engineer" },
  "ux-designer": { id: "custom-1786033361044-3b45", name: "PMOS UX Designer" },
  "qa-engineer": { id: "custom-1786033360483-699d", name: "PMOS QA Engineer" },
  "debugger": { id: "custom-1786033360661-25b1", name: "PMOS Debugger" },
  "code-reviewer": { id: "custom-1786033360849-db95", name: "PMOS Code Reviewer" },
  "devops": { id: "custom-1786033361272-b8c9", name: "PMOS DevOps Engineer" },
  "release-engineer": { id: "custom-1786033361513-5dcd", name: "PMOS Release Engineer" },
  "security": { id: "custom-1786033361702-6ce9", name: "PMOS Security Officer" },
  "tech-writer": { id: "custom-1786033361944-b819", name: "PMOS Tech Writer" },
};

export function getAionUiDbPath(): string | null {
  const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  const dbPath = path.join(appData, "AionUi", "aionui", "aionui-backend.db");
  return fs.existsSync(dbPath) ? dbPath : null;
}

/**
 * Automatically dispatches a PMOS story directly into the assigned AionUi agent.
 * Writes directly to AionUi SQLite database (team_tasks, mailbox, messages) and agent profile files.
 */
export async function dispatchStoryToAionUi(
  slug: string,
  story: Story,
  sourcePath?: string
): Promise<AionDispatchResult> {
  const command = `PMOS: implement story ${story.id} for ${slug}`;
  let agentKey = story.assignedAgent || "software-engineer";
  if (!agentKey || agentKey === "unassigned") {
    if (story.category === "UX/Product" || story.persona) agentKey = "ux-designer";
    else if (story.category === "Technical" || story.category === "Code Analysis") agentKey = "software-engineer";
    else if (story.category === "Critical Issue" || story.category === "High Priority Issue") agentKey = "qa-engineer";
    else agentKey = "software-engineer";
  }

  const assistantInfo = PMOS_ASSISTANTS[agentKey] || PMOS_ASSISTANTS["software-engineer"];
  const now = Date.now();
  const taskId = `pmos-${slug}-${story.id}-${now}`;
  const msgId = crypto.randomBytes(4).toString("hex");

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
Assigned Persona: ${assistantInfo.name} (${agentKey})
Target Persona: ${story.persona || "User"}
Estimated Labor: ${story.estimatedHours || (story.points ? story.points * 0.35 : 1)}h

Acceptance Criteria:
${criteriaText}`;

  // 1. Update local agent markdown profile in ~/.pmos/projects/{slug}/agents/{agentKey}.md
  const pmosDir = path.join(os.homedir(), ".pmos");
  const agentMdPath = path.join(pmosDir, "projects", slug, "agents", `${agentKey}.md`);
  try {
    if (fs.existsSync(agentMdPath)) {
      let raw = fs.readFileSync(agentMdPath, "utf8");
      if (!raw.includes(story.id)) {
        raw = raw.replace(/activeStories:\s*\[([^\]]*)\]/, (match, p1) => {
          const existing = p1.split(",").map((s: string) => s.trim().replace(/['"]/g, "")).filter(Boolean);
          if (!existing.includes(story.id)) existing.push(story.id);
          return `activeStories: [${existing.map((s: string) => `"${s}"`).join(", ")}]`;
        });
        fs.writeFileSync(agentMdPath, raw, "utf8");
      }
    }
  } catch (err) {
    console.warn("Failed to update agent markdown profile", err);
  }

  // 2. Write to PMOS shared filesystem queue
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
      agentId: agentKey,
      assistantId: assistantInfo.id,
      assistantName: assistantInfo.name,
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

  // 3. Write directly to AionUi SQLite Database (team_tasks, mailbox, messages)
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
        assistantInfo.name,
        "[]",
        "[]",
        JSON.stringify({ slug, storyId: story.id, category: story.category, assistantId: assistantInfo.id }),
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
        assistantInfo.id,
        "pmos-orchestrator",
        "task_assignment",
        promptContent,
        `Implement ${story.id}: ${story.title}`,
        JSON.stringify([story.filePath || ""]),
        0,
        now
      );

      // Find the active conversation in AionUi
      const convRow = db.prepare("SELECT id FROM conversations ORDER BY updated_at DESC LIMIT 1").get() as { id: string } | undefined;
      const activeConvId = convRow?.id;

      if (activeConvId) {
        // Insert message directly into the active AionUi conversation
        try {
          const msgStmt = db.prepare(`
            INSERT INTO messages (id, conversation_id, msg_id, type, content, status, hidden, created_at)
            VALUES (?, ?, ?, 'text', ?, 'finish', 0, ?)
          `);
          msgStmt.run(
            msgId,
            activeConvId,
            msgId,
            JSON.stringify({
              content: `[PMOS Auto-Dispatch] Assigned ${story.id} ("${story.title}") to ${assistantInfo.name}.\n\nAcceptance Criteria:\n${criteriaText}`,
            }),
            now
          );
        } catch (msgErr) {
          console.warn("Could not insert message into conversation", msgErr);
        }
      }

      return {
        success: true,
        dispatchedTo: "aionui-db",
        conversationId: activeConvId,
        assistantId: assistantInfo.id,
        assistantName: assistantInfo.name,
        taskId,
        command,
        agentId: agentKey,
        notes: `Dispatched to ${assistantInfo.name} in AionUi`,
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
    agentId: agentKey,
    assistantName: assistantInfo.name,
    notes: `Queued in PMOS agent registry for ${assistantInfo.name}`,
  };
}
