"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Wand2, Loader2, Copy, Check, ArrowRight, ArrowDown, Shield, Upload, Fingerprint, X } from "lucide-react";
import { useKeyboardSubmit } from "@/hooks/use-keyboard-submit";
import { useProgressMessage } from "@/hooks/use-progress-message";
import { SuccessFlash } from "@/components/success-flash";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhiWarning } from "@/components/phi-warning";
import { PrivacyBanner } from "@/components/privacy-banner";
import { ResultActions } from "@/components/result-actions";
import { scanAndCensorPhi, deepReinject, reinjectTokens } from "@/lib/phi-detection";
import { saveTokenMap, getTokenMap } from "@/lib/phi-tokenmap-storage";

const MAX_LENGTH = 50_000;

const WRITING_STYLES = [
  { value: "general", label: "General", description: "Natural, versatile rewrite" },
  { value: "manuscript", label: "Academic Manuscript", description: "Formal scholarly tone" },
  { value: "blog", label: "Blog Post", description: "Conversational and engaging" },
  { value: "email", label: "Professional Email", description: "Concise and warm" },
  { value: "social-media", label: "Social Media", description: "Punchy and authentic" },
  { value: "grant-proposal", label: "Grant Proposal", description: "Confident and precise" },
  { value: "patient-communication", label: "Patient Communication", description: "Plain language, empathetic" },
];

interface Verification {
  original_ai_score: number;
  rewritten_ai_score: number;
  improvement: number;
  original_verdict: string;
  rewritten_verdict: string;
  detector_source: string;
}

interface DeAiResult {
  rewritten_text?: string;
  changes_made?: {
    original: string;
    replacement: string;
    reason: string;
  }[];
  ai_patterns_found?: string[];
  first_pass_issues?: string[];
  confidence_score?: number;
  verification?: Verification;
  raw?: string;
}

export default function DeAiIfyPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <DeAiIfyContent />
    </Suspense>
  );
}

