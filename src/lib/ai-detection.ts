/**
 * Open-source AI text detection integrations.
 *
 * Two detectors:
 *  - Sapling API (https://sapling.ai) — commercial detector with a free tier
 *    (~50k chars/month) that is retrained on modern LLMs (GPT-4o/5, Claude,
 *    Gemini) and handles essay-style prose well.
 *  - Local 2026 heuristic detector — burstiness + em-dash density + pivot
 *    phrases + rhetorical "not X but Y" patterns. Always available, no API.
 *
 * HuggingFace hf-inference detectors were previously wired in but removed: the
 * free router is CPU-only and only auto-loads models that register with
 * `AutoModelForSequenceClassification`. The only model on HF that both works
 * on the free tier AND is from the last year (PirateXX/AI-Content-Detector)
 * was returning unreliable scores in production, so we dropped HF entirely.
 * The Claude-based deep analysis + Sapling + local heuristics cover the same
 * ground more reliably.
 */

export interface ExternalDetectionResult {
  source: string;
  model: string;
  ai_probability: number;
  human_probability: number;
  verdict: string;
  available: boolean;
  error?: string;
}

/**
 * Local 2026 heuristic detector.
 *
 * Combines signals that are characteristic of modern LLMs (GPT-5, Claude 4.x,
 * Gemini 2.x, Llama 4+):
 *
 *  1. Burstiness — variance in sentence length. Humans vary widely; LLMs
 *     produce metronomic rhythm.
 *  2. Em-dash density — per 1000 words. Modern LLMs love em-dashes as breath
 *     marks.
 *  3. Adverbial/pivot-phrase openers — "Importantly," "Here's the thing,"
 *     "At its core," "Ultimately,"
 *  4. Triadic-parallelism / "not-X-but-Y" rhetorical constructions.
 *  5. Perfect-punctuation cleanliness — zero apostrophe inconsistency,
 *     perfectly consistent capitalization.
 *
 * Purely local, no API call. Fast and always available.
 */
