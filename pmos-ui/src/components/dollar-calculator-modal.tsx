// src/components/dollar-calculator-modal.tsx
// Interactive Dollar Calculation Wizard for PMOS Stories and OKRs.
// Normalizes values to U.S. dollars ($) across 5 dimensions with step-by-step logic.

"use client";

import React, { useState } from "react";
import {
  X,
  Calculator,
  Globe,
  TrendingUp,
  RefreshCw,
  HeartHandshake,
  PiggyBank,
  Check,
  Sparkles,
  Info,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import type { ValueDimensions, FinancialDimension } from "@/types/pmos";
import {
  DIMENSION_METADATA,
  DEFAULT_PRICING,
  PricingParams,
  formatUSD,
  formatROI,
  computeValueDimensions,
} from "@/lib/roi-calculator";

export interface DollarCalculatorModalProps {
  initialDimensions?: ValueDimensions;
  estimatedHours?: number;
  pricing?: PricingParams;
  onApply: (dimensions: ValueDimensions) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

type DimensionKey = keyof typeof DIMENSION_METADATA;

export function DollarCalculatorModal({
  initialDimensions,
  estimatedHours = 2,
  pricing = DEFAULT_PRICING,
  onApply,
  onClose,
  title = "Dollar Value & ROI Calculator",
  subtitle = "Score this item across the 5 standard PMOS financial dimensions normalized to U.S. dollars ($)",
}: DollarCalculatorModalProps) {
  const devRate = pricing.developerHourlyRate ?? 150;
  const tokenCost = (pricing.costPerToken ?? 0.003) * 15;
  const effortCost = Math.round(estimatedHours * devRate + tokenCost);

  const [activeTab, setActiveTab] = useState<DimensionKey>("lowersCost");

  // State for all 5 dimensions
  const [strategic, setStrategic] = useState<FinancialDimension>(
    initialDimensions?.strategicAlignment || { value: 0, logic: "No strategic market valuation" }
  );
  const [newRev, setNewRev] = useState<FinancialDimension>(
    initialDimensions?.newRevenueImpact || { value: 0, logic: "No new sales modeled" }
  );
  const [renewal, setRenewal] = useState<FinancialDimension>(
    initialDimensions?.renewalRevenueImpact || { value: 0, logic: "No renewal expansion modeled" }
  );
  const [cx, setCX] = useState<FinancialDimension>(
    initialDimensions?.improveCustomerExperience || { value: 0, logic: "No churn reduction modeled" }
  );
  const [cost, setCost] = useState<FinancialDimension>(
    initialDimensions?.lowersCost || { value: 0, logic: "No task automation labor savings modeled" }
  );

  // Dimension 1 Wizard Inputs: Strategic Alignment
  const [stratMarketSize, setStratMarketSize] = useState(100000);
  const [stratCaptureFactor, setStratCaptureFactor] = useState(15);
  const [stratCustomVal, setStratCustomVal] = useState(0);

  // Dimension 2 Wizard Inputs: New Revenue Impact
  const [newRevDeals, setNewRevDeals] = useState(4);
  const [newRevACV, setNewRevACV] = useState(12000);

  // Dimension 3 Wizard Inputs: Renewal Revenue Impact
  const [renewalPoolARR, setRenewalPoolARR] = useState(150000);
  const [renewalRetentionLift, setRenewalRetentionLift] = useState(8);

  // Dimension 4 Wizard Inputs: Improve Customer Experience
  const [cxUsers, setCXUsers] = useState(350);
  const [cxChurnDrop, setCXChurnDrop] = useState(2.0);
  const [cxLTV, setCXLTV] = useState(2400);

  // Dimension 5 Wizard Inputs: Lowers Cost
  const [costHoursSaved, setCostHoursSaved] = useState(40);
  const [costHourlyRate, setCostHourlyRate] = useState(75);
  const [costMultiplier, setCostMultiplier] = useState(12); // 1 = once, 12 = monthly/yr, 52 = weekly/yr

  // Recomputed totals
  const currentComputed = computeValueDimensions(
    {
      strategicAlignment: strategic,
      newRevenueImpact: newRev,
      renewalRevenueImpact: renewal,
      improveCustomerExperience: cx,
      lowersCost: cost,
    },
    effortCost
  );

  // Apply Wizard Calculations
  const applyStrategicWizard = () => {
    const val = stratCustomVal > 0 ? stratCustomVal : Math.round(stratMarketSize * (stratCaptureFactor / 100));
    const logic =
      stratCustomVal > 0
        ? `Direct Strategic Milestone Value: ${formatUSD(stratCustomVal)}`
        : `Target Market (${formatUSD(stratMarketSize)}) × ${stratCaptureFactor}% Strategic Readiness Factor = ${formatUSD(val)}`;
    setStrategic({ value: val, logic });
  };

  const applyNewRevenueWizard = () => {
    const val = Math.round(newRevDeals * newRevACV);
    const logic = `${newRevDeals} Projected New Accounts × ${formatUSD(newRevACV)} ACV = ${formatUSD(val)}/year`;
    setNewRev({ value: val, logic });
  };

  const applyRenewalWizard = () => {
    const val = Math.round(renewalPoolARR * (renewalRetentionLift / 100));
    const logic = `${formatUSD(renewalPoolARR)} Renewal ARR Pool × ${renewalRetentionLift}% Retention Lift = ${formatUSD(val)}/year`;
    setRenewal({ value: val, logic });
  };

  const applyCXWizard = () => {
    const val = Math.round(cxUsers * (cxChurnDrop / 100) * cxLTV);
    const logic = `${cxUsers} Active Customers × ${cxChurnDrop}% Churn Reduction × ${formatUSD(cxLTV)} LTV = ${formatUSD(val)}`;
    setCX({ value: val, logic });
  };

  const applyCostWizard = () => {
    const val = Math.round(costHoursSaved * costHourlyRate * (costMultiplier || 1));
    const freqLabel = costMultiplier === 12 ? "/year (monthly task)" : costMultiplier === 52 ? "/year (weekly task)" : "one-time";
    const logic = `${costHoursSaved} Hours Saved × $${costHourlyRate}/hr rate × ${costMultiplier} = ${formatUSD(val)} ${freqLabel}`;
    setCost({ value: val, logic });
  };

  const handleSaveAll = () => {
    onApply(currentComputed);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Financial Summary KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/40 border-b border-border text-center">
          <div className="p-2.5 rounded-xl bg-card border border-border/80 shadow-2xs">
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Value ($)</div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatUSD(currentComputed.totalValue)}
            </div>
            <div className="text-[9px] text-muted-foreground">Sum of 5 Dimensions</div>
          </div>

          <div className="p-2.5 rounded-xl bg-card border border-border/80 shadow-2xs">
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Effort Cost ($)</div>
            <div className="text-xl font-bold font-mono text-foreground mt-0.5">
              {formatUSD(currentComputed.effortCost)}
            </div>
            <div className="text-[9px] text-muted-foreground">
              {estimatedHours}h @ ${devRate}/hr
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-card border border-border/80 shadow-2xs">
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Value / Effort ROI</div>
            <div className="text-xl font-bold font-mono text-primary mt-0.5">
              {formatROI(currentComputed.roiMultiple)}
            </div>
            <div className="text-[9px] text-muted-foreground">Multiple ($ Value / $ Cost)</div>
          </div>

          <div className="p-2.5 rounded-xl bg-card border border-border/80 shadow-2xs">
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Cost Savings Share</div>
            <div className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-0.5">
              {formatUSD(cost.value)}
            </div>
            <div className="text-[9px] text-muted-foreground">
              {currentComputed.totalValue > 0 ? `${Math.round((cost.value / currentComputed.totalValue) * 100)}% of Value` : "0%"}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Dimension Selector Tabs */}
          <div className="md:col-span-4 border-r border-border p-3 space-y-1.5 overflow-y-auto bg-muted/10">
            <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 tracking-wider">
              5 Financial Dimensions
            </div>

            {/* Strategic Alignment */}
            <button
              type="button"
              onClick={() => setActiveTab("strategicAlignment")}
              className={`w-full text-left p-2.5 rounded-xl transition-all border flex items-center justify-between gap-2 ${
                activeTab === "strategicAlignment"
                  ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                  : "bg-card border-border hover:bg-muted/50 text-foreground"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-semibold truncate">1. Strategic Alignment</div>
                  <div className="text-[10px] text-muted-foreground truncate">New market & visibility</div>
                </div>
              </div>
              <span className="font-mono text-xs font-bold shrink-0">{formatUSD(strategic.value)}</span>
            </button>

            {/* New Revenue Impact */}
            <button
              type="button"
              onClick={() => setActiveTab("newRevenueImpact")}
              className={`w-full text-left p-2.5 rounded-xl transition-all border flex items-center justify-between gap-2 ${
                activeTab === "newRevenueImpact"
                  ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                  : "bg-card border-border hover:bg-muted/50 text-foreground"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-semibold truncate">2. New Revenue Impact</div>
                  <div className="text-[10px] text-muted-foreground truncate">Direct sales & new ARR</div>
                </div>
              </div>
              <span className="font-mono text-xs font-bold shrink-0">{formatUSD(newRev.value)}</span>
            </button>

            {/* Renewal Revenue Impact */}
            <button
              type="button"
              onClick={() => setActiveTab("renewalRevenueImpact")}
              className={`w-full text-left p-2.5 rounded-xl transition-all border flex items-center justify-between gap-2 ${
                activeTab === "renewalRevenueImpact"
                  ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                  : "bg-card border-border hover:bg-muted/50 text-foreground"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <RefreshCw className="w-4 h-4 text-violet-500 shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-semibold truncate">3. Renewal Revenue Impact</div>
                  <div className="text-[10px] text-muted-foreground truncate">Expansion & retention</div>
                </div>
              </div>
              <span className="font-mono text-xs font-bold shrink-0">{formatUSD(renewal.value)}</span>
            </button>

            {/* Improve Customer Experience */}
            <button
              type="button"
              onClick={() => setActiveTab("improveCustomerExperience")}
              className={`w-full text-left p-2.5 rounded-xl transition-all border flex items-center justify-between gap-2 ${
                activeTab === "improveCustomerExperience"
                  ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                  : "bg-card border-border hover:bg-muted/50 text-foreground"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <HeartHandshake className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-semibold truncate">4. Improve Customer Exp (CX)</div>
                  <div className="text-[10px] text-muted-foreground truncate">Lowers churn & friction</div>
                </div>
              </div>
              <span className="font-mono text-xs font-bold shrink-0">{formatUSD(cx.value)}</span>
            </button>

            {/* Lowers Cost */}
            <button
              type="button"
              onClick={() => setActiveTab("lowersCost")}
              className={`w-full text-left p-2.5 rounded-xl transition-all border flex items-center justify-between gap-2 ${
                activeTab === "lowersCost"
                  ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                  : "bg-card border-border hover:bg-muted/50 text-foreground"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <PiggyBank className="w-4 h-4 text-teal-500 shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-semibold truncate">5. Lowers Cost</div>
                  <div className="text-[10px] text-muted-foreground truncate">Labor hours saved × rate</div>
                </div>
              </div>
              <span className="font-mono text-xs font-bold shrink-0">{formatUSD(cost.value)}</span>
            </button>

            {/* Total Rollup Info Box */}
            <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span>Total Calculated Value:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatUSD(currentComputed.totalValue)}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                <span>Total Dev Effort Cost:</span>
                <span className="font-mono">{formatUSD(effortCost)}</span>
              </div>
              <div className="flex items-center justify-between font-bold pt-1 border-t border-border">
                <span>ROI Score:</span>
                <span className="font-mono text-primary">{formatROI(currentComputed.roiMultiple)}</span>
              </div>
            </div>
          </div>

          {/* Dimension Details & Interactive Wizard */}
          <div className="md:col-span-8 p-5 overflow-y-auto space-y-5">
            {/* Dimension Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold uppercase tracking-wider">
                  Dimension {activeTab === "strategicAlignment" ? "1" : activeTab === "newRevenueImpact" ? "2" : activeTab === "renewalRevenueImpact" ? "3" : activeTab === "improveCustomerExperience" ? "4" : "5"} of 5
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {DIMENSION_METADATA[activeTab].label}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {DIMENSION_METADATA[activeTab].description}
              </p>
            </div>

            {/* Interactive Calculator Wizard Tab Contents */}
            {activeTab === "strategicAlignment" && (
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <Sparkles className="w-4 h-4" />
                  <span>Strategic Opportunity Calculator</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1">Target Market Opportunity ($)</label>
                    <input
                      type="number"
                      value={stratMarketSize}
                      onChange={(e) => setStratMarketSize(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1">Strategic Capture / Visibility Factor (%)</label>
                    <input
                      type="number"
                      value={stratCaptureFactor}
                      onChange={(e) => setStratCaptureFactor(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card font-mono text-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyStrategicWizard}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Calculate Strategic Value: {formatUSD(Math.round(stratMarketSize * (stratCaptureFactor / 100)))}</span>
                </button>
              </div>
            )}

            {activeTab === "newRevenueImpact" && (
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4" />
                  <span>New Sales & ARR Calculator</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1">Projected New Customers / Deals</label>
                    <input
                      type="number"
                      value={newRevDeals}
                      onChange={(e) => setNewRevDeals(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1">Average Contract Value (ACV $ / Year)</label>
                    <input
                      type="number"
                      value={newRevACV}
                      onChange={(e) => setNewRevACV(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card font-mono text-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyNewRevenueWizard}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Calculate New Revenue: {formatUSD(Math.round(newRevDeals * newRevACV))}</span>
                </button>
              </div>
            )}

            {activeTab === "renewalRevenueImpact" && (
              <div className="p-4 rounded-xl border border-violet-200 dark:border-violet-900/50 bg-violet-50/40 dark:bg-violet-950/20 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-violet-700 dark:text-violet-300">
                  <Sparkles className="w-4 h-4" />
                  <span>Renewal Retention & Expansion Calculator</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1">Total Renewal ARR Pool ($)</label>
                    <input
                      type="number"
                      value={renewalPoolARR}
                      onChange={(e) => setRenewalPoolARR(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1">Retention / Expansion Lift (%)</label>
                    <input
                      type="number"
                      value={renewalRetentionLift}
                      onChange={(e) => setRenewalRetentionLift(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card font-mono text-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyRenewalWizard}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Calculate Renewal Impact: {formatUSD(Math.round(renewalPoolARR * (renewalRetentionLift / 100)))}</span>
                </button>
              </div>
            )}

            {activeTab === "improveCustomerExperience" && (
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Sparkles className="w-4 h-4" />
                  <span>Customer Experience & Churn Reduction Calculator</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1">Active Customer Base</label>
                    <input
                      type="number"
                      value={cxUsers}
                      onChange={(e) => setCXUsers(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1">Churn Reduction (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={cxChurnDrop}
                      onChange={(e) => setCXChurnDrop(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1">Customer LTV ($ / User)</label>
                    <input
                      type="number"
                      value={cxLTV}
                      onChange={(e) => setCXLTV(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card font-mono text-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyCXWizard}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Calculate CX Value: {formatUSD(Math.round(cxUsers * (cxChurnDrop / 100) * cxLTV))}</span>
                </button>
              </div>
            )}

            {activeTab === "lowersCost" && (
              <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/40 dark:bg-teal-950/20 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-300">
                  <Sparkles className="w-4 h-4" />
                  <span>Task Automation & Labor Savings Calculator</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1">Hours Saved by Automation</label>
                    <input
                      type="number"
                      value={costHoursSaved}
                      onChange={(e) => setCostHoursSaved(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card font-mono text-sm"
                      placeholder="e.g. 40"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1">Employee / Agent Rate ($/hr)</label>
                    <input
                      type="number"
                      value={costHourlyRate}
                      onChange={(e) => setCostHourlyRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card font-mono text-sm"
                      placeholder="e.g. 75"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1">Frequency Multiplier</label>
                    <select
                      value={costMultiplier}
                      onChange={(e) => setCostMultiplier(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold"
                    >
                      <option value={1}>One-Time (1x)</option>
                      <option value={12}>Monthly (12x/year)</option>
                      <option value={52}>Weekly (52x/year)</option>
                      <option value={250}>Daily Workdays (250x/year)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyCostWizard}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Calculate Cost Savings: {formatUSD(Math.round(costHoursSaved * costHourlyRate * costMultiplier))}</span>
                </button>
              </div>
            )}

            {/* Direct Value & Logic Editor */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="text-xs font-bold text-foreground">
                Active Value & Step-by-Step Logic
              </div>

              {activeTab === "strategicAlignment" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-muted-foreground w-36">Strategic Value ($):</label>
                    <div className="relative flex-1">
                      <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                      <input
                        type="number"
                        value={strategic.value}
                        onChange={(e) => setStrategic({ ...strategic, value: Number(e.target.value) })}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-card font-mono text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Calculation Logic & Rationale:</label>
                    <input
                      type="text"
                      value={strategic.logic}
                      onChange={(e) => setStrategic({ ...strategic, logic: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-mono text-foreground"
                      placeholder="Show step-by-step logic..."
                    />
                  </div>
                </div>
              )}

              {activeTab === "newRevenueImpact" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-muted-foreground w-36">New Revenue Value ($):</label>
                    <div className="relative flex-1">
                      <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                      <input
                        type="number"
                        value={newRev.value}
                        onChange={(e) => setNewRev({ ...newRev, value: Number(e.target.value) })}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-card font-mono text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Calculation Logic & Rationale:</label>
                    <input
                      type="text"
                      value={newRev.logic}
                      onChange={(e) => setNewRev({ ...newRev, logic: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-mono text-foreground"
                      placeholder="Show step-by-step logic..."
                    />
                  </div>
                </div>
              )}

              {activeTab === "renewalRevenueImpact" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-muted-foreground w-36">Renewal Impact Value ($):</label>
                    <div className="relative flex-1">
                      <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                      <input
                        type="number"
                        value={renewal.value}
                        onChange={(e) => setRenewal({ ...renewal, value: Number(e.target.value) })}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-card font-mono text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Calculation Logic & Rationale:</label>
                    <input
                      type="text"
                      value={renewal.logic}
                      onChange={(e) => setRenewal({ ...renewal, logic: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-mono text-foreground"
                      placeholder="Show step-by-step logic..."
                    />
                  </div>
                </div>
              )}

              {activeTab === "improveCustomerExperience" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-muted-foreground w-36">CX Value ($):</label>
                    <div className="relative flex-1">
                      <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                      <input
                        type="number"
                        value={cx.value}
                        onChange={(e) => setCX({ ...cx, value: Number(e.target.value) })}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-card font-mono text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Calculation Logic & Rationale:</label>
                    <input
                      type="text"
                      value={cx.logic}
                      onChange={(e) => setCX({ ...cx, logic: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-mono text-foreground"
                      placeholder="Show step-by-step logic..."
                    />
                  </div>
                </div>
              )}

              {activeTab === "lowersCost" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-muted-foreground w-36">Cost Savings Value ($):</label>
                    <div className="relative flex-1">
                      <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                      <input
                        type="number"
                        value={cost.value}
                        onChange={(e) => setCost({ ...cost, value: Number(e.target.value) })}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-card font-mono text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Calculation Logic & Rationale:</label>
                    <input
                      type="text"
                      value={cost.logic}
                      onChange={(e) => setCost({ ...cost, logic: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-mono text-foreground"
                      placeholder="Show step-by-step logic..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>
              Total Value: <strong className="text-foreground">{formatUSD(currentComputed.totalValue)}</strong> ÷ Effort:{" "}
              <strong className="text-foreground">{formatUSD(effortCost)}</strong> = ROI:{" "}
              <strong className="text-primary">{formatROI(currentComputed.roiMultiple)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Apply Dollar Values</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
