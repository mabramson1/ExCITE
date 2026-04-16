"use client";

import { useState, useEffect } from "react";
import { Star, Share2, Link2, Check, Loader2, ExternalLink, Mail, Printer, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ResultActionsProps {
  savedId: string | null | undefined;
}

export function ResultActions({ savedId }: ResultActionsProps) {
  const [favorite, setFavorite] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [loading, setLoading] = useState<"favorite" | "share" | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);

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

  async function handleShareClick() {
    // Generate share link if not yet shared
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

  function getShareUrl() {
    return `${window.location.origin}/share/${shareId}`;
  }

  function copyLink() {
    if (!shareId) return;
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function emailShare() {
    if (!shareId) return;
    const url = getShareUrl();
    const subject = encodeURIComponent("exCITE Analysis — Shared with you");
    const body = encodeURIComponent(`Here's an analysis I ran on exCITE:\n\n${url}\n\nThis is a read-only link to the results.`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }

  function openSharePage() {
    if (!shareId) return;
    window.open(getShareUrl(), "_blank");
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
            <Star className={`h-3.5 w-3.5 ${favorite ? "fill-amber-400 text-amber-400" : ""}`} />
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

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share Analysis
            </DialogTitle>
            <DialogDescription>
              Anyone with the link can view a read-only version of these results.
            </DialogDescription>
          </DialogHeader>

          {shareId ? (
            <div className="space-y-3 pt-2">
              {/* Share link display */}
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5">
                <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground truncate flex-1 font-mono">
                  {getShareUrl()}
                </p>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="default"
                  onClick={copyLink}
                  className="w-full"
                >
                  {copied ? (
                    <><Check className="h-4 w-4 text-green-400" /> Link Copied!</>
                  ) : (
                    <><Copy className="h-4 w-4" /> Copy Link</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={emailShare}
                  className="w-full"
                >
                  <Mail className="h-4 w-4" /> Share via Email
                </Button>
                <Button
                  variant="outline"
                  onClick={openSharePage}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4" /> Open Share Page
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    openSharePage();
                    setTimeout(() => {
                      // The share page has a print button
                    }, 500);
                  }}
                  className="w-full"
                >
                  <Printer className="h-4 w-4" /> Open & Print as PDF
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Generating share link...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
