import { db } from "@/lib/db";
import { referral, user } from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";

/** How many bonus credits each side gets when a referral signup happens. */
export const REFERRAL_BONUS = 10;

/**
 * Derive a stable, short, URL-safe referral code from a userId.
 * userId is opaque to outsiders (it's a Better Auth ID) so we hash + truncate
 * for a friendlier 8-character code.
 */
export function makeReferralCode(userId: string): string {
  // Simple djb2-style hash, base36 encoded, truncated to 8 chars
  let hash = 5381;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 33) ^ userId.charCodeAt(i);
  }
  // Use absolute value, base36, pad to ensure 8 chars
  const code = Math.abs(hash).toString(36).toUpperCase();
  return code.slice(0, 8).padStart(8, "0");
}

/**
 * Reverse lookup: given a referral code, find the user it belongs to.
 * Linear scan over the user table — fine for now since the user count is small,
 * and the code is generated from userId so we'd need an index column for O(1).
 */
export async function findReferrerByCode(code: string): Promise<string | null> {
  const cleanCode = code.trim().toUpperCase();
  if (cleanCode.length !== 8) return null;

  const users = await db.select({ id: user.id }).from(user);
  for (const u of users) {
    if (makeReferralCode(u.id) === cleanCode) return u.id;
  }
  return null;
}

/**
 * Record a referral. Returns true if recorded, false if the user was already
 * referred (one-time only) or referring themselves.
 */
export async function recordReferral(
  referrerId: string,
  referredUserId: string
): Promise<boolean> {
  if (referrerId === referredUserId) return false;

  // Check if this user was already referred
  const existing = await db
    .select({ id: referral.id })
    .from(referral)
    .where(eq(referral.referredUserId, referredUserId))
    .limit(1);
  if (existing.length > 0) return false;

  await db.insert(referral).values({
    referrerId,
    referredUserId,
    creditsAwarded: REFERRAL_BONUS,
  });
  return true;
}

/**
 * Sum of bonus credits earned by a user this calendar month.
 * Used by the credit limit checker to extend their monthly allotment.
 */
export async function getReferralBonusForMonth(userId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const result = await db.execute(sql`
    SELECT COALESCE(SUM(credits_awarded), 0)::int AS bonus
    FROM "referral"
    WHERE referrer_id = ${userId}
      AND created_at >= ${startOfMonth}
  `);
  const rows = result as unknown as { bonus: number }[];
  return rows[0]?.bonus ?? 0;
}

/** Lifetime referral count + total credits earned for the settings page. */
export async function getReferralStats(userId: string) {
  const [stats] = await db
    .select({
      totalReferrals: count(),
      totalCredits: sql<number>`COALESCE(SUM(${referral.creditsAwarded}), 0)::int`,
    })
    .from(referral)
    .where(eq(referral.referrerId, userId));

  return {
    totalReferrals: stats?.totalReferrals ?? 0,
    totalCredits: stats?.totalCredits ?? 0,
  };
}
