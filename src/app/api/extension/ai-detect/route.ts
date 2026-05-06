import { NextRequest, NextResponse } from "next/server";
import { detectAiText } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";
import { runExternalDetectors } from "@/lib/ai-detection";
import { checkCreditLimit, recordUsage } from "@/lib/usage";
import { checkRateLimit, validateInput } from "@/lib/rate-limit";
import {
  authenticateExtensionRequest,
  extensionCorsHeaders,
  withExtensionCors,
} from "@/lib/extension-auth";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: extensionCorsHeaders(req),
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateExtensionRequest(req);
    if (!auth) {
      return withExtensionCors(
        NextResponse.json(
          { error: "Sign in to docsquared.app or set an API key" },
          { status: 401 }
        ),
        req
      );
    }
    const { userId } = auth;

    const rl = checkRateLimit(userId);
    if (!rl.ok) {
      return withExtensionCors(
        NextResponse.json({ error: "Too many requests" }, { status: 429 }),
        req
      );
    }

    const credit = await checkCreditLimit(userId, "ai_detector");
    if (!credit.allowed) {
      return withExtensionCors(
        NextResponse.json(
          { error: "Out of credits this month", credit },
          { status: 402 }
        ),
        req
      );
    }

    const body = await req.json();
    const text = body?.text;
    const v = validateInput(text);
    if (!v.ok) {
      return withExtensionCors(
        NextResponse.json({ error: v.error }, { status: 400 }),
        req
      );
    }

    const phi = scanAndCensorPhi(text);

    const [claudeRes, externalResults] = await Promise.all([
      detectAiText(phi.censoredText),
      runExternalDetectors(phi.censoredText),
    ]);

    recordUsage(userId, "ai_detector", claudeRes.usage);

    let parsed;
    try {
      const m = claudeRes.text.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { raw: claudeRes.text };
    } catch {
      parsed = { raw: claudeRes.text };
    }

    parsed.external_detectors = externalResults;
    const availableExternal = externalResults.filter((r) => r.available);
    if (
      availableExternal.length > 0 &&
      parsed.overall_ai_probability !== undefined
    ) {
      const externalAvg =
        availableExternal.reduce((s, r) => s + r.ai_probability, 0) /
        availableExternal.length;
      parsed.consensus_score =
        Math.round(
          (parsed.overall_ai_probability * 0.6 + externalAvg * 0.4) * 1000
        ) / 1000;
    }

    return withExtensionCors(NextResponse.json({ result: parsed }), req);
  } catch (err) {
    console.error("Extension ai-detect error:", err);
    return withExtensionCors(
      NextResponse.json({ error: "Failed to detect" }, { status: 500 }),
      req
    );
  }
}
