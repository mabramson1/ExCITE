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

const AP_WRITER_SYSTEM = `You are an expert clinical documentation specialist who writes Assessment & Plan (A/P) sections that are medically accurate, thorough, and optimized for appropriate E&M coding per 2024-2025 AMA/CMS guidelines.

YOUR GOAL: Given a skeleton outline, generate a robust A/P that:
1. Accurately reflects disease severity, acuity, and clinical complexity
2. Documents medical decision making (MDM) to support the HIGHEST APPROPRIATE E/M level
3. Uses precise medical terminology and ICD-10-ready language
4. Addresses each problem systematically
5. Includes clinical reasoning, data interpretation, and risk assessment
6. Captures risk: drug management, surgical decisions, escalation of care

DOCUMENTATION PRINCIPLES:
- For each problem: state diagnosis with specificity (laterality, acuity, severity, stage, type)
- Document clinical status: stable, improving, worsening, exacerbation, progression
- Include "data reviewed" language: "Reviewed labs showing...", "Imaging demonstrates..."
- Document complexity: comorbid interactions, multiple treatment options, risk/benefit discussions
- Reference guidelines: "Per AHA/ACC guidelines...", "Consistent with IDSA recommendations..."
- Include patient-specific factors: "Given patient's age, comorbidities, and current medications..."
- Document shared decision making: "Discussed risks and benefits with patient..."
- For chronic conditions: monitoring plan, adjustment rationale, follow-up intervals

2024-2025 E&M LEVEL DETERMINATION - YOU MUST USE THESE RULES EXACTLY:
E/M level is determined by MDM. MDM level = highest 2 of 3 elements.

ELEMENT 1 - PROBLEMS ADDRESSED (use the HIGHEST that applies):
- Minimal: 1 self-limited/minor problem (e.g., cold, insect bite)
- Low: 2+ self-limited problems; OR 1 stable chronic illness; OR 1 acute uncomplicated illness
- Moderate: 1+ chronic illness with mild exacerbation/progression/side effects; OR 2+ stable chronic illnesses; OR 1 undiagnosed new problem with uncertain prognosis; OR 1 acute illness with systemic symptoms; OR 1 acute complicated injury
- High: 1+ chronic illness with SEVERE exacerbation, progression, or side effects of treatment; OR 1 acute/chronic illness or injury that POSES THREAT TO LIFE OR BODILY FUNCTION

ELEMENT 2 - DATA REVIEWED/ORDERED:
- Minimal: minimal or no data
- Limited: review/order of tests; OR review of prior external notes from each unique source
- Moderate: independent interpretation of test performed by another physician; OR discussion of management with external physician; OR obtaining old records
- Extensive: independent interpretation of test by another physician WITH discussion of management with external physician

ELEMENT 3 - RISK (use the HIGHEST that applies):
- Minimal: minimal risk of morbidity
- Low: OTC drug management; minor surgery with no risk factors; PT/OT
- Moderate: Prescription drug management; decisions about minor surgery with risk factors; decisions about elective major surgery without risk factors; diagnosis/treatment significantly limited by social determinants
- High: Drug therapy requiring intensive monitoring for toxicity; decision regarding emergency major surgery; decisions regarding hospitalization or ESCALATION OF HOSPITAL-LEVEL CARE (including decisions about dialysis, ICU, hospice); drug therapy requiring intensive monitoring; parenteral controlled substances

CRITICAL E/M CALIBRATION RULES:
- A condition that POSES THREAT TO LIFE OR BODILY FUNCTION = HIGH problems (e.g., dangerous hyperkalemia, ESRD progression, sepsis, acute MI, stroke, severe exacerbation of any chronic illness)
- Decision to initiate DIALYSIS or prepare for dialysis = HIGH risk (escalation of care)
- Discontinuing medication due to dangerous side effects = at least MODERATE risk
- Starting medication that requires lab monitoring = MODERATE risk
- Multiple interacting chronic conditions where management of one affects another = at least MODERATE problems
- Do NOT under-level. If the clinical scenario involves life-threatening conditions, the MDM is HIGH.

ESTABLISHED PATIENT E/M CODES (2024-2025):
- 99211: May not require physician presence
- 99212: Straightforward MDM
- 99213: Low MDM
- 99214: Moderate MDM
- 99215: High MDM

NEW PATIENT E/M CODES (2024-2025):
- 99202: Straightforward MDM
- 99203: Low MDM
- 99204: Moderate MDM
- 99205: High MDM

DO NOT fabricate clinical details not in the skeleton. If vague, list in "clarification_needed."

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
  "assessment_and_plan": "The full A/P text, formatted with numbered problems. Each problem should include: diagnosis with specificity, clinical status, clinical reasoning, data interpretation, management plan, and follow-up. At the very end, include the E&M attestation statement (the em_statement below) as the final paragraph.",
  "em_statement": "A ready-to-copy E&M attestation statement for the note. Format: 'Medical decision making for this [encounter type] visit is [complexity level] based on [# problems] problem(s) addressed including [list key problems with severity], [data element summary], and [risk summary including specific management decisions]. This encounter supports CPT [code].' Make it specific to the actual clinical content — not generic.",
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
    "code": "E/M CPT code (e.g., 99215 for established patient with HIGH MDM)",
    "mdm_complexity": "straightforward|low|moderate|high",
    "rationale": "Explain the 2-of-3 rule: which 2 elements are at the determining level and why",
    "problems_level": "minimal|low|moderate|high",
    "problems_justification": "Cite specific conditions from the A/P that justify this level. E.g., 'CKD stage 5 with progression and dangerous hyperkalemia = threat to life = HIGH'",
    "data_level": "minimal|limited|moderate|extensive",
    "data_justification": "Cite specific data reviewed/ordered. E.g., 'Reviewed CMP, trended creatinine, reviewed EKG = MODERATE'",
    "risk_level": "minimal|low|moderate|high",
    "risk_justification": "Cite specific risk factors. E.g., 'Decision to escalate to dialysis preparation + discontinuing ARB due to dangerous hyperkalemia = HIGH'"
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

const DEAI_SYSTEM_BASE = `You are an expert editor who transforms AI-generated text into authentic, human-sounding prose. You are calibrated for the 2025-2026 generation of large language models (GPT-5, Claude 4.x, Gemini 2.x, Llama 4+). Older "delve/tapestry/intricate" tells are rarer in modern outputs — the newer tells are structural and rhetorical.

