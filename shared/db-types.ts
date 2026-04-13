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
  createdAt: Date;
  updatedAt: Date;
};

export type InsertResume = Omit<Resume, "id" | "createdAt" | "updatedAt">;

export type Analysis = {
  id: number;
  resumeId: number;
  userId: number;
  internScore: number;
  jobScore: number;
  matchedKeywordsIntern: string;
  missingKeywordsIntern: string;
  matchedKeywordsJob: string;
  missingKeywordsJob: string;
  structureValidation: string;
  recommendations: string;
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
