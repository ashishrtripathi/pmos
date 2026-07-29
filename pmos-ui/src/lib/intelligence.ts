import fs from "fs";
import path from "path";
import { getPricingConfig } from "./pmos";

// ── Types ─────────────────────────────────────────────

export interface IntelligenceStory {
  id: string;
  title: string;
  description: string;
  points: number;
  status: "backlog";
  category: string;
  source: "intelligence";
  sourceFile: string;
  sourceSection: string;
  persona?: string;
  personaRole?: string;
  businessGoal?: string;
  estimatedValue?: number;
  useCase: { asA: string; iWant: string; soThat: string };
  acceptanceCriteria: {
    scenario: string;
    given: string[];
    when: string;
    then: string;
  }[];
  priority: "critical" | "high" | "medium" | "low";
  effort: string;
  assignedAgent: string;
}

const PMOS_ROOT = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  ".pmos"
);

// ── Agent Assignment Rules ──────────────────────────

export function assignAgent(
  category: string,
  section: string,
  title: string
): string {
  const titleLower = title.toLowerCase();
  const sectionLower = section.toLowerCase();
  const catLower = category.toLowerCase();

  if (
    catLower.includes("critical") ||
    catLower.includes("high priority") ||
    sectionLower.includes("critical") ||
    sectionLower.includes("high priority")
  ) {
    return "qa-engineer";
  }

  if (catLower.includes("missing")) {
    return "software-engineer";
  }

  if (catLower.includes("technical")) {
    return "software-engineer";
  }

  if (catLower.includes("ux") || catLower.includes("product")) {
    return "ux-designer";
  }

  if (
    sectionLower.includes("code analysis") &&
    (titleLower.includes("security") ||
      titleLower.includes("architect") ||
      titleLower.includes("api") ||
      titleLower.includes("config") ||
      titleLower.includes("dependency"))
  ) {
    return "architect";
  }

  if (sectionLower.includes("code analysis")) {
    return "software-engineer";
  }

  return "software-engineer";
}

// ── Estimated Value by Category ─────────────────────

export function estimateBusinessValue(
  category: string,
  _section: string,
  title: string,
  priority: string
): number {
  const titleLower = title.toLowerCase();

  if (titleLower.includes("security") || titleLower.includes("api key")) {
    return 50000;
  }

  if (priority === "critical") {
    return 75000;
  }

  if (category.toLowerCase().includes("missing")) {
    return 40000;
  }

  if (category.toLowerCase().includes("ux") || category.toLowerCase().includes("product")) {
    return 25000;
  }

  if (category.toLowerCase().includes("technical")) {
    return 15000;
  }

  return 10000;
}

// ── Effort to Points Mapping ───────────────────────

export function effortToPoints(effort: string): number {
  const e = effort.trim().toUpperCase();
  if (e === "XS") return 2;
  if (e === "S") return 3;
  if (e === "M") return 5;
  if (e === "L") return 8;
  if (e === "XL") return 13;
  return 5;
}

// ── Parse Improvements ─────────────────────────────

