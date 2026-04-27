import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { userPreference } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { eq } from "drizzle-orm";

const MAX_VOICE_SAMPLE_LEN = 10_000;
const MAX_TEMPLATE_LEN = 10_000;
const MAX_TEMPLATES = 50;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [pref] = await db
    .select()
    .from(userPreference)
    .where(eq(userPreference.userId, session.user.id))
    .limit(1);
  return NextResponse.json({ preferences: pref || null });
}

export async function PUT(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  // Size limits to prevent abuse
  if (typeof body.voiceSampleClinical === "string" && body.voiceSampleClinical.length > MAX_VOICE_SAMPLE_LEN) {
    return NextResponse.json({ error: "Voice sample too long" }, { status: 400 });
  }
  if (typeof body.voiceSampleGeneral === "string" && body.voiceSampleGeneral.length > MAX_VOICE_SAMPLE_LEN) {
    return NextResponse.json({ error: "Voice sample too long" }, { status: 400 });
  }
  if (Array.isArray(body.customTemplates)) {
    if (body.customTemplates.length > MAX_TEMPLATES) {
      return NextResponse.json({ error: "Too many custom templates" }, { status: 400 });
    }
    for (const t of body.customTemplates) {
      if (typeof t?.template === "string" && t.template.length > MAX_TEMPLATE_LEN) {
        return NextResponse.json({ error: "Template too long" }, { status: 400 });
      }
    }
  }
  // Only accept known fields
  const allowed: Partial<typeof userPreference.$inferInsert> = {
    userId: session.user.id,
    updatedAt: new Date(),
  };
  if (typeof body.voiceSampleClinical === "string") allowed.voiceSampleClinical = body.voiceSampleClinical;
  if (typeof body.voiceSampleGeneral === "string") allowed.voiceSampleGeneral = body.voiceSampleGeneral;
  if (typeof body.defaultBrevity === "string") allowed.defaultBrevity = body.defaultBrevity;
  if (typeof body.defaultWritingStyle === "string") allowed.defaultWritingStyle = body.defaultWritingStyle;
  if (typeof body.defaultCitationStyle === "string") allowed.defaultCitationStyle = body.defaultCitationStyle;
  if (Array.isArray(body.customTemplates)) allowed.customTemplates = body.customTemplates;

  const [existing] = await db
    .select({ userId: userPreference.userId })
    .from(userPreference)
    .where(eq(userPreference.userId, session.user.id))
    .limit(1);

  if (existing) {
    await db
      .update(userPreference)
      .set(allowed)
      .where(eq(userPreference.userId, session.user.id));
  } else {
    await db.insert(userPreference).values({
      userId: session.user.id,
      ...allowed,
    });
  }
  return NextResponse.json({ ok: true });
}
