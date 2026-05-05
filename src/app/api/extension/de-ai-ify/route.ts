import { NextRequest, NextResponse } from "next/server";
import { findUserByApiKey } from "@/lib/api-key";
import { deAiifyText } from "@/lib/ai/claude";
import { scanAndCensorPhi, deepReinject } from "@/lib/phi-detection";
import { checkCreditLimit, recordUsage } from "@/lib/usage";
import { checkRateLimit, validateInput } from "@/lib/rate-limit";

/**
 * Browser extension endpoint for the De-AI-ifier.
 * Auth: Bearer token in Authorization header.
 * CORS: open (extensions can be on any origin).
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    const token = auth?.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return cors(NextResponse.json({ error: "Missing API key" }, { status: 401 }));
    }

    const userId = await findUserByApiKey(token);
    if (!userId) {
      return cors(NextResponse.json({ error: "Invalid API key" }, { status: 401 }));
    }

    const rl = checkRateLimit(userId);
    if (!rl.ok) {
      return cors(NextResponse.json({ error: "Too many requests" }, { status: 429 }));
    }

    const credit = await checkCreditLimit(userId, "de_ai_ify");
    if (!credit.allowed) {
      return cors(
        NextResponse.json({ error: "Out of credits this month", credit }, { status: 402 })
      );
    }

    const body = await req.json();
    const text = body?.text;
    const writingStyle = (body?.writingStyle || "general").toString();

    const v = validateInput(text);
    if (!v.ok) {
      return cors(NextResponse.json({ error: v.error }, { status: 400 }));
    }

    // Server-side PHI scan as defense-in-depth
    const phi = scanAndCensorPhi(text);
    const { text: raw, usage } = await deAiifyText(phi.censoredText, writingStyle);
    recordUsage(userId, "de_ai_ify", usage);

    let parsed;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { rewritten_text: raw };
    } catch {
      parsed = { rewritten_text: raw };
    }

    const restored = phi.hasPhi ? deepReinject(parsed, phi.tokenMap) : parsed;
    return cors(NextResponse.json({ result: restored }));
  } catch (err) {
    console.error("Extension de-ai-ify error:", err);
    return cors(NextResponse.json({ error: "Failed to process" }, { status: 500 }));
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function cors(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(corsHeaders())) {
    res.headers.set(k, v);
  }
  return res;
}
