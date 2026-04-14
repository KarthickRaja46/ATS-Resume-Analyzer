/**
 * Resume Template Management Service
 * Manage pre-built templates for different roles and industries
 */

interface TemplateData {
  id: number;
  name: string;
  description: string;
  industry: string;
  roleKey?: string;
  templateContent: string;
}

interface TemplateApplication {
  originalText: string;
  appliedTemplate: string;
  suggestions: string[];
}

// Built-in templates
const BUILT_IN_TEMPLATES: Record<string, TemplateData> = {
  "tech-software-engineer": {
    id: 1,
    name: "Tech Resume - Software Engineer",
    description: "Optimized for software engineering roles in tech companies",
    industry: "tech",
    roleKey: "software-engineer",
    templateContent: `
# [Your Name]
[LinkedIn URL] | [GitHub URL] | [Email] | [Phone]

## PROFESSIONAL SUMMARY
Results-driven Software Engineer with [X] years of experience developing scalable applications using [tech stack]. Proven track record in [key accomplishment areas].

## TECHNICAL SKILLS
- Languages: Python, JavaScript, TypeScript, Java, [Others]
- Frameworks: React, Node.js, Express, Django, [Others]
- Databases: PostgreSQL, MongoDB, Redis, [Others]
- Tools & Platforms: Docker, Kubernetes, AWS, Git, CI/CD, [Others]
- Methodologies: Agile, Scrum, Software Design Patterns

## PROFESSIONAL EXPERIENCE

### Senior Software Engineer | [Company Name] | [Date Range]
- Led development of [project name], resulting in [quantifiable impact]
- Implemented [technology/feature], improving [metric] by [percentage]
- Mentored [number] junior engineers, establishing [best practices/processes]
- Reduced [issue], improving performance by [percentage]

### Software Engineer | [Company Name] | [Date Range]
- Developed and deployed [feature] serving [number] users
- Optimized database queries, reducing load time by [percentage]
- Contributed to open-source project [name], achieving [milestone]

## EDUCATION
- [Degree] in Computer Science | [University] | [Graduation Year]
- [Certifications, if any]

## PROJECTS
- [Project Name]: [Brief description and impact] | [Tech Stack]

## ADDITIONAL ACHIEVEMENTS
- [Awards, publications, conference talks]
    `,
  },
  "finance-analyst": {
    id: 2,
    name: "Finance Resume - Analyst",
    description: "Optimized for financial analyst roles",
    industry: "finance",
    roleKey: "finance-analyst",
    templateContent: `
# [Your Name]
[LinkedIn URL] | [Email] | [Phone] | [Location]

## PROFESSIONAL SUMMARY
Detail-oriented Financial Analyst with [X] years specializing in [key areas like budgeting, forecasting, analysis]. Demonstrated ability to drive profitability, reduce costs, and provide strategic insights.

## CORE COMPETENCIES
- Financial Analysis & Modeling
- Budgeting & Forecasting
- Data Analysis & Visualization (Excel, Tableau, Power BI)
- REITs, Equities, Fixed Income [if relevant]
- Financial Reporting & Compliance
- SQL & Database Management
- Statistical Analysis

## PROFESSIONAL EXPERIENCE

### Senior Financial Analyst | [Company Name] | [Date Range]
- Developed financial models that improved forecast accuracy by [percentage]
- Reduced operational costs by $[amount] through [initiative]
- Presented insights to C-level executives, leading to $[amount] in strategic investments
- Managed budget analysis for [department], optimizing spend allocation

### Financial Analyst | [Company Name] | [Date Range]
- Analyzed [number] transactions, identifying [specific results]
- Created automated dashboards using [tools], saving [time/resources]
- Conducted variance analysis, identifying and explaining [key findings]

## EDUCATION
- [Degree] in Finance/Accounting/Economics | [University] | [Graduation Year]
- [Certifications: CFA, CFP, etc.]

## TECHNICAL PROFICIENCIES
- Excel (Advanced functions, VBA, Power Pivot)
- SQL, Python - Data Analysis
- Tableau, Power BI
- SAP, Oracle, Bloomberg Terminal [if applicable]

## ACHIEVEMENTS
- [Awards, publications, recognitions]
    `,
  },
  "data-analyst": {
    id: 3,
    name: "Tech Resume - Data Analyst",
    description: "Optimized for data analyst roles in tech companies",
    industry: "tech",
    roleKey: "data-analyst-entry",
    templateContent: `
# [Your Name]
[LinkedIn URL] | [GitHub URL] | [Email] | [Phone]

## PROFESSIONAL SUMMARY
Data-driven Data Analyst with [X] years of experience transforming complex datasets into actionable insights. Proficient in SQL, Python, and data visualization tools. Strong track record of [key accomplishment].

## TECHNICAL SKILLS
- Languages: SQL, Python, R, [Others]
- Visualization: Tableau, Power BI, Looker, Google Analytics, Matplotlib
- Databases: PostgreSQL, MySQL, MongoDB, Snowflake, BigQuery
- Tools: Jupyter, Excel (Advanced), Git, AWS, Google Cloud
- Statistical Methods: A/B Testing, Regression Analysis, Time Series Analysis

## PROFESSIONAL EXPERIENCE

### Data Analyst | [Company Name] | [Date Range]
- Analyzed [number] records across [number] datasets, uncovering [key insights]
- Built automated dashboards using [tool], reducing reporting time by [percentage]
- Conducted A/B tests that improved [metric] by [percentage]
- Optimized SQL queries, reducing load time from [time] to [time]

### Junior Data Analyst | [Company Name] | [Date Range]
- Cleaned and processed [number] records, ensuring [percentage] data accuracy
- Created 15+ reports and visualizations used by [team/stakeholders]

## EDUCATION
- [Degree] in Data Science/Statistics/CS | [University] | [Graduation Year]
- [Relevant Certifications]

## PROJECTS
- [Project Name]: Built predictive model using [technique], achieving [accuracy]%
- [Project Name]: Analyzed [dataset] to identify [insights]

## ACHIEVEMENTS
- [Awards, publications, conference talks]
    `,
  },
};

