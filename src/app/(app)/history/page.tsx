"use client";

import { useState, useEffect } from "react";
import { FileText, BookOpen, Wand2, ScanSearch, Clock, Loader2, Trash2, Star, Share2, Link2, Check, ExternalLink } from "lucide-react";
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
  favorite: boolean;
  shareId?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string; href: string }> = {
  clinical_note: { icon: FileText, label: "Clinical Note", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40", href: "/tools/clinical-notes" },
  manuscript: { icon: BookOpen, label: "Manuscript", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40", href: "/tools/manuscript-citations" },
  deai: { icon: Wand2, label: "De-AI-ifier", color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40", href: "/tools/de-ai-ify" },
  ai_detector: { icon: ScanSearch, label: "AI Detector", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40", href: "/tools/ai-detector" },
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "favorites", label: "Favorites" },
  { value: "clinical_note", label: "Clinical Notes" },
  { value: "manuscript", label: "Manuscripts" },
  { value: "deai", label: "De-AI-ifier" },
  { value: "ai_detector", label: "AI Detector" },
];

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

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

  async function handleToggleFavorite(id: string) {
    try {
      const res = await fetch(`/api/history/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_favorite" }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, favorite: !item.favorite } : item
          )
        );
      }
    } catch {
      // Silently fail
    }
  }

  async function handleShare(id: string) {
    try {
      const res = await fetch(`/api/history/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "share" }),
      });
      if (res.ok) {
        const data = await res.json();
        const shareId = data.project.shareId;
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, shareId } : item
          )
        );
        // Copy share link to clipboard
        const shareUrl = `${window.location.origin}/share/${shareId}`;
        navigator.clipboard.writeText(shareUrl);
        setCopiedShareId(id);
        setTimeout(() => setCopiedShareId(null), 2000);
      }
    } catch {
      // Silently fail
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

  const filtered = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "favorites") return item.favorite;
    return item.type === filter;
  });

  const favoriteCount = items.filter((i) => i.favorite).length;

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
          {items.length} analysis{items.length !== 1 ? "es" : ""} saved
          {favoriteCount > 0 && ` · ${favoriteCount} favorited`}
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
                Your analysis history will appear here automatically when you use any tool.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!error && items.length > 0 && (
        <>
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.value)}
                className="h-8"
              >
                {f.value === "favorites" && <Star className="h-3 w-3 mr-1" />}
                {f.label}
                {f.value === "all" && <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">{items.length}</Badge>}
                {f.value === "favorites" && favoriteCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">{favoriteCount}</Badge>
                )}
              </Button>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No {filter === "favorites" ? "favorites" : "results"} found.
            </p>
          )}

          <div className="space-y-3">
            {filtered.map((item) => {
              const config = typeConfig[item.type] || typeConfig.clinical_note;
              const Icon = config.icon;
              return (
                <Card key={item.id} className="hover:border-primary/30 transition-colors">
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Favorite star */}
                        <button
                          onClick={() => handleToggleFavorite(item.id)}
                          className="shrink-0"
                        >
                          <Star
                            className={`h-4 w-4 transition-colors ${
                              item.favorite
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30 hover:text-amber-400"
                            }`}
                          />
                        </button>
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm truncate">{item.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="secondary" className="text-[10px]">{config.label}</Badge>
                        {item.citationStyle && (
                          <Badge variant="outline" className="text-[10px]">{item.citationStyle.toUpperCase()}</Badge>
                        )}
                        {item.shareId && (
                          <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">Shared</Badge>
                        )}
                        {/* Share button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleShare(item.id)}
                          title={item.shareId ? "Copy share link" : "Create share link"}
                        >
                          {copiedShareId === item.id ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : item.shareId ? (
                            <Link2 className="h-3 w-3" />
                          ) : (
                            <Share2 className="h-3 w-3" />
                          )}
                        </Button>
                        {/* Open in tool */}
                        <a href={config.href}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Open tool">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                          title="Delete"
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
        </>
      )}
    </div>
  );
}
