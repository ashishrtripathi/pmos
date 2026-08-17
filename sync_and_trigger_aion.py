import os
import re
import json
import urllib.request
import sqlite3
import time

stories_dir = r"C:\Users\ashis\.pmos\projects\pmos\stories\in-progress"
stories = []

if os.path.exists(stories_dir):
    for fn in os.listdir(stories_dir):
        if not fn.endswith(".md"):
            continue
        filepath = os.path.join(stories_dir, fn)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        title_match = re.search(r'title:\s*"?([^"\n\r]+)"?', content)
        id_match = re.search(r"id:\s*([^\n\r]+)", content)
        agent_match = re.search(r"assigned-agent:\s*([^\n\r]+)", content)
        hours_match = re.search(r"estimated-hours:\s*([0-9.]+)", content)

        story_id = id_match.group(1).strip() if id_match else fn.replace(".md", "")
        title = title_match.group(1).strip() if title_match else story_id
        agent = agent_match.group(1).strip() if agent_match else "software-engineer"
        hours = float(hours_match.group(1)) if hours_match else 1.0

        stories.append({
            "id": story_id,
            "title": title,
            "status": "in-progress",
            "assignedAgent": agent,
            "estimatedHours": hours,
            "filePath": filepath,
            "agentWork": {
                "status": "queued",
                "assignedAgent": agent,
                "assignedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
        })

print(f"Parsed {len(stories)} stories from in-progress folder.")

# 1. Update PostBase database
try:
    payload = json.dumps({"items": stories}).encode("utf-8")
    req = urllib.request.Request(
        "http://localhost:8081/api/db/stories/pmos",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="PUT"
    )
    with urllib.request.urlopen(req) as resp:
        print("PostBase PUT status:", resp.status)
except Exception as e:
    print("PostBase update failed:", e)

# 2. Update AionUi Cron Job to enabled and trigger immediate run
db_path = r"C:\Users\ashis\AppData\Roaming\AionUi\aionui\aionui-backend.db"
if os.path.exists(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        now_ms = int(time.time() * 1000)
        cursor.execute(
            """
            UPDATE cron_jobs 
            SET enabled = 1, next_run_at = ?, schedule_value = '* * * * *', updated_at = ?
            WHERE id = 'cron_019fd7e3-35e6-7e12-882d-cd1e4e08b3b8';
            """,
            (now_ms, now_ms)
        )
        conn.commit()
        print("AionUi cron job enabled (1 min frequency) and scheduled for immediate execution!")
    except Exception as e:
        print("AionUi DB update error:", e)
