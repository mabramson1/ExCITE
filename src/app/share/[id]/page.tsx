import type { Metadata } from "next";
import { db } from "@/lib/db";
import { project, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { FileText, BookOpen, Wand2, ScanSearch, User, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "./print-button";
import { PdfAutoDownload } from "./pdf-auto-download";
import { Suspense } from "react";

const typeLabels: Record<string, string> = {
  clinical_note: "Clinical Note Analysis",
  manuscript: "Manuscript Citations",
  deai: "De-AI-ifier",
  ai_detector: "AI Detection",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [result] = await db
    .select({ title: project.title, type: project.type })
    .from(project)
    .where(eq(project.shareId, id))
    .limit(1);

  if (!result) return { title: "Shared Analysis — exCITE" };

  const typeLabel = typeLabels[result.type] || "Analysis";
  return {
    title: `${result.title} — exCITE`,
    description: `${typeLabel} shared via exCITE — Citation Intelligence for Healthcare & Academia.`,
    openGraph: {
      title: `${result.title} — exCITE`,
      description: `${typeLabel} shared via exCITE.`,
      type: "article",
    },
  };
}

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  clinical_note: { icon: FileText, label: "Clinical Note Analysis", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
  manuscript: { icon: BookOpen, label: "Manuscript Citations", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
  deai: { icon: Wand2, label: "De-AI-ifier", color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40" },
  ai_detector: { icon: ScanSearch, label: "AI Detection", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
};

export default async function SharedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [result] = await db
    .select({
      title: project.title,
      type: project.type,
      inputText: project.inputText,
      outputText: project.outputText,
      citationStyle: project.citationStyle,
      createdAt: project.createdAt,
      userName: user.name,
    })
    .from(project)
    .leftJoin(user, eq(project.userId, user.id))
    .where(eq(project.shareId, id))
    .limit(1);

  if (!result) notFound();

  const config = typeConfig[result.type] || typeConfig.clinical_note;
  const Icon = config.icon;

  let output: Record<string, unknown> | null = null;
  try {
    output = result.outputText ? JSON.parse(result.outputText) : null;
  } catch {
    output = null;
  }

  const date = new Date(result.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <PdfAutoDownload title={result.title} />
      </Suspense>
      <div id="share-content" className="max-w-4xl mx-auto px-4 py-8 space-y-6 print:px-0 print:py-2">
        {/* Header */}
        <div className="flex items-center gap-3 print:gap-2">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center print:h-8 print:w-8 ${config.color}`}>
            <Icon className="h-5 w-5 print:h-4 print:w-4" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight print:text-lg">{result.title}</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> Shared by {result.userName || "Anonymous"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {date}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Badge variant="secondary">{config.label}</Badge>
            <PrintButton />
          </div>
        </div>

        {/* Formatted Output */}
        {output ? (
          <div className="space-y-4">
            {result.type === "clinical_note" && <ClinicalNoteOutput output={output} />}
            {result.type === "manuscript" && <ManuscriptOutput output={output} />}
            {result.type === "deai" && <DeAiOutput output={output} />}
            {result.type === "ai_detector" && <AiDetectorOutput output={output} />}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center py-8">
                No output available for this analysis.
              </p>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-center text-muted-foreground print:hidden">
          Powered by <span className="font-semibold">exCITE</span> — read-only shared view
        </p>
      </div>
    </div>
  );
}

// ── Clinical Note Output ───────────────────────────────────────────

function ClinicalNoteOutput({ output }: { output: Record<string, unknown> }) {
  const ap = output.assessment_and_plan as string | undefined;
  const emStatement = output.em_statement as string | undefined;
  const emLevel = output.em_level as Record<string, unknown> | undefined;
  const summary = output.summary as string | undefined;
  const icd10 = output.icd10_codes as Array<Record<string, unknown>> | undefined;
  const cpt = output.cpt_codes as Array<Record<string, unknown>> | undefined;
  const problems = output.problems as Array<Record<string, unknown>> | undefined;

  return (
    <>
      {summary && (
        <Card><CardContent className="pt-6"><p className="text-sm">{summary}</p></CardContent></Card>
      )}
      {ap && (
        <Card>
          <CardHeader><CardTitle className="text-base">Assessment & Plan</CardTitle></CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{ap}</div>
          </CardContent>
        </Card>
      )}
      {emStatement && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm leading-relaxed">{emStatement}</p>
          </CardContent>
        </Card>
      )}
      {emLevel && (
        <Card>
          <CardHeader><CardTitle className="text-base">E&M Level: {String(emLevel.code)}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{String(emLevel.rationale || "")}</p>
          </CardContent>
        </Card>
      )}
      {problems && problems.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Problems ({problems.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {problems.map((p, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-sm font-medium">#{String(p.number)} {String(p.diagnosis)}</p>
                {p.icd10_suggestion ? <code className="text-xs text-muted-foreground">{String(p.icd10_suggestion)}</code> : null}
                <p className="text-xs text-muted-foreground mt-1">{String(p.assessment || "")}</p>
                <p className="text-xs mt-1"><span className="font-medium">Plan:</span> {String(p.plan || "")}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {icd10 && icd10.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">ICD-10 Codes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {icd10.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <code className="text-sm font-mono font-bold text-primary">{String(c.code)}</code>
                <p className="text-sm">{String(c.description)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {cpt && cpt.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">CPT Codes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {cpt.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <code className="text-sm font-mono font-bold text-primary">{String(c.code)}</code>
                <p className="text-sm">{String(c.description)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}

// ── Manuscript Output ──────────────────────────────────────────────

function ManuscriptOutput({ output }: { output: Record<string, unknown> }) {
  const summary = output.summary as string | undefined;
  const claims = output.claims_needing_citations as Array<Record<string, unknown>> | undefined;
  const bibliography = output.bibliography as string[] | undefined;

  return (
    <>
      {summary && (
        <Card><CardContent className="pt-6"><p className="text-sm">{summary}</p></CardContent></Card>
      )}
      {claims && claims.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Claims Needing Citations ({claims.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {claims.map((claim, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-sm italic">&ldquo;{String(claim.text)}&rdquo;</p>
                {claim.why_citation_needed ? (
                  <p className="text-xs text-muted-foreground mt-1">{String(claim.why_citation_needed)}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {bibliography && bibliography.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Bibliography</CardTitle></CardHeader>
          <CardContent>
            <ol className="space-y-2 list-decimal list-inside">
              {bibliography.map((ref, i) => (
                <li key={i} className="text-sm pl-2">{ref}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// ── De-AI-ifier Output ─────────────────────────────────────────────

function DeAiOutput({ output }: { output: Record<string, unknown> }) {
  const rewritten = output.rewritten_text as string | undefined;
  const patterns = output.ai_patterns_found as string[] | undefined;
  const confidence = output.confidence_score as number | undefined;

  return (
    <>
      {confidence !== undefined && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Human-Sounding Confidence</span>
              <span className="text-sm font-bold text-primary">{Math.round(confidence * 100)}%</span>
            </div>
          </CardContent>
        </Card>
      )}
      {rewritten && (
        <Card>
          <CardHeader><CardTitle className="text-base">Humanized Text</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{rewritten}</p>
          </CardContent>
        </Card>
      )}
      {patterns && patterns.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">AI Patterns Detected</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {patterns.map((p, i) => (
                <Badge key={i} variant="outline">{p}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// ── AI Detector Output ─────────────────────────────────────────────

function AiDetectorOutput({ output }: { output: Record<string, unknown> }) {
  const probability = output.overall_ai_probability as number | undefined;
  const verdict = output.verdict as string | undefined;
  const reasoning = output.reasoning as string | undefined;
  const patterns = output.patterns_summary as string[] | undefined;
  const recommendations = output.recommendations as string[] | undefined;

  const verdictLabels: Record<string, string> = {
    likely_human: "Likely Human",
    possibly_ai: "Possibly AI",
    likely_ai: "Likely AI",
    definitely_ai: "Definitely AI",
  };

  return (
    <>
      {probability !== undefined && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{verdict ? verdictLabels[verdict] || verdict : "Analysis"}</span>
              <span className="text-2xl font-bold">{Math.round(probability * 100)}%</span>
            </div>
            {reasoning && <p className="text-sm text-muted-foreground">{reasoning}</p>}
          </CardContent>
        </Card>
      )}
      {patterns && patterns.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Detected Patterns</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {patterns.map((p, i) => (
                <Badge key={i} variant="outline">{p}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recommendations</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((r, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
