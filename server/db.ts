import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Analysis,
  InsertAnalysis,
  InsertRewriteSuggestion,
  InsertUser,
  Resume,
  RewriteSuggestion,
  User,
} from "../shared/db-types";
import { ENV } from "./_core/env";

let _supabase: SupabaseClient | null = null;

function getSupabaseUrl() {
  return process.env.SUPABASE_URL ?? "";
}

function getSupabaseKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
}

function ensureSupabase(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!url || !key) {
    console.warn("[Database] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
    return null;
  }
  if (!_supabase) {
    _supabase = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _supabase;
}

export function getDb(): SupabaseClient | null {
  return ensureSupabase();
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = ensureSupabase();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const now = new Date().toISOString();
  const normalizedRole =
    user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");

  const { data: existing } = await db
    .from("users")
    .select("id")
    .eq("open_id", user.openId)
    .maybeSingle();

  if (existing) {
    await db
      .from("users")
      .update({
        updated_at: now,
        role: normalizedRole,
        ...(user.name !== undefined && { name: user.name ?? null }),
        ...(user.email !== undefined && { email: user.email ?? null }),
        ...(user.loginMethod !== undefined && { login_method: user.loginMethod ?? null }),
        ...(user.lastSignedIn !== undefined && {
          last_signed_in: user.lastSignedIn.toISOString(),
        }),
      })
      .eq("open_id", user.openId);
  } else {
    await db.from("users").insert({
      open_id: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      login_method: user.loginMethod ?? null,
      role: normalizedRole,
      created_at: now,
      updated_at: now,
      last_signed_in: (user.lastSignedIn ?? new Date()).toISOString(),
    });
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = ensureSupabase();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("open_id", openId)
    .maybeSingle();

  if (error) {
    console.error("[Database] getUserByOpenId error:", error.message);
    return undefined;
  }

  return data ? rowToUser(data) : undefined;
}

// ─── Resumes ──────────────────────────────────────────────────────────────────

export async function createResume(
  userId: number,
  fileName: string,
  fileKey: string,
  fileUrl: string,
  rawText: string
): Promise<Resume> {
  const db = ensureSupabase();
  if (!db) throw new Error("Database not available");

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("resumes")
    .insert({
      user_id: userId,
      file_name: fileName,
      file_key: fileKey,
      file_url: fileUrl,
      raw_text: rawText,
      version_number: 1,
      base_resume_id: null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) throw new Error(`[Database] createResume: ${error.message}`);
  return rowToResume(data);
}

export async function getResumesByUserId(userId: number): Promise<Resume[]> {
  const db = ensureSupabase();
  if (!db) throw new Error("Database not available");

  const { data, error } = await db
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`[Database] getResumesByUserId: ${error.message}`);
  return (data ?? []).map(rowToResume);
}

export async function getResumeById(resumeId: number): Promise<Resume | null> {
  const db = ensureSupabase();
  if (!db) throw new Error("Database not available");

  const { data, error } = await db
    .from("resumes")
    .select("*")
    .eq("id", resumeId)
    .maybeSingle();

  if (error) throw new Error(`[Database] getResumeById: ${error.message}`);
  return data ? rowToResume(data) : null;
}

// ─── Analyses ─────────────────────────────────────────────────────────────────

export async function createAnalysis(analysisData: InsertAnalysis): Promise<Analysis> {
  const db = ensureSupabase();
  if (!db) throw new Error("Database not available");

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("analyses")
    .insert({
      resume_id: analysisData.resumeId,
      user_id: analysisData.userId,
      job_role: analysisData.jobRole ?? "data-analyst-entry",
      job_description: analysisData.jobDescription ?? null,
      intern_score: analysisData.internScore,
      job_score: analysisData.jobScore,
      matched_keywords_intern: analysisData.matchedKeywordsIntern,
      missing_keywords_intern: analysisData.missingKeywordsIntern,
      matched_keywords_job: analysisData.matchedKeywordsJob,
      missing_keywords_job: analysisData.missingKeywordsJob,
      structure_validation: analysisData.structureValidation,
      recommendations: analysisData.recommendations,
      custom_keywords: analysisData.customKeywords ?? null,
      benchmark_percentile: analysisData.benchmarkPercentile ?? null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) throw new Error(`[Database] createAnalysis: ${error.message}`);
  return rowToAnalysis(data);
}

export async function getAnalysisByResumeId(resumeId: number): Promise<Analysis | null> {
  const db = ensureSupabase();
  if (!db) throw new Error("Database not available");

  const { data, error } = await db
    .from("analyses")
    .select("*")
    .eq("resume_id", resumeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`[Database] getAnalysisByResumeId: ${error.message}`);
  return data ? rowToAnalysis(data) : null;
}

export async function getAnalysisById(analysisId: number): Promise<Analysis | null> {
  const db = ensureSupabase();
  if (!db) throw new Error("Database not available");

  const { data, error } = await db
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .maybeSingle();

  if (error) throw new Error(`[Database] getAnalysisById: ${error.message}`);
  return data ? rowToAnalysis(data) : null;
}

// ─── Rewrite Suggestions ──────────────────────────────────────────────────────

export async function createRewriteSuggestion(
  suggestionData: InsertRewriteSuggestion
): Promise<RewriteSuggestion> {
  const db = ensureSupabase();
  if (!db) throw new Error("Database not available");

  const { data, error } = await db
    .from("rewrite_suggestions")
    .insert({
      analysis_id: suggestionData.analysisId,
      original_text: suggestionData.originalText,
      suggested_text: suggestionData.suggestedText,
      category: suggestionData.category,
      accepted: suggestionData.accepted,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`[Database] createRewriteSuggestion: ${error.message}`);
  return rowToRewriteSuggestion(data);
}

export async function getRewriteSuggestionsByAnalysisId(
  analysisId: number
): Promise<RewriteSuggestion[]> {
  const db = ensureSupabase();
  if (!db) throw new Error("Database not available");

  const { data, error } = await db
    .from("rewrite_suggestions")
    .select("*")
    .eq("analysis_id", analysisId)
    .order("created_at", { ascending: false });

  if (error)
    throw new Error(`[Database] getRewriteSuggestionsByAnalysisId: ${error.message}`);
  return (data ?? []).map(rowToRewriteSuggestion);
}

// ─── Row mappers (snake_case → camelCase) ─────────────────────────────────────

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as number,
    openId: row.open_id as string,
    name: (row.name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    loginMethod: (row.login_method as string | null) ?? null,
    role: row.role as "user" | "admin",
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    lastSignedIn: new Date(row.last_signed_in as string),
  };
}

function rowToResume(row: Record<string, unknown>): Resume {
  return {
    id: row.id as number,
    userId: row.user_id as number,
    fileName: row.file_name as string,
    fileKey: row.file_key as string,
    fileUrl: row.file_url as string,
    rawText: row.raw_text as string,
    versionNumber: row.version_number as number,
    baseResumeId: (row.base_resume_id as number | null) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function rowToAnalysis(row: Record<string, unknown>): Analysis {
  return {
    id: row.id as number,
    resumeId: row.resume_id as number,
    userId: row.user_id as number,
    jobRole: row.job_role as string,
    jobDescription: (row.job_description as string | null) ?? null,
    internScore: row.intern_score as number,
    jobScore: row.job_score as number,
    matchedKeywordsIntern: row.matched_keywords_intern as string,
    missingKeywordsIntern: row.missing_keywords_intern as string,
    matchedKeywordsJob: row.matched_keywords_job as string,
    missingKeywordsJob: row.missing_keywords_job as string,
    structureValidation: row.structure_validation as string,
    recommendations: row.recommendations as string,
    customKeywords: (row.custom_keywords as string | null) ?? null,
    benchmarkPercentile: (row.benchmark_percentile as string | null) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function rowToRewriteSuggestion(row: Record<string, unknown>): RewriteSuggestion {
  return {
    id: row.id as number,
    analysisId: row.analysis_id as number,
    originalText: row.original_text as string,
    suggestedText: row.suggested_text as string,
    category: row.category as string,
    accepted: row.accepted as number,
    createdAt: new Date(row.created_at as string),
  };
}
