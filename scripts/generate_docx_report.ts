import fs from "fs";
import path from "path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
} from "docx";

async function createComprehensiveDocxReport() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "DORA: Deep Orchestration Research Assistant — System Architecture Report",
                    size: 18,
                    color: "888888",
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Page ",
                    size: 18,
                    color: "888888",
                    font: "Arial",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: "888888",
                    font: "Arial",
                  }),
                  new TextRun({
                    text: " of ",
                    size: 18,
                    color: "888888",
                    font: "Arial",
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: "888888",
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Document Title
          new Paragraph({
            text: "DORA: Deep Orchestration Research Assistant",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 150 },
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Comprehensive System Architecture, Codebase Specification & Operational Report",
                bold: true,
                size: 26,
                color: "10b981", // Emerald accent
                font: "Arial",
              }),
            ],
            spacing: { after: 300 },
          }),

          // Metadata Table-style Paragraphs
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Version: 2.5 Autonomous  |  Platform: Full-Stack Web Application (Node.js + React 19)  |  Status: Production Verified",
                size: 20,
                color: "666666",
                font: "Arial",
              }),
            ],
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "------------------------------------------------------------------------------------------------------------------------",
                color: "cccccc",
              }),
            ],
            spacing: { after: 300 },
          }),

          // SECTION 1: EXECUTIVE SUMMARY
          new Paragraph({
            text: "1. Executive Summary & Project Purpose",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "DORA (Deep Orchestration Research Assistant) is a modern, high-precision autonomous AI research application engineered to solve the most prevalent failure modes of standard conversational chatbots: factual hallucinations, generic answers, repetitive claims, and lack of verifiable citations. Unlike typical LLM query-response loops, DORA implements a deterministic, multi-phase execution pipeline that coordinates intent analysis, web source grounding, multi-PDF document intelligence, cross-source contradiction detection, and algorithmic deduplication.",
                size: 22,
                font: "Calibri",
              }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "The application is built as a responsive Single Page Web Application (accessible across smartphones, tablets, laptops, and workstations) powered by React 19, Tailwind CSS, TypeScript, Express, Google Gemini, and Firebase Authentication.",
                size: 22,
                font: "Calibri",
              }),
            ],
            spacing: { after: 200 },
          }),

          // SECTION 2: TECHNOLOGY STACK
          new Paragraph({
            text: "2. Technology Stack & Component Architecture",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "The DORA platform leverages a modern stack designed for speed, type-safety, and minimal runtime overhead:",
                size: 22,
                font: "Calibri",
              }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Frontend Framework: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "React 19 with TypeScript, delivering concurrent rendering and reactive state orchestration.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Styling & Responsive System: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Tailwind CSS v4 with custom dark/light theme variables and touch-optimized layout tokens.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Animation & Interactivity: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Motion (Framer Motion) for smooth layout transitions and GSAP for staggered multi-layer navigation drawers.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Diagrams & Flowcharts: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Mermaid.js for client-side rendering of visual architecture flowcharts, state diagrams, and block relationships.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Backend & Streaming Engine: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Node.js with Express and Server-Sent Events (SSE) streaming (/api/research/stream) for real-time telemetry.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Artificial Intelligence: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "@google/genai SDK leveraging Google Gemini 3.1 Flash-Lite and Gemini 3.7 Flash models with automated retry fallbacks.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Authentication: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Firebase Authentication v11 with Google OAuth, GitHub Developer OAuth, and Email/Password registration.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Cloud Hosting: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Vercel Serverless Functions with 60-second execution quotas and edge routing.", size: 22, font: "Calibri" }),
            ],
            spacing: { after: 200 },
          }),

          // SECTION 3: THE END-TO-END PIPELINE
          new Paragraph({
            text: "3. End-to-End Deep Research Execution Pipeline",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Every research query sent to DORA progresses through six deterministic stages, streaming real-time status updates back to the UI:",
                size: 22,
                font: "Calibri",
              }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Stage 1 — Research Planning & Intent Analysis: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "The query is decomposed into intent summaries, subtasks, and academic search queries tailored to the selected mode (Quick, Deep, or Academic).", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Stage 2 — Parallel Multi-Source Retrieval: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "DORA executes grounded searches, retrieving peer-reviewed academic papers (IEEE, arXiv, ACM, Nature), domain citations, video lectures, and open-source datasets.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Stage 3 — PDF Document Intelligence: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "If PDF documents are uploaded, DORA analyzes them in-context, extracting exact page numbers and section citations without hallucination.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Stage 4 — Evidence Evaluation & Contradiction Detection: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Cross-checks claims between the uploaded PDF context and public academic literature, actively detecting conflicting viewpoints.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Stage 5 — Structured Synthesis with Claim-Level Grounding: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Synthesizes an academic-grade markdown report enforcing bracketed numeric citations [1], [2] for all assertions, statistics, and benchmark claims.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Stage 6 — No-Repetition Deduplication Filter: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Normalizes URLs, canonicalizes arXiv/YouTube links, and eliminates duplicate claims and redundant bibliographic references.", size: 22, font: "Calibri" }),
            ],
            spacing: { after: 200 },
          }),

          // SECTION 4: MANDATORY CODE MODULES
          new Paragraph({
            text: "4. Mission-Critical Code Modules & Deep Dive",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "server/orchestrator.ts: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "The central nervous system. Manages asynchronous execution, telemetry streaming callbacks, and timing benchmarks.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "server/geminiClient.ts: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Self-healing AI connection wrapper. Automatically recovers from rate limits (HTTP 429) using exponential backoff and seamless fallback to gemini-3.1-flash-lite.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "server/pdfProcessor.ts: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Extracts factual claims bounded by JSON schemas with strictly validated page numbers.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "server/deduplicator.ts: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Deterministic deduplication system preventing LLM repetitive output across sections and bibliographies.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "src/context/AuthContext.tsx & src/lib/firebase.ts: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Handles persistent authentication state, OAuth popup verification, and automatic token refresh.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "vercel.json & api/index.ts: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Vercel serverless integration routing /api/* to headless Express execution with extended 60s execution budgets.", size: 22, font: "Calibri" }),
            ],
            spacing: { after: 200 },
          }),

          // SECTION 5: RESPONSIVE & MOBILE ENGINEERING
          new Paragraph({
            text: "5. Responsive & Mobile Engineering Specifications",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "DORA was engineered with dedicated mobile-first enhancements to guarantee a flawless experience across smartphones:",
                size: 22,
                font: "Calibri",
              }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "iOS Auto-Zoom Prevention: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Inputs use 'text-base sm:text-xs' (16px base font on mobile), eliminating iOS Safari's disruptive viewport auto-zooming.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Adaptive Full-Width Drawer: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "StaggeredMenu expands to 100vw on devices below 640px, giving touch users full visibility of history and settings.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Auto-Expanded Login Card: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Touch devices automatically expand the login credentials card on load, eliminating touch friction.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Table & Code Overflow Shields: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Markdown tables and code blocks are enclosed in dedicated horizontal scroll containers with custom slim scrollbars.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Touch Cursor Deactivation: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Custom canvas cursor effects cleanly return null on touch devices, preventing touch lag and gesture conflicts.", size: 22, font: "Calibri" }),
            ],
            spacing: { after: 200 },
          }),

          // SECTION 6: WHY DORA SUCCEEDS
          new Paragraph({
            text: "6. Why DORA Works Well: Engineering Principles",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "1. Deterministic JSON Boundaries: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Eliminates conversational rambling and ensures strict programmatic data models.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "2. Real-Time Telemetry over SSE: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Zero database polling overhead while providing users with instantaneous visual progress indicators.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "3. Dual-Layer Fallback Architecture: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Guarantees high uptime even during peak API traffic and quota limitations.", size: 22, font: "Calibri" }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "4. Client-Side Document Export: ", bold: true, size: 22, font: "Calibri" }),
              new TextRun({ text: "Generates formatted Word (.docx) documents in-memory directly on the client, preserving user privacy.", size: 22, font: "Calibri" }),
            ],
            spacing: { after: 300 },
          }),

          // SECTION 7: CONCLUSION
          new Paragraph({
            text: "7. Conclusion",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "DORA demonstrates a production-grade realization of an autonomous, deep research assistant. Through its multi-stage pipeline, real-time citation grounding, contradiction discovery, and responsive architecture, it sets a reliable benchmark for scientific, industrial, and academic inquiry.",
                size: 22,
                font: "Calibri",
              }),
            ],
            spacing: { after: 400 },
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "End of Technical Report  •  DORA Research Architecture  •  © 2026",
                italics: true,
                size: 18,
                color: "888888",
                font: "Arial",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(process.cwd(), "DORA_SYSTEM_DOCUMENTATION_REPORT.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document generated successfully at: ${outputPath}`);
}

createComprehensiveDocxReport().catch((err) => {
  console.error("Failed to generate docx report:", err);
  process.exit(1);
});
