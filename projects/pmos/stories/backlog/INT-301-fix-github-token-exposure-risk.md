---
id: INT-301
title: "Fix: GitHub Token Exposure Risk"
points: 3
status: backlog
assigned-agent: qa-engineer
estimated-value: 10000
category: High Priority Issue
priority: high
effort: S
source: intelligence
source-file: intelligence/code-quality.md
source-section: "High Priority"
---

# Fix: GitHub Token Exposure Risk

## Use Case

- **As a** Security & QA Engineer
- **I want to** mask sensitive GitHub Personal Access Tokens in server responses, error traces, and client logs
- **so that** secret credentials are never leaked in plain text over the network or in debugging logs

## Description

High Priority Issue: GitHub Token Exposure Risk in API routes. Must add token masking and safe logging.

## Business Goal

Hardens secret management and protects user credentials. Estimated $10,000 in risk mitigation.

## Acceptance Criteria

- **Scenario:** Token redaction in logs and responses
  - **Given:** a GitHub API error occurs or server logs request payloads
  - **When:** the error or log message is generated
  - **Then:** all authorization tokens are redacted as 'ghp_****' and never shown in plain text
