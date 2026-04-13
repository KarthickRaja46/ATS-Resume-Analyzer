# ATS Resume Analyzer - API Reference

Complete API documentation for all endpoints and procedures.

## Table of Contents
1. [REST API Endpoints](#rest-api-endpoints)
2. [tRPC Procedures](#trpc-procedures)
3. [Data Types & Schemas](#data-types--schemas)
4. [Error Handling](#error-handling)
5. [Authentication](#authentication)

---

## REST API Endpoints

### File Upload Endpoint

#### POST /api/upload
Upload and extract text from a PDF resume.

**Authentication:** Required (JWT Cookie)

**Request:**
```
Method: POST
URL: http://localhost:3000/api/upload
Content-Type: multipart/form-data

Body:
- file: <PDF file> (required, max 10MB)
```

**Response (200 OK):**
```json
{
  "fileKey": "resumes/user-123/resume-2026-04-13.pdf",
  "fileUrl": "https://s3.example.com/resumes/user-123/resume-2026-04-13.pdf",
  "rawText": "John Doe\nData Analyst\nExperienced professional with 5 years in data analysis..."
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | INVALID_FILE | File is not a PDF or is corrupted |
| 413 | FILE_TOO_LARGE | File size exceeds 10MB limit |
| 401 | UNAUTHORIZED | User not authenticated |
| 500 | EXTRACTION_FAILED | Failed to extract text from PDF |

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@resume.pdf" \
  -H "Cookie: manus-session=<jwt-token>"
```

**Example JavaScript:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
  credentials: 'include' // Include cookies
});

const data = await response.json();
console.log(data.rawText);
```

---

### Analysis Endpoint

#### POST /api/analyze
Analyze resume and generate ATS scores.

**Authentication:** Required (JWT Cookie)

**Request:**
```
Method: POST
URL: http://localhost:3000/api/analyze
Content-Type: application/json

Body:
{
  "resumeText": "John Doe\nData Analyst\n..."
}
```

**Response (200 OK):**
```json
{
  "internScore": 85,
  "jobScore": 72,
  "matchedKeywordsIntern": [
    "Python",
    "SQL",
    "Excel",
    "Data Analysis",
    "Statistical Analysis"
  ],
  "missingKeywordsIntern": [
    "Tableau",
    "Power BI",
    "R",
    "Looker",
    "Google Analytics"
  ],
  "matchedKeywordsJob": [
    "Python",
    "SQL",
    "Excel"
  ],
  "missingKeywordsJob": [
    "Tableau",
    "Power BI",
    "Spark",
    "Hadoop",
    "AWS"
  ],
  "structureValidation": {
    "hasSummary": true,
    "hasSkills": true,
    "hasExperience": true,
    "hasProjects": false,
    "hasEducation": true,
    "hasCertifications": false,
    "missingSections": ["Projects", "Certifications"]
  },
  "recommendations": {
    "keywordOptimization": [
      "Add 'Tableau' to your skills section",
      "Mention 'Power BI' in your project descriptions",
      "Include 'R' if you have experience with it"
    ],
    "formatting": [
      "Use consistent bullet point formatting",
      "Ensure proper spacing between sections",
      "Use action verbs at the start of bullet points"
    ],
    "quantification": [
      "Add percentages: 'Improved efficiency by 25%'",
      "Include timeframes: 'Completed in 2 weeks'",
      "Specify scale: 'Analyzed 1M+ records'"
    ]
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | INVALID_INPUT | Resume text is empty or invalid |
| 401 | UNAUTHORIZED | User not authenticated |
| 500 | ANALYSIS_FAILED | Failed to analyze resume |

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "Cookie: manus-session=<jwt-token>" \
  -d '{
    "resumeText": "John Doe\nData Analyst\n..."
  }'
```

**Example JavaScript:**
```javascript
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    resumeText: resumeContent
  }),
  credentials: 'include'
});

