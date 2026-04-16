import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST(req: Request) {
  const auth = req.headers.get("x-migration-token");
  if (auth !== process.env.BETTER_AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "template_favorite" (
        "user_id" text NOT NULL,
        "template_id" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        PRIMARY KEY ("user_id", "template_id"),
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);
    return NextResponse.json({ success: true, message: "template_favorite table created" });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Migration failed",
    }, { status: 500 });
  }
}
