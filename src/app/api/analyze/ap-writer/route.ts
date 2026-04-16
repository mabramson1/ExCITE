import { NextRequest, NextResponse } from "next/server";
import { generateAssessmentPlan } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";
import { autoSaveProject } from "@/lib/auto-save";

export async function POST(req: NextRequest) {
  try {
    const { skeleton, encounterType = "established_office" } = await req.json();

    if (!skeleton || typeof skeleton !== "string") {
      return NextResponse.json({ error: "Skeleton is required" }, { status: 400 });
    }

    const phiResult = scanAndCensorPhi(skeleton);
    const analysis = await generateAssessmentPlan(phiResult.censoredText, encounterType);

    let parsed;
    try {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: analysis };
    } catch {
      parsed = { raw: analysis };
    }

    const savedId = await autoSaveProject({
      type: "clinical_note",
      inputText: skeleton,
      outputText: parsed,
      phiDetected: phiResult.hasPhi,
      metadata: { tool: "ap_writer", encounterType },
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
    console.error("A/P Writer error:", error);
    return NextResponse.json(
      { error: "Failed to generate A/P" },
      { status: 500 }
    );
  }
}
