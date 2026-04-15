import { NextRequest, NextResponse } from "next/server";
import { generateManuscriptCitations } from "@/lib/ai/claude";
import { scanAndCensorPhi } from "@/lib/phi-detection";
import { verifyCitation, searchPubMed, searchCrossRef } from "@/lib/pubmed";

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

    // For each claim, do PubMed-first search using the search terms,
    // then verify Claude's suggestions, then fall back to CrossRef
    if (parsed.claims_needing_citations) {
      for (const claim of parsed.claims_needing_citations) {
        // 1. PubMed-first: search using the claim's search terms
        if (claim.search_terms) {
          try {
            const pubmedResult = await searchPubMed(claim.search_terms, 3);
            if (pubmedResult.found) {
              claim.pubmed_results = pubmedResult.articles.map((a) => ({
                pmid: a.pmid,
                title: a.title,
                authors: a.authors,
                journal: a.journal,
                year: a.year,
                doi: a.doi,
                source: "pubmed",
                verified: true,
              }));
            }
          } catch {
            // PubMed search failed, continue
          }
        }

        // 2. Verify Claude's AI-suggested citations against PubMed
        if (claim.suggested_citations) {
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
        }

        // 3. CrossRef fallback: if no PubMed results, try CrossRef
        const hasPubmed = claim.pubmed_results?.length > 0;
        if (!hasPubmed && claim.search_terms) {
          try {
            const crossrefResult = await searchCrossRef(claim.search_terms, 3);
            if (crossrefResult.found) {
              claim.crossref_results = crossrefResult.articles.map((a) => ({
                title: a.title,
                authors: a.authors,
                journal: a.journal,
                year: a.year,
                doi: a.doi,
                url: a.url,
                source: "crossref",
                verified: true,
              }));
            }
          } catch {
            // CrossRef failed, continue
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
