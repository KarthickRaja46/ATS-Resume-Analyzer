# ATS Resume Analyzer - Architecture & System Design

## System Architecture Overview

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (React)                      │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  Landing Page  │  │  Upload Page   │  │ Results Page   │    │
│  │  (Home.tsx)    │  │  (Upload.tsx)  │  │ (Results.tsx)  │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐                         │
│  │ Dashboard Page │  │ Rewrite Suggest│                         │
│  │(Dashboard.tsx)│  │(RewriteSugg.tsx)                         │
│  └────────────────┘  └────────────────┘                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           tRPC Client (Type-Safe API Calls)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              │
┌──────────────────────────────────────────────────────────────────┐
│                      SERVER LAYER (Express)                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Express Middleware Stack                    │  │
│  │  - Body Parser (JSON, URL-encoded, 50MB limit)          │  │
│  │  - Multer (File Upload Handler)                         │  │
│  │  - CORS (Cross-Origin Resource Sharing)                 │  │
│  │  - Session/Cookie Management                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API Routes & Handlers                       │  │
│  │  - POST /api/upload (File Upload Handler)               │  │
│  │  - POST /api/analyze (ATS Analysis Handler)             │  │
│  │  - POST /api/oauth/callback (OAuth Handler)             │  │
│  │  - /api/trpc/* (tRPC Procedures)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           tRPC Router (Type-Safe Procedures)            │  │
│  │  - resume.upload (Save resume to DB)                    │  │
│  │  - analysis.create (Save analysis to DB)                │  │
│  │  - suggestions.generate (LLM suggestions)               │  │
│  │  - history.list (Get user's past analyses)              │  │
│  │  - auth.me (Get current user)                           │  │
│  │  - auth.logout (Clear session)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Business Logic Layer                            │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ ATS Engine (ats-engine.ts)                       │   │  │
│  │  │ - Keyword matching algorithm                     │   │  │
│  │  │ - Score calculation (0-100%)                     │   │  │
│  │  │ - Structure validation                           │   │  │
│  │  │ - Recommendation generation                      │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                                                          │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ PDF Extractor (pdf-extractor.ts)                │   │  │
│  │  │ - PDF text extraction using LLM                 │   │  │
│  │  │ - Text cleaning and normalization               │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                                                          │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ LLM Suggestions (llm-suggestions.ts)            │   │  │
│  │  │ - OpenAI API integration                         │   │  │
│  │  │ - Prompt engineering                            │   │  │
│  │  │ - Response parsing                              │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Data Access Layer (Drizzle ORM)                │  │
│  │  - Query builders                                       │  │
│  │  - Type-safe database operations                        │  │
│  │  - Connection pooling                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ SQL Queries
                              │
┌──────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (MySQL)                        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ users table  │  │ resumes table │  │ analyses tbl │          │
│  │              │  │              │  │              │          │
│  │ - id (PK)    │  │ - id (PK)    │  │ - id (PK)    │          │
│  │ - openId     │  │ - userId (FK)│  │ - resumeId   │          │
│  │ - name       │  │ - fileName   │  │ - userId (FK)│          │
│  │ - email      │  │ - fileKey    │  │ - internScore│          │
│  │ - role       │  │ - fileUrl    │  │ - jobScore   │          │
│  │ - createdAt  │  │ - rawText    │  │ - keywords   │          │
│  │ - updatedAt  │  │ - createdAt  │  │ - structure  │          │
│  │              │  │              │  │ - recommend  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ rewriteSuggestions table                                │  │
│  │ - id (PK)                                              │  │
│  │ - analysisId (FK)                                      │  │
│  │ - summaryRewrite                                       │  │
│  │ - bulletSuggestions                                    │  │
│  │ - createdAt                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ External API Calls
                              │
┌──────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────────────┐    │
│  │   OpenAI API         │  │   OAuth Provider             │    │
│  │   - Text extraction  │  │   - User authentication      │    │
│  │   - LLM suggestions  │  │   - Session management       │    │
│  └──────────────────────┘  └──────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Resume Upload & Analysis Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Selects PDF file
       ▼
┌──────────────────────┐
│ Upload Component     │
│ (Upload.tsx)         │
└──────┬───────────────┘
       │ 2. Validates file
       │    (PDF, < 10MB)
       ▼
┌──────────────────────┐
│ FormData with file   │
└──────┬───────────────┘
       │ 3. POST /api/upload
       ▼
┌──────────────────────┐
│ handleFileUpload()   │
│ (api-handlers.ts)    │
└──────┬───────────────┘
       │ 4. Extract PDF text
       │    using LLM
       ▼
┌──────────────────────┐
│ PDF Extractor        │
│ (pdf-extractor.ts)   │
└──────┬───────────────┘
       │ 5. Return rawText
       ▼
┌──────────────────────┐
│ Upload Response      │
│ {fileKey, fileUrl,   │
│  rawText}            │
└──────┬───────────────┘
       │ 6. tRPC mutation:
       │    resume.upload()
       ▼
┌──────────────────────┐
│ createResume()       │
│ (db.ts)              │
└──────┬───────────────┘
       │ 7. INSERT into
       │    resumes table
       ▼
┌──────────────────────┐
│ Resume saved with ID │
└──────┬───────────────┘
       │ 8. POST /api/analyze
       │    with resumeText
       ▼
┌──────────────────────┐
│ handleAnalysis()     │
│ (api-handlers.ts)    │
└──────┬───────────────┘
       │ 9. Call ATS Engine
       ▼
┌──────────────────────┐
│ analyzeResume()      │
│ (ats-engine.ts)      │
│ - Extract keywords   │
│ - Calculate scores   │
│ - Validate structure │
│ - Generate tips      │
└──────┬───────────────┘
       │ 10. Return analysis
       │     results
       ▼
┌──────────────────────┐
│ Analysis Response    │
│ {internScore,        │
│  jobScore,           │
│  keywords,           │
│  structure,          │
│  recommendations}    │
└──────┬───────────────┘
       │ 11. tRPC mutation:
       │     analysis.create()
       ▼
┌──────────────────────┐
│ createAnalysis()     │
│ (db.ts)              │
└──────┬───────────────┘
       │ 12. INSERT into
       │     analyses table
       ▼
┌──────────────────────┐
│ Analysis saved       │
└──────┬───────────────┘
       │ 13. Redirect to
       │     /results/{id}
       ▼
┌──────────────────────┐
│ Results Page         │
│ (Results.tsx)        │
│ - Display scores     │
│ - Show keywords      │
│ - List tips          │
└──────────────────────┘
```

### 2. LLM Suggestions Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ Clicks "Generate Suggestions"
       ▼
┌──────────────────────────┐
│ RewriteSuggestions       │
│ Component                │
└──────┬───────────────────┘
       │ tRPC mutation:
       │ suggestions.generate()
       ▼
┌──────────────────────────┐
│ generateSuggestions()    │
│ (llm-suggestions.ts)     │
└──────┬───────────────────┘
       │ Create prompt with:
       │ - Resume text
       │ - Target role
       │ - Job description
       ▼
┌──────────────────────────┐
│ invokeLLM()              │
│ (server/_core/llm.ts)    │
└──────┬───────────────────┘
       │ Call OpenAI API
       │ gpt-4-turbo model
       ▼
┌──────────────────────────┐
│ OpenAI API               │
│ - Process prompt         │
│ - Generate suggestions   │
│ - Return response        │
└──────┬───────────────────┘
       │ Parse response
       ▼
┌──────────────────────────┐
│ Format suggestions:      │
│ - Summary rewrite        │
│ - Bullet improvements    │
│ - Explanations           │
└──────┬───────────────────┘
       │ Return to frontend
       ▼
┌──────────────────────────┐
│ Display suggestions      │
│ - Show original          │
│ - Show suggested         │
│ - Show explanation       │
│ - Copy button            │
└──────────────────────────┘
```

### 3. User History Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ Navigates to /dashboard
       ▼
┌──────────────────────────┐
│ Dashboard Component      │
│ (Dashboard.tsx)          │
└──────┬───────────────────┘
       │ tRPC query:
       │ history.list()
       ▼
┌──────────────────────────┐
│ getResumesByUserId()     │
│ (db.ts)                  │
└──────┬───────────────────┘
       │ SELECT * FROM resumes
       │ WHERE userId = ?
       ▼
┌──────────────────────────┐
│ Fetch analyses for each  │
│ resume                   │
└──────┬───────────────────┘
       │ SELECT * FROM analyses
       │ WHERE resumeId = ?
       ▼
┌──────────────────────────┐
│ Return combined data:    │
│ - Resume list            │
│ - Associated analyses    │
│ - Scores & stats         │
└──────┬───────────────────┘
       │ Display in UI
       ▼
┌──────────────────────────┐
│ History List             │
│ - Upload dates           │
│ - Scores                 │
│ - View/Delete actions    │
└──────────────────────────┘
```

---

## Component Architecture

### Frontend Components

#### Page Components
- **Home.tsx** - Landing page with hero section and CTA
- **Upload.tsx** - Resume upload with drag-and-drop
- **Results.tsx** - Analysis results display
- **Dashboard.tsx** - User history and past analyses

#### UI Components
- **RewriteSuggestions.tsx** - LLM suggestion display
- **DashboardLayout.tsx** - Sidebar navigation
- **ErrorBoundary.tsx** - Error handling wrapper

#### Hooks
- **useAuth()** - Authentication state management
- **useLocation()** - Route navigation
- **useTheme()** - Theme switching

### Backend Modules

#### Core Infrastructure
- **server/_core/index.ts** - Express server setup
- **server/_core/context.ts** - tRPC context creation
- **server/_core/trpc.ts** - tRPC configuration
- **server/_core/oauth.ts** - OAuth handling
- **server/_core/llm.ts** - LLM integration
- **server/_core/env.ts** - Environment variables

#### Business Logic
- **server/routers.ts** - tRPC procedure definitions
- **server/db.ts** - Database query helpers
- **server/ats-engine.ts** - ATS scoring algorithm
- **server/pdf-extractor.ts** - PDF text extraction
- **server/llm-suggestions.ts** - LLM suggestion generation
- **server/api-handlers.ts** - REST API handlers

#### Testing
- **server/ats-engine.test.ts** - ATS engine tests
- **server/auth.logout.test.ts** - Auth tests

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────┐
│      users          │
├─────────────────────┤
│ id (PK)             │
│ openId (UNIQUE)     │
│ name                │
│ email               │
│ loginMethod         │
│ role                │
│ createdAt           │
│ updatedAt           │
│ lastSignedIn        │
└──────────┬──────────┘
           │ 1:N
           │
    ┌──────▼──────────────────┐
    │    resumes              │
    ├─────────────────────────┤
    │ id (PK)                 │
    │ userId (FK) ────────────┼──► users
    │ fileName                │
    │ fileKey                 │
    │ fileUrl                 │
    │ rawText                 │
    │ createdAt               │
    │ updatedAt               │
    └──────┬────────┬─────────┘
           │        │ 1:N
           │        │
    ┌──────▼────────▼──────────────┐
    │    analyses                  │
    ├──────────────────────────────┤
    │ id (PK)                      │
    │ resumeId (FK) ──────────────►│ resumes
    │ userId (FK) ────────────────►│ users
    │ internScore                  │
    │ jobScore                     │
    │ matchedKeywordsIntern        │
    │ missingKeywordsIntern        │
    │ matchedKeywordsJob           │
    │ missingKeywordsJob           │
    │ structureValidation          │
    │ recommendations              │
    │ createdAt                    │
    │ updatedAt                    │
    └──────┬──────────────────────┘
           │ 1:N
           │
    ┌──────▼──────────────────────┐
    │ rewriteSuggestions           │
    ├──────────────────────────────┤
    │ id (PK)                      │
    │ analysisId (FK) ────────────►│ analyses
    │ summaryRewrite               │
    │ bulletSuggestions            │
    │ createdAt                    │
    └──────────────────────────────┘
```

### Table Relationships
- **users → resumes**: One user has many resumes (1:N)
- **users → analyses**: One user has many analyses (1:N)
- **resumes → analyses**: One resume has many analyses (1:N)
- **analyses → rewriteSuggestions**: One analysis has many suggestions (1:N)

---

## Request/Response Flow

### Resume Upload Request
```
POST /api/upload
Content-Type: multipart/form-data

Body:
{
  file: <PDF file buffer>
}

Response (200 OK):
{
  "fileKey": "resumes/user-123/resume-2026-04-13.pdf",
  "fileUrl": "https://s3.example.com/resumes/user-123/resume-2026-04-13.pdf",
  "rawText": "John Doe\nData Analyst\n..."
}
```

### ATS Analysis Request
```
POST /api/analyze
Content-Type: application/json

Body:
{
  "resumeText": "John Doe\nData Analyst\n..."
}

Response (200 OK):
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
    "keywordOptimization": [
      "Add 'Tableau' to skills section",
      "Mention 'Power BI' in projects"
    ],
    "formatting": [
      "Use bullet points consistently",
      "Add more white space"
    ],
    "quantification": [
      "Quantify impact: 'Improved X by Y%'",
      "Add metrics to achievements"
    ]
  }
}
```

### tRPC Procedure Call
```typescript
// Frontend
const resumeResult = await trpc.resume.upload.mutate({
  fileName: "resume.pdf",
  fileKey: "resumes/user-123/resume.pdf",
  fileUrl: "https://s3.example.com/...",
  rawText: "John Doe..."
});

// Backend (server/routers.ts)
resume: router({
  upload: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileKey: z.string(),
      fileUrl: z.string(),
      rawText: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await createResume(
        ctx.user.id,
        input.fileName,
        input.fileKey,
        input.fileUrl,
        input.rawText
      );
    })
})
```

---

## Authentication Flow

### OAuth Flow

```
1. User clicks "Login"
   ↓
2. Frontend redirects to getLoginUrl()
   ↓
3. User sent to OAuth provider
   ↓
4. User authenticates with credentials
   ↓
5. OAuth provider redirects to /api/oauth/callback
   ↓
6. Backend validates authorization code
   ↓
7. Backend exchanges code for access token
   ↓
8. Backend fetches user info from OAuth provider
   ↓
9. Backend creates/updates user in database
   ↓
10. Backend creates JWT session token
   ↓
11. Backend sets secure HTTP-only cookie
   ↓
12. Frontend redirected to home page
   ↓
13. User authenticated and logged in
```

### Session Management

```typescript
// Session Cookie
{
  name: "manus-session",
  value: "jwt-token-here",
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}

// JWT Payload
{
  userId: 1,
  openId: "R3zevSDeQvG3WTJKs8ZVcc",
  email: "user@example.com",
  role: "user",
  iat: 1681234567,
  exp: 1681321000
}
```

---

## Error Handling

### Error Hierarchy

```
┌─────────────────────────┐
│   Application Error     │
└────────────┬────────────┘
             │
    ┌────────┴────────┬──────────────┐
    │                 │              │
┌───▼──────┐  ┌──────▼────┐  ┌─────▼──────┐
│ Validation│  │ Database  │  │ External   │
│ Error     │  │ Error     │  │ Service    │
└───┬──────┘  └──────┬────┘  │ Error      │
    │                │       └─────┬──────┘
    │                │             │
    ├────────────────┼─────────────┤
    │                │             │
    ▼                ▼             ▼
  400 Bad      500 Server    503 Service
  Request      Error         Unavailable
```

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "File size exceeds 10MB limit",
    "details": {
      "field": "file",
      "value": "15728640",
      "limit": "10485760"
    }
  }
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_user_id ON resumes(userId);
   CREATE INDEX idx_resume_id ON analyses(resumeId);
   CREATE INDEX idx_created_at ON resumes(createdAt DESC);
   ```

2. **Query Optimization**
   - Use pagination for large result sets
   - Fetch only required columns
   - Use JOIN for related data

3. **Caching**
   - Cache ATS scoring results
   - Cache keyword databases
   - Cache LLM suggestions

4. **API Rate Limiting**
   - 5 uploads per minute per user
   - 3 LLM suggestions per minute per user
   - 10 history queries per minute per user

---

## Security Architecture

### Security Layers

```
┌──────────────────────────────────────┐
│      HTTPS/TLS Encryption            │
└──────────────────────────────────────┘
              │
┌──────────────▼──────────────────────┐
│      OAuth Authentication           │
│      (Manus OAuth Provider)          │
└──────────────▼──────────────────────┘
              │
┌──────────────▼──────────────────────┐
│      JWT Session Tokens             │
│      (HTTP-only Cookies)            │
└──────────────▼──────────────────────┘
              │
┌──────────────▼──────────────────────┐
│      Input Validation               │
│      (Zod Schema Validation)        │
└──────────────▼──────────────────────┘
              │
┌──────────────▼──────────────────────┐
│      Authorization Checks           │
│      (Role-based Access Control)    │
└──────────────▼──────────────────────┘
              │
┌──────────────▼──────────────────────┐
│      Database Security              │
│      (Parameterized Queries)        │
└──────────────▼──────────────────────┘
```

---

## Deployment Architecture

### Production Deployment

```
┌─────────────────────────────────────┐
│      Load Balancer / CDN            │
│      (Cloudflare / AWS CloudFront)  │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────────┐  ┌────────▼───┐
│ App Server │  │ App Server │
│ (Node.js)  │  │ (Node.js)  │
└───┬────────┘  └────────┬───┘
    │                    │
    └──────────┬─────────┘
               │
        ┌──────▼──────┐
        │ MySQL DB    │
        │ (Replicated)│
        └─────────────┘
               │
        ┌──────▼──────┐
        │ S3 Storage  │
        │ (File Store)│
        └─────────────┘
```

---

## Monitoring & Logging

### Log Files

```
.manus-logs/
├── devserver.log         # Server startup, errors
├── browserConsole.log    # Client-side console output
├── networkRequests.log   # HTTP requests/responses
└── sessionReplay.log     # User interactions
```

### Metrics to Monitor

- Request response time
- Database query performance
- Error rates
- User authentication success rate
- File upload success rate
- LLM API latency

---

**Last Updated:** April 13, 2026  
**Version:** 1.0.0
