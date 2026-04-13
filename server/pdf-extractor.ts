import { invokeLLM } from "./_core/llm";
import { PDFParse } from "pdf-parse";

/**
 * Extract text from an in-memory PDF buffer.
 * This is the primary path for local development and works without storage proxy.
 */
export async function extractTextFromPDFBuffer(pdfBuffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: pdfBuffer });
    const parsed = await parser.getText();
    await parser.destroy();
    const text = parsed.text?.trim();
    if (!text) {
      throw new Error("No readable text found in PDF");
    }
    return text;
  } catch (error) {
    console.error("PDF buffer extraction error:", error);
    throw new Error(
      `Failed to extract text from PDF buffer: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Extract text from PDF file using LLM
 * Accepts a URL to a PDF file and returns extracted text
 */
export async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a PDF text extraction assistant. Extract all text from the provided PDF file and return it exactly as it appears, preserving the structure and formatting.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract all text from this PDF resume:",
            },
            {
              type: "file_url" as const,
              file_url: {
                url: pdfUrl,
                mime_type: "application/pdf" as const,
              },
            },
          ],
        },
      ],
    });

    // Extract the text from the response
    const content = response.choices[0]?.message?.content;
    if (typeof content === "string") {
      return content;
    }

    throw new Error("Failed to extract text from PDF");
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
