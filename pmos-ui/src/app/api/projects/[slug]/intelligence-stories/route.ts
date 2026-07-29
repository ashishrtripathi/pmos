import { NextResponse } from "next/server";
import {
  parseAllIntelligenceStories,
} from "@/lib/intelligence";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const { stories, files } = parseAllIntelligenceStories(slug);

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
    totalCost: stories.reduce(
      (sum, s) => {
        const tokensPerPoint = 12000 + 8000;
        const tokens = s.points * tokensPerPoint * 3.5;
        const cost = (tokens / 1000) * 0.003 * 7 + s.points * 0.35 * 150;
        return sum + cost;
      },
      0
    ),
  });
}
