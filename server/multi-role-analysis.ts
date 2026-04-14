/**
 * Multi-Role Analysis Engine
 * Supports analyzing resumes against different job roles with custom job descriptions
 */

import { JOB_ROLES } from "@shared/const";

interface RoleAnalysisResult {
  roleKey: string;
  roleName: string;
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
}

// Role-specific keyword profiles
const roleKeywordProfiles: Record<string, { keywords: string[]; weights: Record<string, number> }> = {
  "data-analyst-intern": {
    keywords: [
      "Excel", "SQL", "Python", "R", "Tableau", "Power BI", "Data visualization",
      "Statistical analysis", "Data cleaning", "Dashboard", "Report writing",
      "Google Analytics", "A/B testing", "MySQL", "PostgreSQL", "Pandas", "NumPy"
    ],
    weights: {
      "SQL": 1.2,
      "Excel": 1.1,
      "Python": 1.1,
      "Data visualization": 1.0,
      "Statistical analysis": 1.0,
    }
  },
  "data-analyst-entry": {
    keywords: [
      "SQL", "Python", "R", "Tableau", "Power BI", "Advanced Excel",
      "Database management", "Data modeling", "ETL", "Visualization",
      "Business intelligence", "Statistical testing", "Data warehousing",
      "AWS", "GCP", "Azure", "Postgres", "MongoDB"
    ],
    weights: {
      "SQL": 1.3,
      "Python": 1.2,
      "Data visualization": 1.1,
      "ETL": 1.1,
      "Database management": 1.0,
    }
  },
  "software-engineer": {
    keywords: [
      "Java", "Python", "C++", "JavaScript", "TypeScript", "Go", "Rust",
      "Git", "Docker", "Kubernetes", "REST API", "Microservices",
      "Design patterns", "SOLID principles", "OOP", "Agile",
      "AWS", "Azure", "GCP", "CI/CD", "Testing", "Unit tests"
    ],
    weights: {
      "Git": 1.2,
      "Docker": 1.1,
      "REST API": 1.1,
      "Testing": 1.0,
      "Design patterns": 0.9,
    }
  },
  "frontend-engineer": {
    keywords: [
      "React", "Vue", "Angular", "JavaScript", "TypeScript", "HTML", "CSS",
      "Responsive design", "Redux", "GraphQL", "REST API", "Webpack",
      "Testing library", "Jest", "Git", "Figma", "Accessibility",
      "Performance optimization", "Next.js", "Tailwind CSS"
    ],
    weights: {
      "React": 1.3,
      "TypeScript": 1.2,
      "CSS": 1.1,
      "Testing": 1.0,
      "Performance optimization": 0.9,
    }
  },
  "backend-engineer": {
    keywords: [
      "Node.js", "Python", "Java", "Go", "Rust", "Express", "Django",
      "REST API", "GraphQL", "Database design", "SQL", "NoSQL",
      "Docker", "Kubernetes", "Microservices", "Message queues",
      "Authentication", "Security", "Caching", "Load balancing"
    ],
    weights: {
      "REST API": 1.2,
      "Database design": 1.2,
      "Docker": 1.1,
      "Microservices": 1.0,
      "Authentication": 1.0,
    }
  },
  "product-manager": {
    keywords: [
      "Product strategy", "User research", "Requirements gathering", "Analytics",
      "Roadmap planning", "Stakeholder management", "Agile", "Scrum",
      "Data analysis", "Competitive analysis", "User testing", "Wireframing",
      "A/B testing", "Metrics", "OKRs", "Sprint planning"
    ],
    weights: {
      "Product strategy": 1.2,
      "Analytics": 1.1,
      "Stakeholder management": 1.1,
      "User research": 1.0,
      "Agile": 0.9,
    }
  },
};

