# ATS Resume Analyzer - Complete Setup & Architecture Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Local Setup Instructions](#local-setup-instructions)
5. [Database Setup](#database-setup)
6. [Environment Configuration](#environment-configuration)
7. [Running the Application](#running-the-application)
8. [End-to-End Workflow](#end-to-end-workflow)
9. [API Endpoints](#api-endpoints)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

**ATS Resume Analyzer** is a full-stack web application that helps job seekers optimize their resumes for Applicant Tracking Systems (ATS). The system analyzes resumes against specific job roles and provides:

- **Real-time ATS Scoring** for Data Analyst Intern and Entry-Level Data Analyst positions
- **Keyword Analysis** showing matched vs. missing keywords
- **Resume Structure Validation** checking for required sections
- **AI-Powered Suggestions** for improving resume content
- **History Tracking** to monitor improvements over time

### Key Features
✅ PDF Resume Upload with drag-and-drop  
✅ Instant ATS scoring (0-100%)  
✅ Keyword matching for specific roles  
✅ LLM-powered rewrite suggestions  
✅ Resume history and past analyses  
✅ Download and share reports  
✅ User authentication (OAuth)  

---

## Architecture

### Technology Stack

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- shadcn/ui components
- tRPC for type-safe API calls
- Wouter for routing

**Backend:**
- Express.js server
- tRPC for RPC procedures
- Node.js runtime

**Database:**
- MySQL/TiDB
- Drizzle ORM for type-safe queries

**AI/LLM:**
- OpenAI API integration for text extraction and suggestions

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Landing     │  │   Upload     │  │   Results    │      │
│  │  Page        │  │   Page       │  │   Dashboard  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                   │              │
│         └─────────────────┼───────────────────┘              │
│                           │                                  │
│                    tRPC Client Calls                         │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Express Server │
                    │   (Node.js)     │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐      ┌──────▼──────┐    ┌──────▼──────┐
   │ tRPC    │      │ PDF Upload  │    │ LLM Service │
   │Procedures       │ Handler     │    │ (OpenAI)    │
   └────┬────┘      └──────┬──────┘    └──────┬──────┘
        │                  │                   │
        └──────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │   MySQL DB  │
                    │  (Drizzle)  │
                    └─────────────┘
```

### Data Flow

1. **User uploads resume** → PDF file sent to backend
2. **Backend processes PDF** → Extracts text using LLM
3. **ATS Analysis** → Scoring engine analyzes against job descriptions
4. **Results stored** → Analysis saved to database
5. **Frontend displays** → Results shown with visualizations
6. **LLM suggestions** → AI generates improvement recommendations
7. **History tracked** → All analyses saved for user

---

## Prerequisites

### Required Software
- **Node.js** v18+ (download from https://nodejs.org/)
- **pnpm** v10+ (package manager)
  ```bash
  npm install -g pnpm
  ```
- **MySQL** v8+ or **TiDB** (database)
- **Git** (for version control)
- **VS Code** (recommended IDE)

### Required Accounts
- **OpenAI API Key** (for LLM features)
  - Sign up at https://platform.openai.com/
  - Get API key from https://platform.openai.com/account/api-keys

### System Requirements
- RAM: 4GB minimum (8GB recommended)
- Disk Space: 2GB
- OS: Windows, macOS, or Linux

---

## Local Setup Instructions

### Step 1: Clone/Extract Project

```bash
# If you have the ZIP file, extract it
unzip resume-optimizer-ats.zip
cd resume-optimizer-ats

# Or clone from Git (if available)
git clone <repository-url>
cd resume-optimizer-ats
```

### Step 2: Install Dependencies

```bash
# Install all dependencies using pnpm
pnpm install

# This will install:
# - Frontend dependencies (React, Tailwind, etc.)
# - Backend dependencies (Express, tRPC, etc.)
# - Development tools (TypeScript, Vitest, etc.)
```

### Step 3: Install MySQL Locally (if not already installed)

**Windows:**
```bash
# Using Chocolatey
choco install mysql

# Or download from https://dev.mysql.com/downloads/mysql/
```

**macOS:**
```bash
# Using Homebrew
brew install mysql

# Start MySQL service
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install mysql-server

# Start MySQL service
sudo systemctl start mysql
```

### Step 4: Create Database

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE resume_optimizer_ats;

# Create user (optional, for security)
CREATE USER 'ats_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON resume_optimizer_ats.* TO 'ats_user'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
exit
```

---

## Database Setup

### Database Schema

The application uses the following tables:

#### 1. **users** Table
Stores user information and authentication data.

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. **resumes** Table
Stores uploaded resume information.

```sql
CREATE TABLE resumes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  fileName VARCHAR(255) NOT NULL,
  fileKey VARCHAR(255),
  fileUrl TEXT,
  rawText LONGTEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 3. **analyses** Table
Stores ATS analysis results.

```sql
CREATE TABLE analyses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resumeId INT NOT NULL,
  userId INT NOT NULL,
  internScore INT,
  jobScore INT,
  matchedKeywordsIntern LONGTEXT,
  missingKeywordsIntern LONGTEXT,
  matchedKeywordsJob LONGTEXT,
  missingKeywordsJob LONGTEXT,
  structureValidation LONGTEXT,
  recommendations LONGTEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (resumeId) REFERENCES resumes(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 4. **rewriteSuggestions** Table
Stores LLM-generated suggestions.

```sql
CREATE TABLE rewriteSuggestions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysisId INT NOT NULL,
  summaryRewrite LONGTEXT,
  bulletSuggestions LONGTEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysisId) REFERENCES analyses(id) ON DELETE CASCADE
);
```

### Apply Database Migrations

```bash
# Generate migrations from schema
pnpm drizzle-kit generate

# Apply migrations to database
pnpm drizzle-kit migrate
```

---

## Environment Configuration

### Create .env.local File

Create a `.env.local` file in the project root with the following variables:

```env
# Database Configuration
DATABASE_URL=mysql://ats_user:your_password@localhost:3306/resume_optimizer_ats

# OpenAI API (for LLM features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# OAuth Configuration (for local development)
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# JWT Secret (for session management)
JWT_SECRET=your-secret-key-min-32-characters-long

# Application Settings
NODE_ENV=development
VITE_APP_TITLE=ATS Resume Analyzer
VITE_APP_LOGO=https://your-logo-url.png

# Owner Information
OWNER_NAME=Your Name
OWNER_OPEN_ID=your_open_id
```

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@localhost:3306/db` |
| `OPENAI_API_KEY` | OpenAI API key for LLM | `sk-...` |
| `JWT_SECRET` | Session encryption key | `your-secret-key` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `VITE_APP_TITLE` | Application title | `ATS Resume Analyzer` |

---

## Running the Application

### Development Mode

```bash
# Terminal 1: Start the backend server
pnpm dev

# This starts:
# - Express server on http://localhost:3000
# - Vite dev server for hot reloading
# - tRPC API at http://localhost:3000/api/trpc
```

### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

### Build for Production

```bash
# Build frontend and backend
pnpm build

# Start production server
pnpm start
```

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test server/ats-engine.test.ts
```

### Code Quality Checks

```bash
# Type check
pnpm check

# Format code
pnpm format

# Lint code
pnpm lint
```

---

## End-to-End Workflow

### Complete User Journey

#### 1. **User Authentication**
```
User visits http://localhost:3000
  ↓
Clicks "Login" button
  ↓
Redirected to OAuth provider
  ↓
User logs in with credentials
  ↓
Redirected back to application
  ↓
Session created (JWT cookie)
  ↓
User authenticated and ready to use
```

#### 2. **Resume Upload & Analysis**
```
User navigates to /upload
  ↓
Selects PDF file (drag-and-drop or file picker)
  ↓
Frontend validates file (PDF format, size < 10MB)
  ↓
File uploaded to backend via /api/upload
  ↓
Backend extracts text from PDF using LLM
  ↓
Resume saved to database (resumes table)
  ↓
ATS analysis triggered via /api/analyze
  ↓
Scoring engine processes resume:
  - Extracts keywords
  - Calculates scores (0-100)
  - Validates structure
  - Generates recommendations
  ↓
Analysis results saved to database (analyses table)
  ↓
Frontend redirected to /results/{resumeId}
```

#### 3. **Results Display**
```
Results page loads
  ↓
Fetches analysis data from database
  ↓
Displays visualizations:
  - ATS scores (circular gauges)
  - Matched keywords (green tags)
  - Missing keywords (red tags)
  - Structure validation (checkmarks)
  - Recommendations (categorized tips)
  ↓
User can:
  - Download report as PDF
  - Share results
  - View LLM suggestions
  - Access history
```

#### 4. **LLM Suggestions**
```
User clicks "Generate Suggestions"
  ↓
Frontend sends resume text to backend
  ↓
Backend calls OpenAI API with prompt
  ↓
LLM generates:
  - Rewritten professional summary
  - Improved bullet points
  - Explanations of changes
  ↓
Results displayed in UI
  ↓
User can copy suggestions to clipboard
```

#### 5. **History & Tracking**
```
User navigates to /dashboard
  ↓
Fetches all user's past analyses
  ↓
Displays list of uploaded resumes with:
  - Upload date
  - ATS scores
  - Quick stats
  ↓
User can:
  - Click to view past analysis
  - Compare multiple analyses
  - Delete old submissions
```

---

## API Endpoints

### File Upload Endpoints

#### POST /api/upload
Uploads and extracts text from PDF resume.

**Request:**
```
Content-Type: multipart/form-data
Body: { file: <PDF file> }
```

**Response:**
```json
{
  "fileKey": "resumes/user-123/resume.pdf",
  "fileUrl": "https://s3.example.com/resumes/user-123/resume.pdf",
  "rawText": "John Doe\nData Analyst\n..."
}
```

#### POST /api/analyze
Analyzes resume and generates ATS scores.

**Request:**
```json
{
  "resumeText": "John Doe\nData Analyst\n..."
}
```

**Response:**
```json
{
  "internScore": 85,
  "jobScore": 72,
  "matchedKeywordsIntern": ["Python", "SQL", "Excel"],
  "missingKeywordsIntern": ["Tableau", "Power BI"],
  "matchedKeywordsJob": ["Python", "SQL"],
  "missingKeywordsJob": ["Tableau", "Power BI", "Spark"],
  "structureValidation": {
    "hasSummary": true,
    "hasSkills": true,
    "hasExperience": true,
    "hasProjects": false,
    "hasEducation": true,
    "hasCertifications": false,
    "missingSection": ["Projects", "Certifications"]
  },
  "recommendations": {
    "keywordOptimization": [...],
    "formatting": [...],
    "quantification": [...]
  }
}
```

### tRPC Procedures

#### resume.upload
Saves resume to database.

```typescript
// Input
{
  fileName: "resume.pdf",
  fileKey: "resumes/user-123/resume.pdf",
  fileUrl: "https://s3.example.com/...",
  rawText: "John Doe..."
}

// Output
{
  id: 1,
  userId: 1,
  fileName: "resume.pdf",
  fileKey: "resumes/user-123/resume.pdf",
  fileUrl: "https://s3.example.com/...",
  rawText: "John Doe...",
  createdAt: "2026-04-13T19:00:00Z"
}
```

#### analysis.create
Saves analysis results to database.

```typescript
// Input
{
  resumeId: 1,
  internScore: 85,
  jobScore: 72,
  matchedKeywordsIntern: [...],
  missingKeywordsIntern: [...],
  matchedKeywordsJob: [...],
  missingKeywordsJob: [...],
  structureValidation: {...},
  recommendations: {...}
}

// Output
{
  id: 1,
  resumeId: 1,
  userId: 1,
  internScore: 85,
  jobScore: 72,
  ...
}
```

#### suggestions.generate
Generates LLM-powered rewrite suggestions.

```typescript
// Input
{
  resumeText: "John Doe...",
  targetRole: "intern" | "job"
}

// Output
{
  summaryRewrite: "Rewritten professional summary...",
  bulletSuggestions: [
    {
      original: "Original bullet point",
      suggested: "Improved bullet point",
      improvement: "Added quantifiable metric"
    }
  ]
}
```

---

## Project Structure

```
resume-optimizer-ats/
├── client/                          # Frontend (React)
│   ├── public/                      # Static files
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── RewriteSuggestions.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── ...
│   │   ├── pages/                   # Page components
│   │   │   ├── Home.tsx             # Landing page
│   │   │   ├── Upload.tsx           # Resume upload
│   │   │   ├── Results.tsx          # Analysis results
│   │   │   ├── Dashboard.tsx        # History/tracking
│   │   │   └── ...
│   │   ├── lib/
│   │   │   └── trpc.ts              # tRPC client setup
│   │   ├── App.tsx                  # Main app component
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Global styles
│   ├── index.html                   # HTML template
│   └── vite.config.ts               # Vite configuration
│
├── server/                          # Backend (Express)
│   ├── _core/                       # Core infrastructure
│   │   ├── index.ts                 # Express server setup
│   │   ├── context.ts               # tRPC context
│   │   ├── trpc.ts                  # tRPC setup
│   │   ├── oauth.ts                 # OAuth handling
│   │   ├── llm.ts                   # LLM integration
│   │   ├── env.ts                   # Environment variables
│   │   └── ...
│   ├── routers.ts                   # tRPC procedures
│   ├── db.ts                        # Database queries
│   ├── ats-engine.ts                # ATS scoring logic
│   ├── pdf-extractor.ts             # PDF text extraction
│   ├── llm-suggestions.ts           # LLM suggestions
│   ├── api-handlers.ts              # API route handlers
│   ├── ats-engine.test.ts           # Tests
│   └── ...
│
├── drizzle/                         # Database
│   ├── schema.ts                    # Table definitions
│   └── migrations/                  # Migration files
│
├── shared/                          # Shared code
│   ├── const.ts                     # Constants
│   └── types.ts                     # Shared types
│
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── vite.config.ts                   # Vite config
├── .env.local                       # Environment variables (create this)
├── SETUP_GUIDE.md                   # This file
├── README.md                        # Project overview
└── todo.md                          # Feature tracking
```

---

## Key Files Explained

### Frontend Entry Point
**File:** `client/src/main.tsx`
- Initializes React application
- Sets up tRPC client
- Configures authentication
- Mounts app to DOM

### Backend Entry Point
**File:** `server/_core/index.ts`
- Creates Express server
- Configures middleware
- Sets up tRPC API routes
- Handles file uploads
- Starts server on port 3000

### ATS Scoring Engine
**File:** `server/ats-engine.ts`
- Implements scoring algorithm
- Matches keywords against job descriptions
- Validates resume structure
- Generates recommendations

### Database Queries
**File:** `server/db.ts`
- CRUD operations for all tables
- User management
- Resume storage
- Analysis persistence

### LLM Integration
**File:** `server/llm-suggestions.ts`
- Calls OpenAI API
- Generates rewrite suggestions
- Creates improvement summaries

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution:**
```bash
# Check if MySQL is running
mysql -u root -p

# If not running, start it:
# macOS: brew services start mysql
# Linux: sudo systemctl start mysql
# Windows: net start MySQL80
```

#### 2. OpenAI API Key Error
```
Error: 401 Unauthorized - Invalid API Key
```

**Solution:**
- Verify API key in `.env.local`
- Check key is valid at https://platform.openai.com/account/api-keys
- Ensure key has sufficient credits

#### 3. Port 3000 Already in Use
```
Error: listen EADDRINUSE :::3000
```

**Solution:**
```bash
# Kill process on port 3000
# macOS/Linux: lsof -ti:3000 | xargs kill -9
# Windows: netstat -ano | findstr :3000
#         taskkill /PID <PID> /F

# Or use different port
PORT=3001 pnpm dev
```

#### 4. Module Not Found Error
```
Error: Cannot find module 'multer'
```

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 5. TypeScript Compilation Error
```
error TS2304: Cannot find name 'desc'
```

**Solution:**
```bash
# Check imports in db.ts
# Ensure: import { eq, desc } from "drizzle-orm"

# Rebuild
pnpm check
```

#### 6. PDF Upload Fails
```
Error: File upload failed
```

**Solution:**
- Check file size (max 10MB)
- Verify file is valid PDF
- Check `/api/upload` endpoint is working
- Check server logs for details

#### 7. LLM Suggestions Not Generating
```
Error: Failed to generate suggestions
```

**Solution:**
- Verify OpenAI API key is set
- Check API key has sufficient credits
- Verify resume text is not empty
- Check network connectivity

---

## Performance Tips

### Optimization Best Practices

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_user_id ON resumes(userId);
   CREATE INDEX idx_resume_id ON analyses(resumeId);
   ```

2. **Caching**
   - Cache ATS scoring results
   - Cache keyword databases
   - Cache LLM suggestions

3. **Pagination**
   - Limit history results to 10 per page
   - Implement lazy loading for large datasets

4. **API Rate Limiting**
   - Limit file uploads to 5 per minute per user
   - Limit LLM suggestions to 3 per minute per user

---

## Security Considerations

### Important Security Measures

1. **Environment Variables**
   - Never commit `.env.local` to Git
   - Use `.env.example` as template
   - Rotate API keys regularly

2. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Restrict database access to localhost

3. **File Upload Security**
   - Validate file type (PDF only)
   - Limit file size (10MB max)
   - Scan for malware
   - Store files securely

4. **Authentication**
   - Use OAuth for user authentication
   - Implement JWT token refresh
   - Set secure cookie flags

5. **API Security**
   - Validate all inputs
   - Use HTTPS in production
   - Implement rate limiting
   - Add CORS protection

---

## Deployment Guide

### Deploy to Production

#### Option 1: Deploy to Manus Platform
```bash
# Build project
pnpm build

# Deploy (if using Manus)
# Follow platform-specific instructions
```

#### Option 2: Deploy to Railway/Render
```bash
# Create account on Railway or Render
# Connect GitHub repository
# Set environment variables
# Deploy automatically on push
```

#### Option 3: Deploy to Your Own Server
```bash
# Build project
pnpm build

# Transfer files to server
scp -r dist/ user@server:/app/

# Install dependencies on server
npm install --production

# Start server
NODE_ENV=production node dist/index.js
```

---

## Support & Resources

### Helpful Links
- **Node.js Documentation:** https://nodejs.org/docs/
- **React Documentation:** https://react.dev/
- **Express Documentation:** https://expressjs.com/
- **Drizzle ORM:** https://orm.drizzle.team/
- **tRPC Documentation:** https://trpc.io/
- **Tailwind CSS:** https://tailwindcss.com/
- **OpenAI API:** https://platform.openai.com/docs/

### Getting Help
1. Check troubleshooting section above
2. Review error messages carefully
3. Check server logs: `tail -f .manus-logs/devserver.log`
4. Check browser console for client errors
5. Run tests: `pnpm test`

---

## Next Steps

1. ✅ Complete local setup
2. ✅ Test resume upload functionality
3. ✅ Verify ATS scoring works
4. ✅ Test LLM suggestions
5. ✅ Run full test suite
6. ✅ Deploy to production
7. ✅ Monitor performance

---

**Last Updated:** April 13, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
