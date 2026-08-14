"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bot,
  Send,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  History,
  Zap,
  Brain,
  FileText,
  Workflow,
  BookOpen,
  Layers,
  Columns3,
  Map,
  Play,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Plus,
  RefreshCw,
} from "lucide-react";

// ── Types ──────────────────────────────────────────

interface PMOSCommand {
  id: string;
  name: string;
  icon: any;
  description: string;
  command: string;
  params: CommandParam[];
  category: "intelligence" | "stories" | "pipeline" | "management";
}

interface CommandParam {
  name: string;
  label: string;
  type: "text" | "select" | "textarea";
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
}

interface DispatchEntry {
  id: string;
  commandId: string;
  commandName: string;
  params: Record<string, string>;
  dispatchedAt: string;
  status: "pending" | "dispatched" | "completed" | "failed";
  response?: string;
  agent?: string;
}

// ── Command Templates ──────────────────────────────

const COMMANDS: PMOSCommand[] = [
  {
    id: "run-intelligence",
    name: "Run Intelligence",
    icon: Brain,
    description:
      "Analyze the project codebase and generate intelligence files (architecture, tech stack, features, code quality, improvements)",
    command: "PMOS: run intelligence on {project}",
    category: "intelligence",
    params: [
      {
        name: "project",
        label: "Project Slug",
        type: "text",
        required: true,
        placeholder: "e.g. pmos",
      },
      {
        name: "focus",
        label: "Analysis Focus",
        type: "select",
        required: false,
        options: [
          "Full Analysis",
          "Architecture Only",
          "Code Quality Only",
          "Security Audit",
          "Feature Inventory",
        ],
        defaultValue: "Full Analysis",
      },
    ],
  },
  {
    id: "create-story",
    name: "Create User Story",
    icon: FileText,
    description:
      "Create a new user story in Mike Cohn format with Gherkin acceptance criteria, linked to a persona and business goal",
    command:
      "PMOS: create a user story for {description} for persona {persona}",
    category: "stories",
    params: [
      {
        name: "description",
        label: "Story Description",
        type: "textarea",
        required: true,
        placeholder: "e.g. real-time video preview with timeline scrubbing",
      },
      {
        name: "persona",
        label: "Persona",
        type: "select",
        required: true,
        options: ["Auto-detect from context"],
        defaultValue: "Auto-detect from context",
      },
      {
        name: "points",
        label: "Story Points",
        type: "select",
        required: false,
        options: ["1", "2", "3", "5", "8", "13"],
        defaultValue: "5",
      },
    ],
  },
  {
    id: "run-pipeline",
    name: "Run Pipeline Step",
    icon: Workflow,
    description:
      "Execute a specific step of the PMOS pipeline or run all remaining steps",
    command: "PMOS: run pipeline step {step} for {project}",
    category: "pipeline",
    params: [
      {
        name: "step",
        label: "Pipeline Step",
        type: "select",
        required: true,
        options: [
          "1 - Resolve Source",
          "2 - Repository Intelligence",
          "3 - Run Application",
          "4 - Customer Journey",
          "5 - Story Mapping",
          "6 - Build Backlog",
          "7 - Build Kanban",
          "8 - Product Dashboard",
          "9 - Continuous Learning",
          "All Remaining",
        ],
      },
      {
        name: "project",
        label: "Project Slug",
        type: "text",
        required: true,
        placeholder: "e.g. pmos",
      },
    ],
  },
  {
    id: "attach-project",
    name: "Attach Project",
    icon: Plus,
    description:
      "Attach a new project to PMOS from a local directory or GitHub repository",
    command: "PMOS: attach project at {source}",
    category: "management",
    params: [
      {
        name: "source",
        label: "Source (path or URL)",
        type: "text",
        required: true,
        placeholder:
          "e.g. C:\\Projects\\my-app or https://github.com/user/repo",
      },
    ],
  },
  {
    id: "create-persona",
    name: "Create Persona Journey",
    icon: Map,
    description:
      "Define a new persona and create their customer journey map with pain points and steps",
    command:
      "PMOS: create persona journey for {name} who is a {role} that {context}",
    category: "intelligence",
    params: [
      {
        name: "name",
        label: "Persona Name",
        type: "text",
        required: true,
        placeholder: "e.g. Product Manager, Developer, Designer",
      },
      {
        name: "role",
        label: "Role",
        type: "text",
        required: true,
        placeholder: "e.g. Content Creator, Developer, PM",
      },
      {
        name: "context",
        label: "Context / Goal",
        type: "textarea",
        required: true,
        placeholder: "e.g. needs to create marketing videos quickly",
      },
    ],
  },
  {
    id: "prioritize-backlog",
    name: "Prioritize Backlog",
    icon: Layers,
    description:
      "Re-prioritize the product backlog using dollar-normalized weighted scoring across 5 value dimensions",
    command: "PMOS: prioritize the backlog for {project} using {framework}",
    category: "stories",
    params: [
      {
        name: "project",
        label: "Project Slug",
        type: "text",
        required: true,
        placeholder: "e.g. pmos",
      },
      {
        name: "framework",
        label: "Framework",
        type: "select",
        required: false,
        options: [
          "Dollar-Normalized Weighted Scoring",
          "MoSCoW",
          "RICE",
          "Value vs Effort Matrix",
        ],
        defaultValue: "Dollar-Normalized Weighted Scoring",
      },
    ],
  },
  {
    id: "generate-tests",
    name: "Generate Test Plan",
    icon: Columns3,
    description:
      "Generate a comprehensive test plan based on user stories and acceptance criteria",
    command:
      "PMOS: generate test plan for {project} covering {scope}",
    category: "pipeline",
    params: [
      {
        name: "project",
        label: "Project Slug",
        type: "text",
        required: true,
        placeholder: "e.g. pmos",
      },
      {
        name: "scope",
        label: "Test Scope",
        type: "select",
        required: false,
        options: [
          "All Stories",
          "Backlog Only",
          "In-Progress Only",
          "Critical Path",
        ],
        defaultValue: "All Stories",
      },
    ],
  },
  {
    id: "review-code",
    name: "Code Review Request",
    icon: Zap,
    description:
      "Request an AI-powered code review for a specific file or feature branch",
    command: "PMOS: review code at {target} for {concern}",
    category: "intelligence",
    params: [
      {
        name: "target",
        label: "File or Branch",
        type: "text",
        required: true,
        placeholder: "e.g. src/components/Player.tsx or feature/auth",
      },
      {
        name: "concern",
        label: "Review Focus",
        type: "select",
        required: false,
        options: [
          "General Review",
          "Security Audit",
          "Performance",
          "Accessibility",
          "Architecture",
        ],
        defaultValue: "General Review",
      },
    ],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  intelligence: "bg-amber-50 text-amber-700 border-amber-200",
  stories: "bg-blue-50 text-blue-700 border-blue-200",
  pipeline: "bg-purple-50 text-purple-700 border-purple-200",
  management: "bg-green-50 text-green-700 border-green-200",
};

// ── Command Card ───────────────────────────────────

function CommandCard({
  command,
  onDispatch,
}: {
  command: PMOSCommand;
  onDispatch: (cmd: PMOSCommand, params: Record<string, string>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [params, setParams] = useState<Record<string, string>>({});

  const Icon = command.icon;

  const handleDispatch = () => {
    // Fill in defaults for optional params
    const filledParams = { ...params };
    for (const p of command.params) {
      if (!filledParams[p.name] && p.defaultValue) {
        filledParams[p.name] = p.defaultValue;
      }
    }
    onDispatch(command, filledParams);
    setExpanded(false);
  };

  return (
    <div className="border rounded-lg bg-card hover:shadow-md transition-all">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{command.name}</h3>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[command.category]}`}
            >
              {command.category}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {command.description}
          </p>
        </div>
        <div className="shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Expanded: Parameters + Dispatch */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border">
          {/* Command Preview */}
          <div className="mt-3 p-2 bg-muted rounded-md font-mono text-[11px] text-muted-foreground overflow-x-auto">
            <Terminal className="w-3 h-3 inline mr-1" />
            {command.command
              .replace(/\{(\w+)\}/g, (_, key) => {
                return params[key]
                  ? `"${params[key]}"`
                  : `{${key}}`;
              })}
          </div>

          {/* Parameters */}
          <div className="mt-3 space-y-2">
            {command.params.map((param) => (
              <div key={param.name}>
                <label className="text-xs font-medium text-muted-foreground">
                  {param.label}
                  {param.required && (
                    <span className="text-destructive ml-0.5">*</span>
                  )}
                </label>
                {param.type === "select" ? (
                  <select
                    value={params[param.name] || param.defaultValue || ""}
                    onChange={(e) =>
                      setParams({ ...params, [param.name]: e.target.value })
                    }
                    className="mt-0.5 w-full text-xs border border-border rounded-md px-2 py-1.5 bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    {param.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : param.type === "textarea" ? (
                  <textarea
                    value={params[param.name] || ""}
                    onChange={(e) =>
                      setParams({ ...params, [param.name]: e.target.value })
                    }
                    placeholder={param.placeholder}
                    rows={2}
                    className="mt-0.5 w-full text-xs border border-border rounded-md px-2 py-1.5 bg-background focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={params[param.name] || ""}
                    onChange={(e) =>
                      setParams({ ...params, [param.name]: e.target.value })
                    }
                    placeholder={param.placeholder}
                    className="mt-0.5 w-full text-xs border border-border rounded-md px-2 py-1.5 bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Dispatch Button */}
          <button
            onClick={handleDispatch}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
            Dispatch to Agent
          </button>
        </div>
      )}
    </div>
  );
}

// ── Dispatch History ───────────────────────────────

function DispatchHistory({
  entries,
  onCopy,
  copiedId,
}: {
  entries: DispatchEntry[];
  onCopy: (entry: DispatchEntry) => void;
  copiedId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) return null;

  return (
    <div className="border rounded-lg bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Dispatch History ({entries.length})
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 max-h-[400px] overflow-y-auto">
          {entries
            .slice()
            .reverse()
            .map((entry) => (
              <div
                key={entry.id}
                className="p-2.5 rounded-md border bg-background/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {entry.status === "completed" ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    ) : entry.status === "failed" ? (
                      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    ) : entry.status === "dispatched" ? (
                      <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className="text-xs font-medium">
                      {entry.commandName}
                    </span>
                    {entry.agent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        → {entry.agent}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onCopy(entry)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedId === entry.id ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(entry.dispatchedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="mt-1 font-mono text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-1 overflow-x-auto">
                  PMOS: {entry.commandName.toLowerCase()}{" "}
                  {Object.entries(entry.params)
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}="${v}"`)
                    .join(" ")}
                </div>
                {entry.response && (
                  <div className="mt-1 text-[10px] text-muted-foreground p-1.5 bg-muted/30 rounded">
                    {entry.response}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────

export function AgentDispatchPanel({ slug }: { slug: string }) {
  const [dispatchHistory, setDispatchHistory] = useState<DispatchEntry[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [customCommand, setCustomCommand] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const filteredCommands =
    filter === "all"
      ? COMMANDS
      : COMMANDS.filter((c) => c.category === filter);

  const handleDispatch = useCallback(
    (command: PMOSCommand, params: Record<string, string>) => {
      // Build the full command string
      let fullCommand = command.command;
      for (const [key, value] of Object.entries(params)) {
        fullCommand = fullCommand.replace(`{${key}}`, value || `{${key}}`);
      }

      const entry: DispatchEntry = {
        id: `dispatch-${Date.now()}`,
        commandId: command.id,
        commandName: command.name,
        params,
        dispatchedAt: new Date().toISOString(),
        status: "dispatched",
        response: `Command copied to clipboard. Paste into your AI coding agent (Claude, Copilot, Cursor, etc.)`,
      };

      setDispatchHistory((prev) => [...prev, entry]);

      // Copy to clipboard
      navigator.clipboard.writeText(fullCommand).then(() => {
        setCopiedId(entry.id);
        setTimeout(() => setCopiedId(null), 2000);
      });

      // Mark as completed after a beat
      setTimeout(() => {
        setDispatchHistory((prev) =>
          prev.map((e) =>
            e.id === entry.id ? { ...e, status: "completed" as const } : e
          )
        );
      }, 1500);
    },
    []
  );

  const handleCopyEntry = useCallback((entry: DispatchEntry) => {
    let fullCommand = `PMOS: ${entry.commandName.toLowerCase()}`;
    for (const [k, v] of Object.entries(entry.params)) {
      if (v) fullCommand += ` ${k}="${v}"`;
    }
    navigator.clipboard.writeText(fullCommand).then(() => {
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const handleCustomDispatch = useCallback(() => {
    if (!customCommand.trim()) return;
    const entry: DispatchEntry = {
      id: `dispatch-${Date.now()}`,
      commandId: "custom",
      commandName: "Custom Command",
      params: { command: customCommand },
      dispatchedAt: new Date().toISOString(),
      status: "dispatched",
      response: "Custom command copied to clipboard.",
    };
    setDispatchHistory((prev) => [...prev, entry]);
    navigator.clipboard.writeText(customCommand).then(() => {
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
    setTimeout(() => {
      setDispatchHistory((prev) =>
        prev.map((e) =>
          e.id === entry.id ? { ...e, status: "completed" as const } : e
        )
      );
    }, 1500);
    setCustomCommand("");
    setShowCustom(false);
  }, [customCommand]);

  // Load persona options for the create-story command
  useEffect(() => {
    fetch(`/api/projects/${slug}/journeys`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const personaNames = data
            .map((j: any) => j.persona)
            .filter(Boolean);
          if (personaNames.length > 0) {
            const createStoryCmd = COMMANDS.find(
              (c) => c.id === "create-story"
            );
            if (createStoryCmd) {
              const personaParam = createStoryCmd.params.find(
                (p) => p.name === "persona"
              );
              if (personaParam) {
                personaParam.options = [
                  "Auto-detect from context",
                  ...personaNames,
                ];
              }
            }
          }
        }
      })
      .catch(() => {});
  }, [slug]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Agent Dispatch</h1>
            <p className="text-sm text-muted-foreground">
              Send commands to AI coding agents directly from PMOS
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors"
        >
          <Terminal className="w-4 h-4" />
          Custom Command
        </button>
      </div>

      {/* How It Works */}
      <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          How Agent Dispatch Works
        </h3>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>
            Select a PMOS command template below and fill in the parameters
          </li>
          <li>
            Click <strong>Dispatch to Agent</strong> — the full command is
            copied to your clipboard
          </li>
          <li>
            Paste the command into your AI coding agent (Claude, GitHub Copilot,
            Cursor, Windsurf, etc.)
          </li>
          <li>
            The agent reads PMOS files at <code>~/.pmos/</code> and executes
            the command
          </li>
          <li>
            Results appear as files in <code>~/.pmos/projects/{slug}/</code>{" "}
            and are reflected in the PMOS UI
          </li>
        </ol>
      </div>

      {/* Custom Command Input */}
      {showCustom && (
        <div className="mb-6 p-4 border rounded-lg bg-card">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            Custom PMOS Command
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              placeholder='e.g. PMOS: create a user story for dark mode support'
              className="flex-1 text-sm border border-border rounded-md px-3 py-2 bg-background focus:ring-1 focus:ring-primary focus:outline-none font-mono"
              onKeyDown={(e) => e.key === "Enter" && handleCustomDispatch()}
            />
            <button
              onClick={handleCustomDispatch}
              disabled={!customCommand.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Dispatch
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {["all", "intelligence", "stories", "pipeline", "management"].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                filter === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {cat === "all"
                ? "All Commands"
                : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          )
        )}
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">
          {filteredCommands.length} commands
        </span>
      </div>

      {/* Command Grid */}
      <div className="space-y-3">
        {filteredCommands.map((cmd) => (
          <CommandCard
            key={cmd.id}
            command={cmd}
            onDispatch={handleDispatch}
          />
        ))}
      </div>

      {/* Dispatch History */}
      <div className="mt-8">
        <DispatchHistory
          entries={dispatchHistory}
          onCopy={handleCopyEntry}
          copiedId={copiedId}
        />
      </div>
    </div>
  );
}
