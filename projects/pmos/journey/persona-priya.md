# Customer Journey — PMOS (Priya the Product Manager)

**Persona**: Priya — Senior Product Manager
**Role**: Primary user of the PMOS Dashboard UI
**Quote**: "I need to see the whole picture — journey, stories, priorities — without switching between 5 tools."

---

## Journey Steps

### Step 1: Onboard a New Project
**Activity**: Connect a project (GitHub or local) to PMOS
**Tasks**:
- Run "PMOS: attach project at [path]"
- Review source-location.json created
- Verify PMOS can read the codebase

**Pain Points**:
- "I don't want to clone repos — my code stays where it is"
- "I need to know PMOS understands my project's structure"

**Screen**: ![Dashboard → Project Setup](screens/dashboard.png)

### Step 2: Intelligence Gathering
**Activity**: Let AI agents analyze the codebase
**Tasks**:
- Trigger repository intelligence scan
- Review architecture, tech stack, features, quality
- Identify gaps and improvement opportunities

**Pain Points**:
- "How do I know the AI understood my code correctly?"
- "I need to see what it found before acting on it"

**Screen**: ![Intelligence](screens/intelligence.png)

### Step 3: Customer Journey Mapping
**Activity**: Define personas and map their journey through the product
**Tasks**:
- Create persona profiles
- Map each persona's steps through the product
- Identify pain points per step
- View actual app UI in each step (via iframe or HTML parsing)

**Pain Points**:
- "I can't map a journey without seeing the actual UI"
- "Each persona needs their own journey — not a one-size-fits-all"

**Screen**: ![Journey → Persona tabs](screens/journey.png)

### Step 4: User Story Mapping
**Activity**: Build stories from the journey backbone
**Tasks**:
- Create stories under journey steps
- Assign persona and business goal
- Write Use Case (As a / I want to / so that) and Gherkin AC
- Estimate points and AI agent token costs
- Calculate ROI (estimated value vs AI cost)

**Pain Points**:
- "Stories need to trace back to a specific persona and journey step"
- "I need to see the cost in tokens AND dollars, not just story points"
- "What's the ROI on this feature?"

**Screen**: ![Story Map → Journey columns with stories](screens/story-map.png)

### Step 5: Agent Kanban
**Activity**: Assign stories to AI agent teams
**Tasks**:
- Review stories placed in agent columns
- See intelligence-sourced stories auto-assigned
- Drag stories between agents
- Click to view/edit any story

**Pain Points**:
- "I need to know which agent does what"
- "Intelligence findings should automatically become stories in the right queue"

**Screen**: ![Kanban → 7 agent columns](screens/kanban.png)

### Step 6: Pipeline Execution
**Activity**: Run the full PMOS pipeline or execute individual steps
**Tasks**:
- Click "Run" on individual steps or "Run All Remaining"
- Monitor progress with status icons and execution log
- Reset pipeline when needed
- View completion summary

**Pain Points**:
- "I need to see what step the project is in"
- "I should be able to continue from where it failed"

**Screen**: ![Pipeline → 9-step execution](screens/pipeline.png)

### Step 7: Agent Dispatch
**Activity**: Send commands to AI coding agents directly
**Tasks**:
- Select PMOS command template
- Fill in parameters
- Dispatch to agent (copies to clipboard)
- View dispatch history

**Pain Points**:
- "I got an error message telling me to ask an agent — I want to do that from here"
- "I need a library of PMOS commands ready to go"

**Screen**: ![Agents → Agent Dispatch panel](screens/agents.png)

### Step 8: Monitor & Iterate
**Activity**: Track progress and re-evaluate
**Tasks**:
- Watch stories move through the pipeline
- Re-prioritize as new intelligence comes in
- Review completed stories
- Generate new stories from live product feedback

**Pain Points**:
- "I need to see progress without asking for status updates"
- "Priorities should update automatically when the codebase changes"

**Screen**: ![Dashboard → Project health](screens/dashboard.png)
