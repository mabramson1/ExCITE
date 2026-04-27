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

export async function generateAssessmentPlan(
  skeleton: string,
  encounterType: string,
  options?: { voiceSample?: string; brevity?: string; customTemplate?: string }
): Promise<string> {
  let userMessage = "";

  if (options?.voiceSample) {
    userMessage += `VOICE CALIBRATION: The physician provided a sample of their own clinical writing. Match their documentation style — sentence structure, abbreviation patterns, level of detail, and phrasing habits — so the A/P sounds like THEM.

Writing sample:
"""
${options.voiceSample}
"""

`;
  }

  if (options?.brevity === "brief") {
    userMessage += `BREVITY MODE: Write a CONCISE A/P. Use short sentences, standard abbreviations (HTN, DM2, CKD, etc.), minimal prose. Each problem: 2-3 sentences max. Skip filler phrases. This is for a physician who wants documentation-ready bullet-style notes, not narrative paragraphs.\n\n`;
  } else if (options?.brevity === "detailed") {
    userMessage += `DETAILED MODE: Write a THOROUGH narrative A/P with full clinical reasoning. Explain decision-making, reference relevant guidelines, discuss differential diagnoses where applicable, and provide comprehensive follow-up plans.\n\n`;
  }

  if (options?.customTemplate) {
    userMessage += `CUSTOM TEMPLATE: The physician provided their own note template with {{placeholders}}. You MUST use this exact template structure and fill in every placeholder with appropriate clinical content from the skeleton. Keep ALL text outside placeholders exactly as-is. If a placeholder has no corresponding data in the skeleton, write "[not provided]" rather than fabricating data.

Template:
"""
${options.customTemplate}
"""

Fill in this template using the skeleton below. The "assessment_and_plan" field in your response should be the completed template with all placeholders filled in.

`;
  }

  userMessage += `Generate a robust Assessment & Plan from this skeleton. Encounter type: ${encounterType}.

Skeleton:
"""
${skeleton}
"""`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6144,
    system: cachedSystem(AP_WRITER_SYSTEM),
    messages: [
      {
        role: "user",
        content: userMessage + `

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

// ── Prior Authorization Letter ────────────────────────────────────

const PRIOR_AUTH_SYSTEM = `You are a clinical documentation specialist who writes compelling prior authorization and appeal letters. Your letters are medically precise, cite relevant clinical guidelines, and clearly establish medical necessity.

YOUR GOAL: Given a clinical skeleton, procedure, and diagnosis, generate a prior authorization letter that:
1. Presents patient clinical information clearly and concisely
2. Establishes medical necessity with specific clinical evidence
3. Cites relevant clinical practice guidelines (AHA/ACC, NCCN, ACR, IDSA, etc.)
4. References supporting diagnostic data from the clinical skeleton
5. Requests expedited review when clinically appropriate
6. Uses professional, persuasive language appropriate for payer review

LETTER STRUCTURE:
- Opening: patient identification, requested procedure, and diagnosis
- Clinical summary: relevant history, current status, failed treatments
- Medical necessity: why this procedure is required for this patient
- Guidelines: specific clinical guidelines supporting the procedure
- Supporting data: labs, imaging, exam findings that support the request
- Conclusion: clear request with urgency if appropriate

Respond ONLY with valid JSON. No markdown, no code fences.`;

export async function generatePriorAuthLetter(
  skeleton: string,
  procedure: string,
  diagnosis: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6144,
    system: cachedSystem(PRIOR_AUTH_SYSTEM),
    messages: [
      {
        role: "user",
        content: `Generate a prior authorization/appeal letter for the following:

Procedure requested: ${procedure}
Diagnosis: ${diagnosis}

Clinical skeleton:
"""
${skeleton}
"""

Respond with this exact JSON structure:
{
  "letter": "The full prior authorization letter text, formatted professionally with appropriate headers, paragraphs, and a formal closing.",
  "guidelines_cited": ["Specific clinical guideline 1 (e.g., 2024 AHA/ACC Guidelines for...)", "Specific clinical guideline 2"],
  "key_arguments": ["Key medical necessity argument 1", "Key medical necessity argument 2", "Key medical necessity argument 3"]
}`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}

// ── Discharge Summary ────────────────────────────────────────────

const DISCHARGE_SUMMARY_SYSTEM = `You are a clinical documentation specialist who writes thorough, well-organized hospital discharge summaries. Your summaries are comprehensive, accurate, and follow standard hospital discharge documentation practices.

YOUR GOAL: Given a clinical skeleton and admission reason, generate a discharge summary that:
1. Clearly states the admission diagnosis and reason for hospitalization
2. Provides a concise but complete hospital course narrative
3. Lists all procedures performed during the admission
4. Documents discharge medications with clear notation of any changes from admission
5. Specifies follow-up appointments and instructions
6. Lists any pending results the outpatient team should follow up on
7. Provides clear return-to-ED precautions (warning signs)

DOCUMENTATION PRINCIPLES:
- Use precise medical terminology
- Clearly distinguish new medications from continued/changed medications
- Provide specific follow-up timeframes
- List actionable, patient-understandable warning signs
- Include relevant lab trends and clinical trajectory

Respond ONLY with valid JSON. No markdown, no code fences.`;

export async function generateDischargeSummary(
  skeleton: string,
  admitReason: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6144,
    system: cachedSystem(DISCHARGE_SUMMARY_SYSTEM),
    messages: [
      {
        role: "user",
        content: `Generate a hospital discharge summary for the following:

Admission reason: ${admitReason}

Clinical skeleton:
"""
${skeleton}
"""

Respond with this exact JSON structure:
{
  "summary": "The full discharge summary text, formatted with standard sections: Admission Diagnosis, Hospital Course, Procedures, Discharge Condition, Discharge Instructions.",
  "discharge_medications": [
    {
      "name": "Medication name",
      "dose": "Dose and frequency",
      "instructions": "Special instructions (e.g., take with food, monitor blood pressure)",
      "is_new": true
    }
  ],
  "follow_up": ["Follow-up appointment 1 with timeframe", "Follow-up appointment 2 with timeframe"],
  "pending_results": ["Pending result 1 with expected timeframe", "Pending result 2"],
  "return_precautions": ["Warning sign 1 that should prompt return to ED", "Warning sign 2"]
}`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}

// ── Referral Letter ──────────────────────────────────────────────

const REFERRAL_LETTER_SYSTEM = `You are a clinical documentation specialist who writes clear, professional referral letters. Your letters concisely communicate the clinical picture and specific questions for the consulting specialist.

YOUR GOAL: Given a clinical skeleton, specialist type, and reason for referral, generate a referral letter that:
1. Provides a concise clinical summary relevant to the referral
2. Clearly states the reason for referral with specific clinical questions
3. Summarizes relevant history and current management
4. Documents what has been tried and failed or why escalation is needed
5. Conveys appropriate urgency
6. Includes relevant diagnostic data

LETTER STRUCTURE:
- Opening: referring physician context and reason for referral
- Clinical summary: relevant history, current diagnoses, pertinent findings
- Current management: medications, treatments, and their outcomes
- Failed interventions: what has been tried and why it was insufficient
- Specific questions: clear, answerable questions for the specialist
- Urgency assessment: routine, urgent, or emergent with justification

Respond ONLY with valid JSON. No markdown, no code fences.`;

export async function generateReferralLetter(
  skeleton: string,
  referTo: string,
  reason: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6144,
    system: cachedSystem(REFERRAL_LETTER_SYSTEM),
    messages: [
      {
        role: "user",
        content: `Generate a referral letter for the following:

Refer to: ${referTo}
Reason for referral: ${reason}

Clinical skeleton:
"""
${skeleton}
"""

Respond with this exact JSON structure:
{
  "letter": "The full referral letter text, formatted professionally with appropriate sections and a formal closing.",
  "specific_questions": ["Specific clinical question 1 for the specialist", "Specific clinical question 2"],
  "urgency": "routine|urgent|emergent"
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

// ── Peer Review Response Generator ────────────────────────────────

const REVIEW_RESPONSE_SYSTEM = `You are an expert academic writing advisor who helps authors craft professional, effective responses to peer review comments. You have deep experience across scientific disciplines and understand the conventions of the peer review process.

YOUR ROLE:
1. Parse each reviewer comment or question from the provided reviewer feedback.
2. For each comment, generate:
   - A professional, respectful response
   - Whether the comment requires a revision (manuscript change needed), clarification (explain existing content), or rebuttal (respectfully disagree with evidence)
   - Suggested specific text changes if a revision is needed
3. Maintain a constructive, grateful tone even when addressing critical or unfair reviews.
4. Format the output as a structured point-by-point response letter suitable for journal submission.

TONE GUIDELINES:
- Always thank reviewers for their time and insight
- Acknowledge valid criticisms directly
- For rebuttals, cite evidence or methodology justification — never be dismissive
- Use phrases like "We appreciate this observation," "We agree and have revised," "We respectfully note that..."
- Avoid defensive or adversarial language

Respond ONLY with valid JSON. No markdown, no code fences.`;

export async function generateReviewResponse(
  manuscript: string,
  reviewerComments: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6144,
    system: cachedSystem(REVIEW_RESPONSE_SYSTEM),
    messages: [
      {
        role: "user",
        content: `Analyze the following peer review comments in the context of the manuscript provided. Generate a professional point-by-point response letter.

Manuscript:
"""
${manuscript}
"""

Reviewer Comments:
"""
${reviewerComments}
"""

Respond with this exact JSON structure:
{
  "response_letter": "The full formatted response letter text, ready to submit to the journal",
  "responses": [
    {
      "reviewer_comment": "The original comment",
      "response_type": "revision" | "clarification" | "rebuttal",
      "response": "The author's response",
      "manuscript_change": "Specific text change if applicable, or null"
    }
  ],
  "summary_of_changes": ["List of all changes made to the manuscript"],
  "thank_you_note": "Opening thank-you paragraph for the response letter"
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
29 AI WRITING PATTERNS TO FIX (2025-2026)
═══════════════════════════════════════════════

── STRUCTURAL PATTERNS ──

1. Em-dash abuse: em-dashes used as breath marks every few sentences (—)
2. "Not X — Y" constructions: "It's not just X — it's Y" / "X isn't about Y. It's about Z"
3. Triadic parallelism: three parallel items in a row ("faster, cheaper, smarter")
4. Rhetorical question → immediate answer: "What does this mean? It means..."
5. Metronomic paragraph rhythm: every paragraph 2-4 sentences, same shape
6. Perfectly balanced structure: pro/con, before/after, one-hand/other-hand symmetry
7. Boldface/inline-header overuse: bolded key phrases scattered through prose, section headers and bullet points in contexts that don't call for them
8. Formulaic challenges: "Despite challenges...continues to thrive" / "While not without its limitations..."

── RHETORICAL PATTERNS ──

9. Opening adverbs: "Importantly," "Crucially," "Notably," "Fundamentally," "Essentially,"
10. Pivot phrases: "Here's the thing:" / "Here's what's fascinating:" / "Here's what matters:"
11. Analogical framing: "Think of it like X" / "It's like X, but for Y"
12. Beauty/elegance filler: "That's the beauty of X" / "That's what makes this so powerful"
13. Hollow intensifiers: "genuinely," "truly," "remarkably," "deeply"
14. False scaling: "massively," "radically," "fundamentally transform," "completely reshape"
15. Significance inflation: "pivotal moment in evolution," "groundbreaking," "revolutionary," "game-changing" for ordinary things
16. Persuasive authority tropes: "At its core, what matters is..." / "The real question is..." / "Let me be direct:"
17. Signposting announcements: "Let's dive in," "Here's what you need to know," "Let's unpack this," "Here's why:"

── LEXICAL PATTERNS ──

18. Classic AI vocabulary: "delve," "utilize," "leverage," "facilitate," "paramount," "tapestry," "landscape," "multifaceted," "intricate," "nuanced," "thoughtful," "meaningful"
19. Corporate adjectives: "robust," "seamless," "actionable," "scalable," "cutting-edge"
20. Promotional language: "breathtaking," "nestled," "stunning," "captivating," "remarkable"
21. Copula avoidance: using "serves as" or "boasts" instead of "is" or "has"; unnecessarily fancy verb substitutions
22. Synonym cycling: restating the same idea with different words across consecutive sentences instead of advancing the argument
23. Hyphenated compound pairs overuse: "cross-functional," "data-driven," "client-facing," "purpose-built," "solution-oriented"

── CONTENT PATTERNS ──

24. Notability name-dropping: listing publications/institutions for authority instead of citing specific claims or evidence
25. Superficial -ing analyses: overuse of "symbolizing," "reflecting," "showcasing," "highlighting" as shallow analysis stand-ins
26. Vague attributions: "Experts believe..." / "Studies show..." / "Research suggests..." without specifics
27. False ranges: unrelated topics presented as a connected list or spectrum

── COMMUNICATION PATTERNS ──

28. Hedging & filler: "It's important to note that..." / "In order to" / "Due to the fact that" / "could potentially possibly" / excessive balance where every claim gets a counterclaim
29. Chatbot artifacts & tone: "I hope this helps! Let me know if..." / "Great question!" / sycophantic openers / cutoff disclaimers ("While details are limited in available sources...") / generic conclusions ("The future looks bright") / passive voice subjectless fragments ("No configuration needed")

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

export async function deAiifyText(text: string, writingStyle = "general", voiceSample?: string): Promise<string> {
  const styleName = writingStyle.replace(/-/g, " ");

  let userMessage = "";

  if (voiceSample) {
    userMessage += `VOICE CALIBRATION: The user provided a sample of their own writing. Analyze their sentence rhythm, word choices, punctuation habits, and quirks. Apply these patterns to the rewrite so the output sounds like THEM, not like generic human writing.

Voice sample:
"""
${voiceSample}
"""

`;
  }

  userMessage += `Rewrite this text for the "${styleName}" style using a 2-PASS process. Preserve all meaning and factual content exactly.

PASS 1: Rewrite the text, eliminating all 29 identified AI patterns.
PASS 2: Audit your Pass 1 rewrite for any lingering AI-isms — subtle structural habits, residual hedging, synonym cycling, metronomic rhythm, etc. Fix every issue you find.

Return the final (Pass 2) text as "rewritten_text" and list any issues you caught during the audit in "first_pass_issues".

Text:
"""
${text}
"""

Respond with this exact JSON structure:
{
  "rewritten_text": "final text after both passes",
  "first_pass_issues": ["issues found in initial rewrite during audit"],
  "changes_made": [
    {"original": "AI-sounding phrase", "replacement": "human-sounding replacement", "reason": "specific pattern fixed"}
  ],
  "ai_patterns_found": ["specific pattern 1", "specific pattern 2"],
  "confidence_score": 0.85,
  "style_applied": "${styleName}"
}

confidence_score: 1.0 = definitely human, 0.0 = still obviously AI. Be honest.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: cachedSystem(getDeAiSystem(writingStyle)),
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}

// ── Manuscript Writer ─────────────────────────────────────────────

const MANUSCRIPT_WRITER_SYSTEM = `You are an expert academic and medical writer. Given raw notes, bullet points, outlines, or rough paragraphs, you produce a polished, well-structured manuscript ready for journal submission.

RULES:
1. Transform disorganized input into a coherent, logical narrative
2. Maintain all factual content from the input — never fabricate data or results
3. Use appropriate academic tone and structure
4. If citations are requested, suggest where citations would strengthen the text and provide real search terms for PubMed verification (NEVER fabricate specific citations)
5. Follow the requested manuscript format (IMRAD, case report, review, essay, etc.)
6. Preserve any specific data, numbers, or statistics from the input exactly

MANUSCRIPT STRUCTURE:
- Title (concise, descriptive)
- Abstract (structured: Background, Methods, Results, Conclusions — or unstructured depending on format)
- Sections appropriate to the format
- References section (if citations enabled)

Respond ONLY with valid JSON. No markdown, no code fences.`;

export async function generateManuscript(
  input: string,
  options: {
    format?: string;
    citationsEnabled?: boolean;
    citationStyle?: string;
    brevity?: string;
    voiceSample?: string;
  }
): Promise<string> {
  const format = options.format || "imrad";
  let userMessage = "";

  if (options.voiceSample) {
    userMessage += `VOICE CALIBRATION: The author provided a sample of their own academic writing. Match their writing style — sentence structure, vocabulary preferences, level of detail, and phrasing habits — so the manuscript sounds like THEM.

Writing sample:
"""
${options.voiceSample}
"""

`;
  }

  if (options.brevity === "brief") {
    userMessage += `BREVITY MODE: Write a CONCISE manuscript. Use short sentences, minimize prose. Keep each section focused and tight. Avoid filler phrases and unnecessary elaboration.\n\n`;
  } else if (options.brevity === "comprehensive") {
    userMessage += `COMPREHENSIVE MODE: Write a THOROUGH narrative manuscript with full detail. Expand on reasoning, provide context, discuss implications, and create a rich academic narrative.\n\n`;
  }

  if (options.citationsEnabled) {
    userMessage += `Write a ${format} manuscript from these raw notes. Include citations formatted in ${options.citationStyle || "apa"} style. For each citation, provide PubMed search terms for verification. Mark citations as [Citation needed: search terms] inline.`;
  } else {
    userMessage += `Write a ${format} manuscript from these raw notes. Do not include citations.`;
  }

  userMessage += `

Raw input:
"""
${input}
"""

Respond with this exact JSON structure:
{
  "title": "manuscript title",
  "abstract": "structured or unstructured abstract",
  "sections": [
    { "heading": "Introduction", "content": "section content..." },
    { "heading": "Methods", "content": "..." }
  ],
  "citations": [
    { "inline_marker": "[1]", "search_terms": "PubMed search query", "context": "what the citation supports" }
  ],
  "word_count": 1500,
  "format_used": "IMRAD",
  "suggestions": ["improvement suggestions for the author"]
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: cachedSystem(MANUSCRIPT_WRITER_SYSTEM),
    messages: [
      {
        role: "user",
        content: userMessage,
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
