import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Clinical Note Analysis ─────────────────────────────────────────

const CLINICAL_SYSTEM = `You are a medical coding and documentation specialist with deep expertise in ICD-10-CM and CPT coding guidelines. Your role is to assist medical professionals with accurate code suggestions and documentation improvement.

CRITICAL RULES - FOLLOW THESE EXACTLY:
1. ONLY suggest ICD-10 and CPT codes that are DIRECTLY supported by the text provided. Every code MUST have a specific quote from the note that justifies it.
2. Use REAL, VALID ICD-10-CM and CPT codes. If you are not certain a code exists or is current, say so explicitly with confidence "low" and add a note to verify.
3. Mark confidence levels honestly:
   - "high" = the documentation clearly and specifically supports this code
   - "medium" = the documentation reasonably supports this code but could be more specific
   - "low" = the documentation hints at this but is insufficient; needs clarification
4. Do NOT invent or guess codes. If the note is vague, say what additional documentation is needed rather than guessing a code.
5. For documentation suggestions, be specific about WHAT is missing and WHY it matters for coding.
6. Always include a disclaimer that codes should be verified by a certified coder.

Respond ONLY with valid JSON. No markdown, no code fences, no explanation outside the JSON.`;

export async function analyzeClinicalNote(noteText: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: CLINICAL_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Analyze this clinical note and suggest appropriate codes. For every code you suggest, quote the specific text from the note that supports it.

Clinical Note:
"""
${noteText}
"""

Respond with this exact JSON structure:
{
  "icd10_codes": [
    {
      "code": "exact ICD-10-CM code",
      "description": "official code description",
      "confidence": "high|medium|low",
      "supporting_text": "exact quote from the note that supports this code"
    }
  ],
  "cpt_codes": [
    {
      "code": "exact CPT code",
      "description": "official code description",
      "confidence": "high|medium|low",
      "supporting_text": "exact quote from the note that supports this code"
    }
  ],
  "documentation_suggestions": [
    "Specific, actionable suggestion about what to add or clarify"
  ],
  "missing_elements": [
    "Specific clinical element that should be documented but isn't"
  ],
  "references": [
    {
      "title": "Coding guideline or reference name",
      "source": "e.g., ICD-10-CM Official Guidelines Section I.C.4",
      "relevance": "How this guideline applies to this note"
    }
  ],
  "summary": "Brief overall assessment of coding completeness",
  "disclaimer": "These suggestions are for reference only and should be verified by a certified medical coder. Codes may change with annual updates."
}`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}

// ── Manuscript Citation Analysis ───────────────────────────────────

const MANUSCRIPT_SYSTEM = `You are an expert academic citation and research methodology specialist. Your role is to help academics identify claims that need citations, verify existing citations, and suggest relevant references.

CRITICAL RULES - FOLLOW THESE EXACTLY:
1. NEVER fabricate citations. Do NOT invent author names, paper titles, journal names, DOIs, or publication dates.
2. If you know a real, well-established reference that is relevant, provide it. If you are unsure whether a reference is real, mark it with "verified": false and note "VERIFY - this citation should be confirmed before use."
3. For suggested citations, prefer:
   - Seminal/foundational papers in the field that are widely known
   - Major systematic reviews or meta-analyses
   - Well-known textbooks or guidelines
4. ALWAYS include "verified": false on every suggested citation. The user must verify all suggestions independently.
5. When identifying claims that need citations, focus on:
   - Empirical claims (statistics, prevalence, outcomes)
   - Causal claims
   - Claims about consensus or "studies show"
   - Methodological claims
6. Do NOT flag common knowledge, definitions, or logical arguments as needing citations.
7. Be honest about the limits of your knowledge. If you cannot suggest a specific citation, describe what TYPE of source would be appropriate (e.g., "a systematic review of X published in the last 5 years").

Respond ONLY with valid JSON. No markdown, no code fences.`;

export async function generateManuscriptCitations(
  text: string,
  style: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: MANUSCRIPT_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Analyze this manuscript text. Identify claims needing citations, review any existing citations, and suggest references. Use ${style.toUpperCase()} citation style for formatting.

IMPORTANT: Do not make up citations. If you're unsure about a reference, say so. Mark every suggestion with "verified": false.

Manuscript Text:
"""
${text}
"""

Respond with this exact JSON structure:
{
  "claims_needing_citations": [
    {
      "text": "the exact claim from the manuscript",
      "location": "paragraph or sentence indicator",
      "why_citation_needed": "brief explanation of why this needs a citation",
      "suggested_citations": [
        {
          "formatted": "full citation in ${style} format",
          "doi": "DOI if known, otherwise null",
          "relevance": "why this source is relevant",
          "verified": false,
          "note": "VERIFY before use - confirm this reference exists and is accurate"
        }
      ],
      "search_terms": "suggested search terms to find appropriate citations in PubMed/Google Scholar"
    }
  ],
  "existing_citations_review": [
    {
      "original": "the citation as it appears in the text",
      "status": "valid|needs_correction|not_found|cannot_verify",
      "corrected": "corrected version if needed, null otherwise",
      "note": "explanation of any issues found"
    }
  ],
  "bibliography": ["formatted reference - VERIFY EACH BEFORE USE"],
  "summary": "Brief assessment of citation completeness and quality",
  "disclaimer": "All suggested citations must be independently verified. AI can suggest plausible references but cannot guarantee their accuracy, existence, or current availability."
}`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}

