import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  stripe,
  getOrCreateCustomer,
  STRIPE_PRO_PRICE_ID,
  STRIPE_UNLIMITED_PRICE_ID,
} from "@/lib/stripe";

const PRICE_IDS: Record<string, string> = {
  pro: STRIPE_PRO_PRICE_ID,
  unlimited: STRIPE_UNLIMITED_PRICE_ID,
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body as { plan: "pro" | "unlimited" };

    if (!plan || !PRICE_IDS[plan]) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'pro' or 'unlimited'." },
        { status: 400 }
      );
    }

    const customerId = await getOrCreateCustomer(
      session.user.id,
      session.user.email
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRICE_IDS[plan],
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/pricing?success=true`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
      metadata: {
        userId: session.user.id,
        plan,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
