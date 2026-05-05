import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { blogPost } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

/**
 * GET /api/admin/blog
 * List all blog posts (published and drafts) for admin management.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const posts = await db
      .select()
      .from(blogPost)
      .orderBy(desc(blogPost.createdAt));

    return NextResponse.json({ posts });
  } catch (err) {
    console.error("Admin blog list error:", err);
    return NextResponse.json(
      { error: "Failed to load blog posts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/blog
 * Create a new blog post.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const body = await req.json();
    const { slug, title, description, category, readTime, content, published } = body;

    if (!slug?.trim() || !title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "slug, title, and content are required" },
        { status: 400 }
      );
    }

    const cleanSlug = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const [created] = await db
      .insert(blogPost)
      .values({
        slug: cleanSlug,
        title: title.trim(),
        description: (description || "").trim(),
        category: (category || "General").trim(),
        readTime: (readTime || "5 min").trim(),
        content: content.trim(),
        published: published !== false,
        authorId: admin.userId,
      })
      .returning();

    return NextResponse.json({ post: created }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("duplicate") || message.includes("unique")) {
      return NextResponse.json(
        { error: "A post with that slug already exists" },
        { status: 409 }
      );
    }
    console.error("Admin blog create error:", err);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
