import { Request, Response } from "express";
import type { Express } from "express";
import { extractTextFromPDFBuffer } from "./pdf-extractor";
import { analyzeResume } from "./ats-engine";

/**
 * Handle PDF file upload
 * Expects multipart/form-data with 'file' field
 */
export async function handleFileUpload(req: any, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const file = req.file;

    // Validate file type
    if (file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({ error: "File size exceeds 10MB limit" });
    }

    // Store local metadata key. In dev and self-hosted mode we do not require external storage.
    const fileKey = `resumes/${Date.now()}-${file.originalname}`;
    const fileUrl = `local://${fileKey}`;

    // Extract text directly from uploaded PDF bytes.
    const rawText = await extractTextFromPDFBuffer(file.buffer);

    res.json({
      fileKey,
      fileUrl,
      rawText,
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "File upload failed",
    });
  }
}

/**
 * Handle resume analysis
 * Expects JSON body with 'resumeText' field
 */
export async function handleAnalysis(req: Request, res: Response) {
  try {
    const { resumeText, roleKey } = req.body;

    if (!resumeText || typeof resumeText !== "string") {
      return res.status(400).json({ error: "Resume text is required" });
    }

    // Analyze resume
    const analysis = analyzeResume(resumeText, roleKey);

    res.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Analysis failed",
    });
  }
}
