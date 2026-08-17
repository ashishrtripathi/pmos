// src/app/projects/[slug]/okrs/page.client.tsx
// PMOS 5-Dimension Financial OKR & Story Ranking Matrix
// Normalizes every OKR and Story to U.S. dollars ($) with transparent mathematical logic.

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Target,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  TrendingUp,
  BarChart3,
  Calculator,
  Globe,
  RefreshCw,
  HeartHandshake,
  PiggyBank,
  DollarSign,
  Layers,
  ArrowUpRight,
  Sparkles,
  Link as LinkIcon,
  ExternalLink,
  Bot,
  Save,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  HelpCircle,
  X,
} from "lucide-react";
import type { Objective, KeyResult, Story, ValueDimensions } from "@/types/pmos";
import {
  DIMENSION_METADATA,
  DEFAULT_PRICING,
  PricingParams,
  formatUSD,
  formatROI,
  getROIBadgeClass,
  computeValueDimensions,
  calculateEffortCost,
  aggregateOKRFiscalData,
  createDefaultDimensions,
} from "@/lib/roi-calculator";
import { DollarCalculatorModal } from "@/components/dollar-calculator-modal";
import { StoryDetailModal } from "@/components/story-detail-modal";

const QUARTERS = ["All Quarters", "Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027"];

let krCounter = 0;
function genKRId() {
  krCounter++;
  return `KR-${String(krCounter).padStart(3, "0")}`;
}

function genObjId() {
  return `OBJ-${Date.now().toString(36).toUpperCase()}`;
}

