import { db } from "@/lib/db";
import { apiKey } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";

/** Public prefix so users can recognize the key on sight. */
export const API_KEY_PREFIX = "dsq_";

/** Generate a fresh raw API key. Format: dsq_<48 hex chars>. */
export function generateRawKey(): string {
  return API_KEY_PREFIX + randomBytes(24).toString("hex");
}

/** SHA-256 hash of the raw key, hex-encoded. */
export function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Last 4 visible characters for display. */
export function keyHint(raw: string): string {
  return raw.slice(-4);
}

/**
 * Look up the user owning a given raw API key. Returns null if not found
 * or malformed. Updates lastUsedAt as a side-effect.
 */
export async function findUserByApiKey(raw: string): Promise<string | null> {
  if (!raw || !raw.startsWith(API_KEY_PREFIX)) return null;
  const hash = hashKey(raw);
  const [row] = await db
    .select({ userId: apiKey.userId, id: apiKey.id })
    .from(apiKey)
    .where(eq(apiKey.keyHash, hash))
    .limit(1);
  if (!row) return null;
  // Touch lastUsedAt async, don't await
  db.update(apiKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKey.id, row.id))
    .catch(() => {});
  return row.userId;
}
