import Stripe from "stripe";
import { db } from "@/lib/db";
import { subscription } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_placeholder", {
  typescript: true,
});

export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || "";
export const STRIPE_UNLIMITED_PRICE_ID = process.env.STRIPE_UNLIMITED_PRICE_ID || "";

/**
 * Get or create a Stripe customer for a user.
 * Checks the subscription table for an existing stripeCustomerId,
 * creates one via Stripe if needed, and stores it.
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string
): Promise<string> {
  // Check for existing subscription record with a Stripe customer ID
  const existing = await db
    .select({ stripeCustomerId: subscription.stripeCustomerId })
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  if (existing.length > 0 && existing[0].stripeCustomerId) {
    return existing[0].stripeCustomerId;
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  // Upsert the subscription record with the new customer ID
  if (existing.length > 0) {
    await db
      .update(subscription)
      .set({
        stripeCustomerId: customer.id,
        updatedAt: new Date(),
      })
      .where(eq(subscription.userId, userId));
  } else {
    await db.insert(subscription).values({
      userId,
      stripeCustomerId: customer.id,
      plan: "free",
      status: "active",
    });
  }

  return customer.id;
}

/**
 * Get the current plan for a user.
 * Returns "free" if no subscription record exists.
 */
export async function getUserPlan(userId: string): Promise<string> {
  const result = await db
    .select({ plan: subscription.plan, status: subscription.status })
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  if (result.length === 0) {
    return "free";
  }

  // If subscription is canceled or past_due, treat as free
  if (result[0].status === "canceled") {
    return "free";
  }

  return result[0].plan;
}
