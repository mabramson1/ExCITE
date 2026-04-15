import { db } from "@/lib/db";
import { project, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { FileText, BookOpen, Wand2, ScanSearch, User, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${config.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">{result.title}</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> Shared by {result.userName || "Anonymous"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {date}
              </span>
            </div>
          </div>
          <Badge variant="secondary">{config.label}</Badge>
          {result.citationStyle && (
            <Badge variant="outline">{result.citationStyle.toUpperCase()}</Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          This is a shared, read-only view of an exCITE analysis.
        </p>

        {/* Output */}
        {output ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-muted/30 rounded-lg p-4 overflow-auto max-h-[600px] leading-relaxed">
                {JSON.stringify(output, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center py-8">
                No output available for this analysis.
              </p>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Powered by <span className="font-semibold">exCITE</span>
        </p>
      </div>
    </div>
  );
}
