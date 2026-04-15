const NCBI_API_KEY = process.env.NCBI_API_KEY || "";
const BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  doi: string | null;
  abstract: string | null;
}

interface PubMedSearchResult {
  found: boolean;
  articles: PubMedArticle[];
  total_results: number;
}

function buildParams(params: Record<string, string>): URLSearchParams {
  const p = new URLSearchParams(params);
  if (NCBI_API_KEY) p.set("api_key", NCBI_API_KEY);
  return p;
}

/**
 * Search PubMed for articles matching a query string.
 * Returns up to `maxResults` articles with metadata.
 */
export async function searchPubMed(
  query: string,
  maxResults = 3
): Promise<PubMedSearchResult> {
  try {
    // Step 1: Search for PMIDs
    const searchParams = buildParams({
      db: "pubmed",
      term: query,
      retmax: String(maxResults),
      retmode: "json",
      sort: "relevance",
    });

    const searchRes = await fetch(`${BASE_URL}/esearch.fcgi?${searchParams}`);
    if (!searchRes.ok) {
      return { found: false, articles: [], total_results: 0 };
    }

    const searchData = await searchRes.json();
    const idList: string[] = searchData.esearchresult?.idlist || [];
    const totalResults = parseInt(searchData.esearchresult?.count || "0", 10);

    if (idList.length === 0) {
      return { found: false, articles: [], total_results: 0 };
    }

    // Step 2: Fetch article details
    const articles = await fetchArticleDetails(idList);

    return { found: true, articles, total_results: totalResults };
  } catch (error) {
    console.error("PubMed search error:", error);
    return { found: false, articles: [], total_results: 0 };
  }
}

/**
 * Verify a citation by looking it up on PubMed.
 * Tries PMID first (if provided), then falls back to title search.
 */
export async function verifyCitation(citation: {
  title?: string;
  pmid?: string | null;
  doi?: string | null;
  authors?: string;
}): Promise<{
  verified: boolean;
  pmid: string | null;
  match: PubMedArticle | null;
  confidence: "exact" | "likely" | "partial" | "not_found";
}> {
  try {
    // Try PMID lookup first
    if (citation.pmid) {
      const articles = await fetchArticleDetails([citation.pmid]);
      if (articles.length > 0) {
        return {
          verified: true,
          pmid: citation.pmid,
          match: articles[0],
          confidence: "exact",
        };
      }
    }

    // Try DOI search
    if (citation.doi) {
      const result = await searchPubMed(`${citation.doi}[doi]`, 1);
      if (result.found && result.articles.length > 0) {
        return {
          verified: true,
          pmid: result.articles[0].pmid,
          match: result.articles[0],
          confidence: "exact",
        };
      }
    }

    // Fall back to title search
    if (citation.title) {
      const cleanTitle = citation.title.replace(/[^\w\s]/g, " ").trim();
      const result = await searchPubMed(`${cleanTitle}[title]`, 3);

      if (result.found && result.articles.length > 0) {
        // Check if any result title closely matches
        const normalizedQuery = cleanTitle.toLowerCase();
        for (const article of result.articles) {
          const normalizedTitle = article.title.toLowerCase().replace(/[^\w\s]/g, " ");
          if (
            normalizedTitle.includes(normalizedQuery) ||
            normalizedQuery.includes(normalizedTitle) ||
            similarity(normalizedQuery, normalizedTitle) > 0.7
          ) {
            return {
              verified: true,
              pmid: article.pmid,
              match: article,
              confidence: "likely",
            };
          }
        }

        // Partial match — top result might be related
        return {
          verified: false,
          pmid: result.articles[0].pmid,
          match: result.articles[0],
          confidence: "partial",
        };
      }
    }

    return { verified: false, pmid: null, match: null, confidence: "not_found" };
  } catch (error) {
    console.error("Citation verification error:", error);
    return { verified: false, pmid: null, match: null, confidence: "not_found" };
  }
}

/**
 * Fetch full article details for a list of PMIDs.
 */
async function fetchArticleDetails(pmids: string[]): Promise<PubMedArticle[]> {
  const fetchParams = buildParams({
    db: "pubmed",
    id: pmids.join(","),
    retmode: "xml",
    rettype: "abstract",
  });

  const fetchRes = await fetch(`${BASE_URL}/efetch.fcgi?${fetchParams}`);
  if (!fetchRes.ok) return [];

  const xml = await fetchRes.text();
  return parseArticlesFromXml(xml);
}

