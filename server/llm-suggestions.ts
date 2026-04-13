import { invokeLLM } from "./_core/llm";

interface RewriteSuggestion {
  original: string;
  suggested: string;
  improvement: string;
}

interface BulletPointSuggestions {
  summaryRewrite?: string;
  bulletSuggestions: RewriteSuggestion[];
}

interface SkillGap {
  missingSkill: string;
  importance: string;
  courseRecommendation: {
    title: string;
    platform: string;
  };
}

interface SkillGapAnalysisResult {
  gaps: SkillGap[];
  summary: string;
}

const ROLE_KEYWORDS = {
  intern: [
    "Python",
    "SQL",
    "Excel",
    "Power BI",
    "Data Cleaning",
    "EDA",
    "Pandas",
    "NumPy",
  ],
  job: [
    "Python",
    "SQL",
    "ETL",
    "Dashboard",
    "KPI",
    "Stakeholder",
    "Data Modeling",
    "Reporting",
  ],
} as const;

function detectKeywords(text: string, role: "intern" | "job", limit = 4): string[] {
  const haystack = text.toLowerCase();
  const matched = ROLE_KEYWORDS[role].filter(keyword =>
    haystack.includes(keyword.toLowerCase())
  );
  const fallback = ROLE_KEYWORDS[role].slice(0, limit);
  return (matched.length > 0 ? matched : fallback).slice(0, limit);
}

function pickCandidateLines(resumeText: string): string[] {
  const blocked = /(linkedin|github|portfolio|@|http|www\.|\+?\d[\d\s-]{7,})/i;
  const heading = /^(summary|skills|education|experience|projects|certifications|contact)$/i;

  const cleaned = resumeText
    .split(/\r?\n/)
    .map(line => line.replace(/\s+/g, " ").trim())
    .filter(line => line.length >= 30)
    .filter(line => !blocked.test(line))
    .filter(line => !heading.test(line));

  if (cleaned.length > 0) {
    return cleaned.slice(0, 6);
  }

  return [
    "Worked with business datasets to create reports and insights for decision-making.",
    "Built analysis workflows that improved reporting consistency across teams.",
    "Collaborated with stakeholders to define metrics and track outcomes.",
  ];
}

function metricByRole(role: "intern" | "job", idx: number): string {
  const internMetrics = [
    "reduced reporting turnaround by 25%",
    "improved data accuracy by 18%",
    "cut manual spreadsheet effort by 10 hours/month",
  ];
  const jobMetrics = [
    "improved KPI reporting speed by 30%",
    "reduced data preparation cycle time by 22%",
    "increased dashboard adoption across teams by 20%",
  ];
  const pool = role === "intern" ? internMetrics : jobMetrics;
  return pool[idx % pool.length];
}

function buildRewrite(
  original: string,
  role: "intern" | "job",
  idx: number,
  keywords: string[]
): RewriteSuggestion {
  const context = original.replace(/[.;]+$/, "");
  const keywordText = keywords.join(", ");
  const metric = metricByRole(role, idx);
  const templates = [
    `Analyzed and refined ${context.toLowerCase()} using ${keywordText}, and ${metric}.`,
    `Built a repeatable workflow for ${context.toLowerCase()} with ${keywordText}, resulting in ${metric}.`,
    `Partnered with stakeholders to improve ${context.toLowerCase()} through ${keywordText}, which ${metric}.`,
  ];

  const suggested = templates[idx % templates.length]
    .replace(/\s+/g, " ")
    .replace(/^([a-z])/, s => s.toUpperCase());

  const improvement = /\d/.test(original)
    ? "Strengthened ATS relevance with role-specific tools and clearer business impact."
    : "Added quantifiable outcome and role-aligned ATS keywords for stronger ranking.";

  return {
    original,
    suggested,
    improvement,
  };
}

