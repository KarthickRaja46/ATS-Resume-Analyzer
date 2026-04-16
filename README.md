# ATS Resume Analyzer

<div align="center">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg">
  <img alt="React" src="https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB">
  <img alt="TypeScript" src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white">
  <img alt="Node.js" src="https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white">
  <img alt="Express.js" src="https://img.shields.io/badge/express.js-%23404d59.svg?style=flat&logo=express&logoColor=%2361DAFB">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white">
  <img alt="TailwindCSS" src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white">
</div>
<br>

**🌐 Live Application:** [https://ats-resume-analyzer-i3kr.onrender.com](https://ats-resume-analyzer-i3kr.onrender.com)

Production-ready full-stack application to analyze resumes for ATS compatibility, score them against multiple role profiles, and generate rewrite suggestions.

## 🚀 One-Command Local Run

Make sure you have Node \>= 18 installed, and your `.env.local` is set up. Then simply run:

```bash
npx pnpm install && npx pnpm run dev
```

## 📸 Screenshots

| Dashboard & Upload | Analysis & Scoring |
| :---: | :---: |
| <img src="docs/assets/upload.png" alt="Upload Interface" width="400"/> | <img src="docs/assets/analysis.png" alt="Analysis Results" width="400"/> |
| *Intuitive resume upload and ATS parsing* | *Comprehensive ATS scoring and keyword tracking* |


## Overview

ATS Resume Analyzer helps users:
- Upload PDF resumes
- Extract resume text
- Compute ATS scores for:
  - Data Analyst Intern
  - Entry-Level Data Analyst
- Compare resumes across multiple roles and custom job descriptions
- Identify matched and missing keywords
- Validate resume structure
- Save analysis history
- Generate rewrite suggestions (LLM + resilient fallback)
- Use a built-in tools hub for exports, templates, benchmarking, and cover letters

## Architecture At a Glance

```text
Client (React + TypeScript + tRPC)
  ->
Express Server (REST + tRPC)
  ->
Business Layer
  - ATS scoring engine
  - PDF extraction
  - Suggestion generator
  ->
Supabase (PostgreSQL - users, resumes, analyses, rewriteSuggestions, roleDefinitions, etc.)
```

Detailed architecture docs:
- [docs/system-overview/ARCHITECTURE.md](docs/system-overview/ARCHITECTURE.md)
- [docs/system-overview/SUPABASE_SETUP.md](docs/system-overview/SUPABASE_SETUP.md)

## End-to-End Flow

1. User uploads PDF on Upload page.
2. `POST /api/upload` validates and extracts text from PDF.
3. Resume is persisted through `resume.upload` tRPC procedure.
4. `POST /api/analyze` computes ATS scoring and recommendations.
5. Analysis is persisted through `analysis.create`.
6. Results page loads data by `resumeId`.
7. Suggestion generation writes records to `rewriteSuggestions`.
8. Optional tools hub routes surface templates, export, benchmarking, and cover letter generation.

## 🛠️ Tech Stack

| Category | Technologies |
|:---|:---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Wouter, tRPC Client, React Query |
| **Backend** | Node.js, Express, tRPC Server, Zod (Validation), Multer (Uploads), pdf-parse |
| **Database** | Supabase (PostgreSQL), Supabase-js Client |
| **AI Layer** | OpenAI chat completion path, highly resilient fallback suggestion generator |
| **Quality**  | Vitest, TypeScript Strict Mode |

## 📂 Repository Structure

```text
.
├── 📱 client/                      # React frontend (Vite, Tailwind, shadcn/ui)
├── ⚙️ server/                      # Express + tRPC server & business logic
├── 🔗 shared/                      # Shared data types & validation schemas
├── 📚 docs/                        # Thorough project documentation
│   ├── 🖼️ assets/                  # UI images and screenshots
│   ├── 🚀 startup/                 # Setup & configuration guides
│   ├── 🏗️ system-overview/         # Architecture & database design
│   ├── 📖 reference/               # API reference & docs index
│   └── 🕒 changelog/               # Consolidated change history
├── 🗄️ supabase/                     # Supabase schema SQL and migrations
├── 📜 package.json                 # Monorepo and dependency configurations
└── 📄 README.md                    # Main project overview (You are here!)
```

## Prerequisites

- pnpm 10+
- Supabase account and project
- OpenAI API key (optional but recommended)

## Quick Start

### 1) Install dependencies

```bash
pnpm install
```

If `pnpm` is not on PATH in your shell, use:

```bash
npx pnpm install
```

### 2) Create environment file

Create `.env.local` in project root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-...
JWT_SECRET=replace-with-min-32-char-secret
NODE_ENV=development
VITE_APP_TITLE=ATS Resume Analyzer

# Local/dev auth and oauth-related settings
VITE_OAUTH_PORTAL_URL=http://localhost:3001
VITE_APP_ID=local-dev-app
OAUTH_SERVER_URL=http://localhost:3001
DEV_BYPASS_AUTH=true

# Optional
OPENAI_MODEL=gpt-4o-mini
VITE_ANALYTICS_ENDPOINT=http://localhost:8080/api/send
VITE_ANALYTICS_WEBSITE_ID=local-dev
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
```

### 3) Start development server

```bash
pnpm dev
```

or

```bash
npx pnpm dev
```

### 4) Open app

Navigate to URL shown in terminal (usually `http://localhost:3000`, next free port otherwise).

## NPM Scripts

```bash
pnpm dev      # run development server
pnpm build    # production build
pnpm start    # run production server
pnpm check    # type-check
pnpm test     # run tests
pnpm format   # format codebase
```

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role secret |
| `JWT_SECRET` | Yes | Session/JWT signing secret |
| `NODE_ENV` | Yes | Runtime mode (`development`/`production`) |
| `OPENAI_API_KEY` | Recommended | LLM suggestions and summary |
| `OPENAI_MODEL` | Optional | Model override (default `gpt-4o-mini`) |
| `VITE_APP_TITLE` | Optional | Frontend title |
| `VITE_OAUTH_PORTAL_URL` | Dev | Frontend login URL base |
| `VITE_APP_ID` | Dev | Frontend app identifier |
| `OAUTH_SERVER_URL` | Dev/Prod | OAuth service base URL |
| `DEV_BYPASS_AUTH` | Dev | Enables local auth bypass when true |
| `VITE_ANALYTICS_ENDPOINT` | Optional | Analytics endpoint |
| `VITE_ANALYTICS_WEBSITE_ID` | Optional | Analytics site id |
| `BUILT_IN_FORGE_API_URL` | Optional | Forge endpoint override |
| `BUILT_IN_FORGE_API_KEY` | Optional | Forge key override |

## API Summary

### REST
- `POST /api/upload` - Upload PDF + extract text
- `POST /api/analyze` - Run ATS analysis for raw text

### tRPC
- `auth.me`
- `auth.logout`
- `resume.upload`
- `resume.getHistory`
- `resume.getById`
- `analysis.create`
- `analysis.getByResumeId`
- `suggestions.generate`
- `suggestions.summary`
- `suggestions.byAnalysisId`
- `multiRole.analyze`
- `multiRole.analyzeCustomRole`
- `export.resume`
- `export.analysisReport`
- `export.bulkExport`
- `coverLetter.generate`
- `coverLetter.calculateScore`
- `benchmark.calculatePercentile`
- `benchmark.compareRoles`
- `benchmark.generateReport`
- `templates.getAll`
- `templates.getByRole`
- `templates.getByIndustry`
- `templates.getRecommendations`
- `templates.applyTemplate`
- `util.getJobRoles`

Full API documentation:
- [docs/reference/API_REFERENCE.md](docs/reference/API_REFERENCE.md)

## Data Model (Supabase Tables)

- `users`
- `resumes`
- `analyses`
- `rewriteSuggestions`
- `roleDefinitions`
- `resumeTemplates`
- `jobDescriptions`
- `customKeywords`
- `coverLetters`
- `scoreBenchmarks`
- `collaborations`
- `searchSavedFilters`
- `userPreferences`

## New Routes

- `/tools` - central tools hub
- `/templates` - template library shortcut
- `/benchmark` - benchmarking shortcut
- `/cover-letter` - cover letter shortcut
- `/tools/:section` - direct jump to a specific tool section

Behavior highlights:
- Resume and analysis are always persisted.
- Suggestion rows are persisted per `analysisId`.
- If LLM call fails, fallback generator still returns and persists suggestions.

## Auth Behavior

- Production-style auth path uses OAuth/session cookie validation.
- Local development can use `DEV_BYPASS_AUTH=true` to keep workflow unblocked.

## Troubleshooting

### Suggestion API returns quota errors
- If OpenAI quota is exceeded, fallback mode is used automatically.
- Suggestions should still render and be saved in DB.

### Upload fails
- Ensure uploaded file is a valid PDF and size <= 10MB.
- Check server logs for parser errors.

### Supabase connection issues
- Verify Project URL and Service Role Key in `.env.local`.
- Ensure your database schema is pushed using the scripts in `supabase/schema.sql`.

### pnpm or node not found
- Restart terminal after install.
- Use `npx pnpm <command>` as fallback.

## Documentation Map

- Startup:
  - [docs/startup/QUICKSTART.md](docs/startup/QUICKSTART.md)
  - [docs/startup/SETUP_GUIDE.md](docs/startup/SETUP_GUIDE.md)
  - [docs/startup/MONGODB_ATLAS_SETUP.md](docs/startup/MONGODB_ATLAS_SETUP.md)
- System overview:
  - [docs/system-overview/ARCHITECTURE.md](docs/system-overview/ARCHITECTURE.md)
  - [docs/system-overview/MONGODB_MIGRATION.md](docs/system-overview/MONGODB_MIGRATION.md)
- Reference:
  - [docs/reference/API_REFERENCE.md](docs/reference/API_REFERENCE.md)
  - [docs/reference/DOCUMENTATION_INDEX.md](docs/reference/DOCUMENTATION_INDEX.md)
- Changes:
  - [docs/changelog/CHANGELOG_2026-04-14_MASTER.md](docs/changelog/CHANGELOG_2026-04-14_MASTER.md)

## Security Notes

- Never commit `.env.local`.
- Rotate OpenAI and Mongo credentials if exposed.
- Use strong JWT secret in all environments.

## License

MIT
