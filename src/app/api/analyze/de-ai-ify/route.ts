import { NextRequest, NextResponse } from "next/server";
import { deAiifyText } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";
import { runExternalDetectors } from "@/lib/ai-detection";
import { autoSaveProject } from "@/lib/auto-save";

export async function POST(req: NextRequest) {
  try {
    const { text, writingStyle = "general", verifyAfter = true } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const phiResult = scanAndCensorPhi(text);
    const analysis = await deAiifyText(phiResult.censoredText, writingStyle);

    let parsed;
    try {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: analysis };
    } catch {
      parsed = { raw: analysis };
    }

    // Closed-loop verification: run original and rewritten text through AI detector
    if (verifyAfter && parsed.rewritten_text) {
      try {
        const [originalScores, rewrittenScores] = await Promise.all([
          runExternalDetectors(phiResult.censoredText),
          runExternalDetectors(parsed.rewritten_text),
        ]);

        const originalAvailable = originalScores.filter((r) => r.available);
        const rewrittenAvailable = rewrittenScores.filter((r) => r.available);

        if (originalAvailable.length > 0 && rewrittenAvailable.length > 0) {
          const originalAiScore =
            originalAvailable.reduce((sum, r) => sum + r.ai_probability, 0) /
            originalAvailable.length;
          const rewrittenAiScore =
            rewrittenAvailable.reduce((sum, r) => sum + r.ai_probability, 0) /
            rewrittenAvailable.length;

          parsed.verification = {
            original_ai_score: Math.round(originalAiScore * 1000) / 1000,
            rewritten_ai_score: Math.round(rewrittenAiScore * 1000) / 1000,
            improvement: Math.round((originalAiScore - rewrittenAiScore) * 1000) / 1000,
            original_verdict: getVerdict(originalAiScore),
            rewritten_verdict: getVerdict(rewrittenAiScore),
            detector_source: originalAvailable[0]?.model || "unknown",
          };
        }
      } catch {
        // Verification failed, continue without it
      }
    }

    const savedId = await autoSaveProject({
      type: "deai",
      inputText: text,
      outputText: parsed,
      phiDetected: phiResult.hasPhi,
      metadata: { writingStyle },
    });

    return NextResponse.json({
      result: parsed,
      savedId,
      phi: {
        detected: phiResult.hasPhi,
        warnings: phiResult.warnings,
        detectedTypes: phiResult.detectedTypes,
      },
    });
  } catch (error) {
    console.error("De-AI-ify error:", error);
    return NextResponse.json(
      { error: "Failed to process text" },
      { status: 500 }
    );
  }
}

function getVerdict(score: number): string {
  if (score >= 0.8) return "definitely_ai";
  if (score >= 0.55) return "likely_ai";
  if (score >= 0.3) return "possibly_ai";
  return "likely_human";
}
