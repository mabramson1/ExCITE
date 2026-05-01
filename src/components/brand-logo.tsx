import { StethoscopeTwo } from "./stethoscope-two-icon";

interface BrandLogoProps {
  size?: "sm" | "default" | "lg";
  showTagline?: boolean;
}

export function BrandLogo({ size = "default", showTagline = false }: BrandLogoProps) {
  const iconSize = size === "lg" ? "h-10 w-10" : size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const textSize = size === "lg" ? "text-2xl font-bold tracking-tight" : size === "sm" ? "font-bold" : "text-lg font-bold tracking-tight";

  return (
    <div className="flex items-center gap-2">
      <StethoscopeTwo className={`${iconSize} text-primary`} />
      <div>
        <span className={textSize}>
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

export function BrandEquation({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="text-4xl md:text-6xl font-bold tracking-tight">
        Docs <span className="text-primary">×</span> Docs <span className="text-primary">=</span> Docs<sup className="text-primary">2</sup>
      </div>
      <p className="text-lg text-muted-foreground">
        Documents <span className="text-primary">×</span> Doctors
      </p>
    </div>
  );
}
