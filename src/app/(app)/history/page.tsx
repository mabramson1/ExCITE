"use client";

import { useState, useEffect } from "react";
import { FileText, BookOpen, Wand2, ScanSearch, Clock, Loader2, Trash2, Star, Share2, Link2, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/share-dialog";
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
  const [shareDialogItem, setShareDialogItem] = useState<HistoryItem | null>(null);

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

  async function handleShare(item: HistoryItem) {
    let shareId = item.shareId ?? null;
    if (!shareId) {
      try {
        const res = await fetch(`/api/history/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "share" }),
        });
        if (res.ok) {
          const data = await res.json();
          shareId = data.project.shareId;
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, shareId } : i))
          );
        }
      } catch {
        return;
      }
    }
    setShareDialogItem({ ...item, shareId });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this analysis? This cannot be undone.")) return;
    try {
      await fetch(`/api/history/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  function exportCsv() {
    if (filtered.length === 0) return;
    const header = "Title,Type,Favorite,Created,Shared";
    const rows = filtered.map((item) => {
      const config = typeConfig[item.type] || typeConfig.clinical_note;
      const created = new Date(item.createdAt).toLocaleDateString();
      return [
        `"${item.title.replace(/"/g, '""')}"`,
        config.label,
        item.favorite ? "Yes" : "No",
        created,
        item.shareId ? "Yes" : "No",
      ].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `excite-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} items`);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">History</h1>
          <p className="text-muted-foreground text-sm">
            {items.length} analysis{items.length !== 1 ? "es" : ""} saved
            {favoriteCount > 0 && ` · ${favoriteCount} favorited`}
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        )}
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
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">{config.label}</Badge>
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
                          onClick={() => handleShare(item)}
                          title={item.shareId ? "Share options" : "Create share link"}
                        >
                          {item.shareId ? (
                            <Link2 className="h-3 w-3" />
                          ) : (
                            <Share2 className="h-3 w-3" />
                          )}
                        </Button>
                        {/* Open in tool with pre-filled input (editable) */}
                        <a href={`${config.href}?load=${item.id}`} title="Open in tool (editable)">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Open & edit in tool">
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

      <ShareDialog
        shareId={shareDialogItem?.shareId ?? null}
        open={!!shareDialogItem}
        onOpenChange={(open) => {
          if (!open) setShareDialogItem(null);
        }}
        title={shareDialogItem?.title}
      />
    </div>
  );
}
