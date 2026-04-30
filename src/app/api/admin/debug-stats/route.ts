import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { user, project } from "@/lib/db/schema";
import { count, sql } from "drizzle-orm";

/**
 * Runs each stats query individually so we can see exactly which one fails.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const results: Record<string, { ok: boolean; data?: unknown; error?: string }> = {};

  async function run(name: string, fn: () => Promise<unknown>) {
    try {
      results[name] = { ok: true, data: await fn() };
    } catch (e) {
      results[name] = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  await run("count_users", () => db.select({ c: count() }).from(user));
  await run("count_projects", () => db.select({ c: count() }).from(project));
  await run("users_by_role", () => db.select({ role: user.role, c: count() }).from(user).groupBy(user.role));
  await run("projects_by_type", () => db.select({ type: project.type, c: count() }).from(project).groupBy(project.type));
  await run("daily_projects", () => db.execute(sql`SELECT DATE(created_at)::text as date, COUNT(*)::int as count FROM project WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY DATE(created_at) ORDER BY date`));
  await run("daily_signups", () => db.execute(sql`SELECT DATE(created_at)::text as date, COUNT(*)::int as count FROM "user" WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY DATE(created_at) ORDER BY date`));
  await run("top_users", () => db.execute(sql`SELECT u.name, u.email, COUNT(p.id)::int as count FROM "user" u LEFT JOIN project p ON p.user_id = u.id GROUP BY u.id, u.name, u.email ORDER BY count DESC LIMIT 10`));
  await run("avg_projects", () => db.execute(sql`SELECT COALESCE(ROUND(COUNT(p.id)::numeric / NULLIF(COUNT(DISTINCT u.id), 0), 2), 0) as "avgProjectsPerUser" FROM "user" u LEFT JOIN project p ON p.user_id = u.id`));
  await run("phi_count", () => db.select({ c: count() }).from(project).where(sql`${project.phiDetected} = true`));
  await run("active_users", () => db.execute(sql`SELECT COUNT(DISTINCT user_id)::int as "activeUsers" FROM project WHERE created_at > NOW() - INTERVAL '7 days'`));

  return NextResponse.json(results);
}
