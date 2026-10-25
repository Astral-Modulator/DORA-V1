import { generateContentWithRetry, PRIMARY_MODEL } from "./geminiClient.js";
import {
  SourceCitation,
  AcademicPaper,
  MediaResource,
  SourceQuality,
  ResearchMode,
} from "../src/types.js";

export interface RetrievedPayload {
  summaryOfFindings: string;
  sources: SourceCitation[];
  papers: AcademicPaper[];
  videos: MediaResource[];
  images: MediaResource[];
  additionalResources: MediaResource[];
}

function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}

function evaluateSourceQuality(
  url: string,
  title: string,
  query: string
): { sourceType: SourceCitation["sourceType"]; quality: SourceQuality } {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const domain = extractDomain(url).toLowerCase();

  let sourceType: SourceCitation["sourceType"] = "web";
  let authorityTier: SourceQuality["authorityTier"] = "Standard";
  let academicCredibility: string | undefined = undefined;
  let isPrimary = false;

  // 1. Academic sources
  if (
    lowerUrl.includes("ieee.org") ||
    lowerUrl.includes("arxiv.org") ||
    lowerUrl.includes("acm.org") ||
    lowerUrl.includes("nature.com") ||
    lowerUrl.includes("sciencedirect.com") ||
    lowerUrl.includes("springer.com") ||
    lowerUrl.includes("nih.gov") ||
    lowerUrl.includes("ncbi.nlm.nih.gov") ||
    lowerUrl.includes("biorxiv.org") ||
    lowerUrl.includes("semanticscholar.org") ||
    lowerUrl.includes("openreview.net") ||
    lowerTitle.includes("journal") ||
    lowerTitle.includes("ieee") ||
    lowerTitle.includes("proceedings") ||
    lowerTitle.includes("conference")
  ) {
    sourceType = "academic";
    authorityTier = "High";
    isPrimary = true;
    if (lowerUrl.includes("ieee.org") || lowerTitle.includes("ieee")) {
      academicCredibility = "IEEE Publication";
    } else if (lowerUrl.includes("arxiv.org")) {
      academicCredibility = "arXiv Preprint";
    } else if (lowerUrl.includes("acm.org")) {
      academicCredibility = "ACM Digital Library";
    } else if (lowerUrl.includes("nature.com")) {
      academicCredibility = "Nature Peer-Reviewed";
    } else {
      academicCredibility = "Peer-Reviewed Academic";
    }
  }
  // 2. Official / Government / Standards
  else if (
    domain.endsWith(".gov") ||
    domain.endsWith(".edu") ||
    lowerUrl.includes("w3.org") ||
    lowerUrl.includes("ietf.org") ||
    lowerUrl.includes("iso.org") ||
    lowerUrl.includes("nist.gov") ||
    lowerUrl.includes("who.int") ||
    lowerUrl.includes("cern.ch") ||
    lowerUrl.includes("nasa.gov")
  ) {
    sourceType = "official";
    authorityTier = "High";
    isPrimary = true;
    if (lowerUrl.includes("ietf.org") || lowerUrl.includes("w3.org") || lowerUrl.includes("iso.org")) {
      academicCredibility = "International Standard / RFC";
    } else if (domain.endsWith(".gov") || lowerUrl.includes("nist.gov")) {
      academicCredibility = "Government / National Institute";
    } else {
      academicCredibility = "Accredited Academic / Official";
    }
  }
  // 3. Official Documentation & Technical Specs
  else if (
    lowerUrl.includes("docs.") ||
    lowerUrl.includes("/docs/") ||
    lowerUrl.includes("developer.") ||
    lowerUrl.includes("readthedocs.io") ||
    lowerUrl.includes("github.com") ||
    lowerUrl.includes("mozilla.org") ||
    lowerUrl.includes("kernel.org")
  ) {
    sourceType = "documentation";
    authorityTier = "High";
    isPrimary = true;
    academicCredibility = "Primary Technical Documentation";
  }
  // 4. Established News & Technical Press
  else if (
    lowerUrl.includes("reuters.com") ||
    lowerUrl.includes("bloomberg.com") ||
    lowerUrl.includes("bbc.com") ||
    lowerUrl.includes("theverge.com") ||
    lowerUrl.includes("wired.com") ||
    lowerUrl.includes("arstechnica.com") ||
    lowerUrl.includes("technologyreview.com")
  ) {
    sourceType = "news";
    authorityTier = "Medium";
    isPrimary = false;
    academicCredibility = "Reputable Technical Journalism";
  } else {
    sourceType = "web";
    authorityTier = "Standard";
    isPrimary = false;
    academicCredibility = "Industry Web Source";
  }

  // Extract year if present in title or URL (e.g. 2023, 2024, 2025, 2026)
  const yearMatch = (url + " " + title).match(/\b(201[89]|202[0-6])\b/);
  const publishedYear = yearMatch ? yearMatch[1] : undefined;

  return {
    sourceType,
    quality: {
      authorityTier,
      sourceType,
      isPrimary,
      academicCredibility,
      publishedYear,
      relevanceLevel: authorityTier === "High" ? "High" : "Medium",
      whyRelevant: `Provides authoritative evidence regarding ${query.slice(0, 45)}...`,
      supportedClaims: title.slice(0, 60),
    },
  };
}

