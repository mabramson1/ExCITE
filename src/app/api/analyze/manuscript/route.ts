import { NextRequest, NextResponse } from "next/server";
import { generateManuscriptCitations } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";
import { verifyCitation, searchPubMed } from "@/lib/pubmed";

export async function POST(req: NextRequest) {
  try {
    const { text, style = "apa" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const phiResult = scanAndCensorPhi(text);
    const analysis = await generateManuscriptCitations(phiResult.censoredText, style);

    let parsed;
    try {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: analysis };
    } catch {
      parsed = { raw: analysis };
    }

    // Verify suggested citations against PubMed
    if (parsed.claims_needing_citations) {
      for (const claim of parsed.claims_needing_citations) {
        if (!claim.suggested_citations) continue;

        for (const citation of claim.suggested_citations) {
          try {
            const result = await verifyCitation({
              title: citation.formatted,
              pmid: citation.pmid || null,
              doi: citation.doi || null,
            });

            citation.pubmed_verified = result.verified;
            citation.verification_confidence = result.confidence;

            if (result.match) {
              citation.pubmed_match = {
                pmid: result.match.pmid,
                title: result.match.title,
                authors: result.match.authors,
                journal: result.match.journal,
                year: result.match.year,
                doi: result.match.doi,
              };
              citation.pmid = result.match.pmid;
              if (result.match.doi) citation.doi = result.match.doi;
            }
          } catch {
            citation.pubmed_verified = false;
            citation.verification_confidence = "error";
          }
        }

        // If no citations were verified, search PubMed with the claim's search terms
        const allUnverified = claim.suggested_citations.every(
          (c: { pubmed_verified?: boolean }) => !c.pubmed_verified
        );
        if (allUnverified && claim.search_terms) {
          try {
            const searchResult = await searchPubMed(claim.search_terms, 2);
            if (searchResult.found) {
              claim.pubmed_suggestions = searchResult.articles.map((a) => ({
                pmid: a.pmid,
                title: a.title,
                authors: a.authors,
                journal: a.journal,
                year: a.year,
                doi: a.doi,
                source: "pubmed_search",
              }));
            }
          } catch {
            // PubMed search failed, continue without suggestions
          }
        }
      }
    }

    return NextResponse.json({
      result: parsed,
      phi: {
        detected: phiResult.hasPhi,
        warnings: phiResult.warnings,
        detectedTypes: phiResult.detectedTypes,
      },
    });
  } catch (error) {
    console.error("Manuscript analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze manuscript" },
      { status: 500 }
    );
  }
}
