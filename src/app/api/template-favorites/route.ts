import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { templateFavorite } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ favorites: [] });
    }

    const rows = await db
      .select({ templateId: templateFavorite.templateId })
      .from(templateFavorite)
      .where(eq(templateFavorite.userId, session.user.id));

    return NextResponse.json({ favorites: rows.map((r) => r.templateId) });
  } catch (error) {
    console.error("Template favorites fetch error:", error);
    return NextResponse.json({ favorites: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await req.json();
    if (!templateId || typeof templateId !== "string") {
      return NextResponse.json({ error: "templateId required" }, { status: 400 });
    }

    await db
      .insert(templateFavorite)
      .values({ userId: session.user.id, templateId })
      .onConflictDoNothing();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Template favorite add error:", error);
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await req.json();
    if (!templateId || typeof templateId !== "string") {
      return NextResponse.json({ error: "templateId required" }, { status: 400 });
    }

    await db
      .delete(templateFavorite)
      .where(
        and(
          eq(templateFavorite.userId, session.user.id),
          eq(templateFavorite.templateId, templateId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Template favorite delete error:", error);
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }
}
