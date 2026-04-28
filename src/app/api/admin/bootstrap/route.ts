import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * One-time admin bootstrap endpoint.
 * Visit /api/admin/bootstrap?email=YOUR_EMAIL to:
 * 1. Create the role column if it doesn't exist
 * 2. Set the specified user as admin
 *
 * Self-destructs: only works when no admin exists yet.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Pass ?email=your@email.com" }, { status: 400 });
  }

  try {
    // Step 1: Create the enum and column if they don't exist
    await db.execute(sql.raw(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('free', 'pro', 'unlimited', 'admin');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `));
    await db.execute(sql.raw(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'free'
    `));

    // Step 2: Check if any admin already exists
    const admins = await db.execute(sql.raw(`SELECT id FROM "user" WHERE role = 'admin' LIMIT 1`));
    const adminList = admins as unknown as { id: string }[];
    if (adminList.length > 0) {
      return NextResponse.json({ error: "Admin already exists. Bootstrap disabled." }, { status: 403 });
    }

    // Step 3: Set the specified user as admin
    const result = await db.execute(
      sql`UPDATE "user" SET role = 'admin' WHERE email = ${email}`
    );
    const updated = result as unknown as { count?: number }[];

    // Step 4: Also create the other tables if missing
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS user_preference (
        user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
        voice_sample_clinical TEXT,
        voice_sample_general TEXT,
        default_brevity TEXT DEFAULT 'standard',
        default_writing_style TEXT DEFAULT 'general',
        default_citation_style TEXT,
        custom_templates JSONB,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `));
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS subscription (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        plan TEXT NOT NULL DEFAULT 'free',
        status TEXT NOT NULL DEFAULT 'active',
        current_period_end TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `));

    return NextResponse.json({
      success: true,
      message: `${email} is now admin. All tables created. Refresh the app.`,
    });
  } catch (error) {
    console.error("Bootstrap error:", error);
    return NextResponse.json(
      { error: "Bootstrap failed", detail: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