export function parseImprovements(
  content: string,
  _filePath: string
): IntelligenceStory[] {
  const stories: IntelligenceStory[] = [];
  let idCounter = 100;

  // Parse "From Code Analysis" table
  const codeAnalysisSection = content.match(
    /## From Code Analysis\n\n([\s\S]*?)(?=\n---|\n## |$)/
  );
  if (codeAnalysisSection) {
    const tableRows = codeAnalysisSection[1].match(
      /\|\s*\|(.+)\|\s*\|(.+)\|\s*\|(.+)\|\s*\|(.+)\|/g
    );
    if (tableRows) {
      for (const row of tableRows) {
        const cells = row
          .split("|")
          .map((c: string) => c.trim())
          .filter(Boolean);
        if (cells.length >= 4 && cells[0] !== "Improvement") {
          const [improvement, category, existingStory, effort] = cells;
          if (existingStory.trim() === "New" && improvement) {
            const points = effortToPoints(effort);
            const assignedAgent = assignAgent(category, "From Code Analysis", improvement);
            const estValue = estimateBusinessValue(category, "From Code Analysis", improvement, "high");

            stories.push({
              id: `INT-${String(idCounter++).padStart(3, "0")}`,
              title: improvement,
              description: `Intelligence-identified improvement in ${category}: ${improvement}. Currently no existing story addresses this.`,
              points,
              status: "backlog",
              category,
              source: "intelligence",
              sourceFile: "intelligence/improvements.md",
              sourceSection: "From Code Analysis",
              estimatedValue: estValue,
              businessGoal: `Prevents production issues and improves ${category.toLowerCase()} of the application. Estimated value: $${estValue.toLocaleString()} in risk mitigation and operational efficiency.`,
              assignedAgent,
              useCase: {
                asA: assignedAgent === "qa-engineer" ? "QA engineer" : assignedAgent === "architect" ? "architect" : "software engineer",
                iWant: `to resolve "${improvement.toLowerCase()}"`,
                soThat: `the application is more reliable, secure, and maintainable, preventing potential ${category.toLowerCase()} incidents`,
              },
              acceptanceCriteria: [
                {
                  scenario: improvement,
                  given: ["the current codebase is analyzed", `this is categorized as ${category}`],
                  when: `this improvement is implemented`,
                  then: `the ${category.toLowerCase()} concern is resolved and verified with automated tests`,
                },
              ],
              priority: effort.trim().toUpperCase() === "XS" || effort.trim().toUpperCase() === "S" ? "high" : "medium",
              effort: effort.trim(),
            });
          }
        }
      }
    }
  }

  // Parse "UX / Product Improvements" table
  const uxSection = content.match(
    /## UX \/ Product Improvements\n\n([\s\S]*?)(?=\n---|\n## |$)/
  );
  if (uxSection) {
    const tableRows = uxSection[1].match(
      /\|\s*\|(.+)\|\s*\|(.+)\|\s*\|(.+)\|/g
    );
    if (tableRows) {
      for (const row of tableRows) {
        const cells = row
          .split("|")
          .map((c: string) => c.trim())
          .filter(Boolean);
        if (cells.length >= 3 && cells[0] !== "Improvement") {
          const [improvement, persona, impact] = cells;
          if (!improvement) continue;

          const personaName = persona.split("(")[0].trim();
          const personaRole = persona.match(/\((.+?)\)/)?.[1] || "";
          const impactLower = impact.trim().toLowerCase();
          const points = impactLower === "high" ? 8 : impactLower === "medium" ? 5 : 3;
          const estValue = estimateBusinessValue("UX/Product", "UX / Product Improvements", improvement, impactLower === "high" ? "high" : "medium");

          stories.push({
            id: `INT-${String(idCounter++).padStart(3, "0")}`,
            title: improvement,
            description: `UX/Product improvement for ${personaName} persona (${personaRole}): ${improvement}. Impact: ${impact}. Estimated value: $${estValue.toLocaleString()} in customer retention.`,
            points,
            status: "backlog",
            category: "UX/Product",
            source: "intelligence",
            sourceFile: "intelligence/improvements.md",
            sourceSection: "UX / Product Improvements",
            persona: personaName,
            personaRole: personaRole,
            estimatedValue: estValue,
            businessGoal: `Improves customer experience for ${personaName} persona, reducing churn. Estimated $${estValue.toLocaleString()} in retention value.`,
            assignedAgent: "ux-designer",
            useCase: {
              asA: personaRole || personaName.toLowerCase(),
              iWant: `to ${improvement.toLowerCase()}`,
              soThat: `my experience is significantly improved, reducing friction and increasing satisfaction with the product`,
            },
            acceptanceCriteria: [
              {
                scenario: improvement,
                given: [`I am using the application as ${personaName}`],
                when: `I interact with this part of the product`,
                then: `my experience is measurably improved through reduced friction, better usability, or added capability`,
              },
            ],
            priority: impactLower === "high" ? "high" : impactLower === "medium" ? "medium" : "low",
            effort: impact.trim(),
          });
        }
      }
    }
  }

  // Parse "Technical Improvements" table
  const techSection = content.match(
    /## Technical Improvements\n\n([\s\S]*?)(?=\n---|\n## |$)/
  );
  if (techSection) {
    const tableRows = techSection[1].match(
      /\|\s*\|(.+)\|\s*\|(.+)\|\s*\|(.+)\|/g
    );
    if (tableRows) {
      for (const row of tableRows) {
        const cells = row
          .split("|")
          .map((c: string) => c.trim())
          .filter(Boolean);
        if (cells.length >= 3 && cells[0] !== "Improvement") {
          const [improvement, area, effort] = cells;
          if (!improvement) continue;

          const points = effortToPoints(effort);
          const assignedAgent = assignAgent("Technical", "Technical Improvements", improvement);
          const estValue = estimateBusinessValue("Technical", "Technical Improvements", improvement, "medium");

          stories.push({
            id: `INT-${String(idCounter++).padStart(3, "0")}`,
            title: improvement,
            description: `Technical improvement in ${area}: ${improvement}. This improves system reliability and development velocity. Estimated value: $${estValue.toLocaleString()} in operational efficiency.`,
            points,
            status: "backlog",
            category: "Technical",
            source: "intelligence",
            sourceFile: "intelligence/improvements.md",
            sourceSection: "Technical Improvements",
            estimatedValue: estValue,
            businessGoal: `Improves ${area.toLowerCase()} performance and reliability. Estimated $${estValue.toLocaleString()} in reduced operational costs.`,
            assignedAgent,
            useCase: {
              asA: assignedAgent === "architect" ? "architect" : "software engineer",
              iWant: `to implement ${improvement.toLowerCase()}`,
              soThat: `the ${area.toLowerCase()} is measurably improved, leading to better performance and fewer incidents`,
            },
            acceptanceCriteria: [
              {
                scenario: improvement,
                given: ["the current codebase is analyzed", `the target area is ${area}`],
                when: `this technical improvement is implemented`,
                then: `the ${area.toLowerCase()} is measurably improved with benchmarks showing improvement`,
              },
            ],
            priority: effort.trim().toUpperCase() === "L" ? "medium" : "high",
            effort: effort.trim(),
          });
        }
      }
    }
  }

  return stories;
}

