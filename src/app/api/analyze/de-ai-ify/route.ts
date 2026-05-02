import { NextRequest, NextResponse } from "next/server";
import { deAiifyText, streamClaudeMessage, getDeAiSystem } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";
import { runExternalDetectors } from "@/lib/ai-detection";
import { autoSaveProject } from "@/lib/auto-save";
import { checkRateLimit, validateInput } from "@/lib/rate-limit";
import { requireUser } from "@/lib/api-auth";
import { checkCreditLimit, recordUsage } from "@/lib/usage";

/** Build the De-AI-ifier user message (mirrors the logic in deAiifyText). */
function buildDeAiUserMessage(censoredText: string, writingStyle: string, voiceSample?: string): string {
  const styleName = writingStyle.replace(/-/g, " ");
  let userMessage = "";

  if (voiceSample) {
    userMessage += `VOICE CALIBRATION: The user provided a sample of their own writing. Analyze their sentence rhythm, word choices, punctuation habits, and quirks. Apply these patterns to the rewrite so the output sounds like THEM, not like generic human writing.

Voice sample:
"""
${voiceSample}
"""

`;
  }

  userMessage += `Rewrite this text for the "${styleName}" style using a 2-PASS process. Preserve all meaning and factual content exactly.

PASS 1: Rewrite the text, eliminating all 29 identified AI patterns.
PASS 2: Audit your Pass 1 rewrite for any lingering AI-isms — subtle structural habits, residual hedging, synonym cycling, metronomic rhythm, etc. Fix every issue you find.

Return the final (Pass 2) text as "rewritten_text" and list any issues you caught during the audit in "first_pass_issues".

Text:
"""
${censoredText}
"""

Respond with this exact JSON structure:
{
  "rewritten_text": "final text after both passes",
  "first_pass_issues": ["issues found in initial rewrite during audit"],
  "changes_made": [
    {"original": "AI-sounding phrase", "replacement": "human-sounding replacement", "reason": "specific pattern fixed"}
  ],
  "ai_patterns_found": ["specific pattern 1", "specific pattern 2"],
  "confidence_score": 0.85,
  "style_applied": "${styleName}"
}

confidence_score: 1.0 = definitely human, 0.0 = still obviously AI. Be honest.`;

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

    const credit = await checkCreditLimit(userId, "de_ai_ify");
    if (!credit.allowed) {
      return NextResponse.json(
        { error: "Out of credits this month", credit },
        { status: 402 }
      );
    }

    const { text, writingStyle = "general", verifyAfter = true, voiceSample } = await req.json();
    const v = validateInput(text);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const phiResult = scanAndCensorPhi(text);

    // ── Streaming path ────────────────────────────────────────────
    if (isStream) {
      const system = getDeAiSystem(writingStyle);
      const userMessage = buildDeAiUserMessage(phiResult.censoredText, writingStyle, voiceSample);
      const rawStream = await streamClaudeMessage({ system, userMessage, maxTokens: 4096 });

      const transformStream = new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          controller.enqueue(chunk);
          // Intercept "done" event to record usage server-side
          const decoded = new TextDecoder().decode(chunk);
          if (decoded.includes('"type":"done"')) {
            try {
              const match = decoded.match(/data: (.+)/);
              if (match) {
                const data = JSON.parse(match[1]);
                if (data.usage) {
                  recordUsage(userId, "de_ai_ify", data.usage);
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
    const { text: analysis, usage } = await deAiifyText(phiResult.censoredText, writingStyle, voiceSample);
    recordUsage(userId, "de_ai_ify", usage);

    let parsed;
    try {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: analysis };
    } catch {
      parsed = { raw: analysis };
    }

    // Closed-loop verification: run original and rewritten text through AI detector
    if (verifyAfter && parsed.rewritten_text) {
      try {
        const [originalScores, rewrittenScores] = await Promise.all([
          runExternalDetectors(phiResult.censoredText),
          runExternalDetectors(parsed.rewritten_text),
        ]);

        const originalAvailable = originalScores.filter((r) => r.available);
        const rewrittenAvailable = rewrittenScores.filter((r) => r.available);

        if (originalAvailable.length > 0 && rewrittenAvailable.length > 0) {
          const originalAiScore =
            originalAvailable.reduce((sum, r) => sum + r.ai_probability, 0) /
            originalAvailable.length;
          const rewrittenAiScore =
            rewrittenAvailable.reduce((sum, r) => sum + r.ai_probability, 0) /
            rewrittenAvailable.length;

          parsed.verification = {
            original_ai_score: Math.round(originalAiScore * 1000) / 1000,
            rewritten_ai_score: Math.round(rewrittenAiScore * 1000) / 1000,
            improvement: Math.round((originalAiScore - rewrittenAiScore) * 1000) / 1000,
            original_verdict: getVerdict(originalAiScore),
            rewritten_verdict: getVerdict(rewrittenAiScore),
            detector_source: originalAvailable[0]?.model || "unknown",
          };
        }
      } catch {
        // Verification failed, continue without it
      }
    }

    const savedId = await autoSaveProject({
      type: "deai",
      inputText: text,
      outputText: parsed,
      phiDetected: phiResult.hasPhi,
      metadata: { writingStyle },
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
    console.error("De-AI-ify error:", error);
    return NextResponse.json(
      { error: "Failed to process text" },
      { status: 500 }
    );
  }
}

function getVerdict(score: number): string {
  if (score >= 0.8) return "definitely_ai";
  if (score >= 0.55) return "likely_ai";
  if (score >= 0.3) return "possibly_ai";
  return "likely_human";
}
