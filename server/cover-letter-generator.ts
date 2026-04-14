/**
 * Cover Letter Generator Service
 * Generates tailored cover letters from resume + job description
 */

interface GenerateCoverLetterOptions {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  company?: string;
  tone?: "professional" | "friendly" | "enthusiastic";
}

interface CoverLetterResult {
  content: string;
  keywords: string[];
  tone: string;
}

/**
 * Generate a cover letter based on resume and job description
 */
export async function generateCoverLetter(
  options: GenerateCoverLetterOptions
): Promise<CoverLetterResult> {
  const {
    resumeText,
    jobDescription,
    jobTitle = "Position",
    company = "Company",
    tone = "professional",
  } = options;

  // Extract key skills from resume
  const resumeSkills = extractSkills(resumeText);
  const jobKeywords = extractKeywords(jobDescription);

  // Find matching skills
  const matchingSkills = resumeSkills.filter((skill) =>
    jobKeywords.some((keyword) =>
      keyword.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  // Extract accomplishments from resume
  const accomplishments = extractAccomplishments(resumeText);

  // Generate cover letter
  const coverLetter = generateCoverLetterContent(
    jobTitle,
    company,
    matchingSkills,
    accomplishments,
    jobDescription,
    tone
  );

  return {
    content: coverLetter,
    keywords: matchingSkills,
    tone,
  };
}

/**
 * Extract skills from resume text
 */
function extractSkills(resumeText: string): string[] {
  const commonSkills = [
    "Leadership", "Communication", "Problem-solving", "Teamwork",
    "Time management", "Creativity", "Adaptability", "Critical thinking",
    "Project management", "Strategic thinking", "Negotiation", "Mentoring",
    "Python", "JavaScript", "Java", "C++", "SQL", "TypeScript",
    "React", "Angular", "Vue", "Docker", "Kubernetes", "AWS",
    "Azure", "GCP", "Git", "CI/CD", "REST API", "GraphQL",
    "Machine Learning", "Data Analysis", "Excel", "Tableau", "Power BI",
    "Agile", "Scrum", "Design thinking", "UX/UI", "DevOps",
    "Database design", "System architecture", "Microservices",
    "Analytics", "Business intelligence", "Stakeholder management",
  ];

  const text = resumeText.toLowerCase();
  const foundSkills = new Set<string>();

  for (const skill of commonSkills) {
    const patterns = [
      new RegExp(`\\b${skill.toLowerCase()}\\b`, "gi"),
      new RegExp(`\\b${skill.toLowerCase()}s\\b`, "gi"),
    ];

    for (const pattern of patterns) {
      if (pattern.test(text)) {
        foundSkills.add(skill);
        break;
      }
    }
  }

  return Array.from(foundSkills);
}

/**
 * Extract keywords from job description
 */
function extractKeywords(jobDescription: string): string[] {
  const commonKeywords = [
    "experience", "skills", "responsibilities", "requirements",
    "about", "role", "position", "work", "team", "lead", "manage",
    "develop", "design", "create", "build", "implement", "improve",
    "analyze", "optimize", "ensure", "maintain", "support", "assist",
    "collaborate", "communicate", "present", "document", "test",
  ];

  const text = jobDescription.toLowerCase();
  const foundKeywords = new Set<string>();

  // Extract single words that are more than 4 characters
  const words = text.split(/\W+/).filter((w) => w.length > 4);
  for (const word of words) {
    if (!commonKeywords.includes(word) && !isCommonWord(word)) {
      foundKeywords.add(word);
    }
  }

  // Extract 2-3 word phrases
  const sentences = jobDescription.split(/[.!?;]/);
  for (const sentence of sentences) {
    const phrases = sentence.match(/([A-Za-z]{4,}\s+){2,}[A-Za-z]{4,}/gi);
    if (phrases) {
      phrases.forEach((phrase) => {
        const p = phrase.trim();
        if (p.length < 50) {
          foundKeywords.add(p);
        }
      });
    }
  }

  return Array.from(foundKeywords).slice(0, 20);
}

/**
 * Extract accomplishments from resume
 */
function extractAccomplishments(resumeText: string): string[] {
  const accomplishments: string[] = [];

  // Look for bullet points with quantifiable results
  const bulletPatterns = [
    /(?:•|-|·)\s*(.+?)(?:•|-|·|$)/gi,
    /(?:\n\s*)(?:•|-|·)\s*(.+?)(?:\n|$)/gi,
  ];

  for (const pattern of bulletPatterns) {
    let match;
    while ((match = pattern.exec(resumeText)) !== null) {
      const bullet = match[1].trim();
      // Look for bullets with percentages, numbers, or success indicators
      if (/\d+%|\d+\s+|increased|improved|achieved|led|managed|reduced/i.test(bullet)) {
        accomplishments.push(bullet);
      }
    }
  }

  return accomplishments.slice(0, 5);
}

/**
 * Generate cover letter content
 */
function generateCoverLetterContent(
  jobTitle: string,
  company: string,
  skills: string[],
  accomplishments: string[],
  jobDescription: string,
  tone: "professional" | "friendly" | "enthusiastic"
): string {
  const toneGuides = {
    professional: {
      opening: "I am writing to express my strong interest in the",
      closing: "Thank you for considering my application.",
      skillPhrase: "I am confident that my expertise in",
    },
    friendly: {
      opening: "I am excited to apply for the",
      closing: "I would love the opportunity to discuss how I can contribute.",
      skillPhrase: "I have experience with",
    },
    enthusiastic: {
      opening: "I am thrilled to express my interest in the",
      closing: "I am eager to bring my passion and skills to your team.",
      skillPhrase: "I am particularly passionate about",
    },
  };

  const guide = toneGuides[tone];

  let coverLetter = `[Your Name]
[Your Address]
[City, State ZIP Code]
[Your Email]
[Your Phone Number]
[Date]

[Hiring Manager Name]
${company}
[Company Address]
[City, State ZIP Code]

Dear Hiring Manager,

${guide.opening} ${jobTitle} position at ${company}. With my background in ${skills.slice(0, 2).join(
    " and "
  )}, I am confident that I would be a valuable addition to your team.

`;

  if (accomplishments.length > 0) {
    coverLetter += `In my current/previous role, I have demonstrated my commitment to delivering results:

`;
    accomplishments.forEach((acc) => {
      coverLetter += `• ${acc}\n`;
    });
    coverLetter += "\n";
  }

  coverLetter += `${guide.skillPhrase} ${skills.slice(0, 3).join(", ")} and other key areas outlined in your job description. I am particularly drawn to your organization because of `;

  // Try to extract company values or mission
  const missionKeywords = extractMissionKeywords(jobDescription);
  if (missionKeywords.length > 0) {
    coverLetter += `your focus on ${missionKeywords[0].toLowerCase()}. `;
  } else {
    coverLetter += `its reputation for excellence and innovation. `;
  }

  coverLetter += `I am eager to contribute my skills and expertise to help drive success in this role.

I would welcome the opportunity to discuss how my background, skills, and passion align with the needs of your team. Thank you for considering my application. I look forward to hearing from you.

Sincerely,

[Your Name]`;

  return coverLetter;
}

/**
 * Extract mission/values keywords from job description
 */
function extractMissionKeywords(jobDescription: string): string[] {
  const valueKeywords = [
    "innovation", "excellence", "customer", "quality", "sustainability",
    "diversity", "collaboration", "growth", "integrity", "impact",
    "transformation", "technology", "leadership", "community", "values",
  ];

  const text = jobDescription.toLowerCase();
  const foundValues = new Set<string>();

  for (const keyword of valueKeywords) {
    if (text.includes(keyword)) {
      foundValues.add(keyword);
    }
  }

  return Array.from(foundValues).slice(0, 3);
}

/**
 * Check if word is common/stop word
 */
function isCommonWord(word: string): boolean {
  const stopWords = [
    "the", "and", "for", "with", "that", "this", "from", "your",
    "have", "will", "should", "would", "could", "which", "their",
    "about", "also", "more", "some", "than", "when", "where",
    "why", "what", "who", "how", "all", "each", "every", "both",
    "either", "neither", "much", "many", "few", "several", "other",
  ];
  return stopWords.includes(word);
}

/**
 * Format cover letter for display (with markdown)
 */
export function formatCoverLetterForDisplay(coverLetter: string): string {
  // Add some basic markdown formatting
  let formatted = coverLetter;

  // Bold company name and job title
  formatted = formatted.replace(
    /(\[Hiring Manager Name\]|Dear Hiring Manager)/gi,
    "**$1**"
  );

  return formatted;
}

/**
 * Calculate cover letter score based on alignment with job description
 */
export function calculateCoverLetterScore(
  coverLetter: string,
  jobDescription: string
): number {
  const jobKeywords = extractKeywords(jobDescription).map((k) => k.toLowerCase());
  const letterText = coverLetter.toLowerCase();

  let matchCount = 0;
  for (const keyword of jobKeywords) {
    if (letterText.includes(keyword)) {
      matchCount++;
    }
  }

  const score = (matchCount / Math.max(jobKeywords.length, 1)) * 100;
  return Math.min(score, 100);
}
