import { generateContentWithRetry, PRIMARY_MODEL } from "./geminiClient.js";
import { ResearchResult, QaMessage } from "../src/types.js";

export async function answerResearchFollowUp(params: {
  research: ResearchResult;
  question: string;
  history: QaMessage[];
}): Promise<string> {
  const { research, question, history } = params;

  const sectionsContext = research.sections
    .map((s) => `## ${s.title}\n${s.content}`)
    .join("\n\n");

  const sourcesContext = research.sources
    .slice(0, 10)
    .map((src) => `[${src.id}] ${src.title} (${src.url})`)
    .join("\n");

  const pdfContext =
    research.hasPdf && research.pdfReferences && research.pdfReferences.length > 0
      ? `\n\nPDF Document Findings (${research.pdfFileName}):\n` +
        research.pdfReferences
          .map(
            (p) =>
              `- [${p.sectionTitle}${p.pageNumber ? `, page ${p.pageNumber}` : ""}]: ${p.extractedFinding}`
          )
          .join("\n")
      : "";

  const systemInstruction = `You are DORA's Research Q&A Specialist.
You answer user follow-up questions strictly grounded in the research report, sources, and document evidence.

Guidelines:
1. Provide direct, objective, and precise answers without promotional fluff.
2. Directly cite the relevant sections or source numbers (e.g. [1], [2]) where applicable.
3. If the document or research report does not contain the answer, state that clearly and provide the best known factual explanation while noting it extends beyond the retrieved sources.
4. Format your answer using clean Markdown with bolding, code tags, or bullet points where it aids clarity.`;

  // Build dialogue history
  const recentHistory = history.slice(-6).map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const userTurn = `Original Research Topic: "${research.query}"

=== RESEARCH REPORT CONTEXT ===
${sectionsContext}

=== AVAILABLE SOURCES ===
${sourcesContext}
${pdfContext}

=== USER FOLLOW-UP QUESTION ===
${question}

Answer the question clearly and thoroughly:`;

  try {
    const contents: any[] = [];
    if (recentHistory.length > 0) {
      contents.push(...recentHistory);
    }
    contents.push({ role: "user", parts: [{ text: userTurn }] });

    const response = await generateContentWithRetry({
      preferredModel: PRIMARY_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    return response.text?.trim() || "No response could be generated for this question.";
  } catch (err: any) {
    console.error("QA Assistant error:", err);
    throw new Error(err.message || "Failed to process follow-up question.");
  }
}
