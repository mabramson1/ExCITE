import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * Debug endpoint: shows the current user's session + role.
 * Safe to expose temporarily — only shows info about the requesting user.
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({
        logged_in: false,
        message: "No active session. You need to sign in first.",
      });
    }

    // Check if role column exists
    let role = "unknown";
    try {
      const result = await db.execute(
        sql`SELECT role FROM "user" WHERE id = ${session.user.id}`
      );
      const rows = result as unknown as { role: string }[];
      role = rows[0]?.role ?? "column_missing";
    } catch (e) {
      role = `error: ${e instanceof Error ? e.message : "unknown"}`;
    }

    return NextResponse.json({
      logged_in: true,
      user_id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
      session_expires: session.session?.expiresAt,
    });
  } catch (error) {
    return NextResponse.json({
      error: "Session check failed",
      detail: error instanceof Error ? error.message : "unknown",
    });
  }
}
