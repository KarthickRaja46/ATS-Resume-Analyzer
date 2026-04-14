/**
 * Benchmarking Service
 * Compare user scores against industry averages and calculate percentiles
 */

import { JOB_ROLES } from "@shared/const";

interface BenchmarkData {
  roleKey: string;
  industry: string;
  averageScore: number;
  medianScore: number;
  percentile25: number;
  percentile75: number;
  percentile90: number;
  samplesCount: number;
}

interface UserBenchmarkResult {
  roleKey: string;
  userScore: number;
  benchmarkData: BenchmarkData;
  percentile: number;
  ranking: string;
  comparison: {
    vsAverage: number;
    vsMedian: number;
    interpretation: string;
  };
}

// Default benchmark data (would be replaced with database values)
const DEFAULT_BENCHMARKS: Record<string, BenchmarkData> = {
  "data-analyst-intern": {
    roleKey: "data-analyst-intern",
    industry: "tech",
    averageScore: 62,
    medianScore: 60,
    percentile25: 45,
    percentile75: 75,
    percentile90: 85,
    samplesCount: 1200,
  },
  "data-analyst-entry": {
    roleKey: "data-analyst-entry",
    industry: "tech",
    averageScore: 70,
    medianScore: 72,
    percentile25: 58,
    percentile75: 82,
    percentile90: 90,
    samplesCount: 850,
  },
  "software-engineer": {
    roleKey: "software-engineer",
    industry: "tech",
    averageScore: 68,
    medianScore: 70,
    percentile25: 52,
    percentile75: 80,
    percentile90: 88,
    samplesCount: 2100,
  },
  "frontend-engineer": {
    roleKey: "frontend-engineer",
    industry: "tech",
    averageScore: 65,
    medianScore: 67,
    percentile25: 50,
    percentile75: 78,
    percentile90: 86,
    samplesCount: 950,
  },
  "backend-engineer": {
    roleKey: "backend-engineer",
    industry: "tech",
    averageScore: 71,
    medianScore: 73,
    percentile25: 58,
    percentile75: 83,
    percentile90: 91,
    samplesCount: 1100,
  },
  "product-manager": {
    roleKey: "product-manager",
    industry: "tech",
    averageScore: 64,
    medianScore: 65,
    percentile25: 48,
    percentile75: 76,
    percentile90: 84,
    samplesCount: 520,
  },
  "ux-designer": {
    roleKey: "ux-designer",
    industry: "tech",
    averageScore: 61,
    medianScore: 62,
    percentile25: 45,
    percentile75: 74,
    percentile90: 82,
    samplesCount: 380,
  },
  "data-scientist": {
    roleKey: "data-scientist",
    industry: "tech",
    averageScore: 72,
    medianScore: 74,
    percentile25: 60,
    percentile75: 85,
    percentile90: 92,
    samplesCount: 680,
  },
};

/**
 * Calculate user's percentile for a given role
 */
export function calculateUserPercentile(
  userScore: number,
  roleKey: string,
  benchmarkData?: BenchmarkData
): UserBenchmarkResult {
  const benchmark = benchmarkData || DEFAULT_BENCHMARKS[roleKey];

  if (!benchmark) {
    return createDefaultBenchmarkResult(userScore, roleKey);
  }

  // Estimate percentile based on score distribution
  // This assumes a normal distribution with median and percentile quartiles
  let percentile = estimatePercentile(userScore, benchmark);

  // Ensure percentile is between 0 and 100
  percentile = Math.max(0, Math.min(100, percentile));

  const ranking = calculateRanking(percentile);
  const comparison = calculateComparison(userScore, benchmark);

  return {
    roleKey,
    userScore,
    benchmarkData: benchmark,
    percentile: Math.round(percentile * 10) / 10,
    ranking,
    comparison,
  };
}

/**
 * Calculate score range for a given percentile
 */
