import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Admin-only one-shot endpoint to create the shared_template and template_star
 * tables on prod. Idempotent — safe to call repeatedly.
 */
export async function POST() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    // Create shared_template table
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS "shared_template" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "author_id" text NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "category" text NOT NULL,
        "skeleton" text NOT NULL,
        "star_count" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `));

    // Add FK for shared_template.author_id -> user.id
    await db.execute(sql.raw(`
      DO $$ BEGIN
        ALTER TABLE "shared_template"
          ADD CONSTRAINT "shared_template_author_id_user_id_fk"
          FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE cascade;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `));

    // Create template_star table
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS "template_star" (
        "user_id" text NOT NULL,
        "template_id" uuid NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        PRIMARY KEY ("user_id", "template_id")
      )
    `));

    // Add FKs for template_star
    await db.execute(sql.raw(`
      DO $$ BEGIN
        ALTER TABLE "template_star"
          ADD CONSTRAINT "template_star_user_id_user_id_fk"
          FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `));

    await db.execute(sql.raw(`
      DO $$ BEGIN
        ALTER TABLE "template_star"
          ADD CONSTRAINT "template_star_template_id_shared_template_id_fk"
          FOREIGN KEY ("template_id") REFERENCES "shared_template"("id") ON DELETE cascade;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `));

    // Indexes for common queries
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS "shared_template_category_idx" ON "shared_template" ("category")
    `));
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS "shared_template_star_count_idx" ON "shared_template" ("star_count" DESC)
    `));
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS "shared_template_created_at_idx" ON "shared_template" ("created_at" DESC)
    `));
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS "shared_template_author_id_idx" ON "shared_template" ("author_id")
    `));

    return NextResponse.json({ ok: true, message: "shared_template + template_star tables ready" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500 }
    );
  }
}
