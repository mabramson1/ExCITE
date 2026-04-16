"use client";

import { useState } from "react";
import { BookOpen, Loader2, Copy, Check, Download, ExternalLink, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhiWarning } from "@/components/phi-warning";
import { ResultActions } from "@/components/result-actions";

interface PubMedMatch {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  doi: string | null;
}

interface PubMedSuggestion {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  doi: string | null;
  source: string;
}

interface SuggestedCitation {
  formatted: string;
  doi?: string | null;
  pmid?: string | null;
  relevance: string;
  verified?: boolean;
  note?: string;
  pubmed_verified?: boolean;
  verification_confidence?: string;
  pubmed_match?: PubMedMatch;
}

interface VerifiedResult {
  pmid?: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  doi: string | null;
  url?: string;
  source: string;
  verified?: boolean;
}

interface ClaimCitation {
  text: string;
  location: string;
  why_citation_needed?: string;
  search_terms?: string;
  suggested_citations: SuggestedCitation[];
  pubmed_suggestions?: PubMedSuggestion[];
  pubmed_results?: VerifiedResult[];
  crossref_results?: VerifiedResult[];
}

interface ExistingCitation {
  original: string;
  status: string;
  corrected?: string;
  note?: string;
}

interface ManuscriptResult {
  claims_needing_citations?: ClaimCitation[];
  existing_citations_review?: ExistingCitation[];
  bibliography?: string[];
  summary?: string;
  disclaimer?: string;
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
  const [savedId, setSavedId] = useState<string | null>(null);
  const [phiWarnings, setPhiWarnings] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  async function handleAnalyze() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setSavedId(null);
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
      setSavedId(data.savedId || null);
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold">Citation Results</h2>
            <div className="flex gap-2 flex-wrap">
              <ResultActions savedId={savedId} />
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
                    <p className="text-xs text-muted-foreground mb-1">{claim.location}</p>
                    {claim.why_citation_needed && (
                      <p className="text-xs text-muted-foreground mb-3">{claim.why_citation_needed}</p>
                    )}
                    {/* PubMed-First Verified Results */}
                    {claim.pubmed_results && claim.pubmed_results.length > 0 && (
                      <div className="mb-3 space-y-2">
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified from PubMed ({claim.pubmed_results.length})
                        </p>
                        {claim.pubmed_results.map((pr, k) => (
                          <div key={k} className="pl-3 border-l-2 border-emerald-400 dark:border-emerald-600 p-2 rounded-r bg-emerald-50/50 dark:bg-emerald-950/20">
                            <p className="text-sm font-medium">{pr.title}</p>
                            <p className="text-xs text-muted-foreground">{pr.authors} - {pr.journal} ({pr.year})</p>
                            <div className="flex items-center gap-2 mt-1">
                              {pr.pmid && (
                                <a href={`https://pubmed.ncbi.nlm.nih.gov/${pr.pmid}/`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                  <ExternalLink className="h-2.5 w-2.5" /> PMID: {pr.pmid}
                                </a>
                              )}
                              {pr.doi && (
                                <a href={`https://doi.org/${pr.doi}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                  <ExternalLink className="h-2.5 w-2.5" /> DOI
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* CrossRef Results */}
                    {claim.crossref_results && claim.crossref_results.length > 0 && (
                      <div className="mb-3 space-y-2">
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Found via CrossRef ({claim.crossref_results.length})
                        </p>
                        {claim.crossref_results.map((cr, k) => (
                          <div key={k} className="pl-3 border-l-2 border-blue-400 dark:border-blue-600 p-2 rounded-r bg-blue-50/50 dark:bg-blue-950/20">
                            <p className="text-sm font-medium">{cr.title}</p>
                            <p className="text-xs text-muted-foreground">{cr.authors} - {cr.journal} ({cr.year})</p>
                            {cr.doi && (
                              <a href={`https://doi.org/${cr.doi}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                                <ExternalLink className="h-2.5 w-2.5" /> DOI: {cr.doi}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* AI-Suggested Citations */}
                    <div className="space-y-2">
                      {claim.suggested_citations.map((cit, j) => (
                        <div key={j} className="pl-3 border-l-2 border-primary/30">
                          <div className="flex items-start gap-2">
                            <p className="text-sm flex-1">{cit.formatted}</p>
                            <div className="flex items-center gap-1 shrink-0">
                              {cit.pubmed_verified === true ? (
                                <Badge variant="success" className="text-[10px] flex items-center gap-0.5">
                                  <CheckCircle2 className="h-2.5 w-2.5" />
                                  PubMed Verified
                                </Badge>
                              ) : cit.pubmed_verified === false && cit.verification_confidence === "partial" ? (
                                <Badge variant="warning" className="text-[10px] flex items-center gap-0.5">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  Partial Match
                                </Badge>
                              ) : cit.pubmed_verified === false ? (
                                <Badge variant="destructive" className="text-[10px] flex items-center gap-0.5">
                                  <XCircle className="h-2.5 w-2.5" />
                                  Not Found
                                </Badge>
                              ) : (
                                <Badge variant="warning" className="text-[10px]">VERIFY</Badge>
                              )}
                            </div>
                          </div>
                          {cit.pubmed_match && (
                            <div className="mt-1.5 p-2 rounded bg-muted/60 text-xs space-y-0.5">
                              <p className="font-medium">{cit.pubmed_match.title}</p>
                              <p className="text-muted-foreground">
                                {cit.pubmed_match.authors} - {cit.pubmed_match.journal} ({cit.pubmed_match.year})
                              </p>
                              <div className="flex items-center gap-2 pt-0.5">
                                <a
                                  href={`https://pubmed.ncbi.nlm.nih.gov/${cit.pubmed_match.pmid}/`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  <ExternalLink className="h-2.5 w-2.5" />
                                  PMID: {cit.pubmed_match.pmid}
                                </a>
                                {cit.pubmed_match.doi && (
                                  <a
                                    href={`https://doi.org/${cit.pubmed_match.doi}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                  >
                                    <ExternalLink className="h-2.5 w-2.5" />
                                    DOI
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                          {!cit.pubmed_match && cit.doi && (
                            <p className="text-xs text-muted-foreground mt-0.5">DOI: {cit.doi}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{cit.relevance}</p>
                          {cit.note && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{cit.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* PubMed Alternative Suggestions */}
                    {claim.pubmed_suggestions && claim.pubmed_suggestions.length > 0 && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          PubMed found these related articles:
                        </p>
                        {claim.pubmed_suggestions.map((ps, k) => (
                          <div key={k} className="pl-3 border-l-2 border-emerald-300 dark:border-emerald-700">
                            <p className="text-sm font-medium">{ps.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {ps.authors} - {ps.journal} ({ps.year})
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <a
                                href={`https://pubmed.ncbi.nlm.nih.gov/${ps.pmid}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                PMID: {ps.pmid}
                              </a>
                              {ps.doi && (
                                <a
                                  href={`https://doi.org/${ps.doi}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <ExternalLink className="h-2.5 w-2.5" />
                                  DOI
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {claim.search_terms && (
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                        Search: <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(claim.search_terms)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-primary hover:underline"
                        >
                          {claim.search_terms}
                        </a>
                      </p>
                    )}
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

          {/* Disclaimer */}
          {result.disclaimer && (
            <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3 italic">
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
