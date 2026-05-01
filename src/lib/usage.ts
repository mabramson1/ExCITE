import { db } from "@/lib/db";
import { usageMeter } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { getUserPlan } from "@/lib/stripe";
import {
  PLAN_CREDIT_LIMITS,
  TOOL_CREDITS,
  computeCostMillicents,
  type Tool,
  type PlanName,
} from "@/lib/credits";
import type Anthropic from "@anthropic-ai/sdk";

/**
 * Check whether a user has enough credits to run a given tool.
 * Returns the limit, used credits, plan, and whether the call is allowed.
 */
export async function checkCreditLimit(userId: string, tool: Tool) {
  const plan = ((await getUserPlan(userId)) as PlanName) || "free";
  const limit = PLAN_CREDIT_LIMITS[plan] ?? PLAN_CREDIT_LIMITS.free;
  const used = await getMonthlyCredits(userId);
  const cost = TOOL_CREDITS[tool];

  return {
    allowed: used + cost <= limit,
    used,
    limit,
    plan,
    cost,
    remaining: Math.max(0, limit - used),
  };
}

/**
 * Sum the credits a user has consumed this calendar month.
 */
export async function getMonthlyCredits(userId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(${usageMeter.credits}), 0)::int` })
    .from(usageMeter)
    .where(
      and(
        eq(usageMeter.userId, userId),
        gte(usageMeter.createdAt, startOfMonth)
      )
    );

  return result[0]?.total ?? 0;
}

/**
 * Record a single Claude API call against the meter. Failures are swallowed
 * so they never break the user's analysis flow.
 */
export async function recordUsage(
  userId: string,
  tool: Tool,
  usage: Anthropic.Messages.Usage
): Promise<void> {
  try {
    await db.insert(usageMeter).values({
      userId,
      tool,
      credits: TOOL_CREDITS[tool],
      inputTokens: usage.input_tokens ?? 0,
      outputTokens: usage.output_tokens ?? 0,
      cacheReadTokens: usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: usage.cache_creation_input_tokens ?? 0,
      costMillicents: computeCostMillicents(usage),
    });
  } catch (err) {
    console.error("Failed to record usage:", err);
  }
}

/**
 * Per-tool breakdown of the user's credit + cost consumption this month.
 */
export async function getMonthlyBreakdown(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const rows = await db
    .select({
      tool: usageMeter.tool,
      calls: sql<number>`COUNT(*)::int`,
      credits: sql<number>`COALESCE(SUM(${usageMeter.credits}), 0)::int`,
      costMillicents: sql<number>`COALESCE(SUM(${usageMeter.costMillicents}), 0)::int`,
    })
    .from(usageMeter)
    .where(
      and(
        eq(usageMeter.userId, userId),
        gte(usageMeter.createdAt, startOfMonth)
      )
    )
    .groupBy(usageMeter.tool);

  return rows;
}
