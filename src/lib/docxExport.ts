import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { ResearchResult, QaMessage } from "../types.js";

export async function generateDocxBlob(
  result: ResearchResult,
  qaMessages: QaMessage[] = []
): Promise<Blob> {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      text: `Research Report: ${result.query}`,
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    })
  );

  // Metadata
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${new Date().toLocaleString()} | Mode: ${
            result.mode?.toUpperCase() || (result.isDeepResearch ? "DEEP" : "QUICK")
          }`,
          italics: true,
          color: "666666",
        }),
      ],
      spacing: { after: 100 },
    })
  );

  if (result.hasPdf && result.pdfFileName) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Document Context: ${result.pdfFileName}`,
            bold: true,
            color: "333333",
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // Divider
  children.push(
    new Paragraph({
      text: "------------------------------------------------------------",
      spacing: { after: 300 },
    })
  );

  // Sections
  for (const section of result.sections) {
    children.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
      })
    );

    const paragraphs = section.content.split("\n\n");
    for (const para of paragraphs) {
      const cleanPara = para.trim().replace(/^###\s+/, "").replace(/^##\s+/, "");
      if (!cleanPara) continue;

      children.push(
        new Paragraph({
          text: cleanPara,
          spacing: { after: 120 },
        })
      );
    }
  }

  // Contradictions
  if (result.contradictions && result.contradictions.length > 0) {
    children.push(
      new Paragraph({
        text: "Conflicting Information & Disagreements",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
      })
    );

    for (const c of result.contradictions) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Topic: ${c.topic}\n`, bold: true }),
            new TextRun({ text: `• Claim A (${c.sourceA}): ${c.claimA}\n` }),
            new TextRun({ text: `• Claim B (${c.sourceB}): ${c.claimB}\n` }),
            new TextRun({ text: `• Analysis: ${c.analysis}\n`, italics: true }),
          ],
          spacing: { after: 150 },
        })
      );
    }
  }

  // PDF References
  if (result.hasPdf && result.pdfReferences && result.pdfReferences.length > 0) {
    children.push(
      new Paragraph({
        text: `Document References (${result.pdfFileName})`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
      })
    );

    for (const p of result.pdfReferences) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${p.sectionTitle}${p.pageNumber ? ` (Page ${p.pageNumber})` : ""}: `,
              bold: true,
            }),
            new TextRun({ text: p.extractedFinding }),
          ],
          spacing: { after: 100 },
        })
      );
    }
  }

  // Academic Papers
  if (result.papers.length > 0) {
    children.push(
      new Paragraph({
        text: "Academic Publications & IEEE Papers",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
      })
    );

    for (const p of result.papers) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `• ${p.title} `, bold: true }),
            new TextRun({
              text: `(${p.publication || "Academic"}${p.year ? `, ${p.year}` : ""}): ${p.url}\n`,
            }),
            p.relevance ? new TextRun({ text: `  Relevance: ${p.relevance}\n`, italics: true }) : new TextRun(""),
          ],
          spacing: { after: 100 },
        })
      );
    }
  }

  // Verified Sources
  if (result.sources.length > 0) {
    children.push(
      new Paragraph({
        text: "Verified Sources & Citations",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
      })
    );

    for (const s of result.sources) {
      children.push(
        new Paragraph({
          text: `[${s.id}] ${s.title} (${s.domain || "Web"}): ${s.url}`,
          spacing: { after: 80 },
        })
      );
    }
  }

  // Follow-up Q&A
  if (qaMessages.length > 0) {
    children.push(
      new Paragraph({
        text: "Follow-up Inquiries (Q&A)",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
      })
    );

    for (const qa of qaMessages) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${qa.role === "user" ? "Q" : "A"}: `,
              bold: true,
            }),
            new TextRun({ text: qa.content }),
          ],
          spacing: { after: 100 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
