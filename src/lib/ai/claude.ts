import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeClinicalNote(noteText: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a medical coding and documentation specialist. Analyze the following clinical note and provide:

1. **Suggested ICD-10 Codes** - List applicable diagnosis codes with descriptions
2. **Suggested CPT Codes** - List applicable procedure codes with descriptions
3. **Documentation Improvement Suggestions** - Areas where documentation could be enhanced for better billing accuracy
4. **Missing Elements** - Key clinical elements that should be documented but are missing
5. **Citation References** - Relevant clinical guidelines or coding references that support the suggested codes

Format your response as structured JSON with these sections:
{
  "icd10_codes": [{"code": "...", "description": "...", "confidence": "high|medium|low"}],
  "cpt_codes": [{"code": "...", "description": "...", "confidence": "high|medium|low"}],
  "documentation_suggestions": ["..."],
  "missing_elements": ["..."],
  "references": [{"title": "...", "source": "...", "relevance": "..."}],
  "summary": "Brief overall assessment"
}

Clinical Note:
${noteText}`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}

export async function generateManuscriptCitations(
  text: string,
  style: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an expert academic citation specialist. Analyze the following manuscript text and:

1. **Identify claims that need citations** - Find statements that require references
2. **Suggest citations** - Provide real, well-known academic references for each claim
3. **Format citations** - Use ${style.toUpperCase()} citation style
4. **Check existing citations** - Validate any existing references in the text
5. **Generate bibliography** - Create a properly formatted reference list

Format your response as structured JSON:
{
  "claims_needing_citations": [
    {"text": "the claim text", "location": "paragraph/sentence indicator", "suggested_citations": [{"formatted": "full citation in ${style} format", "doi": "if available", "relevance": "why this source"}]}
  ],
  "existing_citations_review": [{"original": "...", "status": "valid|needs_correction|not_found", "corrected": "..."}],
  "bibliography": ["formatted reference 1", "formatted reference 2"],
  "summary": "Brief assessment of citation completeness"
}

Manuscript Text:
${text}`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}

export async function deAiifyText(text: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an expert editor specializing in making AI-generated text sound naturally human-written. Rewrite the following text to:

1. **Remove AI patterns** - Eliminate telltale AI writing patterns (overly formal transitions, repetitive structure, generic hedging, listicle formatting, etc.)
2. **Add human voice** - Introduce natural variation in sentence length, occasional colloquialisms appropriate to academic writing, and authentic voice
3. **Preserve meaning** - Keep the core content and arguments intact
4. **Maintain quality** - Keep it well-written, just more naturally human

Return your response as JSON:
{
  "rewritten_text": "the full rewritten text",
  "changes_made": [{"original": "AI-sounding phrase", "replacement": "human-sounding phrase", "reason": "why this was changed"}],
  "ai_patterns_found": ["list of AI patterns identified"],
  "confidence_score": 0.0-1.0 (how confident you are the result reads as human)
}

Text to de-AI-ify:
${text}`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}

export async function detectAiText(text: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an expert at detecting AI-generated text. Analyze the following text and:

1. **Overall Assessment** - Determine the likelihood this text is AI-generated
2. **Highlight Suspicious Sections** - Identify specific passages that exhibit AI-writing characteristics
3. **Pattern Analysis** - Describe the specific AI patterns detected (e.g., repetitive transitions, overly structured paragraphs, generic hedging language, lack of personal voice)
4. **Sentence-Level Scoring** - Score each sentence/paragraph for AI likelihood
5. **Suggested Rewrites** - For each flagged section, suggest a more human-sounding alternative

Return your response as JSON:
{
  "overall_ai_probability": 0.0-1.0,
  "verdict": "likely_human|possibly_ai|likely_ai|definitely_ai",
  "flagged_sections": [
    {
      "text": "the suspicious text",
      "ai_probability": 0.0-1.0,
      "patterns_detected": ["pattern1", "pattern2"],
      "suggested_rewrite": "more human-sounding version"
    }
  ],
  "patterns_summary": ["overall patterns found"],
  "recommendations": ["actionable suggestions to make text more human"]
}

Text to analyze:
${text}`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === "text" ? content.text : "";
}
