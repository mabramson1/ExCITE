import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://docsquared.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  return [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/sign-in`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/sign-up`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/blog/ai-clinical-documentation-2026`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/blog/ai-detection-what-works`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/blog/writing-better-ap-notes`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/blog/phi-redaction-hipaa-ai`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/blog/pubmed-citation-verification`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
