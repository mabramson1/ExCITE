import { StethoscopeTwo } from "./stethoscope-two-icon";

interface BrandLogoProps {
  size?: "sm" | "default" | "lg";
  showTagline?: boolean;
  showIcon?: boolean;
}

export function BrandLogo({ size = "default", showTagline = false, showIcon = false }: BrandLogoProps) {
  const textSize = size === "lg" ? "text-2xl font-bold tracking-tight" : size === "sm" ? "font-bold" : "text-lg font-bold tracking-tight";

  return (
    <div className="flex items-center gap-2">
      {showIcon && (
        <StethoscopeTwo className={`${size === "lg" ? "h-10 w-10" : size === "sm" ? "h-6 w-6" : "h-7 w-7"} text-primary`} />
      )}
      <div>
        <span className={textSize}>
          docs<sup className="text-primary text-[0.6em]">2</sup>
        </span>
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
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="text-4xl md:text-6xl font-bold tracking-tight">
        docs <span className="text-primary">×</span> docs
      </div>
      <p className="text-lg text-muted-foreground">
        documents <span className="text-primary">×</span> doctors
      </p>
    </div>
  );
}
