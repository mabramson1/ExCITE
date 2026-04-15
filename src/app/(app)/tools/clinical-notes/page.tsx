"use client";

import { useState } from "react";
import { FileText, Loader2, Copy, Check, Download, BookOpen, ExternalLink, AlertTriangle, CheckCircle2, XCircle, Activity, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhiWarning } from "@/components/phi-warning";

// ── Shared Types ───────────────────────────────────────────────────

interface CodeSuggestion {
  code: string;
  description: string;
  confidence: string;
  supporting_text?: string;
  specificity_alert?: {
    issue: string;
    specific_alternatives: {
      code: string;
      description: string;
      documentation_needed: string;
    }[];
  } | null;
}

interface MdmElement {
  level: string;
  detail: string;
}

interface EmLevel {
  code: string;
  description: string;
  patient_type?: string;
  method?: string;
  mdm_complexity: string;
  mdm_elements?: {
    problems: MdmElement;
    data: MdmElement;
    risk: MdmElement;
  };
  time_based?: {
    documented_time: string | null;
    time_based_code: string | null;
    activities: string | null;
  };
  rationale: string;
  could_support_higher?: string | null;
  documentation_gaps?: string[];
  // legacy fields
  problems?: string;
  data?: string;
  risk?: string;
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
  pubmed_verified?: boolean;
  verification_confidence?: string;
  pubmed_match?: {
    pmid: string;
    title: string;
    authors: string;
    journal: string;
    year: string;
    doi: string | null;
  };
  pubmed_alternatives?: {
    pmid: string;
    title: string;
    authors: string;
    journal: string;
    year: string;
    doi: string | null;
  }[];
}