// ── Parse Features (Missing) ───────────────────────

export function parseMissingFeatures(
  content: string,
  _filePath: string
): IntelligenceStory[] {
  const stories: IntelligenceStory[] = [];
  let idCounter = 200;

  const missingSection = content.match(
    /## Missing \/ Partial Features\n\n([\s\S]*?)(?=\n---|\n## |$)/
  );
  if (missingSection) {
    const tableRows = missingSection[1].match(
      /\|\s*\|(.+)\|\s*\|(.+)\|\s*\|(.+)\|/g
    );
    if (tableRows) {
      for (const row of tableRows) {
        const cells = row
          .split("|")
          .map((c: string) => c.trim())
          .filter(Boolean);
        if (cells.length >= 3 && cells[0] !== "Feature") {
          const [feature, status, gap] = cells;
          if (!feature) continue;
          const isMissing = status.includes("Missing");
          const isPartial = status.includes("Partial");
          if (!isMissing && !isPartial) continue;

          const points = isMissing ? 8 : 5;
          const estValue = estimateBusinessValue("Missing Feature", "Missing / Partial Features", feature, "high");

          stories.push({
            id: `INT-${String(idCounter++).padStart(3, "0")}`,
            title: `${isMissing ? "Implement" : "Complete"}: ${feature}`,
            description: `${gap}. ${isMissing ? "This feature is entirely missing from the application." : "This feature exists partially and needs completion."} Estimated value: $${estValue.toLocaleString()} in product completeness and market competitiveness.`,
            points,
            status: "backlog",
            category: "Missing Feature",
            source: "intelligence",
            sourceFile: "intelligence/features.md",
            sourceSection: "Missing / Partial Features",
            estimatedValue: estValue,
            businessGoal: `Fills a critical gap in the product offering. Estimated $${estValue.toLocaleString()} in competitive positioning and customer acquisition.`,
            assignedAgent: "software-engineer",
            useCase: {
              asA: "product manager",
              iWant: `to have ${feature.toLowerCase()} fully available in the application`,
              soThat: "users have a complete, competitive feature set that meets market expectations",
            },
            acceptanceCriteria: [
              {
                scenario: feature,
                given: ["the application is running", `this feature is ${isMissing ? "missing" : "partially implemented"}`],
                when: `this feature is ${isMissing ? "implemented" : "completed"}`,
                then: `it works end-to-end without gaps: ${gap.toLowerCase()}`,
              },
            ],
            priority: "high",
            effort: "M",
          });
        }
      }
    }
  }

  return stories;
}

// ── Parse Code Quality Issues ──────────────────────

