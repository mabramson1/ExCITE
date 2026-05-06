import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  authenticateExtensionRequest,
  extensionCorsHeaders,
  withExtensionCors,
} from "@/lib/extension-auth";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: extensionCorsHeaders(req),
  });
}

/**
 * Returns the signed-in user's basic info, or 401 if not authenticated.
 * Used by the extension popup to show "Connected as user@example.com".
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateExtensionRequest(req);
  if (!auth) {
    return withExtensionCors(
      NextResponse.json({ error: "Not signed in" }, { status: 401 }),
      req
    );
  }

  const [u] = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, auth.userId))
    .limit(1);

  return withExtensionCors(
    NextResponse.json({
      email: u?.email,
      name: u?.name,
      method: auth.method,
    }),
    req
  );
}