export function OKRsPageClient({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // Data State
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [pricing, setPricing] = useState<PricingParams>(DEFAULT_PRICING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Filter & Search State
  const [selectedQuarter, setSelectedQuarter] = useState<string>("All Quarters");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"roi" | "value" | "effort" | "progress">("roi");

  // Modals & Drawers
  const [calcModalTarget, setCalcModalTarget] = useState<{
    objectiveId: string;
    dimensions: ValueDimensions;
    hours: number;
    title: string;
  } | null>(null);

  const [linkStoryModalObj, setLinkStoryModalObj] = useState<Objective | null>(null);
  const [inspectStory, setInspectStory] = useState<Story | null>(null);
  const [editingObjId, setEditingObjId] = useState<string | null>(null);

  // Initial Fetch
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [okrsRes, storiesRes, pricingRes] = await Promise.all([
        fetch(`/api/projects/${slug}/okrs`),
        fetch(`/api/projects/${slug}/stories`),
        fetch(`/api/projects/${slug}/pricing`),
      ]);

      const okrsData = await okrsRes.json();
      const storiesData = await storiesRes.json();
      const pricingData = await pricingRes.json();

      if (Array.isArray(okrsData)) setObjectives(okrsData);
      if (Array.isArray(storiesData)) setStories(storiesData);
      if (pricingData && !pricingData.error) {
        setPricing({
          developerHourlyRate: pricingData.developerHourlyRate ?? 150,
          costPerToken: pricingData.costPerToken ?? 0.003,
          hoursPerPoint: pricingData.hoursPerPoint ?? 0.35,
        });
      }
    } catch (err) {
      console.error("Failed to load OKR & Stories data", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save all OKRs
  const handleSaveAllOKRs = async (newObjectives?: Objective[]) => {
    const listToSave = newObjectives || objectives;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${slug}/okrs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save-all", objectives: listToSave }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedNotice("✓ All OKRs & Financial Dimensions Saved");
        setTimeout(() => setSavedNotice(null), 3000);
      }
    } catch (err) {
      console.error("Failed to save OKRs", err);
    } finally {
      setSaving(false);
    }
  };

  // Add a new Objective
  const handleAddObjective = () => {
    const defaultDims = createDefaultDimensions(40, pricing);
    const newObj: Objective = {
      id: genObjId(),
      title: "New Strategic Objective",
      description: "Define the strategic outcome and market value in U.S. dollars.",
      quarter: "Q3 2026",
      owner: "Product Manager",
      keyResults: [
        {
          id: genKRId(),
          title: "Achieve target milestone",
          description: "Key verifiable result",
          metric: "completion",
          target: 100,
          current: 0,
          unit: "%",
          owner: "Engineering",
        },
      ],
      dimensions: defaultDims,
      targetValue: defaultDims.totalValue,
      effortCost: defaultDims.effortCost,
      roiMultiple: defaultDims.roiMultiple,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newObj, ...objectives];
    setObjectives(updated);
    setEditingObjId(newObj.id);
    handleSaveAllOKRs(updated);
  };

  // Update Objective field
  const handleUpdateObjective = (id: string, updates: Partial<Objective>) => {
    setObjectives((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o))
    );
  };

  // Delete Objective
  const handleDeleteObjective = (id: string) => {
    if (!confirm("Are you sure you want to delete this OKR?")) return;
    const filtered = objectives.filter((o) => o.id !== id);
    setObjectives(filtered);
    handleSaveAllOKRs(filtered);
  };

  // Link/Unlink Story to Objective
  const handleToggleStoryLink = async (storyId: string, objectiveId: string | undefined) => {
    try {
      const res = await fetch(`/api/projects/${slug}/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: storyId,
          updates: { objectiveId: objectiveId || null },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStories((prev) =>
          prev.map((s) => (s.id === storyId ? { ...s, objectiveId: objectiveId || undefined } : s))
        );
      }
    } catch (err) {
      console.error("Failed to link story", err);
    }
  };

  // Save dimensions from Dollar Calculator Modal
  const handleApplyDimensions = (dims: ValueDimensions) => {
    if (!calcModalTarget) return;
    const { objectiveId } = calcModalTarget;

    setObjectives((prev) => {
      const updated = prev.map((o) => {
        if (o.id === objectiveId) {
          return {
            ...o,
            dimensions: dims,
            targetValue: dims.totalValue,
            effortCost: dims.effortCost,
            roiMultiple: dims.roiMultiple,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      });
      handleSaveAllOKRs(updated);
      return updated;
    });

    setCalcModalTarget(null);
  };

  // Computed Portfolio Aggregations across all OKRs
  const okrsAggregated = useMemo(() => {
    return objectives.map((obj) => {
      const agg = aggregateOKRFiscalData(obj, stories, pricing);
      return {
        ...obj,
        agg,
      };
    });
  }, [objectives, stories, pricing]);

  // Filtered and Sorted OKRs
  const filteredAndSortedOKRs = useMemo(() => {
    let list = okrsAggregated.filter((item) => {
      if (selectedQuarter !== "All Quarters" && item.quarter !== selectedQuarter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = (item.description || "").toLowerCase().includes(q);
        const matchesKR = item.keyResults.some((kr) => kr.title.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesKR) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "roi") return (b.agg.roiMultiple || 0) - (a.agg.roiMultiple || 0);
      if (sortBy === "value") return (b.agg.totalValue || 0) - (a.agg.totalValue || 0);
      if (sortBy === "effort") return (b.agg.effortCost || 0) - (a.agg.effortCost || 0);
      if (sortBy === "progress") return (b.agg.completionPercent || 0) - (a.agg.completionPercent || 0);
      return 0;
    });

    return list;
  }, [okrsAggregated, selectedQuarter, searchQuery, sortBy]);

  // Overall Portfolio Totals across 5 Dimensions
  const portfolioTotals = useMemo(() => {
    let strategicSum = 0;
    let newRevSum = 0;
    let renewalSum = 0;
    let cxSum = 0;
    let costSum = 0;
    let totalEffort = 0;
    let totalDelivered = 0;

    for (const item of okrsAggregated) {
      strategicSum += item.agg.dimensions.strategicAlignment?.value || 0;
      newRevSum += item.agg.dimensions.newRevenueImpact?.value || 0;
      renewalSum += item.agg.dimensions.renewalRevenueImpact?.value || 0;
      cxSum += item.agg.dimensions.improveCustomerExperience?.value || 0;
      costSum += item.agg.dimensions.lowersCost?.value || 0;
      totalEffort += item.agg.effortCost || 0;
      totalDelivered += item.agg.deliveredValue || 0;
    }

    const totalValue = strategicSum + newRevSum + renewalSum + cxSum + costSum;
    const safeEffort = Math.max(1, totalEffort);
    const overallROI = totalValue > 0 ? totalValue / safeEffort : 0;

    return {
      strategicSum,
      newRevSum,
      renewalSum,
      cxSum,
      costSum,
      totalValue,
      totalEffort: safeEffort,
      overallROI,
      totalDelivered,
    };
  }, [okrsAggregated]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                OKR Financial Scoring & Value Ranking Matrix
              </h1>
              <p className="text-xs text-muted-foreground">
                Every OKR & Story normalized to <strong>U.S. Dollars ($)</strong> across 5 financial dimensions.
                Ranked by <strong>Value-to-Effort ROI Multiple ($ / $)</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedNotice && (
            <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
              {savedNotice}
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSaveAllOKRs()}
            disabled={saving}
            className="px-3.5 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save OKRs"}</span>
          </button>

          <button
            type="button"
            onClick={handleAddObjective}
            className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New OKR</span>
          </button>
        </div>
      </div>

      {/* 5-Dimension Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Strategic Alignment */}
        <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-300">
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              Strategic
            </span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-mono">
              Dim 1
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-blue-900 dark:text-blue-100">
            {formatUSD(portfolioTotals.strategicSum)}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">Market visibility & milestones</div>
        </div>

        {/* 2. New Revenue Impact */}
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              New Revenue
            </span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono">
              Dim 2
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-900 dark:text-emerald-100">
            {formatUSD(portfolioTotals.newRevSum)}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">New accounts & direct sales</div>
        </div>

        {/* 3. Renewal Revenue Impact */}
        <div className="p-3.5 rounded-xl border border-violet-200 dark:border-violet-900/50 bg-violet-50/40 dark:bg-violet-950/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-violet-700 dark:text-violet-300">
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
              Renewal
            </span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200 font-mono">
              Dim 3
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-violet-900 dark:text-violet-100">
            {formatUSD(portfolioTotals.renewalSum)}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">Retention & expansion ARR</div>
        </div>

        {/* 4. Improve Customer Experience */}
        <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-300">
            <span className="flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5" />
              Customer Exp
            </span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-mono">
              Dim 4
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-900 dark:text-amber-100">
            {formatUSD(portfolioTotals.cxSum)}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">Lowers churn & friction</div>
        </div>

        {/* 5. Lowers Cost */}
        <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/40 dark:bg-teal-950/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-teal-700 dark:text-teal-300">
            <span className="flex items-center gap-1">
              <PiggyBank className="w-3.5 h-3.5" />
              Lowers Cost
            </span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-mono">
              Dim 5
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-teal-900 dark:text-teal-100">
            {formatUSD(portfolioTotals.costSum)}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">Labor hours saved × rate</div>
        </div>

        {/* Portfolio ROI Multiple */}
        <div className="p-3.5 rounded-xl border-2 border-primary/40 bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-primary">
            <span>Portfolio ROI</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-primary/10 font-mono">Total</span>
          </div>
          <div className="text-xl font-bold font-mono text-primary">
            {formatROI(portfolioTotals.overallROI)}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {formatUSD(portfolioTotals.totalValue)} / {formatUSD(portfolioTotals.totalEffort)}
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search & Sort */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Quarter selector */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none"
            >
              {QUARTERS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter OKRs & metrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-[11px] font-semibold">Rank by:</span>
          <div className="flex rounded-lg border border-border overflow-hidden bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setSortBy("roi")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                sortBy === "roi" ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ROI Multiple
            </button>
            <button
              type="button"
              onClick={() => setSortBy("value")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                sortBy === "value" ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dollar Value ($)
            </button>
            <button
              type="button"
              onClick={() => setSortBy("effort")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                sortBy === "effort" ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Effort Cost ($)
            </button>
            <button
              type="button"
              onClick={() => setSortBy("progress")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                sortBy === "progress" ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Progress (%)
            </button>
          </div>
        </div>
      </div>

      {/* Main Ranked OKR Leaderboard Matrix Table */}
      <div className="space-y-4">
        {filteredAndSortedOKRs.length === 0 && !loading && (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-border bg-card">
            <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <h3 className="text-base font-bold text-foreground">No OKRs Found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Create your first strategic objective with 5-dimension dollar value scoring and link it to user stories.
            </p>
            <button
              type="button"
              onClick={handleAddObjective}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs"
            >
              + Create Strategic OKR
            </button>
          </div>
        )}

        {filteredAndSortedOKRs.map((item, index) => {
          const rank = index + 1;
          const { agg } = item;
          const dims = agg.dimensions;
          const isEditing = editingObjId === item.id;

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-card shadow-xs hover:border-primary/40 transition-all overflow-hidden"
            >
              {/* OKR Header Card */}
              <div className="p-5 border-b border-border/80 bg-muted/10 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Rank, Title, Quarter, Owner */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono text-sm shrink-0 border shadow-2xs ${
                        rank === 1
                          ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                          : rank === 2
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                          : rank === 3
                          ? "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      #{rank}
                    </div>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateObjective(item.id, { title: e.target.value })}
                            className="w-full px-3 py-1.5 rounded-lg border border-primary bg-background text-base font-bold"
                            placeholder="Objective Title"
                          />
                          <input
                            type="text"
                            value={item.description || ""}
                            onChange={(e) => handleUpdateObjective(item.id, { description: e.target.value })}
                            className="w-full px-3 py-1 rounded-lg border border-border bg-background text-xs text-muted-foreground"
                            placeholder="Objective Description"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-foreground hover:text-primary transition-colors">
                              {item.title}
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                              {item.id}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-md bg-muted font-semibold text-[11px]">
                          {item.quarter}
                        </span>
                        <span>
                          Owner: <strong>{item.owner || "Team"}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          <strong>{agg.linkedStories.length}</strong> linked stories
                        </span>
                        <span>•</span>
                        <span>
                          <strong>{item.keyResults.length}</strong> key results
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: ROI Multiple Badge & Total Value Score */}
                  <div className="flex items-center gap-4 shrink-0 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-border">
                    {/* Dollar Score Preview */}
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                        Total Dollar Value
                      </div>
                      <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatUSD(agg.totalValue)}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Effort Cost: {formatUSD(agg.effortCost)}
                      </div>
                    </div>

                    {/* ROI Multiple Badge */}
                    <div className="text-center">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                        ROI Multiple
                      </div>
                      <div
                        className={`px-3 py-1 rounded-xl text-lg font-bold font-mono border mt-0.5 shadow-2xs ${getROIBadgeClass(
                          agg.roiMultiple
                        )}`}
                      >
                        {formatROI(agg.roiMultiple)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setCalcModalTarget({
                            objectiveId: item.id,
                            dimensions: dims,
                            hours: Math.round(agg.effortCost / (pricing.developerHourlyRate || 150)),
                            title: `Calculate Dollar Value for: ${item.title}`,
                          })
                        }
                        className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs"
                        title="Open Dollar Value & ROI Calculator"
                      >
                        <Calculator className="w-4 h-4" />
                        <span className="hidden sm:inline">Calc ($)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLinkStoryModalObj(item)}
                        className="p-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs"
                        title="Link User Stories to this OKR"
                      >
                        <LinkIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="hidden sm:inline">Link Stories</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingObjId(isEditing ? null : item.id)}
                        className="p-2 rounded-xl border border-border hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-all"
                        title="Edit OKR Title & Description"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteObjective(item.id)}
                        className="p-2 rounded-xl border border-border hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 text-muted-foreground transition-all"
                        title="Delete Objective"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5 Dimension Pillars Breakdown Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-3 border-t border-border/60">
                  {/* Dim 1: Strategic Alignment */}
                  <div
                    className="p-2.5 rounded-xl border bg-blue-50/30 dark:bg-blue-950/10 border-blue-200/60 dark:border-blue-900/40"
                    title={`Strategic Alignment Logic: ${dims.strategicAlignment?.logic || "No rationale"}`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-blue-700 dark:text-blue-300">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        1. Strategic
                      </span>
                    </div>
                    <div className="text-sm font-bold font-mono text-blue-900 dark:text-blue-100 mt-0.5">
                      {formatUSD(dims.strategicAlignment?.value)}
                    </div>
                    <div className="text-[9px] text-muted-foreground truncate" title={dims.strategicAlignment?.logic}>
                      {dims.strategicAlignment?.logic || "Strategic visibility"}
                    </div>
                  </div>

                  {/* Dim 2: New Revenue Impact */}
                  <div
                    className="p-2.5 rounded-xl border bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/40"
                    title={`New Revenue Logic: ${dims.newRevenueImpact?.logic || "No rationale"}`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        2. New Revenue
                      </span>
                    </div>
                    <div className="text-sm font-bold font-mono text-emerald-900 dark:text-emerald-100 mt-0.5">
                      {formatUSD(dims.newRevenueImpact?.value)}
                    </div>
                    <div className="text-[9px] text-muted-foreground truncate" title={dims.newRevenueImpact?.logic}>
                      {dims.newRevenueImpact?.logic || "New sales & deals"}
                    </div>
                  </div>

                  {/* Dim 3: Renewal Revenue Impact */}
                  <div
                    className="p-2.5 rounded-xl border bg-violet-50/30 dark:bg-violet-950/10 border-violet-200/60 dark:border-violet-900/40"
                    title={`Renewal Revenue Logic: ${dims.renewalRevenueImpact?.logic || "No rationale"}`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-violet-700 dark:text-violet-300">
                      <span className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        3. Renewal
                      </span>
                    </div>
                    <div className="text-sm font-bold font-mono text-violet-900 dark:text-violet-100 mt-0.5">
                      {formatUSD(dims.renewalRevenueImpact?.value)}
                    </div>
                    <div className="text-[9px] text-muted-foreground truncate" title={dims.renewalRevenueImpact?.logic}>
                      {dims.renewalRevenueImpact?.logic || "Retention & expansion"}
                    </div>
                  </div>

                  {/* Dim 4: Improve Customer Experience */}
                  <div
                    className="p-2.5 rounded-xl border bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/60 dark:border-amber-900/40"
                    title={`Customer Experience Logic: ${dims.improveCustomerExperience?.logic || "No rationale"}`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      <span className="flex items-center gap-1">
                        <HeartHandshake className="w-3 h-3" />
                        4. Customer Exp
                      </span>
                    </div>
                    <div className="text-sm font-bold font-mono text-amber-900 dark:text-amber-100 mt-0.5">
                      {formatUSD(dims.improveCustomerExperience?.value)}
                    </div>
                    <div className="text-[9px] text-muted-foreground truncate" title={dims.improveCustomerExperience?.logic}>
                      {dims.improveCustomerExperience?.logic || "Lowers churn & friction"}
                    </div>
                  </div>

                  {/* Dim 5: Lowers Cost */}
                  <div
                    className="p-2.5 rounded-xl border bg-teal-50/30 dark:bg-teal-950/10 border-teal-200/60 dark:border-teal-900/40"
                    title={`Cost Reduction Logic: ${dims.lowersCost?.logic || "No rationale"}`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-teal-700 dark:text-teal-300">
                      <span className="flex items-center gap-1">
                        <PiggyBank className="w-3 h-3" />
                        5. Lowers Cost
                      </span>
                    </div>
                    <div className="text-sm font-bold font-mono text-teal-900 dark:text-teal-100 mt-0.5">
                      {formatUSD(dims.lowersCost?.value)}
                    </div>
                    <div className="text-[9px] text-muted-foreground truncate" title={dims.lowersCost?.logic}>
                      {dims.lowersCost?.logic || "Labor & task automation"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked User Stories & Key Results Body */}
              <div className="p-4 space-y-4">
                {/* Linked User Stories Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      Linked User Stories ({agg.linkedStories.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() => setLinkStoryModalObj(item)}
                      className="text-primary hover:underline text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Link Story</span>
                    </button>
                  </div>

                  {agg.linkedStories.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {agg.linkedStories.map((story) => {
                        const storyVal = story.dimensions?.totalValue || story.estimatedValue || 0;
                        const isDone = story.status === "done";
                        return (
                          <div
                            key={story.id}
                            onClick={() => setInspectStory(story)}
                            className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${
                              isDone
                                ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                                : "bg-card border-border hover:border-primary/40 text-foreground"
                            }`}
                          >
                            <span className="font-mono font-bold">{story.id}</span>
                            <span className="truncate max-w-[180px] font-medium">{story.title}</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatUSD(storyVal)}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                                isDone
                                  ? "bg-emerald-200/60 text-emerald-900"
                                  : story.status === "in-progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {story.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground/80 italic py-1">
                      No user stories linked yet. Click <strong>Link Story</strong> to attach user stories and feed their 5-dimension dollar value into this OKR.
                    </div>
                  )}
                </div>

                {/* Key Results Section */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-primary" />
                      Key Results ({item.keyResults.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newKR: KeyResult = {
                          id: genKRId(),
                          title: "New Key Result",
                          description: "",
                          metric: "completion",
                          target: 100,
                          current: 0,
                          unit: "%",
                          owner: item.owner || "Engineering",
                        };
                        handleUpdateObjective(item.id, { keyResults: [...item.keyResults, newKR] });
                      }}
                      className="text-primary hover:underline text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Key Result</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {item.keyResults.map((kr, krIdx) => {
                      const pct = kr.target > 0 ? Math.min(100, Math.round((kr.current / kr.target) * 100)) : 0;
                      return (
                        <div
                          key={kr.id}
                          className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                value={kr.title}
                                onChange={(e) => {
                                  const updatedKRs = [...item.keyResults];
                                  updatedKRs[krIdx] = { ...kr, title: e.target.value };
                                  handleUpdateObjective(item.id, { keyResults: updatedKRs });
                                }}
                                className="w-full text-xs font-bold bg-transparent border-b border-transparent focus:border-primary focus:outline-none"
                                placeholder="Key Result title"
                              />
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                                <span>Target:</span>
                                <input
                                  type="number"
                                  value={kr.target}
                                  onChange={(e) => {
                                    const updatedKRs = [...item.keyResults];
                                    updatedKRs[krIdx] = { ...kr, target: Number(e.target.value) };
                                    handleUpdateObjective(item.id, { keyResults: updatedKRs });
                                  }}
                                  className="w-14 px-1 py-0.5 rounded bg-card border border-border font-mono text-center"
                                />
                                <input
                                  type="text"
                                  value={kr.unit}
                                  onChange={(e) => {
                                    const updatedKRs = [...item.keyResults];
                                    updatedKRs[krIdx] = { ...kr, unit: e.target.value };
                                    handleUpdateObjective(item.id, { keyResults: updatedKRs });
                                  }}
                                  className="w-12 px-1 py-0.5 rounded bg-card border border-border text-center"
                                  placeholder="unit"
                                />
                                <span>→ Current:</span>
                                <input
                                  type="number"
                                  value={kr.current}
                                  onChange={(e) => {
                                    const updatedKRs = [...item.keyResults];
                                    updatedKRs[krIdx] = { ...kr, current: Number(e.target.value) };
                                    handleUpdateObjective(item.id, { keyResults: updatedKRs });
                                  }}
                                  className="w-14 px-1 py-0.5 rounded bg-card border border-border font-mono text-center font-bold"
                                />
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span
                                className={`text-xs font-bold font-mono ${
                                  pct >= 100
                                    ? "text-emerald-600"
                                    : pct >= 50
                                    ? "text-blue-600"
                                    : "text-amber-600"
                                }`}
                              >
                                {pct}%
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedKRs = item.keyResults.filter((_, i) => i !== krIdx);
                                  handleUpdateObjective(item.id, { keyResults: updatedKRs });
                                }}
                                className="block text-muted-foreground hover:text-red-500 mt-1 p-0.5"
                              >
                                <Trash2 className="w-3 h-3 ml-auto" />
                              </button>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dollar Calculator Modal */}
      {calcModalTarget && (
        <DollarCalculatorModal
          initialDimensions={calcModalTarget.dimensions}
          estimatedHours={calcModalTarget.hours}
          pricing={pricing}
          title={calcModalTarget.title}
          onApply={handleApplyDimensions}
          onClose={() => setCalcModalTarget(null)}
        />
      )}

      {/* Link Stories Modal */}
      {linkStoryModalObj && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLinkStoryModalObj(null)}
        >
          <div
            className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Link User Stories to OKR</h3>
                  <p className="text-xs text-muted-foreground truncate max-w-md">
                    {linkStoryModalObj.title} ({linkStoryModalObj.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLinkStoryModalObj(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Select user stories to link to this OKR. Their 5 financial dimensions ($) will aggregate directly into this strategic objective.
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto pt-1">
                {stories.map((story) => {
                  const isLinked = story.objectiveId === linkStoryModalObj.id;
                  const isLinkedOther = story.objectiveId && story.objectiveId !== linkStoryModalObj.id;
                  const storyVal = story.dimensions?.totalValue || story.estimatedValue || 0;

                  return (
                    <div
                      key={story.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        isLinked
                          ? "bg-primary/10 border-primary shadow-2xs"
                          : "bg-muted/30 border-border hover:bg-muted/60"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs">{story.id}</span>
                          <span className="text-xs font-semibold text-foreground truncate">
                            {story.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold uppercase">
                            {story.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                          <span>
                            Value: <strong className="text-emerald-600 font-mono">{formatUSD(storyVal)}</strong>
                          </span>
                          <span>•</span>
                          <span>{story.estimatedHours || 1}h labor</span>
                          {isLinkedOther && (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              (Linked to {story.objectiveId})
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleStoryLink(story.id, isLinked ? undefined : linkStoryModalObj.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                          isLinked
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-card border border-border hover:bg-primary hover:text-primary-foreground"
                        }`}
                      >
                        {isLinked ? "✓ Linked" : "+ Link"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setLinkStoryModalObj(null)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Inspection Modal */}
      {inspectStory && (
        <StoryDetailModal
          story={{ ...inspectStory, description: inspectStory.description || "" }}
          onClose={() => setInspectStory(null)}
          onSave={async (updated) => {
            await fetch(`/api/projects/${slug}/stories`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "update", id: updated.id, updates: updated }),
            });
            setStories((prev) => prev.map((s) => (s.id === updated.id ? ({ ...s, ...updated } as Story) : s)));
            setInspectStory(null);
          }}
          pricing={{
            developerHourlyRate: pricing.developerHourlyRate ?? 150,
            hoursPerPoint: pricing.hoursPerPoint ?? 0.35,
            aiOverheadPercent: pricing.aiOverheadPercent ?? 14,
            model: pricing.model ?? "claude-sonnet-4",
          }}
        />
      )}
    </div>
  );
}