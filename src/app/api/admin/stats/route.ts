import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { user, project } from "@/lib/db/schema";
import { count, sql } from "drizzle-orm";

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

    return NextResponse.json({
      totalUsers: Number(totalUsers),
      totalProjects: Number(totalProjects),
      usersByRole,
      projectsByType,
      recentSignups: Number(recentSignups),
      recentProjects: Number(recentProjects),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
