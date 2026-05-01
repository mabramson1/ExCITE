/**
 * Credit system: per-tool weights and pricing tier limits.
 *
 * Weights are tied to API cost — tools costing ~$0.05+ per call cost 2 credits,
 * everything else costs 1. Adjust here as Claude pricing changes.
 *
 * Sonnet 4 pricing (per 1M tokens):
 *   input $3 · output $15 · cache_read $0.30 · cache_write $3.75
 */

import type Anthropic from "@anthropic-ai/sdk";

export type Tool =
  | "clinical_note"
  | "ap_writer"
  | "prior_auth"
  | "discharge"
  | "referral"
  | "manuscript_citations"
  | "manuscript_writer"
  | "review_response"
  | "de_ai_ify"
  | "ai_detector";

export const TOOL_CREDITS: Record<Tool, number> = {
  // 1-credit tools (~$0.02–0.04/call)
  referral: 1,
  prior_auth: 1,
  ai_detector: 1,
  clinical_note: 1,
  de_ai_ify: 1,
  ap_writer: 1,
  manuscript_citations: 1,
  // 2-credit tools (~$0.05+/call)
  discharge: 2,
  review_response: 2,
  manuscript_writer: 2,
};

export const TOOL_LABELS: Record<Tool, string> = {
  clinical_note: "Clinical Note Coding",
  ap_writer: "A/P Writer",
  prior_auth: "Prior Auth Letter",
  discharge: "Discharge Summary",
  referral: "Referral Letter",
  manuscript_citations: "Manuscript Citations",
  manuscript_writer: "Manuscript Writer",
  review_response: "Peer Review Response",
  de_ai_ify: "De-AI-ifier",
  ai_detector: "AI Detector",
};

/** Monthly credit allotment by plan. */
export const PLAN_CREDIT_LIMITS = {
  free: 10,
  pro: 100,
  unlimited: 500, // Generous fair-use cap on the "Unlimited" tier
} as const;

export type PlanName = keyof typeof PLAN_CREDIT_LIMITS;

/**
 * Compute API cost in millicents (= 0.001¢ = 0.00001 USD) from Anthropic
 * usage block. Using millicents lets us store sub-cent costs as integers.
 */
export function computeCostMillicents(usage: Anthropic.Messages.Usage): number {
  const input = usage.input_tokens ?? 0;
  const output = usage.output_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;

  // Per-token USD: input $3/M = 3e-6, etc.
  // Convert to millicents: USD × 100,000 (since 1¢ = 0.01 USD, 1 mc = 0.001¢ = 0.00001 USD)
  const usd =
    input * 3e-6 + output * 15e-6 + cacheRead * 0.3e-6 + cacheWrite * 3.75e-6;
  return Math.round(usd * 100_000);
}

/** Convert millicents to a display string in dollars (e.g. "$0.034"). */
export function formatMillicents(mc: number): string {
  return `$${(mc / 100_000).toFixed(4)}`;
}
