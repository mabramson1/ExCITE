import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Require an authenticated user for an API route.
 * Returns the userId if authenticated, or a 401 NextResponse if not.
 *
 * Usage:
 *   const result = await requireUser();
 *   if (result instanceof NextResponse) return result;
 *   const { userId } = result;
 */
export async function requireUser(): Promise<
  { userId: string; email?: string } | NextResponse
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: session.user.id, email: session.user.email };
}