export async function retrieveInformation(
  query: string,
  searchQueries: string[],
  mode: ResearchMode = "deep"
): Promise<RetrievedPayload> {
  const isQuick = mode === "quick";
  const isAcademic = mode === "academic";

  // Construct queries adapted to mode
  let queriesToRun: string[];
  if (isQuick) {
    queriesToRun = [query];
  } else if (isAcademic) {
    queriesToRun = [
      ...searchQueries.slice(0, 4),
      `${query} IEEE Xplore open access arXiv`,
      `${query} review paper methodology benchmark`,
    ].slice(0, 5);
  } else {
    // Deep research
    queriesToRun = searchQueries.slice(0, 4);
  }

  const primarySearchPrompt = `You are DORA's Multi-Source Research Retrieval Engine.
Perform thorough, verified research on the following topic and key angles using Google Search grounding.

Main Topic: "${query}"
Research Mode: ${mode.toUpperCase()}
Target Angles:
${queriesToRun.map((q, i) => `${i + 1}. ${q}`).join("\n")}

PRIORITY SOURCES & REQUIREMENTS:
1. Prioritize: Official technical documentation, government sources (.gov, .edu, standards like W3C/IETF/NIST), academic publications (IEEE, arXiv, Nature, ACM, Springer, ScienceDirect, PubMed), primary sources, and reputable technical press.
2. For ACADEMIC research: Locate peer-reviewed studies, IEEE open-access papers, arXiv preprints, authors, publication years, and methodological benchmarks.
3. For DEEP research: Gather diverse angles, industry implementations, benchmarks, and known trade-offs or conflicting claims.
4. For QUICK research: Retrieve immediate, high-authority facts and core specifications.
5. If relevant, locate educational YouTube lectures or conference presentations (e.g. IEEE, NeurIPS, MIT OpenCourseWare).
6. Note any official datasets, tools, or open-source repositories (e.g. Hugging Face, GitHub).
7. Synthesize an extensive summary of all facts, figures, benchmark numbers, dates, mechanisms, and findings.
8. CRITICAL: Mention real titles and exact URLs of sources found. Do NOT fabricate any links, citations, or papers.`;

  try {
    const response = await generateContentWithRetry({
      preferredModel: PRIMARY_MODEL,
      contents: primarySearchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.25,
      },
    });

    const summaryText = response.text || "";
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const sourcesMap = new Map<string, SourceCitation>();
    let citationCounter = 1;

    // Process grounding chunks
    for (const chunk of rawChunks) {
      const uri = chunk.web?.uri;
      const title = chunk.web?.title || uri;
      if (!uri) continue;

      try {
        const parsed = new URL(uri);
        parsed.searchParams.delete("utm_source");
        parsed.searchParams.delete("utm_medium");
        parsed.searchParams.delete("utm_campaign");
        parsed.searchParams.delete("ref");
        const cleanUrl = parsed.toString().replace(/\/$/, "");

        if (!sourcesMap.has(cleanUrl)) {
          const evalResult = evaluateSourceQuality(cleanUrl, title || "", query);
          sourcesMap.set(cleanUrl, {
            id: citationCounter++,
            title: title || extractDomain(cleanUrl),
            url: cleanUrl,
            sourceType: evalResult.sourceType,
            domain: extractDomain(cleanUrl),
            quality: evalResult.quality,
          });
        }
      } catch {
        // Skip malformed URLs
      }
    }

    const papers: AcademicPaper[] = [];
    const videos: MediaResource[] = [];
    const images: MediaResource[] = [];
    const additionalResources: MediaResource[] = [];

    // Classify retrieved sources into papers, videos, and tool/data resources
    for (const src of sourcesMap.values()) {
      const lowerUrl = src.url.toLowerCase();
      const lowerTitle = src.title.toLowerCase();

      // Academic and IEEE papers
      if (
        src.sourceType === "academic" ||
        lowerUrl.includes("ieee.org") ||
        lowerUrl.includes("arxiv.org") ||
        lowerUrl.includes("semanticscholar.org") ||
        lowerUrl.includes("acm.org") ||
        lowerUrl.includes("sciencedirect.com") ||
        lowerTitle.includes("ieee") ||
        lowerTitle.includes("journal") ||
        lowerTitle.includes("paper")
      ) {
        const isIeee = lowerUrl.includes("ieee.org") || lowerTitle.includes("ieee");
        const isOpen =
          lowerUrl.includes("arxiv.org") ||
          lowerUrl.includes("openaccess") ||
          lowerUrl.includes("access") ||
          lowerUrl.includes("biorxiv.org");
        const isPaywalled = !isOpen && !lowerUrl.includes("arxiv.org") && (lowerUrl.includes("sciencedirect.com") || lowerUrl.includes("springer.com") || (isIeee && !isOpen));

        // Extract DOI if present in URL
        const doiMatch = src.url.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);

        papers.push({
          id: `paper-${papers.length + 1}`,
          title: src.title,
          url: src.url,
          doi: doiMatch ? doiMatch[0] : undefined,
          publication: isIeee ? "IEEE" : extractDomain(src.url),
          isIeeeOpenAccess: isIeee && isOpen,
          isOpenAccess: isOpen,
          isPaywalled,
          relevance: `Authoritative study regarding ${query}`,
          keyContribution: "Empirical findings and theoretical evaluation",
          methodology: "Experimental benchmarking and comparative analysis",
        });
      }

      // Videos
      if (lowerUrl.includes("youtube.com/watch") || lowerUrl.includes("youtu.be/")) {
        videos.push({
          id: `video-${videos.length + 1}`,
          type: "video",
          title: src.title.replace(/ - YouTube$/, ""),
          url: src.url,
          description: "Authoritative video lecture or conference presentation",
        });
      }

      // Datasets, Tools, Repositories & Official Docs
      if (lowerUrl.includes("github.com") || lowerUrl.includes("huggingface.co")) {
        additionalResources.push({
          id: `resource-${additionalResources.length + 1}`,
          type: lowerUrl.includes("huggingface.co") ? "dataset" : "tool",
          title: src.title,
          url: src.url,
          category: lowerUrl.includes("huggingface.co") ? "Dataset / Model" : "Code Repository",
          description: `Open-source codebase or dataset related to ${query}`,
        });
      } else if (src.sourceType === "documentation" || src.sourceType === "official") {
        additionalResources.push({
          id: `resource-${additionalResources.length + 1}`,
          type: "resource",
          title: src.title,
          url: src.url,
          category: "Official Standard & Docs",
          description: `Primary source documentation from ${src.domain}`,
        });
      }
    }

    // A grounded response can legitimately contain no chunks (for example, when
    // the model decides search will not improve a simple question). Never label
    // that as verified retrieval: synthesis must be able to disclose the limit.
    const effectiveSummary = summaryText?.trim()
      ? (sourcesMap.size > 0
          ? summaryText.trim()
          : `No external sources were returned for this request. The following is an unverified model-generated overview:\n\n${summaryText.trim()}`)
      : "No external sources were returned for this request.";

    return {
      summaryOfFindings: effectiveSummary,
      sources: Array.from(sourcesMap.values()),
      papers,
      videos,
      images,
      additionalResources,
    };
  } catch (err) {
    console.error("Error in retrieveInformation:", err);
    return {
      summaryOfFindings: "External source retrieval was unavailable. Do not present any claim as retrieved or cite sources that were not returned.",
      sources: [],
      papers: [],
      videos: [],
      images: [],
      additionalResources: [],
    };
  }
}