export function getScoreRangeForPercentile(
  percentile: number,
  roleKey: string,
  benchmarkData?: BenchmarkData
): { minScore: number; maxScore: number } {
  const benchmark = benchmarkData || DEFAULT_BENCHMARKS[roleKey];

  if (!benchmark) {
    return { minScore: 0, maxScore: 100 };
  }

  // Linear interpolation for score ranges
  if (percentile <= 25) {
    return {
      minScore: 0,
      maxScore: benchmark.percentile25,
    };
  } else if (percentile <= 50) {
    return {
      minScore: benchmark.percentile25,
      maxScore: benchmark.medianScore,
    };
  } else if (percentile <= 75) {
    return {
      minScore: benchmark.medianScore,
      maxScore: benchmark.percentile75,
    };
  } else {
    return {
      minScore: benchmark.percentile75,
      maxScore: 100,
    };
  }
}

/**
 * Compare multiple roles and identify strengths
 */
export function compareMultipleRoles(
  scores: Record<string, number>
): Array<{ role: string; score: number; percentile: number; ranking: string }> {
  const results = Object.entries(scores).map(([roleKey, score]) => {
    const benchmark = calculateUserPercentile(score, roleKey);
    return {
      role: JOB_ROLES[roleKey as keyof typeof JOB_ROLES]?.label || roleKey,
      score,
      percentile: benchmark.percentile,
      ranking: benchmark.ranking,
    };
  });

  return results.sort((a, b) => b.percentile - a.percentile);
}

/**
 * Generate benchmark report
 */
export function generateBenchmarkReport(
  userScore: number,
  roleKey: string,
  benchmarkData?: BenchmarkData
): string {
  const result = calculateUserPercentile(userScore, roleKey, benchmarkData);
  const benchmark = result.benchmarkData;

  return `
Benchmark Report for ${result.roleKey}
=====================================

Your Score: ${result.userScore}/100
Percentile: ${result.percentile}th
Ranking: ${result.ranking}

Industry Statistics:
- Average Score: ${benchmark.averageScore}/100
- Median Score: ${benchmark.medianScore}/100
- 25th Percentile: ${benchmark.percentile25}/100
- 75th Percentile: ${benchmark.percentile75}/100
- 90th Percentile: ${benchmark.percentile90}/100
- Samples: ${benchmark.samplesCount} resumes analyzed

Your Performance:
- vs Average: ${result.comparison.vsAverage > 0 ? "+" : ""}${result.comparison.vsAverage} points (${Math.abs((result.comparison.vsAverage / benchmark.averageScore) * 100).toFixed(1)}%)
- vs Median: ${result.comparison.vsMedian > 0 ? "+" : ""}${result.comparison.vsMedian} points
- Interpretation: ${result.comparison.interpretation}

Recommendations:
${generateBenchmarkRecommendations(result)}
`;
}

/**
 * Track score progression over time
 */
export function calculateScoreProgression(
  historyScores: Array<{ date: Date; score: number }>
): {
  trend: "improving" | "declining" | "stable";
  averageImprovement: number;
  suggestionStr: string;
} {
  if (historyScores.length < 2) {
    return {
      trend: "stable",
      averageImprovement: 0,
      suggestionStr: "Not enough data for trend analysis",
    };
  }

  const sorted = historyScores.sort((a, b) => a.date.getTime() - b.date.getTime());
  const scores = sorted.map((h) => h.score);

  // Calculate improvement
  const firstScore = scores[0];
  const lastScore = scores[scores.length - 1];
  const totalImprovement = lastScore - firstScore;
  const averageImprovement = totalImprovement / (scores.length - 1);

  let trend: "improving" | "declining" | "stable";
  if (averageImprovement > 1) {
    trend = "improving";
  } else if (averageImprovement < -1) {
    trend = "declining";
  } else {
    trend = "stable";
  }

  const suggestionStr =
    trend === "improving"
      ? "Great! Your scores are improving. Keep up the momentum!"
      : trend === "declining"
        ? "Your scores appear to be declining. Consider reviewing feedback and making adjustments."
        : "Your scores are stable. Consider targeting specific weaknesses for improvement.";

  return {
    trend,
    averageImprovement: Math.round(averageImprovement * 100) / 100,
    suggestionStr,
  };
}

