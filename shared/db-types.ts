export type UserRole = "user" | "admin";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type InsertUser = {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role?: UserRole;
  lastSignedIn?: Date;
};

export type Resume = {
  id: number;
  userId: number;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  rawText: string;
  versionNumber: number;
  baseResumeId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertResume = Omit<Resume, "id" | "createdAt" | "updatedAt">;

export type Analysis = {
  id: number;
  resumeId: number;
  userId: number;
  jobRole: string;
  jobDescription: string | null;
  internScore: number;
  jobScore: number;
  matchedKeywordsIntern: string;
  missingKeywordsIntern: string;
  matchedKeywordsJob: string;
  missingKeywordsJob: string;
  structureValidation: string;
  recommendations: string;
  customKeywords: string | null;
  benchmarkPercentile: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertAnalysis = Omit<Analysis, "id" | "createdAt" | "updatedAt">;

export type RewriteSuggestion = {
  id: number;
  analysisId: number;
  originalText: string;
  suggestedText: string;
  category: string;
  accepted: number;
  createdAt: Date;
};

export type InsertRewriteSuggestion = Omit<RewriteSuggestion, "id" | "createdAt">;

// New types
export type RoleDefinition = {
  id: number;
  roleKey: string;
  roleName: string;
  description: string | null;
  industry: string | null;
  keywords: string; // JSON array
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertRoleDefinition = Omit<RoleDefinition, "id" | "createdAt" | "updatedAt">;

export type ResumeTemplate = {
  id: number;
  name: string;
  description: string | null;
  templateContent: string;
  industry: string | null;
  roleKey: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertResumeTemplate = Omit<ResumeTemplate, "id" | "createdAt" | "updatedAt">;

export type JobDescription = {
  id: number;
  userId: number | null;
  jobTitle: string;
  company: string | null;
  description: string;
  extractedKeywords: string; // JSON array
  roleKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertJobDescription = Omit<JobDescription, "id" | "createdAt" | "updatedAt">;

export type CustomKeyword = {
  id: number;
  userId: number;
  keyword: string;
  category: string | null;
  weight: string; // Decimal
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertCustomKeyword = Omit<CustomKeyword, "id" | "createdAt" | "updatedAt">;

export type CoverLetter = {
  id: number;
  userId: number;
  resumeId: number | null;
  jobDescriptionId: number | null;
  content: string;
  jobTitle: string | null;
  company: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertCoverLetter = Omit<CoverLetter, "id" | "createdAt" | "updatedAt">;

export type ScoreBenchmark = {
  id: number;
  roleKey: string;
  industry: string | null;
  averageScore: string; // Decimal
  medianScore: string; // Decimal
  percentile25: string; // Decimal
  percentile75: string; // Decimal
  samplesCount: number;
  updatedAt: Date;
};

export type InsertScoreBenchmark = Omit<ScoreBenchmark, "id" | "updatedAt">;

export type Collaboration = {
  id: number;
  resumeId: number;
  ownerId: number;
  sharedWithEmail: string;
  permission: "view" | "comment" | "edit";
  createdAt: Date;
  updatedAt: Date;
};

export type InsertCollaboration = Omit<Collaboration, "id" | "createdAt" | "updatedAt">;

export type SearchSavedFilter = {
  id: number;
  userId: number;
  filterName: string;
  filterCriteria: string; // JSON
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertSearchSavedFilter = Omit<SearchSavedFilter, "id" | "createdAt" | "updatedAt">;

export type UserPreferences = {
  id: number;
  userId: number;
  theme: "light" | "dark" | "system";
  defaultRole: string | null;
  emailNotificationsEnabled: boolean;
  exportFormat: "pdf" | "docx" | "markdown";
  language: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertUserPreferences = Omit<UserPreferences, "id" | "createdAt" | "updatedAt">;
