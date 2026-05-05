import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { apiKey } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateRawKey, hashKey, keyHint } from "@/lib/api-key";

/**
 * GET /api/api-keys
 * List the user's keys (hint + name + dates only, never the raw key).
 */
export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const keys = await db
    .select({
      id: apiKey.id,
      keyHint: apiKey.keyHint,
      name: apiKey.name,
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
    })
    .from(apiKey)
    .where(eq(apiKey.userId, auth.userId))
    .orderBy(desc(apiKey.createdAt));

  return NextResponse.json({ keys });
}

/**
 * POST /api/api-keys
 * Create a new API key. Returns the raw key ONCE — it cannot be retrieved later.
 * Body: { name?: string }
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const name = (body.name || "Browser Extension").toString().trim().slice(0, 60);

  const raw = generateRawKey();
  const [created] = await db
    .insert(apiKey)
    .values({
      userId: auth.userId,
      keyHash: hashKey(raw),
      keyHint: keyHint(raw),
      name,
    })
    .returning({
      id: apiKey.id,
      keyHint: apiKey.keyHint,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
    });

  return NextResponse.json({ key: created, raw }, { status: 201 });
}