export function parseCodeQuality(
  content: string,
  _filePath: string
): IntelligenceStory[] {
  const stories: IntelligenceStory[] = [];
  let idCounter = 300;

  // Parse Critical issues
  const criticalSection = content.match(
    /### Critical[\s\S]*?\n\n([\s\S]*?)(?=\n### |\n---|\n## |$)/
  );
  if (criticalSection) {
    const tableRows = criticalSection[1].match(
      /\|\s*\|(.+)\|\s*\|(.+)\|\s*\|(.+)\|/g
    );
    if (tableRows) {
      for (const row of tableRows) {
        const cells = row
          .split("|")
          .map((c: string) => c.trim())
          .filter(Boolean);
        if (cells.length >= 3 && cells[0] !== "Issue") {
          const [issue, file, description] = cells;
          if (!issue) continue;

          const estValue = estimateBusinessValue("Critical Issue", "Critical (Production Blockers)", issue, "critical");

          stories.push({
            id: `INT-${String(idCounter++).padStart(3, "0")}`,
            title: `Fix: ${issue}`,
            description: `${description} (in ${file}). This is a CRITICAL production blocker that must be resolved before any public deployment. Estimated value: $${estValue.toLocaleString()} in risk avoidance.`,
            points: 5,
            status: "backlog",
            category: "Critical Issue",
            source: "intelligence",
            sourceFile: "intelligence/code-quality.md",
            sourceSection: "Critical (Production Blockers)",
            estimatedValue: estValue,
            businessGoal: `Removes a production blocker. Without this fix, the application cannot be safely deployed. Estimated $${estValue.toLocaleString()} in avoided production incidents.`,
            assignedAgent: "qa-engineer",
            useCase: {
              asA: "QA engineer",
              iWant: `to ensure ${issue.toLowerCase()} is fixed and verified`,
              soThat: "the application is production-safe and will not expose users to this critical issue",
            },
            acceptanceCriteria: [
              {
                scenario: issue,
                given: [`the critical issue exists in ${file}`],
                when: `this fix is implemented and tested`,
                then: `the issue is resolved, no regression is introduced, and automated tests verify the fix`,
              },
            ],
            priority: "critical",
            effort: "M",
          });
        }
      }
    }
  }

  // Parse High Priority issues
  const highSection = content.match(
    /### High Priority\n\n([\s\S]*?)(?=\n### |\n---|\n## |$)/
  );
  if (highSection) {
    const tableRows = highSection[1].match(
      /\|\s*\|(.+)\|\s*\|(.+)\|\s*\|(.+)\|/g
    );
    if (tableRows) {
      for (const row of tableRows) {
        const cells = row
          .split("|")
          .map((c: string) => c.trim())
          .filter(Boolean);
        if (cells.length >= 3 && cells[0] !== "Issue") {
          const [issue, file, description] = cells;
          if (!issue) continue;

          const estValue = estimateBusinessValue("High Priority Issue", "High Priority", issue, "high");

          stories.push({
            id: `INT-${String(idCounter++).padStart(3, "0")}`,
            title: `Fix: ${issue}`,
            description: `${description} (in ${file}). This is a high-priority quality issue that affects reliability. Estimated value: $${estValue.toLocaleString()} in reduced support costs.`,
            points: 3,
            status: "backlog",
            category: "High Priority Issue",
            source: "intelligence",
            sourceFile: "intelligence/code-quality.md",
            sourceSection: "High Priority",
            estimatedValue: estValue,
            businessGoal: `Improves code quality and reliability. Estimated $${estValue.toLocaleString()} in reduced support overhead and increased developer productivity.`,
            assignedAgent: "qa-engineer",
            useCase: {
              asA: "QA engineer",
              iWant: `to ensure ${issue.toLowerCase()} is resolved`,
              soThat: "the codebase is more reliable and produces fewer bugs in production",
            },
            acceptanceCriteria: [
              {
                scenario: issue,
                given: [`the issue exists in ${file}`],
                when: `this fix is implemented`,
                then: `the issue is resolved and verified with automated tests`,
              },
            ],
            priority: "high",
            effort: "S",
          });
        }
      }
    }
  }

  return stories;
}

// ── Combined Parser ─────────────────────────────────

export function parseAllIntelligenceStories(slug: string): {
  stories: IntelligenceStory[];
  files: string[];
} {
  const projectPath = path.join(PMOS_ROOT, "projects", slug);
  const intelligencePath = path.join(projectPath, "intelligence");

  if (!fs.existsSync(intelligencePath)) {
    return { stories: [], files: [] };
  }

  const files = fs.readdirSync(intelligencePath).filter((f) => f.endsWith(".md"));
  const allStories: IntelligenceStory[] = [];
  const parsedFiles: string[] = [];

  for (const file of files) {
    const filePath = path.join(intelligencePath, file);
    const content = fs.readFileSync(filePath, "utf-8");
    parsedFiles.push(file);

    if (file === "improvements.md") {
      allStories.push(...parseImprovements(content, filePath));
    } else if (file === "features.md") {
      allStories.push(...parseMissingFeatures(content, filePath));
    } else if (file === "code-quality.md") {
      allStories.push(...parseCodeQuality(content, filePath));
    }
  }

  return { stories: allStories, files: parsedFiles };
}

// ── Write Stories as Backlog Files ─────────────────

