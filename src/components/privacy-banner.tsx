import { Lock } from "lucide-react";

/**
 * Small badge stating that identifiers stay on-device. Sits near tool inputs.
 */
export function PrivacyBanner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30 px-3 py-2 ${className}`}
    >
      <Lock className="h-3.5 w-3.5 text-green-700 dark:text-green-400 mt-0.5 shrink-0" />
      <div className="text-xs text-green-800 dark:text-green-300 leading-relaxed">
        <span className="font-medium">Built-in PHI auto-detection.</span>{" "}
        Names, MRNs, SSNs, dates of birth, phone numbers, email addresses, and
        street addresses are automatically redacted in your browser before any
        text is sent. Clinical details the AI needs — age, weight, labs,
        medications, vitals — pass through. Automatic redaction is best-effort
        and may not catch all identifiers.
      </div>
    </div>
  );
}
