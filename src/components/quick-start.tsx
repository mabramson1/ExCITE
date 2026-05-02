"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  BookOpen,
  Wand2,
  ScanSearch,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SAMPLES = [
  {
    id: "ap-writer",
    icon: FileText,
    title: "Write an A/P from a skeleton note",
    description: "Paste a quick outline → get a full Assessment & Plan with E/M coding",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
    badge: "Most popular",
    href: "/tools/clinical-notes",
    sample: `62M established f/u
HTN, DM2, CKD3a
BP 158/94, HR 72
A1c 8.2%, Cr 1.4
Meds: lisinopril 20, metformin 1000 BID
Compliant with meds, no side effects
Discussed diet and exercise`,
    queryKey: "sample",
  },
  {
    id: "ai-detector",
    icon: ScanSearch,
    title: "Check if text is AI-generated",
    description: "Paste any passage → get a multi-source AI probability score",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
    badge: "Quick test",
    href: "/tools/ai-detector",
    sample: `In today's rapidly evolving digital landscape, the intersection of technology and human creativity represents a multifaceted tapestry of innovation. It is important to note that the synergies between these domains are not merely theoretical constructs, but rather practical frameworks that drive meaningful outcomes across various sectors of society.`,
    queryKey: "sample",
  },
  {
    id: "de-ai-ify",
    icon: Wand2,
    title: "Humanize AI-written text",
    description: "Paste AI-generated text → get a naturally human-sounding rewrite",
    color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40",
    badge: "Try it",
    href: "/tools/de-ai-ify",
    sample: `Furthermore, the implementation of these innovative strategies necessitates a comprehensive understanding of the underlying mechanisms. It is worth noting that the potential implications are far-reaching, encompassing both immediate and long-term considerations that merit careful examination.`,
    queryKey: "sample",
  },
  {
    id: "citations",
    icon: BookOpen,
    title: "Find verified citations",
    description: "Paste a manuscript paragraph → get real PubMed citations",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
    badge: "Academic",
    href: "/tools/manuscript-citations",
    sample: `SGLT2 inhibitors have demonstrated significant cardiovascular and renal benefits in patients with type 2 diabetes. The landmark EMPA-REG OUTCOME trial showed reduced cardiovascular mortality, and subsequent meta-analyses have confirmed CKD progression slowing across multiple agents in this drug class.`,
    queryKey: "sample",
  },
];

interface QuickStartProps {
  userName?: string;
}

export function QuickStart({ userName }: QuickStartProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const firstName = userName?.split(" ")[0] || "there";

  function handleTry(sample: (typeof SAMPLES)[number]) {
    sessionStorage.setItem(`docsq-sample-${sample.id}`, sample.sample);
    router.push(`${sample.href}?trySample=${sample.id}`);
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              Welcome, {firstName}! Try your first tool.
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Each card has a pre-filled sample — click &ldquo;Try it&rdquo; to see
          the tool in action with real output. No setup needed.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-3">
          {SAMPLES.map((sample) => {
            const Icon = sample.icon;
            return (
              <button
                key={sample.id}
                onClick={() => handleTry(sample)}
                className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors group"
              >
                <div
                  className={`shrink-0 rounded-md p-2 ${sample.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium leading-tight">
                      {sample.title}
                    </span>
                    <ArrowRight className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {sample.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
