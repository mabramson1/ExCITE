import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// In-memory cache — stats don't need to be real-time
let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 30_000; // 30 seconds

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    // Consolidate 12 queries into 3 using CTEs
    const [userStats, projectStats, topUsers] = await Promise.all([
      // ── 1. All user stats in one query ──────────────────────────
      db.execute(sql`
        WITH totals AS (
          SELECT COUNT(*)::int AS total_users FROM "user"
        ),
        by_role AS (
          SELECT role, COUNT(*)::int AS cnt FROM "user" GROUP BY role
        ),
        recent AS (
          SELECT COUNT(*)::int AS recent_signups
          FROM "user" WHERE created_at > NOW() - INTERVAL '7 days'
        ),
        daily AS (
          SELECT DATE(created_at)::text AS date, COUNT(*)::int AS count
          FROM "user" WHERE created_at > NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at) ORDER BY date
        )
        SELECT json_build_object(
          'totalUsers', (SELECT total_users FROM totals),
          'recentSignups', (SELECT recent_signups FROM recent),
          'usersByRole', (SELECT json_object_agg(role, cnt) FROM by_role),
          'dailySignups', (SELECT COALESCE(json_agg(json_build_object('date', date, 'count', count)), '[]'::json) FROM daily)
        ) AS result
      `),

      // ── 2. All project stats in one query ───────────────────────
      db.execute(sql`
        WITH totals AS (
          SELECT COUNT(*)::int AS total_projects FROM project
        ),
        by_type AS (
          SELECT type, COUNT(*)::int AS cnt FROM project GROUP BY type
        ),
        recent AS (
          SELECT COUNT(*)::int AS recent_projects
          FROM project WHERE created_at > NOW() - INTERVAL '7 days'
        ),
        daily AS (
          SELECT DATE(created_at)::text AS date, COUNT(*)::int AS count
          FROM project WHERE created_at > NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at) ORDER BY date
        ),
        phi AS (
          SELECT COUNT(*)::int AS phi_total FROM project WHERE phi_detected = true
        ),
        active AS (
          SELECT COUNT(DISTINCT user_id)::int AS active_users
          FROM project WHERE created_at > NOW() - INTERVAL '7 days'
        ),
        avg_calc AS (
          SELECT COALESCE(
            ROUND(COUNT(p.id)::numeric / NULLIF(COUNT(DISTINCT u.id), 0), 2), 0
          ) AS avg_per_user
          FROM "user" u LEFT JOIN project p ON p.user_id = u.id
        )
        SELECT json_build_object(
          'totalProjects', (SELECT total_projects FROM totals),
          'recentProjects', (SELECT recent_projects FROM recent),
          'projectsByType', (SELECT COALESCE(json_object_agg(type, cnt), '{}'::json) FROM by_type),
          'dailyProjects', (SELECT COALESCE(json_agg(json_build_object('date', date, 'count', count)), '[]'::json) FROM daily),
          'phiTotal', (SELECT phi_total FROM phi),
          'activeUsers', (SELECT active_users FROM active),
          'avgProjectsPerUser', (SELECT avg_per_user FROM avg_calc)
        ) AS result
      `),

      // ── 3. Top users (needs JOIN) ───────────────────────────────
      db.execute(sql`
        SELECT u.name, u.email, COUNT(p.id)::int AS count
        FROM "user" u LEFT JOIN project p ON p.user_id = u.id
        GROUP BY u.id, u.name, u.email
        ORDER BY count DESC LIMIT 10
      `),
    ]);

    // Parse consolidated results
    const uRaw = (userStats as unknown as { result: string }[])[0]?.result;
    const pRaw = (projectStats as unknown as { result: string }[])[0]?.result;
    const u = typeof uRaw === "string" ? JSON.parse(uRaw) : uRaw;
    const p = typeof pRaw === "string" ? JSON.parse(pRaw) : pRaw;

    const totalUsers = u?.totalUsers ?? 0;
    const totalProjects = p?.totalProjects ?? 0;

    const usersByRole = {
      free: 0, pro: 0, unlimited: 0, admin: 0,
      ...(u?.usersByRole ?? {}),
    };

    const projectsByType = {
      clinical_note: 0, manuscript: 0, deai: 0, ai_detector: 0,
      ...(p?.projectsByType ?? {}),
    };

    const phiTotal = p?.phiTotal ?? 0;
    const phiDetectionRate = totalProjects > 0
      ? Math.round((phiTotal / totalProjects) * 10000) / 10000
      : 0;

    const popularTools = Object.entries(projectsByType)
      .map(([type, c]) => ({
        type,
        count: c as number,
        pct: totalProjects > 0 ? Math.round(((c as number) / totalProjects) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const data = {
      totalUsers,
      totalProjects,
      usersByRole,
      projectsByType,
      recentSignups: u?.recentSignups ?? 0,
      recentProjects: p?.recentProjects ?? 0,
      dailyProjects: p?.dailyProjects ?? [],
      dailySignups: u?.dailySignups ?? [],
      topUsers: topUsers as unknown as { name: string | null; email: string; count: number }[],
      avgProjectsPerUser: Number(p?.avgProjectsPerUser ?? 0),
      phiDetectionRate,
      popularTools,
      activeUsers: p?.activeUsers ?? 0,
      proUsers: usersByRole.pro,
      unlimitedUsers: usersByRole.unlimited,
    };

    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("Admin stats error:", detail);
    return NextResponse.json(
      { error: "Failed to fetch stats", detail },
      { status: 500 }
    );
  }
}
