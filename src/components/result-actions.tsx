"use client";

import { useState, useEffect } from "react";
import { Star, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/share-dialog";

interface ResultActionsProps {
  savedId: string | null | undefined;
}

export function ResultActions({ savedId }: ResultActionsProps) {
  const [favorite, setFavorite] = useState(false);
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [shareId, setShareId] = useState<string | null>(null);
  const [loading, setLoading] = useState<"favorite" | "share" | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    if (!savedId) return;
    let cancelled = false;
    fetch(`/api/history/${savedId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.project) return;
        setFavorite(data.project.favorite || false);
        setShareId(data.project.shareId || null);
        setTitle(data.project.title);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
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

  async function handleShareClick() {
    if (!shareId) {
      setLoading("share");
      try {
        const res = await fetch(`/api/history/${savedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "share" }),
        });
        if (res.ok) {
          const data = await res.json();
          setShareId(data.project.shareId);
        }
      } finally {
        setLoading(null);
      }
    }
    setShowShareDialog(true);
  }

  return (
    <>
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
            <Star
              className={`h-3.5 w-3.5 ${
                favorite ? "fill-amber-400 text-amber-400" : ""
              }`}
            />
          )}
          {favorite ? "Favorited" : "Favorite"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShareClick}
          disabled={loading === "share"}
        >
          {loading === "share" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Share2 className="h-3.5 w-3.5" />
          )}
          Share
        </Button>
      </div>

      <ShareDialog
        shareId={shareId}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        title={title}
      />
    </>
  );
}
