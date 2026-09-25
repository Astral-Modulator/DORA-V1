import { generateContentWithRetry, PRIMARY_MODEL } from "./geminiClient.js";
import { ResearchPlan, ResearchMode } from "../src/types.js";

export async function createResearchPlan(
  query: string,
  mode: ResearchMode = "deep",
  hasPdf: boolean = false,
  pdfNames: string[] = []
): Promise<ResearchPlan> {
  const isAcademic = mode === "academic";
  const isQuick = mode === "quick";

  const systemInstruction = `You are DORA's Research Planning Engine.
Your task is to analyze the research inquiry and formulate a clean, high-precision, concise research plan based on the requested research mode: "${mode.toUpperCase()}".

MODE SPECIFICATIONS:
1. "QUICK": Fast answer using a smaller, targeted research scope. Formulate 1-2 direct factual subtasks and 1-2 concise search queries.
2. "DEEP": Multi-step, thorough investigation across multiple angles, technical developments, adoption, trade-offs, and real-world implementations. Formulate 3-5 distinct subtasks.
3. "ACADEMIC": Rigorous academic inquiry optimized for research papers, peer-reviewed literature, theoretical mechanisms, methodology analysis, empirical benchmarks, and research gaps/limitations. Formulate 4-6 academic subtasks and search queries targeting IEEE, arXiv, ACM, and top journal domains.

PDF INTEGRATION:
${
  hasPdf
    ? `Documents attached: ${pdfNames.join(", ") || "PDF Document"}. Incorporate document findings, methodology, and cross-comparison with external literature.`
    : "No document attached."
}

CRITICAL RULES:
- Provide a clear, scannable list of subtasks that DORA will research.
- Do NOT output internal reasoning, internal chain-of-thought, or meta-commentary.
- Keep subtask titles clear, punchy, and informative (e.g. "Current architectural paradigms", "Benchmarking and empirical metrics", "Limitations and known failure modes").

Always respond in strictly valid JSON without markdown wrapping or backticks. Format:
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
Attached Documents: ${hasPdf ? pdfNames.join(", ") || "Attached PDF" : "None"}`;

    const response = await generateContentWithRetry({
      preferredModel: PRIMARY_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);

    return {
      intent: parsed.intent || `Investigate ${query} using ${mode} research methodology.`,
      mode,
      isComplex: isQuick ? false : true,
      hasPdf,
      subtasks:
        Array.isArray(parsed.subtasks) && parsed.subtasks.length > 0
          ? parsed.subtasks
          : isQuick
          ? [`Core definition, mechanism, and answer for "${query}"`]
          : isAcademic
          ? [
              "Theoretical framework and foundational literature",
              "State-of-the-art methodology and algorithmic mechanisms",
              "Empirical benchmarks, ablation studies, and performance data",
              "Critical limitations, open questions, and research gaps",
              "Key peer-reviewed and IEEE open access publications",
            ]
          : [
              "Core principles and current technologies",
              "Recent developments and architectural patterns",
              "Empirical performance and industry adoption",
              "Advantages, trade-offs, and critical limitations",
            ],
      searchQueries:
        Array.isArray(parsed.searchQueries) && parsed.searchQueries.length > 0
          ? parsed.searchQueries
          : [query],
      focusAreas:
        Array.isArray(parsed.focusAreas) && parsed.focusAreas.length > 0
          ? parsed.focusAreas
          : undefined,
    };
  } catch (err) {
    console.error("Error generating research plan:", err);
    // Fallback heuristic plan
    return {
      intent: `Conduct ${mode} research on: ${query}`,
      mode,
      isComplex: !isQuick,
      hasPdf,
      subtasks: isQuick
        ? [`Core factual synthesis and answer for "${query}"`]
        : isAcademic
        ? [
            `Literature review and foundational context of ${query}`,
            `Methodological and architectural breakdown`,
            `Empirical results, benchmarks, and validation`,
            `Limitations, trade-offs, and open research problems`,
            `Key academic and IEEE publications`,
          ]
        : [
            `Current technologies and foundations of ${query}`,
            `Recent developments and state of the art`,
            `Real-world adoption, performance benchmarks, and use cases`,
            `Advantages, limitations, and future outlook`,
          ],
      searchQueries: isAcademic
        ? [
            `${query} review paper IEEE arXiv`,
            `${query} methodology benchmarks evaluation`,
            `${query} limitations open research problems`,
          ]
        : [
            query,
            `${query} architecture documentation`,
            `${query} benchmarks comparison`,
          ],
    };
  }
}