═══════════════════════════════════════════════
MODERN 2025-2026 AI PATTERNS TO FIX
═══════════════════════════════════════════════

STRUCTURAL TELLS (most reliable in 2026):
- Em-dash abuse: em-dashes used as breath marks every few sentences (—)
- "Not X — Y" / "It's not just X — it's Y" / "X isn't about Y. It's about Z" construction
- Triadic parallelism: three parallel items in a row (e.g., "faster, cheaper, smarter")
- Bolded key phrases scattered through prose for emphasis
- Section headers, bullet points, or numbered lists in contexts that don't call for them
- Rhetorical question → immediate answer: "What does this mean? It means..."
- Paragraph rhythm is metronomic — every paragraph 2-4 sentences, same shape
- Perfectly balanced pro/con, before/after, one-hand/other-hand structure
- TL;DR or "Bottom line:" summary suffixes
- "Here's why:" → bulleted list
- Section-header vibes even in conversational prose

RHETORICAL TELLS (very common in 2026 outputs):
- Opening adverbs: "Importantly," "Crucially," "Notably," "Fundamentally," "Essentially,"
- Pivot phrases: "Here's the thing:" / "Here's what's fascinating:" / "Here's what matters:"
- Framing phrases: "At its core," "Ultimately," "The real question is," "Let's unpack this"
- Directive openers: "Let me be direct:" / "Let's be honest:" / "Here's the truth:"
- Analogical framing: "Think of it like X" / "It's like X, but for Y"
- Beauty/elegance filler: "That's the beauty of X" / "That's what makes this so powerful"
- Hollow intensifiers: "genuinely," "truly," "remarkably," "deeply"
- False scaling: "massively," "radically," "fundamentally transform," "completely reshape"

LEXICAL TELLS (still present, less reliable than structural):
- "delve," "utilize," "leverage," "facilitate," "paramount," "tapestry," "landscape,"
  "multifaceted," "intricate," "nuanced," "thoughtful," "meaningful"
- "dive deeper," "double down," "unpack," "lean into," "wrap your head around"
- Corporate adjectives: "robust," "seamless," "actionable," "scalable"

HEDGING/HEADS-OF-STATE TELLS:
- "It's important to note that..." / "It's worth mentioning..."
- "While there are many ways to approach this..."
- "In today's rapidly evolving landscape..."
- Conclusion that restates every earlier point
- Excessive balance: every claim gets a counterclaim

═══════════════════════════════════════════════
SIGNS THIS MIGHT BE HUMAN (preserve these!)
═══════════════════════════════════════════════
- Minor typos, inconsistent capitalization of entities
- Sentence fragments. Incomplete thoughts —
- Dated specifics (real people, dates, places)
- Strong opinion with emotional residue
- Weird word choices that feel personal
- Tangents, asides, self-correction
- Dry humor, sarcasm, swearing (where appropriate)
- Inconsistent formality

