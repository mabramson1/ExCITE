"use client";

import { useState, useEffect } from "react";
import { FileText, BookOpen, Wand2, ScanSearch, Clock, Loader2, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface HistoryItem {
  id: string;
  title: string;
  type: string;
  citationStyle?: string;
  phiDetected: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string; href: string }> = {
  clinical_note: { icon: FileText, label: "Clinical Note", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40", href: "/tools/clinical-notes" },
  manuscript: { icon: BookOpen, label: "Manuscript", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40", href: "/tools/manuscript-citations" },
  deai: { icon: Wand2, label: "De-AI-ifier", color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40", href: "/tools/de-ai-ify" },
  ai_detector: { icon: ScanSearch, label: "AI Detector", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40", href: "/tools/ai-detector" },
};

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch("/api/history");
      if (!res.ok) {
        if (res.status === 401) {
          setError("Sign in to view your analysis history.");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setItems(data.projects || []);
    } catch {
      setError("Could not load history. Make sure the database is connected.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/history/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // Silently fail
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground text-sm">
          View your past analyses and citations
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!error && items.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-lg mb-1">No history yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Your analysis history will appear here once you start using the tools.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const config = typeConfig[item.type] || typeConfig.clinical_note;
            const Icon = config.icon;
            return (
              <Card key={item.id} className="hover:border-primary/30 transition-colors">
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{item.title}</CardTitle>
                        <CardDescription className="text-xs">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{config.label}</Badge>
                      {item.citationStyle && (
                        <Badge variant="outline" className="text-[10px]">{item.citationStyle.toUpperCase()}</Badge>
                      )}
                      {item.phiDetected && (
                        <Badge variant="warning" className="text-[10px]">PHI</Badge>
                      )}
                      <a href={config.href}>
                        <Button variant="ghost" size="sm" className="h-7">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
