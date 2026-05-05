import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { blogPost } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/admin/blog/[id]
 * Fetch a single post for editing.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await ctx.params;
  const [post] = await db.select().from(blogPost).where(eq(blogPost.id, id)).limit(1);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post });
}

/**
 * PATCH /api/admin/blog/[id]
 * Update a post.
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const updates: Partial<typeof blogPost.$inferInsert> = { updatedAt: new Date() };

    if (typeof body.slug === "string") {
      updates.slug = body.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.description === "string") updates.description = body.description.trim();
    if (typeof body.category === "string") updates.category = body.category.trim();
    if (typeof body.readTime === "string") updates.readTime = body.readTime.trim();
    if (typeof body.content === "string") updates.content = body.content.trim();
    if (typeof body.published === "boolean") updates.published = body.published;

    const [updated] = await db
      .update(blogPost)
      .set(updates)
      .where(eq(blogPost.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ post: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("duplicate") || message.includes("unique")) {
      return NextResponse.json(
        { error: "A post with that slug already exists" },
        { status: 409 }
      );
    }
    console.error("Admin blog update error:", err);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/blog/[id]
 */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await ctx.params;
  const [deleted] = await db.delete(blogPost).where(eq(blogPost.id, id)).returning({ id: blogPost.id });
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
