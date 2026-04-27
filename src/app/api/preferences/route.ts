import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { userPreference } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

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
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
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