/**
 * Industry comparison analysis
 */
export function compareIndustries(
  userScore: number,
  roles: string[]
): Record<string, any> {
  const results: Record<string, any> = {};

  for (const role of roles) {
    const result = calculateUserPercentile(userScore, role);
    results[role] = {
      percentile: result.percentile,
      ranking: result.ranking,
      vsAverage: result.comparison.vsAverage,
    };
  }

  return results;
}

// Helper functions

function estimatePercentile(score: number, benchmark: BenchmarkData): number {
  // Linear interpolation using known quartiles
  if (score <= benchmark.percentile25) {
    return (score / benchmark.percentile25) * 25;
  } else if (score <= benchmark.medianScore) {
    return 25 + ((score - benchmark.percentile25) / (benchmark.medianScore - benchmark.percentile25)) * 25;
  } else if (score <= benchmark.percentile75) {
    return 50 + ((score - benchmark.medianScore) / (benchmark.percentile75 - benchmark.medianScore)) * 25;
  } else if (score <= benchmark.percentile90) {
    return 75 + ((score - benchmark.percentile75) / (benchmark.percentile90 - benchmark.percentile75)) * 15;
  } else {
    return 90 + ((score - benchmark.percentile90) / (100 - benchmark.percentile90)) * 10;
  }
}

function calculateRanking(
  percentile: number
): "Outstanding" | "Excellent" | "Good" | "Fair" | "Needs Improvement" {
  if (percentile >= 90) return "Outstanding";
  if (percentile >= 75) return "Excellent";
  if (percentile >= 50) return "Good";
  if (percentile >= 25) return "Fair";
  return "Needs Improvement";
}

function calculateComparison(
  score: number,
  benchmark: BenchmarkData
): { vsAverage: number; vsMedian: number; interpretation: string } {
  const vsAverage = score - benchmark.averageScore;
  const vsMedian = score - benchmark.medianScore;

  let interpretation = "";
  if (vsAverage > 10) {
    interpretation = "You're performing well above the industry average.";
  } else if (vsAverage > 0) {
    interpretation = "You're performing above the industry average.";
  } else if (vsAverage > -10) {
    interpretation = "You're performing slightly below the industry average.";
  } else {
    interpretation = "You're performing significantly below the industry average.";
  }

  return {
    vsAverage,
    vsMedian,
    interpretation,
  };
}

function generateBenchmarkRecommendations(result: UserBenchmarkResult): string {
  const { percentile, ranking, userScore, benchmarkData } = result;

  const recommendations: string[] = [];

  if (percentile >= 90) {
    recommendations.push("• Outstanding performance! Share your insights with others.");
    recommendations.push("• Consider mentoring peers on resume optimization.");
  } else if (percentile >= 75) {
    recommendations.push("• Excellent score! You're well-positioned for this role.");
    recommendations.push("• Focus on the missing keywords to push toward 90th percentile.");
  } else if (percentile >= 50) {
    recommendations.push(`• Good score. Aim to reach ${benchmarkData.percentile75}/100 for better positioning.`);
    recommendations.push("• Review top-performing resumes for inspiration.");
  } else {
    recommendations.push(`• Room for improvement. Target ${benchmarkData.medianScore}/100 as your next goal.`);
    recommendations.push("• Focus on adding high-priority keywords for this role.");
  }

  return recommendations.join("\n");
}

function createDefaultBenchmarkResult(
  userScore: number,
  roleKey: string
): UserBenchmarkResult {
  const benchmark: BenchmarkData = {
    roleKey,
    industry: "tech",
    averageScore: 65,
    medianScore: 65,
    percentile25: 50,
    percentile75: 80,
    percentile90: 90,
    samplesCount: 0,
  };

  const percentile = (userScore / 100) * 100; // Simple estimation
  const ranking = calculateRanking(percentile);
  const comparison = calculateComparison(userScore, benchmark);

  return {
    roleKey,
    userScore,
    benchmarkData: benchmark,
    percentile: Math.round(percentile * 10) / 10,
    ranking,
    comparison,
  };
}