export function analyzeMultiRole(
  resumeText: string,
  customKeywords?: string[],
  jobDescription?: string
): RoleAnalysisResult[] {
  const results: RoleAnalysisResult[] = [];
  const normalizedResume = resumeText.toLowerCase();

  for (const [roleKey, roleConfig] of Object.entries(JOB_ROLES)) {
    const profile = roleKeywordProfiles[roleKey];
    if (!profile) continue;

    // Combine role keywords with custom keywords and job description keywords
    const keywordsToMatch = [
      ...profile.keywords,
      ...(customKeywords || []),
      ...(jobDescription ? extractJobDescriptionKeywords(jobDescription) : [])
    ];

    const matched = keywordsToMatch.filter(kw =>
      normalizedResume.includes(kw.toLowerCase())
    );

    const missing = keywordsToMatch.filter(kw =>
      !normalizedResume.includes(kw.toLowerCase())
    );

    // Calculate weighted score
    const score = calculateWeightedScore(
      matched,
      missing,
      profile.weights,
      keywordsToMatch.length
    );

    results.push({
      roleKey,
      roleName: roleConfig.label,
      score: Math.round(score),
      matchedKeywords: matched,
      missingKeywords: missing,
      recommendations: generateRoleRecommendations(roleKey, matched, missing),
    });
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

export function analyzeCustomRole(
  resumeText: string,
  jobDescription: string,
  customKeywords?: string[]
): RoleAnalysisResult {
  const normalizedResume = resumeText.toLowerCase();
  const extractedKeywords = extractJobDescriptionKeywords(jobDescription);
  const allKeywords = [
    ...extractedKeywords,
    ...(customKeywords || [])
  ];

  const matched = allKeywords.filter(kw =>
    normalizedResume.includes(kw.toLowerCase())
  );

  const missing = allKeywords.filter(kw =>
    !normalizedResume.includes(kw.toLowerCase())
  );

  const score = calculateSimpleScore(matched.length, allKeywords.length);

  return {
    roleKey: "custom",
    roleName: "Custom Role",
    score: Math.round(score),
    matchedKeywords: matched,
    missingKeywords: missing,
    recommendations: generateCustomRecommendations(matched, missing),
  };
}

function extractJobDescriptionKeywords(jobDescription: string): string[] {
  // Extract potential keywords from job description
  // This is a basic implementation - could be enhanced with NLP
  const words = jobDescription.split(/\s+/);
  const technicalKeywords: string[] = [];

  // Look for common technical terms, tools, frameworks, languages
  const commonTechTerms = [
    "javascript", "python", "java", "golang", "rust", "typescript",
    "react", "angular", "vue", "nodejs", "express", "django", "flask",
    "sql", "nosql", "mongodb", "postgres", "mysql", "redis",
    "docker", "kubernetes", "aws", "gcp", "azure",
    "git", "ci/cd", "agile", "scrum", "rest", "api", "graphql",
    "machine learning", "ai", "nlp", "deep learning",
    "cloud", "microservices", "serverless", "devops"
  ];

  for (const word of words) {
    const lowerWord = word.toLowerCase().replace(/[^\w-]/g, '');
    if (commonTechTerms.includes(lowerWord) && !technicalKeywords.includes(word)) {
      technicalKeywords.push(word);
    }
  }

  // Extract 2-3 word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = words.slice(i, i + 3).join(" ").toLowerCase();
    if (commonTechTerms.some(term => phrase.includes(term))) {
      technicalKeywords.push(phrase);
    }
  }

  return Array.from(new Set(technicalKeywords)).slice(0, 30); // Limit to 30
}

function calculateWeightedScore(
  matched: string[],
  missing: string[],
  weights: Record<string, number>,
  total: number
): number {
  if (total === 0) return 0;

  let weightedMatches = 0;
  let weightedTotal = 0;

  for (const keyword of matched) {
    const weight = weights[keyword] || 1;
    weightedMatches += weight;
  }

  for (const keyword of [...matched, ...missing]) {
    const weight = weights[keyword] || 1;
    weightedTotal += weight;
  }

  const score = (weightedMatches / weightedTotal) * 100;
  return Math.min(score, 100);
}

function calculateSimpleScore(matched: number, total: number): number {
  if (total === 0) return 0;
  return (matched / total) * 100;
}

function generateRoleRecommendations(
  roleKey: string,
  matched: string[],
  missing: string[]
): string[] {
  const recommendations: string[] = [];

  if (missing.length > 0) {
    const topMissing = missing.slice(0, 3);
    recommendations.push(`Consider gaining experience in: ${topMissing.join(", ")}`);
  }

  if (matched.length < 10) {
    recommendations.push("Your resume could benefit from more technical keywords related to this role");
  }

  if (matched.length > 15) {
    recommendations.push("Great job highlighting your relevant skills!");
  }

  const suggestions: Record<string, string[]> = {
    "data-analyst-intern": [
      "Include specific projects where you used SQL or Excel for analysis",
      "Add examples of dashboards or reports you've created",
      "Highlight any internships or case studies involving data analysis"
    ],
    "software-engineer": [
      "Include specific programming languages and frameworks you've used",
      "Mention contributions to open-source projects or GitHub repositories",
      "Highlight projects that demonstrate software design principles"
    ],
    "frontend-engineer": [
      "Showcase responsive design experience across devices",
      "Include examples of performance optimizations you've implemented",
      "Highlight accessibility (A11y) considerations in your work"
    ],
    "product-manager": [
      "Include metrics and impact of products you've managed",
      "Mention stakeholder management and cross-functional collaboration",
      "Highlight data-driven decision making examples"
    ],
  };

  const roleSpecific = suggestions[roleKey] || [];
  for (const suggestion of roleSpecific.slice(0, 2)) {
    if (!recommendations.includes(suggestion)) {
      recommendations.push(suggestion);
    }
  }

  return recommendations;
}

function generateCustomRecommendations(
  matched: string[],
  missing: string[]
): string[] {
  const recommendations: string[] = [];

  const matchPercentage = (matched.length / (matched.length + missing.length)) * 100;

  if (matchPercentage >= 80) {
    recommendations.push("Excellent match for this position! Your resume aligns well with the job requirements.");
  } else if (matchPercentage >= 60) {
    recommendations.push("Good match. Consider highlighting or adding some missing key qualifications.");
  } else {
    recommendations.push("This role may require some additional skills or experience to be competitive.");
  }

  if (missing.length > 0) {
    recommendations.push(`Priority skills to add: ${missing.slice(0, 3).join(", ")}`);
  }

  return recommendations;
}
