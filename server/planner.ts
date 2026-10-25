import { generateContentWithRetry, PRIMARY_MODEL } from "./geminiClient.js";
import { ResearchPlan, ResearchMode } from "../src/types.js";

function detectQueryCategory(query: string): "programming" | "comparative" | "document" | "academic" | "general" {
  const q = query.toLowerCase();
  if (
    q.includes(" vs ") ||
    q.includes("versus") ||
    q.includes("compare") ||
    q.includes("comparison") ||
    q.includes("difference between")
  ) {
    return "comparative";
  }
  if (
    q.includes("code") ||
    q.includes("implement") ||
    q.includes("typescript") ||
    q.includes("javascript") ||
    q.includes("python") ||
    q.includes("algorithm") ||
    q.includes("function") ||
    q.includes("api") ||
    q.includes("error") ||
    q.includes("lru cache") ||
    q.includes("react")
  ) {
    return "programming";
  }
  if (
    q.includes("paper") ||
    q.includes("ieee") ||
    q.includes("arxiv") ||
    q.includes("methodology") ||
    q.includes("theorem") ||
    q.includes("ablation")
  ) {
    return "academic";
  }
  return "general";
}

export async function createResearchPlan(
  query: string,
  mode: ResearchMode = "deep",
  hasPdf: boolean = false,
  pdfNames: string[] = []
): Promise<ResearchPlan> {
  const isAcademic = mode === "academic";
  const isQuick = mode === "quick";
  const category = hasPdf ? "document" : detectQueryCategory(query);

  const systemInstruction = `You are DORA's Research Planning Engine.
Analyze the research inquiry and formulate a clean, high-precision research plan tailored to the query type and research mode: "${mode.toUpperCase()}".

QUERY UNDERSTANDING:
- General Knowledge / Conceptual (e.g. "What is AI?", "Explain cloud computing in simple terms"): Outline foundational principles, mechanisms, and real-world impact.
- Programming / Technical (e.g. "How to implement LRU cache"): Outline core architecture, data structures, implementation specifics, and performance edge cases.
- Comparative (e.g. "A vs B"): Outline direct comparison dimensions, benchmarks, architectural trade-offs, and optimal decision criteria.
- Academic / Scientific: Outline literature context, methodology, empirical metrics, theoretical bounds, and open research challenges.
- Document-Grounded (PDF attached): Outline document methodology, specific empirical findings, and cross-comparison with external literature.

MODE SPECIFICATIONS:
1. "QUICK": Fast answer using 1-2 focused subtasks and 1-2 targeted search queries.
2. "DEEP": Multi-dimensional investigation across 3-4 distinct subtasks.
3. "ACADEMIC": Rigorous academic inquiry with 4-5 academic subtasks and search queries targeting IEEE, arXiv, ACM, and top peer-reviewed literature.

Respond in strictly valid JSON without markdown wrapping:
{
  "intent": "Concise summary of research intent",
  "isComplex": boolean,
  "subtasks": ["string"],
  "searchQueries": ["string"],
  "focusAreas": ["string"]
}`;

  try {
    const prompt = `Research Query: "${query}"
Selected Mode: ${mode.toUpperCase()}
Category: ${category}
Attached Documents: ${hasPdf ? pdfNames.join(", ") || "Attached PDF" : "None"}`;

    const response = await generateContentWithRetry({
      preferredModel: PRIMARY_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
      timeoutMs: 8_000,
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);

    return {
      intent: parsed.intent || `Investigate ${query} using ${mode} research methodology.`,
      mode,
      isComplex: !isQuick,
      hasPdf,
      subtasks:
        Array.isArray(parsed.subtasks) && parsed.subtasks.length > 0
          ? parsed.subtasks
          : getFallbackSubtasks(query, mode, category, hasPdf, pdfNames),
      searchQueries:
        Array.isArray(parsed.searchQueries) && parsed.searchQueries.length > 0
          ? parsed.searchQueries
          : [query, `${query} overview`],
      focusAreas:
        Array.isArray(parsed.focusAreas) && parsed.focusAreas.length > 0
          ? parsed.focusAreas
          : undefined,
    };
  } catch (err) {
    console.error("Error generating research plan:", err);
    return {
      intent: `Conduct ${mode} research on: ${query}`,
      mode,
      isComplex: !isQuick,
      hasPdf,
      subtasks: getFallbackSubtasks(query, mode, category, hasPdf, pdfNames),
      searchQueries: [query, `${query} documentation`, `${query} analysis`],
    };
  }
}

function getFallbackSubtasks(
  query: string,
  mode: ResearchMode,
  category: string,
  hasPdf: boolean,
  pdfNames: string[]
): string[] {
  if (mode === "quick") {
    return [`Core definition, verified mechanism, and concise answer for "${query}"`];
  }

  if (hasPdf) {
    return [
      `Analyze document structure, core claims, and methodologies in ${pdfNames.join(", ") || "uploaded document"}`,
      `Extract key empirical findings, quantitative figures, and page-level references`,
      `Cross-reference document assertions with broader industry knowledge and literature`,
    ];
  }

  if (category === "programming") {
    return [
      `Core algorithmic architecture, data structures, and implementation design for ${query.slice(0, 35)}`,
      "Production TypeScript/code examples and algorithmic complexity (time and space)",
      "Edge cases, concurrency/memory constraints, and optimization strategies",
    ];
  }

  if (category === "comparative") {
    return [
      `Architectural foundations and design philosophies of the competing solutions`,
      `Direct empirical benchmarks, throughput, latency, and performance trade-offs`,
      `Decision matrix: Ideal production use cases, costs, and operational trade-offs`,
    ];
  }

  if (mode === "academic") {
    return [
      `Theoretical framework and foundational literature for ${query.slice(0, 35)}`,
      "State-of-the-art methodology, algorithmic mechanisms, and empirical benchmarks",
      "Critical limitations, open questions, and key peer-reviewed/IEEE publications",
    ];
  }

  return [
    `Core principles, operational mechanisms, and taxonomy of ${query.slice(0, 35)}`,
    "Recent developments, modern implementations, and practical adoption",
    "Empirical performance, critical trade-offs, and future outlook",
  ];
}
