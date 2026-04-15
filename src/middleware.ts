import { NextRequest, NextResponse } from "next/server";

/**
 * Simple site-wide password protection.
 * Set SITE_PASSWORD env var on Vercel to enable.
 * Users enter the password once and get a cookie for 7 days.
 */
export function middleware(request: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD;

  // No password set = no protection
  if (!sitePassword) return NextResponse.next();

  // Skip API routes, password page, shared pages, and static assets
  if (
    request.nextUrl.pathname.startsWith("/api/") ||
    request.nextUrl.pathname === "/password" ||
    request.nextUrl.pathname.startsWith("/share/") ||
    request.nextUrl.pathname.startsWith("/_next/") ||
    request.nextUrl.pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check for valid auth cookie
  const authCookie = request.cookies.get("site_auth")?.value;
  if (authCookie === sitePassword) {
    return NextResponse.next();
  }

  // Redirect to password page
  const url = request.nextUrl.clone();
  url.pathname = "/password";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
