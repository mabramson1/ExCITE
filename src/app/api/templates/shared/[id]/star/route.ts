import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sharedTemplate, templateStar } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireUser } from "@/lib/api-auth";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/templates/shared/[id]/star
 * Star a template. Upserts into templateStar and increments starCount.
 */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  const authResult = await requireUser();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const { id } = await params;

    // Verify template exists
    const [template] = await db
      .select({ id: sharedTemplate.id })
      .from(sharedTemplate)
      .where(eq(sharedTemplate.id, id))
      .limit(1);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Upsert the star — if already starred, do nothing
    const result = await db
      .insert(templateStar)
      .values({ userId, templateId: id })
      .onConflictDoNothing()
      .returning();

    // Only increment if a new row was inserted
    if (result.length > 0) {
      await db
        .update(sharedTemplate)
        .set({
          starCount: sql`${sharedTemplate.starCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(sharedTemplate.id, id));
    }

    return NextResponse.json({ success: true, starred: true });
  } catch (error) {
    console.error("Star template error:", error);
    return NextResponse.json(
      { error: "Failed to star template" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates/shared/[id]/star
 * Unstar a template. Removes from templateStar and decrements starCount.
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const authResult = await requireUser();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const { id } = await params;

    // Delete the star row
    const deleted = await db
      .delete(templateStar)
      .where(
        and(
          eq(templateStar.userId, userId),
          eq(templateStar.templateId, id)
        )
      )
      .returning();

    // Only decrement if a row was actually deleted
    if (deleted.length > 0) {
      await db
        .update(sharedTemplate)
        .set({
          starCount: sql`GREATEST(${sharedTemplate.starCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(sharedTemplate.id, id));
    }

    return NextResponse.json({ success: true, starred: false });
  } catch (error) {
    console.error("Unstar template error:", error);
    return NextResponse.json(
      { error: "Failed to unstar template" },
      { status: 500 }
    );
  }
}
