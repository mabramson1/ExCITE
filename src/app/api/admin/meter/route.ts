import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { usageMeter, user } from "@/lib/db/schema";
import { sql, desc, eq, and, gte } from "drizzle-orm";
import { TOOL_LABELS, type Tool } from "@/lib/credits";

/**
 * Admin meter endpoint. Returns:
 *  - this-month totals (calls, credits, USD spent)
 *  - per-tool breakdown
 *  - top users by credit consumption
 *  - last 14 days of daily totals
 */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    const [totals, byTool, topUsers, daily, allTimeTotals] = await Promise.all([
      // This-month totals
      db
        .select({
          calls: sql<number>`COUNT(*)::int`,
          credits: sql<number>`COALESCE(SUM(${usageMeter.credits}), 0)::int`,
          inputTokens: sql<number>`COALESCE(SUM(${usageMeter.inputTokens}), 0)::int`,
          outputTokens: sql<number>`COALESCE(SUM(${usageMeter.outputTokens}), 0)::int`,
          cacheReadTokens: sql<number>`COALESCE(SUM(${usageMeter.cacheReadTokens}), 0)::int`,
          cacheWriteTokens: sql<number>`COALESCE(SUM(${usageMeter.cacheWriteTokens}), 0)::int`,
          costMillicents: sql<number>`COALESCE(SUM(${usageMeter.costMillicents}), 0)::int`,
        })
        .from(usageMeter)
        .where(gte(usageMeter.createdAt, startOfMonth)),

      // Per-tool breakdown (this month)
      db
        .select({
          tool: usageMeter.tool,
          calls: sql<number>`COUNT(*)::int`,
          credits: sql<number>`COALESCE(SUM(${usageMeter.credits}), 0)::int`,
          costMillicents: sql<number>`COALESCE(SUM(${usageMeter.costMillicents}), 0)::int`,
        })
        .from(usageMeter)
        .where(gte(usageMeter.createdAt, startOfMonth))
        .groupBy(usageMeter.tool),

      // Top 10 users by credits this month
      db
        .select({
          userId: usageMeter.userId,
          email: user.email,
          name: user.name,
          calls: sql<number>`COUNT(*)::int`,
          credits: sql<number>`COALESCE(SUM(${usageMeter.credits}), 0)::int`,
          costMillicents: sql<number>`COALESCE(SUM(${usageMeter.costMillicents}), 0)::int`,
        })
        .from(usageMeter)
        .leftJoin(user, eq(user.id, usageMeter.userId))
        .where(gte(usageMeter.createdAt, startOfMonth))
        .groupBy(usageMeter.userId, user.email, user.name)
        .orderBy(desc(sql`SUM(${usageMeter.credits})`))
        .limit(10),

      // Daily totals — last 14 days
      db.execute(
        sql`SELECT
              DATE(created_at) AS date,
              COUNT(*)::int AS calls,
              COALESCE(SUM(credits), 0)::int AS credits,
              COALESCE(SUM(cost_millicents), 0)::int AS cost_millicents
            FROM usage_meter
            WHERE created_at >= NOW() - INTERVAL '14 days'
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) DESC`
      ),

      // All-time totals
      db
        .select({
          calls: sql<number>`COUNT(*)::int`,
          credits: sql<number>`COALESCE(SUM(${usageMeter.credits}), 0)::int`,
          costMillicents: sql<number>`COALESCE(SUM(${usageMeter.costMillicents}), 0)::int`,
        })
        .from(usageMeter),
    ]);

    return NextResponse.json({
      month: {
        calls: totals[0]?.calls ?? 0,
        credits: totals[0]?.credits ?? 0,
        inputTokens: totals[0]?.inputTokens ?? 0,
        outputTokens: totals[0]?.outputTokens ?? 0,
        cacheReadTokens: totals[0]?.cacheReadTokens ?? 0,
        cacheWriteTokens: totals[0]?.cacheWriteTokens ?? 0,
        costUsd: ((totals[0]?.costMillicents ?? 0) / 100_000).toFixed(2),
      },
      allTime: {
        calls: allTimeTotals[0]?.calls ?? 0,
        credits: allTimeTotals[0]?.credits ?? 0,
        costUsd: ((allTimeTotals[0]?.costMillicents ?? 0) / 100_000).toFixed(2),
      },
      byTool: byTool.map((t) => ({
        tool: t.tool,
        label: TOOL_LABELS[t.tool as Tool] ?? t.tool,
        calls: t.calls,
        credits: t.credits,
        costUsd: (t.costMillicents / 100_000).toFixed(4),
      })),
      topUsers: topUsers.map((u) => ({
        userId: u.userId,
        email: u.email,
        name: u.name,
        calls: u.calls,
        credits: u.credits,
        costUsd: (u.costMillicents / 100_000).toFixed(4),
      })),
      daily: (daily as unknown as { date: string; calls: number; credits: number; cost_millicents: number }[]).map(
        (d) => ({
          date: d.date,
          calls: d.calls,
          credits: d.credits,
          costUsd: (d.cost_millicents / 100_000).toFixed(4),
        })
      ),
    });
  } catch (error) {
    console.error("Admin meter error:", error);
    return NextResponse.json(
      { error: "Failed to load meter data" },
      { status: 500 }
    );
  }
}
