const CACHE_KEY = "docsq-is-admin";
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

interface CachedRole {
  isAdmin: boolean;
  ts: number;
}

export async function checkIsAdmin(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedRole = JSON.parse(cached);
      if (Date.now() - parsed.ts < CACHE_TTL) return parsed.isAdmin;
    }
  } catch {}

  try {
    const res = await fetch("/api/admin/whoami");
    if (!res.ok) {
      cache(false);
      return false;
    }
    const data = await res.json();
    const isAdmin = data?.role === "admin";
    cache(isAdmin);
    return isAdmin;
  } catch {
    return false;
  }
}

function cache(isAdmin: boolean) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ isAdmin, ts: Date.now() }));
  } catch {}
}

export function clearAdminCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch {}
}
