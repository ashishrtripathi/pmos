import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ── Intelligence Story ─────────────────────────────

interface IntelligenceStory {
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
}

// ── Effort to Points Mapping ───────────────────────

function effortToPoints(effort: string): number {
  const e = effort.trim().toUpperCase();
  if (e === "XS") return 2;
  if (e === "S") return 3;
  if (e === "M") return 5;
  if (e === "L") return 8;
  if (e === "XL") return 13;
  return 5;
}

// ── Parse Improvements ─────────────────────────────

function parseImprovements(
  content: string,
  filePath: string
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
          // Only create new stories (skip ones that map to existing stories)
          if (existingStory.trim() === "New" && improvement) {
            const slug = improvement
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/-+$/, "");
            stories.push({
              id: `INT-${String(idCounter++).padStart(3, "0")}`,
              title: improvement,
              description: `Intelligence-identified improvement: ${improvement}`,
              points: effortToPoints(effort),
              status: "backlog",
              category,
              source: "intelligence",
              sourceFile: "intelligence/improvements.md",
              sourceSection: "From Code Analysis",
              businessGoal: `Improves ${category.toLowerCase()} of the application`,
              useCase: {
                asA: "product manager",
                iWant: `to address this ${category.toLowerCase()} improvement`,
                soThat:
                  "the application is more reliable, secure, and maintainable",
              },
              acceptanceCriteria: [
                {
                  scenario: `${improvement}`,
                  given: ["the current codebase is analyzed"],
                  when: `this improvement is implemented`,
                  then: `the ${category.toLowerCase()} concern is addressed`,
                },
              ],
              priority: effort.trim().toUpperCase() === "XS" || effort.trim().toUpperCase() === "S" ? "high" : effort.trim().toUpperCase() === "M" ? "medium" : "low",
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
          const slug = improvement
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/-+$/, "");
          const personaName = persona.split("(")[0].trim();
          const personaRole = persona.match(/\((.+?)\)/)?.[1] || "";
          const impactLower = impact.trim().toLowerCase();

          stories.push({
            id: `INT-${String(idCounter++).padStart(3, "0")}`,
            title: improvement,
            description: `UX/Product improvement: ${improvement}`,
            points:
              impactLower === "high"
                ? 8
                : impactLower === "medium"
                  ? 5
                  : 3,
            status: "backlog",
            category: "UX/Product",
            source: "intelligence",
            sourceFile: "intelligence/improvements.md",
            sourceSection: "UX / Product Improvements",
            persona: personaName,
            personaRole: personaRole,
            businessGoal: `Improves customer experience for ${personaName} persona`,
            useCase: {
              asA: personaRole || personaName.toLowerCase(),
              iWant: `to ${improvement.toLowerCase()}`,
              soThat: "I have a better experience with the product",
            },
            acceptanceCriteria: [
              {
                scenario: improvement,
                given: [`I am using the application as ${personaName}`],
                when: `I encounter this feature`,
                then: `my experience is improved: ${improvement.toLowerCase()}`,
              },
            ],
            priority:
              impactLower === "high"
                ? "high"
                : impactLower === "medium"
                  ? "medium"
                  : "low",
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

          stories.push({
            id: `INT-${String(idCounter++).padStart(3, "0")}`,
            title: improvement,
            description: `Technical improvement in ${area}: ${improvement}`,
            points: effortToPoints(effort),
            status: "backlog",
            category: "Technical",
            source: "intelligence",
            sourceFile: "intelligence/improvements.md",
            sourceSection: "Technical Improvements",
            businessGoal: `Improves ${area.toLowerCase()} of the application`,
            useCase: {
              asA: "software engineer",
              iWant: `to implement ${improvement.toLowerCase()}`,
              soThat: `the ${area.toLowerCase()} is improved`,
            },
            acceptanceCriteria: [
              {
                scenario: improvement,
                given: ["the current codebase is analyzed"],
                when: `this technical improvement is implemented`,
                then: `the ${area.toLowerCase()} is measurably improved`,
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

function parseMissingFeatures(
  content: string,
  filePath: string
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

          stories.push({
            id: `INT-${String(idCounter++).padStart(3, "0")}`,
            title: `${isMissing ? "Implement" : "Complete"}: ${feature}`,
            description: `${gap}`,
            points: 8,
            status: "backlog",
            category: "Missing Feature",
            source: "intelligence",
            sourceFile: "intelligence/features.md",
            sourceSection: "Missing / Partial Features",
            businessGoal: `Fills a gap in the product offering`,
            useCase: {
              asA: "product manager",
              iWant: `to have ${feature.toLowerCase()} in the application`,
              soThat: "users have a complete feature set",
            },
            acceptanceCriteria: [
              {
                scenario: feature,
                given: ["the application is running"],
                when: `this feature is used`,
                then: `it works as expected without the gap: ${gap.toLowerCase()}`,
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

function parseCodeQuality(
  content: string,
  filePath: string
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

          stories.push({
            id: `INT-${String(idCounter++).padStart(3, "0")}`,
            title: `Fix: ${issue}`,
            description: `${description} (${file})`,
            points: 5,
            status: "backlog",
            category: "Critical Issue",
            source: "intelligence",
            sourceFile: "intelligence/code-quality.md",
            sourceSection: "Critical (Production Blockers)",
            businessGoal: "Removes a production blocker",
            useCase: {
              asA: "software engineer",
              iWant: `to fix ${issue.toLowerCase()}`,
              soThat: "the application is production-ready",
            },
            acceptanceCriteria: [
              {
                scenario: issue,
                given: [`the issue exists in ${file}`],
                when: `this fix is implemented`,
                then: `the issue is resolved and the application is production-safe`,
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

          stories.push({
            id: `INT-${String(idCounter++).padStart(3, "0")}`,
            title: `Fix: ${issue}`,
            description: `${description} (${file})`,
            points: 3,
            status: "backlog",
            category: "High Priority Issue",
            source: "intelligence",
            sourceFile: "intelligence/code-quality.md",
            sourceSection: "High Priority",
            businessGoal: "Improves code quality and reliability",
            useCase: {
              asA: "software engineer",
              iWant: `to fix ${issue.toLowerCase()}`,
              soThat: "the codebase is more reliable",
            },
            acceptanceCriteria: [
              {
                scenario: issue,
                given: [`the issue exists in ${file}`],
                when: `this fix is implemented`,
                then: `the issue is resolved`,
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

// ── API Handler ────────────────────────────────────

const PMOS_ROOT = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  ".pmos"
);

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const projectPath = path.join(PMOS_ROOT, "projects", slug);
  const intelligencePath = path.join(projectPath, "intelligence");

  if (!fs.existsSync(intelligencePath)) {
    return NextResponse.json({ stories: [], files: [] });
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

  return NextResponse.json({
    stories: allStories,
    files: parsedFiles,
    totalPoints: allStories.reduce((sum, s) => sum + s.points, 0),
    byCategory: allStories.reduce(
      (acc, s) => {
        acc[s.category] = (acc[s.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    byPriority: allStories.reduce(
      (acc, s) => {
        acc[s.priority] = (acc[s.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  });
}
