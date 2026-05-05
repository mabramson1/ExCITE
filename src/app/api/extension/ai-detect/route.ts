import { NextRequest, NextResponse } from "next/server";
import { findUserByApiKey } from "@/lib/api-key";
import { detectAiText } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";
import { runExternalDetectors } from "@/lib/ai-detection";
import { checkCreditLimit, recordUsage } from "@/lib/usage";
import { checkRateLimit, validateInput } from "@/lib/rate-limit";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    const token = auth?.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401, headers: cors });
    }

    const userId = await findUserByApiKey(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401, headers: cors });
    }

    const rl = checkRateLimit(userId);
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: cors });
    }

    const credit = await checkCreditLimit(userId, "ai_detector");
    if (!credit.allowed) {
      return NextResponse.json(
        { error: "Out of credits this month", credit },
        { status: 402, headers: cors }
      );
    }

    const body = await req.json();
    const text = body?.text;
    const v = validateInput(text);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400, headers: cors });
    }

    const phi = scanAndCensorPhi(text);

    const claudePromise = detectAiText(phi.censoredText);
    const externalPromise = runExternalDetectors(phi.censoredText);

    const [claudeRes, externalResults] = await Promise.all([
      claudePromise,
      externalPromise,
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
    if (availableExternal.length > 0 && parsed.overall_ai_probability !== undefined) {
      const externalAvg =
        availableExternal.reduce((s, r) => s + r.ai_probability, 0) /
        availableExternal.length;
      parsed.consensus_score =
        Math.round((parsed.overall_ai_probability * 0.6 + externalAvg * 0.4) * 1000) / 1000;
    }

    return NextResponse.json({ result: parsed }, { headers: cors });
  } catch (err) {
    console.error("Extension ai-detect error:", err);
    return NextResponse.json({ error: "Failed to detect" }, { status: 500, headers: cors });
  }
}
