import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Admin-only one-shot endpoint to create the usage_meter table on prod.
 * Idempotent — safe to call repeatedly.
 */
export async function POST() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS "usage_meter" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" text NOT NULL,
        "tool" text NOT NULL,
        "credits" integer NOT NULL,
        "input_tokens" integer DEFAULT 0 NOT NULL,
        "output_tokens" integer DEFAULT 0 NOT NULL,
        "cache_read_tokens" integer DEFAULT 0 NOT NULL,
        "cache_write_tokens" integer DEFAULT 0 NOT NULL,
        "cost_millicents" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `));

    await db.execute(sql.raw(`
      DO $$ BEGIN
        ALTER TABLE "usage_meter"
          ADD CONSTRAINT "usage_meter_user_id_user_id_fk"
          FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `));

    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS "usage_meter_user_id_idx" ON "usage_meter" ("user_id")
    `));
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS "usage_meter_created_at_idx" ON "usage_meter" ("created_at")
    `));

    return NextResponse.json({ ok: true, message: "usage_meter table ready" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500 }
    );
  }
}
