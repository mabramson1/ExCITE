"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, BookOpen, Wand2, ScanSearch, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

const tools = [
  {
    id: "clinical-notes",
    icon: FileText,
    title: "Clinical Notes",
    description: "Cite notes with ICD-10 & CPT codes",
    color: "text-blue-600",
  },
  {
    id: "manuscript-citations",
    icon: BookOpen,
    title: "Manuscript Citations",
    description: "Format and verify academic citations",
    color: "text-emerald-600",
  },
  {
    id: "de-ai-ifier",
    icon: Wand2,
    title: "De-AI-ifier",
    description: "Humanize AI-generated text",
    color: "text-purple-600",
  },
  {
    id: "ai-detector",
    icon: ScanSearch,
    title: "AI Detector",
    description: "Detect AI-generated content",
    color: "text-orange-600",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [selectedTools, setSelectedTools] = useState<string[]>(
    tools.map((t) => t.id)
  );

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  function toggleTool(id: string) {
    setSelectedTools((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

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
                Welcome to exCITE, {firstName}!
              </CardTitle>
              <CardDescription className="text-base">
                Your AI-powered platform for clinical documentation, citation
                management, and content analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              <p>
                exCITE helps healthcare professionals and researchers work
                smarter with AI tools built for accuracy and compliance.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => setStep(1)} size="lg">
                Get Started
              </Button>
            </CardFooter>
          </>
        )}

        {step === 1 && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Choose your tools</CardTitle>
              <CardDescription>
                These are the tools available to you. You can access all of them
                anytime from your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const selected = selectedTools.includes(tool.id);
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => toggleTool(tool.id)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className={`rounded-md p-2 bg-muted ${tool.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{tool.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {tool.description}
                      </div>
                    </div>
                    {selected && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
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
              <CardTitle className="text-2xl">You&apos;re all set!</CardTitle>
              <CardDescription className="text-base">
                Your account is ready to go.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground space-y-2">
              <p>Your analysis history will be saved automatically.</p>
              <p>
                Access all tools from the dashboard sidebar at any time.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => router.push("/dashboard")} size="lg">
                Go to Dashboard
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
