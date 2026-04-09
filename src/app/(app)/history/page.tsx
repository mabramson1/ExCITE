"use client";

import { FileText, BookOpen, Wand2, ScanSearch, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  clinical_note: { icon: FileText, label: "Clinical Note", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
  manuscript: { icon: BookOpen, label: "Manuscript", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
  deai: { icon: Wand2, label: "De-AI-ifier", color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40" },
  ai_detector: { icon: ScanSearch, label: "AI Detector", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
};

export default function HistoryPage() {
  // History will be populated once database is connected
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground text-sm">
          View your past analyses and citations
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg mb-1">No history yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Your analysis history will appear here once you start using the tools.
              Connect a database to enable persistent history.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Template for future history items */}
      <div className="hidden">
        {Object.entries(typeConfig).map(([key, config]) => (
          <Card key={key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${config.color}`}>
                    <config.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Analysis Title</CardTitle>
                    <CardDescription className="text-xs">Date</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">{config.label}</Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
