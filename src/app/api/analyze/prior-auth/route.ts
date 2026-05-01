import { NextRequest, NextResponse } from "next/server";
import { generatePriorAuthLetter } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";
import { autoSaveProject } from "@/lib/auto-save";
import { checkRateLimit, validateInput } from "@/lib/rate-limit";
import { requireUser } from "@/lib/api-auth";
import { checkCreditLimit, recordUsage } from "@/lib/usage";

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

    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const credit = await checkCreditLimit(userId, "prior_auth");
    if (!credit.allowed) {
      return NextResponse.json(
        { error: "Out of credits this month", credit },
        { status: 402 }
      );
    }

    const { skeleton, procedure, diagnosis } = await req.json();
    const v = validateInput(skeleton);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    if (!procedure?.trim()) {
      return NextResponse.json({ error: "Procedure is required." }, { status: 400 });
    }
    if (!diagnosis?.trim()) {
      return NextResponse.json({ error: "Diagnosis is required." }, { status: 400 });
    }

    const phiResult = scanAndCensorPhi(skeleton);
    const { text: analysis, usage } = await generatePriorAuthLetter(phiResult.censoredText, procedure, diagnosis);
    recordUsage(userId, "prior_auth", usage);

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
      metadata: { tool: "prior_auth", procedure, diagnosis },
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
    console.error("Prior Auth Letter error:", error);
    return NextResponse.json(
      { error: "Failed to generate prior authorization letter" },
      { status: 500 }
    );
  }
}
