import { NextRequest, NextResponse } from "next/server";
import { detectAiText } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";
import { runExternalDetectors } from "@/lib/ai-detection";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const phiResult = scanAndCensorPhi(text);

    // Run Claude analysis and external detectors in parallel
    const [analysis, externalResults] = await Promise.all([
      detectAiText(phiResult.censoredText),
      runExternalDetectors(phiResult.censoredText),
    ]);

    let parsed;
    try {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: analysis };
    } catch {
      parsed = { raw: analysis };
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

    return NextResponse.json({
      result: parsed,
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
