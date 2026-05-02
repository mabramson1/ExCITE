import { NextRequest, NextResponse } from "next/server";
import { generateAssessmentPlan, streamClaudeMessage, AP_WRITER_SYSTEM } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";
import { autoSaveProject } from "@/lib/auto-save";
import { checkRateLimit, validateInput } from "@/lib/rate-limit";
import { requireUser } from "@/lib/api-auth";
import { checkCreditLimit, recordUsage } from "@/lib/usage";

/** Build the A/P Writer user message (mirrors the logic in generateAssessmentPlan). */
function buildApUserMessage(
  skeleton: string,
  encounterType: string,
  options?: { voiceSample?: string; brevity?: string; customTemplate?: string }
): string {
  let userMessage = "";

  if (options?.voiceSample) {
    userMessage += `VOICE CALIBRATION: The physician provided a sample of their own clinical writing. Match their documentation style — sentence structure, abbreviation patterns, level of detail, and phrasing habits — so the A/P sounds like THEM.

Writing sample:
"""
${options.voiceSample}
"""

`;
  }

  if (options?.brevity === "brief") {
    userMessage += `BREVITY MODE: Write a CONCISE A/P. Use short sentences, standard abbreviations (HTN, DM2, CKD, etc.), minimal prose. Each problem: 2-3 sentences max. Skip filler phrases. This is for a physician who wants documentation-ready bullet-style notes, not narrative paragraphs.\n\n`;
  } else if (options?.brevity === "detailed") {
    userMessage += `DETAILED MODE: Write a THOROUGH narrative A/P with full clinical reasoning. Explain decision-making, reference relevant guidelines, discuss differential diagnoses where applicable, and provide comprehensive follow-up plans.\n\n`;
  }

  if (options?.customTemplate) {
    userMessage += `CUSTOM TEMPLATE: The physician provided their own note template with {{placeholders}}. You MUST use this exact template structure and fill in every placeholder with appropriate clinical content from the skeleton. Keep ALL text outside placeholders exactly as-is. If a placeholder has no corresponding data in the skeleton, write "[not provided]" rather than fabricating data.

Template:
"""
${options.customTemplate}
"""

Fill in this template using the skeleton below. The "assessment_and_plan" field in your response should be the completed template with all placeholders filled in.

`;
  }

  userMessage += `Generate a robust Assessment & Plan from this skeleton. Encounter type: ${encounterType}.

Skeleton:
"""
${skeleton}
"""

Respond with this exact JSON structure:
{
  "assessment_and_plan": "The full A/P text, formatted with numbered problems. Each problem should include: diagnosis with specificity, clinical status, clinical reasoning, data interpretation, management plan, and follow-up. At the very end, include the E&M attestation statement (the em_statement below) as the final paragraph.",
  "em_statement": "A ready-to-copy E&M attestation statement for the note. Format: 'Medical decision making for this [encounter type] visit is [complexity level] based on [# problems] problem(s) addressed including [list key problems with severity], [data element summary], and [risk summary including specific management decisions]. This encounter supports CPT [code].' Make it specific to the actual clinical content — not generic.",
  "problems": [
    {
      "number": 1,
      "diagnosis": "specific diagnosis with ICD-10-ready language",
      "icd10_suggestion": "likely ICD-10 code",
      "status": "stable|improving|worsening|exacerbation|new|chronic",
      "severity": "mild|moderate|severe|critical",
      "assessment": "clinical reasoning and interpretation",
      "plan": "specific management steps",
      "data_referenced": "labs, imaging, tests referenced",
      "risk_factors": "drug interactions, surgical risk, comorbidity impact"
    }
  ],
  "supported_em_level": {
    "code": "E/M CPT code (e.g., 99215 for established patient with HIGH MDM)",
    "mdm_complexity": "straightforward|low|moderate|high",
    "rationale": "Explain the 2-of-3 rule: which 2 elements are at the determining level and why",
    "problems_level": "minimal|low|moderate|high",
    "problems_justification": "Cite specific conditions from the A/P that justify this level.",
    "data_level": "minimal|limited|moderate|extensive",
    "data_justification": "Cite specific data reviewed/ordered.",
    "risk_level": "minimal|low|moderate|high",
    "risk_justification": "Cite specific risk factors."
  },
  "documentation_tips": [
    "specific tips to further strengthen the documentation"
  ],
  "clarification_needed": [
    "anything in the skeleton that was too vague and should be clarified for accurate documentation"
  ],
  "disclaimer": "This A/P is generated for documentation assistance only. The treating physician must review, modify, and sign the note. Clinical accuracy is the physician's responsibility."
}`;

  return userMessage;
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const isStream = url.searchParams.get("stream") === "true";

    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const rl = checkRateLimit(userId);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const credit = await checkCreditLimit(userId, "ap_writer");
    if (!credit.allowed) {
      return NextResponse.json(
        { error: "Out of credits this month", credit },
        { status: 402 }
      );
    }

    const { skeleton, encounterType = "established_office", voiceSample, brevity, customTemplate } = await req.json();
    const v = validateInput(skeleton);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const phiResult = scanAndCensorPhi(skeleton);

    // ── Streaming path ────────────────────────────────────────────
    if (isStream) {
      const userMessage = buildApUserMessage(phiResult.censoredText, encounterType, {
        voiceSample: voiceSample || undefined,
        brevity: brevity || undefined,
        customTemplate: customTemplate || undefined,
      });
      const rawStream = await streamClaudeMessage({ system: AP_WRITER_SYSTEM, userMessage });

      const transformStream = new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          controller.enqueue(chunk);
          const decoded = new TextDecoder().decode(chunk);
          if (decoded.includes('"type":"done"')) {
            try {
              const match = decoded.match(/data: (.+)/);
              if (match) {
                const data = JSON.parse(match[1]);
                if (data.usage) {
                  recordUsage(userId, "ap_writer", data.usage);
                }
              }
            } catch {
              // best-effort usage recording
            }
          }
        },
      });

      return new Response(rawStream.pipeThrough(transformStream), {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // ── Non-streaming path (unchanged) ────────────────────────────
    const { text: analysis, usage } = await generateAssessmentPlan(phiResult.censoredText, encounterType, {
      voiceSample: voiceSample || undefined,
      brevity: brevity || undefined,
      customTemplate: customTemplate || undefined,
    });
    recordUsage(userId, "ap_writer", usage);

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
