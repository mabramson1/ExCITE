import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// One-time migration endpoint. Protected by a secret token.
// Delete this file after running once.
export async function POST(req: Request) {
  const auth = req.headers.get("x-migration-token");
  if (auth !== process.env.BETTER_AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.execute(sql`ALTER TABLE project ADD COLUMN IF NOT EXISTS favorite boolean DEFAULT false NOT NULL`);
    await db.execute(sql`ALTER TABLE project ADD COLUMN IF NOT EXISTS share_id text UNIQUE`);
    return NextResponse.json({ success: true, message: "Columns added" });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Migration failed",
    }, { status: 500 });
  }
}