/**
 * Parse PubMed XML response into structured article data.
 */
function parseArticlesFromXml(xml: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];

  // Split into individual articles
  const articleBlocks = xml.split("<PubmedArticle>").slice(1);

  for (const block of articleBlocks) {
    const pmid = extractTag(block, "PMID") || "";
    const title = extractTag(block, "ArticleTitle") || "Unknown Title";

    // Extract authors
    const authorMatches = block.match(/<LastName>(.*?)<\/LastName>/g) || [];
    const firstNames = block.match(/<ForeName>(.*?)<\/ForeName>/g) || [];
    const authors: string[] = [];
    for (let i = 0; i < Math.min(authorMatches.length, 3); i++) {
      const lastName = authorMatches[i].replace(/<\/?LastName>/g, "");
      const firstName = firstNames[i]?.replace(/<\/?ForeName>/g, "") || "";
      authors.push(`${lastName} ${firstName.charAt(0)}`);
    }
    if (authorMatches.length > 3) authors.push("et al.");
    const authorStr = authors.join(", ") || "Unknown Authors";

    // Extract journal
    const journal = extractTag(block, "Title") || extractTag(block, "ISOAbbreviation") || "Unknown Journal";

    // Extract year
    const pubDateBlock = block.match(/<PubDate>([\s\S]*?)<\/PubDate>/)?.[1] || "";
    const year = extractTag(pubDateBlock, "Year") ||
      extractTag(pubDateBlock, "MedlineDate")?.substring(0, 4) || "";

    // Extract DOI
    const doiMatch = block.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/);
    const doi = doiMatch ? doiMatch[1] : null;

    // Extract abstract
    const abstractMatch = block.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
    const abstract = abstractMatch ? abstractMatch[1].replace(/<[^>]*>/g, "").substring(0, 500) : null;

    articles.push({ pmid, title, authors: authorStr, journal, year, doi, abstract });
  }

  return articles;
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "s"));
  return match ? match[1].replace(/<[^>]*>/g, "").trim() : null;
}

/**
 * Simple word-overlap similarity (Jaccard-like) for title matching.
 */
function similarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter((w) => w.length > 3));
  const wordsB = new Set(b.split(/\s+/).filter((w) => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  return intersection / Math.max(wordsA.size, wordsB.size);
}

// ── CrossRef Integration ───────────────────────────────────────────

export interface CrossRefArticle {
  title: string;
  authors: string;
  journal: string;
  year: string;
  doi: string;
  url: string;
  type: string;
  score: number;
}

/**
 * Search CrossRef for articles matching a query.
 * Free API, covers non-biomedical journals PubMed misses.
 */
export async function searchCrossRef(
  query: string,
  maxResults = 3
): Promise<{ found: boolean; articles: CrossRefArticle[] }> {
  try {
    const params = new URLSearchParams({
      query,
      rows: String(maxResults),
      sort: "relevance",
      select: "DOI,title,author,container-title,published,type,score",
    });

    const res = await fetch(
      `https://api.crossref.org/works?${params}`,
      {
        headers: {
          "User-Agent": "ExCITE/1.0 (mailto:support@ex-cite.vercel.app)",
        },
      }
    );

    if (!res.ok) return { found: false, articles: [] };

    const data = await res.json();
    const items = data.message?.items || [];

    const articles: CrossRefArticle[] = items.map(
      (item: {
        title?: string[];
        author?: { family?: string; given?: string }[];
        "container-title"?: string[];
        published?: { "date-parts"?: number[][] };
        DOI?: string;
        type?: string;
        score?: number;
      }) => {
        const authors = (item.author || [])
          .slice(0, 3)
          .map((a) => `${a.family || ""} ${(a.given || "")[0] || ""}`.trim())
          .join(", ");
        const authorStr =
          (item.author?.length || 0) > 3 ? `${authors}, et al.` : authors;

        return {
          title: item.title?.[0] || "Unknown Title",
          authors: authorStr || "Unknown Authors",
          journal: item["container-title"]?.[0] || "Unknown Journal",
          year: String(item.published?.["date-parts"]?.[0]?.[0] || ""),
          doi: item.DOI || "",
          url: `https://doi.org/${item.DOI}`,
          type: item.type || "unknown",
          score: item.score || 0,
        };
      }
    );

    return { found: articles.length > 0, articles };
  } catch (error) {
    console.error("CrossRef search error:", error);
    return { found: false, articles: [] };
  }
}
