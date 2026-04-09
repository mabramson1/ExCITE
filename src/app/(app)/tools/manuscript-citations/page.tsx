"use client";

import { useState } from "react";
import { BookOpen, Loader2, Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhiWarning } from "@/components/phi-warning";

interface ClaimCitation {
  text: string;
  location: string;
  suggested_citations: {
    formatted: string;
    doi?: string;
    relevance: string;
  }[];
}

interface ExistingCitation {
  original: string;
  status: string;
  corrected?: string;
}

interface ManuscriptResult {
  claims_needing_citations?: ClaimCitation[];
  existing_citations_review?: ExistingCitation[];
  bibliography?: string[];
  summary?: string;
  raw?: string;
}

const STYLES = [
  { value: "apa", label: "APA (7th Edition)" },
  { value: "mla", label: "MLA (9th Edition)" },
  { value: "chicago", label: "Chicago" },
  { value: "vancouver", label: "Vancouver" },
  { value: "harvard", label: "Harvard" },
  { value: "ieee", label: "IEEE" },
];

export default function ManuscriptCitationsPage() {
  const [input, setInput] = useState("");
  const [style, setStyle] = useState("apa");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ManuscriptResult | null>(null);
  const [phiWarnings, setPhiWarnings] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  async function handleAnalyze() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setPhiWarnings([]);

    try {
      const res = await fetch("/api/analyze/manuscript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, style }),
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

  function handleCopy() {
    const text = result?.bibliography?.join("\n") || JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manuscript-citations-${style}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const statusColor = (s: string) => {
    switch (s) {
      case "valid": return "success" as const;
      case "needs_correction": return "warning" as const;
      case "not_found": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manuscript Citations</h1>
          <p className="text-sm text-muted-foreground">
            Find, format, and validate citations for your academic manuscript
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paste Your Manuscript</CardTitle>
          <CardDescription>
            We&apos;ll identify claims needing citations and suggest properly formatted references.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your manuscript text here...&#10;&#10;Example: Recent studies have shown that machine learning algorithms can predict patient outcomes with high accuracy. The prevalence of type 2 diabetes has increased significantly over the past decade..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[200px]"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Citation Style:</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAnalyze} disabled={loading || !input.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Find Citations"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {phiWarnings.length > 0 && <PhiWarning warnings={phiWarnings} />}

      {result && !result.raw && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Citation Results</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {result.summary && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm">{result.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Claims Needing Citations */}
          {result.claims_needing_citations && result.claims_needing_citations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Claims Needing Citations ({result.claims_needing_citations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.claims_needing_citations.map((claim, i) => (
                  <div key={i} className="p-4 rounded-lg border bg-muted/30">
                    <p className="text-sm italic mb-1">&ldquo;{claim.text}&rdquo;</p>
                    <p className="text-xs text-muted-foreground mb-3">{claim.location}</p>
                    <div className="space-y-2">
                      {claim.suggested_citations.map((cit, j) => (
                        <div key={j} className="pl-3 border-l-2 border-primary/30">
                          <p className="text-sm">{cit.formatted}</p>
                          {cit.doi && (
                            <p className="text-xs text-muted-foreground mt-0.5">DOI: {cit.doi}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{cit.relevance}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Existing Citation Review */}
          {result.existing_citations_review && result.existing_citations_review.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Existing Citation Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.existing_citations_review.map((cit, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm">{cit.original}</p>
                      <Badge variant={statusColor(cit.status)}>{cit.status.replace("_", " ")}</Badge>
                    </div>
                    {cit.corrected && (
                      <p className="text-sm text-primary mt-1">Corrected: {cit.corrected}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Bibliography */}
          {result.bibliography && result.bibliography.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Generated Bibliography ({style.toUpperCase()})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 list-decimal list-inside">
                  {result.bibliography.map((ref, i) => (
                    <li key={i} className="text-sm pl-2">{ref}</li>
                  ))}
                </ol>
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
