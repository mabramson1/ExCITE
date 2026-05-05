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
      "Two years past the GPT hype cycle, AI documentation tools have settled into something useful. Here's what works, what doesn't, and what to look for.",
    date: "2026-04-28",
    readTime: "6 min",
    category: "Clinical",
    content: `The conversation around AI in clinical documentation has matured a lot since 2023. The early hype is gone. The tools are better. Expectations are more realistic. And the regulatory picture has finally cleared up.

## What actually works now

Assessment & Plan generation is the breakout use case. You paste a skeleton (chief complaint, vitals, labs, med list) and you get a structured A/P with ICD-10 codes, an E/M level, and medication recommendations. The point is not to replace clinical judgment. It's to handle the documentation slog so you can focus on the patient.

The 2024-2025 AMA/CMS guidelines made Medical Decision Making (MDM) the primary leveling method. Three elements: problem complexity, data reviewed, risk. AI tools that actually understand these guidelines can suggest appropriate E/M levels and flag documentation gaps. Coders save hours per week.

Prior authorization letters are another big one. The back-and-forth with insurers over medical necessity is time-consuming and formulaic, which is exactly the kind of writing AI handles well. A draft that cites relevant clinical guidelines saves 20 to 30 minutes per letter.

## What still needs human oversight

ICD-10 and CPT coding suggestions need verification. AI coding has improved a lot, but it still suggests overly specific codes when documentation is vague, or misses laterality, or gets episode of care wrong. The tools that are worth using flag low-confidence suggestions explicitly instead of guessing.

Drug interactions, dosing, and clinical decision support are areas where AI should assist, not decide. The liability landscape for AI-generated clinical advice is still evolving. Most malpractice carriers haven't fully clarified their position. So review everything.

## The PHI question

The biggest barrier to adoption is data privacy. HIPAA doesn't prohibit using AI for clinical documentation. It does require that PHI be handled appropriately. The safest approach is client-side redaction: strip identifiers before text leaves the clinician's device, then re-inject them locally for display.

The result is that the AI never sees patient names, MRNs, dates of birth, or other identifiers. It processes the clinical content (age, vitals, labs, medications, diagnoses) that it actually needs. The PHI stays on your machine.

## What to look for in a tool

A few questions worth asking before you commit to a tool:

- Does it explain its coding decisions? Good tools cite specific documentation supporting each code. Bad tools just spit out a list.
- How does it handle PHI? Client-side redaction is the gold standard. If a tool sends full clinical notes to an API without redaction, run.
- Does it support current guidelines? E/M coding changes annually. A tool stuck on 2023 guidelines will suggest wrong levels.
- Can you verify the output? AI-generated documentation should be editable, not a black box. You need to read and sign off.

The future of clinical documentation isn't about replacing physicians. It's about giving you back the time you currently spend on paperwork. The tools are ready. The question is whether your workflow is.`,
  },
  {
    slug: "ai-detection-what-works",
    title: "AI Detection in 2026: What Actually Works (and What Doesn't)",
    description:
      "If you've used AI detection tools in the past year, you've probably been frustrated. Different tools give wildly different results on the same text. Here's why, and how to do it right.",
    date: "2026-04-22",
    readTime: "7 min",
    category: "AI Detection",
    content: `Single-detector AI tools are unreliable. One tool calls a passage 95% AI. Another calls the same passage 30% human. Same text. What's going on?

## Why single detectors fail

Modern LLMs have cleaned up the obvious tells. In 2023, you could spot AI text by looking for "delve," "tapestry," and "multifaceted." Today's models have been specifically trained to avoid those patterns. The tells have shifted from word choice to structure and rhetoric.

The structural patterns that still leak:

- Metronomic sentence rhythm. AI tends to produce sentences of similar length and complexity.
- Hedging clusters. Phrases like "it is important to note" appear in predictable patterns.
- Symmetric parallelism. AI loves balanced lists and matched sentence structures.
- Topic sentence dependency. Almost every paragraph starts with a thesis followed by support.
- Absence of first-person uncertainty. Real writers say "I think" and "I'm not sure." AI rarely does.

But these patterns are subtle. No single detector reliably catches them all. Each one has its own blind spots.

## The consensus approach

The fix is multi-source consensus. Run text through several independent detection engines and average their results. This works for the same reason ensemble methods work in machine learning: individual classifiers have uncorrelated errors, so their average beats any single one.

A practical consensus might combine:

1. A deep pattern analyzer that examines structural and rhetorical patterns at the sentence level
2. Sapling, a commercial detector trained on modern LLM outputs
3. Pangram, another independent commercial detector with different training data
4. Local heuristic analysis: vocabulary diversity (MTLD), burstiness, sentence length variance, punctuation patterns

Weighting matters. A deep analysis from a capable model deserves more weight (60%) than the average of pattern-matching detectors (40%), because it can reason about context.

## How to read scores

Scores are probabilities, not verdicts:

- 0 to 30%: Likely human. Enough irregular, human-like patterns that AI authorship is unlikely. Note that heavily edited AI text can fall here too.
- 30 to 55%: Possibly AI. Ambiguous. Could be AI-assisted writing, heavily edited AI output, or formulaic human writing. Don't make decisions on this alone.
- 55 to 80%: Likely AI. Multiple structural patterns consistent with AI generation. Worth investigating, but not proof.
- 80 to 100%: Almost certainly AI. Strong consensus across multiple signals. Very low chance of false positive on naturally written text.

## What detection can't do

It can't:

- Prove authorship with legal certainty
- Distinguish "written by AI" from "written by a human who writes like AI"
- Handle short texts (under 150 words) reliably
- Detect AI text that has been substantially rewritten by a human

Detection is a screening tool. Use it to flag text for human review, not to make automated decisions about academic integrity.

## The compliance angle

For institutions that need documentation (medical schools, journals, grant agencies), a multi-source detection report with specific scores, methodology, and caveats is far more defensible than a single AI-or-not binary. The printable compliance report format, with signature lines and detailed breakdowns, is becoming the standard for formal submissions.`,
  },
  {
    slug: "writing-better-ap-notes",
    title: "How to Write Better A/P Notes (and Get Paid More)",
    description:
      "Your Assessment & Plan drives your E/M level, your reimbursement, and your malpractice protection. Most clinicians treat it as an afterthought. Here's how to do it right.",
    date: "2026-04-15",
    readTime: "5 min",
    category: "Clinical",
    content: `The A/P section is the most important part of the clinical note for reimbursement. Yet most clinicians dash off bullet points between patients. Then they wonder why their RVU numbers look low.

## The E/M coding connection

Under the 2024-2025 AMA/CMS guidelines, E/M level is set by Medical Decision Making (MDM) complexity. MDM has three elements, and your level is determined by the highest 2 of 3:

1. Number and complexity of problems addressed
2. Amount and complexity of data reviewed or ordered
3. Risk of complications, morbidity, or mortality

Your A/P is where you document all three. A sparse A/P means a lower E/M level, which means less reimbursement for the same amount of work.

## Common mistakes that cost money

Listing diagnoses without addressing them. Writing "HTN" without noting controlled, uncontrolled, or being adjusted doesn't support complexity. Write "HTN, uncontrolled, Stage 2 with target organ damage. Increasing lisinopril 20mg to 40mg daily, recheck in 4 weeks."

Missing data documentation. If you reviewed labs, imaging, or outside records, say so. "Reviewed A1c 8.2% from 4/15" supports the data element. "A1c elevated" doesn't.

Underestimating risk. Prescription drug management is moderate risk. If you're prescribing or adjusting any Rx medication, that alone supports moderate MDM risk. Many clinicians document this as low complexity when it isn't.

Not linking problems to management. Each diagnosis needs a clear management plan: what you're doing, why, and what the follow-up is. That's what coders look for.

## A template that works

For each problem in the A/P:

1. Diagnosis with ICD-10 code and status (new, chronic stable, chronic worsening)
2. Key data point supporting the assessment (lab value, vital sign, symptom)
3. Management decision (medication change, referral, test ordered, counseling)
4. Follow-up plan (when to return, what to monitor)

Example:

> 1. Hypertension, uncontrolled (I10)
> BP 158/94 today, above goal despite lisinopril 20mg daily. No symptoms of hypertensive emergency. No evidence of new target organ damage on today's exam.
> Plan: Increase lisinopril to 40mg daily. Recheck BP in 4 weeks. If still above goal, add amlodipine 5mg. Continue low-sodium diet counseling.

This gives the coder everything they need: problem complexity (chronic with exacerbation, moderate), data (BP measurement reviewed), risk (Rx drug management, moderate), and management (medication adjustment with follow-up).

## The AI assist

AI tools can speed this up without compromising quality. You type the skeleton ("62M, HTN, DM2, BP 158/94, A1c 8.2, lisinopril 20, metformin 1000 BID") and the AI generates the full structured A/P with appropriate codes, an E/M assessment, and documentation suggestions.

You still review and sign. The AI handles the boilerplate. You handle the clinical judgment. Better documentation in less time means higher reimbursement and better legal protection.

## RVU impact

The difference between a 99213 (low MDM) and a 99214 (moderate MDM) is roughly $40 to $50 per encounter. A clinician seeing 20 patients per day misses out on $800 to $1000 per day if half those encounters are undercoded by one level. That's $200,000+ per year.

Most undercoding happens because the documentation doesn't support the work that was actually done. Write the A/P that matches your actual decision-making, and the codes follow.`,
  },
  {
    slug: "phi-redaction-hipaa-ai",
    title: "PHI Redaction for AI Tools: A Practical HIPAA Guide",
    description:
      "How to use AI tools with patient data without violating HIPAA. Client-side redaction, Safe Harbor identifiers, and what 'best-effort' actually means.",
    date: "2026-04-08",
    readTime: "6 min",
    category: "Privacy",
    content: `Using AI tools with clinical text raises an obvious question: what about HIPAA? The answer isn't "you can't use AI." It's "you need to handle PHI correctly."

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
11. Certificate or license numbers
12. Vehicle identifiers
13. Device identifiers
14. Web URLs
15. IP addresses
16. Biometric identifiers
17. Full-face photos
18. Any other unique identifying number

Note what's not on this list: clinical information. Diagnoses, medications, lab values, vitals, symptoms, procedures. None of those are PHI on their own. A statement like "62-year-old male with uncontrolled hypertension on lisinopril 20mg" contains no identifiers and is safe to share.

## Client-side redaction is the gold standard

The safest way to use AI tools with clinical data is client-side redaction. Detect and replace identifiers in the user's browser before any text leaves the device.

Here's how the flow works:

1. You type: "Patient: John Smith, DOB: 5/15/1962, MRN: 12345678. 62M with HTN, DM2."
2. Sent to AI: "Patient: [REDACTED-NAME-1], DOB: [REDACTED-DOB-1], MRN: [REDACTED-MRN-1]. 62M with HTN, DM2."
3. AI processes the clinical content without ever seeing identifiers.
4. You see: The AI's output with real values restored locally. "Patient: John Smith" appears on your screen, but the name never left your device.

The token map (which links [REDACTED-NAME-1] back to "John Smith") stays in your browser storage and is never transmitted.

## What pattern-based detection catches

Automated PHI detection using regex and pattern matching can reliably catch:

- Names with labels ("Patient: John Smith", "Dr. Jane Doe")
- Dates in common formats (MM/DD/YYYY, Month DD YYYY)
- SSNs (XXX-XX-XXXX pattern)
- MRNs with labels ("MRN: 12345678")
- Phone and fax numbers
- Email addresses
- Street addresses with common suffixes (St, Ave, Blvd)
- Zip codes after state abbreviations
- Ages 90+, since HIPAA Safe Harbor requires these to be generalized

## What it doesn't catch

Pattern-based redaction is best-effort. It will miss:

- Unlabeled names embedded in narrative text ("saw the patient with his wife Margaret")
- Unusual date formats or relative dates ("three days after her birthday")
- Rare identifier patterns that don't match standard regex rules
- Contextual identifiers, where information is only identifying in combination (a very rare diagnosis plus approximate age plus geographic hint)

This is why responsible tools call it "auto-detection" rather than "de-identification." Users should still minimize unnecessary PHI in their input. The auto-detection is a safety net, not a guarantee.

## Practical advice

A few habits worth picking up:

1. Don't paste the full EHR note if you only need the A/P. Copy the relevant clinical content. Leave the demographic header behind.
2. Use the redaction preview if your tool offers one. Verify that names, dates, and MRNs are caught before submitting.
3. Don't paste scanned documents. OCR text often has formatting artifacts that break pattern matching.
4. For research or IRB purposes, automated redaction is a starting point, not a substitute for formal de-identification review.

AI tools can be used safely with clinical data when PHI is handled correctly. Client-side redaction eliminates the risk of identifier exposure while preserving the clinical content that AI actually needs.`,
  },
  {
    slug: "pubmed-citation-verification",
    title: "Why AI Hallucinated Citations Are Dangerous (and How to Verify Them)",
    description:
      "AI can fabricate convincing-looking citations with fake PMIDs. Here's how to verify every reference against PubMed and CrossRef, automatically.",
    date: "2026-04-01",
    readTime: "5 min",
    category: "Academic",
    content: `If you've ever asked an AI to suggest citations for a manuscript, you've probably hit the hallucination problem. The AI generates a perfectly formatted reference. Correct-looking author names. A plausible journal. A reasonable year. But the paper doesn't exist. The PMID leads nowhere. The DOI is dead.

This isn't rare. Studies from 2024-2025 found that general-purpose AI models hallucinate citations in 20 to 40% of cases when asked to suggest references. The citations look authoritative, which is what makes them dangerous. A reviewer might not check every single one.

## Why AI fabricates citations

Large language models don't have a database of papers. They've seen millions of citations during training and can generate text that follows citation patterns, but they can't verify whether a specific paper exists. Asked for "a systematic review of SGLT2 inhibitors and CKD progression," the model constructs what such a citation would look like based on its training data. Sometimes it gets it right. Sometimes it doesn't.

The model can't tell the difference between remembering a real paper and confabulating a plausible one. Both feel the same to it.

## The verification pipeline

The solution is automated verification against real databases. Here's how a reliable citation pipeline works:

Step 1: AI suggests citations with search terms. Instead of asking the AI to produce final citations, ask it to identify claims that need citations and provide PubMed search terms for each. This plays to the AI's strength (understanding what type of source is needed) while avoiding its weakness (fabricating specific papers).

Step 2: PubMed search. Use the E-utilities API to search PubMed with the AI's suggested terms. This returns real papers with verified PMIDs, titles, authors, journals, and DOIs.

Step 3: CrossRef fallback. For papers that aren't in PubMed (conference proceedings, non-biomedical journals), search CrossRef using the same terms. CrossRef covers over 130 million scholarly works.

Step 4: Verification. For any citation the AI did suggest directly (e.g., with a PMID), verify it against PubMed's API. If the PMID exists and the title matches, it's real. If not, flag it.

Step 5: Formatting. Once verified, format the citation in the requested style (APA, Vancouver, etc.) using the verified metadata.

## Red flags

A few signs that a citation might be hallucinated:

- The PMID doesn't resolve. Paste it into PubMed and nothing comes up.
- Author names are generic. "Smith et al." or "Wang et al." without specific first names.
- The journal name is slightly off. "Journal of Medical Research" instead of a real journal.
- The year is suspiciously convenient. Exactly matching when you'd want a paper to exist.
- The title is too perfectly descriptive. Reads more like a search query than a real paper title.

## Building a citation library

Once you've verified a citation, save it. A personal library of verified references means you don't have to re-verify the same paper twice. Over time, your library becomes a curated collection of your field's key papers, with verified PMIDs, DOIs, and formatted references ready to insert.

Especially valuable for researchers working on related topics across multiple papers. Instead of asking AI to find "that EMPA-REG paper" every time, you pull it from your library with one click. Already verified. Already formatted.

## Bottom line

Don't submit a manuscript with unverified AI-suggested citations. The verification step takes seconds per citation when automated. It's the difference between a credible paper and one with fabricated references. Real citations from real databases. Every time.`,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
