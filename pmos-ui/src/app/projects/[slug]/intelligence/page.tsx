import { getIntelligence } from "@/lib/pmos";
import { Brain } from "lucide-react";
import { markdownToHtml } from "@/lib/pmos";

const TABS = [
  { key: "architecture", label: "Architecture" },
  { key: "techStack", label: "Tech Stack" },
  { key: "features", label: "Features" },
  { key: "codeQuality", label: "Code Quality" },
  { key: "improvements", label: "Improvements" },
  { key: "apiDocs", label: "API Docs" },
  { key: "missingDocs", label: "Missing Docs" },
] as const;

export default async function IntelligencePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tab?: string };
}) {
  const { slug } = params;
  const activeTab = searchParams.tab || "architecture";
  const intel = getIntelligence(slug);

  const content = intel[activeTab as keyof typeof intel] || "No data available for this section.";

  const html = await markdownToHtml(content);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-5 h-5" />
        <h1 className="text-2xl font-bold">Code Intelligence</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {TABS.map((tab) => (
          <a
            key={tab.key}
            href={`/projects/${slug}/intelligence?tab=${tab.key}`}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <div
          className="markdown-content text-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
