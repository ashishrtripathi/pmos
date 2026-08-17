// src/lib/roi-calculator.ts
// Standardized 5-Dimension Financial ROI Calculator for PMOS Stories and OKRs.
// Every story and OKR is normalized to U.S. dollars ($) with transparent mathematical logic.

import type { FinancialDimension, ValueDimensions, Story, Objective } from "@/types/pmos";

export interface PricingParams {
  developerHourlyRate?: number;
  costPerToken?: number;
  hoursPerPoint?: number;
  model?: string;
  aiOverheadPercent?: number;
}

export const DEFAULT_PRICING: Required<PricingParams> = {
  developerHourlyRate: 150,
  costPerToken: 0.003,
  hoursPerPoint: 0.35,
  model: "claude-sonnet-4",
  aiOverheadPercent: 14,
};

export const DIMENSION_METADATA = {
  strategicAlignment: {
    key: "strategicAlignment",
    label: "Strategic Alignment",
    shortLabel: "Strategic",
    icon: "Globe",
    color: "blue",
    bgClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    description: "Greater visibility going into a new market, strategic partner readiness, or core ecosystem milestone.",
    example: "New Market Entry ($100k market) × 20% strategic readiness factor = $20,000",
    defaultLogic: (val: number) => `$${val.toLocaleString()} strategic market entry & visibility value`,
  },
  newRevenueImpact: {
    key: "newRevenueImpact",
    label: "New Revenue Impact",
    shortLabel: "New Revenue",
    icon: "TrendingUp",
    color: "emerald",
    bgClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    description: "New recurring or transactional revenue generated from new customers, tiers, or features.",
    example: "5 new accounts/year × $10,000 ACV = $50,000/year",
    defaultLogic: (val: number) => `$${val.toLocaleString()} projected new ARR from new accounts`,
  },
  renewalRevenueImpact: {
    key: "renewalRevenueImpact",
    label: "Renewal Revenue Impact",
    shortLabel: "Renewal Revenue",
    icon: "RefreshCw",
    color: "violet",
    bgClass: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
    description: "Expansion revenue and contract retention at renewal cycles.",
    example: "25 renewal accounts ($150k ARR pool) × 10% retention improvement = $15,000/year",
    defaultLogic: (val: number) => `$${val.toLocaleString()} retained renewal revenue & contract expansion`,
  },
  improveCustomerExperience: {
    key: "improveCustomerExperience",
    label: "Improve Customer Experience",
    shortLabel: "Customer Exp (CX)",
    icon: "HeartHandshake",
    color: "amber",
    bgClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    description: "Lowers churn or friction, with a concrete estimate of dollars preserved or added.",
    example: "200 active customers × 2.5% churn reduction × $3,000 LTV = $15,000",
    defaultLogic: (val: number) => `$${val.toLocaleString()} churn reduction & customer satisfaction value`,
  },
  lowersCost: {
    key: "lowersCost",
    label: "Lowers Cost",
    shortLabel: "Cost Savings",
    icon: "PiggyBank",
    color: "teal",
    bgClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    description: "Operational hours saved by automating tasks × employee/agent hourly rate + infra savings.",
    example: "40 hours saved/year × $85/hour average employee rate = $3,400/year",
    defaultLogic: (val: number) => `$${val.toLocaleString()} operational labor hours and task automation savings`,
  },
} as const;

/**
 * Creates empty default ValueDimensions with 0 values and clear initial descriptions.
 */
export function createDefaultDimensions(
  hours: number = 1,
  pricing: PricingParams = DEFAULT_PRICING
): ValueDimensions {
  const devRate = pricing.developerHourlyRate ?? 150;
  const tokenCost = (pricing.costPerToken ?? 0.003) * 15; // ~15k tokens
  const effortCost = Math.round(hours * devRate + tokenCost);

  return {
    strategicAlignment: { value: 0, logic: "No strategic market adjustment specified" },
    newRevenueImpact: { value: 0, logic: "No direct new sales modeled" },
    renewalRevenueImpact: { value: 0, logic: "No renewal expansion modeled" },
    improveCustomerExperience: { value: 0, logic: "No churn/friction savings modeled" },
    lowersCost: { value: 0, logic: "No labor/task automation savings modeled" },
    totalValue: 0,
    effortCost,
    roiMultiple: 0,
  };
}

/**
 * Calculates total dollar effort cost based on dev team hourly rate and AI tokens.
 */
export function calculateEffortCost(
  story: { estimatedHours?: number; points?: number; estimatedTokens?: number },
  pricing: PricingParams = DEFAULT_PRICING
): number {
  const hours = story.estimatedHours ?? (story.points ? story.points * (pricing.hoursPerPoint || 0.35) : 1);
  const devRate = pricing.developerHourlyRate ?? 150;
  const tokens = story.estimatedTokens ?? Math.round(hours * 15000);
  const costPerToken = pricing.costPerToken ?? 0.003;
  const tokenCost = (tokens / 1000) * (costPerToken * 1000);
  return Math.round(hours * devRate + tokenCost);
}

/**
 * Recalculates totalValue and roiMultiple for any set of 5 dimensions and effort.
 */
