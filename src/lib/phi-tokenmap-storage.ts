/**
 * PHI tokenMap persistence — localStorage-only, never goes to the server.
 *
 * When client-side PHI redaction is used, the tokenMap that lets us re-inject
 * real values into AI output stays purely on-device. This module persists those
 * maps keyed by the project's savedId so reloading from history still shows
 * the user's real data.
 *
 * Privacy guarantee: nothing in this file ever talks to the server.
 */

const STORAGE_KEY = "excite-phi-tokenmaps";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 90; // 90 days

interface StoredEntry {
  tokenMap: Record<string, string>;
  savedAt: number;
}

function readAll(): Record<string, StoredEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredEntry>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, StoredEntry>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be full or disabled — silently fail
  }
}

/**
 * Persist a tokenMap for a saved project. No-op if tokenMap is empty.
 */
export function saveTokenMap(savedId: string, tokenMap: Record<string, string>): void {
  if (!savedId || Object.keys(tokenMap).length === 0) return;
  const all = readAll();
  all[savedId] = { tokenMap, savedAt: Date.now() };
  // Opportunistic cleanup of expired entries
  const now = Date.now();
  for (const [k, v] of Object.entries(all)) {
    if (now - v.savedAt > MAX_AGE_MS) delete all[k];
  }
  writeAll(all);
}

/**
 * Look up a tokenMap by savedId. Returns empty object if not found.
 */
export function getTokenMap(savedId: string): Record<string, string> {
  if (!savedId) return {};
  const all = readAll();
  return all[savedId]?.tokenMap || {};
}

/**
 * Remove a tokenMap (e.g. when the project is deleted from history).
 */
export function deleteTokenMap(savedId: string): void {
  if (!savedId) return;
  const all = readAll();
  delete all[savedId];
  writeAll(all);
}

/**
 * Bulk lookup for the history page.
 */
export function getAllTokenMaps(): Record<string, Record<string, string>> {
  const all = readAll();
  const out: Record<string, Record<string, string>> = {};
  for (const [k, v] of Object.entries(all)) {
    out[k] = v.tokenMap;
  }
  return out;
}

/**
 * Wipe all stored tokenMaps. Call on sign-out so PHI doesn't leak across
 * users on a shared device.
 */
export function clearAllTokenMaps(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
