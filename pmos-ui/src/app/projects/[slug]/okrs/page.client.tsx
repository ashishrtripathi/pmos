// src/app/projects/[slug]/okrs/page.client.tsx
// PMOS 5-Dimension Financial OKR Spreadsheet & Hierarchical Review Matrix
// Normalizes every Objective and Key Result to U.S. dollars ($) with transparent mathematical logic.

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
  Table as TableIcon,
  LayoutGrid,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CornerDownRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { Objective, KeyResult, Story, ValueDimensions, FinancialDimension } from "@/types/pmos";
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

type SortField =
  | "title"
  | "strategic"
  | "newRevenue"
  | "renewal"
  | "cx"
  | "cost"
  | "totalValue"
  | "effort"
  | "roi"
  | "progress";

let krCounter = 100;
function genKRId() {
  krCounter++;
  return `KR-${String(krCounter).padStart(3, "0")}`;
}

function genObjId() {
  return `OBJ-${Date.now().toString(36).toUpperCase().slice(-4)}`;
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

  // View & UI State
  const [viewMode, setViewMode] = useState<"spreadsheet" | "cards">("spreadsheet");
  const [expandedObjs, setExpandedObjs] = useState<Record<string, boolean>>({});
  const [selectedQuarter, setSelectedQuarter] = useState<string>("All Quarters");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sort State
  const [sortField, setSortField] = useState<SortField>("roi");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Modals & Drawers
  const [calcModalTarget, setCalcModalTarget] = useState<{
    objectiveId: string;
    dimensions: ValueDimensions;
    hours: number;
    title: string;
  } | null>(null);

  const [linkStoryModalObj, setLinkStoryModalObj] = useState<Objective | null>(null);
  const [inspectStory, setInspectStory] = useState<Story | null>(null);

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

      if (Array.isArray(okrsData)) {
        setObjectives(okrsData);
        // Expand all by default
        const initExpanded: Record<string, boolean> = {};
        okrsData.forEach((o) => {
          initExpanded[o.id] = true;
        });
        setExpandedObjs(initExpanded);
      }
      if (Array.isArray(storiesData)) setStories(storiesData);
      if (pricingData && !pricingData.error) {
        setPricing({
          developerHourlyRate: pricingData.developerHourlyRate ?? 150,
          costPerToken: pricingData.costPerToken ?? 0.003,
          hoursPerPoint: pricingData.hoursPerPoint ?? 0.35,
          aiOverheadPercent: pricingData.aiOverheadPercent ?? 14,
          model: pricingData.model ?? "claude-sonnet-4",
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
        setSavedNotice("✓ Saved to Database");
        setTimeout(() => setSavedNotice(null), 2500);
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
          title: "Achieve verifiable target milestone",
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
    setExpandedObjs((prev) => ({ ...prev, [newObj.id]: true }));
    handleSaveAllOKRs(updated);
  };

  // Delete Objective
  const handleDeleteObjective = (id: string) => {
    if (!confirm("Are you sure you want to delete this OKR?")) return;
    const filtered = objectives.filter((o) => o.id !== id);
    setObjectives(filtered);
    handleSaveAllOKRs(filtered);
  };

  // Update specific Objective field
  const handleUpdateObjective = (id: string, updates: Partial<Objective>) => {
    setObjectives((prev) => {
      const updated = prev.map((o) => {
        if (o.id !== id) return o;
        const merged = { ...o, ...updates, updatedAt: new Date().toISOString() };
        return merged;
      });
      return updated;
    });
  };

  // Update specific dimension value inline in spreadsheet cell
  const handleUpdateDimensionValue = (
    objId: string,
    dimKey: keyof ValueDimensions,
    newValue: number
  ) => {
    setObjectives((prev) => {
      const updated = prev.map((obj) => {
        if (obj.id !== objId) return obj;
        const currentDims = obj.dimensions || createDefaultDimensions(40, pricing);
        const prevDim = currentDims[dimKey] as FinancialDimension;

        const updatedDim: FinancialDimension = {
          value: Math.max(0, newValue),
          logic: prevDim?.logic || `${DIMENSION_METADATA[dimKey as keyof typeof DIMENSION_METADATA]?.label || "Dimension"}: $${newValue.toLocaleString()}`,
        };

        const newDimsMap = {
          ...currentDims,
          [dimKey]: updatedDim,
        };

        const recomputed = computeValueDimensions(
          {
            strategicAlignment: newDimsMap.strategicAlignment,
            newRevenueImpact: newDimsMap.newRevenueImpact,
            renewalRevenueImpact: newDimsMap.renewalRevenueImpact,
            improveCustomerExperience: newDimsMap.improveCustomerExperience,
            lowersCost: newDimsMap.lowersCost,
          },
          obj.effortCost || currentDims.effortCost || 4500
        );

        return {
          ...obj,
          dimensions: recomputed,
          targetValue: recomputed.totalValue,
          roiMultiple: recomputed.roiMultiple,
          updatedAt: new Date().toISOString(),
        };
      });

      return updated;
    });
  };

  // Update Effort Cost inline
  const handleUpdateEffortCost = (objId: string, newEffort: number) => {
    setObjectives((prev) => {
      const updated = prev.map((obj) => {
        if (obj.id !== objId) return obj;
        const currentDims = obj.dimensions || createDefaultDimensions(40, pricing);
        const effort = Math.max(1, newEffort);
        const recomputed = computeValueDimensions(
          {
            strategicAlignment: currentDims.strategicAlignment,
            newRevenueImpact: currentDims.newRevenueImpact,
            renewalRevenueImpact: currentDims.renewalRevenueImpact,
            improveCustomerExperience: currentDims.improveCustomerExperience,
            lowersCost: currentDims.lowersCost,
          },
          effort
        );

        return {
          ...obj,
          effortCost: effort,
          dimensions: recomputed,
          roiMultiple: recomputed.roiMultiple,
          updatedAt: new Date().toISOString(),
        };
      });

      return updated;
    });
  };

  // Add Key Result to an Objective
  const handleAddKR = (objId: string) => {
    const newKR: KeyResult = {
      id: genKRId(),
      title: "New Key Result milestone",
      description: "",
      metric: "target",
      target: 100,
      current: 0,
      unit: "%",
      owner: "Engineering",
    };

    setObjectives((prev) => {
      const updated = prev.map((o) => {
        if (o.id !== objId) return o;
        return {
          ...o,
          keyResults: [...o.keyResults, newKR],
          updatedAt: new Date().toISOString(),
        };
      });
      handleSaveAllOKRs(updated);
      return updated;
    });

    setExpandedObjs((prev) => ({ ...prev, [objId]: true }));
  };

  // Update Key Result inline
  const handleUpdateKR = (objId: string, krId: string, updates: Partial<KeyResult>) => {
    setObjectives((prev) => {
      const updated = prev.map((o) => {
        if (o.id !== objId) return o;
        const updatedKRs = o.keyResults.map((kr) => (kr.id === krId ? { ...kr, ...updates } : kr));
        return {
          ...o,
          keyResults: updatedKRs,
          updatedAt: new Date().toISOString(),
        };
      });
      return updated;
    });
  };

  // Delete Key Result
  const handleDeleteKR = (objId: string, krId: string) => {
    setObjectives((prev) => {
      const updated = prev.map((o) => {
        if (o.id !== objId) return o;
        return {
          ...o,
          keyResults: o.keyResults.filter((kr) => kr.id !== krId),
          updatedAt: new Date().toISOString(),
        };
      });
      handleSaveAllOKRs(updated);
      return updated;
    });
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
          prev.map((s) => (s.id === storyId ? ({ ...s, objectiveId: objectiveId || undefined } as Story) : s))
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

  // Sort click handler
  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Toggle all expansions
  const handleToggleExpandAll = () => {
    const allExpanded = Object.values(expandedObjs).every(Boolean);
    const next: Record<string, boolean> = {};
    objectives.forEach((o) => {
      next[o.id] = !allExpanded;
    });
    setExpandedObjs(next);
  };

  // Export Spreadsheet to CSV
  const handleExportCSV = () => {
    const rows = [
      [
        "Type",
        "ID",
        "Title",
        "Quarter",
        "Owner",
        "Progress (%)",
        "Strategic Alignment ($)",
        "New Revenue ($)",
        "Renewal Revenue ($)",
        "Customer Experience ($)",
        "Lowers Cost ($)",
        "Total Value ($)",
        "Effort Cost ($)",
        "ROI Multiple",
        "Linked Stories Count",
      ],
    ];

    objectives.forEach((obj) => {
      const agg = aggregateOKRFiscalData(obj, stories, pricing);
      const dims = agg.dimensions;
      rows.push([
        "Objective",
        obj.id,
        `"${obj.title.replace(/"/g, '""')}"`,
        obj.quarter,
        obj.owner,
        String(agg.completionPercent),
        String(dims.strategicAlignment?.value || 0),
        String(dims.newRevenueImpact?.value || 0),
        String(dims.renewalRevenueImpact?.value || 0),
        String(dims.improveCustomerExperience?.value || 0),
        String(dims.lowersCost?.value || 0),
        String(agg.totalValue),
        String(agg.effortCost),
        String(agg.roiMultiple),
        String(agg.linkedStories.length),
      ]);

      obj.keyResults.forEach((kr) => {
        const pct = kr.target > 0 ? Math.round((kr.current / kr.target) * 100) : 0;
        rows.push([
          "  Key Result",
          kr.id,
          `"  ↳ ${kr.title.replace(/"/g, '""')}"`,
          obj.quarter,
          kr.owner || obj.owner,
          String(pct),
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
        ]);
      });
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PMOS_OKRs_${slug}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Filtered and Sorted OKRs for Spreadsheet
  const sortedOKRs = useMemo(() => {
    let list = okrsAggregated.filter((item) => {
      if (selectedQuarter !== "All Quarters" && item.quarter !== selectedQuarter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = (item.description || "").toLowerCase().includes(q);
        const matchesOwner = (item.owner || "").toLowerCase().includes(q);
        const matchesKR = item.keyResults.some((kr) => kr.title.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesOwner && !matchesKR) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      const dir = sortDirection === "asc" ? 1 : -1;

      switch (sortField) {
        case "title":
          return dir * a.title.localeCompare(b.title);
        case "strategic":
          valA = a.agg.dimensions.strategicAlignment?.value || 0;
          valB = b.agg.dimensions.strategicAlignment?.value || 0;
          break;
        case "newRevenue":
          valA = a.agg.dimensions.newRevenueImpact?.value || 0;
          valB = b.agg.dimensions.newRevenueImpact?.value || 0;
          break;
        case "renewal":
          valA = a.agg.dimensions.renewalRevenueImpact?.value || 0;
          valB = b.agg.dimensions.renewalRevenueImpact?.value || 0;
          break;
        case "cx":
          valA = a.agg.dimensions.improveCustomerExperience?.value || 0;
          valB = b.agg.dimensions.improveCustomerExperience?.value || 0;
          break;
        case "cost":
          valA = a.agg.dimensions.lowersCost?.value || 0;
          valB = b.agg.dimensions.lowersCost?.value || 0;
          break;
        case "totalValue":
          valA = a.agg.totalValue || 0;
          valB = b.agg.totalValue || 0;
          break;
        case "effort":
          valA = a.agg.effortCost || 0;
          valB = b.agg.effortCost || 0;
          break;
        case "progress":
          valA = a.agg.completionPercent || 0;
          valB = b.agg.completionPercent || 0;
          break;
        case "roi":
        default:
          valA = a.agg.roiMultiple || 0;
          valB = b.agg.roiMultiple || 0;
          break;
      }

      return dir * (valA - valB);
    });

    return list;
  }, [okrsAggregated, selectedQuarter, searchQuery, sortField, sortDirection]);

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

  // Render Sort Indicator Icon
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 inline ml-1" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary inline ml-1 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary inline ml-1 font-bold" />
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-[100vw] mx-auto space-y-5 animate-in fade-in">
      {/* Top Header & Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                OKR Financial Review & Spreadsheet
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold">
                  5 Dimensions ($)
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Edit financial dimensions directly in cells. Hierarchical rollup from Key Results to Objectives.
                Ranked by <strong>ROI Multiple ($ Value / $ Effort)</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {savedNotice && (
            <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
              {savedNotice}
            </div>
          )}

          {/* View Switcher: Spreadsheet vs Cards */}
          <div className="flex rounded-xl border border-border p-0.5 bg-muted/40 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("spreadsheet")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === "spreadsheet"
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Spreadsheet Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === "cards"
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Executive Cards</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
            title="Download OKR Review as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAllOKRs()}
            disabled={saving}
            className="px-3.5 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save All"}</span>
          </button>

          <button
            type="button"
            onClick={handleAddObjective}
            className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Objective</span>
          </button>
        </div>
      </div>

      {/* 5-Dimension Summary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* 1. Strategic Alignment */}
        <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 shadow-2xs space-y-0.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-300">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              1. Strategic ($)
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-blue-900 dark:text-blue-100">
            {formatUSD(portfolioTotals.strategicSum)}
          </div>
          <div className="text-[9px] text-muted-foreground truncate">Market entry & visibility</div>
        </div>

        {/* 2. New Revenue Impact */}
        <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-2xs space-y-0.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              2. New Rev ($)
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-900 dark:text-emerald-100">
            {formatUSD(portfolioTotals.newRevSum)}
          </div>
          <div className="text-[9px] text-muted-foreground truncate">New accounts & ACV</div>
        </div>

        {/* 3. Renewal Revenue Impact */}
        <div className="p-3 rounded-xl border border-violet-200 dark:border-violet-900/50 bg-violet-50/40 dark:bg-violet-950/20 shadow-2xs space-y-0.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-violet-700 dark:text-violet-300">
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              3. Renewal ($)
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-violet-900 dark:text-violet-100">
            {formatUSD(portfolioTotals.renewalSum)}
          </div>
          <div className="text-[9px] text-muted-foreground truncate">Retention & expansion</div>
        </div>

        {/* 4. Improve Customer Experience */}
        <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 shadow-2xs space-y-0.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-300">
            <span className="flex items-center gap-1">
              <HeartHandshake className="w-3 h-3" />
              4. CX / Churn ($)
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-amber-900 dark:text-amber-100">
            {formatUSD(portfolioTotals.cxSum)}
          </div>
          <div className="text-[9px] text-muted-foreground truncate">Friction & churn reduction</div>
        </div>

        {/* 5. Lowers Cost */}
        <div className="p-3 rounded-xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/40 dark:bg-teal-950/20 shadow-2xs space-y-0.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-teal-700 dark:text-teal-300">
            <span className="flex items-center gap-1">
              <PiggyBank className="w-3 h-3" />
              5. Cost Saved ($)
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-teal-900 dark:text-teal-100">
            {formatUSD(portfolioTotals.costSum)}
          </div>
          <div className="text-[9px] text-muted-foreground truncate">Labor hours automated</div>
        </div>

        {/* Portfolio ROI Multiple */}
        <div className="p-3 rounded-xl border-2 border-primary/40 bg-card shadow-xs space-y-0.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-primary">
            <span>Portfolio ROI</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-primary/10 font-mono">Total</span>
          </div>
          <div className="text-lg font-bold font-mono text-primary">
            {formatROI(portfolioTotals.overallROI)}
          </div>
          <div className="text-[9px] text-muted-foreground font-mono truncate">
            {formatUSD(portfolioTotals.totalValue)} / {formatUSD(portfolioTotals.totalEffort)}
          </div>
        </div>
      </div>

      {/* Spreadsheet Toolbar: Filters & Quick Expansion */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Quarter selector */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="px-2 py-1 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none"
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
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Objectives, KRs, Owners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleToggleExpandAll}
            className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            {Object.values(expandedObjs).every(Boolean) ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Collapse All KRs</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Expand All KRs</span>
              </>
            )}
          </button>

          <span className="text-muted-foreground">
            Showing <strong>{sortedOKRs.length}</strong> objectives
          </span>
        </div>
      </div>

      {/* 📊 SPREADSHEET GRID VIEW */}
      {viewMode === "spreadsheet" && (
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
              {/* Spreadsheet Table Header */}
              <thead className="bg-muted/60 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border sticky top-0 z-20 select-none">
                <tr>
                  <th
                    className="p-3 pl-4 cursor-pointer hover:bg-muted/90 transition-colors w-[320px]"
                    onClick={() => handleSortClick("title")}
                  >
                    <div className="flex items-center justify-between">
                      <span>🎯 Objective &amp; Key Results</span>
                      {renderSortIndicator("title")}
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer hover:bg-muted/90 transition-colors w-[120px]"
                    onClick={() => handleSortClick("strategic")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>1. Strategic ($)</span>
                      {renderSortIndicator("strategic")}
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer hover:bg-muted/90 transition-colors w-[120px]"
                    onClick={() => handleSortClick("newRevenue")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>2. New Rev ($)</span>
                      {renderSortIndicator("newRevenue")}
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer hover:bg-muted/90 transition-colors w-[120px]"
                    onClick={() => handleSortClick("renewal")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>3. Renewal ($)</span>
                      {renderSortIndicator("renewal")}
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer hover:bg-muted/90 transition-colors w-[120px]"
                    onClick={() => handleSortClick("cx")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>4. CX ($)</span>
                      {renderSortIndicator("cx")}
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer hover:bg-muted/90 transition-colors w-[120px]"
                    onClick={() => handleSortClick("cost")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>5. Cost Saved ($)</span>
                      {renderSortIndicator("cost")}
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer hover:bg-muted/90 transition-colors w-[120px] bg-emerald-50/20 dark:bg-emerald-950/10"
                    onClick={() => handleSortClick("totalValue")}
                  >
                    <div className="flex items-center justify-end gap-1 font-extrabold text-emerald-700 dark:text-emerald-300">
                      <span>Total Value ($)</span>
                      {renderSortIndicator("totalValue")}
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer hover:bg-muted/90 transition-colors w-[100px]"
                    onClick={() => handleSortClick("effort")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Effort ($)</span>
                      {renderSortIndicator("effort")}
                    </div>
                  </th>
                  <th
                    className="p-3 text-center cursor-pointer hover:bg-muted/90 transition-colors w-[100px]"
                    onClick={() => handleSortClick("roi")}
                  >
                    <div className="flex items-center justify-center gap-1 font-extrabold text-primary">
                      <span>ROI Multiple</span>
                      {renderSortIndicator("roi")}
                    </div>
                  </th>
                  <th
                    className="p-3 text-center cursor-pointer hover:bg-muted/90 transition-colors w-[90px]"
                    onClick={() => handleSortClick("progress")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Progress</span>
                      {renderSortIndicator("progress")}
                    </div>
                  </th>
                  <th className="p-3 text-right w-[110px]">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {sortedOKRs.length === 0 && (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-muted-foreground">
                      No OKRs found. Click <strong>+ Objective</strong> to create your first financial OKR.
                    </td>
                  </tr>
                )}

                {sortedOKRs.map((item, idx) => {
                  const { agg } = item;
                  const dims = agg.dimensions;
                  const isExpanded = !!expandedObjs[item.id];
                  const rank = idx + 1;

                  return (
                    <React.Fragment key={item.id}>
                      {/* LEVEL 0: OBJECTIVE ROW */}
                      <tr className="bg-card hover:bg-muted/20 transition-colors group font-medium">
                        {/* Name & Hierarchy Cell */}
                        <td className="p-3 pl-3 align-middle">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedObjs((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                              }
                              className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors shrink-0"
                              title={isExpanded ? "Collapse Key Results" : "Expand Key Results"}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>

                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-[10px] shrink-0 border ${
                                rank === 1
                                  ? "bg-amber-500/20 text-amber-700 border-amber-300 dark:text-amber-300"
                                  : rank === 2
                                  ? "bg-slate-200 dark:bg-slate-800 text-slate-800 border-slate-300 dark:text-slate-200"
                                  : rank === 3
                                  ? "bg-orange-500/20 text-orange-700 border-orange-300 dark:text-orange-300"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              #{rank}
                            </span>

                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => handleUpdateObjective(item.id, { title: e.target.value })}
                                onBlur={() => handleSaveAllOKRs()}
                                className="w-full font-bold text-foreground bg-transparent border-b border-transparent focus:border-primary focus:outline-none truncate hover:border-border"
                                placeholder="Objective title..."
                              />
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                <span className="font-mono font-bold text-primary/80">{item.id}</span>
                                <span>•</span>
                                <input
                                  type="text"
                                  value={item.quarter}
                                  onChange={(e) => handleUpdateObjective(item.id, { quarter: e.target.value })}
                                  onBlur={() => handleSaveAllOKRs()}
                                  className="w-16 bg-transparent border-b border-transparent focus:border-primary focus:outline-none"
                                />
                                <span>•</span>
                                <span>Owner:</span>
                                <input
                                  type="text"
                                  value={item.owner || ""}
                                  onChange={(e) => handleUpdateObjective(item.id, { owner: e.target.value })}
                                  onBlur={() => handleSaveAllOKRs()}
                                  className="w-24 bg-transparent border-b border-transparent focus:border-primary focus:outline-none font-semibold text-foreground"
                                  placeholder="Owner"
                                />
                                <span>•</span>
                                <span>{item.keyResults.length} KRs</span>
                                <span>•</span>
                                <button
                                  type="button"
                                  onClick={() => setLinkStoryModalObj(item)}
                                  className="text-primary hover:underline font-semibold flex items-center gap-0.5"
                                >
                                  <Layers className="w-2.5 h-2.5" />
                                  <span>{agg.linkedStories.length} stories</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 1. Strategic Alignment Cell */}
                        <td className="p-2 text-right align-middle">
                          <div className="relative group/cell inline-flex items-center justify-end w-full">
                            <span className="text-muted-foreground text-[10px] mr-1">$</span>
                            <input
                              type="number"
                              step="1000"
                              value={dims.strategicAlignment?.value ?? 0}
                              onChange={(e) =>
                                handleUpdateDimensionValue(item.id, "strategicAlignment", Number(e.target.value))
                              }
                              onBlur={() => handleSaveAllOKRs()}
                              className="w-24 text-right font-mono font-bold text-blue-800 dark:text-blue-200 bg-blue-50/30 dark:bg-blue-950/10 px-2 py-1 rounded-lg border border-transparent hover:border-blue-200 focus:border-primary focus:bg-background focus:outline-none"
                              title={`Strategic Logic: ${dims.strategicAlignment?.logic || "No logic specified"}`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setCalcModalTarget({
                                  objectiveId: item.id,
                                  dimensions: dims,
                                  hours: Math.round(agg.effortCost / (pricing.developerHourlyRate || 150)),
                                  title: `Calculate: ${item.title}`,
                                })
                              }
                              className="opacity-0 group-hover/cell:opacity-100 p-0.5 ml-1 text-blue-600 hover:text-blue-800 transition-opacity"
                              title="Open Dimension Calculator Wizard"
                            >
                              <Calculator className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* 2. New Revenue Impact Cell */}
                        <td className="p-2 text-right align-middle">
                          <div className="relative group/cell inline-flex items-center justify-end w-full">
                            <span className="text-muted-foreground text-[10px] mr-1">$</span>
                            <input
                              type="number"
                              step="1000"
                              value={dims.newRevenueImpact?.value ?? 0}
                              onChange={(e) =>
                                handleUpdateDimensionValue(item.id, "newRevenueImpact", Number(e.target.value))
                              }
                              onBlur={() => handleSaveAllOKRs()}
                              className="w-24 text-right font-mono font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10 px-2 py-1 rounded-lg border border-transparent hover:border-emerald-200 focus:border-primary focus:bg-background focus:outline-none"
                              title={`New Revenue Logic: ${dims.newRevenueImpact?.logic || "No logic specified"}`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setCalcModalTarget({
                                  objectiveId: item.id,
                                  dimensions: dims,
                                  hours: Math.round(agg.effortCost / (pricing.developerHourlyRate || 150)),
                                  title: `Calculate: ${item.title}`,
                                })
                              }
                              className="opacity-0 group-hover/cell:opacity-100 p-0.5 ml-1 text-emerald-600 hover:text-emerald-800 transition-opacity"
                              title="Open Dimension Calculator Wizard"
                            >
                              <Calculator className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* 3. Renewal Revenue Impact Cell */}
                        <td className="p-2 text-right align-middle">
                          <div className="relative group/cell inline-flex items-center justify-end w-full">
                            <span className="text-muted-foreground text-[10px] mr-1">$</span>
                            <input
                              type="number"
                              step="1000"
                              value={dims.renewalRevenueImpact?.value ?? 0}
                              onChange={(e) =>
                                handleUpdateDimensionValue(item.id, "renewalRevenueImpact", Number(e.target.value))
                              }
                              onBlur={() => handleSaveAllOKRs()}
                              className="w-24 text-right font-mono font-bold text-violet-800 dark:text-violet-200 bg-violet-50/30 dark:bg-violet-950/10 px-2 py-1 rounded-lg border border-transparent hover:border-violet-200 focus:border-primary focus:bg-background focus:outline-none"
                              title={`Renewal Logic: ${dims.renewalRevenueImpact?.logic || "No logic specified"}`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setCalcModalTarget({
                                  objectiveId: item.id,
                                  dimensions: dims,
                                  hours: Math.round(agg.effortCost / (pricing.developerHourlyRate || 150)),
                                  title: `Calculate: ${item.title}`,
                                })
                              }
                              className="opacity-0 group-hover/cell:opacity-100 p-0.5 ml-1 text-violet-600 hover:text-violet-800 transition-opacity"
                              title="Open Dimension Calculator Wizard"
                            >
                              <Calculator className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* 4. Customer Experience Cell */}
                        <td className="p-2 text-right align-middle">
                          <div className="relative group/cell inline-flex items-center justify-end w-full">
                            <span className="text-muted-foreground text-[10px] mr-1">$</span>
                            <input
                              type="number"
                              step="1000"
                              value={dims.improveCustomerExperience?.value ?? 0}
                              onChange={(e) =>
                                handleUpdateDimensionValue(item.id, "improveCustomerExperience", Number(e.target.value))
                              }
                              onBlur={() => handleSaveAllOKRs()}
                              className="w-24 text-right font-mono font-bold text-amber-800 dark:text-amber-200 bg-amber-50/30 dark:bg-amber-950/10 px-2 py-1 rounded-lg border border-transparent hover:border-amber-200 focus:border-primary focus:bg-background focus:outline-none"
                              title={`CX Logic: ${dims.improveCustomerExperience?.logic || "No logic specified"}`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setCalcModalTarget({
                                  objectiveId: item.id,
                                  dimensions: dims,
                                  hours: Math.round(agg.effortCost / (pricing.developerHourlyRate || 150)),
                                  title: `Calculate: ${item.title}`,
                                })
                              }
                              className="opacity-0 group-hover/cell:opacity-100 p-0.5 ml-1 text-amber-600 hover:text-amber-800 transition-opacity"
                              title="Open Dimension Calculator Wizard"
                            >
                              <Calculator className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* 5. Lowers Cost Cell */}
                        <td className="p-2 text-right align-middle">
                          <div className="relative group/cell inline-flex items-center justify-end w-full">
                            <span className="text-muted-foreground text-[10px] mr-1">$</span>
                            <input
                              type="number"
                              step="1000"
                              value={dims.lowersCost?.value ?? 0}
                              onChange={(e) =>
                                handleUpdateDimensionValue(item.id, "lowersCost", Number(e.target.value))
                              }
                              onBlur={() => handleSaveAllOKRs()}
                              className="w-24 text-right font-mono font-bold text-teal-800 dark:text-teal-200 bg-teal-50/30 dark:bg-teal-950/10 px-2 py-1 rounded-lg border border-transparent hover:border-teal-200 focus:border-primary focus:bg-background focus:outline-none"
                              title={`Cost Logic: ${dims.lowersCost?.logic || "No logic specified"}`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setCalcModalTarget({
                                  objectiveId: item.id,
                                  dimensions: dims,
                                  hours: Math.round(agg.effortCost / (pricing.developerHourlyRate || 150)),
                                  title: `Calculate: ${item.title}`,
                                })
                              }
                              className="opacity-0 group-hover/cell:opacity-100 p-0.5 ml-1 text-teal-600 hover:text-teal-800 transition-opacity"
                              title="Open Dimension Calculator Wizard"
                            >
                              <Calculator className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Total Value ($) Sum Cell */}
                        <td className="p-2 text-right align-middle bg-emerald-50/20 dark:bg-emerald-950/10">
                          <span className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                            {formatUSD(agg.totalValue)}
                          </span>
                        </td>

                        {/* Effort Cost ($) Cell */}
                        <td className="p-2 text-right align-middle">
                          <div className="inline-flex items-center justify-end w-full">
                            <span className="text-muted-foreground text-[10px] mr-1">$</span>
                            <input
                              type="number"
                              step="500"
                              value={agg.effortCost}
                              onChange={(e) => handleUpdateEffortCost(item.id, Number(e.target.value))}
                              onBlur={() => handleSaveAllOKRs()}
                              className="w-20 text-right font-mono font-bold text-foreground bg-muted/40 px-1.5 py-1 rounded-lg border border-transparent hover:border-border focus:border-primary focus:outline-none"
                              title="Estimated Dev Labor & Token Cost"
                            />
                          </div>
                        </td>

                        {/* ROI Multiple Badge Cell */}
                        <td className="p-2 text-center align-middle">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-bold font-mono border shadow-2xs ${getROIBadgeClass(
                              agg.roiMultiple
                            )}`}
                          >
                            {formatROI(agg.roiMultiple)}
                          </span>
                        </td>

                        {/* Progress Cell */}
                        <td className="p-2 align-middle text-center">
                          <div className="w-16 mx-auto">
                            <div className="font-mono font-bold text-[11px] text-foreground">
                              {agg.completionPercent}%
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-0.5">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-300"
                                style={{ width: `${agg.completionPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Action Buttons Cell */}
                        <td className="p-2 text-right align-middle">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleAddKR(item.id)}
                              className="p-1 rounded-md border border-border hover:bg-muted text-foreground text-[10px] font-semibold flex items-center gap-0.5"
                              title="Add Key Result"
                            >
                              <Plus className="w-3 h-3" />
                              <span>KR</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setCalcModalTarget({
                                  objectiveId: item.id,
                                  dimensions: dims,
                                  hours: Math.round(agg.effortCost / (pricing.developerHourlyRate || 150)),
                                  title: `Calculate Value: ${item.title}`,
                                })
                              }
                              className="p-1 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                              title="Open Dollar Value Calculator Wizard"
                            >
                              <Calculator className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteObjective(item.id)}
                              className="p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Delete Objective"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* LEVEL 1: HIERARCHICAL KEY RESULT CHILD ROWS */}
                      {isExpanded &&
                        item.keyResults.map((kr) => {
                          const pct =
                            kr.target > 0 ? Math.min(100, Math.round((kr.current / kr.target) * 100)) : 0;

                          return (
                            <tr
                              key={kr.id}
                              className="bg-muted/15 hover:bg-muted/30 transition-colors border-l-4 border-l-primary/30 text-[11px]"
                            >
                              {/* Indented Key Result Name Cell */}
                              <td className="p-2 pl-8 align-middle">
                                <div className="flex items-center gap-1.5">
                                  <CornerDownRight className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                                  <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                                    {kr.id}
                                  </span>
                                  <input
                                    type="text"
                                    value={kr.title}
                                    onChange={(e) =>
                                      handleUpdateKR(item.id, kr.id, { title: e.target.value })
                                    }
                                    onBlur={() => handleSaveAllOKRs()}
                                    className="flex-1 font-medium text-foreground bg-transparent border-b border-transparent focus:border-primary focus:outline-none"
                                    placeholder="Key result title..."
                                  />
                                </div>
                              </td>

                              {/* Key Result Target Metric Inputs */}
                              <td colSpan={5} className="p-2 align-middle text-muted-foreground text-center">
                                <div className="flex items-center justify-center gap-2 text-xs">
                                  <span>Metric Target:</span>
                                  <input
                                    type="number"
                                    value={kr.target}
                                    onChange={(e) =>
                                      handleUpdateKR(item.id, kr.id, { target: Number(e.target.value) })
                                    }
                                    onBlur={() => handleSaveAllOKRs()}
                                    className="w-14 text-center font-mono font-bold bg-background border border-border rounded px-1 py-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={kr.unit}
                                    onChange={(e) =>
                                      handleUpdateKR(item.id, kr.id, { unit: e.target.value })
                                    }
                                    onBlur={() => handleSaveAllOKRs()}
                                    className="w-12 text-center bg-background border border-border rounded px-1 py-0.5"
                                    placeholder="unit"
                                  />
                                  <span>→ Current:</span>
                                  <input
                                    type="number"
                                    value={kr.current}
                                    onChange={(e) =>
                                      handleUpdateKR(item.id, kr.id, { current: Number(e.target.value) })
                                    }
                                    onBlur={() => handleSaveAllOKRs()}
                                    className="w-14 text-center font-mono font-bold bg-background border border-border rounded px-1 py-0.5 text-foreground"
                                  />
                                </div>
                              </td>

                              {/* Blank columns for child rollup */}
                              <td className="p-2 text-right align-middle text-muted-foreground font-mono text-[10px]">
                                -
                              </td>
                              <td className="p-2 text-right align-middle text-muted-foreground font-mono text-[10px]">
                                -
                              </td>
                              <td className="p-2 text-center align-middle text-muted-foreground font-mono text-[10px]">
                                -
                              </td>

                              {/* Progress of KR */}
                              <td className="p-2 text-center align-middle">
                                <span
                                  className={`font-mono font-bold ${
                                    pct >= 100
                                      ? "text-emerald-600"
                                      : pct >= 50
                                      ? "text-blue-600"
                                      : "text-amber-600"
                                  }`}
                                >
                                  {pct}%
                                </span>
                              </td>

                              {/* KR Action */}
                              <td className="p-2 text-right align-middle">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteKR(item.id, kr.id)}
                                  className="p-1 rounded text-muted-foreground hover:text-red-600 transition-colors"
                                  title="Delete Key Result"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🗂️ EXECUTIVE CARDS VIEW */}
      {viewMode === "cards" && (
        <div className="space-y-4">
          {sortedOKRs.map((item, index) => {
            const rank = index + 1;
            const { agg } = item;
            const dims = agg.dimensions;

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
                    <div className="p-2.5 rounded-xl border bg-blue-50/30 dark:bg-blue-950/10 border-blue-200/60">
                      <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300">1. Strategic</div>
                      <div className="text-sm font-bold font-mono text-blue-900 dark:text-blue-100 mt-0.5">
                        {formatUSD(dims.strategicAlignment?.value)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl border bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/60">
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">2. New Revenue</div>
                      <div className="text-sm font-bold font-mono text-emerald-900 dark:text-emerald-100 mt-0.5">
                        {formatUSD(dims.newRevenueImpact?.value)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl border bg-violet-50/30 dark:bg-violet-950/10 border-violet-200/60">
                      <div className="text-[10px] font-bold text-violet-700 dark:text-violet-300">3. Renewal</div>
                      <div className="text-sm font-bold font-mono text-violet-900 dark:text-violet-100 mt-0.5">
                        {formatUSD(dims.renewalRevenueImpact?.value)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl border bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/60">
                      <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300">4. Customer Exp</div>
                      <div className="text-sm font-bold font-mono text-amber-900 dark:text-amber-100 mt-0.5">
                        {formatUSD(dims.improveCustomerExperience?.value)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl border bg-teal-50/30 dark:bg-teal-950/10 border-teal-200/60">
                      <div className="text-[10px] font-bold text-teal-700 dark:text-teal-300">5. Lowers Cost</div>
                      <div className="text-sm font-bold font-mono text-teal-900 dark:text-teal-100 mt-0.5">
                        {formatUSD(dims.lowersCost?.value)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linked User Stories & Key Results */}
                <div className="p-4 space-y-3">
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

                  {agg.linkedStories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {agg.linkedStories.map((story) => {
                        const storyVal = story.dimensions?.totalValue || story.estimatedValue || 0;
                        return (
                          <div
                            key={story.id}
                            onClick={() => setInspectStory(story)}
                            className="px-3 py-1.5 rounded-xl border bg-card border-border hover:border-primary/40 text-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] shadow-2xs"
                          >
                            <span className="font-mono font-bold">{story.id}</span>
                            <span className="truncate max-w-[180px] font-medium">{story.title}</span>
                            <span className="font-mono font-bold text-emerald-600">{formatUSD(storyVal)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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