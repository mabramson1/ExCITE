"use client";

import { useState } from "react";
import { ScanSearch, Loader2, Copy, Check, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PhiWarning } from "@/components/phi-warning";

interface FlaggedSection {
  text: string;
  ai_probability: number;
  patterns_detected: string[];
  suggested_rewrite: string;
}

interface DetectorResult {
  overall_ai_probability?: number;
  verdict?: string;
  flagged_sections?: FlaggedSection[];
  patterns_summary?: string[];
  recommendations?: string[];
  raw?: string;
}

const verdictConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  likely_human: { label: "Likely Human", color: "text-green-600", icon: CheckCircle2 },
  possibly_ai: { label: "Possibly AI", color: "text-yellow-600", icon: AlertTriangle },
  likely_ai: { label: "Likely AI", color: "text-orange-600", icon: AlertTriangle },
  definitely_ai: { label: "Definitely AI", color: "text-red-600", icon: XCircle },
};

export default function AiDetectorPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectorResult | null>(null);
  const [phiWarnings, setPhiWarnings] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function handleDetect() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setPhiWarnings([]);

    try {
      const res = await fetch("/api/analyze/ai-detect", {
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

  function copyRewrite(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  const overallPercent = result?.overall_ai_probability
    ? Math.round(result.overall_ai_probability * 100)
    : 0;

  const verdict = result?.verdict ? verdictConfig[result.verdict] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
          <ScanSearch className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Text Detector</h1>
          <p className="text-sm text-muted-foreground">
            Detect AI-generated text and get suggested rewrites to sound human
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paste Text to Analyze</CardTitle>
          <CardDescription>
            We&apos;ll scan for AI patterns, flag suspicious sections, and suggest human-sounding alternatives.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste the text you want to check for AI generation...&#10;&#10;The detector will analyze writing patterns, sentence structure, and vocabulary to identify AI-generated content."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[200px]"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{input.length} characters</p>
            <Button onClick={handleDetect} disabled={loading || !input.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <ScanSearch className="h-4 w-4" />
                  Detect AI
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {phiWarnings.length > 0 && <PhiWarning warnings={phiWarnings} />}

      {result && !result.raw && (
        <div className="space-y-4">
          {/* Overall Score */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {verdict && <verdict.icon className={`h-5 w-5 ${verdict.color}`} />}
                  <span className="font-semibold">
                    {verdict?.label || "Analysis Complete"}
                  </span>
                </div>
                <span className="text-2xl font-bold">{overallPercent}%</span>
              </div>
              <Progress value={overallPercent} />
              <p className="text-xs text-muted-foreground mt-2">
                AI probability score: {overallPercent}% chance this text is AI-generated
              </p>
            </CardContent>
          </Card>

          {/* Patterns Summary */}
          {result.patterns_summary && result.patterns_summary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detected Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.patterns_summary.map((p, i) => (
                    <Badge key={i} variant="outline">{p}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Flagged Sections */}
          {result.flagged_sections && result.flagged_sections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Flagged Sections ({result.flagged_sections.length})
                </CardTitle>
                <CardDescription>
                  Each flagged section includes a suggested human-sounding rewrite.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.flagged_sections.map((section, i) => (
                  <div key={i} className="rounded-lg border overflow-hidden">
                    {/* Flagged text */}
                    <div className="p-4 bg-red-50/50 dark:bg-red-950/20 border-b">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="destructive" className="text-[10px]">
                          {Math.round(section.ai_probability * 100)}% AI
                        </Badge>
                        <div className="flex flex-wrap gap-1">
                          {section.patterns_detected.map((p, j) => (
                            <Badge key={j} variant="outline" className="text-[10px]">{p}</Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm italic text-muted-foreground">
                        &ldquo;{section.text}&rdquo;
                      </p>
                    </div>
                    {/* Suggested rewrite */}
                    <div className="p-4 bg-green-50/50 dark:bg-green-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">
                          Suggested Rewrite
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => copyRewrite(section.suggested_rewrite, i)}
                        >
                          {copiedIndex === i ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {copiedIndex === i ? "Copied" : "Copy"}
                        </Button>
                      </div>
                      <p className="text-sm">{section.suggested_rewrite}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
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
