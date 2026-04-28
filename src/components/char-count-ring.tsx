interface CharCountRingProps {
  current: number;
  max: number;
  wordCount: number;
}

export function CharCountRing({ current, max, wordCount }: CharCountRingProps) {
  const pct = Math.min(current / max, 1);
  const over = current > max;
  const r = 10;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const color = over ? "text-destructive" : pct > 0.9 ? "text-amber-500" : pct > 0.7 ? "text-yellow-500" : "text-green-500";

  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 28 28" className="shrink-0">
        <circle cx="14" cy="14" r={r} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/40" />
        <circle
          cx="14" cy="14" r={r} fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} -rotate-90 origin-center`}
        />
      </svg>
      <span className={`text-xs ${over ? "text-destructive font-medium" : "text-muted-foreground"}`}>
        {current.toLocaleString()} / {max.toLocaleString()} chars · {wordCount.toLocaleString()} words
      </span>
    </div>
  );
}
