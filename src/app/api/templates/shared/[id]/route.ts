import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sharedTemplate } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/lib/api-auth";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * DELETE /api/templates/shared/[id]
 * Delete own shared template (author check).
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const authResult = await requireUser();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const { id } = await params;

    // Only delete if the current user is the author
    const deleted = await db
      .delete(sharedTemplate)
      .where(
        and(
          eq(sharedTemplate.id, id),
          eq(sharedTemplate.authorId, userId)
        )
      )
      .returning({ id: sharedTemplate.id });

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Template not found or you are not the author" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete shared template error:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
