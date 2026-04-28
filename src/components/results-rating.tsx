"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

export function ResultsRating({ savedId }: { savedId: string | null }) {
  const [rating, setRating] = useState<"up" | "down" | null>(null);

  if (!savedId) return null;

  async function rate(value: "up" | "down") {
    if (rating === value) return;
    setRating(value);
    try {
      await fetch(`/api/history/${savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rate", rating: value }),
      });
    } catch {
      toast.error("Failed to save rating");
      setRating(null);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => rate("up")}
        className={`p-1 rounded transition-colors ${rating === "up" ? "text-green-600 bg-green-100 dark:bg-green-950/40" : "text-muted-foreground/50 hover:text-green-600"}`}
        title="Good result"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => rate("down")}
        className={`p-1 rounded transition-colors ${rating === "down" ? "text-red-600 bg-red-100 dark:bg-red-950/40" : "text-muted-foreground/50 hover:text-red-600"}`}
        title="Poor result"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
