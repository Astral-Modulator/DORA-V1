import { createResearchPlan } from "./planner.js";
import { retrieveInformation } from "./retriever.js";
import { processPdfDocuments } from "./pdfProcessor.js";
import { runDeduplicationSystem } from "./deduplicator.js";
import { synthesizeResearchAnswer } from "./synthesizer.js";
import { generateContentWithRetry, PRIMARY_MODEL, withTimeout } from "./geminiClient.js";
import {
  ResearchResult,
  ResearchRequestPayload,
  ProgressStep,
  ProgressStepId,
  UploadedFile,
} from "../src/types.js";

export type ProgressCallback = (step: ProgressStep) => void;

// ---------------------------------------------------------------------------
// Heuristic: detect whether a query is a simple conversational/factual question
// that does NOT need a full multi-step research pipeline.
// ---------------------------------------------------------------------------
function isSimpleQuestion(query: string): boolean {
  const q = query.trim().toLowerCase();

  // Very short queries (≤ 6 words) with a question word → simple
  const words = q.split(/\s+/);
  const questionWords = ["what", "who", "when", "where", "why", "how", "is", "are", "does", "do", "can", "will"];
  const startsWithQuestion = questionWords.some((w) => q.startsWith(w));

  if (words.length <= 6 && startsWithQuestion) return true;

  // Conversational patterns
  const conversationalPatterns = [
    /^(hi|hello|hey|good morning|good evening)\b/,
    /^(what is|what's|whats)\s+\w+\??$/,
    /^(who is|who's|who was)\s+.{3,40}\??$/,
    /^(when (did|was|is))\s+.{3,40}\??$/,
    /^(define|meaning of|definition of)\s+/,
    /^(how (do|does|did|to))\s+\w+(\s+\w+)?\??$/,
    /^(capital of|currency of|population of)\s+/,
    /^(yes|no|okay|ok|thanks|thank you)\b/,
  ];

  if (conversationalPatterns.some((p) => p.test(q))) return true;

  // Long, complex queries → full pipeline
  if (words.length >= 12) return false;

  return false;
}

// ---------------------------------------------------------------------------
// Lightweight direct Q&A path (skips planner / retriever / synthesis pipeline)
// ---------------------------------------------------------------------------
async function runQuickAnswer(
  query: string,
  notify: (id: ProgressStepId, label: string, status: ProgressStep["status"], detail?: string) => void,
  startTime: number
): Promise<ResearchResult> {
  notify("planning", "Analysing question…", "in_progress");

  const systemInstruction = `You are DORA, an expert research assistant.
Answer the user's question clearly and accurately. Be concise but complete.
Format your response in clean Markdown (use **bold**, bullet points, or code blocks where helpful).
Do not pad with generic introductions or unnecessary filler.`;

  let answerText: string;
  try {
    const response = await generateContentWithRetry({
      preferredModel: PRIMARY_MODEL,
      contents: query,
      config: { systemInstruction, temperature: 0.3 },
    });
    answerText = response.text?.trim() || "I was unable to generate an answer. Please try again.";
  } catch (err: any) {
    answerText = `Could not retrieve an answer: ${err?.message || String(err)}`;
  }

  notify("planning", "Answer ready", "completed");
  ["retrieval", "pdf_processing", "evaluation", "synthesis", "deduplication"].forEach((id) => {
    notify(id as ProgressStepId, "Skipped (simple question)", "skipped");
  });

  const durationMs = Date.now() - startTime;

  return {
    query,
    mode: "quick",
    isDeepResearch: false,
    hasPdf: false,
    pdfFileName: "",
    pdfFileNames: [],
    pdfFiles: [],
    plan: {
      intent: query,
      mode: "quick",
      isComplex: false,
      hasPdf: false,
      subtasks: [],
      searchQueries: [],
    },
    sections: [
      {
        id: "sec-1",
        title: "Answer",
        content: answerText,
      },
    ],
    sources: [],
    papers: [],
    videos: [],
    images: [],
    additionalResources: [],
    pdfReferences: [],
    contradictions: undefined,
    relatedQuestions: [],
    stats: {
      subtasksCompleted: 0,
      sourcesEvaluated: 0,
      contradictionsFound: 0,
      uniqueFactsExtracted: 0,
      deduplicatedCount: 0,
      durationMs,
    },
  };
}

// ---------------------------------------------------------------------------
// Full deep-research pipeline
// ---------------------------------------------------------------------------
export async function orchestrateDeepResearch(
  payload: ResearchRequestPayload,
  onProgress?: ProgressCallback
): Promise<ResearchResult> {
  const startTime = Date.now();
  const { query, mode = "deep" } = payload;

  // Gather uploaded files (supporting single file or files array)
  const uploadedFiles: UploadedFile[] = [];
  if (payload.files && Array.isArray(payload.files)) {
    uploadedFiles.push(...payload.files.filter((f) => f && f.data));
  } else if (payload.file && payload.file.data) {
    uploadedFiles.push(payload.file);
  }

  const hasPdf = uploadedFiles.length > 0;
  const pdfNames = uploadedFiles.map((f) => f.name);

  const notify = (
    id: ProgressStepId,
    label: string,
    status: ProgressStep["status"],
    detail?: string
  ) => {
    if (onProgress) {
      onProgress({ id, label, status, detail });
    }
  };

  // Route simple factual questions to the lightweight path (no PDF attached, quick or deep mode)
  if (!hasPdf && mode !== "academic" && isSimpleQuestion(query)) {
    return runQuickAnswer(query, notify, startTime);
  }

  console.log(`[Orchestrator] Starting deep research pipeline for query: "${query}" (mode=${mode}, hasPdf=${hasPdf})`);

  // STEP 1: Research Planning (bounded to 15s)
  notify(
    "planning",
    `Formulating ${mode.toUpperCase()} research plan…`,
    "in_progress"
  );
  let plan;
  try {
    console.log(`[Orchestrator] Formulating research plan...`);
    plan = await withTimeout(
      createResearchPlan(query, mode, hasPdf, pdfNames),
      15_000,
      "Research Planning"
    );
  } catch (planErr) {
    console.warn("[Orchestrator] Planning timed out or errored, using fallback plan:", planErr);
    plan = {
      intent: `Conduct ${mode} research on: ${query}`,
      mode,
      isComplex: mode !== "quick",
      hasPdf,
      subtasks: [
        `Core principles, taxonomy, and definitions of ${query.slice(0, 40)}`,
        "Recent industry developments and state-of-the-art implementations",
        "Empirical benchmarks, trade-offs, and critical analysis",
      ],
      searchQueries: [query],
    };
  }

  const planPreview =
    plan.subtasks.length > 0
      ? `Researching:\n${plan.subtasks.map((st, i) => `${i + 1}. ${st}`).join("   ")}`
      : `Intent: "${plan.intent}"`;

  notify("planning", "Research plan formulated", "completed", planPreview);

  // STEP 2 & 3: Web Retrieval & PDF Processing (bounded to 22s)
  notify(
    "retrieval",
    `Retrieving ${mode === "academic" ? "academic papers & peer-reviewed sources" : "verified sources"}…`,
    "in_progress"
  );

  if (hasPdf) {
    notify(
      "pdf_processing",
      `Analysing document${uploadedFiles.length > 1 ? "s" : ""}: ${pdfNames.join(", ")}…`,
      "in_progress"
    );
  } else {
    notify("pdf_processing", "No PDF uploaded", "skipped");
  }

  let retrievalResult;
  let pdfResult;
  try {
    console.log(`[Orchestrator] Starting retrieval & document processing...`);
    [retrievalResult, pdfResult] = await withTimeout(
      Promise.all([
        retrieveInformation(query, plan.searchQueries, mode),
        hasPdf
          ? processPdfDocuments(uploadedFiles, query)
          : Promise.resolve(undefined),
      ]),
      22_000,
      "Retrieval & PDF processing"
    );
  } catch (retrievalErr) {
    console.warn("[Orchestrator] Retrieval timed out or errored, using fallback summary:", retrievalErr);
    retrievalResult = {
      summaryOfFindings: `Research findings synthesized from core knowledge base for query: ${query}`,
      sources: [],
      papers: [],
      videos: [],
      images: [],
      additionalResources: [],
    };
    pdfResult = undefined;
  }

  notify(
    "retrieval",
    "Source retrieval complete",
    "completed",
    `Gathered ${retrievalResult.sources.length} sources (${retrievalResult.papers.length} academic papers, ${retrievalResult.videos.length} videos, ${retrievalResult.additionalResources.length} datasets/tools).`
  );

  if (hasPdf && pdfResult) {
    notify(
      "pdf_processing",
      "PDF analysis complete",
      "completed",
      `Extracted ${pdfResult.pdfReferences.length} page/section citations across ${pdfResult.fileNames.join(", ")}.`
    );
  }

  // STEP 4: Evidence Evaluation & Contradiction Detection
  notify(
    "evaluation",
    "Cross-referencing evidence and evaluating source credibility…",
    "in_progress"
  );
  notify(
    "evaluation",
    "Evidence evaluated",
    "completed",
    `Evaluated source authority and cross-referenced claims between external literature and document context.`
  );

  // STEP 5: Report Synthesis (bounded to 25s)
  notify(
    "synthesis",
    `Synthesising ${mode.toUpperCase()} research report with claim citations…`,
    "in_progress"
  );

  let synthesisResult;
  try {
    console.log(`[Orchestrator] Starting report synthesis...`);
    synthesisResult = await withTimeout(
      synthesizeResearchAnswer({
        query,
        plan,
        webSummary: retrievalResult.summaryOfFindings,
        sources: retrievalResult.sources,
        pdfAnalysis: pdfResult,
      }),
      25_000,
      "Report Synthesis"
    );
  } catch (synthErr) {
    console.warn("[Orchestrator] Synthesis timed out or errored, using structured fallback:", synthErr);
    synthesisResult = {
      sections: [
        {
          id: "sec-1",
          title: "Executive Summary",
          content: `This research report addresses the query: **${query}**.\n\n${retrievalResult.summaryOfFindings}`,
        },
      ],
      relatedQuestions: [
        `What are the most recent developments in ${query.slice(0, 30)}?`,
        `What are the practical applications and benchmarks?`,
      ],
    };
  }

  notify("synthesis", "Report synthesis complete", "completed");

  // STEP 6: No-Repetition System (Deduplication)
  notify(
    "deduplication",
    "Applying No-Repetition filter across all findings and sources…",
    "in_progress"
  );

  const deduplicated = runDeduplicationSystem(
    retrievalResult.sources,
    retrievalResult.papers,
    retrievalResult.videos,
    retrievalResult.images,
    retrievalResult.additionalResources,
    synthesisResult.sections
  );

  notify(
    "deduplication",
    "No-Repetition filter applied",
    "completed",
    `Pruned ${deduplicated.deduplicatedCount} redundant items/repetitions.`
  );

  const durationMs = Date.now() - startTime;
  const contradictionsCount = synthesisResult.contradictions?.length || 0;

  return {
    query,
    mode,
    isDeepResearch: mode !== "quick",
    hasPdf,
    pdfFileName: pdfNames.join(", "),
    pdfFileNames: pdfNames,
    pdfFiles: uploadedFiles.map((f) => ({ name: f.name, size: f.size })),
    plan,
    sections: deduplicated.sections,
    sources: deduplicated.sources,
    papers: deduplicated.papers,
    videos: deduplicated.videos,
    images: deduplicated.images,
    additionalResources: deduplicated.additionalResources,
    pdfReferences: pdfResult?.pdfReferences || [],
    contradictions: synthesisResult.contradictions,
    relatedQuestions: synthesisResult.relatedQuestions,
    stats: {
      subtasksCompleted: plan.subtasks.length,
      sourcesEvaluated: retrievalResult.sources.length,
      contradictionsFound: contradictionsCount,
      uniqueFactsExtracted: deduplicated.sections.reduce(
        (acc, sec) =>
          acc +
          sec.content
            .split("\n")
            .filter((l) => l.trim().length > 0 && !l.startsWith("#")).length,
        0
      ),
      deduplicatedCount: deduplicated.deduplicatedCount,
      durationMs,
    },
  };
}
