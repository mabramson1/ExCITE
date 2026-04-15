import { NextRequest, NextResponse } from "next/server";
import { deAiifyText } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";

export async function POST(req: NextRequest) {
  try {
    const { text, writingStyle = "general" } = await req.json();

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

    return NextResponse.json({
      result: parsed,
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
