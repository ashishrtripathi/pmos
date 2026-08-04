import { NextResponse } from "next/server";
import {
  parseAllIntelligenceStories,
  calculateTotalCost,
} from "@/lib/intelligence";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const { stories, files } = parseAllIntelligenceStories(slug);

  const costBreakdown = await calculateTotalCost(slug, stories);

  return NextResponse.json({
    stories,
    files,
    totalPoints: stories.reduce((sum, s) => sum + s.points, 0),
    byAgent: stories.reduce(
      (acc, s) => {
        acc[s.assignedAgent] = (acc[s.assignedAgent] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    byCategory: stories.reduce(
      (acc, s) => {
        acc[s.category] = (acc[s.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    byPriority: stories.reduce(
      (acc, s) => {
        acc[s.priority] = (acc[s.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    totalValue: stories.reduce((sum, s) => sum + (s.estimatedValue || 0), 0),
    totalCost: costBreakdown.totalCost,
    costBreakdown,
  });
}