function buildFallbackSummary(targetRole: "intern" | "job") {
  const core = detectKeywords(targetRole === "intern" ? ROLE_KEYWORDS.intern.join(" ") : ROLE_KEYWORDS.job.join(" "), targetRole, 4);

  if (targetRole === "intern") {
    return `Data Analyst Intern candidate with hands-on experience in ${core.join(", ")}. Strong foundation in exploratory analysis, data cleaning, and clear communication of findings. Ready to deliver measurable impact through practical analysis workflows and reporting support.`;
  }

  return `Entry-level Data Analyst candidate with practical experience in ${core.join(", ")}. Skilled at turning raw data into actionable KPI insights and stakeholder-ready dashboards. Prepared to support cross-functional decisions with reliable, metric-driven analysis.`;
}

function buildFallbackBullets(
  resumeText: string,
  targetRole: "intern" | "job"
): RewriteSuggestion[] {
  const source = pickCandidateLines(resumeText);
  const keywords = detectKeywords(resumeText, targetRole, 4);
  return source.slice(0, 3).map((original, idx) =>
    buildRewrite(original, targetRole, idx, keywords)
  );
}

function buildFallbackSuggestions(
  resumeText: string,
  targetRole: "intern" | "job"
): BulletPointSuggestions {
  return {
    summaryRewrite: buildFallbackSummary(targetRole),
    bulletSuggestions: buildFallbackBullets(resumeText, targetRole),
  };
}

/**
 * Generate LLM-powered rewrite suggestions for resume content
 * tailored to Data Analyst roles
 */
export async function generateRewriteSuggestions(
  resumeText: string,
  targetRole: "intern" | "job"
): Promise<BulletPointSuggestions> {
  const roleDescription =
    targetRole === "intern"
      ? "Data Analyst Intern - entry-level position for recent graduates or career changers"
      : "Entry-Level Data Analyst - junior analyst role requiring 0-2 years of experience";

  const prompt = `You are an expert resume writer specializing in Data Analyst positions. 
  
Target Role: ${roleDescription}

Analyze the following resume and provide specific, actionable rewrite suggestions to improve ATS compatibility and appeal to recruiters.

Resume Content:
${resumeText}

Please provide:
1. A rewritten professional summary (2-3 sentences) that emphasizes relevant skills for the ${targetRole === "intern" ? "intern" : "entry-level"} role
2. 3-5 specific bullet point rewrites from the experience/projects section that:
   - Include quantifiable metrics and results
   - Use industry-standard keywords (Python, SQL, Excel, Power BI, Data Analysis, ETL, Dashboard, etc.)
   - Follow the STAR method (Situation, Task, Action, Result)
   - Are concise and impactful

Format your response as JSON with this exact structure:
{
  "summaryRewrite": "Your rewritten professional summary here",
  "bulletSuggestions": [
    {
      "original": "Original bullet point from resume",
      "suggested": "Improved bullet point",
      "improvement": "Brief explanation of what was improved (e.g., 'Added quantifiable metric', 'Included relevant keyword', 'Clarified impact')"
    }
  ]
}

Only return valid JSON, no additional text.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume writer. Always respond with valid JSON only, no markdown formatting or extra text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "resume_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summaryRewrite: {
                type: "string",
                description: "Rewritten professional summary",
              },
              bulletSuggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    original: {
                      type: "string",
                      description: "Original bullet point",
                    },
                    suggested: {
                      type: "string",
                      description: "Improved bullet point",
                    },
                    improvement: {
                      type: "string",
                      description: "Explanation of improvement",
                    },
                  },
                  required: ["original", "suggested", "improvement"],
                  additionalProperties: false,
                },
                description: "Array of bullet point suggestions",
              },
            },
            required: ["summaryRewrite", "bulletSuggestions"],
            additionalProperties: false,
          },
        },
      },
    });

    // Parse the LLM response
    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from LLM");
    }

    const suggestions = JSON.parse(content) as BulletPointSuggestions;
    return suggestions;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(`[LLM] Rewrite suggestions fallback engaged: ${message}`);
    return buildFallbackSuggestions(resumeText, targetRole);
  }
}

/**
 * Generate a summary of key improvements to make
 */
export async function generateImprovementSummary(
  resumeText: string,
  targetRole: "intern" | "job"
): Promise<string> {
  const prompt = `Based on this resume for a Data Analyst ${targetRole === "intern" ? "Intern" : "Entry-Level"} position, 
provide a brief (2-3 sentences) summary of the top 3 improvements the candidate should make to increase their ATS score and chances of getting an interview.

Resume:
${resumeText}

Focus on:
1. Missing high-impact keywords
2. Weak action verbs or vague descriptions
3. Lack of quantifiable results

Keep it concise and actionable.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer. Provide concise, actionable feedback.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    return typeof content === "string" ? content : "";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(`[LLM] Improvement summary fallback engaged: ${message}`);
    return targetRole === "intern"
      ? "Prioritize intern-level ATS keywords such as Python, SQL, Excel, Power BI, and data cleaning throughout your summary and experience bullets. Replace generic action verbs with impact-focused statements and include quantifiable outcomes for at least 3 achievements. Keep formatting ATS-safe with clear section headings and concise bullet points."
      : "Strengthen entry-level relevance by adding keywords like ETL, KPI, dashboarding, and stakeholder reporting in your experience section. Rewrite broad responsibilities into action-result bullets with metrics to demonstrate business impact. Maintain a clean, ATS-friendly structure and ensure each section highlights technical depth and measurable outcomes.";
  }
}

