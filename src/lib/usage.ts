import { db } from "@/lib/db";
import { project } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { count } from "drizzle-orm";
import { getUserPlan } from "@/lib/stripe";

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  pro: 100,
  unlimited: Infinity,
};

/**
 * Check whether a user has remaining analyses this month.
 * Returns { allowed, used, limit, plan }.
 */
export async function checkUsageLimit(userId: string) {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const used = await getMonthlyUsageCount(userId);

  return {
    allowed: used < limit,
    used,
    limit,
    plan,
  };
}

/**
 * Get usage statistics for a user this billing period.
 */
export async function getUsageStats(userId: string) {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const used = await getMonthlyUsageCount(userId);

  return {
    used,
    limit,
    plan,
  };
}

/**
 * Count the number of projects (analyses) created this calendar month.
 */
async function getMonthlyUsageCount(userId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const result = await db
    .select({ value: count() })
    .from(project)
    .where(
      and(
        eq(project.userId, userId),
        gte(project.createdAt, startOfMonth)
      )
    );

  return result[0]?.value ?? 0;
}
