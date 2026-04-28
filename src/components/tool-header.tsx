import type { LucideIcon } from "lucide-react";

interface ToolHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string; // e.g. "blue", "emerald", "violet", "amber"
  bullets?: string[];
}

const colorMap: Record<string, { bg: string; text: string; darkBg: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", darkBg: "dark:bg-blue-950/40" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", darkBg: "dark:bg-emerald-950/40" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", darkBg: "dark:bg-violet-950/40" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", darkBg: "dark:bg-amber-950/40" },
};

export function ToolHeader({ icon: Icon, title, description, color, bullets }: ToolHeaderProps) {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className="flex items-start gap-3">
      <div className={`h-10 w-10 rounded-lg ${c.bg} ${c.darkBg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 ${c.text}`} />
      </div>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        {bullets && bullets.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {bullets.map((b, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className={`h-1 w-1 rounded-full ${c.text} shrink-0`} />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
