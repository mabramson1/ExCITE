import { DocsLogo } from "./docs-logo";

interface BrandLogoProps {
  size?: "sm" | "default" | "lg" | "hero";
  showTagline?: boolean;
}

export function BrandLogo({ size = "default", showTagline = false }: BrandLogoProps) {
  const textSize = {
    hero: "text-4xl md:text-5xl font-bold tracking-tight",
    lg: "text-2xl font-bold tracking-tight",
    default: "text-lg font-bold tracking-tight",
    sm: "font-bold",
  }[size];

  const iconSize = {
    hero: "h-10 w-10 md:h-12 md:w-12",
    lg: "h-7 w-7",
    default: "h-5 w-5",
    sm: "h-4 w-4",
  }[size];

  return (
    <div className="flex items-center gap-1">
      <div>
        <div className="flex items-end">
          <span className={textSize}>docs</span>
          <DocsLogo className={`${iconSize} text-primary mb-[0.15em]`} />
        </div>
        {showTagline && (
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            docs for docs
          </p>
        )}
      </div>
    </div>
  );
}

export function BrandEquation({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="text-4xl md:text-6xl font-bold tracking-tight">
        docs <span className="text-primary">×</span> docs
      </div>
    </div>
  );
}
