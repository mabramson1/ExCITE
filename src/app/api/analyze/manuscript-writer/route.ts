import { NextRequest, NextResponse } from "next/server";
import { generateManuscript } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";
import { verifyCitation, searchPubMed } from "@/lib/pubmed";
import { autoSaveProject } from "@/lib/auto-save";
import { checkRateLimit, validateInput } from "@/lib/rate-limit";
import { requireUser } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const rl = checkRateLimit(ip);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429 }
      );
    }

    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;

    const { input, format, citationsEnabled, citationStyle, brevity, voiceSample } = await req.json();
    const v = validateInput(input);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const phiResult = scanAndCensorPhi(input);
    const analysis = await generateManuscript(phiResult.censoredText, {
      format,
      citationsEnabled,
      citationStyle,
      brevity,
      voiceSample,
    });

    let parsed;
    try {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: analysis };
    } catch {
      parsed = { raw: analysis };
    }

    // Verify citations against PubMed when citations are enabled
    if (citationsEnabled && parsed.citations && Array.isArray(parsed.citations)) {
      for (const cit of parsed.citations) {
        // If user provided a PMID/DOI, verify it
        if (cit.user_provided && (cit.pmid || cit.doi)) {
          try {
            const result = await verifyCitation({
              title: cit.formatted || "",
              pmid: cit.pmid || null,
              doi: cit.doi || null,
            });
            cit.verified = result.verified;
            cit.verification_confidence = result.confidence;
            if (result.match) {
              cit.pubmed_match = {
                pmid: result.match.pmid,
                title: result.match.title,
                authors: result.match.authors,
                journal: result.match.journal,
                year: result.match.year,
                doi: result.match.doi,
              };
            }
          } catch {
            cit.verified = false;
            cit.verification_confidence = "error";
          }
        }

        // For citations that need finding, search PubMed
        if (!cit.user_provided && cit.search_terms) {
          try {
            const searchResult = await searchPubMed(cit.search_terms, 3);
            if (searchResult.found) {
              cit.pubmed_results = searchResult.articles.map((a) => ({
                pmid: a.pmid,
                title: a.title,
                authors: a.authors,
                journal: a.journal,
                year: a.year,
                doi: a.doi,
                verified: true,
              }));
            }
          } catch {
            // Search failed, continue
          }
        }
      }
    }

    const savedId = await autoSaveProject({
      type: "manuscript",
      inputText: input,
      outputText: parsed,
      citationStyle: citationsEnabled ? citationStyle : null,
      phiDetected: phiResult.hasPhi,
      metadata: { tool: "manuscript_writer", format, brevity },
    });

    return NextResponse.json({
      result: parsed,
      savedId,
      phi: {
        detected: phiResult.hasPhi,
        warnings: phiResult.warnings,
        detectedTypes: phiResult.detectedTypes,
      },
    });
  } catch (error) {
    console.error("Manuscript writer error:", error);
    return NextResponse.json(
      { error: "Failed to generate manuscript" },
      { status: 500 }
    );
  }
}
