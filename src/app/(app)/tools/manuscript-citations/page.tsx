"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, Loader2, Copy, Check, Download, ExternalLink, CheckCircle2, XCircle, AlertTriangle, Upload, MessageSquare, PenTool, Fingerprint, Wand2, ScanSearch, X, BookmarkPlus, Library } from "lucide-react";
import { useKeyboardSubmit } from "@/hooks/use-keyboard-submit";
import { SuccessFlash } from "@/components/success-flash";
import { toast } from "sonner";
import { handleCreditError } from "@/lib/credit-error";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PhiWarning } from "@/components/phi-warning";
import { PrivacyBanner } from "@/components/privacy-banner";
import { ResultActions } from "@/components/result-actions";
import { scanAndCensorPhi, deepReinject, reinjectTokens } from "@/lib/phi-detection";
import { saveTokenMap, getTokenMap } from "@/lib/phi-tokenmap-storage";
import { CitationLibrary } from "@/components/citation-library";

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

const MAX_LENGTH = 50_000;

const STYLES = [
  { value: "apa", label: "APA (7th Edition)" },
  { value: "mla", label: "MLA (9th Edition)" },
  { value: "chicago", label: "Chicago" },
  { value: "vancouver", label: "Vancouver" },
  { value: "harvard", label: "Harvard" },
  { value: "ieee", label: "IEEE" },
];

export default function ManuscriptCitationsPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <ManuscriptCitationsContent />
    </Suspense>
  );
}

