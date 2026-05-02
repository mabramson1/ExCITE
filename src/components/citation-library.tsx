"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookmarkPlus, Trash2, Copy, Search, Tag, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface CitationEntry {
  id: string;
  pmid: string | null;
  doi: string | null;
  title: string;
  authors: string;
  journal: string | null;
  year: string | null;
  tags: string[] | null;
  notes: string | null;
  createdAt: string;
}

interface CitationLibraryProps {
  onInsert?: (citation: {
    title: string;
    authors: string;
    journal: string | null;
    year: string | null;
    pmid: string | null;
    doi: string | null;
  }) => void;
}

export function CitationLibrary({ onInsert }: CitationLibraryProps) {
  const [citations, setCitations] = useState<CitationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchCitations = useCallback(async () => {
    try {
      const url = search
        ? `/api/citation-library?search=${encodeURIComponent(search)}`
        : "/api/citation-library";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCitations(data.citations || []);
      }
    } catch {
      // silently fail on network errors
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      fetchCitations();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchCitations]);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/citation-library/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCitations((prev) => prev.filter((c) => c.id !== id));
        toast.success("Citation removed from library");
      } else {
        toast.error("Failed to delete citation");
      }
    } catch {
      toast.error("Network error");
    }
    setDeleteConfirm(null);
  }

  async function handleSaveTags(id: string) {
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/citation-library/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: tags.length > 0 ? tags : null }),
      });
      if (res.ok) {
        const data = await res.json();
        setCitations((prev) =>
          prev.map((c) => (c.id === id ? data.citation : c))
        );
        toast.success("Tags updated");
      } else {
        toast.error("Failed to update tags");
      }
    } catch {
      toast.error("Network error");
    }
    setEditingTags(null);
  }

  async function handleSaveNotes(id: string) {
    try {
      const res = await fetch(`/api/citation-library/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesInput.trim() || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setCitations((prev) =>
          prev.map((c) => (c.id === id ? data.citation : c))
        );
        toast.success("Notes updated");
      } else {
        toast.error("Failed to update notes");
      }
    } catch {
      toast.error("Network error");
    }
    setEditingNotes(null);
  }

  function handleCopyCitation(c: CitationEntry) {
    const parts = [c.authors];
    if (c.year) parts.push(`(${c.year})`);
    parts.push(c.title);
    if (c.journal) parts.push(c.journal);
    if (c.pmid) parts.push(`PMID: ${c.pmid}`);
    if (c.doi) parts.push(`DOI: ${c.doi}`);
    navigator.clipboard.writeText(parts.join(". ") + ".");
    toast.success("Citation copied to clipboard");
  }

  function toggleNotes(id: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        Loading your citation library...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title, authors, or tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Citation list */}
      {citations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookmarkPlus className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search
                ? "No citations match your search."
                : "No saved citations yet. Save citations from the Manuscript Citations tool."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {citations.length} citation{citations.length !== 1 ? "s" : ""} in library
          </p>
          {citations.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-4 pb-3 space-y-2">
                {/* Title + year */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.authors}
                    </p>
                    {(c.journal || c.year) && (
                      <p className="text-xs text-muted-foreground">
                        {c.journal}
                        {c.journal && c.year ? " " : ""}
                        {c.year ? `(${c.year})` : ""}
                      </p>
                    )}
                  </div>
                </div>

                {/* Badges row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {c.pmid && (
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${c.pmid}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge variant="success" className="text-[10px] cursor-pointer hover:opacity-80">
                        PMID: {c.pmid}
                      </Badge>
                    </a>
                  )}
                  {c.doi && (
                    <a
                      href={`https://doi.org/${c.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge variant="outline" className="text-[10px] cursor-pointer hover:opacity-80">
                        DOI
                        <ExternalLink className="h-2 w-2 ml-0.5" />
                      </Badge>
                    </a>
                  )}
                  {c.tags &&
                    c.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                </div>

                {/* Notes (collapsible) */}
                {(c.notes || editingNotes === c.id) && (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleNotes(c.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {expandedNotes.has(c.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      Notes
                    </button>
                    {expandedNotes.has(c.id) && (
                      <div className="mt-1">
                        {editingNotes === c.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={notesInput}
                              onChange={(e) => setNotesInput(e.target.value)}
                              placeholder="Add notes..."
                              className="text-xs h-7"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveNotes(c.id);
                                if (e.key === "Escape") setEditingNotes(null);
                              }}
                              autoFocus
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleSaveNotes(c.id)}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <p
                            className="text-xs text-muted-foreground bg-muted/50 p-2 rounded cursor-pointer hover:bg-muted"
                            onClick={() => {
                              setEditingNotes(c.id);
                              setNotesInput(c.notes || "");
                            }}
                          >
                            {c.notes || "Click to add notes..."}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions row */}
                <div className="flex items-center gap-1.5 pt-1">
                  {/* Tag editing */}
                  {editingTags === c.id ? (
                    <div className="flex gap-1.5 flex-1">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="tag1, tag2, tag3"
                        className="text-xs h-7 flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTags(c.id);
                          if (e.key === "Escape") setEditingTags(null);
                        }}
                        autoFocus
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleSaveTags(c.id)}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setEditingTags(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setEditingTags(c.id);
                          setTagInput((c.tags || []).join(", "));
                        }}
                      >
                        <Tag className="h-3 w-3" />
                        Tags
                      </Button>
                      {!c.notes && !editingNotes && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setEditingNotes(c.id);
                            setNotesInput("");
                            setExpandedNotes((prev) => new Set(prev).add(c.id));
                          }}
                        >
                          Notes
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleCopyCitation(c)}
                      >
                        <Copy className="h-3 w-3" />
                        Copy Citation
                      </Button>
                      {onInsert && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                          onClick={() =>
                            onInsert({
                              title: c.title,
                              authors: c.authors,
                              journal: c.journal,
                              year: c.year,
                              pmid: c.pmid,
                              doi: c.doi,
                            })
                          }
                        >
                          Insert
                        </Button>
                      )}
                      <div className="flex-1" />
                      {deleteConfirm === c.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-destructive">Delete?</span>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleDelete(c.id)}
                          >
                            Yes
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive/70 hover:text-destructive"
                          onClick={() => setDeleteConfirm(c.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
