/**
 * PHI (Protected Health Information) Detection & Censoring
 *
 * Detects and redacts common PHI patterns per HIPAA Safe Harbor guidelines.
 * When PHI is found, it is replaced with [REDACTED] and a warning is issued.
 */

const PHI_PATTERNS: { name: string; pattern: RegExp; replacement: string }[] = [
  // Social Security Numbers
  {
    name: "SSN",
    pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
    replacement: "[REDACTED-SSN]",
  },
  // Medical Record Numbers (common formats)
  {
    name: "MRN",
    pattern: /\b(?:MRN|Medical Record(?:\s*#)?)\s*:?\s*[\w-]{4,15}\b/gi,
    replacement: "[REDACTED-MRN]",
  },
  // Phone numbers
  {
    name: "Phone",
    pattern:
      /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    replacement: "[REDACTED-PHONE]",
  },
  // Email addresses
  {
    name: "Email",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: "[REDACTED-EMAIL]",
  },
  // Dates of birth (various formats)
  {
    name: "DOB",
    pattern:
      /\b(?:DOB|Date of Birth|Birth\s*Date)\s*:?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi,
    replacement: "[REDACTED-DOB]",
  },
  // Street addresses
  {
    name: "Address",
    pattern:
      /\b\d{1,5}\s+(?:[A-Za-z]+\s){1,3}(?:St(?:reet)?|Ave(?:nue)?|Blvd|Dr(?:ive)?|Rd|Road|Ln|Lane|Way|Ct|Court|Pl(?:ace)?|Cir(?:cle)?)\b\.?(?:\s*(?:#|Apt|Suite|Ste|Unit)\s*\w+)?\b/gi,
    replacement: "[REDACTED-ADDRESS]",
  },
  // Patient names with labels
  {
    name: "PatientName",
    pattern:
      /\b(?:Patient(?:\s*Name)?|Pt)\s*:?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g,
    replacement: "[REDACTED-NAME]",
  },
  // Health plan beneficiary numbers
  {
    name: "HealthPlan",
    pattern:
      /\b(?:Health\s*Plan|Insurance|Policy)\s*(?:#|No\.?|Number)?\s*:?\s*[\w-]{5,20}\b/gi,
    replacement: "[REDACTED-INSURANCE]",
  },
  // IP addresses
  {
    name: "IP",
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    replacement: "[REDACTED-IP]",
  },
];

export interface PhiScanResult {
  hasPhi: boolean;
  censoredText: string;
  detectedTypes: string[];
  warnings: string[];
}

export function scanAndCensorPhi(text: string): PhiScanResult {
  let censoredText = text;
  const detectedTypes: Set<string> = new Set();
  const warnings: string[] = [];

  for (const { name, pattern, replacement } of PHI_PATTERNS) {
    // Reset regex state
    const regex = new RegExp(pattern.source, pattern.flags);
    const matches = censoredText.match(regex);
    if (matches && matches.length > 0) {
      detectedTypes.add(name);
      censoredText = censoredText.replace(regex, replacement);
      warnings.push(
        `Detected ${matches.length} potential ${name} identifier(s) - automatically redacted`
      );
    }
  }

  return {
    hasPhi: detectedTypes.size > 0,
    censoredText,
    detectedTypes: Array.from(detectedTypes),
    warnings,
  };
}
