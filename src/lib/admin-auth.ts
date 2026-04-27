import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Require the current user to have admin role.
 * Returns user data if admin, or a 403 response if not.
 */
export async function requireAdmin(): Promise<
  { userId: string; email: string; name: string } | NextResponse
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [dbUser] = await db
    .select({ role: user.role, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!dbUser || dbUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return {
    userId: session.user.id,
    email: dbUser.email,
    name: dbUser.name,
  };
}
