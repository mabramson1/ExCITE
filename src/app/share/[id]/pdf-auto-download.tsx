"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * When the share page is opened with `?pdf=1`, this component snapshots the
 * `#share-content` container with html2canvas, wraps it into a multi-page PDF
 * via jsPDF, triggers a download, then closes the tab (if the browser allows
 * window.close on tabs it didn't open, it won't — that's fine, user can close
 * manually).
 */
export function PdfAutoDownload({ title }: { title: string }) {
  const searchParams = useSearchParams();
  const shouldDownload = searchParams.get("pdf") === "1";
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldDownload || busy || done) return;
    setBusy(true);

    (async () => {
      try {
        const target = document.getElementById("share-content");
        if (!target) throw new Error("Content not found");

        // Wait one frame so layout stabilises
        await new Promise((r) => requestAnimationFrame(r));

        const [{ default: html2canvas }, jsPdfMod] = await Promise.all([
          import("html2canvas"),
          import("jspdf"),
        ]);
        const JsPdf = jsPdfMod.jsPDF;

        const canvas = await html2canvas(target, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new JsPdf({
          unit: "pt",
          format: "a4",
          orientation: "portrait",
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Fit content to page width, paginate tall content
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const safeTitle = title
          .replace(/[^\w\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .slice(0, 60);
        pdf.save(`excite-${safeTitle || "analysis"}.pdf`);
        setDone(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "PDF generation failed");
      } finally {
        setBusy(false);
      }
    })();
  }, [shouldDownload, busy, done, title]);

  if (!shouldDownload) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur px-4 py-2 text-sm print:hidden">
      {busy && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating PDF…
        </div>
      )}
      {done && (
        <div className="text-green-600 dark:text-green-400">
          PDF downloaded. You can close this tab.
        </div>
      )}
      {error && (
        <div className="text-destructive">PDF failed: {error}</div>
      )}
    </div>
  );
}
