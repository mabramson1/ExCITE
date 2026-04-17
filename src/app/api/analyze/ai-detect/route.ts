import { NextRequest, NextResponse } from "next/server";
import { detectAiText } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";
import { runExternalDetectors } from "@/lib/ai-detection";
import { autoSaveProject } from "@/lib/auto-save";
import { checkRateLimit, validateInput } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const rl = checkRateLimit(ip);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const { text } = await req.json();
    const v = validateInput(text);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const phiResult = scanAndCensorPhi(text);

    // Run Claude analysis and external detectors in parallel.
    // Claude gets a 30-second timeout — if it's slow, we still return externals.
    const claudePromise = detectAiText(phiResult.censoredText);
    const externalPromise = runExternalDetectors(phiResult.censoredText);

    const claudeWithTimeout = Promise.race([
      claudePromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 30_000)),
    ]);

    const [analysisOrNull, externalResults] = await Promise.all([
      claudeWithTimeout,
      externalPromise,
    ]);

    let parsed;
    if (analysisOrNull) {
      try {
        const jsonMatch = analysisOrNull.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: analysisOrNull };
      } catch {
        parsed = { raw: analysisOrNull };
      }
    } else {
      parsed = {
        verdict: "unavailable",
        reasoning: "Claude analysis timed out. Results below are from external detectors only.",
      };
    }

    // Add external detection results
    parsed.external_detectors = externalResults;

    // Compute consensus score if we have both
    const availableExternal = externalResults.filter((r) => r.available);
    if (availableExternal.length > 0 && parsed.overall_ai_probability !== undefined) {
      const externalAvg =
        availableExternal.reduce((sum, r) => sum + r.ai_probability, 0) /
        availableExternal.length;
      const claudeScore = parsed.overall_ai_probability;

      // Weighted average: Claude 60%, external tools 40%
      parsed.consensus_score = Math.round((claudeScore * 0.6 + externalAvg * 0.4) * 1000) / 1000;

      if (parsed.consensus_score >= 0.8) parsed.consensus_verdict = "definitely_ai";
      else if (parsed.consensus_score >= 0.55) parsed.consensus_verdict = "likely_ai";
      else if (parsed.consensus_score >= 0.3) parsed.consensus_verdict = "possibly_ai";
      else parsed.consensus_verdict = "likely_human";
    }

    const savedId = await autoSaveProject({
      type: "ai_detector",
      inputText: text,
      outputText: parsed,
      phiDetected: phiResult.hasPhi,
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
    console.error("AI detection error:", error);
    return NextResponse.json(
      { error: "Failed to analyze text" },
      { status: 500 }
    );
  }
}
