/**
 * Open-source AI text detection integrations.
 *
 * Uses HuggingFace Inference API with the `openai-community/roberta-base-openai-detector`
 * model — the most widely-used open-source AI text detector (based on RoBERTa,
 * trained on GPT-2 outputs, generalizes to other models).
 *
 * Free tier: no API key required for moderate usage.
 * With HF_API_TOKEN: higher rate limits.
 */

const HF_API_URL =
  "https://api-inference.huggingface.co/models/openai-community/roberta-base-openai-detector";

interface HfClassificationResult {
  label: string; // "LABEL_0" (Real/Human) or "LABEL_1" (Fake/AI)
  score: number;
}

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
 * Detect AI-generated text using HuggingFace's RoBERTa-based detector.
 *
 * The model has a ~512 token limit. For longer texts, we split into chunks,
 * run detection on each, and average the scores.
 */
export async function detectWithRoberta(
  text: string
): Promise<ExternalDetectionResult> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (process.env.HF_API_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.HF_API_TOKEN}`;
    }

    // Split long text into chunks (~400 words each to stay within token limits)
    const chunks = splitIntoChunks(text, 400);
    const results: { ai: number; human: number }[] = [];

    for (const chunk of chunks) {
      const res = await fetch(HF_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ inputs: chunk }),
      });

      if (!res.ok) {
        // Model might be loading (503) — return unavailable
        if (res.status === 503) {
          return {
            source: "HuggingFace",
            model: "openai-community/roberta-base-openai-detector",
            ai_probability: 0,
            human_probability: 0,
            verdict: "unavailable",
            available: false,
            error: "Model is loading. Please try again in a few seconds.",
          };
        }
        throw new Error(`HuggingFace API error: ${res.status}`);
      }

      const data = await res.json();

      // Response is [[{label, score}, {label, score}]]
      const classifications: HfClassificationResult[] = Array.isArray(data[0])
        ? data[0]
        : data;

      let aiScore = 0;
      let humanScore = 0;

      for (const item of classifications) {
        if (item.label === "LABEL_0" || item.label === "Real") {
          humanScore = item.score;
        } else if (item.label === "LABEL_1" || item.label === "Fake") {
          aiScore = item.score;
        }
      }

      results.push({ ai: aiScore, human: humanScore });
    }

    // Average across chunks
    const avgAi =
      results.reduce((sum, r) => sum + r.ai, 0) / results.length;
    const avgHuman =
      results.reduce((sum, r) => sum + r.human, 0) / results.length;

    let verdict: string;
    if (avgAi >= 0.8) verdict = "definitely_ai";
    else if (avgAi >= 0.55) verdict = "likely_ai";
    else if (avgAi >= 0.3) verdict = "possibly_ai";
    else verdict = "likely_human";

    return {
      source: "HuggingFace",
      model: "openai-community/roberta-base-openai-detector",
      ai_probability: Math.round(avgAi * 1000) / 1000,
      human_probability: Math.round(avgHuman * 1000) / 1000,
      verdict,
      available: true,
    };
  } catch (error) {
    console.error("RoBERTa detection error:", error);
    return {
      source: "HuggingFace",
      model: "openai-community/roberta-base-openai-detector",
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
  const results = await Promise.allSettled([detectWithRoberta(text)]);

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

function splitIntoChunks(text: string, wordsPerChunk: number): string[] {
  const words = text.split(/\s+/);
  if (words.length <= wordsPerChunk) return [text];

  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }
  return chunks;
}
