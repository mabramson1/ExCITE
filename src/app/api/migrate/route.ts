import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * Public migration endpoint — adds columns that may be missing from prod.
 * Idempotent and safe to call repeatedly. No auth required since login
 * is broken without it.
 */
export async function GET() {
  try {
    await db.execute(sql.raw(`
      ALTER TABLE "user"
        ADD COLUMN IF NOT EXISTS last_credit_warning TIMESTAMP
    `));

    return NextResponse.json({ ok: true, message: "Schema patched — login should work now." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500 }
    );
  }
}