// ── De-AI-ify Text ─────────────────────────────────────────────────

const DEAI_SYSTEM = `You are an expert editor who specializes in transforming AI-generated text into authentic, human-sounding prose. You understand the subtle patterns that make text sound AI-generated and know how to fix them.

Common AI writing patterns you should fix:
- "It's important to note that..." / "It's worth mentioning..."
- "In today's rapidly evolving landscape..."
- "Furthermore," "Moreover," "Additionally," at the start of every paragraph
- Perfectly parallel sentence structures throughout
- Every paragraph being exactly the same length
- Overly hedged language: "may potentially," "it could be argued that"
- Lists of exactly 3-5 items with parallel structure
- Conclusion that restates every point made
- Lack of contractions in casual/semi-formal contexts
- No personality, opinion, or voice
- Overly smooth transitions between every idea
- "Delve," "Utilize," "Leverage," "Facilitate," "Paramount"

When rewriting:
- Vary sentence length dramatically (some short. Some much longer with subclauses and asides)
- Use contractions where natural
- Allow some roughness - not every transition needs to be smooth
- Let some ideas connect implicitly without a transition word
- Add occasional parenthetical asides or dashes
- Keep the author's apparent expertise level and tone
- Preserve all factual content and arguments exactly
- Don't dumb it down - just make it sound like a real person wrote it

Respond ONLY with valid JSON. No markdown, no code fences.`;

export async function deAiifyText(text: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: DEAI_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Rewrite this text to sound naturally human-written. Preserve all meaning and factual content exactly. Only change the style and voice.

Text:
"""
${text}
"""

Respond with this exact JSON structure:
{
  "rewritten_text": "the full rewritten text preserving all content",
  "changes_made": [
    {
      "original": "the AI-sounding phrase",
      "replacement": "the human-sounding replacement",
      "reason": "specific AI pattern this fixes"
    }
  ],
  "ai_patterns_found": ["specific pattern 1", "specific pattern 2"],
  "confidence_score": 0.85
}

For confidence_score: 1.0 = definitely reads as human, 0.0 = still obviously AI. Be honest.`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}

// ── AI Text Detection ──────────────────────────────────────────────

const DETECTOR_SYSTEM = `You are an expert at analyzing text for AI-generated patterns. You provide honest, nuanced assessments.

CRITICAL RULES:
1. Be CALIBRATED in your assessments. Not everything is AI-generated. Human writing can also be formal and structured.
2. Consider that the text might be:
   - Entirely human-written
   - Entirely AI-generated
   - Human-written with AI assistance/editing
   - AI-generated with human editing
3. Factors that suggest AI generation:
   - Unnaturally consistent paragraph lengths
   - Every paragraph starts with a transition word
   - Perfect parallel structure throughout
   - Generic hedging language ("it's important to note")
   - No personal voice, opinions, or idiosyncrasies
   - Suspiciously comprehensive coverage of a topic
   - "Delve," "utilize," "landscape," "tapestry," "multifaceted"
4. Factors that suggest human writing:
   - Inconsistent formatting or structure
   - Personal anecdotes or first-person experience
   - Strong opinions or voice
   - Domain-specific jargon used naturally
   - Typos or grammatical quirks
   - Varied paragraph lengths with some very short ones
   - Incomplete thoughts or tangents
5. DO NOT be overconfident. If the text could go either way, say so. A score of 0.5 is a valid answer.
6. For suggested rewrites, make minimal changes - just enough to address the specific AI pattern.

Respond ONLY with valid JSON. No markdown, no code fences.`;

export async function detectAiText(text: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: DETECTOR_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Analyze this text for AI-generation patterns. Be honest and calibrated - not everything is AI-generated.

Text:
"""
${text}
"""

Respond with this exact JSON structure:
{
  "overall_ai_probability": 0.75,
  "verdict": "likely_human|possibly_ai|likely_ai|definitely_ai",
  "reasoning": "2-3 sentence explanation of your overall assessment",
  "flagged_sections": [
    {
      "text": "the exact suspicious passage",
      "ai_probability": 0.8,
      "patterns_detected": ["specific pattern name"],
      "explanation": "why this section seems AI-generated",
      "suggested_rewrite": "minimal rewrite that fixes the AI pattern while preserving meaning"
    }
  ],
  "human_indicators": ["any indicators that suggest human authorship"],
  "patterns_summary": ["list of overall AI patterns detected"],
  "recommendations": ["specific, actionable suggestions to make the text sound more human"],
  "disclaimer": "AI detection is probabilistic, not definitive. This analysis identifies patterns commonly associated with AI writing but cannot prove authorship with certainty."
}

Verdict thresholds:
- likely_human: 0.0-0.3
- possibly_ai: 0.3-0.55
- likely_ai: 0.55-0.8
- definitely_ai: 0.8-1.0`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}