const analysis = await response.json();
console.log(`Intern Score: ${analysis.internScore}%`);
console.log(`Job Score: ${analysis.jobScore}%`);
```

---

## tRPC Procedures

### Resume Procedures

#### resume.upload
Save uploaded resume to database.

**Input Schema:**
```typescript
{
  fileName: string;        // Original filename
  fileKey: string;         // S3 storage key
  fileUrl: string;         // Public S3 URL
  rawText: string;         // Extracted text content
}
```

**Output Schema:**
```typescript
{
  id: number;              // Resume ID (primary key)
  userId: number;          // User ID (foreign key)
  fileName: string;
  fileKey: string;
  fileUrl: string;
  rawText: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Usage:**
```typescript
const resume = await trpc.resume.upload.mutate({
  fileName: "my-resume.pdf",
  fileKey: "resumes/user-123/my-resume.pdf",
  fileUrl: "https://s3.example.com/resumes/user-123/my-resume.pdf",
  rawText: "John Doe\nData Analyst\n..."
});

console.log(`Resume saved with ID: ${resume.id}`);
```

---

### Analysis Procedures

#### analysis.create
Save ATS analysis results to database.

**Input Schema:**
```typescript
{
  resumeId: number;                    // Resume ID (foreign key)
  internScore: number;                 // 0-100
  jobScore: number;                    // 0-100
  matchedKeywordsIntern: string[];
  missingKeywordsIntern: string[];
  matchedKeywordsJob: string[];
  missingKeywordsJob: string[];
  structureValidation: {
    hasSummary: boolean;
    hasSkills: boolean;
    hasExperience: boolean;
    hasProjects: boolean;
    hasEducation: boolean;
    hasCertifications: boolean;
    missingSections: string[];
  };
  recommendations: {
    keywordOptimization: string[];
    formatting: string[];
    quantification: string[];
  };
}
```

**Output Schema:**
```typescript
{
  id: number;
  resumeId: number;
  userId: number;
  internScore: number;
  jobScore: number;
  matchedKeywordsIntern: string[];
  missingKeywordsIntern: string[];
  matchedKeywordsJob: string[];
  missingKeywordsJob: string[];
  structureValidation: object;
  recommendations: object;
  createdAt: Date;
  updatedAt: Date;
}
```

**Usage:**
```typescript
const analysis = await trpc.analysis.create.mutate({
  resumeId: 1,
  internScore: 85,
  jobScore: 72,
  matchedKeywordsIntern: ["Python", "SQL"],
  missingKeywordsIntern: ["Tableau", "Power BI"],
  matchedKeywordsJob: ["Python", "SQL"],
  missingKeywordsJob: ["Tableau", "Power BI", "Spark"],
  structureValidation: {
    hasSummary: true,
    hasSkills: true,
    hasExperience: true,
    hasProjects: false,
    hasEducation: true,
    hasCertifications: false,
    missingSections: ["Projects", "Certifications"]
  },
  recommendations: {
    keywordOptimization: ["Add Tableau to skills"],
    formatting: ["Use consistent formatting"],
    quantification: ["Add metrics to achievements"]
  }
});

console.log(`Analysis saved with ID: ${analysis.id}`);
```

#### analysis.getByResumeId
Fetch analysis for a specific resume.

**Input Schema:**
```typescript
{
  resumeId: number;  // Resume ID
}
```

**Output Schema:**
```typescript
{
  id: number;
  resumeId: number;
  userId: number;
  internScore: number;
  jobScore: number;
  // ... all other fields
  createdAt: Date;
  updatedAt: Date;
} | null
```

**Usage:**
```typescript
const analysis = await trpc.analysis.getByResumeId.query({
  resumeId: 1
});

if (analysis) {
  console.log(`Intern Score: ${analysis.internScore}%`);
}
```

---

### Suggestions Procedures

#### suggestions.generate
Generate LLM-powered rewrite suggestions.

**Input Schema:**
```typescript
{
  resumeText: string;      // Full resume text
  targetRole: "intern" | "job";  // Target position type
}
```

**Output Schema:**
```typescript
{
  summaryRewrite: string;   // Rewritten professional summary
  bulletSuggestions: Array<{
    original: string;       // Original bullet point
    suggested: string;      // Improved version
    improvement: string;    // Explanation of change
  }>;
}
```

**Usage:**
```typescript
const suggestions = await trpc.suggestions.generate.mutate({
  resumeText: "John Doe\nData Analyst\n...",
  targetRole: "job"
});

console.log("Rewritten Summary:");
console.log(suggestions.summaryRewrite);

suggestions.bulletSuggestions.forEach(item => {
  console.log(`Original: ${item.original}`);
  console.log(`Suggested: ${item.suggested}`);
  console.log(`Why: ${item.improvement}`);
});
```

---

### History Procedures

#### history.list
Get all resumes and analyses for current user.

**Input Schema:**
```typescript
{
  limit?: number;   // Default: 10
  offset?: number;  // Default: 0
}
```

**Output Schema:**
```typescript
Array<{
  resume: {
    id: number;
    fileName: string;
    fileUrl: string;
    createdAt: Date;
  };
  analysis: {
    id: number;
    internScore: number;
    jobScore: number;
    createdAt: Date;
  } | null;
}>
```

**Usage:**
```typescript
const history = await trpc.history.list.query({
  limit: 20,
  offset: 0
});

history.forEach(item => {
  console.log(`Resume: ${item.resume.fileName}`);
  console.log(`Intern Score: ${item.analysis?.internScore}%`);
  console.log(`Uploaded: ${item.resume.createdAt}`);
});
```

#### history.delete
Delete a resume and its analyses.

**Input Schema:**
```typescript
{
  resumeId: number;  // Resume ID to delete
}
```

**Output Schema:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Usage:**
```typescript
const result = await trpc.history.delete.mutate({
  resumeId: 1
});

if (result.success) {
  console.log("Resume deleted successfully");
}
```

---

### Authentication Procedures

#### auth.me
Get current authenticated user.

**Input Schema:**
```typescript
// No input required
```

**Output Schema:**
```typescript
{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
} | null
```

**Usage:**
```typescript
const user = await trpc.auth.me.query();

if (user) {
  console.log(`Logged in as: ${user.name}`);
  console.log(`Role: ${user.role}`);
} else {
  console.log("Not authenticated");
}
```

#### auth.logout
Clear user session.

**Input Schema:**
```typescript
// No input required
```

**Output Schema:**
```typescript
{
  success: boolean;
}
```

**Usage:**
```typescript
const result = await trpc.auth.logout.mutate();

if (result.success) {
  console.log("Logged out successfully");
  // Redirect to home page
}
```

---

## Data Types & Schemas

### Resume Type
```typescript
type Resume = {
  id: number;
  userId: number;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  rawText: string;
  createdAt: Date;
  updatedAt: Date;
};
```

### Analysis Type
```typescript
type Analysis = {
  id: number;
  resumeId: number;
  userId: number;
  internScore: number;
  jobScore: number;
  matchedKeywordsIntern: string[];
  missingKeywordsIntern: string[];
  matchedKeywordsJob: string[];
  missingKeywordsJob: string[];
  structureValidation: {
    hasSummary: boolean;
    hasSkills: boolean;
    hasExperience: boolean;
    hasProjects: boolean;
    hasEducation: boolean;
    hasCertifications: boolean;
    missingSections: string[];
  };
  recommendations: {
    keywordOptimization: string[];
    formatting: string[];
    quantification: string[];
  };
  createdAt: Date;
  updatedAt: Date;
};
```

### User Type
```typescript
type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};
```

### Suggestion Type
```typescript
type Suggestion = {
  summaryRewrite: string;
  bulletSuggestions: Array<{
    original: string;
    suggested: string;
    improvement: string;
  }>;
};
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "field_name",
      "value": "invalid_value",
      "constraint": "constraint_description"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_INPUT | 400 | Input validation failed |
| INVALID_FILE | 400 | File format or content invalid |
| FILE_TOO_LARGE | 413 | File exceeds size limit |
| UNAUTHORIZED | 401 | User not authenticated |
| FORBIDDEN | 403 | User lacks permission |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| EXTRACTION_FAILED | 500 | PDF text extraction failed |
| ANALYSIS_FAILED | 500 | ATS analysis failed |
| LLM_ERROR | 503 | LLM service unavailable |
| DATABASE_ERROR | 500 | Database operation failed |
| INTERNAL_ERROR | 500 | Unexpected server error |

### Error Handling Examples

**JavaScript:**
```javascript
try {
  const result = await trpc.resume.upload.mutate(data);
} catch (error) {
  if (error.code === 'INVALID_INPUT') {
    console.error('Input validation failed:', error.message);
  } else if (error.code === 'UNAUTHORIZED') {
    console.error('Please log in first');
    // Redirect to login
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

---

## Authentication

### Session Management

Sessions are managed via HTTP-only cookies:

```
Cookie: manus-session=<jwt-token>
```

**Cookie Properties:**
- `httpOnly: true` - Not accessible via JavaScript
- `secure: true` - Only sent over HTTPS
- `sameSite: "none"` - Allow cross-site requests
- `maxAge: 604800000` - 7 days

### JWT Token Structure

```json
{
  "userId": 1,
  "openId": "R3zevSDeQvG3WTJKs8ZVcc",
  "email": "user@example.com",
  "role": "user",
  "iat": 1681234567,
  "exp": 1681321000
}
```

### Authentication Flow

1. User clicks "Login"
2. Redirected to OAuth provider
3. User authenticates
4. OAuth provider redirects to `/api/oauth/callback`
5. Backend validates code and creates session
6. Session cookie set in response
7. Frontend redirected to home page
8. User authenticated for subsequent requests

### Accessing Protected Endpoints

All requests must include the session cookie:

```javascript
// Automatically included with credentials: 'include'
fetch('/api/trpc/resume.upload', {
  method: 'POST',
  credentials: 'include',  // Include cookies
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

---

**Last Updated:** April 13, 2026  
**Version:** 1.0.0
