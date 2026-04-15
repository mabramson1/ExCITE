/**
 * Open-source AI text detection integrations.
 *
 * Uses HuggingFace Inference API with `Hello-SimpleAI/chatgpt-detector-roberta`
 * — a RoBERTa model trained on ChatGPT outputs (2023). Much more accurate for
 * modern AI text (GPT-3.5/4, Claude, Gemini) than the older GPT-2-era detector.
 *
 * Requires HF_API_TOKEN environment variable.
 */

const HF_MODEL = "Hello-SimpleAI/chatgpt-detector-roberta";
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

interface HfClassificationResult {
  label: string; // "ChatGPT" or "Human"
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
 * Detect AI-generated text using ChatGPT-trained RoBERTa detector.
 *
 * The model has a ~512 token limit. For longer texts, we split into chunks,
 * run detection on each, and average the scores.
 */
export async function detectWithRoberta(
  text: string
): Promise<ExternalDetectionResult> {
  const unavailable = (error: string): ExternalDetectionResult => ({
    source: "HuggingFace",
    model: HF_MODEL,
    ai_probability: 0,
    human_probability: 0,
    verdict: "unavailable",
    available: false,
    error,
  });

  try {
    if (!process.env.HF_API_TOKEN) {
      return unavailable(
        "HF_API_TOKEN not configured. Add a HuggingFace token to enable AI detection."
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
    };

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
        if (res.status === 503) {
          return unavailable(
            "Model is loading. Please try again in a few seconds."
          );
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
        if (item.label === "Human" || item.label === "LABEL_0" || item.label === "Real") {
          humanScore = item.score;
        } else if (item.label === "ChatGPT" || item.label === "LABEL_1" || item.label === "Fake") {
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
      model: HF_MODEL,
      ai_probability: Math.round(avgAi * 1000) / 1000,
      human_probability: Math.round(avgHuman * 1000) / 1000,
      verdict,
      available: true,
    };
  } catch (error) {
    console.error("ChatGPT detector error:", error);
    return {
      source: "HuggingFace",
      model: HF_MODEL,
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
