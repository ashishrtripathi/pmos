---
id: INT-100
title: "Extract Shared CostBar Component"
points: 2
status: backlog
assigned-agent: software-engineer
estimated-value: 10000
category: Code Quality
priority: high
effort: XS
source: intelligence
source-file: intelligence/improvements.md
source-section: "From Code Analysis"
---

# Extract Shared CostBar Component

## Use Case

- **As a** software engineer
- **I want to** extract and share the CostBar component across all cards, modals, and headers
- **so that** labor hours, token counts, and ROI metrics are calculated consistently in a single reusable component without code duplication

## Description

Intelligence-identified improvement in Code Quality: Extract Shared CostBar Component into src/components/cost-bar.tsx.

## Business Goal

Prevents calculation drift and eliminates code duplication. Estimated value: $10,000 in maintainability and developer efficiency.

## Acceptance Criteria

- **Scenario:** Unified CostBar rendering
  - **Given:** the Kanban board and Story Map boards are loaded
  - **When:** story cards and modals display cost breakdowns
  - **Then:** all views render labor cost, token usage, and ROI multiple using the shared CostBar component
