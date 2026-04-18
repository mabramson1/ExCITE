import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscription } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (!userId || !plan) {
          console.error("Missing metadata in checkout session");
          break;
        }

        const stripeSubscriptionId = session.subscription as string;
        const stripeCustomerId = session.customer as string;

        // Retrieve the subscription to get the current period end
        const stripeSub = await stripe.subscriptions.retrieve(
          stripeSubscriptionId
        );

        const periodEnd =
          (stripeSub as unknown as Record<string, number>).current_period_end ??
          (stripeSub.items.data[0] as unknown as Record<string, number>)?.current_period_end;
        const currentPeriodEndDate = periodEnd
          ? new Date(periodEnd * 1000)
          : null;

        // Upsert subscription record
        const existing = await db
          .select({ id: subscription.id })
          .from(subscription)
          .where(eq(subscription.userId, userId))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(subscription)
            .set({
              stripeCustomerId,
              stripeSubscriptionId,
              plan,
              status: "active",
              currentPeriodEnd: currentPeriodEndDate,
              updatedAt: new Date(),
            })
            .where(eq(subscription.userId, userId));
        } else {
          await db.insert(subscription).values({
            userId,
            stripeCustomerId,
            stripeSubscriptionId,
            plan,
            status: "active",
            currentPeriodEnd: currentPeriodEndDate,
          });
        }

        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const stripeSubId = sub.id;

        // Determine plan from the price ID
        const priceId = sub.items.data[0]?.price?.id;
        let plan = "free";
        if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
          plan = "pro";
        } else if (priceId === process.env.STRIPE_UNLIMITED_PRICE_ID) {
          plan = "unlimited";
        }

        // Map Stripe status to our status
        let status: string = "active";
        if (sub.status === "canceled" || sub.status === "unpaid") {
          status = "canceled";
        } else if (sub.status === "past_due") {
          status = "past_due";
        }

        const itemPeriodEnd =
          (sub as unknown as Record<string, number>).current_period_end ??
          (sub.items.data[0] as unknown as Record<string, number>)?.current_period_end;
        const periodEndDate = itemPeriodEnd
          ? new Date(itemPeriodEnd * 1000)
          : null;

        await db
          .update(subscription)
          .set({
            plan,
            status,
            currentPeriodEnd: periodEndDate,
            updatedAt: new Date(),
          })
          .where(eq(subscription.stripeSubscriptionId, stripeSubId));

        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const stripeSubId = sub.id;

        await db
          .update(subscription)
          .set({
            plan: "free",
            status: "canceled",
            updatedAt: new Date(),
          })
          .where(eq(subscription.stripeSubscriptionId, stripeSubId));

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
