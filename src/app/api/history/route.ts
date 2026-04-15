import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { project } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await db
      .select({
        id: project.id,
        title: project.title,
        type: project.type,
        citationStyle: project.citationStyle,
        phiDetected: project.phiDetected,
        createdAt: project.createdAt,
        metadata: project.metadata,
      })
      .from(project)
      .where(eq(project.userId, session.user.id))
      .orderBy(desc(project.createdAt))
      .limit(50);

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, type, inputText, outputText, citationStyle, metadata, phiDetected } = body;

    if (!title || !type || !inputText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [saved] = await db
      .insert(project)
      .values({
        userId: session.user.id,
        title,
        type,
        inputText,
        outputText: outputText ? JSON.stringify(outputText) : null,
        citationStyle: citationStyle || null,
        metadata: metadata || null,
        phiDetected: phiDetected || false,
      })
      .returning({ id: project.id, createdAt: project.createdAt });

    return NextResponse.json({ saved });
  } catch (error) {
    console.error("History save error:", error);
    return NextResponse.json(
      { error: "Failed to save to history" },
      { status: 500 }
    );
  }
}
