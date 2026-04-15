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

const CLINICAL_SYSTEM = `You are a medical coding, documentation, and clinical research specialist with deep expertise in ICD-10-CM, CPT coding, and E/M level determination per the CURRENT 2024-2025 AMA/CMS E&M guidelines.

CRITICAL CODING RULES:
1. ONLY suggest ICD-10 and CPT codes DIRECTLY supported by the text. Every code MUST cite a specific quote from the note.
2. Use REAL, VALID ICD-10-CM and CPT codes. If uncertain, mark confidence "low" and note it.
3. Confidence: "high" = clearly supported, "medium" = reasonably supported but could be more specific, "low" = insufficient documentation.
4. Do NOT invent codes. If the note is vague, say what documentation is needed.

2024-2025 E&M GUIDELINES (AMA/CMS):
5. E/M level is determined by EITHER Medical Decision Making (MDM) OR Total Time — whichever supports the higher level.
6. MDM has THREE elements (level is determined by the HIGHEST 2 of 3):
   Element 1 - NUMBER AND COMPLEXITY OF PROBLEMS ADDRESSED:
     - Minimal: 1 self-limited/minor problem
     - Low: 2+ self-limited problems; OR 1 stable chronic illness; OR 1 acute uncomplicated illness
     - Moderate: 1+ chronic illness with mild exacerbation/progression; OR 2+ stable chronic illnesses; OR 1 undiagnosed new problem with uncertain prognosis; OR 1 acute illness with systemic symptoms
     - High: 1+ chronic illness with severe exacerbation/progression; OR 1 acute/chronic illness posing threat to life or bodily function
   Element 2 - AMOUNT AND COMPLEXITY OF DATA:
     - Minimal/None: minimal or no data reviewed
     - Limited: review/order of tests; review of prior external notes/records from each unique source; ordering of tests
     - Moderate: independent interpretation of tests; discussion of management with external physician; obtaining old records OR decision to obtain old records
     - Extensive: independent interpretation of tests performed by another physician; discussion with external physician AND documentation of who/when/findings
   Element 3 - RISK OF COMPLICATIONS, MORBIDITY, OR MORTALITY:
     - Minimal: minimal risk
     - Low: OTC drugs; minor surgery with no identified risk factors; PT/OT
     - Moderate: Rx drug management; decisions about minor surgery with identified risk factors; decisions about elective major surgery without risk factors; diagnosis or treatment significantly limited by social determinants of health
     - High: drugs requiring intensive monitoring; decision for emergency major surgery; decisions about hospitalization or escalation of care; drug therapy requiring intensive monitoring for toxicity; decision to not resuscitate
7. TIME-BASED ALTERNATIVE (total time on date of encounter, including non-face-to-face):
   New patient: 99202=15-29min, 99203=30-44min, 99204=45-59min, 99205=60-74min
   Established: 99212=10-19min, 99213=20-29min, 99214=30-39min, 99215=40-54min
   Prolonged: +99417 for each additional 15min beyond the highest level
8. For EACH MDM element, cite specific documentation supporting the assigned level.
9. Always show both the MDM-based AND time-based level if time is documented.

SPECIFICITY ANALYSIS:
10. Flag "unspecified" codes (ending in .9, .0, or similar) and suggest specific alternatives with what documentation is needed.

PUBLICATION CITATIONS:
11. Suggest relevant clinical literature for major diagnoses. Mark all "verified": false. Include PMID when known.

Respond ONLY with valid JSON. No markdown, no code fences.`;