export function computeValueDimensions(
  dims: Partial<{
    strategicAlignment: FinancialDimension;
    newRevenueImpact: FinancialDimension;
    renewalRevenueImpact: FinancialDimension;
    improveCustomerExperience: FinancialDimension;
    lowersCost: FinancialDimension;
  }>,
  effortCost: number
): ValueDimensions {
  const strategic = dims.strategicAlignment || { value: 0, logic: "None" };
  const newRev = dims.newRevenueImpact || { value: 0, logic: "None" };
  const renewal = dims.renewalRevenueImpact || { value: 0, logic: "None" };
  const cx = dims.improveCustomerExperience || { value: 0, logic: "None" };
  const cost = dims.lowersCost || { value: 0, logic: "None" };

  const totalValue =
    (strategic.value || 0) +
    (newRev.value || 0) +
    (renewal.value || 0) +
    (cx.value || 0) +
    (cost.value || 0);

  const safeEffort = Math.max(1, effortCost);
  const roiMultiple = totalValue > 0 ? Math.round((totalValue / safeEffort) * 100) / 100 : 0;

  return {
    strategicAlignment: strategic,
    newRevenueImpact: newRev,
    renewalRevenueImpact: renewal,
    improveCustomerExperience: cx,
    lowersCost: cost,
    totalValue,
    effortCost: safeEffort,
    roiMultiple,
  };
}

/**
 * Formats a currency value cleanly in USD.
 */
export function formatUSD(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "$0";
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
  return `$${Math.round(amount).toLocaleString()}`;
}

/**
 * Formats ROI Multiple (e.g. 12.5x).
 */
export function formatROI(roi: number | undefined | null): string {
  if (!roi || roi <= 0 || isNaN(roi)) return "0.0x";
  return `${roi.toFixed(1)}x`;
}

/**
 * Returns color classes for ROI multiple badges.
 */
export function getROIBadgeClass(roi: number): string {
  if (roi >= 10) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700";
  if (roi >= 3) return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700";
  if (roi >= 1) return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700";
  return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700";
}

/**
 * Aggregates all linked user stories for an Objective to compute total OKR 5-dimension values and ROI.
 */
export function aggregateOKRFiscalData(
  objective: Objective,
  stories: Story[],
  pricing: PricingParams = DEFAULT_PRICING
): {
  dimensions: ValueDimensions;
  linkedStories: Story[];
  totalValue: number;
  effortCost: number;
  roiMultiple: number;
  deliveredValue: number;
  completionPercent: number;
} {
  const linkedStories = stories.filter((s) => s.objectiveId === objective.id);

  let strategicSum = 0;
  let newRevSum = 0;
  let renewalSum = 0;
  let cxSum = 0;
  let costSum = 0;
  let totalEffort = 0;
  let deliveredValue = 0;

  const strategicLogics: string[] = [];
  const newRevLogics: string[] = [];
  const renewalLogics: string[] = [];
  const cxLogics: string[] = [];
  const costLogics: string[] = [];

  for (const s of linkedStories) {
    const sHours = s.estimatedHours ?? (s.points ? s.points * 0.35 : 1);
    const sEffort = calculateEffortCost(s, pricing);
    totalEffort += sEffort;

    const dims = s.dimensions;
    if (dims) {
      if (dims.strategicAlignment?.value) {
        strategicSum += dims.strategicAlignment.value;
        strategicLogics.push(`${s.id}: ${dims.strategicAlignment.logic}`);
      }
      if (dims.newRevenueImpact?.value) {
        newRevSum += dims.newRevenueImpact.value;
        newRevLogics.push(`${s.id}: ${dims.newRevenueImpact.logic}`);
      }
      if (dims.renewalRevenueImpact?.value) {
        renewalSum += dims.renewalRevenueImpact.value;
        renewalLogics.push(`${s.id}: ${dims.renewalRevenueImpact.logic}`);
      }
      if (dims.improveCustomerExperience?.value) {
        cxSum += dims.improveCustomerExperience.value;
        cxLogics.push(`${s.id}: ${dims.improveCustomerExperience.logic}`);
      }
      if (dims.lowersCost?.value) {
        costSum += dims.lowersCost.value;
        costLogics.push(`${s.id}: ${dims.lowersCost.logic}`);
      }

      if (s.status === "done") {
        deliveredValue += dims.totalValue;
      }
    } else if (s.estimatedValue) {
      // Legacy fallback
      strategicSum += s.estimatedValue;
      if (s.status === "done") deliveredValue += s.estimatedValue;
    }
  }

  // If objective has direct dimensions defined, combine or fallback
  if (linkedStories.length === 0 && objective.dimensions) {
    return {
      dimensions: objective.dimensions,
      linkedStories: [],
      totalValue: objective.dimensions.totalValue,
      effortCost: objective.dimensions.effortCost,
      roiMultiple: objective.dimensions.roiMultiple,
      deliveredValue: 0,
      completionPercent: 0,
    };
  }

  const effortCost = Math.max(1, totalEffort || objective.effortCost || 150);
  const dimensions = computeValueDimensions(
    {
      strategicAlignment: {
        value: strategicSum,
        logic: strategicLogics.length > 0 ? strategicLogics.join("; ") : "Aggregated from linked stories",
      },
      newRevenueImpact: {
        value: newRevSum,
        logic: newRevLogics.length > 0 ? newRevLogics.join("; ") : "Aggregated from linked stories",
      },
      renewalRevenueImpact: {
        value: renewalSum,
        logic: renewalLogics.length > 0 ? renewalLogics.join("; ") : "Aggregated from linked stories",
      },
      improveCustomerExperience: {
        value: cxSum,
        logic: cxLogics.length > 0 ? cxLogics.join("; ") : "Aggregated from linked stories",
      },
      lowersCost: {
        value: costSum,
        logic: costLogics.length > 0 ? costLogics.join("; ") : "Aggregated from linked stories",
      },
    },
    effortCost
  );

  const totalVal = dimensions.totalValue;
  const completionPercent = totalVal > 0 ? Math.min(100, Math.round((deliveredValue / totalVal) * 100)) : 0;

  return {
    dimensions,
    linkedStories,
    totalValue: totalVal,
    effortCost,
    roiMultiple: dimensions.roiMultiple,
    deliveredValue,
    completionPercent,
  };
}