export function detectStatistical2026(text: string): ExternalDetectionResult {
  const trimmed = text.trim();
  if (trimmed.length < 40) {
    return {
      source: "Local heuristics (2026)",
      model: "burstiness+rhetoric+em-dash",
      ai_probability: 0,
      human_probability: 0,
      verdict: "unavailable",
      available: false,
      error: "Text too short for reliable statistical analysis.",
    };
  }

  // Split into sentences
  const sentences = trimmed
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .filter((s) => s.trim().length > 0);

  if (sentences.length < 3) {
    return {
      source: "Local heuristics (2026)",
      model: "burstiness+rhetoric+em-dash",
      ai_probability: 0,
      human_probability: 0,
      verdict: "unavailable",
      available: false,
      error: "Need at least 3 sentences for burstiness analysis.",
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // ── Signal 1: Burstiness (sentence-length variance / mean) ─────
  const sentLens = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const mean = sentLens.reduce((a, b) => a + b, 0) / sentLens.length;
  const variance =
    sentLens.reduce((sum, x) => sum + (x - mean) ** 2, 0) / sentLens.length;
  const stdev = Math.sqrt(variance);
  // Coefficient of variation: stdev / mean. Low = metronomic = AI.
  const cv = mean > 0 ? stdev / mean : 0;
  // Human prose typically 0.55-0.9. AI often 0.2-0.5. Map inversely.
  const burstinessAiScore = Math.max(0, Math.min(1, (0.6 - cv) / 0.4));

  // ── Signal 2: Em-dash density per 1000 words ───────────────────
  const emDashCount = (trimmed.match(/—/g) || []).length;
  const emDashPer1000 = wordCount > 0 ? (emDashCount / wordCount) * 1000 : 0;
  // Human baseline ~1-3 per 1000 words. Modern LLMs 8-30+ per 1000. Clamp.
  const emDashAiScore = Math.max(0, Math.min(1, (emDashPer1000 - 3) / 15));

  // ── Signal 3: Adverbial / pivot-phrase openers per sentence ────
  const pivotOpeners = [
    /^importantly,/i, /^crucially,/i, /^notably,/i, /^fundamentally,/i,
    /^essentially,/i, /^ultimately,/i, /^moreover,/i, /^furthermore,/i,
    /^additionally,/i, /^here'?s (the thing|why|what|the truth)/i,
    /^let'?s (be|unpack|dive|explore)/i, /^at its core/i,
    /^the (real )?question is/i, /^think of (it|this) like/i,
    /^that'?s the beauty of/i, /^let me be (direct|clear|honest)/i,
  ];
  let pivotHits = 0;
  for (const s of sentences) {
    const trim = s.trim();
    for (const re of pivotOpeners) {
      if (re.test(trim)) {
        pivotHits++;
        break;
      }
    }
  }
  const pivotRatio = pivotHits / sentences.length;
  // Even 1 per ~10 sentences is suspicious
  const pivotAiScore = Math.max(0, Math.min(1, pivotRatio * 10));

  // ── Signal 4: Rhetorical constructions ─────────────────────────
  const rhetoricalPatterns = [
    /\bit'?s not (just )?\w+.{0,60}\bit'?s\b/gi,
    /\bnot (just )?\w+ [—-] /gi,
    /\b(isn'?t|isn't just) about \w+.{0,60}\bit'?s about/gi,
  ];
  let rhetoricHits = 0;
  for (const re of rhetoricalPatterns) {
    const matches = trimmed.match(re);
    if (matches) rhetoricHits += matches.length;
  }
  const rhetoricPer1000 = wordCount > 0 ? (rhetoricHits / wordCount) * 1000 : 0;
  // Humans rarely use > 1 per 1000 words
  const rhetoricAiScore = Math.max(0, Math.min(1, rhetoricPer1000 / 2));

  // ── Signal 5: Cleanliness proxy (typo-free + consistent) ───────
  // We don't have a real grammar checker, so we check for things
  // that only humans produce irregularly
  const hasLowerCaseStart = /(?<=[.!?]\s)[a-z]/.test(trimmed);
  const hasDoubleSpace = / {2,}/.test(trimmed);
  const hasInconsistentCase = /\b([A-Z][a-z]+)\b[^.]*?\b\1\b/.test(trimmed); // can't truly check — placeholder
  // Presence of quirks reduces AI score (suggests human)
  const quirks = [hasLowerCaseStart, hasDoubleSpace].filter(Boolean).length;
  const cleanlinessAiScore = wordCount > 100 && quirks === 0 ? 0.2 : 0;
  void hasInconsistentCase; // not used yet

  // ── Weighted combination ────────────────────────────────────────
  const combined =
    0.3 * burstinessAiScore +
    0.25 * emDashAiScore +
    0.2 * pivotAiScore +
    0.15 * rhetoricAiScore +
    0.1 * cleanlinessAiScore;

  const aiProb = Math.max(0, Math.min(1, combined));
  const humanProb = 1 - aiProb;

  let verdict: string;
  if (aiProb >= 0.8) verdict = "definitely_ai";
  else if (aiProb >= 0.55) verdict = "likely_ai";
  else if (aiProb >= 0.3) verdict = "possibly_ai";
  else verdict = "likely_human";

  return {
    source: "Local heuristics (2026)",
    model: `burstiness=${cv.toFixed(2)}, em-dash/1k=${emDashPer1000.toFixed(1)}, pivots=${pivotHits}, rhetoric=${rhetoricHits}`,
    ai_probability: Math.round(aiProb * 1000) / 1000,
    human_probability: Math.round(humanProb * 1000) / 1000,
    verdict,
    available: true,
  };
}

/**
 * Sapling AI detector.
 *
 * Uses Sapling's AI-detection API. Free tier ~50k characters/month via an API
 * key from https://sapling.ai/ -> Dashboard -> API Keys. Sapling retrains on
 * modern LLMs (GPT-4o/5, Claude, Gemini) and handles essay-style prose well.
 *
 * Requires SAPLING_API_KEY environment variable.
 */
export async function detectWithSapling(
  text: string
): Promise<ExternalDetectionResult> {
  const unavailable = (error: string): ExternalDetectionResult => ({
    source: "Sapling",
    model: "sapling-aidetect",
    ai_probability: 0,
    human_probability: 0,
    verdict: "unavailable",
    available: false,
    error,
  });

  try {
    if (!process.env.SAPLING_API_KEY) {
      return unavailable(
        "SAPLING_API_KEY not configured. Get a free key at https://sapling.ai/"
      );
    }

    const res = await fetch("https://api.sapling.ai/api/v1/aidetect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: process.env.SAPLING_API_KEY,
        text,
      }),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return unavailable("Sapling API key rejected. Verify the key.");
      }
      if (res.status === 429) {
        return unavailable("Sapling rate limit exceeded. Try again later.");
      }
      throw new Error(`Sapling API error: ${res.status}`);
    }

    const data = await res.json();
    // Response shape: { score: <0..1 AI probability>, sentence_scores?: [...] }
    const aiProb: number = typeof data.score === "number" ? data.score : 0;
    const humanProb = Math.max(0, 1 - aiProb);

    let verdict: string;
    if (aiProb >= 0.8) verdict = "definitely_ai";
    else if (aiProb >= 0.55) verdict = "likely_ai";
    else if (aiProb >= 0.3) verdict = "possibly_ai";
    else verdict = "likely_human";

    return {
      source: "Sapling",
      model: "sapling-aidetect",
      ai_probability: Math.round(aiProb * 1000) / 1000,
      human_probability: Math.round(humanProb * 1000) / 1000,
      verdict,
      available: true,
    };
  } catch (error) {
    console.error("Sapling detector error:", error);
    return {
      source: "Sapling",
      model: "sapling-aidetect",
      ai_probability: 0,
      human_probability: 0,
      verdict: "error",
      available: false,
      error: error instanceof Error ? error.message : "Detection failed",
    };
  }
}

/**
 * Run all available external detectors and return aggregated results.
 */
export async function runExternalDetectors(
  text: string
): Promise<ExternalDetectionResult[]> {
  const results = await Promise.allSettled([
    detectWithSapling(text),
    Promise.resolve(detectStatistical2026(text)),
  ]);

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : {
          source: "Unknown",
          model: "unknown",
          ai_probability: 0,
          human_probability: 0,
          verdict: "error",
          available: false,
          error: "Detection failed",
        }
  );
}
