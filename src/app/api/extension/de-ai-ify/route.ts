import { NextRequest, NextResponse } from "next/server";
import { deAiifyText } from "@/lib/ai/claude";
import { scanAndCensorPhi, deepReinject } from "@/lib/phi-detection";
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

    const credit = await checkCreditLimit(userId, "de_ai_ify");
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
    const writingStyle = (body?.writingStyle || "general").toString();

    const v = validateInput(text);
    if (!v.ok) {
      return withExtensionCors(
        NextResponse.json({ error: v.error }, { status: 400 }),
        req
      );
    }

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
    return withExtensionCors(NextResponse.json({ result: restored }), req);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[ExtensionHumanize] error:", message, err);
    return withExtensionCors(
      NextResponse.json(
        { error: "Failed to humanize", detail: message },
        { status: 500 }
      ),
      req
    );
  }
}
