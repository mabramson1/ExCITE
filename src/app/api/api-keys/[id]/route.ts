import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { apiKey } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/** DELETE /api/api-keys/[id] — revoke a key (own only). */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const [deleted] = await db
    .delete(apiKey)
    .where(and(eq(apiKey.id, id), eq(apiKey.userId, auth.userId)))
    .returning({ id: apiKey.id });

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