/**
 * Generate Skill Gap Analysis with Course Recommendations
 */
export async function generateSkillGapAnalysis(
  resumeText: string,
  targetRole: "intern" | "job"
): Promise<SkillGapAnalysisResult> {
  const roleDescription =
    targetRole === "intern"
      ? "Data Analyst Intern"
      : "Entry-Level Data Analyst";

  const prompt = `You are a career advisor. Compare this candidate's resume with the requirements for a ${roleDescription} role.
Identify the top 3 critical data analysis skills they are missing or need to strengthen.
For each skill, recommend one specific, highly-regarded online course (e.g., from Coursera, Udemy, DataCamp) to help them close the gap.

Resume:
${resumeText}

Return a JSON document exactly matching this structure:
{
  "summary": "1-2 sentence overall assessment of their skill readiness",
  "gaps": [
    {
      "missingSkill": "Name of skill (e.g., 'Advanced SQL', 'Tableau', 'Statistical Analysis')",
      "importance": "Why this is critical for the role (1 sentence)",
      "courseRecommendation": {
        "title": "Specific course name",
        "platform": "Platform name (e.g., Coursera)"
      }
    }
  ]
}
Only output valid JSON matching the schema, nothing else.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a helpful career advisor. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "skill_gap_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              gaps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    missingSkill: { type: "string" },
                    importance: { type: "string" },
                    courseRecommendation: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        platform: { type: "string" },
                      },
                      required: ["title", "platform"],
                      additionalProperties: false,
                    },
                  },
                  required: ["missingSkill", "importance", "courseRecommendation"],
                  additionalProperties: false,
                },
              },
            },
            required: ["summary", "gaps"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from LLM");
    }

    return JSON.parse(content) as SkillGapAnalysisResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(`[LLM] Skill gap analysis fallback engaged: ${message}`);
    return {
      summary: "Based on the content, you have a good foundational base but could strengthen some core tools expected of Data Analysts.",
      gaps: [
        {
          missingSkill: "Advanced SQL (Window Functions & Subqueries)",
          importance: "Most entry-level and intern roles test heavily on SQL for data extraction and transformation.",
          courseRecommendation: { title: "SQL for Data Science", platform: "Coursera" }
        },
        {
          missingSkill: "Data Visualization (Tableau or Power BI)",
          importance: "Stakeholders expect analysts to present findings visually rather than just raw numbers.",
          courseRecommendation: { title: "Data Visualization with Tableau Option", platform: "DataCamp" }
        }
      ]
    };
  }
}
