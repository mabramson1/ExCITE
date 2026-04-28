import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { user, project } from "@/lib/db/schema";
import { count, sql } from "drizzle-orm";

interface DailyCount {
  date: string;
  count: number;
}

interface TopUser {
  name: string | null;
  email: string;
  count: number;
}

interface ToolPopularity {
  type: string;
  count: number;
  pct: number;
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Run all queries in parallel
    const [
      [{ totalUsers }],
      [{ totalProjects }],
      usersByRoleRows,
      projectsByTypeRows,
      [{ recentSignups }],
      [{ recentProjects }],
      dailyProjectsRaw,
      dailySignupsRaw,
      topUsersRaw,
      [{ avgProjectsPerUser }],
      [{ phiTotal }],
      activeUsersRaw,
    ] = await Promise.all([
      // Total users
      db.select({ totalUsers: count() }).from(user),

      // Total projects
      db.select({ totalProjects: count() }).from(project),

      // Users by role
      db
        .select({
          role: user.role,
          count: count(),
        })
        .from(user)
        .groupBy(user.role),

      // Projects by type
      db
        .select({
          type: project.type,
          count: count(),
        })
        .from(project)
        .groupBy(project.type),

      // Recent signups (last 7 days)
      db
        .select({ recentSignups: count() })
        .from(user)
        .where(sql`${user.createdAt} >= ${sevenDaysAgo}`),

      // Recent projects (last 7 days)
      db
        .select({ recentProjects: count() })
        .from(project)
        .where(sql`${project.createdAt} >= ${sevenDaysAgo}`),

      // Daily projects last 30 days
      db.execute(sql`
        SELECT DATE(created_at)::text as date, COUNT(*)::int as count
        FROM project
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `),

      // Daily signups last 30 days
      db.execute(sql`
        SELECT DATE(created_at)::text as date, COUNT(*)::int as count
        FROM "user"
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `),

      // Top 10 users by project count
      db.execute(sql`
        SELECT u.name, u.email, COUNT(p.id)::int as count
        FROM "user" u
        LEFT JOIN project p ON p.user_id = u.id
        GROUP BY u.id, u.name, u.email
        ORDER BY count DESC
        LIMIT 10
      `),

      // Average projects per user
      db.execute(sql`
        SELECT COALESCE(ROUND(COUNT(p.id)::numeric / NULLIF(COUNT(DISTINCT u.id), 0), 2), 0) as "avgProjectsPerUser"
        FROM "user" u
        LEFT JOIN project p ON p.user_id = u.id
      `),

      // PHI detection total
      db
        .select({ phiTotal: count() })
        .from(project)
        .where(sql`${project.phiDetected} = true`),

      // Active users (used the app in last 7 days — created a project)
      db.execute(sql`
        SELECT COUNT(DISTINCT user_id)::int as "activeUsers"
        FROM project
        WHERE created_at > NOW() - INTERVAL '7 days'
      `),
    ]);

    // Build usersByRole object
    const usersByRole: Record<string, number> = {
      free: 0,
      pro: 0,
      unlimited: 0,
      admin: 0,
    };
    for (const row of usersByRoleRows) {
      usersByRole[row.role] = Number(row.count);
    }

    // Build projectsByType object
    const projectsByType: Record<string, number> = {
      clinical_note: 0,
      manuscript: 0,
      deai: 0,
      ai_detector: 0,
    };
    for (const row of projectsByTypeRows) {
      projectsByType[row.type] = Number(row.count);
    }

    // Cast raw SQL results
    const dailyProjects = dailyProjectsRaw as unknown as DailyCount[];
    const dailySignups = dailySignupsRaw as unknown as DailyCount[];
    const topUsers = topUsersRaw as unknown as TopUser[];

    // PHI detection rate
    const totalProjectsNum = Number(totalProjects);
    const phiDetectionRate =
      totalProjectsNum > 0
        ? Math.round((Number(phiTotal) / totalProjectsNum) * 10000) / 10000
        : 0;

    // Popular tools (project types with percentages)
    const popularTools: ToolPopularity[] = Object.entries(projectsByType)
      .map(([type, c]) => ({
        type,
        count: c,
        pct:
          totalProjectsNum > 0
            ? Math.round((c / totalProjectsNum) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Active users from raw result
    const activeUsersRow = activeUsersRaw as unknown as { activeUsers: number }[];
    const activeUsers = activeUsersRow.length > 0 ? Number(activeUsersRow[0].activeUsers) : 0;

    return NextResponse.json({
      totalUsers: Number(totalUsers),
      totalProjects: totalProjectsNum,
      usersByRole,
      projectsByType,
      recentSignups: Number(recentSignups),
      recentProjects: Number(recentProjects),
      dailyProjects,
      dailySignups,
      topUsers,
      avgProjectsPerUser: Number(avgProjectsPerUser),
      phiDetectionRate,
      popularTools,
      activeUsers,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
