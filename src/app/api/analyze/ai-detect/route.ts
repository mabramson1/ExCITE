import { NextRequest, NextResponse } from "next/server";
import { detectAiText } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const phiResult = scanAndCensorPhi(text);
    const analysis = await detectAiText(phiResult.censoredText);

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
    });
  } catch (error) {
    console.error("AI detection error:", error);
    return NextResponse.json(
      { error: "Failed to analyze text" },
      { status: 500 }
    );
  }
}
