"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface PhiWarningProps {
  warnings: string[];
  onDismiss?: () => void;
}

export function PhiWarning({ warnings, onDismiss }: PhiWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || warnings.length === 0) return null;

  return (
    <div className="rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/30 p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">
            PHI Detected & Automatically Redacted
          </h4>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            Protected Health Information (PHI) was detected in your input.
            All PHI has been automatically censored to comply with HIPAA regulations.
          </p>
          <ul className="mt-2 space-y-1">
            {warnings.map((warning, i) => (
              <li key={i} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-red-500 shrink-0" />
                {warning}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="text-red-500 hover:text-red-700 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
