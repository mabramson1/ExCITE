import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper to create a cached system prompt block (Anthropic prompt caching)
function cachedSystem(text: string): Anthropic.Messages.TextBlockParam[] {
  return [
    {
      type: "text",
      text,
      cache_control: { type: "ephemeral" },
    },
  ];
}

// ── Clinical Note Analysis ─────────────────────────────────────────

const CLINICAL_SYSTEM = `You are a medical coding, documentation, and clinical research specialist with deep expertise in ICD-10-CM, CPT coding guidelines, E/M level determination, and evidence-based medicine.

CRITICAL RULES - FOLLOW THESE EXACTLY:
1. ONLY suggest ICD-10 and CPT codes that are DIRECTLY supported by the text provided. Every code MUST have a specific quote from the note that justifies it.
2. Use REAL, VALID ICD-10-CM and CPT codes. If you are not certain a code exists or is current, say so explicitly with confidence "low" and add a note to verify.
3. Mark confidence levels honestly:
   - "high" = the documentation clearly and specifically supports this code
   - "medium" = the documentation reasonably supports this code but could be more specific
   - "low" = the documentation hints at this but is insufficient; needs clarification
4. Do NOT invent or guess codes. If the note is vague, say what additional documentation is needed rather than guessing a code.
5. For documentation suggestions, be specific about WHAT is missing and WHY it matters for coding.

E/M LEVEL DETERMINATION:
6. Analyze the note for E/M level based on the 2021 AMA/CMS guidelines (medical decision making):
   - Number and complexity of problems addressed
   - Amount and complexity of data reviewed/ordered
   - Risk of complications, morbidity, or mortality
7. Suggest the appropriate E/M code (99202-99215 for office visits, 99221-99223 for initial hospital, etc.)
8. Explain the rationale for the E/M level with specific references to what's documented.

SPECIFICITY ANALYSIS:
9. When a code is "unspecified" (e.g., ends in .9 or .0), flag it and suggest what additional documentation would allow a more specific code.
10. For each unspecified code, list the specific alternatives and what clinical detail is needed.

PUBLICATION CITATIONS:
11. For each major diagnosis, suggest relevant clinical literature (guidelines, landmark trials, systematic reviews).
12. ONLY suggest publications you are confident are REAL. Include PMID when known.
13. Mark every citation with "verified": false — the user must confirm each one.

Respond ONLY with valid JSON. No markdown, no code fences, no explanation outside the JSON.`;

