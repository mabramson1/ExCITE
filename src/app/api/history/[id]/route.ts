import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { project } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { randomBytes } from "crypto";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [result] = await db
      .select()
      .from(project)
      .where(and(eq(project.id, id), eq(project.userId, session.user.id)))
      .limit(1);

    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ project: result });
  } catch (error) {
    console.error("History detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PATCH — toggle favorite or generate share link
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Verify ownership
    const [existing] = await db
      .select({ id: project.id, favorite: project.favorite, shareId: project.shareId })
      .from(project)
      .where(and(eq(project.id, id), eq(project.userId, session.user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    // Toggle favorite
    if (body.action === "toggle_favorite") {
      updates.favorite = !existing.favorite;
    }

    // Generate share link
    if (body.action === "share") {
      if (!existing.shareId) {
        updates.shareId = randomBytes(12).toString("base64url");
      }
    }

    // Unshare
    if (body.action === "unshare") {
      updates.shareId = null;
    }

    const [updated] = await db
      .update(project)
      .set(updates)
      .where(eq(project.id, id))
      .returning({
        id: project.id,
        favorite: project.favorite,
        shareId: project.shareId,
      });

    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error("History update error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db
      .delete(project)
      .where(and(eq(project.id, id), eq(project.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("History delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
