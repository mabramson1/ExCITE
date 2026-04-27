import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { user, project } from "@/lib/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25", 10)));
    const type = searchParams.get("type") || null;
    const offset = (page - 1) * limit;

    const validTypes = ["clinical_note", "manuscript", "deai", "ai_detector"];
    const whereClause = type && validTypes.includes(type)
      ? eq(project.type, type as "clinical_note" | "manuscript" | "deai" | "ai_detector")
      : undefined;

    // Count total matching projects
    const [{ total: totalCount }] = await db
      .select({ total: count() })
      .from(project)
      .where(whereClause);

    const total = Number(totalCount);

    // Fetch projects with user info
    const projects = await db
      .select({
        id: project.id,
        title: project.title,
        type: project.type,
        userName: user.name,
        userEmail: user.email,
        phiDetected: project.phiDetected,
        favorite: project.favorite,
        shareId: project.shareId,
        createdAt: project.createdAt,
      })
      .from(project)
      .innerJoin(user, eq(project.userId, user.id))
      .where(whereClause)
      .orderBy(desc(project.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      projects,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin projects list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing required field: projectId" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(project)
      .where(eq(project.id, projectId))
      .returning({ id: project.id });

    if (!deleted) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin project delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