interface AnalysisResult {
  em_level?: EmLevel;
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

// ── A/P Writer Types ───────────────────────────────────────────────

interface ApProblem {
  number: number;
  diagnosis: string;
  icd10_suggestion?: string;
  status: string;
  severity: string;
  assessment: string;
  plan: string;
  data_referenced?: string;
  risk_factors?: string;
}

interface ApResult {
  assessment_and_plan?: string;
  problems?: ApProblem[];
  supported_em_level?: {
    code: string;
    mdm_complexity: string;
    rationale: string;
    problems_level: string;
    data_level: string;
    risk_level: string;
  };
  documentation_tips?: string[];
  clarification_needed?: string[];
  disclaimer?: string;
  raw?: string;
}

const ENCOUNTER_TYPES = [
  { value: "established_office", label: "Established Patient - Office Visit" },
  { value: "new_office", label: "New Patient - Office Visit" },
  { value: "initial_hospital", label: "Initial Hospital Inpatient" },
  { value: "subsequent_hospital", label: "Subsequent Hospital Inpatient" },
  { value: "observation", label: "Observation" },
  { value: "ed", label: "Emergency Department" },
  { value: "consultation", label: "Consultation" },
  { value: "telehealth", label: "Telehealth Visit" },
];

// ── Main Component ─────────────────────────────────────────────────

export default function ClinicalNotesPage() {
  const [activeTab, setActiveTab] = useState("analyze");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clinical Documentation</h1>
          <p className="text-sm text-muted-foreground">
            Analyze notes for coding or generate A/P from a skeleton
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Analyze Note
          </TabsTrigger>
          <TabsTrigger value="ap-writer" className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Write A/P
          </TabsTrigger>
        </TabsList>
        <TabsContent value="analyze">
          <AnalyzeTab />
        </TabsContent>
        <TabsContent value="ap-writer">
          <ApWriterTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Analyze Tab ────────────────────────────────────────────────────

function AnalyzeTab() {
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
      if (data.phi?.detected) setPhiWarnings(data.phi.warnings);
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

  const levelColor = (level: string) => {
    switch (level) {
      case "high": case "extensive": return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300";
      case "moderate": return "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300";
      case "low": case "limited": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300";
      default: return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300";
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paste Your Clinical Note</CardTitle>
          <CardDescription>
            PHI will be automatically detected and redacted. We&apos;ll analyze per 2024-2025 E&M guidelines.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your clinical note here...&#10;&#10;Example: CC: Follow-up for HTN and DM2.&#10;HPI: 62yo M with uncontrolled HTN and DM2, presents for medication adjustment. BP at home 150-160/90. A1c last month was 8.2%. Currently on lisinopril 20mg daily and metformin 1000mg BID..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[200px]"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{input.length} characters</p>
            <Button onClick={handleAnalyze} disabled={loading || !input.trim()}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
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
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
          </div>

          {result.summary && (
            <Card><CardContent className="pt-6"><p className="text-sm">{result.summary}</p></CardContent></Card>
          )}

          {/* E/M Level — 2024-2025 Guidelines */}
          {result.em_level && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  E&M Level (2024-2025 Guidelines)
                </CardTitle>
                <CardDescription>
                  {result.em_level.method === "both"
                    ? "Determined by both MDM and Time"
                    : result.em_level.method === "time"
                    ? "Determined by Total Time"
                    : "Determined by Medical Decision Making (highest 2 of 3 elements)"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <code className="text-xl font-mono font-bold text-primary">{result.em_level.code}</code>
                  <span className="text-sm">{result.em_level.description}</span>
                  {result.em_level.patient_type && (
                    <Badge variant="outline">{result.em_level.patient_type === "new" ? "New Patient" : "Established Patient"}</Badge>
                  )}
                  <Badge className={`${levelColor(result.em_level.mdm_complexity)} border-0`}>
                    MDM: {result.em_level.mdm_complexity}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">{result.em_level.rationale}</p>

                {/* MDM Elements Grid */}
                {result.em_level.mdm_elements && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">MDM Elements (2 of 3 determine level)</p>
                    <div className="grid gap-3">
                      {(["problems", "data", "risk"] as const).map((key) => {
                        const el = result.em_level!.mdm_elements![key];
                        const labels: Record<string, string> = { problems: "Problems Addressed", data: "Data Reviewed/Ordered", risk: "Risk of Complications" };
                        return (
                          <div key={key} className="p-3 rounded-lg bg-muted/50 flex items-start gap-3">
                            <Badge className={`${levelColor(el.level)} border-0 shrink-0 mt-0.5`}>{el.level}</Badge>
                            <div>
                              <p className="text-xs font-medium">{labels[key]}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{el.detail}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Time-Based */}
                {result.em_level.time_based?.documented_time && (
                  <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Time-Based Alternative</p>
                    <p className="text-sm mt-1">
                      {result.em_level.time_based.documented_time} minutes documented
                      {result.em_level.time_based.time_based_code && (
                        <> → supports <code className="font-mono font-bold">{result.em_level.time_based.time_based_code}</code></>
                      )}
                    </p>
                    {result.em_level.time_based.activities && (
                      <p className="text-xs text-muted-foreground mt-1">{result.em_level.time_based.activities}</p>
                    )}
                  </div>
                )}

                {/* Could support higher */}
                {result.em_level.could_support_higher && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Could support a higher level
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{result.em_level.could_support_higher}</p>
                  </div>
                )}

                {result.em_level.documentation_gaps && result.em_level.documentation_gaps.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Documentation Gaps:</p>
                    {result.em_level.documentation_gaps.map((gap, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" /> {gap}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ICD-10 Codes */}
          {result.icd10_codes && result.icd10_codes.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">ICD-10 Diagnosis Codes</CardTitle></CardHeader>
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
                        <p className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-2">&ldquo;{code.supporting_text}&rdquo;</p>
                      )}
                      {code.specificity_alert && (
                        <div className="mt-2 p-2 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Specificity: {code.specificity_alert.issue}
                          </p>
                          {code.specificity_alert.specific_alternatives.map((alt, j) => (
                            <div key={j} className="mt-1.5 pl-4">
                              <p className="text-xs"><code className="font-mono font-bold">{alt.code}</code> — {alt.description}</p>
                              <p className="text-xs text-muted-foreground">Document: {alt.documentation_needed}</p>
                            </div>
                          ))}
                        </div>
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
              <CardHeader><CardTitle className="text-base">CPT Procedure Codes</CardTitle></CardHeader>
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
                        <p className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-2">&ldquo;{code.supporting_text}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documentation Suggestions & Missing Elements */}
          {((result.documentation_suggestions && result.documentation_suggestions.length > 0) ||
            (result.missing_elements && result.missing_elements.length > 0)) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Documentation Improvements</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {result.documentation_suggestions?.map((s, i) => (
                  <p key={`s-${i}`} className="text-sm flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> {s}
                  </p>
                ))}
                {result.missing_elements?.map((m, i) => (
                  <p key={`m-${i}`} className="text-sm flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive mt-1.5 shrink-0" /> {m}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {/* References */}
          {result.references && result.references.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Coding References</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.references.map((ref, i) => (
                    <div key={i} className="p-2 rounded bg-muted/50">
                      <p className="text-sm font-medium">{ref.title}</p>
                      <p className="text-xs text-muted-foreground">{ref.source} — {ref.relevance}</p>
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
                  <BookOpen className="h-4 w-4" /> Publications ({result.publication_citations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.publication_citations.map((pub, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{pub.pubmed_match?.title || pub.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {pub.pubmed_match?.authors || pub.authors}
                          {(pub.pubmed_match?.journal || pub.journal) && ` - ${pub.pubmed_match?.journal || pub.journal}`}
                          {(pub.pubmed_match?.year || pub.year) && ` (${pub.pubmed_match?.year || pub.year})`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {pub.type && <Badge variant="outline" className="text-[10px]">{pub.type.replace(/_/g, " ")}</Badge>}
                        {pub.pubmed_verified === true ? (
                          <Badge variant="success" className="text-[10px] flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" />Verified</Badge>
                        ) : pub.pubmed_verified === false && pub.verification_confidence === "partial" ? (
                          <Badge variant="warning" className="text-[10px]">Partial</Badge>
                        ) : pub.pubmed_verified === false ? (
                          <Badge variant="destructive" className="text-[10px] flex items-center gap-0.5"><XCircle className="h-2.5 w-2.5" />Not Found</Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px]">VERIFY</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{pub.relevance}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {(pub.pubmed_match?.pmid || pub.pmid) && (
                        <a href={`https://pubmed.ncbi.nlm.nih.gov/${pub.pubmed_match?.pmid || pub.pmid}/`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" /> PubMed: {pub.pubmed_match?.pmid || pub.pmid}
                        </a>
                      )}
                      {(pub.pubmed_match?.doi || pub.doi) && (
                        <a href={`https://doi.org/${pub.pubmed_match?.doi || pub.doi}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" /> DOI
                        </a>
                      )}
                      {pub.search_terms && (
                        <a href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(pub.search_terms)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" /> Search PubMed
                        </a>
                      )}
                    </div>
                    {pub.pubmed_alternatives && pub.pubmed_alternatives.length > 0 && (
                      <div className="mt-2 pt-2 border-t space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Related PubMed articles:</p>
                        {pub.pubmed_alternatives.map((alt, j) => (
                          <div key={j} className="pl-3 border-l-2 border-emerald-300 dark:border-emerald-700">
                            <p className="text-xs font-medium">{alt.title}</p>
                            <a href={`https://pubmed.ncbi.nlm.nih.gov/${alt.pmid}/`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                              PMID: {alt.pmid}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {result.disclaimer && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 italic">{result.disclaimer}</p>
          )}
        </div>
      )}

      {result?.raw && (
        <Card><CardContent className="pt-6"><pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto">{result.raw}</pre></CardContent></Card>
      )}
    </div>
  );
}

// ── A/P Writer Tab ─────────────────────────────────────────────────

function ApWriterTab() {
  const [skeleton, setSkeleton] = useState("");
  const [encounterType, setEncounterType] = useState("established_office");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApResult | null>(null);
  const [phiWarnings, setPhiWarnings] = useState<string[]>([]);
  const [copiedAp, setCopiedAp] = useState(false);

  async function handleGenerate() {
    if (!skeleton.trim()) return;
    setLoading(true);
    setResult(null);
    setPhiWarnings([]);

    try {
      const res = await fetch("/api/analyze/ap-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skeleton, encounterType }),
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

  function copyAp() {
    if (result?.assessment_and_plan) {
      navigator.clipboard.writeText(result.assessment_and_plan);
      setCopiedAp(true);
      setTimeout(() => setCopiedAp(false), 2000);
    }
  }

  const levelColor = (level: string) => {
    switch (level) {
      case "high": case "extensive": return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300";
      case "moderate": return "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300";
      case "low": case "limited": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300";
      default: return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300";
    }
  };

  const severityColor = (s: string) => {
    switch (s) {
      case "critical": case "severe": return "destructive" as const;
      case "moderate": return "warning" as const;
      default: return "secondary" as const;
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case "worsening": case "exacerbation": return "text-red-500";
      case "improving": return "text-green-500";
      case "stable": case "chronic": return "text-blue-500";
      default: return "text-amber-500";
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PenTool className="h-4 w-4" /> A/P Writer
          </CardTitle>
          <CardDescription>
            Provide a skeleton outline and we&apos;ll generate a robust Assessment &amp; Plan that reflects disease severity, clinical complexity, and appropriate E&M documentation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={"Enter your skeleton here. Include:\n\n• Diagnoses (e.g., HTN uncontrolled, DM2 with A1c 8.2%)\n• Key findings (vitals, exam, labs)\n• Current medications\n• What you're planning (med changes, orders, referrals)\n• Any relevant history or complications\n\nExample:\n62M, established patient\nDx: HTN uncontrolled (BP 158/94), DM2 (A1c 8.2%), CKD stage 3a (GFR 52)\nMeds: lisinopril 20mg, metformin 1000 BID, atorvastatin 40mg\nLabs: BMP shows Cr 1.4, K 4.8, A1c 8.2%, lipid panel LDL 118\nPlan: increase lisinopril to 40mg, add empagliflozin 10mg, recheck labs 3 months\nDiscussed diet, exercise, medication adherence"}
            value={skeleton}
            onChange={(e) => setSkeleton(e.target.value)}
            className="min-h-[250px]"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Encounter:</label>
              <Select value={encounterType} onValueChange={setEncounterType}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENCOUNTER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={loading || !skeleton.trim()}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><PenTool className="h-4 w-4" /> Generate A/P</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {phiWarnings.length > 0 && <PhiWarning warnings={phiWarnings} />}

      {result && !result.raw && (
        <div className="space-y-4">
          {/* Clarification Needed */}
          {result.clarification_needed && result.clarification_needed.length > 0 && (
            <Card className="border-amber-300 dark:border-amber-700">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" /> Clarification Needed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.clarification_needed.map((c, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" /> {c}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Generated A/P */}
          {result.assessment_and_plan && (
            <Card className="border-primary/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Generated Assessment & Plan</CardTitle>
                  <Button variant="outline" size="sm" onClick={copyAp}>
                    {copiedAp ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedAp ? "Copied" : "Copy A/P"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 rounded-lg p-4 border">
                  {result.assessment_and_plan}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Problem Breakdown */}
          {result.problems && result.problems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Problem Breakdown ({result.problems.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.problems.map((p) => (
                  <div key={p.number} className="p-4 rounded-lg border bg-muted/30 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-primary">#{p.number}</span>
                        <div>
                          <p className="text-sm font-medium">{p.diagnosis}</p>
                          {p.icd10_suggestion && (
                            <code className="text-xs font-mono text-muted-foreground">{p.icd10_suggestion}</code>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={severityColor(p.severity)}>{p.severity}</Badge>
                        <Badge variant="outline" className={statusIcon(p.status)}>{p.status}</Badge>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="font-medium mb-0.5">Assessment</p>
                        <p className="text-muted-foreground">{p.assessment}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="font-medium mb-0.5">Plan</p>
                        <p className="text-muted-foreground">{p.plan}</p>
                      </div>
                    </div>
                    {(p.data_referenced || p.risk_factors) && (
                      <div className="grid md:grid-cols-2 gap-2 text-xs">
                        {p.data_referenced && (
                          <div className="p-2 rounded bg-blue-50/50 dark:bg-blue-950/20">
                            <p className="font-medium mb-0.5 text-blue-700 dark:text-blue-300">Data Referenced</p>
                            <p className="text-muted-foreground">{p.data_referenced}</p>
                          </div>
                        )}
                        {p.risk_factors && (
                          <div className="p-2 rounded bg-red-50/50 dark:bg-red-950/20">
                            <p className="font-medium mb-0.5 text-red-700 dark:text-red-300">Risk Factors</p>
                            <p className="text-muted-foreground">{p.risk_factors}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Supported E/M Level */}
          {result.supported_em_level && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Supported E&M Level
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <code className="text-xl font-mono font-bold text-primary">{result.supported_em_level.code}</code>
                  <Badge className={`${levelColor(result.supported_em_level.mdm_complexity)} border-0`}>
                    MDM: {result.supported_em_level.mdm_complexity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{result.supported_em_level.rationale}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded bg-muted/50 text-center">
                    <Badge className={`${levelColor(result.supported_em_level.problems_level)} border-0 mb-1`}>
                      {result.supported_em_level.problems_level}
                    </Badge>
                    <p className="text-xs text-muted-foreground">Problems</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50 text-center">
                    <Badge className={`${levelColor(result.supported_em_level.data_level)} border-0 mb-1`}>
                      {result.supported_em_level.data_level}
                    </Badge>
                    <p className="text-xs text-muted-foreground">Data</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50 text-center">
                    <Badge className={`${levelColor(result.supported_em_level.risk_level)} border-0 mb-1`}>
                      {result.supported_em_level.risk_level}
                    </Badge>
                    <p className="text-xs text-muted-foreground">Risk</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documentation Tips */}
          {result.documentation_tips && result.documentation_tips.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Documentation Tips</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.documentation_tips.map((tip, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.disclaimer && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 italic">{result.disclaimer}</p>
          )}
        </div>
      )}

      {result?.raw && (
        <Card><CardContent className="pt-6"><pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto">{result.raw}</pre></CardContent></Card>
      )}
    </div>
  );
}
