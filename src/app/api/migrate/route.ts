import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { blogPost } from "@/lib/db/schema";
import { BLOG_POSTS } from "@/lib/blog-posts";

/**
 * Public one-shot migration endpoint. Runs all pending schema changes
 * with IF NOT EXISTS so it's safe to call repeatedly.
 *
 * Hit GET /api/migrate after each deploy to sync prod DB.
 */
export async function GET() {
  const results: string[] = [];

  try {
    // 1. Add lastCreditWarning column to user table
    await db.execute(sql.raw(`
      ALTER TABLE "user"
        ADD COLUMN IF NOT EXISTS last_credit_warning TIMESTAMP
    `));
    results.push("user.last_credit_warning column ready");

    // 2. Usage meter table
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
          ADD CONSTRAINT "usage_meter_user_id_fk"
          FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `));
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS "usage_meter_user_id_idx" ON "usage_meter" ("user_id")`));
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS "usage_meter_created_at_idx" ON "usage_meter" ("created_at")`));
    results.push("usage_meter table ready");

    // 3. Shared template table
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
    await db.execute(sql.raw(`
      DO $$ BEGIN
        ALTER TABLE "shared_template"
          ADD CONSTRAINT "shared_template_author_id_fk"
          FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE cascade;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `));
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS "shared_template_category_idx" ON "shared_template" ("category")`));
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS "shared_template_star_count_idx" ON "shared_template" ("star_count" DESC)`));
    results.push("shared_template table ready");

    // 4. Template star table
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS "template_star" (
        "user_id" text NOT NULL,
        "template_id" uuid NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        PRIMARY KEY ("user_id", "template_id")
      )
    `));
    await db.execute(sql.raw(`
      DO $$ BEGIN
        ALTER TABLE "template_star"
          ADD CONSTRAINT "template_star_user_id_fk"
          FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `));
    await db.execute(sql.raw(`
      DO $$ BEGIN
        ALTER TABLE "template_star"
          ADD CONSTRAINT "template_star_template_id_fk"
          FOREIGN KEY ("template_id") REFERENCES "shared_template"("id") ON DELETE cascade;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `));
    results.push("template_star table ready");

    // 5. Citation library table
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
          ADD CONSTRAINT "citation_library_user_id_fk"
          FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `));
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS "citation_library_user_id_idx" ON "citation_library" ("user_id")`));
    results.push("citation_library table ready");

    // 6. Add ON DELETE CASCADE to session + account if missing
    await db.execute(sql.raw(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'session_user_cascade'
        ) THEN
          ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_user_id_user_id_fk";
          ALTER TABLE "session"
            ADD CONSTRAINT "session_user_cascade"
            FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
        END IF;
      EXCEPTION WHEN others THEN null;
      END $$
    `));
    await db.execute(sql.raw(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'account_user_cascade'
        ) THEN
          ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_user_id_user_id_fk";
          ALTER TABLE "account"
            ADD CONSTRAINT "account_user_cascade"
            FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
        END IF;
      EXCEPTION WHEN others THEN null;
      END $$
    `));
    results.push("session + account cascade FKs patched");

    // 7. Blog post table
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS "blog_post" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "category" text NOT NULL,
        "read_time" text DEFAULT '5 min' NOT NULL,
        "content" text NOT NULL,
        "published" boolean DEFAULT true NOT NULL,
        "author_id" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `));
    await db.execute(sql.raw(`
      DO $$ BEGIN
        ALTER TABLE "blog_post"
          ADD CONSTRAINT "blog_post_author_id_fk"
          FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE set null;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `));
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS "blog_post_published_idx" ON "blog_post" ("published")`));
    results.push("blog_post table ready");

    // 8. Seed initial blog posts if table is empty
    const existing = await db.select({ id: blogPost.id }).from(blogPost).limit(1);
    if (existing.length === 0) {
      for (const post of BLOG_POSTS) {
        await db.insert(blogPost).values({
          slug: post.slug,
          title: post.title,
          description: post.description,
          category: post.category,
          readTime: post.readTime,
          content: post.content,
          published: true,
          createdAt: new Date(post.date),
        });
      }
      results.push(`seeded ${BLOG_POSTS.length} initial blog posts`);
    } else {
      results.push("blog posts already seeded, skipping");
    }

    return NextResponse.json({
      ok: true,
      migrations: results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Migration failed",
        completed: results,
      },
      { status: 500 }
    );
  }
}