function DeAiIfyContent() {
  const searchParams = useSearchParams();
  const loadId = searchParams.get("load");

  const [input, setInput] = useState("");
  const [voiceSample, setVoiceSample] = useState("");
  const [showVoice, setShowVoice] = useState(false);
  const [writingStyle, setWritingStyle] = useState("general");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeAiResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [phiWarnings, setPhiWarnings] = useState<string[]>([]);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedRewrite, setCopiedRewrite] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [loadedVoiceSample, setLoadedVoiceSample] = useState("");
  const [loadedWritingStyle, setLoadedWritingStyle] = useState("general");
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressMsg = useProgressMessage(loading);

  useKeyboardSubmit(handleProcess, !loading && !!input.trim());

  const EXAMPLE_TEXT = `In today's rapidly evolving digital landscape, the intersection of technology and human creativity represents a multifaceted tapestry of innovation. It is not just about the tools we use — it is about the way we think, the way we collaborate, and ultimately, the way we reimagine what is possible. As we move forward into this new era, the opportunities are truly limitless.`;

  // Load persisted preferences on mount
  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => (r.ok ? r.json() : { preferences: null }))
      .then((data) => {
        const prefs = data?.preferences;
        if (!prefs) return;
        const persistedVoice =
          typeof prefs.voiceSampleGeneral === "string" ? prefs.voiceSampleGeneral : "";
        const persistedStyle =
          typeof prefs.defaultWritingStyle === "string" ? prefs.defaultWritingStyle : "general";
        setLoadedVoiceSample(persistedVoice);
        setLoadedWritingStyle(persistedStyle || "general");
        setVoiceSample((prev) => (prev ? prev : persistedVoice));
        if (persistedVoice) setShowVoice(true);
        setWritingStyle((prev) => (prev && prev !== "general" ? prev : persistedStyle || "general"));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loadId) return;
    setLoadingSaved(true);
    fetch(`/api/history/${loadId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.project) return;
        // Re-inject PHI from local tokenMap if available
        const tokenMap = getTokenMap(loadId);
        setInput(reinjectTokens(data.project.inputText || "", tokenMap));
        const meta = data.project.metadata || {};
        if (meta.writingStyle && typeof meta.writingStyle === "string") {
          setWritingStyle(meta.writingStyle);
        }
        if (data.project.outputText) {
          try {
            setResult(deepReinject(JSON.parse(data.project.outputText), tokenMap));
          } catch {}
        }
        setSavedId(loadId);
      })
      .catch(() => {})
      .finally(() => setLoadingSaved(false));
  }, [loadId]);

  async function handleProcess() {
    if (!input.trim()) return;
    if (input.length > MAX_LENGTH) {
      toast.error("Text exceeds 50,000 character limit");
      return;
    }
    setLoading(true);
    setResult(null);
    setSavedId(null);
    setPhiWarnings([]);

    try {
      // Client-side PHI redaction — real values never leave the browser.
      const phiInput = scanAndCensorPhi(input);
      const trimmedVoice = voiceSample.trim();
      const phiVoice = trimmedVoice ? scanAndCensorPhi(trimmedVoice) : null;
      const tokenMap = { ...phiInput.tokenMap, ...(phiVoice?.tokenMap || {}) };
      const combinedWarnings = [
        ...phiInput.warnings,
        ...(phiVoice?.warnings || []),
      ];
      if (phiInput.hasPhi || phiVoice?.hasPhi) {
        setPhiWarnings(combinedWarnings);
      }

      const res = await fetch("/api/analyze/de-ai-ify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: phiInput.censoredText,
          writingStyle,
          voiceSample: phiVoice ? phiVoice.censoredText : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Analysis failed");
        return;
      }
      if (data.phi?.detected) setPhiWarnings(data.phi.warnings);
      const restored = deepReinject(data.result, tokenMap);
      setResult(restored);
      setSavedId(data.savedId || null);
      // Persist tokenMap locally so reload-from-history still shows real values
      if (data.savedId) saveTokenMap(data.savedId, tokenMap);
      toast.success("Analysis complete");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setTimeout(() => {
        document.getElementById("deai-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      // Persist preferences if user opted in or values changed from loaded defaults
      const trimmedSampleForSave = voiceSample.trim();
      const voiceChanged = trimmedSampleForSave !== loadedVoiceSample.trim();
      const styleChanged = writingStyle !== loadedWritingStyle;
      const prefUpdates: Record<string, string> = {};
      if (saveAsDefault && voiceChanged) {
        prefUpdates.voiceSampleGeneral = trimmedSampleForSave;
      }
      if (styleChanged) {
        prefUpdates.defaultWritingStyle = writingStyle;
      }
      if (Object.keys(prefUpdates).length > 0) {
        fetch("/api/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prefUpdates),
        })
          .then(() => {
            if (prefUpdates.voiceSampleGeneral !== undefined) {
              setLoadedVoiceSample(prefUpdates.voiceSampleGeneral);
            }
            if (prefUpdates.defaultWritingStyle !== undefined) {
              setLoadedWritingStyle(prefUpdates.defaultWritingStyle);
            }
          })
          .catch(() => {});
      }
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
      <SuccessFlash show={showSuccess} />
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

      <PrivacyBanner />

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
          <div className="sticky bottom-0 bg-card pt-2 pb-1 -mx-6 px-6 border-t sm:static sm:border-t-0 sm:mx-0 sm:px-0 sm:pt-0 sm:pb-0 z-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <p className={`text-xs ${input.length > MAX_LENGTH ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {input.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()} chars · {input.trim() ? input.trim().split(/\s+/).length.toLocaleString() : "0"} words
                </p>
                {input && (
                  <button
                    onClick={() => { setInput(""); setResult(null); }}
                    className="text-muted-foreground/50 hover:text-foreground transition-colors"
                    title="Clear input"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
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
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-muted-foreground">Rewrite for:</label>
                <Select value={writingStyle} onValueChange={setWritingStyle}>
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WRITING_STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <div>
                          <span>{s.label}</span>
                          <span className="text-muted-foreground ml-1.5 text-xs">- {s.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setInput(EXAMPLE_TEXT)}
                >
                  Try an example
                </Button>
                <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleProcess} disabled={loading || loadingSaved || !input.trim() || input.length > MAX_LENGTH}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {progressMsg}
                    </>
                  ) : loadingSaved ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      {savedId && result ? "Re-run" : "De-AI-ify"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          {/* Voice Calibration (optional) */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowVoice(!showVoice)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Fingerprint className="h-3.5 w-3.5" />
              {showVoice ? "Hide" : "Match my writing voice"} (optional)
            </button>
            {showVoice && (
              <>
                <Textarea
                  placeholder="Paste 2-3 paragraphs of YOUR writing here. We'll analyze your sentence rhythm, word choices, and quirks to make the rewrite sound like you..."
                  value={voiceSample}
                  onChange={(e) => setVoiceSample(e.target.value)}
                  className="min-h-[100px] text-sm"
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  Save as default voice sample
                </label>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {phiWarnings.length > 0 && <PhiWarning warnings={phiWarnings} />}

      {result && !result.raw && (
        <div id="deai-results" className="space-y-4 border-t-2 border-violet-500">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold">Humanized Output</h2>
            <ResultActions savedId={savedId} />
          </div>

          {/* Confidence Score */}
          {result.confidence_score !== undefined && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Human-Sounding Confidence</span>
                    <Badge variant="outline" className="text-[10px]">
                      {WRITING_STYLES.find(s => s.value === writingStyle)?.label || writingStyle}
                    </Badge>
                  </div>
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

          {/* Closed-Loop Verification */}
          {result.verification && (
            <Card className="border-primary/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">AI Detection Verification</span>
                  <Badge variant="outline" className="text-[10px]">{result.verification.detector_source.split("/").pop()}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 text-center p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20">
                    <p className="text-2xl font-bold text-red-600">{Math.round(result.verification.original_ai_score * 100)}%</p>
                    <p className="text-xs text-muted-foreground">Original AI Score</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ArrowDown className="h-5 w-5 text-primary" />
                    <span className={`text-sm font-bold ${result.verification.improvement > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                      {result.verification.improvement > 0 ? "-" : ""}{Math.round(Math.abs(result.verification.improvement) * 100)}%
                    </span>
                  </div>
                  <div className="flex-1 text-center p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20">
                    <p className="text-2xl font-bold text-green-600">{Math.round(result.verification.rewritten_ai_score * 100)}%</p>
                    <p className="text-xs text-muted-foreground">Rewritten AI Score</p>
                  </div>
                </div>
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

          {/* Audit Pass Fixes */}
          {result.first_pass_issues && result.first_pass_issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Audit Pass Fixes</CardTitle>
                <CardDescription>Issues caught and fixed during the second-pass audit</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.first_pass_issues.map((issue: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
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