function ManuscriptCitationsContent() {
  const searchParams = useSearchParams();
  const loadId = searchParams.get("load");

  const [activeTab, setActiveTab] = useState("citations");
  const [input, setInput] = useState("");
  const [style, setStyle] = useState("apa");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ManuscriptResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [phiWarnings, setPhiWarnings] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useKeyboardSubmit(handleAnalyze, !loading && !!input.trim());

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
        if (data.project.citationStyle) setStyle(data.project.citationStyle);
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

  async function handleAnalyze() {
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
      const phi = scanAndCensorPhi(input);
      if (phi.hasPhi) setPhiWarnings(phi.warnings);

      const res = await fetch("/api/analyze/manuscript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: phi.censoredText, style }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (handleCreditError(res.status, data)) return;
        toast.error(data.error || "Analysis failed");
        return;
      }
      if (data.phi?.detected) setPhiWarnings(data.phi.warnings);
      const restored = deepReinject(data.result, phi.tokenMap);
      setResult(restored);
      setSavedId(data.savedId || null);
      // Persist tokenMap locally so reload-from-history still shows real values
      if (data.savedId) saveTokenMap(data.savedId, phi.tokenMap);
      toast.success("Analysis complete");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setTimeout(() => {
        document.getElementById("citation-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
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

  async function handleSaveToLibrary(citation: { pmid?: string; doi?: string | null; title: string; authors: string; journal?: string; year?: string }) {
    try {
      const res = await fetch("/api/citation-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pmid: citation.pmid || null,
          doi: citation.doi || null,
          title: citation.title,
          authors: citation.authors,
          journal: citation.journal || null,
          year: citation.year || null,
        }),
      });
      if (res.ok) {
        toast.success("Saved to citation library");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save citation");
      }
    } catch {
      toast.error("Network error");
    }
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
      <SuccessFlash show={showSuccess} />
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

      <PrivacyBanner />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Desktop tabs */}
        <div className="hidden sm:block">
          <TabsList className="w-full flex overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="citations" className="gap-1.5">
              <BookOpen className="h-4 w-4" />
              Find Citations
            </TabsTrigger>
            <TabsTrigger value="review-response" className="gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Review Response
            </TabsTrigger>
            <TabsTrigger value="write" className="gap-1.5">
              <PenTool className="h-4 w-4" />
              Write Manuscript
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-1.5">
              <Library className="h-4 w-4" />
              Library
            </TabsTrigger>
          </TabsList>
        </div>
        {/* Mobile dropdown */}
        <div className="sm:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="citations">
                <span className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Find Citations</span>
              </SelectItem>
              <SelectItem value="review-response">
                <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Review Response</span>
              </SelectItem>
              <SelectItem value="write">
                <span className="flex items-center gap-2"><PenTool className="h-4 w-4" /> Write Manuscript</span>
              </SelectItem>
              <SelectItem value="library">
                <span className="flex items-center gap-2"><Library className="h-4 w-4" /> Library</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="citations">
          <div className="space-y-6">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setInput(`Studies have shown that SGLT2 inhibitors reduce the risk of heart failure hospitalization in patients with type 2 diabetes. The EMPA-REG OUTCOME trial demonstrated significant cardiovascular benefits. Furthermore, recent meta-analyses suggest these agents may also slow CKD progression independently of glycemic control.`)}
                      >
                        Try an example
                      </Button>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAnalyze} disabled={loading || loadingSaved || !input.trim() || input.length > MAX_LENGTH}>
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : loadingSaved ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : savedId && result ? (
                          "Re-run Citations"
                        ) : (
                          "Find Citations"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {phiWarnings.length > 0 && <PhiWarning warnings={phiWarnings} />}

            {result && !result.raw && (
              <div id="citation-results" className="space-y-4 border-t-2 border-emerald-500">
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
                                    <button
                                      type="button"
                                      onClick={() => handleSaveToLibrary({ pmid: pr.pmid, doi: pr.doi, title: pr.title, authors: pr.authors, journal: pr.journal, year: pr.year })}
                                      className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
                                      title="Save to library"
                                    >
                                      <BookmarkPlus className="h-3 w-3" />
                                      Save
                                    </button>
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
                                  <div className="flex items-center gap-2 mt-1">
                                    {cr.doi && (
                                      <a href={`https://doi.org/${cr.doi}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                        <ExternalLink className="h-2.5 w-2.5" /> DOI: {cr.doi}
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleSaveToLibrary({ pmid: cr.pmid, doi: cr.doi, title: cr.title, authors: cr.authors, journal: cr.journal, year: cr.year })}
                                      className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
                                      title="Save to library"
                                    >
                                      <BookmarkPlus className="h-3 w-3" />
                                      Save
                                    </button>
                                  </div>
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
                                      <button
                                        type="button"
                                        onClick={() => handleSaveToLibrary({ pmid: cit.pubmed_match!.pmid, doi: cit.pubmed_match!.doi, title: cit.pubmed_match!.title, authors: cit.pubmed_match!.authors, journal: cit.pubmed_match!.journal, year: cit.pubmed_match!.year })}
                                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
                                        title="Save to library"
                                      >
                                        <BookmarkPlus className="h-3 w-3" />
                                        Save
                                      </button>
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
                                    <button
                                      type="button"
                                      onClick={() => handleSaveToLibrary({ pmid: ps.pmid, doi: ps.doi, title: ps.title, authors: ps.authors, journal: ps.journal, year: ps.year })}
                                      className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
                                      title="Save to library"
                                    >
                                      <BookmarkPlus className="h-3 w-3" />
                                      Save
                                    </button>
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
        </TabsContent>

        <TabsContent value="review-response">
          <ReviewResponseTab />
        </TabsContent>

        <TabsContent value="write">
          <ManuscriptWriterTab />
        </TabsContent>

        <TabsContent value="library">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Citation Library</CardTitle>
              <CardDescription>
                Your saved citations for quick reuse across manuscripts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CitationLibrary />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Review Response Tab ──────────────────────────────────────────────

interface ReviewResponse {
  reviewer_comment: string;
  response_type: "revision" | "clarification" | "rebuttal";
  response: string;
  manuscript_change: string | null;
}

interface ReviewResponseResult {
  response_letter?: string;
  responses?: ReviewResponse[];
  summary_of_changes?: string[];
  thank_you_note?: string;
  raw?: string;
}

const RESPONSE_TYPE_STYLES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  revision: { label: "Revision", variant: "default" },
  clarification: { label: "Clarification", variant: "secondary" },
  rebuttal: { label: "Rebuttal", variant: "outline" },
};

function ReviewResponseTab() {
  const [manuscript, setManuscript] = useState("");
  const [reviewerComments, setReviewerComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResponseResult | null>(null);
  const [phiWarnings, setPhiWarnings] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!manuscript.trim() || !reviewerComments.trim()) return;
    if (manuscript.length > MAX_LENGTH) {
      toast.error("Manuscript text exceeds 50,000 character limit");
      return;
    }
    setLoading(true);
    setResult(null);
    setPhiWarnings([]);

    try {
      // Client-side PHI redaction — real values never leave the browser.
      const phiManuscript = scanAndCensorPhi(manuscript);
      const phiReviewer = scanAndCensorPhi(reviewerComments);
      const tokenMap = { ...phiManuscript.tokenMap, ...phiReviewer.tokenMap };
      const combinedWarnings = [...phiManuscript.warnings, ...phiReviewer.warnings];
      if (phiManuscript.hasPhi || phiReviewer.hasPhi) {
        setPhiWarnings(combinedWarnings);
      }

      const res = await fetch("/api/analyze/review-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manuscript: phiManuscript.censoredText,
          reviewerComments: phiReviewer.censoredText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (handleCreditError(res.status, data)) return;
        toast.error(data.error || "Failed to generate response");
        return;
      }
      if (data.phi?.detected) setPhiWarnings(data.phi.warnings);
      const restored = deepReinject(data.result, tokenMap);
      setResult(restored);
      // Persist tokenMap locally so future reload-from-history still shows real values
      if (data.savedId) saveTokenMap(data.savedId, tokenMap);
      toast.success("Response letter generated");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyLetter() {
    if (!result?.response_letter) return;
    navigator.clipboard.writeText(result.response_letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Peer Review Response Generator</CardTitle>
          <CardDescription>
            Paste your manuscript and the reviewer comments to generate a professional point-by-point response letter.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Manuscript Text</label>
            <Textarea
              placeholder="Paste your manuscript text here..."
              value={manuscript}
              onChange={(e) => setManuscript(e.target.value)}
              className="min-h-[150px]"
            />
            <p className={`text-xs mt-1 ${manuscript.length > MAX_LENGTH ? "text-destructive font-medium" : "text-muted-foreground"}`}>
              {manuscript.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()} chars
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Reviewer Comments</label>
            <Textarea
              placeholder={"Paste the reviewer comments here...\n\nExample:\nReviewer 1:\n1. The methodology section lacks detail on sample size justification.\n2. The authors should discuss limitations of the cross-sectional design.\n\nReviewer 2:\n1. Table 2 results are not discussed in the text..."}
              value={reviewerComments}
              onChange={(e) => setReviewerComments(e.target.value)}
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {reviewerComments.length.toLocaleString()} chars
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={loading || !manuscript.trim() || !reviewerComments.trim() || manuscript.length > MAX_LENGTH}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  Generate Response
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {phiWarnings.length > 0 && <PhiWarning warnings={phiWarnings} />}

      {result && !result.raw && (
        <div className="space-y-4">
          {/* Thank You Note */}
          {result.thank_you_note && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Opening</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{result.thank_you_note}</p>
              </CardContent>
            </Card>
          )}

          {/* Individual Responses */}
          {result.responses && result.responses.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-lg font-semibold">Point-by-Point Responses ({result.responses.length})</h2>
                {result.responses && result.responses.some(r => r.manuscript_change) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const changes = result.responses!
                        .filter(r => r.manuscript_change)
                        .map((r, i) => `${i + 1}. ${r.manuscript_change}`)
                        .join("\n\n");
                      navigator.clipboard.writeText(changes);
                      toast.success("All suggested changes copied to clipboard");
                    }}
                  >
                    <Check className="h-4 w-4" /> Copy All Changes
                  </Button>
                )}
              </div>
              {result.responses.map((resp, i) => {
                const typeStyle = RESPONSE_TYPE_STYLES[resp.response_type] || RESPONSE_TYPE_STYLES.clarification;
                return (
                  <Card key={i}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm italic text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            &ldquo;{resp.reviewer_comment}&rdquo;
                          </p>
                        </div>
                        <Badge variant={typeStyle.variant} className="shrink-0">
                          {typeStyle.label}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Response:</p>
                        <p className="text-sm whitespace-pre-wrap">{resp.response}</p>
                      </div>
                      {resp.manuscript_change && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3">
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Suggested Manuscript Change:</p>
                          <p className="text-sm whitespace-pre-wrap">{resp.manuscript_change}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Summary of Changes */}
          {result.summary_of_changes && result.summary_of_changes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary of Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 list-disc list-inside">
                  {result.summary_of_changes.map((change, i) => (
                    <li key={i} className="text-sm">{change}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Copy Full Letter */}
          {result.response_letter && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleCopyLetter}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Full Response Letter"}
              </Button>
            </div>
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

// ── Write Manuscript Tab ────────────────────────────────────────────

interface ManuscriptWriterResult {
  title?: string;
  abstract?: string;
  sections?: { heading: string; content: string }[];
  citations?: { inline_marker: string; search_terms: string; context: string }[];
  word_count?: number;
  format_used?: string;
  suggestions?: string[];
  raw?: string;
}

const MANUSCRIPT_FORMATS = [
  { value: "imrad", label: "IMRAD" },
  { value: "case_report", label: "Case Report" },
  { value: "review", label: "Review Article" },
  { value: "essay", label: "Essay" },
  { value: "letter", label: "Letter to Editor" },
];

const BREVITY_OPTIONS = [
  { value: "brief", label: "Brief" },
  { value: "standard", label: "Standard" },
  { value: "comprehensive", label: "Comprehensive" },
];

function ManuscriptWriterTab() {
  const [input, setInput] = useState("");
  const [format, setFormat] = useState("imrad");
  const [citationsEnabled, setCitationsEnabled] = useState(true);
  const [citationStyle, setCitationStyle] = useState("apa");
  const [brevity, setBrevity] = useState("standard");
  const [voiceSample, setVoiceSample] = useState("");
  const [showVoice, setShowVoice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ManuscriptWriterResult | null>(null);
  const [phiWarnings, setPhiWarnings] = useState<string[]>([]);
  const [copiedSection, setCopiedSection] = useState<number | null>(null);
  const [aiChecking, setAiChecking] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [humanizing, setHumanizing] = useState(false);
  const [humanizedSections, setHumanizedSections] = useState<Record<number, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleGenerate() {
    if (!input.trim()) return;
    if (input.length > MAX_LENGTH) {
      toast.error("Text exceeds 50,000 character limit");
      return;
    }
    setLoading(true);
    setResult(null);
    setPhiWarnings([]);
    setAiScore(null);
    setHumanizedSections({});

    try {
      const phi = scanAndCensorPhi(input);
      if (phi.hasPhi) setPhiWarnings(phi.warnings);

      let censoredVoice: string | undefined;
      if (voiceSample.trim()) {
        const phiVoice = scanAndCensorPhi(voiceSample);
        censoredVoice = phiVoice.censoredText;
        // Merge voice token map
        Object.assign(phi.tokenMap, phiVoice.tokenMap);
        if (phiVoice.hasPhi) setPhiWarnings((prev) => [...prev, ...phiVoice.warnings]);
      }

      const res = await fetch("/api/analyze/manuscript-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: phi.censoredText,
          format,
          citationsEnabled,
          citationStyle,
          brevity,
          voiceSample: censoredVoice,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (handleCreditError(res.status, data)) return;
        toast.error(data.error || "Manuscript generation failed");
        return;
      }
      if (data.phi?.detected) setPhiWarnings(data.phi.warnings);
      const restored = deepReinject(data.result ?? data, phi.tokenMap);
      setResult(restored);
      if (data.savedId) saveTokenMap(data.savedId, phi.tokenMap);
      toast.success("Manuscript generated");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function buildFullText(): string {
    if (!result) return "";
    const parts: string[] = [];
    if (result.title) parts.push(result.title, "");
    if (result.abstract) parts.push("Abstract", "", result.abstract, "");
    if (result.sections) {
      for (const s of result.sections) {
        parts.push(s.heading, "", s.content, "");
      }
    }
    if (result.citations && result.citations.length > 0) {
      parts.push("Citations", "");
      for (const c of result.citations) {
        parts.push(`${c.inline_marker} ${c.search_terms} — ${c.context}`);
      }
    }
    return parts.join("\n");
  }

  function handleCopyAll() {
    navigator.clipboard.writeText(buildFullText());
    toast.success("Full manuscript copied to clipboard");
  }

  function handleCopySection(index: number, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedSection(index);
    setTimeout(() => setCopiedSection(null), 2000);
  }

  async function handleAiCheck() {
    const text = buildFullText();
    if (!text) return;
    setAiChecking(true);
    try {
      const res = await fetch("/api/analyze/ai-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (handleCreditError(res.status, data)) return;
        toast.error(data.error || "AI detection failed");
        return;
      }
      const score =
        data.result?.consensus_score ??
        data.result?.overall_ai_probability ??
        data.consensus_score ??
        data.overall_ai_probability ??
        null;
      if (score !== null) {
        setAiScore(Math.round(Number(score)));
      } else {
        toast.error("Could not determine AI score");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setAiChecking(false);
    }
  }

  async function handleHumanizeAll() {
    if (!result?.sections) return;
    setHumanizing(true);
    try {
      const newHumanized: Record<number, string> = {};
      for (let i = 0; i < result.sections.length; i++) {
        const section = result.sections[i];
        const res = await fetch("/api/analyze/de-ai-ify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: section.content,
            writingStyle: "manuscript",
            voiceSample: voiceSample.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          newHumanized[i] = data.result?.rewritten_text ?? data.result?.text ?? data.rewritten_text ?? section.content;
        } else if (handleCreditError(res.status, data)) {
          return;
        }
      }
      setHumanizedSections(newHumanized);
      toast.success("All sections humanized");
    } catch {
      toast.error("Humanization failed. Please try again.");
    } finally {
      setHumanizing(false);
    }
  }

  return (
    <div className="space-y-6">
      <SuccessFlash show={showSuccess} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Write a Manuscript</CardTitle>
          <CardDescription>
            Provide your notes, bullet points, data, or rough paragraphs and we&apos;ll generate a structured academic manuscript.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your notes, bullet points, data, outlines, or rough paragraphs here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[250px]"
          />

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Format:</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANUSCRIPT_FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={citationsEnabled}
                onChange={(e) => setCitationsEnabled(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              Citations
            </label>

            {citationsEnabled && (
              <div className="flex items-center gap-1.5">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Style:</label>
                <Select value={citationStyle} onValueChange={setCitationStyle}>
                  <SelectTrigger className="w-40">
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
            )}

            <div className="flex items-center gap-1.5">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Brevity:</label>
              <Select value={brevity} onValueChange={setBrevity}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BREVITY_OPTIONS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Voice calibration */}
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
              <Textarea
                placeholder="Paste 2-3 paragraphs of YOUR writing here. We'll analyze your sentence rhythm, word choices, and quirks to make the manuscript sound like you..."
                value={voiceSample}
                onChange={(e) => setVoiceSample(e.target.value)}
                className="min-h-[100px] text-sm"
              />
            )}
          </div>

          {/* Bottom row: counts, upload, generate */}
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
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleGenerate} disabled={loading || !input.trim() || input.length > MAX_LENGTH}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <PenTool className="h-4 w-4" />
                    Generate Manuscript
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {phiWarnings.length > 0 && <PhiWarning warnings={phiWarnings} />}

      {result && !result.raw && (
        <div className="space-y-4 border-t-2 border-emerald-500">
          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleCopyAll}>
              <Copy className="h-4 w-4" />
              Copy Full Manuscript
            </Button>
            <Button variant="outline" size="sm" onClick={handleAiCheck} disabled={aiChecking}>
              {aiChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
              {aiScore !== null ? `AI Score: ${aiScore}%` : "Check AI Score"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleHumanizeAll} disabled={humanizing}>
              {humanizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Humanize All
            </Button>
            {result.word_count && (
              <Badge variant="secondary">{result.word_count.toLocaleString()} words</Badge>
            )}
            {result.format_used && (
              <Badge variant="outline">{result.format_used}</Badge>
            )}
          </div>

          {/* Title */}
          {result.title && (
            <h2 className="text-xl font-bold tracking-tight">{result.title}</h2>
          )}

          {/* Abstract */}
          {result.abstract && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Abstract</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{result.abstract}</p>
              </CardContent>
            </Card>
          )}

          {/* Sections */}
          {result.sections && result.sections.map((section, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{section.heading}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleCopySection(i, humanizedSections[i] ?? section.content)}
                  >
                    {copiedSection === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedSection === i ? "Copied" : "Copy"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {humanizedSections[i] ? (
                  <div className="space-y-3">
                    <p className="text-sm whitespace-pre-wrap">{humanizedSections[i]}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setHumanizedSections((prev) => {
                          const next = { ...prev };
                          delete next[i];
                          return next;
                        });
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                    >
                      Show Original
                    </button>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{section.content}</p>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Citations */}
          {result.citations && result.citations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Citations ({result.citations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.citations.map((cit, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                      <Badge variant="outline" className="shrink-0 mt-0.5">{cit.inline_marker}</Badge>
                      <div>
                        <p className="text-sm font-medium">{cit.search_terms}</p>
                        <p className="text-xs text-muted-foreground">{cit.context}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 list-disc list-inside">
                  {result.suggestions.map((suggestion, i) => (
                    <li key={i} className="text-sm">{suggestion}</li>
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
