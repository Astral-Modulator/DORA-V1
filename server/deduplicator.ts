import { SourceCitation, AcademicPaper, MediaResource, StructuredSection } from "../src/types.js";

export interface DeduplicationSummary {
  sources: SourceCitation[];
  papers: AcademicPaper[];
  videos: MediaResource[];
  images: MediaResource[];
  additionalResources: MediaResource[];
  sections: StructuredSection[];
  deduplicatedCount: number;
}

function canonicalizeUrl(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    let host = url.hostname.toLowerCase().replace(/^www\./, "");
    let path = url.pathname.replace(/\/$/, "");

    // Normalize arXiv URLs: /abs/1234.5678 and /pdf/1234.5678 -> /abs/1234.5678
    if (host.includes("arxiv.org")) {
      path = path.replace(/^\/pdf\//, "/abs/").replace(/\.pdf$/, "");
    }

    // Normalize YouTube URLs
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      const v = url.searchParams.get("v");
      if (v) return `youtube.com/watch?v=${v}`;
      const match = path.match(/\/([a-zA-Z0-9_-]{11})/);
      if (match) return `youtube.com/watch?v=${match[1]}`;
    }

    return `${host}${path}`;
  } catch {
    return urlStr.trim().toLowerCase();
  }
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function runDeduplicationSystem(
  sources: SourceCitation[],
  papers: AcademicPaper[],
  videos: MediaResource[],
  images: MediaResource[],
  additionalResources: MediaResource[],
  sections: StructuredSection[]
): DeduplicationSummary {
  let deduplicatedCount = 0;

  // 1. Deduplicate Sources
  const seenSourceUrls = new Set<string>();
  const seenSourceTitles = new Set<string>();
  const cleanSources: SourceCitation[] = [];

  for (const src of sources) {
    const canonUrl = canonicalizeUrl(src.url);
    const normTitle = normalizeTitle(src.title);

    if (seenSourceUrls.has(canonUrl) || (normTitle.length > 5 && seenSourceTitles.has(normTitle))) {
      deduplicatedCount++;
      continue;
    }

    seenSourceUrls.add(canonUrl);
    if (normTitle.length > 5) seenSourceTitles.add(normTitle);

    cleanSources.push({
      ...src,
      id: cleanSources.length + 1,
    });
  }

  // 2. Deduplicate Papers
  const seenPaperUrls = new Set<string>();
  const seenPaperTitles = new Set<string>();
  const cleanPapers: AcademicPaper[] = [];

  for (const paper of papers) {
    const canonUrl = canonicalizeUrl(paper.url);
    const normTitle = normalizeTitle(paper.title);

    if (seenPaperUrls.has(canonUrl) || (normTitle.length > 5 && seenPaperTitles.has(normTitle))) {
      deduplicatedCount++;
      continue;
    }

    seenPaperUrls.add(canonUrl);
    if (normTitle.length > 5) seenPaperTitles.add(normTitle);
    cleanPapers.push(paper);
  }

  // 3. Deduplicate Videos
  const seenVideoKeys = new Set<string>();
  const cleanVideos: MediaResource[] = [];

  for (const vid of videos) {
    const canonUrl = canonicalizeUrl(vid.url);
    if (seenVideoKeys.has(canonUrl)) {
      deduplicatedCount++;
      continue;
    }
    seenVideoKeys.add(canonUrl);
    cleanVideos.push(vid);
  }

  // 4. Deduplicate Images and Additional Resources
  const seenImgUrls = new Set<string>();
  const cleanImages: MediaResource[] = [];
  for (const img of images) {
    const canonUrl = canonicalizeUrl(img.url);
    if (seenImgUrls.has(canonUrl)) {
      deduplicatedCount++;
      continue;
    }
    seenImgUrls.add(canonUrl);
    cleanImages.push(img);
  }

  const seenResUrls = new Set<string>();
  const cleanResources: MediaResource[] = [];
  for (const res of additionalResources) {
    const canonUrl = canonicalizeUrl(res.url);
    if (seenResUrls.has(canonUrl) || seenSourceUrls.has(canonUrl)) {
      deduplicatedCount++;
      continue;
    }
    seenResUrls.add(canonUrl);
    cleanResources.push(res);
  }

  // 5. Deduplicate Sections and remove redundant repetitions across sections
  const cleanSections: StructuredSection[] = [];
  const seenSectionTitles = new Set<string>();
  const seenSentences = new Set<string>();

  for (const sec of sections) {
    const normTitle = normalizeTitle(sec.title);
    if (seenSectionTitles.has(normTitle)) {
      deduplicatedCount++;
      continue;
    }
    seenSectionTitles.add(normTitle);

    // Filter out repetitive sentences inside sections
    const paragraphs = sec.content.split("\n\n");
    const uniqueParagraphs: string[] = [];

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      // Extract key sentence signatures
      const sentences = trimmed.split(/(?<=[.?!])\s+/);
      const nonRepetitiveSentences: string[] = [];

      for (const sentence of sentences) {
        const normSentence = normalizeTitle(sentence);
        if (normSentence.length > 25 && seenSentences.has(normSentence)) {
          deduplicatedCount++;
          // Skip repetitive sentence
          continue;
        }
        if (normSentence.length > 25) {
          seenSentences.add(normSentence);
        }
        nonRepetitiveSentences.push(sentence);
      }

      if (nonRepetitiveSentences.length > 0) {
        uniqueParagraphs.push(nonRepetitiveSentences.join(" "));
      }
    }

    const finalContent = uniqueParagraphs.join("\n\n").trim();
    if (finalContent) {
      cleanSections.push({
        ...sec,
        content: finalContent,
      });
    }
  }

  return {
    sources: cleanSources,
    papers: cleanPapers,
    videos: cleanVideos,
    images: cleanImages,
    additionalResources: cleanResources,
    sections: cleanSections,
    deduplicatedCount,
  };
}
