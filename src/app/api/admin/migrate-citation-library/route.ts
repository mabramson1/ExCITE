import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Admin-only one-shot endpoint to create the citation_library table on prod.
 * Idempotent — safe to call repeatedly.
 */
export async function POST() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS "citation_library" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" text NOT NULL,
        "pmid" text,
        "doi" text,
        "title" text NOT NULL,
        "authors" text NOT NULL,
        "journal" text,
        "year" text,
        "tags" jsonb,
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `));

    await db.execute(sql.raw(`
      DO $$ BEGIN
        ALTER TABLE "citation_library"
          ADD CONSTRAINT "citation_library_user_id_user_id_fk"
          FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `));

    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS "citation_library_user_id_idx" ON "citation_library" ("user_id")
    `));
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS "citation_library_created_at_idx" ON "citation_library" ("created_at")
    `));

    return NextResponse.json({ ok: true, message: "citation_library table ready" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500 }
    );
  }
}
