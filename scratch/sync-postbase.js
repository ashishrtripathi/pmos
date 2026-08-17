const postbaseUrl = "http://localhost:8081/api/db/stories/pmos";

async function syncPostBase() {
  try {
    const res = await fetch(postbaseUrl);
    const raw = await res.json();
    console.log("Raw PostBase:", raw);
    const items = raw?.data?.items || raw?.items || [];
    const storyIds = ["INT-100", "INT-102", "INT-103"];
    let updatedCount = 0;
    for (const s of items) {
      if (storyIds.includes(s.id)) {
        s.status = "review";
        if (!s.agentWork) s.agentWork = {};
        s.agentWork.status = "done";
        s.agentWork.completedAt = new Date().toISOString();
        s.agentWork.notes = `Implemented & verified by PMOS agent. Ready for Product Manager Review.`;
        updatedCount++;
        console.log(`Updated ${s.id} to review`);
      }
    }
    if (updatedCount > 0) {
      const putRes = await fetch(postbaseUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      console.log("PostBase PUT status:", putRes.status);
    }
  } catch (e) {
    console.error("PostBase sync error:", e.message);
  }
}

syncPostBase();
