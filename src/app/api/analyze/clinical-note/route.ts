import { NextRequest, NextResponse } from "next/server";
import { analyzeClinicalNote } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Scan for PHI and censor
    const phiResult = scanAndCensorPhi(text);

    // Use censored text for AI analysis
    const analysis = await analyzeClinicalNote(phiResult.censoredText);

    let parsed;
    try {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: analysis };
    } catch {
      parsed = { raw: analysis };
    }

    return NextResponse.json({
      result: parsed,
      phi: {
        detected: phiResult.hasPhi,
        warnings: phiResult.warnings,
        detectedTypes: phiResult.detectedTypes,
      },
      censoredInput: phiResult.hasPhi ? phiResult.censoredText : undefined,
    });
  } catch (error) {
    console.error("Clinical note analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze clinical note" },
      { status: 500 }
    );
  }
}
