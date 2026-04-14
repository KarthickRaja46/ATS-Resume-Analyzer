import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.id),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const resumes = mysqlTable("resumes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(), // S3 key
  fileUrl: varchar("fileUrl", { length: 1024 }).notNull(), // S3 URL
  rawText: text("rawText").notNull(), // Extracted text from PDF
  versionNumber: int("versionNumber").default(1).notNull(), // Track version number
  baseResumeId: int("baseResumeId"), // Reference to original if this is a derived version
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("resume_user_id_idx").on(table.userId),
  baseResumeIdx: index("resume_base_resume_idx").on(table.baseResumeId),
}));

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = typeof resumes.$inferInsert;

export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  resumeId: int("resumeId").notNull(),
  userId: int("userId").notNull(),
  jobRole: varchar("jobRole", { length: 100 }).default("data-analyst").notNull(), // Multi-role support
  jobDescription: text("jobDescription"), // Custom job description for matching
  internScore: int("internScore").notNull(), // 0-100
  jobScore: int("jobScore").notNull(), // 0-100
  matchedKeywordsIntern: text("matchedKeywordsIntern").notNull(), // JSON array
  missingKeywordsIntern: text("missingKeywordsIntern").notNull(), // JSON array
  matchedKeywordsJob: text("matchedKeywordsJob").notNull(), // JSON array
  missingKeywordsJob: text("missingKeywordsJob").notNull(), // JSON array
  structureValidation: text("structureValidation").notNull(), // JSON object with section checks
  recommendations: text("recommendations").notNull(), // JSON array of recommendations
  customKeywords: text("customKeywords"), // JSON array of custom keywords
  benchmarkPercentile: decimal("benchmarkPercentile", { precision: 5, scale: 2 }), // User percentile vs benchmarks
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("analysis_user_id_idx").on(table.userId),
  resumeIdIdx: index("analysis_resume_id_idx").on(table.resumeId),
  jobRoleIdx: index("analysis_job_role_idx").on(table.jobRole),
}));

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;

export const rewriteSuggestions = mysqlTable("rewriteSuggestions", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull(),
  originalText: text("originalText").notNull(),
  suggestedText: text("suggestedText").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'summary', 'bullet', 'cover_letter'
  accepted: int("accepted").default(0), // 0 = pending, 1 = accepted, -1 = rejected
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RewriteSuggestion = typeof rewriteSuggestions.$inferSelect;
export type InsertRewriteSuggestion = typeof rewriteSuggestions.$inferInsert;

// New tables for expanded features

export const roleDefinitions = mysqlTable("roleDefinitions", {
  id: int("id").autoincrement().primaryKey(),
  roleKey: varchar("roleKey", { length: 100 }).notNull().unique(), // e.g., 'software-engineer', 'product-manager'
  roleName: varchar("roleName", { length: 255 }).notNull(),
  description: text("description"),
  industry: varchar("industry", { length: 100 }), // e.g., 'tech', 'finance', 'healthcare'
  keywords: text("keywords").notNull(), // JSON array of core keywords
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RoleDefinition = typeof roleDefinitions.$inferSelect;
export type InsertRoleDefinition = typeof roleDefinitions.$inferInsert;

export const resumeTemplates = mysqlTable("resumeTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  templateContent: text("templateContent").notNull(), // HTML/Markdown template
  industry: varchar("industry", { length: 100 }), // e.g., 'tech', 'finance', 'healthcare'
  roleKey: varchar("roleKey", { length: 100 }), // Optional: specific to a role
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResumeTemplate = typeof resumeTemplates.$inferSelect;
export type InsertResumeTemplate = typeof resumeTemplates.$inferInsert;

export const jobDescriptions = mysqlTable("jobDescriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  jobTitle: varchar("jobTitle", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  description: text("description").notNull(),
  extractedKeywords: text("extractedKeywords").notNull(), // JSON array
  roleKey: varchar("roleKey", { length: 100 }), // Mapped role
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("job_desc_user_id_idx").on(table.userId),
}));

export type JobDescription = typeof jobDescriptions.$inferSelect;
export type InsertJobDescription = typeof jobDescriptions.$inferInsert;

export const customKeywords = mysqlTable("customKeywords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }), // 'skill', 'framework', 'tool', 'certification'
  weight: decimal("weight", { precision: 3, scale: 2 }).default("1.00").notNull(), // Importance weight
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("custom_keyword_user_id_idx").on(table.userId),
}));

export type CustomKeyword = typeof customKeywords.$inferSelect;
export type InsertCustomKeyword = typeof customKeywords.$inferInsert;

export const coverLetters = mysqlTable("coverLetters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  resumeId: int("resumeId"),
  jobDescriptionId: int("jobDescriptionId"),
  content: text("content").notNull(), // Generated cover letter
  jobTitle: varchar("jobTitle", { length: 255 }),
  company: varchar("company", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("cover_letter_user_id_idx").on(table.userId),
}));

export type CoverLetter = typeof coverLetters.$inferSelect;
export type InsertCoverLetter = typeof coverLetters.$inferInsert;

export const scoreBenchmarks = mysqlTable("scoreBenchmarks", {
  id: int("id").autoincrement().primaryKey(),
  roleKey: varchar("roleKey", { length: 100 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  averageScore: decimal("averageScore", { precision: 5, scale: 2 }).notNull(),
  medianScore: decimal("medianScore", { precision: 5, scale: 2 }).notNull(),
  percentile25: decimal("percentile25", { precision: 5, scale: 2 }).notNull(),
  percentile75: decimal("percentile75", { precision: 5, scale: 2 }).notNull(),
  samplesCount: int("samplesCount").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  roleKeyIdx: index("benchmark_role_key_idx").on(table.roleKey),
}));

export type ScoreBenchmark = typeof scoreBenchmarks.$inferSelect;
export type InsertScoreBenchmark = typeof scoreBenchmarks.$inferInsert;

export const collaborations = mysqlTable("collaborations", {
  id: int("id").autoincrement().primaryKey(),
  resumeId: int("resumeId").notNull(),
  ownerId: int("ownerId").notNull(),
  sharedWithEmail: varchar("sharedWithEmail", { length: 320 }).notNull(),
  permission: mysqlEnum("permission", ["view", "comment", "edit"]).default("comment").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerIdIdx: index("collaboration_owner_id_idx").on(table.ownerId),
  resumeIdIdx: index("collaboration_resume_id_idx").on(table.resumeId),
}));

export type Collaboration = typeof collaborations.$inferSelect;
export type InsertCollaboration = typeof collaborations.$inferInsert;

export const searchSavedFilters = mysqlTable("searchSavedFilters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  filterName: varchar("filterName", { length: 255 }).notNull(),
  filterCriteria: text("filterCriteria").notNull(), // JSON object with search filters
  isFavorite: boolean("isFavorite").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("search_filter_user_id_idx").on(table.userId),
}));

export type SearchSavedFilter = typeof searchSavedFilters.$inferSelect;
export type InsertSearchSavedFilter = typeof searchSavedFilters.$inferInsert;

export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  theme: mysqlEnum("theme", ["light", "dark", "system"]).default("system").notNull(),
  defaultRole: varchar("defaultRole", { length: 100 }), // Default job role for analysis
  emailNotificationsEnabled: boolean("emailNotificationsEnabled").default(true).notNull(),
  exportFormat: mysqlEnum("exportFormat", ["pdf", "docx", "markdown"]).default("pdf").notNull(),
  language: varchar("language", { length: 10 }).default("en").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;