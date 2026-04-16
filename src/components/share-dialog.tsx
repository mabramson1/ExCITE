"use client";

import { useState, useEffect, useRef } from "react";
import {
  Share2,
  Link2,
  Check,
  Copy,
  Mail,
  QrCode,
  FileDown,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ShareDialogProps {
  shareId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

export function ShareDialog({
  shareId,
  open,
  onOpenChange,
  title,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"actions" | "qr">("actions");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setView("actions");
      setCopied(false);
    }
  }, [open]);

  const shareUrl =
    shareId && typeof window !== "undefined"
      ? `${window.location.origin}/share/${shareId}`
      : "";

  async function showQr() {
    if (!shareUrl) return;
    try {
      const url = await QRCode.toDataURL(shareUrl, {
        width: 320,
        margin: 2,
        color: { dark: "#0a0a0a", light: "#ffffff" },
      });
      setQrDataUrl(url);
      setView("qr");
    } catch {
      // Fallback: just show empty state
    }
  }

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 2200);
  }

  function emailShare() {
    if (!shareUrl) return;
    const subject = encodeURIComponent(
      title ? `exCITE — ${title}` : "exCITE Analysis — Shared with you"
    );
    const body = encodeURIComponent(
      `Here's an exCITE analysis shared with you:\n\n${shareUrl}\n\nThis is a read-only link to the results.`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  async function nativeShare() {
    if (!shareUrl) return;
    try {
      await navigator.share({
        title: title || "exCITE Analysis",
        text: "exCITE analysis shared with you",
        url: shareUrl,
      });
    } catch {
      // User cancelled — ignore
    }
  }

  function downloadPdf() {
    if (!shareUrl) return;
    window.open(`${shareUrl}?pdf=1`, "_blank", "noopener");
  }

  function openShare() {
    if (!shareUrl) return;
    window.open(shareUrl, "_blank", "noopener");
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `excite-share-${shareId}.png`;
    a.click();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            {view === "qr" ? "QR Code" : "Share Analysis"}
          </DialogTitle>
          <DialogDescription>
            {view === "qr"
              ? "Scan with any phone camera to open the shared analysis."
              : "Anyone with the link can view a read-only version of these results."}
          </DialogDescription>
        </DialogHeader>

        {!shareId ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Preparing share link…
          </div>
        ) : view === "qr" ? (
          <div className="space-y-3 pt-2">
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="QR code"
                className="rounded-lg border bg-white p-2 mx-auto"
                width={320}
                height={320}
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setView("actions")}>
                Back
              </Button>
              <Button onClick={downloadQr}>
                <FileDown className="h-4 w-4" />
                Save PNG
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {/* Share link display */}
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5">
              <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground truncate flex-1 font-mono">
                {shareUrl}
              </p>
            </div>

            {/* Copy toast banner (appears above buttons when copied) */}
            {copied && (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                <Check className="h-4 w-4" />
                Link copied to clipboard
              </div>
            )}

            {/* Primary: Copy */}
            <Button onClick={copyLink} className="w-full">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>

            {/* Secondary grid */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={showQr}>
                <QrCode className="h-4 w-4" />
                QR Code
              </Button>
              <Button variant="outline" onClick={emailShare}>
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button variant="outline" onClick={downloadPdf}>
                <FileDown className="h-4 w-4" />
                Download PDF
              </Button>
              {canNativeShare ? (
                <Button variant="outline" onClick={nativeShare}>
                  <Smartphone className="h-4 w-4" />
                  More…
                </Button>
              ) : (
                <Button variant="outline" onClick={openShare}>
                  <ExternalLink className="h-4 w-4" />
                  Open
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
