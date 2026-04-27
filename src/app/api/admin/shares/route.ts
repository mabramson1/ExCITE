import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { user, project } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const shares = await db
      .select({
        projectId: project.id,
        shareId: project.shareId,
        title: project.title,
        type: project.type,
        userName: user.name,
        createdAt: project.createdAt,
      })
      .from(project)
      .innerJoin(user, eq(project.userId, user.id))
      .where(sql`${project.shareId} IS NOT NULL`);

    return NextResponse.json({ shares });
  } catch (error) {
    console.error("Admin shares list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shares" },
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

    const [updated] = await db
      .update(project)
      .set({ shareId: null, updatedAt: new Date() })
      .where(eq(project.id, projectId))
      .returning({ id: project.id });

    if (!updated) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin share revoke error:", error);
    return NextResponse.json(
      { error: "Failed to revoke share link" },
      { status: 500 }
    );
  }
}
