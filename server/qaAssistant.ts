import { generateContentWithRetry, PRIMARY_MODEL } from "./geminiClient.js";
import { ResearchResult, QaMessage } from "../src/types.js";

const FOLLOW_UP_CONTEXT_LIMIT = 14_000;
const FOLLOW_UP_DOCUMENT_CONTEXT_LIMIT = 8_000;
const FOLLOW_UP_HISTORY_ITEM_LIMIT = 2_000;
const FOLLOW_UP_HISTORY_LIMIT = 6;
const FOLLOW_UP_TIMEOUT_MS = 20_000;

function boundedText(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit)}\n\n[Context truncated to keep this follow-up responsive.]`;
}

export async function answerResearchFollowUp(params: {
  research: ResearchResult;
  question: string;
  history: QaMessage[];
}): Promise<string> {
  const { research, question, history } = params;

  const sectionsContext = boundedText(research.sections
    .map((s) => `## ${s.title}\n${s.content}`)
    .join("\n\n"), FOLLOW_UP_CONTEXT_LIMIT);

  const sourcesContext = research.sources
    .slice(0, 10)
    .map((src) => `[${src.id}] ${src.title} (${src.url})`)
    .join("\n");

  const pdfContext = research.hasPdf
      ? `\n\nPDF Document Context (${research.pdfFileName}):\n${boundedText(research.pdfDocumentContext || "", FOLLOW_UP_DOCUMENT_CONTEXT_LIMIT)}\n` +
        (research.pdfReferences && research.pdfReferences.length > 0
          ?
        research.pdfReferences
          .map(
            (p) =>
              `- [${p.sectionTitle}${p.pageNumber ? `, page ${p.pageNumber}` : ""}]: ${p.extractedFinding}`
          )
          .join("\n") : "") +
        (research.pdfProcessingError ? `\nDocument processing notice: ${research.pdfProcessingError}` : "")
      : "";

  const systemInstruction = `You are DORA's Research Q&A Specialist.
You answer user follow-up questions strictly grounded in the research report, sources, and document evidence.

Guidelines:
1. Provide direct, objective, and precise answers without promotional fluff.
2. Directly cite the relevant sections or source numbers (e.g. [1], [2]) where applicable.
3. If the document or research report does not contain the answer, state that clearly and provide the best known factual explanation while noting it extends beyond the retrieved sources.
4. Format your answer using clean Markdown with bolding, code tags, or bullet points where it aids clarity.`;

  // Build dialogue history
  const recentHistory = history.slice(-FOLLOW_UP_HISTORY_LIMIT).map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: boundedText(msg.content, FOLLOW_UP_HISTORY_ITEM_LIMIT) }],
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
      timeoutMs: FOLLOW_UP_TIMEOUT_MS,
    }, 0);

    return response.text?.trim() || "No response could be generated for this question.";
  } catch (err: any) {
    console.error("QA Assistant error:", err);
    throw new Error(err.message || "Failed to process follow-up question.");
  }
}
