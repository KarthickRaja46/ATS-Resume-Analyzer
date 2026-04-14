/**
 * Export Service
 * Handles exporting resumes and analysis in multiple formats (PDF, DOCX, CSV, JSON, Markdown)
 */

import { Analysis, Resume } from "@shared/db-types";

interface ExportOptions {
  format: "pdf" | "docx" | "csv" | "json" | "markdown";
  includeAnalysis?: boolean;
  includeRecommendations?: boolean;
}

interface ExportResult {
  filename: string;
  mimeType: string;
  buffer: Buffer | string;
}

/**
 * Export resume with optional analysis
 */
export async function exportResume(
  resume: Resume,
  analysis?: Analysis,
  options: ExportOptions = { format: "pdf" }
): Promise<ExportResult> {
  const { format, includeAnalysis = false, includeRecommendations = false } = options;

  switch (format) {
    case "pdf":
      return exportToPDF(resume, analysis, includeAnalysis, includeRecommendations);
    case "docx":
      return exportToDOCX(resume, analysis, includeAnalysis, includeRecommendations);
    case "markdown":
      return exportToMarkdown(resume, analysis, includeAnalysis, includeRecommendations);
    case "json":
      return exportToJSON(resume, analysis, includeAnalysis);
    case "csv":
      return exportToCSV(resume, analysis);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Export analysis report
 */
export async function exportAnalysisReport(
  resume: Resume,
  analysis: Analysis,
  format: "pdf" | "json" | "markdown" = "pdf"
): Promise<ExportResult> {
  const isPDF = format === "pdf";
  
  const report = {
    title: `ATS Analysis Report - ${resume.fileName}`,
    generatedAt: new Date().toISOString(),
    resumeInfo: {
      fileName: resume.fileName,
      uploadedAt: resume.createdAt,
      lastUpdated: resume.updatedAt,
    },
    jobRole: analysis.jobRole,
    scores: {
      internScore: analysis.internScore,
      jobScore: analysis.jobScore,
      percentile: analysis.benchmarkPercentile || "N/A",
    },
    analysis: {
      matchedKeywords: JSON.parse(analysis.matchedKeywordsJob || "[]"),
      missingKeywords: JSON.parse(analysis.missingKeywordsJob || "[]"),
      structureValidation: parseJSONSafely(analysis.structureValidation),
      recommendations: parseJSONSafely(analysis.recommendations),
      customKeywords: analysis.customKeywords ? JSON.parse(analysis.customKeywords) : [],
    },
  };

  switch (format) {
    case "pdf":
      return generatePDFReport(report);
    case "markdown":
      return generateMarkdownReport(report);
    case "json":
      return {
        filename: `analysis-report-${Date.now()}.json`,
        mimeType: "application/json",
        buffer: JSON.stringify(report, null, 2),
      };
    default:
      throw new Error(`Unsupported report format: ${format}`);
  }
}

/**
 * Batch export multiple analyses
 */
export async function exportBulkAnalyses(
  analyses: Array<{ resume: Resume; analysis: Analysis }>,
  format: "csv" | "json" = "csv"
): Promise<ExportResult> {
  if (format === "json") {
    const data = analyses.map(({ resume, analysis }) => ({
      resumeFileName: resume.fileName,
      uploadDate: resume.createdAt,
      jobRole: analysis.jobRole,
      internScore: analysis.internScore,
      jobScore: analysis.jobScore,
      matchedKeywordsCount: JSON.parse(analysis.matchedKeywordsJob || "[]").length,
      missingKeywordsCount: JSON.parse(analysis.missingKeywordsJob || "[]").length,
      percentile: analysis.benchmarkPercentile,
    }));

    return {
      filename: `bulk-export-${Date.now()}.json`,
      mimeType: "application/json",
      buffer: JSON.stringify(data, null, 2),
    };
  }

  // CSV format
  const headers = [
    "Resume File Name",
    "Upload Date",
    "Job Role",
    "Intern Score",
    "Job Score",
    "Matched Keywords",
    "Missing Keywords",
    "Percentile",
  ].join(",");

  const rows = analyses.map(({ resume, analysis }) => {
    const matched = JSON.parse(analysis.matchedKeywordsJob || "[]").length;
    const missing = JSON.parse(analysis.missingKeywordsJob || "[]").length;
    return [
      `"${resume.fileName}"`,
      new Date(resume.createdAt).toISOString(),
      `"${analysis.jobRole}"`,
      analysis.internScore,
      analysis.jobScore,
      matched,
      missing,
      analysis.benchmarkPercentile || "N/A",
    ].join(",");
  });

  return {
    filename: `bulk-export-${Date.now()}.csv`,
    mimeType: "text/csv",
    buffer: [headers, ...rows].join("\n"),
  };
}

// Private helper functions

async function exportToPDF(
  resume: Resume,
  analysis?: Analysis,
  includeAnalysis: boolean = false,
  includeRecommendations: boolean = false
): Promise<ExportResult> {
  // This would use a library like puppeteer or pdfkit
  // For now, returning a placeholder
  const content = formatAsHTML(resume, analysis, includeAnalysis, includeRecommendations);
  
  // In production, use puppeteer to generate PDF
  // const pdf = await generatePDFFromHTML(content);
  
  return {
    filename: `${resume.fileName.replace(".pdf", "-optimized.pdf")}`,
    mimeType: "application/pdf",
    buffer: Buffer.from(content),
  };
}

async function exportToDOCX(
  resume: Resume,
  analysis?: Analysis,
  includeAnalysis: boolean = false,
  includeRecommendations: boolean = false
): Promise<ExportResult> {
  // This would use docx library
  // For now, returning a placeholder
  const content = formatAsHTML(resume, analysis, includeAnalysis, includeRecommendations);
  
  return {
    filename: `${resume.fileName.replace(".pdf", "-optimized.docx")}`,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: Buffer.from(content),
  };
}

async function exportToMarkdown(
  resume: Resume,
  analysis?: Analysis,
  includeAnalysis: boolean = false,
  includeRecommendations: boolean = false
): Promise<ExportResult> {
  let content = `# ${resume.fileName}\n\n`;
  content += resume.rawText + "\n\n";

  if (includeAnalysis && analysis) {
    content += "## ATS Analysis\n\n";
    content += `- **Job Role**: ${analysis.jobRole}\n`;
    content += `- **Score**: ${analysis.jobScore}/100\n`;
    content += `- **Matched Keywords**: ${JSON.parse(analysis.matchedKeywordsJob || "[]").join(", ")}\n`;
    content += `- **Missing Keywords**: ${JSON.parse(analysis.missingKeywordsJob || "[]").join(", ")}\n`;

    if (includeRecommendations) {
      const recommendations = parseJSONSafely(analysis.recommendations);
      if (recommendations && Array.isArray(recommendations)) {
        content += "\n## Recommendations\n\n";
        recommendations.forEach((rec: string) => {
          content += `- ${rec}\n`;
        });
      }
    }
  }

  return {
    filename: `${resume.fileName.replace(".pdf", ".md")}`,
    mimeType: "text/markdown",
    buffer: content,
  };
}

async function exportToJSON(
  resume: Resume,
  analysis?: Analysis,
  includeAnalysis: boolean = false
): Promise<ExportResult> {
  const data: any = {
    resume: {
      fileName: resume.fileName,
      rawText: resume.rawText,
      uploadedAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    },
  };

  if (includeAnalysis && analysis) {
    data.analysis = {
      jobRole: analysis.jobRole,
      scores: {
        internScore: analysis.internScore,
        jobScore: analysis.jobScore,
      },
      matchedKeywords: JSON.parse(analysis.matchedKeywordsJob || "[]"),
      missingKeywords: JSON.parse(analysis.missingKeywordsJob || "[]"),
      recommendations: parseJSONSafely(analysis.recommendations),
    };
  }

  return {
    filename: `${resume.fileName.replace(".pdf", ".json")}`,
    mimeType: "application/json",
    buffer: JSON.stringify(data, null, 2),
  };
}

async function exportToCSV(
  resume: Resume,
  analysis?: Analysis
): Promise<ExportResult> {
  const headers = ["Field", "Value"];
  const rows = [
    ["File Name", resume.fileName],
    ["Upload Date", resume.createdAt.toISOString()],
    analysis ? ["Job Role", analysis.jobRole] : null,
    analysis ? ["Job Score", analysis.jobScore.toString()] : null,
    analysis ? ["Intern Score", analysis.internScore.toString()] : null,
    analysis
      ? ["Matched Keywords Count", JSON.parse(analysis.matchedKeywordsJob || "[]").length.toString()]
      : null,
    analysis
      ? ["Missing Keywords Count", JSON.parse(analysis.missingKeywordsJob || "[]").length.toString()]
      : null,
  ].filter(Boolean) as Array<[string, string]>;

  const csvContent = [
    headers.join(","),
    ...rows.map(([field, value]) => `"${field}","${value}"`),
  ].join("\n");

  return {
    filename: `${resume.fileName.replace(".pdf", ".csv")}`,
    mimeType: "text/csv",
    buffer: csvContent,
  };
}

function formatAsHTML(
  resume: Resume,
  analysis?: Analysis,
  includeAnalysis: boolean = false,
  includeRecommendations: boolean = false
): string {
  let html = `<html><body><h1>${resume.fileName}</h1>`;
  html += `<pre>${escapeHtml(resume.rawText)}</pre>`;

  if (includeAnalysis && analysis) {
    html += `<h2>ATS Analysis</h2>`;
    html += `<p><strong>Job Role:</strong> ${analysis.jobRole}</p>`;
    html += `<p><strong>Score:</strong> ${analysis.jobScore}/100</p>`;
    html += `<p><strong>Matched Keywords:</strong> ${JSON.parse(analysis.matchedKeywordsJob || "[]").join(", ")}</p>`;
    html += `<p><strong>Missing Keywords:</strong> ${JSON.parse(analysis.missingKeywordsJob || "[]").join(", ")}</p>`;

    if (includeRecommendations) {
      const recommendations = parseJSONSafely(analysis.recommendations);
      if (recommendations && Array.isArray(recommendations)) {
        html += `<h3>Recommendations</h3><ul>`;
        recommendations.forEach((rec: string) => {
          html += `<li>${escapeHtml(rec)}</li>`;
        });
        html += `</ul>`;
      }
    }
  }

  html += `</body></html>`;
  return html;
}

async function generatePDFReport(report: any): Promise<ExportResult> {
  let markdown = `# ATS Analysis Report\n\n`;
  markdown += `**Generated:** ${report.generatedAt}\n\n`;
  markdown += `## Resume Information\n`;
  markdown += `- **File:** ${report.resumeInfo.fileName}\n`;
  markdown += `- **Uploaded:** ${report.resumeInfo.uploadedAt}\n\n`;
  markdown += `## Analysis Results\n`;
  markdown += `- **Job Role:** ${report.jobRole}\n`;
  markdown += `- **Job Score:** ${report.scores.jobScore}/100\n`;
  markdown += `- **Intern Score:** ${report.scores.internScore}/100\n`;
  markdown += `- **Percentile:** ${report.scores.percentile}\n\n`;
  markdown += `## Keywords\n`;
  markdown += `**Matched (${report.analysis.matchedKeywords.length}):**\n`;
  report.analysis.matchedKeywords.forEach((kw: string) => {
    markdown += `- ${kw}\n`;
  });
  markdown += `\n**Missing (${report.analysis.missingKeywords.length}):**\n`;
  report.analysis.missingKeywords.forEach((kw: string) => {
    markdown += `- ${kw}\n`;
  });

  markdown += `\n## Recommendations\n`;
  if (Array.isArray(report.analysis.recommendations)) {
    report.analysis.recommendations.forEach((rec: string) => {
      markdown += `- ${rec}\n`;
    });
  }

  return {
    filename: `analysis-report-${Date.now()}.pdf`,
    mimeType: "application/pdf",
    buffer: markdown,
  };
}

async function generateMarkdownReport(report: any): Promise<ExportResult> {
  let markdown = `# ATS Analysis Report\n\n`;
  markdown += `**Generated:** ${report.generatedAt}\n\n`;
  markdown += `## Resume Information\n`;
  markdown += `- **File:** ${report.resumeInfo.fileName}\n`;
  markdown += `- **Uploaded:** ${report.resumeInfo.uploadedAt}\n\n`;
  markdown += `## Analysis Results\n`;
  markdown += `- **Job Role:** ${report.jobRole}\n`;
  markdown += `- **Job Score:** ${report.scores.jobScore}/100\n`;
  markdown += `- **Intern Score:** ${report.scores.internScore}/100\n`;
  markdown += `- **Percentile:** ${report.scores.percentile}\n\n`;
  markdown += `## Keywords\n`;
  markdown += `### Matched (${report.analysis.matchedKeywords.length})\n`;
  report.analysis.matchedKeywords.forEach((kw: string) => {
    markdown += `- ${kw}\n`;
  });
  markdown += `### Missing (${report.analysis.missingKeywords.length})\n`;
  report.analysis.missingKeywords.forEach((kw: string) => {
    markdown += `- ${kw}\n`;
  });

  markdown += `\n## Recommendations\n`;
  if (Array.isArray(report.analysis.recommendations)) {
    report.analysis.recommendations.forEach((rec: string) => {
      markdown += `- ${rec}\n`;
    });
  }

  return {
    filename: `analysis-report-${Date.now()}.md`,
    mimeType: "text/markdown",
    buffer: markdown,
  };
}

function parseJSONSafely(jsonString: string | null): any {
  try {
    return jsonString ? JSON.parse(jsonString) : null;
  } catch {
    return null;
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
