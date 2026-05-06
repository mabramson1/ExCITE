import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { findUserByApiKey } from "@/lib/api-key";

/**
 * Authenticate an extension request. Tries two methods in order:
 *
 *  1. Session cookie (when the user is signed in to docsquared.app in the
 *     same browser). The browser includes the cookie automatically when
 *     the extension uses `credentials: 'include'`. This is the default.
 *
 *  2. Bearer API key (for power users / scripted workflows). The extension
 *     can fall back to this if cookies aren't available.
 *
 * Returns { userId } or null.
 */
export async function authenticateExtensionRequest(
  req: NextRequest
): Promise<{ userId: string; method: "session" | "key" } | null> {
  // Try session cookie first
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) {
      return { userId: session.user.id, method: "session" };
    }
  } catch {
    // Fall through to API key
  }

  // Fall back to Bearer API key
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (token) {
    const userId = await findUserByApiKey(token);
    if (userId) return { userId, method: "key" };
  }

  return null;
}

/**
 * CORS headers for extension endpoints.
 *
 * Extensions have a unique origin like `chrome-extension://abcdef...`.
 * To support cookies (`credentials: 'include'`), we must echo the request
 * origin back in `Access-Control-Allow-Origin` instead of using `*`, and
 * set `Access-Control-Allow-Credentials: true`.
 */
export function extensionCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  // Allow extension origins (chrome-extension://, moz-extension://) and
  // our own production origin (for testing from the website itself).
  const allowedOrigin =
    origin.startsWith("chrome-extension://") ||
    origin.startsWith("moz-extension://") ||
    origin === "https://docsquared.app" ||
    origin === "http://localhost:3000"
      ? origin
      : "*";

  // When echoing a specific origin, we can include credentials.
  // When using "*", credentials must NOT be allowed.
  const allowCredentials = allowedOrigin !== "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    ...(allowCredentials
      ? { "Access-Control-Allow-Credentials": "true" }
      : {}),
    Vary: "Origin",
  };
}

/** Wrap a NextResponse with extension CORS headers. */
export function withExtensionCors(
  res: Response,
  req: NextRequest
): Response {
  const headers = extensionCorsHeaders(req);
  for (const [k, v] of Object.entries(headers)) {
    res.headers.set(k, v);
  }
  return res;
}
