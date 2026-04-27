import { NextRequest, NextResponse } from "next/server";
import { generateReviewResponse } from "@/lib/ai/claude";
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
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;

    const { manuscript, reviewerComments } = await req.json();
    const v = validateInput(manuscript);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    if (!reviewerComments || typeof reviewerComments !== "string" || !reviewerComments.trim()) {
      return NextResponse.json(
        { error: "Reviewer comments are required" },
        { status: 400 }
      );
    }

    const manuscriptPhi = scanAndCensorPhi(manuscript);
    const commentsPhi = scanAndCensorPhi(reviewerComments);

    const analysis = await generateReviewResponse(
      manuscriptPhi.censoredText,
      commentsPhi.censoredText
    );

    let parsed;
    try {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: analysis };
    } catch {
      parsed = { raw: analysis };
    }

    const savedId = await autoSaveProject({
      type: "manuscript",
      inputText: manuscript,
      outputText: parsed,
      phiDetected: manuscriptPhi.hasPhi || commentsPhi.hasPhi,
      metadata: { tool: "review_response" },
    });

    return NextResponse.json({
      result: parsed,
      savedId,
      phi: {
        detected: manuscriptPhi.hasPhi || commentsPhi.hasPhi,
        warnings: [
          ...manuscriptPhi.warnings,
          ...commentsPhi.warnings,
        ],
        detectedTypes: [
          ...manuscriptPhi.detectedTypes,
          ...commentsPhi.detectedTypes,
        ],
      },
    });
  } catch (error) {
    console.error("Review response generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate review response" },
      { status: 500 }
    );
  }
}
