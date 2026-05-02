import { db } from "@/lib/db";
import { usageMeter, user as userTable } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { getUserPlan } from "@/lib/stripe";
import {
  PLAN_CREDIT_LIMITS,
  TOOL_CREDITS,
  computeCostMillicents,
  type Tool,
  type PlanName,
} from "@/lib/credits";
import { sendCreditWarningEmail } from "@/lib/email";
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
 *
 * After inserting, checks whether the user just crossed the 80% credit
 * threshold and, if so, fires off a warning email (at most once per month).
 */
export async function recordUsage(
  userId: string,
  tool: Tool,
  usage: Anthropic.Messages.Usage
): Promise<void> {
  try {
    const cost = TOOL_CREDITS[tool];

    await db.insert(usageMeter).values({
      userId,
      tool,
      credits: cost,
      inputTokens: usage.input_tokens ?? 0,
      outputTokens: usage.output_tokens ?? 0,
      cacheReadTokens: usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: usage.cache_creation_input_tokens ?? 0,
      costMillicents: computeCostMillicents(usage),
    });

    // --- Credit warning check (fire-and-forget) ---
    // We intentionally do NOT await this so it never blocks the response.
    void checkAndSendCreditWarning(userId, cost);
  } catch (err) {
    console.error("Failed to record usage:", err);
  }
}

/**
 * If this usage pushed the user past 80% of their monthly limit AND we
 * haven't already warned them this calendar month, send a warning email.
 */
async function checkAndSendCreditWarning(
  userId: string,
  cost: number
): Promise<void> {
  try {
    const plan = ((await getUserPlan(userId)) as PlanName) || "free";
    const limit = PLAN_CREDIT_LIMITS[plan] ?? PLAN_CREDIT_LIMITS.free;
    const threshold = Math.floor(limit * 0.8);

    const usedAfter = await getMonthlyCredits(userId);
    const usedBefore = usedAfter - cost;

    // Only act when this call is the one that crosses the threshold
    if (usedBefore >= threshold || usedAfter < threshold) return;

    // Dedup: check lastCreditWarning on the user row
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const rows = await db
      .select({
        email: userTable.email,
        name: userTable.name,
        lastCreditWarning: userTable.lastCreditWarning,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    const usr = rows[0];
    if (!usr) return;

    // Already warned this month — skip
    if (usr.lastCreditWarning && usr.lastCreditWarning >= startOfMonth) return;

    // Mark as warned (do this before sending so a slow send doesn't cause dupes)
    await db
      .update(userTable)
      .set({ lastCreditWarning: now })
      .where(eq(userTable.id, userId));

    await sendCreditWarningEmail({
      email: usr.email,
      name: usr.name,
      used: usedAfter,
      limit,
      plan,
    });
  } catch (err) {
    // Never let email failures propagate — the usage was already recorded.
    console.error("Credit warning email failed:", err);
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
