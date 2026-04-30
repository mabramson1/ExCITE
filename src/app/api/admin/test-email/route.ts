import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendVerificationEmail } from "@/lib/email";

/**
 * Admin-only debug endpoint to test that Resend is working.
 * GET /api/admin/test-email?to=you@example.com
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const to = req.nextUrl.searchParams.get("to") || admin.email;

  const hasKey = !!process.env.RESEND_API_KEY;
  const result = await sendVerificationEmail({
    to,
    url: "https://docsquared.app/verify-email?token=TEST",
    name: "Test User",
  });

  return NextResponse.json({
    resend_key_configured: hasKey,
    sent_to: to,
    result,
  });
}
