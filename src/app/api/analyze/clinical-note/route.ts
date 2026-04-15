import { NextRequest, NextResponse } from "next/server";
import { analyzeClinicalNote } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";
import { verifyCitation, searchPubMed } from "@/lib/pubmed";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const phiResult = scanAndCensorPhi(text);
    const analysis = await analyzeClinicalNote(phiResult.censoredText);

    let parsed;
    try {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: analysis };
    } catch {
      parsed = { raw: analysis };
    }

    // Verify publication citations against PubMed
    if (parsed.publication_citations) {
      for (const pub of parsed.publication_citations) {
        try {
          const result = await verifyCitation({
            title: pub.title,
            pmid: pub.pmid || null,
            doi: pub.doi || null,
            authors: pub.authors,
          });

          pub.pubmed_verified = result.verified;
          pub.verification_confidence = result.confidence;

          if (result.match) {
            pub.pubmed_match = {
              pmid: result.match.pmid,
              title: result.match.title,
              authors: result.match.authors,
              journal: result.match.journal,
              year: result.match.year,
              doi: result.match.doi,
            };
            if (result.match.pmid) pub.pmid = result.match.pmid;
            if (result.match.doi) pub.doi = result.match.doi;
          }
        } catch {
          pub.pubmed_verified = false;
          pub.verification_confidence = "error";
        }
      }

      // For unverified citations, try PubMed search with search_terms
      for (const pub of parsed.publication_citations) {
        if (!pub.pubmed_verified && pub.search_terms) {
          try {
            const searchResult = await searchPubMed(pub.search_terms, 2);
            if (searchResult.found) {
              pub.pubmed_alternatives = searchResult.articles.map((a) => ({
                pmid: a.pmid,
                title: a.title,
                authors: a.authors,
                journal: a.journal,
                year: a.year,
                doi: a.doi,
              }));
            }
          } catch {
            // Search failed, continue
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
      censoredInput: phiResult.hasPhi ? phiResult.censoredText : undefined,
    });
  } catch (error) {
    console.error("Clinical note analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze clinical note" },
      { status: 500 }
    );
  }
}
