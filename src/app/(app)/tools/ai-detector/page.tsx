"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ScanSearch, Loader2, Copy, Check, AlertTriangle, CheckCircle2, XCircle, Shield, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PhiWarning } from "@/components/phi-warning";
import { ResultActions } from "@/components/result-actions";
import { useKeyboardSubmit } from "@/hooks/use-keyboard-submit";

const MAX_LENGTH = 50_000;

interface SentenceScore {
  sentence: string;
  ai_probability: number;
  primary_pattern: string | null;
}

interface FlaggedSection {
  text: string;
  ai_probability: number;
  patterns_detected: string[];
  explanation?: string;
  suggested_rewrite: string;
}

interface ExternalDetector {
  source: string;
  model: string;
  ai_probability: number;
  human_probability: number;
  verdict: string;
  available: boolean;
  error?: string;
}

interface DetectorResult {
  overall_ai_probability?: number;
  verdict?: string;
  reasoning?: string;
  sentence_scores?: SentenceScore[];
  flagged_sections?: FlaggedSection[];
  human_indicators?: string[];
  patterns_summary?: string[];
  recommendations?: string[];
  external_detectors?: ExternalDetector[];
  consensus_score?: number;
  consensus_verdict?: string;
  disclaimer?: string;
  raw?: string;
}

const verdictConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  likely_human: { label: "Likely Human", color: "text-green-600", icon: CheckCircle2 },
  possibly_ai: { label: "Possibly AI", color: "text-yellow-600", icon: AlertTriangle },
  likely_ai: { label: "Likely AI", color: "text-orange-600", icon: AlertTriangle },
  definitely_ai: { label: "Definitely AI", color: "text-red-600", icon: XCircle },
};

export default function AiDetectorPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <AiDetectorContent />
    </Suspense>
  );
}

