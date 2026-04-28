import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const envStatus: Record<string, boolean> = {
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      SAPLING_API_KEY: !!process.env.SAPLING_API_KEY,
      PANGRAM_API_KEY: !!process.env.PANGRAM_API_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET,
      SITE_PASSWORD: !!process.env.SITE_PASSWORD,
    };

    return NextResponse.json({
      envStatus,
      nodeVersion: process.version,
    });
  } catch (error) {
    console.error("Admin system error:", error);
    return NextResponse.json(
      { error: "Failed to fetch system info" },
      { status: 500 }
    );
  }
}
