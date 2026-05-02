import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { citationLibrary } from "@/lib/db/schema";
import { eq, desc, or, ilike, sql } from "drizzle-orm";
import { requireUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const authResult = await requireUser();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const search = req.nextUrl.searchParams.get("search")?.trim();

    let rows;
    if (search) {
      const pattern = `%${search}%`;
      rows = await db
        .select()
        .from(citationLibrary)
        .where(
          sql`${citationLibrary.userId} = ${userId} AND (
            ${citationLibrary.title} ILIKE ${pattern} OR
            ${citationLibrary.authors} ILIKE ${pattern} OR
            ${citationLibrary.tags}::text ILIKE ${pattern}
          )`
        )
        .orderBy(desc(citationLibrary.createdAt));
    } else {
      rows = await db
        .select()
        .from(citationLibrary)
        .where(eq(citationLibrary.userId, userId))
        .orderBy(desc(citationLibrary.createdAt));
    }

    return NextResponse.json({ citations: rows });
  } catch (error) {
    console.error("Citation library fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch citations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireUser();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const body = await req.json();
    const { pmid, doi, title, authors, journal, year, tags, notes } = body;

    if (!title || typeof title !== "string" || !authors || typeof authors !== "string") {
      return NextResponse.json(
        { error: "title and authors are required" },
        { status: 400 }
      );
    }

    const [inserted] = await db
      .insert(citationLibrary)
      .values({
        userId,
        pmid: pmid || null,
        doi: doi || null,
        title,
        authors,
        journal: journal || null,
        year: year || null,
        tags: tags || null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({ citation: inserted }, { status: 201 });
  } catch (error) {
    console.error("Citation library save error:", error);
    return NextResponse.json(
      { error: "Failed to save citation" },
      { status: 500 }
    );
  }
}
