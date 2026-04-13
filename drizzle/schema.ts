import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const resumes = mysqlTable("resumes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(), // S3 key
  fileUrl: varchar("fileUrl", { length: 1024 }).notNull(), // S3 URL
  rawText: text("rawText").notNull(), // Extracted text from PDF
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = typeof resumes.$inferInsert;

export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  resumeId: int("resumeId").notNull(),
  userId: int("userId").notNull(),
  internScore: int("internScore").notNull(), // 0-100
  jobScore: int("jobScore").notNull(), // 0-100
  matchedKeywordsIntern: text("matchedKeywordsIntern").notNull(), // JSON array
  missingKeywordsIntern: text("missingKeywordsIntern").notNull(), // JSON array
  matchedKeywordsJob: text("matchedKeywordsJob").notNull(), // JSON array
  missingKeywordsJob: text("missingKeywordsJob").notNull(), // JSON array
  structureValidation: text("structureValidation").notNull(), // JSON object with section checks
  recommendations: text("recommendations").notNull(), // JSON array of recommendations
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;

export const rewriteSuggestions = mysqlTable("rewriteSuggestions", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull(),
  originalText: text("originalText").notNull(),
  suggestedText: text("suggestedText").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'summary' or 'bullet'
  accepted: int("accepted").default(0), // 0 = pending, 1 = accepted, -1 = rejected
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RewriteSuggestion = typeof rewriteSuggestions.$inferSelect;
export type InsertRewriteSuggestion = typeof rewriteSuggestions.$inferInsert;