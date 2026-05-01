import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getMonthlyBreakdown, getMonthlyCredits } from "@/lib/usage";
import { getUserPlan } from "@/lib/stripe";
import {
  PLAN_CREDIT_LIMITS,
  TOOL_CREDITS,
  TOOL_LABELS,
  type PlanName,
  type Tool,
} from "@/lib/credits";

/**
 * Returns the current user's credit usage for this calendar month plus
 * a per-tool breakdown. Used by the user-facing meter card.
 */
export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const plan = ((await getUserPlan(userId)) as PlanName) || "free";
  const limit = PLAN_CREDIT_LIMITS[plan] ?? PLAN_CREDIT_LIMITS.free;
  const used = await getMonthlyCredits(userId);
  const breakdown = await getMonthlyBreakdown(userId);

  return NextResponse.json({
    plan,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    pctUsed: Math.min(100, Math.round((used / limit) * 100)),
    breakdown: breakdown.map((b) => ({
      tool: b.tool,
      label: TOOL_LABELS[b.tool as Tool] ?? b.tool,
      calls: b.calls,
      credits: b.credits,
      costUsd: (b.costMillicents / 100_000).toFixed(4),
    })),
    toolWeights: TOOL_CREDITS,
    toolLabels: TOOL_LABELS,
  });
}
