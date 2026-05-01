"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gauge, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UsageData {
  plan: string;
  limit: number;
  used: number;
  remaining: number;
  pctUsed: number;
  breakdown: {
    tool: string;
    label: string;
    calls: number;
    credits: number;
    costUsd: string;
  }[];
}

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  unlimited: "Unlimited",
};

export function UsageMeter() {
  const [data, setData] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch("/api/usage/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  const { plan, limit, used, remaining, pctUsed, breakdown } = data;
  const isWarn = pctUsed >= 80;
  const isFull = pctUsed >= 100;
  const barColor = isFull
    ? "bg-red-500"
    : isWarn
    ? "bg-amber-500"
    : "bg-primary";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            Monthly Credits
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {PLAN_LABEL[plan] ?? plan} plan
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold tabular-nums">
              {used} <span className="text-base font-normal text-muted-foreground">/ {limit}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {remaining} remaining
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full ${barColor} transition-all duration-500`}
              style={{ width: `${Math.min(100, pctUsed)}%` }}
            />
          </div>
          {isFull && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              You&apos;ve used your full monthly allotment.{" "}
              {plan !== "unlimited" && "Upgrade for more credits."}
            </p>
          )}
          {isWarn && !isFull && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              You&apos;re close to your monthly limit.
            </p>
          )}
        </div>

        {breakdown.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Used this month
            </p>
            {breakdown
              .sort((a, b) => b.credits - a.credits)
              .map((b) => (
                <div key={b.tool} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="tabular-nums">
                    {b.calls} call{b.calls === 1 ? "" : "s"} · {b.credits} credit{b.credits === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
          </div>
        )}

        {plan === "free" && (
          <Link href="/pricing">
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              Upgrade for more <ArrowUpRight className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
