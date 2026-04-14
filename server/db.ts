import { MongoClient, type Db, type Collection } from "mongodb";
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

type Counter = {
  _id: string;
  seq: number;
};

let _client: MongoClient | null = null;
let _db: Db | null = null;
let _initialized = false;

function getMongoUri() {
  return process.env.MONGODB_URI || process.env.DATABASE_URL || ENV.databaseUrl;
}

function getDbNameFromUri(uri: string): string {
  try {
    const parsed = new URL(uri);
    const path = parsed.pathname?.replace(/^\//, "");
    return path || "resume_optimizer_ats";
  } catch {
    return "resume_optimizer_ats";
  }
}

async function ensureMongo(): Promise<Db | null> {
  const uri = getMongoUri();
  if (!uri) return null;
  if (_db) return _db;

  try {
    _client = new MongoClient(uri);
    await _client.connect();
    _db = _client.db(getDbNameFromUri(uri));
    await ensureIndexes(_db);
    return _db;
  } catch (error) {
    console.warn("[Database] Failed to connect to MongoDB:", error);
    _db = null;
    return null;
  }
}

async function ensureIndexes(db: Db) {
  if (_initialized) return;

  await Promise.all([
    usersCollection(db).createIndex({ id: 1 }, { unique: true }),
    usersCollection(db).createIndex({ openId: 1 }, { unique: true }),
    resumesCollection(db).createIndex({ id: 1 }, { unique: true }),
    resumesCollection(db).createIndex({ userId: 1 }),
    analysesCollection(db).createIndex({ id: 1 }, { unique: true }),
    analysesCollection(db).createIndex({ resumeId: 1 }),
    analysesCollection(db).createIndex({ userId: 1 }),
    rewriteSuggestionsCollection(db).createIndex({ id: 1 }, { unique: true }),
    rewriteSuggestionsCollection(db).createIndex({ analysisId: 1 }),
  ]);

  _initialized = true;
}

export async function getDb() {
  return ensureMongo();
}

function usersCollection(db: Db): Collection<User> {
  return db.collection<User>("users");
}

function resumesCollection(db: Db): Collection<Resume> {
  return db.collection<Resume>("resumes");
}

function analysesCollection(db: Db): Collection<Analysis> {
  return db.collection<Analysis>("analyses");
}

function rewriteSuggestionsCollection(db: Db): Collection<RewriteSuggestion> {
  return db.collection<RewriteSuggestion>("rewriteSuggestions");
}

function countersCollection(db: Db): Collection<Counter> {
  return db.collection<Counter>("counters");
}

async function nextId(db: Db, sequence: string): Promise<number> {
  const result = await countersCollection(db).findOneAndUpdate(
    { _id: sequence },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  if (!result?.seq) {
    throw new Error(`Failed to generate id for sequence ${sequence}`);
  }

  return result.seq;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const users = usersCollection(db);
  const existing = await users.findOne({ openId: user.openId });
  const now = new Date();

  const normalizedRole = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");

  if (existing) {
    const updateFields: Partial<User> = {
      updatedAt: now,
      role: normalizedRole,
    };

    if (user.name !== undefined) updateFields.name = user.name ?? null;
    if (user.email !== undefined) updateFields.email = user.email ?? null;
    if (user.loginMethod !== undefined) updateFields.loginMethod = user.loginMethod ?? null;
    if (user.lastSignedIn !== undefined) updateFields.lastSignedIn = user.lastSignedIn;

    if (Object.keys(updateFields).length === 2) {
      updateFields.lastSignedIn = now;
    }

    await users.updateOne({ openId: user.openId }, { $set: updateFields });
    return;
  }

  const doc: User = {
    id: await nextId(db, "users"),
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    role: normalizedRole,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: user.lastSignedIn ?? now,
  };

  await users.insertOne(doc);
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  return (await usersCollection(db).findOne({ openId })) ?? undefined;
}

export async function createResume(
  userId: number,
  fileName: string,
  fileKey: string,
  fileUrl: string,
  rawText: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const resume: Resume = {
    id: await nextId(db, "resumes"),
    userId,
    fileName,
    fileKey,
    fileUrl,
    rawText,
    versionNumber: 1,
    baseResumeId: null,
    createdAt: now,
    updatedAt: now,
  };

  await resumesCollection(db).insertOne(resume);
  return resume;
}

export async function getResumesByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return resumesCollection(db).find({ userId }).sort({ createdAt: -1 }).toArray();
}

export async function getResumeById(resumeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await resumesCollection(db).findOne({ id: resumeId });
}

export async function createAnalysis(analysisData: InsertAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const analysis: Analysis = {
    id: await nextId(db, "analyses"),
    ...analysisData,
    jobRole: analysisData.jobRole ?? "data-analyst-entry",
    jobDescription: analysisData.jobDescription ?? null,
    customKeywords: analysisData.customKeywords ?? null,
    benchmarkPercentile: analysisData.benchmarkPercentile ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await analysesCollection(db).insertOne(analysis);
  return analysis;
}

export async function getAnalysisByResumeId(resumeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return analysesCollection(db)
    .find({ resumeId })
    .sort({ createdAt: -1 })
    .limit(1)
    .next();
}

export async function getAnalysisById(analysisId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await analysesCollection(db).findOne({ id: analysisId });
}

export async function createRewriteSuggestion(suggestionData: InsertRewriteSuggestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const suggestion: RewriteSuggestion = {
    id: await nextId(db, "rewriteSuggestions"),
    ...suggestionData,
    createdAt: new Date(),
  };

  await rewriteSuggestionsCollection(db).insertOne(suggestion);
  return suggestion;
}

export async function getRewriteSuggestionsByAnalysisId(analysisId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return rewriteSuggestionsCollection(db)
    .find({ analysisId })
    .sort({ createdAt: -1 })
    .toArray();
}
