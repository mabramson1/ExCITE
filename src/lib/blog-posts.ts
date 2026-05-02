export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  content: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "ai-clinical-documentation-2026",
    title: "AI in Clinical Documentation: What's Changed in 2026",
    description:
      "The landscape of AI-assisted clinical documentation has shifted dramatically. Here's what clinicians need to know about the current state of AI note-writing, coding assistance, and compliance.",
    date: "2026-04-28",
    readTime: "6 min",
    category: "Clinical",
    content: `The conversation around AI in clinical documentation has matured significantly since the early GPT-era hype of 2023-2024. Two years later, the tools are better, the expectations are more realistic, and the regulatory landscape is clearer.

## What actually works now

**Assessment & Plan generation** has become the breakout use case. Clinicians paste a skeleton outline — chief complaint, vitals, labs, med list — and get a structured A/P with ICD-10 codes, E/M level determination, and medication recommendations. The key insight: AI doesn't replace clinical judgment, it handles the documentation burden.

The 2024-2025 AMA/CMS E/M guidelines introduced Medical Decision Making (MDM) as the primary leveling method, with three elements: problem complexity, data reviewed, and risk. AI tools that understand these guidelines can suggest appropriate E/M levels and flag documentation gaps — saving coders and clinicians hours per week.

**Prior authorization letters** are another high-impact area. The back-and-forth with insurers over medical necessity is time-consuming and formulaic. AI can draft compelling letters that cite relevant clinical guidelines, saving 20-30 minutes per letter.

## What still needs human oversight

ICD-10 and CPT coding suggestions should always be verified. AI coding tools have improved dramatically, but they can still suggest overly specific codes when documentation is vague, or miss nuances like laterality and episode of care. The best tools now flag low-confidence suggestions explicitly rather than guessing.

Drug interactions, dosing recommendations, and clinical decision support are areas where AI should assist, never decide. The liability landscape for AI-generated clinical advice is still evolving, and most malpractice carriers haven't fully clarified their position.

## The PHI question

The biggest barrier to adoption remains data privacy. HIPAA doesn't prohibit using AI for clinical documentation, but it does require that Protected Health Information (PHI) be handled appropriately. The safest approach is client-side redaction — stripping identifiers before text ever leaves the clinician's device, then re-injecting them locally when displaying results.

This approach means the AI never sees patient names, MRNs, dates of birth, or other identifiers. It processes the clinical content (age, vitals, labs, medications, diagnoses) that it needs for accurate coding and documentation, while the PHI stays on the clinician's machine.

## What to look for in a tool

When evaluating AI documentation tools in 2026, consider:

- **Does it explain its coding decisions?** Good tools cite specific documentation supporting each ICD-10 and CPT code, not just output a code list.
- **How does it handle PHI?** Client-side redaction is the gold standard. If the tool sends full clinical notes to an API without redaction, that's a red flag.
- **Does it support current guidelines?** E/M coding changes annually. Tools stuck on 2023 guidelines will suggest incorrect levels.
- **Can you verify the output?** AI-generated documentation should be editable, not a black box. Clinicians need to review and sign off.

The future of clinical documentation isn't about replacing physicians — it's about giving them back the time they currently spend on paperwork. The tools are ready. The question is whether your workflow is.`,
  },
  {
    slug: "ai-detection-what-works",
    title: "AI Detection in 2026: What Actually Works (and What Doesn't)",
    description:
      "Single-detector tools are unreliable. Multi-source consensus is the only approach that produces actionable results. Here's why, and how to interpret AI detection scores.",
    date: "2026-04-22",
    readTime: "7 min",
    category: "AI Detection",
    content: `If you've tried to detect AI-generated text in the past year, you've probably been frustrated. Individual detectors give wildly different results. A passage that one tool calls "95% AI" another calls "30% human." What's going on?

## Why single detectors fail

Modern large language models (LLMs) have cleaned up the obvious tells. In 2023, you could spot AI text by looking for "delve," "tapestry," "multifaceted," and similar lexical fingerprints. Today's models have been specifically trained to avoid these patterns. The detectable signals have shifted from word choice to structure and rhetoric.

Structural patterns that remain detectable include:

- **Metronomic sentence rhythm** — AI tends to produce sentences of similar length and complexity
- **Hedging clusters** — phrases like "it is important to note," "it is worth mentioning," "one could argue" appear in predictable patterns
- **Symmetric parallelism** — AI loves balanced lists and matched sentence structures
- **Topic sentence dependency** — nearly every paragraph starts with a thesis statement followed by supporting evidence
- **Absence of first-person uncertainty** — real writers say "I think" and "I'm not sure"; AI rarely does

But these patterns are subtle enough that no single detector reliably catches them all. Each detector has its own blind spots and biases.

## The consensus approach

The solution is multi-source consensus — running text through multiple independent detection engines and averaging their results. This works for the same reason that ensemble methods work in machine learning: individual classifiers have uncorrelated errors, so their average is more accurate than any one of them.

A practical consensus system might combine:

1. **A deep pattern analyzer** that examines structural and rhetorical patterns at the sentence level
2. **Sapling** — a commercial detector trained on modern LLM outputs
3. **Pangram** — another independent commercial detector with different training data
4. **Local heuristic analysis** — statistical measures like vocabulary diversity (MTLD), burstiness, sentence length variance, and punctuation patterns

Weighting matters. A deep analysis from a capable model deserves more weight (60%) than the average of external detectors (40%), because it can reason about context rather than just pattern-matching.

## How to interpret scores

AI detection scores are probabilities, not verdicts. Here's a practical guide:

- **0-30% (likely human):** The text shows enough irregular, human-like patterns that AI authorship is unlikely. Note: heavily edited AI text can fall here too.
- **30-55% (possibly AI):** Ambiguous zone. Could be AI-assisted writing, heavily edited AI output, or formulaic human writing. Don't make decisions based on this range alone.
- **55-80% (likely AI):** Multiple structural patterns consistent with AI generation. Worth investigating, but not proof.
- **80-100% (almost certainly AI):** Strong consensus across multiple signals. Very unlikely to be false positive for naturally written text.

## What detection can't do

AI detection cannot:
- Prove authorship with legal certainty
- Distinguish between "written by AI" and "written by a human who writes like AI"
- Handle short texts (under 150 words) reliably
- Detect AI text that has been substantially rewritten by a human

Detection is a screening tool, not a judge. Use it to flag text for human review, not to make automated decisions about academic integrity or content authenticity.

## The compliance angle

For institutions that need documentation — medical schools, journals, grant agencies — a multi-source detection report with specific scores, methodology, and caveats is far more defensible than a single "AI/not AI" binary. The printable compliance report format, with signature lines and detailed breakdowns, is becoming the standard for formal submissions.`,
  },
  {
    slug: "writing-better-ap-notes",
    title: "How to Write Better A/P Notes (and Get Paid More)",
    description:
      "Your Assessment & Plan is the most important section of the clinical note for reimbursement. Here's how to structure it for maximum E/M coding accuracy and RVU capture.",
    date: "2026-04-15",
    readTime: "5 min",
    category: "Clinical",
    content: `The Assessment & Plan (A/P) section drives your E/M level, your reimbursement, and your malpractice protection. Yet most clinicians write it as an afterthought — bullet points dashed off between patients. Here's how to do it right.

## The E/M coding connection

Under the 2024-2025 AMA/CMS guidelines, E/M level is determined by Medical Decision Making (MDM) complexity. MDM has three elements, and your level is set by the highest 2 of 3:

1. **Number and complexity of problems addressed**
2. **Amount and complexity of data reviewed/ordered**
3. **Risk of complications, morbidity, or mortality**

Your A/P section is where you document all three. A sparse A/P means a lower E/M level, which means less reimbursement for the same amount of work.

## Common mistakes that cost money

**Listing diagnoses without addressing them.** Writing "HTN" without noting whether it's controlled, uncontrolled, or being adjusted doesn't support complexity. Write "HTN, uncontrolled — Stage 2 with target organ damage. Increasing lisinopril 20mg to 40mg daily, recheck in 4 weeks."

**Missing data documentation.** If you reviewed labs, imaging, or outside records, say so explicitly. "Reviewed A1c 8.2% from 4/15" supports the data element. Just writing "A1c elevated" doesn't.

**Underestimating risk.** Prescription drug management is moderate risk. If you're prescribing or adjusting any Rx medication, that alone supports moderate MDM risk. Many clinicians document this as low complexity when it isn't.

**Not linking problems to management.** Each diagnosis should have a clear management plan: what you're doing, why, and what the follow-up is. This is what coders look for.

## A template that works

For each problem in the A/P:

1. **Diagnosis** with ICD-10 code and status (new, chronic stable, chronic worsening)
2. **Key data point** supporting the assessment (lab value, vital sign, symptom)
3. **Management decision** (medication change, referral, test ordered, counseling)
4. **Follow-up plan** (when to return, what to monitor)

Example:

> **1. Hypertension, uncontrolled (I10)**
> BP 158/94 today, above goal despite lisinopril 20mg daily. No symptoms of hypertensive emergency. No evidence of new target organ damage on today's exam.
> *Plan:* Increase lisinopril to 40mg daily. Recheck BP in 4 weeks. If still above goal, add amlodipine 5mg. Continue low-sodium diet counseling.

This structure gives the coder everything they need: problem complexity (chronic with exacerbation = moderate), data (BP measurement reviewed), risk (Rx drug management = moderate), and management (medication adjustment with follow-up).

## The AI assist

AI tools can accelerate this process without compromising quality. You type the skeleton — "62M, HTN, DM2, BP 158/94, A1c 8.2, lisinopril 20, metformin 1000 BID" — and the AI generates the full structured A/P with appropriate codes, E/M level assessment, and documentation suggestions.

The key: you still review and sign. The AI handles the boilerplate; you handle the clinical judgment. The net effect is better documentation in less time, which means higher reimbursement and better legal protection.

## RVU impact

The difference between a 99213 (low MDM) and a 99214 (moderate MDM) is roughly $40-50 per encounter. For a clinician seeing 20 patients per day, that's $800-1000 per day — or $200,000+ per year — if even half of those encounters are undercoded by one level.

Most undercoding happens because the documentation doesn't support the work that was actually done. Write the A/P that matches your actual decision-making, and the codes follow.`,
  },
  {
    slug: "phi-redaction-hipaa-ai",
    title: "PHI Redaction for AI Tools: A Practical HIPAA Guide",
    description:
      "How to use AI tools with patient data without violating HIPAA. Client-side redaction, Safe Harbor identifiers, and what 'best-effort' really means.",
    date: "2026-04-08",
    readTime: "6 min",
    category: "Privacy",
    content: `Using AI tools with clinical text raises an obvious question: what about HIPAA? The answer isn't "you can't use AI" — it's "you need to handle PHI correctly."

## What HIPAA actually requires

HIPAA's Privacy Rule doesn't prohibit sending clinical information to third-party services. It requires that PHI be protected through appropriate safeguards. The Safe Harbor method of de-identification (§164.514(b)(2)) lists 18 specific identifier types that must be removed:

1. Names
2. Geographic data smaller than state
3. Dates (except year) related to an individual
4. Phone numbers
5. Fax numbers
6. Email addresses
7. Social Security numbers
8. Medical record numbers
9. Health plan beneficiary numbers
10. Account numbers
11. Certificate/license numbers
12. Vehicle identifiers
13. Device identifiers
14. Web URLs
15. IP addresses
16. Biometric identifiers
17. Full-face photos
18. Any other unique identifying number

Critically, clinical information — diagnoses, medications, lab values, vitals, symptoms, procedures — is **not** PHI on its own. A statement like "62-year-old male with uncontrolled hypertension on lisinopril 20mg" contains no identifiers and is safe to share.

## Client-side redaction: the gold standard

The safest approach to using AI tools with clinical data is client-side redaction — detecting and replacing identifiers in the user's browser before any text leaves their device.

The flow works like this:

1. **You type:** "Patient: John Smith, DOB: 5/15/1962, MRN: 12345678. 62M with HTN, DM2."
2. **Sent to AI:** "Patient: [REDACTED-NAME-1], DOB: [REDACTED-DOB-1], MRN: [REDACTED-MRN-1]. 62M with HTN, DM2."
3. **AI processes** the clinical content without ever seeing the identifiers.
4. **You see:** The AI's output with real values restored locally — "Patient: John Smith" appears on your screen, but never left your device.

This approach means the AI service never receives PHI. The token map (which links [REDACTED-NAME-1] back to "John Smith") stays in the user's browser storage and is never transmitted.

## What pattern-based detection catches

Automated PHI detection using regular expressions and pattern matching can reliably catch:

- **Names** with labels ("Patient: John Smith", "Dr. Jane Doe")
- **Dates** in common formats (MM/DD/YYYY, Month DD, YYYY)
- **SSNs** (XXX-XX-XXXX pattern)
- **MRNs** with labels ("MRN: 12345678")
- **Phone and fax numbers**
- **Email addresses**
- **Street addresses** with common suffixes (St, Ave, Blvd, etc.)
- **Zip codes** after state abbreviations
- **Ages 90+** (HIPAA Safe Harbor requires these to be generalized)

## What it doesn't catch

Pattern-based redaction is best-effort. It will miss:

- **Unlabeled names** embedded in narrative text ("saw the patient with his wife Margaret")
- **Unusual date formats** or relative dates ("three days after her birthday")
- **Rare identifier patterns** that don't match standard regex rules
- **Contextual identifiers** — information that's only identifying in combination (a very rare diagnosis + approximate age + geographic hint)

This is why responsible tools call it "auto-detection" rather than "de-identification" — and why users should minimize unnecessary PHI in their input. The auto-detection is a safety net, not a guarantee.

## Practical advice for clinicians

1. **Don't paste the full EHR note** if you only need the A/P. Copy the relevant clinical content and leave out demographic headers.
2. **Use the redaction preview** if your tool offers one. Verify that names, dates, and MRNs are caught before submitting.
3. **Don't paste scanned documents** — OCR text often has formatting artifacts that break pattern matching.
4. **For research/IRB purposes,** automated redaction is a starting point, not a substitute for formal de-identification review.

The bottom line: AI tools can be used safely with clinical data if PHI is handled properly. Client-side redaction eliminates the risk of identifier exposure while preserving the clinical content that AI needs to be useful.`,
  },
  {
    slug: "pubmed-citation-verification",
    title: "Why AI Hallucinated Citations Are Dangerous (and How to Verify Them)",
    description:
      "AI can fabricate convincing-looking citations with fake PMIDs. Here's how to verify every reference against PubMed and CrossRef — automatically.",
    date: "2026-04-01",
    readTime: "5 min",
    category: "Academic",
    content: `If you've ever asked an AI to suggest citations for a manuscript, you've probably encountered the hallucination problem. The AI generates a perfectly formatted reference — correct-looking author names, a plausible journal, a reasonable year — but the paper doesn't exist. The PMID leads nowhere. The DOI is dead.

This isn't a rare edge case. Studies from 2024-2025 found that general-purpose AI models hallucinate citations in 20-40% of cases when asked to suggest references. The citations look authoritative, which makes them dangerous — a reviewer might not check every single one.

## Why AI fabricates citations

Large language models don't have a database of papers. They've seen millions of citations during training and can generate text that follows citation patterns, but they can't verify whether a specific paper exists. When asked for "a systematic review of SGLT2 inhibitors and CKD progression," the model constructs what such a citation would look like based on its training data — and sometimes gets it right, sometimes doesn't.

The model doesn't know the difference between remembering a real paper and confabulating a plausible one. Both feel the same to it.

## The verification pipeline

The solution is automated verification against real databases. Here's how a reliable citation pipeline works:

**Step 1: AI suggests citations with search terms.** Instead of asking the AI to produce final citations, ask it to identify claims that need citations and provide PubMed search terms for each. This plays to the AI's strength (understanding what type of source is needed) while avoiding its weakness (fabricating specific papers).

**Step 2: PubMed search.** Use the E-utilities API to search PubMed with the AI's suggested terms. This returns real papers with verified PMIDs, titles, authors, journals, and DOIs.

**Step 3: CrossRef fallback.** For papers that aren't in PubMed (conference proceedings, non-biomedical journals), search CrossRef using the same terms. CrossRef covers over 130 million scholarly works.

**Step 4: Verification.** For any citation the AI did suggest directly (e.g., with a PMID), verify it against PubMed's API. If the PMID exists and the title matches, it's real. If not, flag it.

**Step 5: Formatting.** Once verified, format the citation in the requested style (APA, Vancouver, etc.) using the verified metadata from PubMed or CrossRef.

## Red flags in AI-generated citations

Watch for these signs that a citation might be hallucinated:

- **PMID doesn't resolve** — paste it into PubMed and nothing comes up
- **Author names are generic** — "Smith et al." or "Wang et al." without specific first names
- **The journal name is slightly off** — "Journal of Medical Research" instead of a real journal
- **The year is suspiciously convenient** — exactly matching when you'd want a paper to exist
- **The title is too perfectly descriptive** — reads more like a search query than a real paper title

## Building a citation library

Once you've verified a citation, save it. Building a personal citation library of verified references means you never have to re-verify the same paper. Over time, your library becomes a curated collection of your field's key papers — with verified PMIDs, DOIs, and formatted references ready to insert.

This is especially valuable for researchers who work on related topics across multiple papers. Instead of asking AI to find "that EMPA-REG paper" every time, you pull it from your library with one click — already verified, already formatted.

## The bottom line

Never submit a manuscript with unverified AI-suggested citations. The verification step takes seconds per citation when automated, and it's the difference between a credible paper and one with fabricated references. Real citations from real databases, every time.`,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
