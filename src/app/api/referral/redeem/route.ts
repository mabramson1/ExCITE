import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { findReferrerByCode, recordReferral } from "@/lib/referral";

/**
 * POST /api/referral/redeem
 * Body: { code: string }
 *
 * Called once after signup (from a sessionStorage-saved code or direct entry).
 * Records the referral and grants both sides bonus credits for the rest of
 * the current month. Idempotent: a user can only be referred once.
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const referrerId = await findReferrerByCode(code);
    if (!referrerId) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 404 }
      );
    }

    const recorded = await recordReferral(referrerId, auth.userId);
    if (!recorded) {
      return NextResponse.json(
        { error: "Already referred or self-referral" },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Referral redeem error:", err);
    return NextResponse.json(
      { error: "Failed to redeem referral" },
      { status: 500 }
    );
  }
}