export async function analyzeClinicalNote(noteText: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6144,
    system: cachedSystem(CLINICAL_SYSTEM),
    messages: [
      {
        role: "user",
        content: `Analyze this clinical note. For every code, quote supporting text. Determine the E/M level. Flag unspecified codes with specificity suggestions.

Clinical Note:
"""
${noteText}
"""

Respond with this exact JSON structure:
{
  "em_level": {
    "code": "E/M CPT code (e.g., 99214)",
    "description": "E/M level description",
    "mdm_complexity": "straightforward|low|moderate|high",
    "problems": "description of problems addressed and their complexity",
    "data": "data reviewed/ordered complexity",
    "risk": "risk level and why",
    "rationale": "1-2 sentence summary of why this E/M level is supported",
    "documentation_gaps": ["what's missing that could support a higher level, if anything"]
  },
  "icd10_codes": [
    {
      "code": "exact ICD-10-CM code",
      "description": "official code description",
      "confidence": "high|medium|low",
      "supporting_text": "exact quote from note",
      "specificity_alert": null or {
        "issue": "why this code is unspecified",
        "specific_alternatives": [
          {"code": "more specific code", "description": "description", "documentation_needed": "what to add to the note"}
        ]
      }
    }
  ],
  "cpt_codes": [
    {
      "code": "exact CPT code",
      "description": "official code description",
      "confidence": "high|medium|low",
      "supporting_text": "exact quote from note"
    }
  ],
  "documentation_suggestions": ["specific actionable suggestion"],
  "missing_elements": ["specific clinical element that should be documented"],
  "references": [
    {"title": "Coding guideline name", "source": "e.g., ICD-10-CM Official Guidelines Section I.C.4", "relevance": "how it applies"}
  ],
  "publication_citations": [
    {
      "condition": "diagnosis this relates to",
      "title": "publication title",
      "authors": "first author et al.",
      "journal": "journal name",
      "year": "year",
      "pmid": "PubMed ID or null",
      "doi": "DOI or null",
      "type": "guideline|landmark_trial|systematic_review|meta_analysis|clinical_study",
      "relevance": "why relevant",
      "verified": false,
      "search_terms": "PubMed search terms"
    }
  ],
  "summary": "Brief overall assessment",
  "disclaimer": "These suggestions are for reference only and should be verified by a certified medical coder. Codes may change with annual updates. All publication citations must be independently verified."
}`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}

// ── Manuscript Citation Analysis ───────────────────────────────────

const MANUSCRIPT_SYSTEM = `You are an expert academic citation and research methodology specialist. Your role is to help academics identify claims that need citations and suggest relevant references.

CRITICAL RULES:
1. NEVER fabricate citations. Do NOT invent author names, paper titles, journal names, DOIs, or dates.
2. For each claim needing a citation, provide:
   - Specific PubMed/Google Scholar search terms to find real papers
   - The TYPE of source needed (systematic review, RCT, guideline, etc.)
   - If you know a real, well-established reference, provide it but ALWAYS mark "verified": false
3. Prefer seminal/foundational papers, major systematic reviews, and well-known guidelines.
4. Focus on empirical claims, causal claims, prevalence stats, and "studies show" statements.
5. Do NOT flag common knowledge, definitions, or logical arguments.
6. Be honest about limits. If you can't suggest a specific citation, say what type of source is needed.

Respond ONLY with valid JSON. No markdown, no code fences.`;

export async function generateManuscriptCitations(
  text: string,
  style: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6144,
    system: cachedSystem(MANUSCRIPT_SYSTEM),
    messages: [
      {
        role: "user",
        content: `Analyze this manuscript text. Identify claims needing citations, review existing citations, and suggest references. Use ${style.toUpperCase()} format.

IMPORTANT: Do not make up citations. Mark every suggestion "verified": false. Provide search terms for each claim.

Manuscript Text:
"""
${text}
"""

Respond with this exact JSON structure:
{
  "claims_needing_citations": [
    {
      "text": "exact claim from the manuscript",
      "location": "paragraph or sentence indicator",
      "why_citation_needed": "brief explanation",
      "suggested_citations": [
        {
          "formatted": "full citation in ${style} format",
          "doi": "DOI if known, otherwise null",
          "relevance": "why this source is relevant",
          "verified": false,
          "note": "VERIFY before use"
        }
      ],
      "search_terms": "PubMed/Google Scholar search terms to find real citations for this claim"
    }
  ],
  "existing_citations_review": [
    {
      "original": "citation as it appears",
      "status": "valid|needs_correction|not_found|cannot_verify",
      "corrected": "corrected version or null",
      "note": "explanation"
    }
  ],
  "bibliography": ["formatted reference - VERIFY EACH BEFORE USE"],
  "summary": "Brief assessment of citation completeness",
  "disclaimer": "All suggested citations must be independently verified."
}`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}

// ── De-AI-ify Text ─────────────────────────────────────────────────

const DEAI_SYSTEM_BASE = `You are an expert editor who transforms AI-generated text into authentic, human-sounding prose.

Common AI writing patterns to fix:
- "It's important to note that..." / "It's worth mentioning..."
- "In today's rapidly evolving landscape..."
- "Furthermore," "Moreover," "Additionally," at every paragraph start
- Perfectly parallel sentence structures throughout
- Uniform paragraph lengths
- Overly hedged language: "may potentially," "it could be argued that"
- Lists of exactly 3-5 items with parallel structure
- Conclusion that restates every point
- No contractions in casual/semi-formal contexts
- No personality, opinion, or voice
- Overly smooth transitions between every idea
- "Delve," "Utilize," "Leverage," "Facilitate," "Paramount"

Respond ONLY with valid JSON. No markdown, no code fences.`;

const STYLE_INSTRUCTIONS: Record<string, string> = {
  general: `When rewriting:
- Vary sentence length dramatically (some short. Some much longer with subclauses)
- Use contractions where natural
- Allow some roughness - not every transition needs to be smooth
- Let some ideas connect implicitly without a transition word
- Add occasional parenthetical asides or dashes
- Preserve all factual content exactly
- Don't dumb it down - just make it sound like a real person`,

  manuscript: `Rewriting for ACADEMIC MANUSCRIPT:
- Maintain formal academic tone — NO colloquialisms or contractions
- Vary sentence structure but keep it scholarly
- Use discipline-specific terminology naturally
- Replace AI hedging with appropriate academic hedging ("these findings suggest")
- Let arguments flow without forced transition words
- Keep citation placeholders and technical terms exactly
- Preserve all factual content and arguments exactly`,

  blog: `Rewriting for BLOG POST:
- Conversational, engaging tone
- Use contractions freely (it's, don't, we're)
- Address reader with "you" where appropriate
- Mix punchy one-liners with longer explanations
- Add personality and occasional humor
- Use rhetorical questions
- Short paragraphs — better for online reading
- Start sentences with "And," "But," "So"
- Preserve all factual content exactly`,

  email: `Rewriting for PROFESSIONAL EMAIL:
- Concise and scannable — people skim emails
- Warm but professional tone with contractions
- Front-load key information
- Short paragraphs (2-3 sentences max)
- Sound like a real person writing quickly but thoughtfully
- Preserve all factual content and action items exactly`,

  "social-media": `Rewriting for SOCIAL MEDIA:
- Punchy, direct, engaging
- Very short sentences and fragments
- Authentic and personal
- Casual language and contractions
- Break ideas into digestible chunks
- Add personality — opinions, reactions, emphasis
- Preserve core message but make it shareable`,

  "grant-proposal": `Rewriting for GRANT PROPOSAL:
- Confident, authoritative academic tone
- Precise and specific — no vague language
- Active voice ("We will investigate" not "It will be investigated")
- Clear significance and innovation without overselling
- Strong topic sentences
- Every sentence adds substance — no filler
- Preserve all factual claims and methodology exactly`,

  "patient-communication": `Rewriting for PATIENT COMMUNICATION:
- Plain language — 6th-8th grade reading level
- Avoid jargon; explain technical terms when necessary
- Short sentences and simple structure
- Warm, empathetic, reassuring
- Address patient with "you" and "your"
- Break complex info into numbered steps or short paragraphs
- Preserve all medical accuracy exactly`,
};

function getDeAiSystem(writingStyle: string): string {
  const styleInstructions = STYLE_INSTRUCTIONS[writingStyle] || STYLE_INSTRUCTIONS.general;
  return `${DEAI_SYSTEM_BASE}\n\n${styleInstructions}`;
}

export async function deAiifyText(text: string, writingStyle = "general"): Promise<string> {
  const styleName = writingStyle.replace(/-/g, " ");
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: cachedSystem(getDeAiSystem(writingStyle)),
    messages: [
      {
        role: "user",
        content: `Rewrite this text for the "${styleName}" style. Preserve all meaning and factual content exactly.

Text:
"""
${text}
"""

Respond with this exact JSON structure:
{
  "rewritten_text": "the full rewritten text",
  "changes_made": [
    {"original": "AI-sounding phrase", "replacement": "human-sounding replacement", "reason": "specific pattern fixed"}
  ],
  "ai_patterns_found": ["specific pattern 1", "specific pattern 2"],
  "confidence_score": 0.85,
  "style_applied": "${styleName}"
}

confidence_score: 1.0 = definitely human, 0.0 = still obviously AI. Be honest.`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}

// ── AI Text Detection ──────────────────────────────────────────────

const DETECTOR_SYSTEM = `You are an expert at analyzing text for AI-generated patterns. You provide honest, nuanced, calibrated assessments.

CRITICAL RULES:
1. Be CALIBRATED. Not everything is AI-generated. Human writing can be formal and structured.
2. Consider: entirely human, entirely AI, human+AI assistance, AI+human editing.
3. AI indicators: uniform paragraph lengths, every paragraph starts with transition word, perfect parallel structure, generic hedging ("it's important to note"), no voice/personality, "delve/utilize/landscape/tapestry/multifaceted", suspiciously comprehensive coverage.
4. Human indicators: inconsistent formatting, personal anecdotes, strong opinions, domain jargon used naturally, typos/quirks, varied paragraph lengths, incomplete thoughts.
5. DO NOT be overconfident. 0.5 is a valid score when uncertain.
6. SENTENCE-LEVEL ANALYSIS: Score EVERY sentence individually for AI probability.
7. For suggested rewrites, make minimal changes — just enough to fix the specific AI pattern.

Respond ONLY with valid JSON. No markdown, no code fences.`;

export async function detectAiText(text: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6144,
    system: cachedSystem(DETECTOR_SYSTEM),
    messages: [
      {
        role: "user",
        content: `Analyze this text for AI-generation patterns. Be honest and calibrated.

IMPORTANT: Provide sentence-level scoring — assign an AI probability to each sentence.

Text:
"""
${text}
"""

Respond with this exact JSON structure:
{
  "overall_ai_probability": 0.75,
  "verdict": "likely_human|possibly_ai|likely_ai|definitely_ai",
  "reasoning": "2-3 sentence explanation",
  "sentence_scores": [
    {
      "sentence": "the exact sentence from the text",
      "ai_probability": 0.8,
      "primary_pattern": "the most notable AI pattern in this sentence, or null if human-sounding"
    }
  ],
  "flagged_sections": [
    {
      "text": "exact suspicious passage",
      "ai_probability": 0.8,
      "patterns_detected": ["specific pattern"],
      "explanation": "why this seems AI-generated",
      "suggested_rewrite": "minimal rewrite preserving meaning"
    }
  ],
  "human_indicators": ["indicators suggesting human authorship"],
  "patterns_summary": ["overall AI patterns detected"],
  "recommendations": ["specific actionable suggestions"],
  "disclaimer": "AI detection is probabilistic, not definitive. This analysis identifies patterns commonly associated with AI writing but cannot prove authorship with certainty."
}

Verdict thresholds: likely_human 0.0-0.3, possibly_ai 0.3-0.55, likely_ai 0.55-0.8, definitely_ai 0.8-1.0`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}
