const path = require("path");
const os = require("os");
const fs = require("fs");

const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
const dbPath = path.join(appData, "AionUi", "aionui", "aionui-backend.db");

if (fs.existsSync(dbPath)) {
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(dbPath);

  function printSchema(tableName) {
    try {
      const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
      console.log(`\nSchema for ${tableName}:`, cols.map(c => `${c.name} (${c.type})`).join(", "));
    } catch (e) {
      console.error(`Error schema for ${tableName}`, e);
    }
  }

  printSchema("team_tasks");
  printSchema("mailbox");
  printSchema("conversations");
  printSchema("messages");
  printSchema("assistants");
  printSchema("cron_jobs");

  try {
    const assistants = db.prepare("SELECT id, name, description FROM assistants LIMIT 10").all();
    console.log("\nExisting Assistants in AionUi:", assistants);
  } catch (e) {
    console.log("Could not query assistants", e);
  }

  try {
    const convs = db.prepare("SELECT * FROM conversations ORDER BY updated_at DESC LIMIT 3").all();
    console.log("\nConversations:", convs);
  } catch (e) {
    console.log("Could not query convs", e);
  }
}
