"use client";

import { useState } from "react";
import { FileText, Loader2, Copy, Check, Download, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PhiWarning } from "@/components/phi-warning";

interface CodeSuggestion {
  code: string;
  description: string;
  confidence: string;
  supporting_text?: string;
}

interface Reference {
  title: string;
  source: string;
  relevance: string;
}

interface PublicationCitation {
  condition: string;
  title: string;
  authors?: string;
  journal?: string;
  year?: string;
  pmid?: string | null;
  doi?: string | null;
  type?: string;
  relevance: string;
  verified?: boolean;
  search_terms?: string;
}

interface AnalysisResult {
  icd10_codes?: CodeSuggestion[];
  cpt_codes?: CodeSuggestion[];
  documentation_suggestions?: string[];
  missing_elements?: string[];
  references?: Reference[];
  publication_citations?: PublicationCitation[];
  summary?: string;
  disclaimer?: string;
  raw?: string;
}

export default function ClinicalNotesPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [phiWarnings, setPhiWarnings] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  async function handleAnalyze() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setPhiWarnings([]);

    try {
      const res = await fetch("/api/analyze/clinical-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();

      if (data.phi?.detected) {
        setPhiWarnings(data.phi.warnings);
      }
      setResult(data.result);
    } catch {
      setResult({ raw: "An error occurred. Please check your API key and try again." });
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clinical-note-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const confidenceColor = (c: string) => {
    switch (c) {
      case "high": return "success" as const;
      case "medium": return "warning" as const;
      case "low": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clinical Note Citation</h1>
          <p className="text-sm text-muted-foreground">
            Analyze clinical notes for ICD-10/CPT codes and documentation improvements
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paste Your Clinical Note</CardTitle>
          <CardDescription>
            PHI will be automatically detected and redacted before AI processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your clinical note here...&#10;&#10;Example: Patient presents with acute lower back pain radiating to the left leg. History of lumbar disc herniation. Physical exam reveals positive straight leg raise on the left at 40 degrees..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[200px]"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {input.length} characters
            </p>
            <Button onClick={handleAnalyze} disabled={loading || !input.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Note"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {phiWarnings.length > 0 && <PhiWarning warnings={phiWarnings} />}

      {result && !result.raw && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Analysis Results</h2>
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

          {/* ICD-10 Codes */}
          {result.icd10_codes && result.icd10_codes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ICD-10 Diagnosis Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.icd10_codes.map((code, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-1.5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <code className="text-sm font-mono font-bold text-primary">{code.code}</code>
                          <p className="text-sm mt-0.5">{code.description}</p>
                        </div>
                        <Badge variant={confidenceColor(code.confidence)}>{code.confidence}</Badge>
                      </div>
                      {code.supporting_text && (
                        <p className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-2">
                          &ldquo;{code.supporting_text}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CPT Codes */}
          {result.cpt_codes && result.cpt_codes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">CPT Procedure Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.cpt_codes.map((code, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-1.5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <code className="text-sm font-mono font-bold text-primary">{code.code}</code>
                          <p className="text-sm mt-0.5">{code.description}</p>
                        </div>
                        <Badge variant={confidenceColor(code.confidence)}>{code.confidence}</Badge>
                      </div>
                      {code.supporting_text && (
                        <p className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-2">
                          &ldquo;{code.supporting_text}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documentation Suggestions */}
          {result.documentation_suggestions && result.documentation_suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documentation Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.documentation_suggestions.map((s, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Missing Elements */}
          {result.missing_elements && result.missing_elements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Missing Elements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.missing_elements.map((m, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                      {m}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* References */}
          {result.references && result.references.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Citation References</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.references.map((ref, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium">{ref.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{ref.source}</p>
                      <p className="text-xs text-muted-foreground">{ref.relevance}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Publication Citations */}
          {result.publication_citations && result.publication_citations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Publication Citations ({result.publication_citations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.publication_citations.map((pub, i) => (
                  <div key={i} className="p-4 rounded-lg border bg-muted/30 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium">{pub.title}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          {pub.authors && <span>{pub.authors}</span>}
                          {pub.journal && <span>- {pub.journal}</span>}
                          {pub.year && <span>({pub.year})</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {pub.type && (
                          <Badge variant="outline" className="text-[10px]">
                            {pub.type.replace(/_/g, " ")}
                          </Badge>
                        )}
                        {pub.verified === false && (
                          <Badge variant="warning" className="text-[10px]">VERIFY</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Condition:</span> {pub.condition}
                    </p>
                    <p className="text-xs text-muted-foreground">{pub.relevance}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {pub.pmid && (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          PubMed: {pub.pmid}
                        </a>
                      )}
                      {pub.doi && (
                        <a
                          href={`https://doi.org/${pub.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          DOI
                        </a>
                      )}
                      {pub.search_terms && (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(pub.search_terms)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Search PubMed
                        </a>
                      )}
                    </div>
                  </div>
                ))}
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
          <CardHeader>
            <CardTitle className="text-base">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto">
              {result.raw}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
