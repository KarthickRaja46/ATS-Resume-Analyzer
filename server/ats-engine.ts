/**
 * ATS Resume Analysis Engine
 * Analyzes resumes for Data Analyst Intern and Entry-Level Data Analyst roles
 */

export interface ATSAnalysisResult {
  internScore: number;
  jobScore: number;
  matchedKeywordsIntern: string[];
  missingKeywordsIntern: string[];
  matchedKeywordsJob: string[];
  missingKeywordsJob: string[];
  structureValidation: StructureValidation;
  recommendations: Recommendation[];
  skillMatrix: Record<string, number>; // New: Skill proficiency for visualization
}

export interface StructureValidation {
  hasSummary: boolean;
  hasSkills: boolean;
  hasExperience: boolean;
  hasProjects: boolean;
  hasEducation: boolean;
  hasCertifications: boolean;
  missingSection: string[];
}

export interface Recommendation {
  category: "keyword_optimization" | "formatting" | "quantification";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

// Keywords for Data Analyst Intern role
const INTERN_KEYWORDS = [
  "Python",
  "SQL",
  "Excel",
  "Power BI",
  "Data Cleaning",
  "EDA",
  "Exploratory Data Analysis",
  "Data Visualization",
  "Pandas",
  "NumPy",
  "Internship",
  "Analytical",
  "Communication",
  "Data Analysis",
  "MySQL",
  "Tableau",
];

// Keywords for Entry-Level Data Analyst role
const JOB_KEYWORDS = [
  "Python",
  "SQL",
  "Tableau",
  "Power BI",
  "ETL",
  "Machine Learning",
  "Statistics",
  "Data Modeling",
  "Business Intelligence",
  "KPI",
  "Stakeholder",
  "Automation",
  "MySQL",
  "Scikit-learn",
  "Data Analysis",
  "Dashboard",
  "Reporting",
  "Database",
];

// Resume sections to validate
const REQUIRED_SECTIONS = [
  { name: "Summary", patterns: [/summary|overview|profile/i] },
  { name: "Skills", patterns: [/skills|technical skills|competencies/i] },
  { name: "Experience", patterns: [/experience|professional experience|work experience/i] },
  { name: "Projects", patterns: [/projects|portfolio|case studies/i] },
  { name: "Education", patterns: [/education|academic|degree/i] },
  { name: "Certifications", patterns: [/certifications|certificates|credentials/i] },
];

/**
 * Calculate keyword match score
 */
function calculateKeywordScore(
  text: string,
  keywords: string[]
): { matched: string[]; missing: string[]; score: number } {
  const normalizedText = text.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];

  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    // Use word boundary matching to avoid partial matches
    const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");

    if (regex.test(normalizedText)) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  }

  const score = Math.round((matched.length / keywords.length) * 100);
  return { matched, missing, score };
}

/**
 * Validate resume structure
 */
function validateResumeStructure(text: string): StructureValidation {
  const validation: StructureValidation = {
    hasSummary: false,
    hasSkills: false,
    hasExperience: false,
    hasProjects: false,
    hasEducation: false,
    hasCertifications: false,
    missingSection: [],
  };

  const normalizedText = text.toLowerCase();

  for (const section of REQUIRED_SECTIONS) {
    const found = section.patterns.some((pattern) => pattern.test(normalizedText));

    if (found) {
      const key = `has${section.name}` as keyof StructureValidation;
      (validation[key] as boolean) = true;
    } else {
      validation.missingSection.push(section.name);
    }
  }

  return validation;
}

/**
 * Generate improvement recommendations
 */
