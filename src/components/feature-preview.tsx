"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FeaturePreviewProps {
  accent: "blue" | "emerald" | "violet" | "green";
  children: React.ReactNode;
}

const accentClasses = {
  blue: "text-blue-600 hover:text-blue-700 dark:text-blue-400",
  emerald: "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400",
  violet: "text-violet-600 hover:text-violet-700 dark:text-violet-400",
  green: "text-green-600 hover:text-green-700 dark:text-green-400",
};

export function FeaturePreview({ accent, children }: FeaturePreviewProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-5">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${accentClasses[accent]}`}
      >
        {open ? "Hide preview" : "See it in action"}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
