import { NextRequest, NextResponse } from "next/server";
import { generateManuscriptCitations } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";

export async function POST(req: NextRequest) {
  try {
    const { text, style = "apa" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const phiResult = scanAndCensorPhi(text);
    const analysis = await generateManuscriptCitations(phiResult.censoredText, style);

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
    console.error("Manuscript analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze manuscript" },
      { status: 500 }
    );
  }
}
