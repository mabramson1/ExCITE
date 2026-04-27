import { NextRequest, NextResponse } from "next/server";
import { generateManuscript } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";
import { autoSaveProject } from "@/lib/auto-save";
import { checkRateLimit, validateInput } from "@/lib/rate-limit";
import { requireUser } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const rl = checkRateLimit(ip);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429 }
      );
    }

    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;

    const { input, format, citationsEnabled, citationStyle, brevity, voiceSample } = await req.json();
    const v = validateInput(input);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const phiResult = scanAndCensorPhi(input);
    const analysis = await generateManuscript(phiResult.censoredText, {
      format,
      citationsEnabled,
      citationStyle,
      brevity,
      voiceSample,
    });

    let parsed;
    try {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: analysis };
    } catch {
      parsed = { raw: analysis };
    }

    const savedId = await autoSaveProject({
      type: "manuscript",
      inputText: input,
      outputText: parsed,
      citationStyle: citationsEnabled ? citationStyle : null,
      phiDetected: phiResult.hasPhi,
      metadata: { tool: "manuscript_writer", format, brevity },
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
    console.error("Manuscript writer error:", error);
    return NextResponse.json(
      { error: "Failed to generate manuscript" },
      { status: 500 }
    );
  }
}