function AiDetectorContent() {
  const searchParams = useSearchParams();
  const loadId = searchParams.get("load");

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectorResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [phiWarnings, setPhiWarnings] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useKeyboardSubmit(handleDetect, !loading && !!input.trim());

  useEffect(() => {
    if (!loadId) return;
    setLoadingSaved(true);
    fetch(`/api/history/${loadId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.project) return;
        setInput(data.project.inputText || "");
        if (data.project.outputText) {
          try {
            setResult(JSON.parse(data.project.outputText));
          } catch {}
        }
        setSavedId(loadId);
      })
      .catch(() => {})
      .finally(() => setLoadingSaved(false));
  }, [loadId]);

  async function handleDetect() {
    if (!input.trim()) return;
    if (input.length > MAX_LENGTH) {
      toast.error(`Text exceeds ${MAX_LENGTH.toLocaleString()} character limit`);
      return;
    }
    setLoading(true);
    setResult(null);
    setSavedId(null);
    setPhiWarnings([]);

    try {
      const res = await fetch("/api/analyze/ai-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Analysis failed");
        return;
      }
      if (data.phi?.detected) setPhiWarnings(data.phi.warnings);
      setResult(data.result);
      setSavedId(data.savedId || null);
      toast.success("Analysis complete");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      toast.error("File too large. Maximum 500KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") {
        setInput(text.slice(0, MAX_LENGTH));
        toast.success(`Loaded ${file.name}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
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
            We&apos;ll scan for AI patterns, flag suspicious sections, and suggest human-sounding alternatives. Press <kbd className="rounded border px-1 py-0.5 text-[10px] font-mono">⌘ Enter</kbd> to submit.
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
            <div className="flex items-center gap-3">
              <p className={`text-xs ${input.length > MAX_LENGTH ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                {input.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()} chars · {input.trim() ? input.trim().split(/\s+/).length.toLocaleString() : "0"} words
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.doc,.docx,.rtf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3 w-3" />
                Upload file
              </Button>
            </div>
            <Button onClick={handleDetect} disabled={loading || loadingSaved || !input.trim() || input.length > MAX_LENGTH}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : loadingSaved ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ScanSearch className="h-4 w-4" />
                  {savedId && result ? "Re-scan" : "Detect AI"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {phiWarnings.length > 0 && <PhiWarning warnings={phiWarnings} />}

      {loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-7 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {result && !result.raw && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold">Detection Results</h2>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                  toast.success("Results copied to clipboard");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Results
              </Button>
              <ResultActions savedId={savedId} />
            </div>
          </div>

          {/* Consensus Score (if available) */}
          {result.consensus_score !== undefined && (
            <Card className="border-primary/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Multi-Source Consensus</span>
                  </div>
                  <span className="text-2xl font-bold">
                    {Math.round(result.consensus_score * 100)}%
                  </span>
                </div>
                <Progress value={Math.round(result.consensus_score * 100)} />
                <p className="text-xs text-muted-foreground mt-2">
                  Combined score: Claude (60%) + external detectors (40%, avg of Pangram + Sapling + 2026 heuristics)
                </p>
              </CardContent>
            </Card>
          )}

          {/* Individual Source Scores */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Claude Analysis */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {verdict && <verdict.icon className={`h-5 w-5 ${verdict.color}`} />}
                    <div>
                      <span className="font-semibold text-sm">
                        {verdict?.label || "Analysis Complete"}
                      </span>
                      <p className="text-[10px] text-muted-foreground">Claude Pattern Analysis</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold">{overallPercent}%</span>
                </div>
                <Progress value={overallPercent} />
                {result.reasoning && (
                  <p className="text-xs text-muted-foreground mt-2">{result.reasoning}</p>
                )}
              </CardContent>
            </Card>

            {/* External Detectors */}
            {result.external_detectors?.map((detector, i) => {
              const detectorPercent = Math.round(detector.ai_probability * 100);
              const detectorVerdict = detector.available
                ? verdictConfig[detector.verdict]
                : null;
              return (
                <Card key={i}>
                  <CardContent className="pt-6">
                    {detector.available ? (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {detectorVerdict && (
                              <detectorVerdict.icon
                                className={`h-5 w-5 ${detectorVerdict.color}`}
                              />
                            )}
                            <div>
                              <span className="font-semibold text-sm">
                                {detectorVerdict?.label || detector.verdict}
                              </span>
                              <p className="text-[10px] text-muted-foreground">
                                {detector.source}
                              </p>
                            </div>
                          </div>
                          <span className="text-xl font-bold">{detectorPercent}%</span>
                        </div>
                        <Progress value={detectorPercent} />
                        <p className="text-xs text-muted-foreground mt-2 break-all">
                          {detector.model}
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{detector.source} Unavailable</p>
                          <p className="text-xs">{detector.error}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

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

          {/* Sentence-Level Highlighting */}
          {result.sentence_scores && result.sentence_scores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sentence-Level Analysis</CardTitle>
                <CardDescription>
                  Each sentence is color-coded by AI probability. Hover for details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm leading-relaxed space-y-0.5">
                  {result.sentence_scores.map((s, i) => {
                    const pct = Math.round(s.ai_probability * 100);
                    let bgColor = "bg-transparent";
                    let textColor = "";
                    if (s.ai_probability >= 0.8) {
                      bgColor = "bg-red-100 dark:bg-red-950/40";
                      textColor = "text-red-900 dark:text-red-100";
                    } else if (s.ai_probability >= 0.55) {
                      bgColor = "bg-orange-100 dark:bg-orange-950/30";
                      textColor = "text-orange-900 dark:text-orange-100";
                    } else if (s.ai_probability >= 0.3) {
                      bgColor = "bg-yellow-50 dark:bg-yellow-950/20";
                      textColor = "text-yellow-900 dark:text-yellow-100";
                    }
                    return (
                      <span
                        key={i}
                        className={`inline rounded px-0.5 ${bgColor} ${textColor} cursor-help`}
                        title={`AI: ${pct}%${s.primary_pattern ? ` — ${s.primary_pattern}` : ""}`}
                      >
                        {s.sentence}{" "}
                      </span>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-950/40 border" />
                    Definitely AI (80%+)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-950/30 border" />
                    Likely AI (55-80%)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-yellow-50 dark:bg-yellow-950/20 border" />
                    Possibly AI (30-55%)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-transparent border" />
                    Likely Human (&lt;30%)
                  </div>
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

          {/* Human Indicators */}
          {result.human_indicators && result.human_indicators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Human Writing Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.human_indicators.map((h, i) => (
                    <Badge key={i} variant="outline" className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-400">
                      {h}
                    </Badge>
                  ))}
                </div>
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

          {/* Disclaimer */}
          {result.disclaimer && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 italic">
              {result.disclaimer}
            </p>
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
