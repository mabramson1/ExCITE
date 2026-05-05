import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { makeReferralCode, getReferralStats, REFERRAL_BONUS } from "@/lib/referral";

/**
 * GET /api/referral/me
 * Returns the current user's referral code, share URL, and stats.
 */
export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const code = makeReferralCode(auth.userId);
  const stats = await getReferralStats(auth.userId);

  return NextResponse.json({
    code,
    bonus: REFERRAL_BONUS,
    ...stats,
  });
}
