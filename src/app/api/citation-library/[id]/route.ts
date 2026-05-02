import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { citationLibrary } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/lib/api-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireUser();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;
  const { id } = await params;

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.notes !== undefined) updates.notes = body.notes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(citationLibrary)
      .set(updates)
      .where(
        and(
          eq(citationLibrary.id, id),
          eq(citationLibrary.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Citation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ citation: updated });
  } catch (error) {
    console.error("Citation library update error:", error);
    return NextResponse.json(
      { error: "Failed to update citation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireUser();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;
  const { id } = await params;

  try {
    const [deleted] = await db
      .delete(citationLibrary)
      .where(
        and(
          eq(citationLibrary.id, id),
          eq(citationLibrary.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Citation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Citation library delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete citation" },
      { status: 500 }
    );
  }
}
