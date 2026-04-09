"use client";

import { useState } from "react";
import { Wand2, Loader2, Copy, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PhiWarning } from "@/components/phi-warning";

interface DeAiResult {
  rewritten_text?: string;
  changes_made?: {
    original: string;
    replacement: string;
    reason: string;
  }[];
  ai_patterns_found?: string[];
  confidence_score?: number;
  raw?: string;
}

export default function DeAiIfyPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeAiResult | null>(null);
  const [phiWarnings, setPhiWarnings] = useState<string[]>([]);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedRewrite, setCopiedRewrite] = useState(false);

  async function handleProcess() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setPhiWarnings([]);

    try {
      const res = await fetch("/api/analyze/de-ai-ify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      if (data.phi?.detected) setPhiWarnings(data.phi.warnings);
      setResult(data.result);
    } catch {
      setResult({ raw: "An error occurred. Please check your API key and try again." });
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  const confidencePercent = result?.confidence_score
    ? Math.round(result.confidence_score * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
          <Wand2 className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">De-AI-ifier</h1>
          <p className="text-sm text-muted-foreground">
            Transform AI-generated text into natural, human-sounding prose
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paste AI-Generated Text</CardTitle>
          <CardDescription>
            We&apos;ll identify AI patterns and rewrite the text to sound naturally human.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your AI-generated text here...&#10;&#10;The tool will identify telltale AI writing patterns and rewrite the text to sound naturally human while preserving meaning."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[200px]"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{input.length} characters</p>
            <Button onClick={handleProcess} disabled={loading || !input.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  De-AI-ify
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {phiWarnings.length > 0 && <PhiWarning warnings={phiWarnings} />}

      {result && !result.raw && (
        <div className="space-y-4">
          {/* Confidence Score */}
          {result.confidence_score !== undefined && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Human-Sounding Confidence</span>
                  <span className="text-sm font-bold text-primary">{confidencePercent}%</span>
                </div>
                <Progress value={confidencePercent} />
                <p className="text-xs text-muted-foreground mt-2">
                  {confidencePercent >= 80
                    ? "High confidence this reads as human-written"
                    : confidencePercent >= 60
                    ? "Moderate confidence - some AI patterns may remain"
                    : "Consider further manual editing for best results"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Side by Side Comparison */}
          {result.rewritten_text && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Original</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyText(input, setCopiedOriginal)}
                    >
                      {copiedOriginal ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{input}</p>
                </CardContent>
              </Card>

              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-primary">Humanized</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyText(result.rewritten_text!, setCopiedRewrite)}
                    >
                      {copiedRewrite ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{result.rewritten_text}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Patterns Found */}
          {result.ai_patterns_found && result.ai_patterns_found.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Patterns Detected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.ai_patterns_found.map((pattern, i) => (
                    <Badge key={i} variant="outline">{pattern}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Specific Changes */}
          {result.changes_made && result.changes_made.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Changes Made ({result.changes_made.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.changes_made.map((change, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <span className="line-through text-muted-foreground">{change.original}</span>
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span className="text-primary font-medium">{change.replacement}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{change.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {result?.raw && (
        <Card>
          <CardContent className="pt-6">
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto">
              {result.raw}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
