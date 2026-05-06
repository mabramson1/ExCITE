import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Authenticate an extension request using the user's docsquared.app session.
 *
 * The extension reads cookies via chrome.cookies API and forwards them via
 * the X-Docsq-Cookie header (since browsers strip the standard Cookie header
 * on cross-origin extension fetches when SameSite=Lax cookies are involved).
 *
 * Falls through to the standard cookie header for direct browser calls.
 */
export async function authenticateExtensionRequest(
  req: NextRequest
): Promise<{ userId: string } | null> {
  // Method 1: forwarded cookies from the extension
  const forwarded = req.headers.get("x-docsq-cookie");
  if (forwarded && forwarded.length > 0) {
    try {
      const fakeHeaders = new Headers();
      fakeHeaders.set("cookie", forwarded);
      const session = await auth.api.getSession({ headers: fakeHeaders });
      if (session?.user?.id) {
        return { userId: session.user.id };
      }
    } catch (err) {
      console.warn("[ExtensionAuth] forwarded cookie failed:", err);
    }
  }

  // Method 2: standard session cookie (direct browser calls)
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) {
      return { userId: session.user.id };
    }
  } catch (err) {
    console.warn("[ExtensionAuth] standard session failed:", err);
  }

  return null;
}

/**
 * CORS headers for extension endpoints. Extensions have origins like
 * `chrome-extension://abc...`. To support credentials, we echo the request
 * origin instead of using `*`.
 */
export function extensionCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin =
    origin.startsWith("chrome-extension://") ||
    origin.startsWith("moz-extension://") ||
    origin === "https://docsquared.app" ||
    origin === "http://localhost:3000"
      ? origin
      : "*";

  const allowCredentials = allowedOrigin !== "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Docsq-Cookie",
    "Access-Control-Max-Age": "86400",
    ...(allowCredentials ? { "Access-Control-Allow-Credentials": "true" } : {}),
    Vary: "Origin",
  };
}

/** Wrap a Response with extension CORS headers. */
export function withExtensionCors(res: Response, req: NextRequest): Response {
  const h = extensionCorsHeaders(req);
  for (const [k, v] of Object.entries(h)) {
    res.headers.set(k, v);
  }
  return res;
}
