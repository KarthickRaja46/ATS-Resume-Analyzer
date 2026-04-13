# Master Change Log - 2026-04-14

Generated: 2026-04-14 01:57:39 +05:30
Scope: Consolidated from all session-level changelog files created during setup, migration, fixes, and cleanup.

## 1) Platform Migration and Local Setup
- Migrated app from MySQL/Drizzle assumptions to MongoDB runtime usage.
- Updated env loading to support `.env.local` consistently.
- Added Windows-safe script behavior and local run stability.
- Atlas connection path configured and verified.

Primary files impacted:
- server/db.ts
- server/_core/env.ts
- server/_core/index.ts
- package.json
- .env.local

## 2) Auth and Local Routing Stability
- Fixed local redirect behavior that sent users to non-existent `/app-auth` route.
- Added development auth bypass behavior for local non-production usage.
- Prevented repeated auth noise in logs for missing cookie cases.

Primary files impacted:
- client/src/const.ts
- server/_core/context.ts
- server/_core/sdk.ts

## 3) Upload and Analysis Pipeline Reliability
- Removed hard dependency on external storage proxy for upload path.
- Implemented local PDF buffer extraction in upload flow.
- Fixed PDF parsing import/runtime behavior.
- Verified end-to-end upload -> analysis -> results flow.

Primary files impacted:
- server/api-handlers.ts
- server/pdf-extractor.ts
- package.json

## 4) Suggestions Persistence and UX
- Ensured suggestions and summary are persisted with `analysisId` linkage.
- Added suggestion retrieval endpoint by analysis id.
- Updated UI to keep controls visible and show saved DB entry count.
- Added fallback generation so suggestions still work when LLM API fails.
- Improved fallback quality to generate varied, role-aware ATS-style outputs.

Primary files impacted:
- server/routers.ts
- server/llm-suggestions.ts
- server/_core/llm.ts
- client/src/components/RewriteSuggestions.tsx
- client/src/pages/Results.tsx

## 5) Log Noise Reduction
- Updated `baseline-browser-mapping` package.
- Quieted dotenv startup tips by enabling `quiet: true` on all dotenv loads.
- Reduced noisy stack traces in fallback paths.

Primary files impacted:
- package.json
- server/_core/index.ts
- server/_core/env.ts
- drizzle.config.ts
- server/llm-suggestions.ts
- server/_core/sdk.ts

## 6) Database Verification Snapshot (Latest Confirmed)
- users: present
- resumes: persisted
- analyses: persisted
- rewriteSuggestions: persisted and increasing after generation

Verification method used:
- Direct MongoDB collection count and latest-document checks via Node one-liner scripts.

## 7) Cleanup Actions Performed
- Consolidated multiple same-day changelog files into this master log.
- Removed redundant same-day changelog files from workspace root.
- Removed generated local log folder and stale backup config file.

Cleanup targets:
- CHANGELOG_2026-04-14_upload-fix.md
- CHANGELOG_2026-04-14_db-persistence-assurance.md
- CHANGELOG_2026-04-14_suggestions-ui-and-db-check.md
- CHANGELOG_2026-04-14_suggestions-fallback-working.md
- CHANGELOG_2026-04-14_log-noise-reduction.md
- CHANGELOG_2026-04-14_dotenv-quiet-mode.md
- CHANGELOG_2026-04-14_fallback-quality-improvement.md
- .manus-logs/
- vite.config.ts.bak

## 8) Current Structure Recommendation
- Keep root focused on product docs and runtime config.
- Store operational logs/changelogs under `docs/changelog/`.
- Keep generated debug artifacts out of root.

Status: Workspace cleaned and consolidated without touching core feature behavior.
