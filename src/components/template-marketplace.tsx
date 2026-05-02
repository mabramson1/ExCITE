"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Search, Loader2, Trash2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────

interface SharedTemplateItem {
  id: string;
  authorId: string;
  authorName: string;
  name: string;
  description: string | null;
  category: string;
  skeleton: string;
  starCount: number;
  starred: boolean;
  createdAt: string;
}

interface TemplateMarketplaceProps {
  onUseTemplate: (skeleton: string) => void;
  userId?: string;
}

// ── Categories ────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "general", label: "General" },
  { value: "cardiology", label: "Cardiology" },
  { value: "endocrine", label: "Endocrine" },
  { value: "pulmonology", label: "Pulmonology" },
  { value: "nephrology", label: "Nephrology" },
  { value: "neurology", label: "Neurology" },
  { value: "gastroenterology", label: "Gastroenterology" },
  { value: "rheumatology", label: "Rheumatology" },
  { value: "oncology", label: "Oncology" },
  { value: "psychiatry", label: "Psychiatry" },
  { value: "pediatrics", label: "Pediatrics" },
  { value: "surgery", label: "Surgery" },
  { value: "emergency", label: "Emergency" },
  { value: "primary-care", label: "Primary Care" },
  { value: "other", label: "Other" },
];

// ── Share Dialog ──────────────────────────────────────────────────────

function ShareForm({
  onShare,
  onCancel,
}: {
  onShare: (data: { name: string; description: string; category: string; skeleton: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [skeleton, setSkeleton] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !skeleton.trim()) {
      toast.error("Name and template text are required");
      return;
    }
    setSubmitting(true);
    onShare({ name: name.trim(), description: description.trim(), category, skeleton: skeleton.trim() });
    setSubmitting(false);
  }

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4 space-y-3">
        <p className="text-sm font-medium">Share a template with the community</p>
        <Input
          placeholder="Template name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-sm"
        />
        <Input
          placeholder="Short description (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="text-sm"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <textarea
          placeholder="Paste your A/P template skeleton here..."
          value={skeleton}
          onChange={(e) => setSkeleton(e.target.value)}
          className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
            Share
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export function TemplateMarketplace({ onUseTemplate, userId }: TemplateMarketplaceProps) {
  const [templates, setTemplates] = useState<SharedTemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"stars" | "recent">("stars");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showShareForm, setShowShareForm] = useState(false);
  const [starringIds, setStarringIds] = useState<Set<string>>(new Set());

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        sort,
      });
      if (search) params.set("search", search);
      if (category !== "all") params.set("category", category);
      if (userId) params.set("userId", userId);

      const res = await fetch(`/api/templates/shared?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTemplates(data.templates || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("Failed to load community templates");
    } finally {
      setLoading(false);
    }
  }, [page, sort, search, category, userId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function handleStar(templateId: string, currentlyStarred: boolean) {
    if (!userId) {
      toast.error("Sign in to star templates");
      return;
    }
    setStarringIds((prev) => new Set(prev).add(templateId));

    // Optimistic update
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === templateId
          ? {
              ...t,
              starred: !currentlyStarred,
              starCount: currentlyStarred ? t.starCount - 1 : t.starCount + 1,
            }
          : t
      )
    );

    try {
      const res = await fetch(`/api/templates/shared/${templateId}/star`, {
        method: currentlyStarred ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      // Revert on error
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId
            ? {
                ...t,
                starred: currentlyStarred,
                starCount: currentlyStarred ? t.starCount + 1 : t.starCount - 1,
              }
            : t
        )
      );
      toast.error("Failed to update star");
    } finally {
      setStarringIds((prev) => {
        const next = new Set(prev);
        next.delete(templateId);
        return next;
      });
    }
  }

  async function handleShare(data: { name: string; description: string; category: string; skeleton: string }) {
    try {
      const res = await fetch("/api/templates/shared", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to share");
      }
      toast.success("Template shared with the community!");
      setShowShareForm(false);
      setPage(1);
      setSort("recent");
      fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to share template");
    }
  }

  async function handleDelete(templateId: string) {
    try {
      const res = await fetch(`/api/templates/shared/${templateId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Template removed");
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch {
      toast.error("Failed to delete template");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Share2 className="h-4 w-4" />
          Community Templates
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setShowShareForm(!showShareForm)}
        >
          {showShareForm ? "Cancel" : "Share yours"}
        </Button>
      </div>

      {/* Share form */}
      {showShareForm && (
        <ShareForm
          onShare={handleShare}
          onCancel={() => setShowShareForm(false)}
        />
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(v) => {
            setSort(v as "stars" | "recent");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stars">Most starred</SelectItem>
            <SelectItem value="recent">Most recent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Template list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No community templates found. Be the first to share one!
        </p>
      ) : (
        <div className="grid gap-2">
          {templates.map((t) => (
            <Card key={t.id} className="group">
              <CardContent className="py-3 px-4 flex items-start gap-3">
                {/* Star button */}
                <button
                  onClick={() => handleStar(t.id, t.starred)}
                  disabled={starringIds.has(t.id)}
                  className="mt-0.5 shrink-0 text-muted-foreground hover:text-amber-500 transition-colors disabled:opacity-50"
                  title={t.starred ? "Unstar" : "Star"}
                >
                  <Star
                    className={`h-4 w-4 ${
                      t.starred ? "fill-amber-400 text-amber-400" : ""
                    }`}
                  />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {t.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5" /> {t.starCount}
                    </span>
                  </div>
                  {t.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {t.description}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    by {t.authorName}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {userId && t.authorId === userId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(t.id)}
                      title="Delete your template"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      onUseTemplate(t.skeleton);
                      toast.success(`Template "${t.name}" loaded`);
                    }}
                  >
                    Use
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
