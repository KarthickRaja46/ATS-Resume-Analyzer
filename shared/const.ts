export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// Job Roles
export const JOB_ROLES = {
  "data-analyst-intern": {
    key: "data-analyst-intern",
    label: "Data Analyst (Intern)",
    industry: "tech"
  },
  "data-analyst-entry": {
    key: "data-analyst-entry",
    label: "Data Analyst (Entry-Level)",
    industry: "tech"
  },
  "software-engineer": {
    key: "software-engineer",
    label: "Software Engineer",
    industry: "tech"
  },
  "frontend-engineer": {
    key: "frontend-engineer",
    label: "Frontend Engineer",
    industry: "tech"
  },
  "backend-engineer": {
    key: "backend-engineer",
    label: "Backend Engineer",
    industry: "tech"
  },
  "fullstack-engineer": {
    key: "fullstack-engineer",
    label: "Full Stack Engineer",
    industry: "tech"
  },
  "devops-engineer": {
    key: "devops-engineer",
    label: "DevOps Engineer",
    industry: "tech"
  },
  "product-manager": {
    key: "product-manager",
    label: "Product Manager",
    industry: "tech"
  },
  "ux-designer": {
    key: "ux-designer",
    label: "UX/UI Designer",
    industry: "tech"
  },
  "data-scientist": {
    key: "data-scientist",
    label: "Data Scientist",
    industry: "tech"
  },
  "finance-analyst": {
    key: "finance-analyst",
    label: "Financial Analyst",
    industry: "finance"
  },
  "accountant": {
    key: "accountant",
    label: "Accountant",
    industry: "finance"
  },
  "marketing-manager": {
    key: "marketing-manager",
    label: "Marketing Manager",
    industry: "marketing"
  },
  "sales-executive": {
    key: "sales-executive",
    label: "Sales Executive",
    industry: "sales"
  },
  "hr-specialist": {
    key: "hr-specialist",
    label: "HR Specialist",
    industry: "hr"
  },
} as const;

export const INDUSTRIES = [
  "tech",
  "finance",
  "healthcare",
  "manufacturing",
  "retail",
  "marketing",
  "sales",
  "hr",
  "education",
  "other"
] as const;

export const EXPORT_FORMATS = ["pdf", "docx", "markdown", "json"] as const;

export const PERMISSIONS = ["view", "comment", "edit"] as const;

export const KEYWORD_CATEGORIES = [
  "skill",
  "framework",
  "tool",
  "certification",
  "language",
  "methodology"
] as const;
