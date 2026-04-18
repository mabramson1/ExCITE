"use client";

import { Check, Crown, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic citation tools",
    features: [
      "10 analyses per month",
      "All 4 AI tools",
      "Basic export options",
      "Community support",
    ],
    cta: "Current Plan",
    plan: "free" as const,
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For active researchers and clinicians",
    features: [
      "100 analyses per month",
      "All 4 AI tools",
      "Priority support",
      "Advanced export options",
      "Analysis history",
    ],
    cta: "Upgrade to Pro",
    plan: "pro" as const,
    highlighted: true,
  },
  {
    name: "Unlimited",
    price: "$39",
    period: "/month",
    description: "For teams and power users",
    features: [
      "Unlimited analyses",
      "All 4 AI tools",
      "Priority support",
      "Advanced export options",
      "Analysis history",
      "Early access to new features",
    ],
    cta: "Upgrade to Unlimited",
    plan: "unlimited" as const,
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  async function handleUpgrade(plan: "pro" | "unlimited") {
    setLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(null);
    }
  }

  async function handleManageSubscription() {
    setLoading("manage");
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Choose the plan that fits your workflow. Start free, upgrade anytime.
          No hidden fees — just pay-as-you-go processing.
        </p>
      </div>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
          Your subscription is now active. Thank you for upgrading!
        </div>
      )}

      {canceled && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300">
          Checkout was canceled. You can try again whenever you are ready.
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.highlighted
                ? "border-primary shadow-lg relative"
                : "relative"
            }
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="gap-1">
                  <Crown className="h-3 w-3" />
                  Recommended
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="pt-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">
                  {plan.period}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              {plan.plan === "free" ? (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  {plan.cta}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => handleUpgrade(plan.plan)}
                  disabled={loading !== null}
                >
                  {loading === plan.plan ? (
                    <>
                      <Zap className="h-4 w-4 animate-pulse" />
                      Redirecting...
                    </>
                  ) : (
                    plan.cta
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button
          variant="link"
          onClick={handleManageSubscription}
          disabled={loading === "manage"}
        >
          {loading === "manage"
            ? "Opening portal..."
            : "Manage existing subscription"}
        </Button>
      </div>

      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>All prices in USD. Billed monthly. Cancel anytime.</p>
        <p>
          Payments processed securely by Stripe (2.9% + 30c per transaction).
        </p>
      </div>
    </div>
  );
}
