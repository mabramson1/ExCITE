import { Stethoscope } from "lucide-react";

interface BrandLogoProps {
  size?: "sm" | "default";
  showTagline?: boolean;
}

export function BrandLogo({ size = "default", showTagline = false }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-2">
      <Stethoscope
        className={size === "sm" ? "h-6 w-6 text-primary" : "h-7 w-7 text-primary"}
      />
      <div>
        <span
          className={
            size === "sm"
              ? "font-bold"
              : "text-lg font-bold tracking-tight"
          }
        >
          Docs<sup className="text-primary text-[0.6em]">2</sup>
        </span>
        {showTagline && (
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Docs for Docs
          </p>
        )}
      </div>
    </div>
  );
}
