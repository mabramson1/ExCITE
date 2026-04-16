"use client";

import { useState, useEffect } from "react";
import { Star, Share2, Link2, Check, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultActionsProps {
  savedId: string | null | undefined;
}

export function ResultActions({ savedId }: ResultActionsProps) {
  const [favorite, setFavorite] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [loading, setLoading] = useState<"favorite" | "share" | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch initial state when savedId becomes available
  useEffect(() => {
    if (!savedId) return;
    let cancelled = false;
    fetch(`/api/history/${savedId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled || !data?.project) return;
        setFavorite(data.project.favorite || false);
        setShareId(data.project.shareId || null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [savedId]);

  if (!savedId) return null;

  async function toggleFavorite() {
    setLoading("favorite");
    try {
      const res = await fetch(`/api/history/${savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_favorite" }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavorite(data.project.favorite);
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleShare() {
    setLoading("share");
    try {
      // If already shared, just copy the existing link
      if (shareId) {
        const url = `${window.location.origin}/share/${shareId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      const res = await fetch(`/api/history/${savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "share" }),
      });
      if (res.ok) {
        const data = await res.json();
        const sid = data.project.shareId;
        setShareId(sid);
        const url = `${window.location.origin}/share/${sid}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleFavorite}
        disabled={loading === "favorite"}
        title={favorite ? "Remove from favorites" : "Add to favorites"}
      >
        {loading === "favorite" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Star className={`h-3.5 w-3.5 ${favorite ? "fill-amber-400 text-amber-400" : ""}`} />
        )}
        {favorite ? "Favorited" : "Favorite"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        disabled={loading === "share"}
        title={shareId ? "Copy share link" : "Create share link"}
      >
        {loading === "share" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : shareId ? (
          <Link2 className="h-3.5 w-3.5" />
        ) : (
          <Share2 className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied!" : shareId ? "Copy Link" : "Share"}
      </Button>
      <a href="/history">
        <Button variant="ghost" size="sm" title="View in History">
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </a>
    </div>
  );
}
