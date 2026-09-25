import { generateContentWithRetry, PRIMARY_MODEL } from "./geminiClient.js";
import { PdfReference, UploadedFile } from "../src/types.js";

export interface MultiPdfAnalysisResult {
  fileNames: string[];
  documentSummary: string;
  extractedFindings: string;
  pdfReferences: PdfReference[];
}

export async function processPdfDocuments(
  files: UploadedFile[],
  query: string
): Promise<MultiPdfAnalysisResult> {
  if (!files || files.length === 0) {
    return {
      fileNames: [],
      documentSummary: "No PDF documents provided.",
      extractedFindings: "",
      pdfReferences: [],
    };
  }

  const fileNames = files.map((f) => f.name);

  const systemInstruction = `You are DORA's Document Intelligence Engine.
Analyze the provided PDF document(s) with high academic and empirical precision.

OBJECTIVES:
1. Read all attached PDF documents thoroughly in the context of the user's research query: "${query}".
2. Identify core methodologies, key empirical data points, theorems, benchmarks, and conclusions.
3. If multiple PDFs are attached, identify comparative relationships, differences in methodology, or contrasting findings.
4. Extract specific, claim-level findings with exact page numbers (e.g. Page 4, Section 3.2). Do NOT fabricate any page numbers or section titles.
5. Format extracted references in a JSON block at the very end of your response, strictly bounded by <<<REFERENCES_JSON and REFERENCES_JSON>>>:

<<<REFERENCES_JSON
[
  {
    "id": "ref-1",
    "fileName": "name-of-file.pdf",
    "sectionTitle": "Section name or header",
    "pageNumber": 1,
    "extractedFinding": "Specific finding or data point from this page",
    "relevanceToQuery": "Why relevant"
  }
]
REFERENCES_JSON>>>`;

  const parts: any[] = [];

  // Add all PDF documents as parts
  for (const file of files) {
    parts.push({
      inlineData: {
        mimeType: file.mimeType || "application/pdf",
        data: file.data,
      },
    });
  }

  parts.push({
    text: `Documents Analyzed: ${fileNames.join(", ")}
Research Inquiry: "${query}"

Please extract structured findings, cite exact page numbers, explain core terminology, and note any empirical discoveries or cross-document comparisons.`,
  });

  try {
    const response = await generateContentWithRetry({
      preferredModel: PRIMARY_MODEL,
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const outputText = response.text || "";

    let pdfReferences: PdfReference[] = [];
    const jsonMatch = outputText.match(/<<<REFERENCES_JSON\s*([\s\S]*?)\s*REFERENCES_JSON>>>/);

    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (Array.isArray(parsed)) {
          pdfReferences = parsed.map((p, idx) => ({
            id: p.id || `ref-${idx + 1}`,
            fileName: p.fileName || fileNames[0],
            sectionTitle: p.sectionTitle || "Key Section",
            pageNumber: p.pageNumber,
            extractedFinding: p.extractedFinding || "",
            relevanceToQuery: p.relevanceToQuery,
          }));
        }
      } catch (err) {
        console.warn("Failed to parse PDF references JSON:", err);
      }
    }

    const cleanedText = outputText
      .replace(/<<<REFERENCES_JSON[\s\S]*?REFERENCES_JSON>>>/, "")
      .trim();

    return {
      fileNames,
      documentSummary: cleanedText.slice(0, 600) + "...",
      extractedFindings: cleanedText,
      pdfReferences,
    };
  } catch (err) {
    console.error("Error in processPdfDocuments:", err);
    return {
      fileNames,
      documentSummary: "Automated document processing encountered an issue.",
      extractedFindings: `PDF Analysis error: ${
        err instanceof Error ? err.message : String(err)
      }`,
      pdfReferences: [],
    };
  }
}

