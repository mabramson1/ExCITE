"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export function PdfAutoDownload({ title }: { title: string }) {
  const searchParams = useSearchParams();
  const shouldDownload = searchParams.get("pdf") === "1";
  const [triggered, setTriggered] = useState(false);
  void title;

  useEffect(() => {
    if (!shouldDownload || triggered) return;
    setTriggered(true);
    // Small delay so the page fully paints before print dialog opens
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, [shouldDownload, triggered]);

  if (!shouldDownload) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur px-4 py-2 text-sm print:hidden">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Opening print dialog — choose &quot;Save as PDF&quot; to download…
      </div>
    </div>
  );
}
