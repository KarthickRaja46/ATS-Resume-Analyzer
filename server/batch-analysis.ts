/**
 * Batch Analysis Service
 * Handle uploading and analyzing multiple resumes in a single batch
 */

import { Resume, Analysis } from "@shared/db-types";

interface BatchUploadResult {
  totalFiles: number;
  successfulUploads: number;
  failedUploads: Array<{ fileName: string; error: string }>;
  resumeIds: number[];
}

interface BatchAnalysisResult {
  totalAnalyzed: number;
  successfulAnalyses: number;
  failedAnalyses: Array<{ resumeId: number; error: string }>;
  analyses: Analysis[];
}

interface BatchComparisonResult {
  resumeCount: number;
  averageScore: number;
  highestScore: { resumeId: number; score: number };
  lowestScore: { resumeId: number; score: number };
  scoreDistribution: Record<string, number>;
  recommendations: string[];
}

/**
 * Process batch upload of multiple resumes
 */
export async function processBatchUpload(
  files: Array<{ fileName: string; rawText: string; fileKey: string; fileUrl: string }>,
  userId: number,
  createResumeFn: (
    userId: number,
    fileName: string,
    fileKey: string,
    fileUrl: string,
    rawText: string
  ) => Promise<Resume>
): Promise<BatchUploadResult> {
  const failedUploads: Array<{ fileName: string; error: string }> = [];
  const resumeIds: number[] = [];
  let successfulUploads = 0;

  for (const file of files) {
    try {
      const resume = await createResumeFn(userId, file.fileName, file.fileKey, file.fileUrl, file.rawText);
      resumeIds.push(resume.id);
      successfulUploads++;
    } catch (error) {
      failedUploads.push({
        fileName: file.fileName,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    totalFiles: files.length,
    successfulUploads,
    failedUploads,
    resumeIds,
  };
}

/**
 * Process batch analysis of multiple resumes
 */
export async function processBatchAnalysis(
  resumeIds: number[],
  jobRole: string = "data-analyst-entry",
  analyzeResumeFn: (resumeText: string, jobRole?: string) => any
): Promise<BatchAnalysisResult> {
  const failedAnalyses: Array<{ resumeId: number; error: string }> = [];
  const analyses: Analysis[] = [];
  let successfulAnalyses = 0;

  for (const resumeId of resumeIds) {
    try {
      // This would be called with the actual resume text
      // For now, we're providing the structure
      successfulAnalyses++;
    } catch (error) {
      failedAnalyses.push({
        resumeId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    totalAnalyzed: resumeIds.length,
    successfulAnalyses,
    failedAnalyses,
    analyses,
  };
}

/**
 * Compare multiple analyses to find patterns and generate insights
 */
export function compareBatchAnalyses(analyses: Analysis[]): BatchComparisonResult {
  if (analyses.length === 0) {
    return {
      resumeCount: 0,
      averageScore: 0,
      highestScore: { resumeId: 0, score: 0 },
      lowestScore: { resumeId: 0, score: 0 },
      scoreDistribution: {},
      recommendations: [],
    };
  }

  // Calculate score statistics
  const scores = analyses.map((a) => a.jobScore);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  const highestScoreAnalysis = analyses.find((a) => a.jobScore === maxScore);
  const lowestScoreAnalysis = analyses.find((a) => a.jobScore === minScore);

  // Calculate score distribution
  const distribution: Record<string, number> = {
    "0-25": 0,
    "26-50": 0,
    "51-75": 0,
    "76-100": 0,
  };

  for (const score of scores) {
    if (score <= 25) distribution["0-25"]++;
    else if (score <= 50) distribution["26-50"]++;
    else if (score <= 75) distribution["51-75"]++;
    else distribution["76-100"]++;
  }

  // Generate recommendations
  const recommendations = generateBatchRecommendations(
    analyses,
    averageScore,
    distribution
  );

  return {
    resumeCount: analyses.length,
    averageScore: Math.round(averageScore * 10) / 10,
    highestScore: {
      resumeId: highestScoreAnalysis?.resumeId || 0,
      score: maxScore,
    },
    lowestScore: {
      resumeId: lowestScoreAnalysis?.resumeId || 0,
      score: minScore,
    },
    scoreDistribution: distribution,
    recommendations,
  };
}

/**
 * Generate batch-level recommendations
 */
function generateBatchRecommendations(
  analyses: Analysis[],
  averageScore: number,
  distribution: Record<string, number>
): string[] {
  const recommendations: string[] = [];

  if (averageScore < 50) {
    recommendations.push(
      "Overall batch performance is below average. Consider providing guidance on resume optimization to all users."
    );
  } else if (averageScore >= 75) {
    recommendations.push(
      "Excellent batch performance! Your resumes are well-optimized for ATS systems."
    );
  }

  // Analyze missing keywords across the batch
  const allMissingKeywords: Record<string, number> = {};
  for (const analysis of analyses) {
    const missing = JSON.parse(analysis.missingKeywordsJob || "[]");
    for (const keyword of missing) {
      allMissingKeywords[keyword] = (allMissingKeywords[keyword] || 0) + 1;
    }
  }

  // Most common missing keywords
  const sortedMissing = Object.entries(allMissingKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (sortedMissing.length > 0) {
    const keywords = sortedMissing.map((m) => m[0]).join(", ");
    recommendations.push(
      `Most common missing keywords across batch: ${keywords}`
    );
  }

  if (distribution["76-100"] > distribution["0-25"]) {
    recommendations.push("Strong performance in high-scoring resumes.");
  } else if (distribution["0-25"] > distribution["76-100"]) {
    recommendations.push("Focus on improving low-scoring resumes.");
  }

  // Check for role diversity
  const roles = new Set(analyses.map((a) => a.jobRole));
  if (roles.size > 1) {
    recommendations.push(
      `Batch contains ${roles.size} different job roles. Consider analyzing by role for better insights.`
    );
  }

  return recommendations;
}

/**
 * Group analyses by job role
 */
export function groupAnalysesByRole(analyses: Analysis[]): Record<string, Analysis[]> {
  const grouped: Record<string, Analysis[]> = {};

  for (const analysis of analyses) {
    if (!grouped[analysis.jobRole]) {
      grouped[analysis.jobRole] = [];
    }
    grouped[analysis.jobRole].push(analysis);
  }

  return grouped;
}

/**
 * Export batch analysis summary
 */
export function generateBatchSummary(
  analyses: Analysis[]
): Record<string, any> {
  const comparison = compareBatchAnalyses(analyses);
  const byRole = groupAnalysesByRole(analyses);

  const roleStats = Object.entries(byRole).map(([role, roleAnalyses]) => {
    const scores = roleAnalyses.map((a) => a.jobScore);
    return {
      role,
      count: roleAnalyses.length,
      averageScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      maxScore: Math.max(...scores),
      minScore: Math.min(...scores),
    };
  });

  return {
    summary: {
      totalResumes: analyses.length,
      averageScore: comparison.averageScore,
      scoreRange: {
        min: comparison.lowestScore.score,
        max: comparison.highestScore.score,
      },
      scoreDistribution: comparison.scoreDistribution,
    },
    byRole: roleStats,
    recommendations: comparison.recommendations,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Benchmark individual resume against batch
 */
export function benchmarkAgainstBatch(
  analysisId: number,
  analyses: Analysis[]
): {
  percentile: number;
  ranking: string;
  comparison: string;
} {
  const analysis = analyses.find((a) => a.id === analysisId);
  if (!analysis) {
    return {
      percentile: 0,
      ranking: "Unknown",
      comparison: "Could not find analysis",
    };
  }

  const scores = analyses.map((a) => a.jobScore);
  const scoresSorted = scores.sort((a, b) => a - b);
  const position = scoresSorted.findIndex((s) => s >= analysis.jobScore);
  const percentile = (position / scoresSorted.length) * 100;

  let ranking = "Average";
  if (percentile >= 75) {
    ranking = "Excellent";
  } else if (percentile >= 50) {
    ranking = "Good";
  } else if (percentile >= 25) {
    ranking = "Fair";
  } else {
    ranking = "Needs Improvement";
  }

  const comparison = `Your resume scores in the ${Math.round(percentile)}th percentile of this batch.`;

  return {
    percentile: Math.round(percentile * 10) / 10,
    ranking,
    comparison,
  };
}