/**
 * Get all available templates
 */
export function getAllTemplates(): TemplateData[] {
  return Object.values(BUILT_IN_TEMPLATES);
}

/**
 * Get templates by industry
 */
export function getTemplatesByIndustry(industry: string): TemplateData[] {
  return Object.values(BUILT_IN_TEMPLATES).filter(
    (t) => t.industry === industry
  );
}

/**
 * Get template by role
 */
export function getTemplateByRole(roleKey: string): TemplateData | null {
  for (const template of Object.values(BUILT_IN_TEMPLATES)) {
    if (template.roleKey === roleKey) {
      return template;
    }
  }
  return null;
}

/**
 * Apply template to resume
 */
export function applyTemplate(
  resumeText: string,
  template: TemplateData
): TemplateApplication {
  const suggestions: string[] = [];

  // Extract sections from current resume
  const currentSections = extractResumeSections(resumeText);

  // Compare with template structure
  const templateSections = extractResumeSections(template.templateContent);

  // Generate suggestions
  for (const section of Object.keys(templateSections)) {
    if (!currentSections[section]) {
      suggestions.push(`Consider adding a "${section}" section for better structure.`);
    }
  }

  if (resumeText.length < 200) {
    suggestions.push("Your resume is quite short. Consider adding more detail and accomplishments.");
  }

  if (!resumeText.match(/[0-9]+%/g)) {
    suggestions.push("Include quantifiable metrics (percentages, numbers) in your accomplishments.");
  }

  return {
    originalText: resumeText,
    appliedTemplate: template.templateContent,
    suggestions,
  };
}

/**
 * Extract resume sections
 */
function extractResumeSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};

  const sectionPatterns = [
    { name: "summary", patterns: ["summary", "profile", "objective"] },
    { name: "experience", patterns: ["experience", "professional", "work history"] },
    { name: "education", patterns: ["education", "degree", "university"] },
    { name: "skills", patterns: ["skills", "technical", "competencies"] },
    { name: "projects", patterns: ["projects", "portfolio"] },
    { name: "certifications", patterns: ["certification", "license", "credential"] },
  ];

  const lowerText = text.toLowerCase();

  for (const section of sectionPatterns) {
    for (const pattern of section.patterns) {
      if (lowerText.includes(pattern)) {
        sections[section.name] = pattern;
        break;
      }
    }
  }

  return sections;
}

/**
 * Generate custom template from existing resume
 */
export function generateTemplateFromResume(
  resumeText: string,
  name: string,
  industry: string
): TemplateData {
  const sections = extractResumeSections(resumeText);

  let templateContent = `# [Your Name]\n`;
  templateContent += `[Contact Information]\n\n`;

  if (sections.summary) {
    templateContent += `## PROFESSIONAL SUMMARY\n[Your 3-4 line professional summary]\n\n`;
  }

  if (sections.skills) {
    templateContent += `## SKILLS\n- [Skill 1]\n- [Skill 2]\n- [Skill 3]\n\n`;
  }

  if (sections.experience) {
    templateContent += `## PROFESSIONAL EXPERIENCE\n### [Job Title] | [Company] | [Date Range]\n- [Achievement 1]\n- [Achievement 2]\n\n`;
  }

  if (sections.education) {
    templateContent += `## EDUCATION\n- [Degree] in [Field] | [University] | [Year]\n\n`;
  }

  if (sections.certifications) {
    templateContent += `## CERTIFICATIONS\n- [Certification Name]\n\n`;
  }

  return {
    id: Math.floor(Math.random() * 1000),
    name,
    description: `Custom template based on ${industry} industry best practices`,
    industry,
    templateContent,
  };
}

/**
 * Get template recommendations
 */
export function getTemplateRecommendations(jobDescription: string, industry: string): TemplateData[] {
  let recommended = getTemplatesByIndustry(industry);

  // Re-rank based on job description keywords
  const jobKeywords = jobDescription.toLowerCase();
  const scores = recommended.map((t) => {
    let score = 0;
    const templateContent = t.templateContent.toLowerCase();

    // Count matching keywords
    if (jobKeywords.includes("python")) score += templateContent.includes("python") ? 1 : 0;
    if (jobKeywords.includes("sql")) score += templateContent.includes("sql") ? 1 : 0;
    if (jobKeywords.includes("analyst")) score += templateContent.includes("analyst") ? 1 : 0;
    if (jobKeywords.includes("engineer")) score += templateContent.includes("engineer") ? 1 : 0;
    if (jobKeywords.includes("manager")) score += templateContent.includes("manager") ? 1 : 0;

    return { template: t, score };
  });

  return scores.sort((a, b) => b.score - a.score).map((s) => s.template);
}

/**
 * Compare resume with template
 */
export function compareResumeWithTemplate(
  resumeText: string,
  template: TemplateData
): { score: number; missingElements: string[] } {
  const templateSections = extractResumeSections(template.templateContent);
  const resumeSections = extractResumeSections(resumeText);

  const missingElements: string[] = [];
  for (const section of Object.keys(templateSections)) {
    if (!resumeSections[section]) {
      missingElements.push(section);
    }
  }

  const score = ((Object.keys(templateSections).length - missingElements.length) /
    Object.keys(templateSections).length) * 100;

  return { score: Math.round(score), missingElements };
}
