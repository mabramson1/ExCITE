"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  BookOpen,
  Wand2,
  ScanSearch,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";

const highlights = [
  {
    icon: FileText,
    title: "Clinical Documentation",
    description: "A/P Writer, Prior Auth Letters, Discharge Summaries, Referral Letters, ICD-10/CPT Coding",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
  },
  {
    icon: BookOpen,
    title: "Academic Writing",
    description: "Manuscript Writer, Citation Finder with PubMed verification, Peer Review Response",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    icon: Wand2,
    title: "AI Writing Tools",
    description: "De-AI-ifier with 29-pattern rewrite, AI Detector with multi-source consensus",
    color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40",
  },
  {
    icon: Layers,
    title: "Batch Processing",
    description: "Process multiple notes at once — upload CSV or paste, get results for all",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(0);

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === step
                  ? "bg-primary"
                  : i < step
                  ? "bg-primary/40"
                  : "bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                Welcome to Docs&sup2;, {firstName}!
              </CardTitle>
              <CardDescription className="text-base">
                The AI-powered medical writing suite — built for clinicians
                and researchers.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="success" className="gap-1.5">
                  <Shield className="h-3 w-3" />
                  Built-in PHI auto-detection
                </Badge>
              </div>
              <p>
                Patient identifiers are automatically detected and redacted
                in your browser before any text is sent to AI. Clinical
                details the AI needs pass through untouched.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => setStep(1)} size="lg">
                See what&apos;s included
              </Button>
            </CardFooter>
          </>
        )}

        {step === 1 && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Your full toolkit</CardTitle>
              <CardDescription>
                All tools are available on every plan — no feature gates.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div className={`shrink-0 rounded-md p-2 ${item.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={() => setStep(2)}>Continue</Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-3">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">You&apos;re all set!</CardTitle>
              <CardDescription className="text-base">
                Your dashboard has pre-filled samples for each tool — try
                one to see how it works.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground space-y-2">
              <p>
                Free plan: <strong>10 credits/month</strong>. Most tools
                cost 1 credit per use.
              </p>
              <p>
                Your analysis history is saved automatically.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button
                onClick={() => router.push("/dashboard")}
                size="lg"
                className="gap-2"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
