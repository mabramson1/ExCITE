/**
 * PHI (Protected Health Information) Detection & Censoring
 *
 * Best-effort detection and redaction of common PHI patterns. Covers SSNs,
 * MRNs, phone/fax numbers, emails, dates, labeled DOBs, addresses, zip codes,
 * labeled patient/provider names, ages 90+, and IP addresses. This is pattern
 * matching — not comprehensive HIPAA Safe Harbor de-identification. Users
 * should minimize unnecessary PHI input.
 *
 * IMPORTANT: This module is isomorphic — runs on both client and server.
 * Client-side usage is preferred so PHI never leaves the user's browser:
 *
 *   const { censoredText, tokenMap } = scanAndCensorPhi(input);
 *   const res = await fetch(API, { body: JSON.stringify({ text: censoredText }) });
 *   const data = await res.json();
 *   const finalOutput = deepReinject(data.result, tokenMap); // restore real values
 *
 * Server-side scanAndCensorPhi() still runs as defense-in-depth in case a
 * client somehow ships un-redacted text.
 */

const PHI_PATTERNS: { name: string; pattern: RegExp }[] = [
  // Order matters — more specific patterns first so they're consumed before
  // generic ones. Each match gets a unique token (e.g., [REDACTED-NAME-1]).

  // Social Security Numbers (XXX-XX-XXXX)
  { name: "SSN", pattern: /\b\d{3}[-.\s]\d{2}[-.\s]\d{4}\b/g },

  // Email addresses
  { name: "Email", pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },

  // Medical Record Numbers (with label)
  { name: "MRN", pattern: /\b(?:MRN|Medical Record(?:\s*#)?)\s*:?\s*[\w-]{4,15}\b/gi },

  // Health plan / insurance numbers
  { name: "Insurance", pattern: /\b(?:Health\s*Plan|Insurance|Policy)\s*(?:#|No\.?|Number)?\s*:?\s*[\w-]{5,20}\b/gi },

  // DOB with label
  { name: "DOB", pattern: /\b(?:DOB|Date of Birth|Birth\s*Date)\s*:?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi },

  // Generic dates (MM/DD/YYYY, MM-DD-YYYY, DD/MM/YYYY) — HIPAA Safe Harbor
  // requires all dates more specific than year to be removed. Must come AFTER
  // labeled DOB to avoid double-matching.
  { name: "Date", pattern: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g },

  // Fax numbers (with label)
  { name: "Fax", pattern: /\b(?:fax|facsimile)\s*(?:#|:)?\s*(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/gi },

  // Phone numbers (must come AFTER SSN and Fax)
  { name: "Phone", pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },

  // Street addresses
  { name: "Address", pattern: /\b\d{1,5}\s+(?:[A-Za-z]+\s){1,3}(?:St(?:reet)?|Ave(?:nue)?|Blvd|Dr(?:ive)?|Rd|Road|Ln|Lane|Way|Ct|Court|Pl(?:ace)?|Cir(?:cle)?)\b\.?(?:\s*(?:#|Apt|Suite|Ste|Unit)\s*\w+)?\b/gi },

  // Zip codes — only when labeled or after a state abbreviation to avoid
  // false positives on lab values, dosages, etc.
  { name: "ZipCode", pattern: /\b(?:zip(?:\s*code)?|postal\s*code)\s*:?\s*\d{5}(?:-\d{4})?\b/gi },
  { name: "ZipCode", pattern: /\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/g },

  // Patient name with label ("Patient: John Smith")
  { name: "PatientName", pattern: /\b(?:Patient(?:\s*Name)?|Pt)\s*:?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g },

  // Provider name (Dr./Mr./Mrs./Ms./Prof. + Name)
  { name: "Provider", pattern: /\b(?:Dr|Mr|Mrs|Ms|Prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g },

  // Ages 90+ only (HIPAA Safe Harbor §164.514(b)(2)(i)(C) — ages under 90
  // are NOT identifiers and the AI needs them for clinical reasoning,
  // dosing, screening, and risk calculations).
  { name: "Age", pattern: /\b(?:9\d|1[0-9]\d)[-\s]?(?:y\.?o\.?|y\/o|year[s]?[-\s]?old)\b/gi },

  // IP addresses (must come AFTER patterns that might match digit groups)
  { name: "IP", pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
];

export interface PhiScanResult {
  hasPhi: boolean;
  censoredText: string;
  detectedTypes: string[];
  warnings: string[];
  /** Map from token (e.g., "[REDACTED-NAME-1]") back to the original value. */
  tokenMap: Record<string, string>;
}

export function scanAndCensorPhi(text: string): PhiScanResult {
  let censoredText = text;
  const detectedTypes: Set<string> = new Set();
  const warnings: string[] = [];
  const tokenMap: Record<string, string> = {};
  const counters: Record<string, number> = {};

  for (const { name, pattern } of PHI_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let count = 0;
    censoredText = censoredText.replace(regex, (match) => {
      counters[name] = (counters[name] || 0) + 1;
      const token = `[REDACTED-${name.toUpperCase()}-${counters[name]}]`;
      tokenMap[token] = match;
      count++;
      return token;
    });
    if (count > 0) {
      detectedTypes.add(name);
      warnings.push(
        `Detected ${count} potential ${name} identifier(s) — redacted in your browser before sending`
      );
    }
  }

  return {
    hasPhi: detectedTypes.size > 0,
    censoredText,
    detectedTypes: Array.from(detectedTypes),
    warnings,
    tokenMap,
  };
}

/**
 * Replace [REDACTED-X-N] tokens in a string with their original values.
 * Safe no-op if the tokenMap is empty.
 */
export function reinjectTokens(text: string, tokenMap: Record<string, string>): string {
  if (!text || Object.keys(tokenMap).length === 0) return text;
  let result = text;
  for (const [token, value] of Object.entries(tokenMap)) {
    // Use split/join so we don't interpret token chars as regex
    result = result.split(token).join(value);
  }
  return result;
}

/**
 * Recursively walk a JSON-shaped value and re-inject tokens in every string.
 * Preserves the shape of objects, arrays, and primitives.
 */
export function deepReinject<T>(value: T, tokenMap: Record<string, string>): T {
  if (Object.keys(tokenMap).length === 0) return value;
  if (typeof value === "string") {
    return reinjectTokens(value, tokenMap) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepReinject(item, tokenMap)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deepReinject(v, tokenMap);
    }
    return out as T;
  }
  return value;
}
