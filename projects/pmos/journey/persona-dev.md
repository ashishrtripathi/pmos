# Customer Journey — PMOS (Dev the Developer/Extender)

**Persona**: Dev — Full-Stack Developer / Technical Lead
**Role**: Extends PMOS with new capabilities, writes plugins, contributes to the open-source project
**Quote**: "I want to add features to PMOS without fighting the architecture. The file-based design should make this easy."

---

## Journey Steps

### Step 1: Set Up Development Environment
**Activity**: Clone PMOS, install dependencies, start dev servers
**Tasks**:
- Clone `https://github.com/ashishrtripathi/pmos.git` to `~/.pmos`
- Run `cd pmos-ui && npm install && npm run dev`
- Verify UI loads at localhost:3100
- Understand the `~/.pmos/` file structure

**Pain Points**:
- "Where does the UI code live vs. the metadata?"
- "How do I add a new page to the dashboard?"
- "I need to know which files to touch for a feature change"

**Screen**: PMOS-UI → Dashboard, README.md, directory structure

### Step 2: Understand the Data Model
**Activity**: Learn how PMOS reads/writes files
**Tasks**:
- Read `src/lib/pmos.ts` — the core file reader
- Understand `src/types/pmos.ts` — TypeScript types
- Examine markdown frontmatter conventions
- Check how API routes read from `~/.pmos/`

**Pain Points**:
- "Is there a schema for these markdown files?"
- "What fields does the parser expect?"
- "I broke the build — which type changed?"

**Screen**: Code → pmos.ts, types/pmos.ts, API routes

### Step 3: Add a New Feature
**Activity**: Implement a new PMOS capability (e.g., prioritization scoring)
**Tasks**:
- Create new API route at `src/app/api/projects/[slug]/[feature]/route.ts`
- Add types to `src/types/pmos.ts`
- Create page at `src/app/projects/[slug]/[feature]/page.tsx`
- Add navigation in `src/components/sidebar.tsx`

**Pain Points**:
- "Server vs. client components — which do I use?"
- "How do I pass data from server → client in Next.js 14?"
- "My fs.readFileSync works in the API route but not in the page"

**Screen**: Code → New feature files

### Step 4: Write Tests & Verify
**Activity**: Ensure changes work across all pages
**Tasks**:
- Run `npm run build` to verify TypeScript compiles
- Test all pages load (check for 500 errors)
- Verify drag-and-drop still works
- Test API endpoints return expected data

**Pain Points**:
- "I need to restart the dev server after some changes"
- "How do I test server-side file reads locally?"

**Screen**: Terminal → Build output, Browser → All pages

### Step 5: Document & Contribute
**Activity**: Update docs and create a PR
**Tasks**:
- Update README.md with new feature
- Add command doc if it's a new PMOS command
- Update PRIORITIZATION-FRAMEWORK.md if relevant
- Commit and push to GitHub

**Pain Points**:
- "Where should I document this?"
- "Is there a contributing guide?"

**Screen**: GitHub → PR, docs files