export async function analyzeClinicalNote(noteText: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6144,
    system: cachedSystem(CLINICAL_SYSTEM),
    messages: [
      {
        role: "user",
        content: `Analyze this clinical note per 2024-2025 E&M guidelines. For every code, quote supporting text. Determine the E/M level using both MDM and time (if documented). Flag unspecified codes.

Clinical Note:
"""
${noteText}
"""

Respond with this exact JSON structure:
{
  "em_level": {
    "code": "E/M CPT code (e.g., 99214)",
    "description": "e.g., Established patient, moderate MDM",
    "patient_type": "new|established",
    "method": "mdm|time|both",
    "mdm_complexity": "straightforward|low|moderate|high",
    "mdm_elements": {
      "problems": {
        "level": "minimal|low|moderate|high",
        "detail": "specific problems addressed and why they map to this level"
      },
      "data": {
        "level": "minimal|limited|moderate|extensive",
        "detail": "specific data reviewed/ordered and why it maps to this level"
      },
      "risk": {
        "level": "minimal|low|moderate|high",
        "detail": "specific risk factors and management decisions"
      }
    },
    "time_based": {
      "documented_time": "total minutes if documented in the note, null if not",
      "time_based_code": "E/M code supported by time, null if time not documented",
      "activities": "time-based activities documented (counseling, care coordination, etc.)"
    },
    "rationale": "summary of why this E/M level is supported, referencing the 2 of 3 MDM rule",
    "could_support_higher": "what additional documentation would justify a higher level, or null if already at highest supported level",
    "documentation_gaps": ["specific gaps that weaken the E/M level claim"]
  },
  "icd10_codes": [
    {
      "code": "ICD-10-CM code",
      "description": "official description",
      "confidence": "high|medium|low",
      "supporting_text": "exact quote from note",
      "specificity_alert": null or {
        "issue": "why unspecified",
        "specific_alternatives": [
          {"code": "specific code", "description": "description", "documentation_needed": "what to add"}
        ]
      }
    }
  ],
  "cpt_codes": [
    {"code": "CPT code", "description": "description", "confidence": "high|medium|low", "supporting_text": "quote"}
  ],
  "documentation_suggestions": ["specific actionable suggestion"],
  "missing_elements": ["specific missing clinical element"],
  "references": [
    {"title": "Guideline name", "source": "source", "relevance": "how it applies"}
  ],
  "publication_citations": [
    {
      "condition": "diagnosis", "title": "title", "authors": "authors", "journal": "journal",
      "year": "year", "pmid": "PMID or null", "doi": "DOI or null",
      "type": "guideline|landmark_trial|systematic_review|meta_analysis|clinical_study",
      "relevance": "why relevant", "verified": false, "search_terms": "PubMed search terms"
    }
  ],
  "summary": "Brief overall assessment",
  "disclaimer": "For reference only. Verify with a certified coder. Codes and guidelines updated annually."
}`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}

// ── A/P Note Writer ────────────────────────────────────────────────

const AP_WRITER_SYSTEM = `You are an expert clinical documentation specialist who writes Assessment & Plan (A/P) sections that are medically accurate, thorough, and optimized for appropriate E&M coding per 2024-2025 guidelines.

YOUR GOAL: Given a skeleton outline (diagnoses, findings, labs, meds, etc.), generate a robust A/P section that:
1. Accurately reflects disease severity, acuity, and clinical complexity
2. Documents medical decision making (MDM) clearly to support the appropriate E/M level
3. Uses precise medical terminology and ICD-10-ready language
4. Addresses each problem systematically
5. Includes relevant differentials, clinical reasoning, and risk assessment
6. Documents data reviewed, tests ordered, and their interpretation
7. Captures risk: drug management decisions, surgical decisions, social determinants

DOCUMENTATION PRINCIPLES:
- For each problem: state the diagnosis with specificity (laterality, acuity, severity, stage, type)
- Document clinical status: stable, improving, worsening, exacerbation, progression
- Include "data reviewed" language: "Reviewed labs showing...", "Imaging demonstrates..."
- Document complexity: comorbid interactions, multiple treatment options considered, risk/benefit discussions
- Reference guidelines when appropriate: "Per AHA/ACC guidelines...", "Consistent with IDSA recommendations..."
- Include patient-specific factors: "Given patient's age, comorbidities, and current medications..."
- Document shared decision making when relevant: "Discussed risks and benefits with patient, who expressed preference for..."
- For chronic conditions: document monitoring plan, adjustment rationale, follow-up intervals

DO NOT fabricate clinical details not provided in the skeleton. If the skeleton is vague, ask for clarification in a "clarification_needed" field rather than inventing details.

Respond ONLY with valid JSON. No markdown, no code fences.`;

export async function generateAssessmentPlan(skeleton: string, encounterType: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6144,
    system: cachedSystem(AP_WRITER_SYSTEM),
    messages: [
      {
        role: "user",
        content: `Generate a robust Assessment & Plan from this skeleton. Encounter type: ${encounterType}.

Skeleton:
"""
${skeleton}
"""

Respond with this exact JSON structure:
{
  "assessment_and_plan": "The full A/P text, formatted with numbered problems. Each problem should include: diagnosis with specificity, clinical status, clinical reasoning, data interpretation, management plan, and follow-up.",
  "problems": [
    {
      "number": 1,
      "diagnosis": "specific diagnosis with ICD-10-ready language",
      "icd10_suggestion": "likely ICD-10 code",
      "status": "stable|improving|worsening|exacerbation|new|chronic",
      "severity": "mild|moderate|severe|critical",
      "assessment": "clinical reasoning and interpretation",
      "plan": "specific management steps",
      "data_referenced": "labs, imaging, tests referenced",
      "risk_factors": "drug interactions, surgical risk, comorbidity impact"
    }
  ],
  "supported_em_level": {
    "code": "E/M code this A/P would support",
    "mdm_complexity": "straightforward|low|moderate|high",
    "rationale": "why the A/P supports this level",
    "problems_level": "level for Element 1 (problems)",
    "data_level": "level for Element 2 (data)",
    "risk_level": "level for Element 3 (risk)"
  },
  "documentation_tips": [
    "specific tips to further strengthen the documentation"
  ],
  "clarification_needed": [
    "anything in the skeleton that was too vague and should be clarified for accurate documentation"
  ],
  "disclaimer": "This A/P is generated for documentation assistance only. The treating physician must review, modify, and sign the note. Clinical accuracy is the physician's responsibility."
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
