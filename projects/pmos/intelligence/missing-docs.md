# PMOS — Missing Documentation

## Summary

| Category | Count | Priority |
|----------|-------|----------|
| README Files | 3 | High |
| Architecture Docs | 2 | High |
| API Docs | 1 | Medium |
| Development Guides | 3 | Medium |
| User Guides | 2 | Low |

---

## 🔴 High Priority — Missing

### 1. Project README.md
**Expected**: `~/.pmos/pmos-ui/README.md`
**Status**: Missing
**Impact**: New contributors have no entry point. No setup instructions, no architecture overview.
**Should Contain**:
- Project overview and goals
- Tech stack summary
- Getting started (npm install, npm run dev)
- Architecture diagram
- Directory structure
- Contributing guidelines
- License

### 2. PMOS Specification Document
**Expected**: `~/.pmos/README.md`
**Status**: Missing
**Impact**: The overall PMOS system has no specification. Users discover behavior through the UI rather than documentation.
**Should Contain**:
- What is PMOS? (AI-native product operating system)
- Core concepts (file-based OS, personas, journeys, stories, pipeline)
- `~/.pmos/` directory structure
- How AI agents interact with PMOS
- PMOS commands reference
- Source location model (local, github, github-only)

### 3. Contributing Guide
**Expected**: `~/.pmos/pmos-ui/CONTRIBUTING.md`
**Status**: Missing
**Impact**: No standards for code contributions, commit messages, or PR process.

---

## 🟠 Medium Priority — Missing

### 4. Component Storybook
**Expected**: `~/.pmos/pmos-ui/src/components/README.md` or Storybook setup
**Status**: Missing
**Impact**: No visual documentation of UI components. Hard for designers to reference existing components.

### 5. API Route Documentation
**Expected**: Inline JSDoc comments in API route files
**Status**: Partial — `api-docs.md` exists in intelligence but not in code
**Impact**: API consumers (including AI agents) don't know request/response formats from code alone.

### 6. Type Documentation
**Expected**: JSDoc comments on all interfaces in `types/pmos.ts`
**Status**: Partial — some interfaces documented, some not
**Impact**: Developers must read implementation to understand type relationships.

### 7. Cost Estimation Formula Documentation
**Expected**: `~/.pmos/pmos-ui/src/lib/cost-estimation.md` or README section
**Status**: Missing
**Impact**: The token cost and ROI formulas are critical business logic but undocumented. Hard to verify accuracy or adjust parameters.

### 8. Pipeline Step Details
**Expected**: `~/.pmos/commands/run-pipeline.md` is detailed but no UI-facing docs
**Status**: Missing from UI
**Impact**: PMs using the dashboard don't know what each pipeline step does without reading the command file.

---

## 🟢 Low Priority — Missing

### 9. Deployment Guide
**Expected**: `~/.pmos/pmos-ui/DEPLOYMENT.md`
**Status**: Missing
**Impact**: No instructions for deploying to production (Vercel, self-hosted, etc.)

### 10. Troubleshooting Guide
**Expected**: `~/.pmos/pmos-ui/TROUBLESHOOTING.md`
**Status**: Missing
**Impact**: Users encountering errors (like the Pipeline Step 2 failure) have no reference for resolution.

---

## Documentation Debt Score: 35/100

The project has strong inline types and some intelligence documentation but lacks the foundational README, contributing guide, and architecture documentation expected for a collaborative project.
