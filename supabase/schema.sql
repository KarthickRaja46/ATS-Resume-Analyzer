-- ============================================================
-- ATS Resume Analyzer – Supabase / PostgreSQL Schema
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- ─── Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              BIGSERIAL PRIMARY KEY,
  open_id         TEXT        NOT NULL UNIQUE,
  name            TEXT,
  email           TEXT,
  login_method    TEXT,
  role            TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_signed_in  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_open_id ON users (open_id);

-- ─── Resumes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resumes (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  file_name       TEXT        NOT NULL,
  file_key        TEXT        NOT NULL,
  file_url        TEXT        NOT NULL,
  raw_text        TEXT        NOT NULL DEFAULT '',
  version_number  INTEGER     NOT NULL DEFAULT 1,
  base_resume_id  BIGINT      REFERENCES resumes (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes (user_id);

-- ─── Analyses ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analyses (
  id                       BIGSERIAL PRIMARY KEY,
  resume_id                BIGINT      NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
  user_id                  BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  job_role                 TEXT        NOT NULL DEFAULT 'data-analyst-entry',
  job_description          TEXT,
  intern_score             NUMERIC(5,2) NOT NULL DEFAULT 0,
  job_score                NUMERIC(5,2) NOT NULL DEFAULT 0,
  matched_keywords_intern  TEXT        NOT NULL DEFAULT '[]',
  missing_keywords_intern  TEXT        NOT NULL DEFAULT '[]',
  matched_keywords_job     TEXT        NOT NULL DEFAULT '[]',
  missing_keywords_job     TEXT        NOT NULL DEFAULT '[]',
  structure_validation     TEXT        NOT NULL DEFAULT '{}',
  recommendations          TEXT        NOT NULL DEFAULT '[]',
  custom_keywords          TEXT,
  benchmark_percentile     TEXT,
  skill_matrix             TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_resume_id ON analyses (resume_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id   ON analyses (user_id);

-- ─── Rewrite Suggestions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewrite_suggestions (
  id             BIGSERIAL PRIMARY KEY,
  analysis_id    BIGINT      NOT NULL REFERENCES analyses (id) ON DELETE CASCADE,
  original_text  TEXT        NOT NULL DEFAULT '',
  suggested_text TEXT        NOT NULL,
  category       TEXT        NOT NULL,
  accepted       SMALLINT    NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rewrite_suggestions_analysis_id ON rewrite_suggestions (analysis_id);

-- ─── Row Level Security (optional but recommended) ──────────
-- Disable RLS so the service-role key has full access
ALTER TABLE users              DISABLE ROW LEVEL SECURITY;
ALTER TABLE resumes            DISABLE ROW LEVEL SECURITY;
ALTER TABLE analyses           DISABLE ROW LEVEL SECURITY;
ALTER TABLE rewrite_suggestions DISABLE ROW LEVEL SECURITY;
