# Customer Journey — Dev (Full-Stack Developer)

**Persona**: Full-Stack Developer / Technical Lead, 32, Expert
**Quote**: "I want to add features to PMOS without fighting the architecture. The file-based design should make this easy."

---

### Journey Steps (Left → Right)

| Step | Activity | Tasks | Pain Points | Screen |
|------|----------|-------|-------------|--------|
| **1. Setup Dev Environment** | Clone, install, run dev servers | Clone repo, npm install, npm run dev, understand structure | Where is UI code vs metadata? How to add pages? What files to touch? | ![PMOS-UI Dashboard](screens/dashboard.png) |
| **2. Understand Data Model** | Learn how PMOS reads/writes files | Read lib/pmos.ts, types/pmos.ts, markdown conventions, API routes | What schema? What fields? Which type broke the build? | ![Intelligence → Architecture](screens/intelligence.png) |
| **3. Run Pipeline** | Execute steps, verify output | Run intelligence, journey, story mapping steps, check output files | Where to find errors? How to reset? | ![Pipeline](screens/pipeline.png) |
| **4. Add New Feature** | Implement a PMOS capability | Create API route, add types, create page, add navigation | Server vs client components? Data passing in Next.js 14? fs.readFileSync scoping? | ![Agents → Dispatch panel](screens/agents.png) |
| **5. Write Tests & Verify** | Ensure changes work | Build check, test pages, verify DnD, test API endpoints | Need to restart dev server? How to test server-side file reads? | ![Stories board](screens/stories.png) |
| **6. Document & Contribute** | Update docs, create PR | Update README, add command doc, update framework doc, commit and push | Where to document? Is there a contributing guide? | ![Setup → Source config](screens/setup.png) |

### Stories Under This Journey
| Story | Step | Points | Status |
|-------|------|--------|--------|