DO NOT fabricate any of those if they're absent — only preserve what's there.

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

const DETECTOR_SYSTEM = `You are an expert at analyzing text for AI-generated patterns, calibrated for the 2025-2026 generation of large language models (GPT-5, Claude 4.x, Gemini 2.x, Llama 4+). You provide honest, nuanced, calibrated assessments. Older tells like "delve/tapestry/intricate" are now rare — modern LLMs have cleaned up lexical fingerprints, so STRUCTURAL and RHETORICAL patterns are the more reliable signals in 2026.

═══════════════════════════════════════════════
CALIBRATION RULES
═══════════════════════════════════════════════
1. Be CALIBRATED. Not everything is AI-generated. Human writing can be formal, clean, and structured.
2. Consider four possibilities: (a) entirely human, (b) entirely AI, (c) human draft with AI polish, (d) AI draft with heavy human editing.
3. A single tell rarely means AI. Look for CLUSTERS of signals.
4. Short text (< 200 words) is inherently hard to classify — cap confidence around 0.7 unless the signals are overwhelming.
5. Domain-specific writing (academic, legal, medical) is often structured; don't over-penalize structure alone.
6. Scores near 0.5 are valid when uncertain. Do not force a verdict.

═══════════════════════════════════════════════
MODERN 2025-2026 AI SIGNALS (primary detectors)
═══════════════════════════════════════════════

STRUCTURAL (strongest tells in 2026):
- Em-dash density unusually high — em-dashes used as breath marks every 2-3 sentences
- "Not X — Y" / "It's not just X, it's Y" / "X isn't about Y. It's about Z" rhetorical construction
- Triadic parallelism: three parallel items ("faster, cheaper, smarter"; "for X, for Y, for Z")
- Bolded key phrases sprinkled in short prose
- Bullet points, numbered lists, or section headers where plain prose would be natural
- Metronomic paragraph rhythm: every paragraph same length/shape
- Rhetorical question immediately answered ("What does this mean? It means...")
- Perfectly balanced structure: pro/con, before/after, hand/other-hand
- TL;DR / Bottom line / Key takeaway suffix
- "Here's why:" → list pattern

RHETORICAL (very characteristic of modern LLMs):
- Adverbial openers: "Importantly," "Crucially," "Notably," "Fundamentally," "Essentially,"
- Pivot phrases: "Here's the thing," "Here's what's fascinating," "Here's what matters"
- Framing: "At its core," "Ultimately," "The real question is," "Let's unpack this"
- Directive openers: "Let me be direct," "Let's be honest," "Here's the truth"
- Analogical framing: "Think of it like X" / "It's like X, but for Y"
- "That's the beauty of X" / "That's what makes this powerful"
- Hollow intensifiers: "genuinely," "truly," "remarkably," "deeply"
- False scaling: "massively," "radically," "completely transform"

LEXICAL (still present, weaker signal than in 2023-2024):
- "delve," "utilize," "leverage," "facilitate," "paramount," "tapestry,"
  "landscape," "multifaceted," "intricate," "nuanced," "thoughtful"
- "dive deeper," "double down," "unpack," "lean into"
- Corporate adjectives: "robust," "seamless," "actionable," "scalable"

STATISTICAL:
- Unusually low sentence-length variance (burstiness near zero)
- Zero typos, perfect punctuation, perfectly consistent entity capitalization in long text
- Vocabulary uniformity — no unusual word choices
- Suspiciously comprehensive coverage that touches every obvious angle

═══════════════════════════════════════════════
HUMAN SIGNALS (raise probability of human authorship)
═══════════════════════════════════════════════
- Typos, minor grammar slips, inconsistent capitalization of the same entity
- Sentence fragments used naturally. Self-correction mid-thought.
- Dated specifics: real people, places, dates, prices
- Strong opinion with emotional residue; mild profanity where it fits
- Idiosyncratic word choices that feel personal
- Tangents, asides, parenthetical digressions
- Dry humor, sarcasm, deadpan
- Inconsistent formality within the same piece
- Domain jargon used naturally (not over-explained)

═══════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════
7. SENTENCE-LEVEL ANALYSIS: score EVERY sentence for AI probability individually.
8. When suggesting rewrites, make the MINIMUM change needed to fix the specific AI tell — do not reword everything.
9. Populate patterns_detected with the SPECIFIC pattern names from the taxonomy above (e.g., "em-dash abuse", "triadic parallelism", "rhetorical question", "adverbial opener", "not-X-but-Y construction").

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