function generateRecommendations(
  internScore: number,
  jobScore: number,
  missingKeywordsIntern: string[],
  missingKeywordsJob: string[],
  structureValidation: StructureValidation
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Keyword optimization recommendations
  if (missingKeywordsIntern.length > 5) {
    recommendations.push({
      category: "keyword_optimization",
      title: "Add Missing Technical Keywords",
      description: `Your resume is missing several important keywords for Data Analyst Intern roles. Consider incorporating: ${missingKeywordsIntern.slice(0, 5).join(", ")}. These keywords are commonly searched by ATS systems.`,
      priority: "high",
    });
  }

  if (missingKeywordsJob.length > 5) {
    recommendations.push({
      category: "keyword_optimization",
      title: "Enhance Keywords for Full-Time Roles",
      description: `For entry-level positions, add these missing keywords: ${missingKeywordsJob.slice(0, 5).join(", ")}. This will improve your visibility in job searches.`,
      priority: "high",
    });
  }

  // Formatting recommendations
  if (structureValidation.missingSection.length > 0) {
    recommendations.push({
      category: "formatting",
      title: `Add Missing Resume Sections`,
      description: `Your resume is missing these important sections: ${structureValidation.missingSection.join(", ")}. Adding these sections will improve your ATS score and provide more context to recruiters.`,
      priority: "high",
    });
  }

  if (!structureValidation.hasProjects) {
    recommendations.push({
      category: "formatting",
      title: "Include a Projects Section",
      description: "A dedicated projects section showcases your practical experience and technical skills. Include 2-3 relevant projects with technologies used and measurable outcomes.",
      priority: "medium",
    });
  }

  // Quantification recommendations
  recommendations.push({
    category: "quantification",
    title: "Quantify Your Achievements",
    description: "Use specific metrics and numbers in your bullet points. For example: 'Improved data processing speed by 40%' or 'Analyzed 50,000+ records' instead of vague statements.",
    priority: "high",
  });

  recommendations.push({
    category: "formatting",
    title: "Use Standard Formatting",
    description: "Ensure your resume uses standard fonts (Arial, Calibri), consistent bullet points, and clear section headers. Avoid special characters and complex formatting that ATS systems may not parse correctly.",
    priority: "medium",
  });

  return recommendations;
}

/**
 * Calculate proficiency matrix for visualization
 */
function calculateSkillMatrix(text: string): Record<string, number> {
  const normalizedText = text.toLowerCase();
  
  const categories = {
    "Programming": ["python", " r ", "java", "golang", "typescript", "javascript", "scripting"],
    "Data Tools": ["sql", "excel", "tableau", "power bi", "pandas", "numpy", "matplotlib", "seaborn"],
    "Statistics": ["statistics", "modeling", "hypothesis", "probability", "regression", "math", "analytics"],
    "Data Infrastructure": ["database", "etl", "mysql", "postgres", "mongodb", "aws", "cloud", "warehouse"],
    "Soft Skills": ["communication", "collaboration", "stakeholder", "presentation", "analytical", "teamwork"],
  };

  const matrix: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(categories)) {
    let matches = 0;
    for (const kw of keywords) {
      if (normalizedText.includes(kw)) matches++;
    }
    // Scale to percentage (roughly)
    matrix[category] = Math.min(100, Math.round((matches / Math.max(1, Math.min(4, keywords.length))) * 100));
  }

  return matrix;
}

/**
 * Main ATS analysis function
 */
export function analyzeResume(resumeText: string, roleKey: string = "data-analyst-entry"): ATSAnalysisResult {
  // Use professional keywords based on the roleKey
  // For now, mapping known roles to keyword sets
  const roleKeywords: Record<string, string[]> = {
    "software-engineer": ["Java", "Python", "Git", "Docker", "REST API", "Database", "Testing", "CI/CD", "Agile", "OOP"],
    "frontend-engineer": ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Next.js", "Redux", "Tailwind", "Responsive"],
    "backend-engineer": ["Node.js", "Express", "SQL", "NoSQL", "Docker", "Microservices", "Redis", "Authentication", "API"],
    "fullstack-engineer": ["React", "Node.js", "TypeScript", "SQL", "Git", "Docker", "API", "Testing", "JavaScript"],
    "data-scientist": ["Python", "R", "Machine Learning", "Statistics", "Scikit-learn", "TensorFlow", "Pandas", "NLP", "SQL"],
    "product-manager": ["Product Strategy", "Agile", "Scrum", "User Research", "Roadmap", "Analytics", "Stakeholder", "KPI"],
    "data-analyst-entry": JOB_KEYWORDS,
    "data-analyst-intern": INTERN_KEYWORDS,
  };

  const targetKeywords = roleKeywords[roleKey] || JOB_KEYWORDS;
  const foundationKeywords = INTERN_KEYWORDS; // Use intern keywords as a foundation/internship benchmark

  // Calculate scores
  const internAnalysis = calculateKeywordScore(resumeText, foundationKeywords);
  const jobAnalysis = calculateKeywordScore(resumeText, targetKeywords);

  // Validate structure
  const structureValidation = validateResumeStructure(resumeText);
  const skillMatrix = calculateSkillMatrix(resumeText);

  // Generate recommendations
  const recommendations = generateRecommendations(
    internAnalysis.score,
    jobAnalysis.score,
    internAnalysis.missing,
    jobAnalysis.missing,
    structureValidation
  );

  return {
    internScore: internAnalysis.score,
    jobScore: jobAnalysis.score,
    matchedKeywordsIntern: internAnalysis.matched,
    missingKeywordsIntern: internAnalysis.missing,
    matchedKeywordsJob: jobAnalysis.matched,
    missingKeywordsJob: jobAnalysis.missing,
    structureValidation,
    recommendations,
    skillMatrix,
  };
}