export function writeIntelligenceStoriesToBacklog(slug: string): number {
  const { stories } = parseAllIntelligenceStories(slug);
  const backlogDir = path.join(PMOS_ROOT, "projects", slug, "stories", "backlog");

  if (!fs.existsSync(backlogDir)) {
    fs.mkdirSync(backlogDir, { recursive: true });
  }

  let written = 0;
  for (const story of stories) {
    const safeTitle = story.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "story";
    const fileName = `${story.id}-${safeTitle}.md`;
    const filePath = path.join(backlogDir, fileName);

    // Skip if already exists
    if (fs.existsSync(filePath)) continue;

    const frontmatter = {
      id: story.id,
      title: story.title,
      points: story.points,
      status: "backlog",
      "assigned-agent": story.assignedAgent,
      "estimated-value": story.estimatedValue || 0,
      category: story.category,
      priority: story.priority,
      effort: story.effort,
      source: story.source,
      "source-file": story.sourceFile,
      "source-section": story.sourceSection,
    };

    // Only add persona fields if they exist
    if (story.persona) (frontmatter as any)["persona"] = story.persona;
    if (story.personaRole) (frontmatter as any)["persona-role"] = story.personaRole;

    const acBullets = story.acceptanceCriteria
      .map(
        (ac) =>
          `- **Scenario:** ${ac.scenario}\n` +
          `  - **Given:** ${ac.given.map((g) => g).join("\n    ")}\n` +
          `  - **When:** ${ac.when}\n` +
          `  - **Then:** ${ac.then}`
      )
      .join("\n\n");

    const content = `---
id: ${story.id}
title: "${story.title}"
points: ${story.points}
status: backlog
assigned-agent: ${story.assignedAgent}
estimated-value: ${story.estimatedValue || 0}
category: ${story.category}
priority: ${story.priority}
effort: ${story.effort}
source: ${story.source}
source-file: ${story.sourceFile}
source-section: "${story.sourceSection}"
${story.persona ? `persona: ${story.persona}` : ""}
${story.personaRole ? `persona-role: ${story.personaRole}` : ""}
---

# ${story.title}

## Use Case

- **As a** ${story.useCase.asA}
- **I want to** ${story.useCase.iWant}
- **so that** ${story.useCase.soThat}

## Description

${story.description}

## Business Goal

${story.businessGoal}

## Acceptance Criteria

${acBullets}
`;

    fs.writeFileSync(filePath, content, "utf-8");
    written++;
  }

  return written;
}

// ── Cost Calculation (reads pricing config) ──────────

export interface CostBreakdown {
  totalCost: number;
  aiCost: number;
  developerCost: number;
  pmCost: number;
  qaCost: number;
  details: {
    storyId: string;
    title: string;
    points: number;
    tokens: number;
    aiCost: number;
    developerCost: number;
    pmCost: number;
    qaCost: number;
    total: number;
  }[];
}

export function calculateTotalCost(
  slug: string,
  stories: { id: string; title: string; points: number }[]
): CostBreakdown {
  const pricing = getPricingConfig(slug);

  let totalAiCost = 0;
  let totalDevCost = 0;
  let totalPMCost = 0;
  let totalQACost = 0;
  const details: CostBreakdown["details"] = [];

  for (const story of stories) {
    const tokens = story.points * pricing.tokensPerPoint * pricing.tokenMultiplier;
    const aiCost = (tokens / pricing.tokensPerK) * pricing.costPerToken * pricing.marginMultiplier;
    const baseHumanCost = story.points * pricing.hoursPerPoint;
    const developerCost = baseHumanCost * pricing.developerHourlyRate * pricing.numDevelopers;
    const pmCost = baseHumanCost * pricing.productManagerHourlyRate * pricing.numProductManagers;
    const qaCost = baseHumanCost * pricing.qaEngineerHourlyRate * pricing.numQA;

    totalAiCost += aiCost;
    totalDevCost += developerCost;
    totalPMCost += pmCost;
    totalQACost += qaCost;

    details.push({
      storyId: story.id,
      title: story.title,
      points: story.points,
      tokens: Math.round(tokens),
      aiCost: Math.round(aiCost * 100) / 100,
      developerCost: Math.round(developerCost * 100) / 100,
      pmCost: Math.round(pmCost * 100) / 100,
      qaCost: Math.round(qaCost * 100) / 100,
      total: Math.round((aiCost + developerCost + pmCost + qaCost) * 100) / 100,
    });
  }

  const grandTotal = totalAiCost + totalDevCost + totalPMCost + totalQACost;

  return {
    totalCost: Math.round(grandTotal * 100) / 100,
    aiCost: Math.round(totalAiCost * 100) / 100,
    developerCost: Math.round(totalDevCost * 100) / 100,
    pmCost: Math.round(totalPMCost * 100) / 100,
    qaCost: Math.round(totalQACost * 100) / 100,
    details,
  };
}
