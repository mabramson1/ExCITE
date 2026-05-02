import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sharedTemplate, templateStar, user } from "@/lib/db/schema";
import { eq, desc, sql, and, ilike, or } from "drizzle-orm";
import { requireUser } from "@/lib/api-auth";

/**
 * GET /api/templates/shared
 * List community templates with pagination, sorting, search, and category filter.
 * Optionally returns whether the current user has starred each template.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const sort = searchParams.get("sort") === "recent" ? "recent" : "stars";
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const userId = searchParams.get("userId") || "";

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(sharedTemplate.name, `%${search}%`),
          ilike(sharedTemplate.description, `%${search}%`)
        )
      );
    }
    if (category) {
      conditions.push(eq(sharedTemplate.category, category));
    }

    const whereClause = conditions.length > 0
      ? and(...conditions)
      : undefined;

    const orderBy = sort === "recent"
      ? desc(sharedTemplate.createdAt)
      : desc(sharedTemplate.starCount);

    // Main query with author name JOIN
    const rows = await db
      .select({
        id: sharedTemplate.id,
        authorId: sharedTemplate.authorId,
        authorName: user.name,
        name: sharedTemplate.name,
        description: sharedTemplate.description,
        category: sharedTemplate.category,
        skeleton: sharedTemplate.skeleton,
        starCount: sharedTemplate.starCount,
        createdAt: sharedTemplate.createdAt,
        updatedAt: sharedTemplate.updatedAt,
      })
      .from(sharedTemplate)
      .innerJoin(user, eq(sharedTemplate.authorId, user.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // If userId provided, check which templates the user has starred
    let starredSet = new Set<string>();
    if (userId && rows.length > 0) {
      const templateIds = rows.map((r) => r.id);
      const stars = await db
        .select({ templateId: templateStar.templateId })
        .from(templateStar)
        .where(
          and(
            eq(templateStar.userId, userId),
            sql`${templateStar.templateId} = ANY(${templateIds})`
          )
        );
      starredSet = new Set(stars.map((s) => s.templateId));
    }

    // Count total for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sharedTemplate)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    return NextResponse.json({
      templates: rows.map((r) => ({
        ...r,
        starred: starredSet.has(r.id),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Shared templates list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates/shared
 * Share a new template to the marketplace. Requires auth.
 */
export async function POST(req: NextRequest) {
  const authResult = await requireUser();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const body = await req.json();
    const { name, description, category, skeleton } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!skeleton || typeof skeleton !== "string" || !skeleton.trim()) {
      return NextResponse.json({ error: "Skeleton template text is required" }, { status: 400 });
    }
    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const [created] = await db
      .insert(sharedTemplate)
      .values({
        authorId: userId,
        name: name.trim(),
        description: typeof description === "string" ? description.trim() || null : null,
        category: category.trim().toLowerCase(),
        skeleton: skeleton.trim(),
      })
      .returning();

    return NextResponse.json({ template: created }, { status: 201 });
  } catch (error) {
    console.error("Share template error:", error);
    return NextResponse.json(
      { error: "Failed to share template" },
      { status: 500 }
    );
  }
}
