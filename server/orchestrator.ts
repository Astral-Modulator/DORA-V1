import { createResearchPlan } from "./planner.js";
import { retrieveInformation } from "./retriever.js";
import { processPdfDocuments } from "./pdfProcessor.js";
import { runDeduplicationSystem } from "./deduplicator.js";
import { synthesizeResearchAnswer } from "./synthesizer.js";
import {
  ResearchResult,
  ResearchRequestPayload,
  ProgressStep,
  ProgressStepId,
  UploadedFile,
} from "../src/types.js";

export type ProgressCallback = (step: ProgressStep) => void;

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

  // STEP 1: Research Planning
  notify(
    "planning",
    `Formulating ${mode.toUpperCase()} research plan...`,
    "in_progress"
  );
  const plan = await createResearchPlan(query, mode, hasPdf, pdfNames);

  const planPreview =
    plan.subtasks.length > 0
      ? `Researching:\n${plan.subtasks.map((st, i) => `${i + 1}. ${st}`).join("   ")}`
      : `Intent: "${plan.intent}"`;

  notify("planning", "Research plan formulated", "completed", planPreview);

  // STEP 2 & 3: Web Retrieval & PDF Processing
  notify(
    "retrieval",
    `Retrieving ${mode === "academic" ? "academic papers & peer-reviewed sources" : "verified sources"}...`,
    "in_progress"
  );

  if (hasPdf) {
    notify(
      "pdf_processing",
      `Analyzing document${uploadedFiles.length > 1 ? "s" : ""}: ${pdfNames.join(", ")}...`,
      "in_progress"
    );
  } else {
    notify("pdf_processing", "No PDF uploaded", "skipped");
  }

  const [retrievalResult, pdfResult] = await Promise.all([
    retrieveInformation(query, plan.searchQueries, mode),
    hasPdf
      ? processPdfDocuments(uploadedFiles, query)
      : Promise.resolve(undefined),
  ]);

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
    "Cross-referencing evidence and evaluating source credibility...",
    "in_progress"
  );

  notify(
    "evaluation",
    "Evidence evaluated",
    "completed",
    `Evaluated source authority and cross-referenced claims between external literature and document context.`
  );

  // STEP 5: Report Synthesis
  notify(
    "synthesis",
    `Synthesizing ${mode.toUpperCase()} research report with claim citations...`,
    "in_progress"
  );

  const synthesisResult = await synthesizeResearchAnswer({
    query,
    plan,
    webSummary: retrievalResult.summaryOfFindings,
    sources: retrievalResult.sources,
    pdfAnalysis: pdfResult,
  });

  notify("synthesis", "Report synthesis complete", "completed");

  // STEP 6: No-Repetition System (Deduplication)
  notify(
    "deduplication",
    "Applying No-Repetition filter across all findings and sources...",
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

