import { generateContentWithRetry, PRIMARY_MODEL } from "./geminiClient.js";
import { ResearchResult, DiagramResult } from "../src/types.js";

export async function generateResearchDiagram(
  research: ResearchResult
): Promise<DiagramResult> {
  const summaryContext = research.sections
    .map((s) => `### ${s.title}\n${s.content.slice(0, 1000)}`)
    .join("\n\n");

  const systemInstruction = `You are an expert system architect and visual knowledge designer for DORA.
Your task is to transform research findings into a clear, intuitive, and accurate Mermaid flowchart or block diagram code.

Rules for Mermaid generation:
1. Use "flowchart TD" or "flowchart LR" (top-to-bottom or left-to-right).
2. Clearly model the primary components, phases, data flows, core mechanisms, or key architectural blocks.
3. Group related entities using subgraphs where appropriate (e.g. "subgraph Core Principles", "subgraph Key Applications", "subgraph Inputs / Outputs").
4. Keep node labels concise (under 8 words per node) and readable.
5. Do not use special characters inside node labels that break Mermaid syntax (avoid unescaped parentheses, quotes, or braces inside node names, or put text inside clean quotes e.g. ["Label Here"]).
6. Return ONLY a valid JSON object matching this schema:
{
  "title": "Short title of the diagram",
  "mermaidCode": "flowchart TD\\n  A[Start] --> B[Process]...",
  "explanation": "1-2 sentences explaining what this block diagram illustrates."
}
Do NOT wrap the JSON in extra markdown ticks unless formatted as valid JSON string.`;

  const prompt = `Research Topic: "${research.query}"
Has PDF Document Context: ${research.hasPdf ? research.pdfFileName || "Yes" : "No"}

Key Research Findings & Sections:
${summaryContext}

Generate the flowchart/block diagram in valid JSON format now.`;

  try {
    const response = await generateContentWithRetry({
      preferredModel: PRIMARY_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response.text?.trim() || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Failed to parse diagram JSON response.");
      }
    }

    // Clean up mermaid code
    let code = parsed.mermaidCode || "";
    code = code.replace(/```mermaid/gi, "").replace(/```/g, "").trim();

    // Ensure it starts with flowchart or graph
    if (!code.startsWith("flowchart") && !code.startsWith("graph") && !code.startsWith("stateDiagram")) {
      code = `flowchart TD\n${code}`;
    }

    return {
      title: parsed.title || `${research.query} — Concept Flowchart`,
      mermaidCode: code,
      explanation:
        parsed.explanation ||
        `Architectural and conceptual block diagram mapping the core mechanisms and relationships of ${research.query}.`,
    };
  } catch (err: any) {
    console.error("Diagram generation error:", err);
    // Return a reliable fallback diagram structure
    const safeTopic = research.query.replace(/["'(){}[\]]/g, "");
    return {
      title: `${research.query} — Concept Flowchart`,
      mermaidCode: `flowchart TD
  Topic["${safeTopic}"] --> Foundations["Foundational Principles"]
  Topic --> Mechanics["Mechanism & Architecture"]
  Topic --> Implementations["Practical Applications"]
  Foundations --> Outcome["Synthesized Outcomes"]
  Mechanics --> Outcome
  Implementations --> Outcome`,
      explanation: `System-level concept diagram illustrating the foundational principles, core mechanics, and synthesized outcomes for ${research.query}.`,
    };
  }
}
