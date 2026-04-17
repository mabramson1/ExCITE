const MAX_REQUESTS = 20;
const WINDOW_MS = 60_000;
const MAX_INPUT_LENGTH = 50_000;

const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_REQUESTS - 1 };
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return { ok: false, remaining: 0 };
  }
  return { ok: true, remaining: MAX_REQUESTS - entry.count };
}

export function validateInput(text: unknown): { ok: boolean; error?: string } {
  if (!text || typeof text !== "string") {
    return { ok: false, error: "Text is required" };
  }
  if (text.length > MAX_INPUT_LENGTH) {
    return {
      ok: false,
      error: `Text exceeds maximum length of ${MAX_INPUT_LENGTH.toLocaleString()} characters`,
    };
  }
  if (text.trim().length === 0) {
    return { ok: false, error: "Text cannot be empty" };
  }
  return { ok: true };
}
