import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { user, project, session, account, subscription, userPreference, templateFavorite, usageMeter } from "@/lib/db/schema";
import { eq, desc, count, sql, and, like } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25", 10)));
    const search = searchParams.get("search")?.trim() || null;
    const offset = (page - 1) * limit;

    const whereClause = search
      ? sql`(${user.name} ILIKE ${`%${search}%`} OR ${user.email} ILIKE ${`%${search}%`})`
      : undefined;

    // Count total matching users
    const [{ total: totalCount }] = await db
      .select({ total: count() })
      .from(user)
      .where(whereClause);

    const total = Number(totalCount);

    // Fetch users with project counts
    const projectCountSubquery = db
      .select({
        userId: project.userId,
        projectCount: count().as("project_count"),
      })
      .from(project)
      .groupBy(project.userId)
      .as("pc");

    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        projectCount: sql<number>`COALESCE(${projectCountSubquery.projectCount}, 0)`,
      })
      .from(user)
      .leftJoin(projectCountSubquery, eq(user.id, projectCountSubquery.userId))
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "Missing required fields: userId, role" },
        { status: 400 }
      );
    }

    const validRoles = ["free", "pro", "unlimited", "admin"] as const;
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(user)
      .set({ role, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });

    if (!updated) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required field: userId" },
        { status: 400 }
      );
    }

    // Safety: cannot delete yourself
    if (userId === admin.userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete related rows first — session and account lack ON DELETE CASCADE
    await Promise.all([
      db.delete(session).where(eq(session.userId, userId)),
      db.delete(account).where(eq(account.userId, userId)),
      db.delete(usageMeter).where(eq(usageMeter.userId, userId)),
      db.delete(templateFavorite).where(eq(templateFavorite.userId, userId)),
      db.delete(userPreference).where(eq(userPreference.userId, userId)),
      db.delete(subscription).where(eq(subscription.userId, userId)),
      db.delete(project).where(eq(project.userId, userId)),
    ]);

    const [deleted] = await db
      .delete(user)
      .where(eq(user.id, userId))
      .returning({ id: user.id });

    if (!deleted) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin user delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
