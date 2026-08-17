const path = require("path");
const os = require("os");
const fs = require("fs");

const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
const dbPath = path.join(appData, "AionUi", "aionui", "aionui-backend.db");

if (fs.existsSync(dbPath)) {
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(dbPath);

  const msgs = db.prepare("SELECT id, conversation_id, type, status, created_at, substr(content, 1, 150) as snippet FROM messages ORDER BY created_at DESC LIMIT 6").all();
  console.log("Latest Messages in AionUi DB:\n", msgs);
}
