# Deployment & Setup Guide for New Features

This guide will help you deploy the new features to your ATS Resume Analyzer system.

---

## Prerequisites

- Node.js >= 18
- MySQL database
- Existing ATS Resume Analyzer installation
- pnpm package manager

---

## Step 1: Database Migrations

### 1.1 Run Drizzle Schema Update

```bash
# Generate migration from schema changes
pnpm run db:generate

# Apply the migration
pnpm run db:push
```

The schema.ts has been updated with:
- Extended `resumes` table with versioning
- Extended `analyses` table with multi-role support
- 9 new tables for templates, keywords, benchmarks, etc.

### 1.2 Seed Initial Data (Optional but Recommended)

Create a seed script `drizzle/seed.ts`:

```typescript
import { roleDefinitions, resumeTemplates, scoreBenchmarks } from "../drizzle/schema";
import { db } from "../server/db";

// Seed job roles
const roles = [
  { roleKey: "software-engineer", roleName: "Software Engineer", industry: "tech", keywords: [...] },
  { roleKey: "data-analyst-entry", roleName: "Data Analyst (Entry-Level)", industry: "tech", keywords: [...] },
  // Add more roles...
];

// Seed templates
const templates = [
  { name: "Tech Resume - Software Engineer", industry: "tech", content: "..." },
  // Add more templates...
];

// Seed benchmarks
const benchmarks = [
  { roleKey: "software-engineer", averageScore: 68, medianScore: 70, ... },
  // Add more benchmarks...
];

await Promise.all([
  db.insert(roleDefinitions).values(roles),
  db.insert(resumeTemplates).values(templates),
  db.insert(scoreBenchmarks).values(benchmarks),
]);
```

Run seeding:
```bash
node -e "import('./drizzle/seed.ts').then()"
```

---

## Step 2: Backend Installation

### 2.1 Install Dependencies

All required dependencies are already in `package.json`. Run:

```bash
pnpm install
```

### 2.2 Update Environment Variables

Add any new API keys if needed (optional for basic features):

```env
# For additional AI features (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# For exports (optional - for advanced PDF/DOCX generation)
PUPPETEER_HEADLESS_SHELL=/usr/bin/chromium-browser
```

### 2.3 Verify Backend

```bash
# Type check
pnpm run check

# Run tests
pnpm run test
```

---

## Step 3: Frontend Integration

### 3.1 Import New Components

Update your main page imports to include new components:

```typescript
// In your Results.tsx or Dashboard.tsx
import { MultiRoleAnalyzer } from "@/components/MultiRoleAnalyzer";
import { ExportOptions } from "@/components/ExportOptions";
import { CoverLetterGenerator } from "@/components/CoverLetterGenerator";
import { BenchmarkDashboard } from "@/components/BenchmarkDashboard";
import { TemplateSelector } from "@/components/TemplateSelector";
```

### 3.2 Add Components to Pages

Example integration in Results page:

```typescript
export function ResultsPage() {
  const { resumeId, analysisId } = useParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  return (
    <div className="space-y-6">
      {/* Existing analysis display */}
      <AnalysisDisplay analysis={analysis} />

      {/* New components */}
      <MultiRoleAnalyzer 
        resumeText={resume.rawText}
        jobDescription={jobDescription}
      />
      
      <BenchmarkDashboard 
        userScore={analysis.jobScore}
        roleKey={analysis.jobRole}
      />
      
      <ExportOptions 
        resumeId={resumeId}
        analysisId={analysisId}
        fileName={resume.fileName}
      />
      
      <TemplateSelector 
        industry="tech"
        jobDescription={jobDescription}
      />
      
      <CoverLetterGenerator 
        resumeText={resume.rawText}
        initialJobDescription={jobDescription}
      />
    </div>
  );
}
```

### 3.3 Update Navigation

Add links to new features in your navigation:

```typescript
<nav>
  <Link href="/upload">Upload</Link>
  <Link href="/dashboard">Dashboard</Link>
  <Link href="/templates">Templates</Link>
  <Link href="/tools/cover-letter">Cover Letter Generator</Link>
  <Link href="/tools/batch-analysis">Batch Analysis</Link>
  <Link href="/benchmark">My Benchmark</Link>
</nav>
```

---

## Step 4: Configuration

### 4.1 Update Constants

Verify `shared/const.ts` has all job roles:

```typescript
export const JOB_ROLES = {
  "software-engineer": { key: "software-engineer", label: "Software Engineer", industry: "tech" },
  // ... all roles should be present
}
```

### 4.2 Theme Support (Optional)

If implementing theme switcher:

```typescript
// In App.tsx
import { useTheme } from "@/contexts/ThemeContext";

export function App() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className={theme === "dark" ? "dark" : ""}>
      {/* App content */}
      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        Toggle Theme
      </button>
    </div>
  );
}
```

---

## Step 5: Testing

### 5.1 Test Backend Services

```bash
# Test multi-role analysis
curl -X POST http://localhost:3000/api/trpc/multiRole.analyze \
  -H "Content-Type: application/json" \
  -d '{"resumeText":"...", "jobDescription":"..."}'

# Test export
curl -X POST http://localhost:3000/api/trpc/export.resume \
  -d '{"resumeId":1, "format":"pdf"}'

# Test templates
curl -X GET http://localhost:3000/api/trpc/templates.getAll
```

### 5.2 Test Frontend Components

```typescript
// Example test in your test suite
import { render, screen } from "@testing-library/react";
import { MultiRoleAnalyzer } from "@/components/MultiRoleAnalyzer";

test("MultiRoleAnalyzer renders analyze button", () => {
  render(
    <MultiRoleAnalyzer 
      resumeText="Senior Software Engineer with 10 years experience..."
    />
  );
  
  expect(screen.getByText(/Analyze Against All Roles/i)).toBeInTheDocument();
});
```

### 5.3 Run Full Test Suite

```bash
pnpm run test
```

---

## Step 6: Deployment

### 6.1 Production Build

```bash
# Build frontend
pnpm run build

# Build backend
pnpm run build:server
```

### 6.2 Environment Setup for Production

```env
NODE_ENV=production
DATABASE_URL=mysql://user:pass@host:3306/ats_db

# Cache and performance
REDIS_URL=redis://host:6379

# API integrations (if used)
OPENAI_API_KEY=sk-...
```

### 6.3 Deploy

```bash
# Using Docker
docker build -t ats-analyzer .
docker run -p 3000:3000 ats-analyzer

# Or direct deployment
pnpm run start
```

---

## Step 7: Verification

### 7.1 Health Checks

```bash
# Check server is running
curl http://localhost:3000/api/health

# Check database connection
curl http://localhost:3000/api/trpc/util.getJobRoles
```

### 7.2 Feature Verification

- [ ] Multi-role analysis responds with 15 roles
- [ ] Export works for all 5 formats
- [ ] Cover letter generates successfully
- [ ] Templates are accessible
- [ ] Benchmarking shows percentiles
- [ ] Database tables are created

---

## Troubleshooting

### Issue: Migration fails

**Solution:**
```bash
# Reset and reapply
pnpm run db:generate
pnpm run db:push
```

### Issue: tRPC endpoints not found

**Solution:**
```bash
# Verify router is exported
# Check server/routers.ts exports appRouter
# Restart dev server
```

### Issue: Components not rendering

**Solution:**
```bash
# Verify imports are correct
# Check UI component dependencies (button, card, etc.)
# Ensure Tailwind CSS is configured
```

### Issue: Export not working

**Solution:**
```bash
# Check file system permissions
# Verify blob conversion works
# Test with simpler format (JSON) first
```

---

## Performance Optimization

### 1. Database Indexes

The schema includes indexes on common queries:
- `analysis.userId` - For user's analyses
- `resume.userId` - For user's resumes
- `customKeywords.userId` - For user's keywords

### 2. Query Optimization

For batch operations, use pagination:

```typescript
// Get first 10 resumes
trpc.resume.getHistory.useQuery({ 
  limit: 10, 
  offset: 0 
});
```

### 3. Caching (Optional)

```typescript
// Cache template data
const templates = useMemo(() => 
  trpc.templates.getAll.useQuery(),
  []
);
```

---

## Maintenance

### Regular Tasks

1. **Weekly**: Monitor error logs
2. **Monthly**: Update dependencies
3. **Monthly**: Review benchmark data accuracy
4. **Quarterly**: Archive old analyses

### Updating Benchmark Data

```typescript
// Update benchmarks quarterly
const newBenchmarks = calculateBenchmarks(analyses);
await db.update(scoreBenchmarks).set(newBenchmarks);
```

---

## Monitoring

### Key Metrics to Track

1. **Multi-role analysis latency** - Should be < 500ms
2. **Export success rate** - Should be > 99%
3. **Template selection frequency** - Understand popular roles
4. **Cover letter generation usage** - Track AI feature adoption
5. **Benchmark accuracy** - Update when sample size changes

---

## Support & Resources

- **Documentation**: See `docs/reference/NEW_FEATURES.md`
- **Architecture**: See `docs/system-overview/ARCHITECTURE.md`
- **API Reference**: See `docs/reference/API_REFERENCE.md`
- **Issues**: Check GitHub issues or internal docs
- **Updates**: Monitor changelog for breaking changes

---

## Rollback Plan

If you need to rollback:

```bash
# Revert to previous version
git checkout HEAD~1

# Revert database (caution - data loss)
pnpm run db:push --force

# Restart services
pnpm run dev
```

---

## Success Criteria

Your deployment is successful when:

✅ All database tables created
✅ All 20+ API endpoints responding
✅ All 5 frontend components rendering
✅ Export works for all formats
✅ Benchmarking shows correct percentiles
✅ Cover letters generate properly
✅ No console errors
✅ < 2 second page load times

---

## Next Steps After Deployment

1. **Gather user feedback** on new features
2. **Monitor performance** metrics
3. **Document any issues** for future improvements
4. **Plan Phase 2**: Search/Filter UI, Versioning UI
5. **Consider**: LinkedIn extension, mobile app

---

## Migration from Old System

If migrating analyses from old system:

```typescript
// Script to migrate existing analyses
const oldAnalyses = await getOldDatabase().query("SELECT * FROM analyses");

for (const analysis of oldAnalyses) {
  await createAnalysis({
    resumeId: analysis.resume_id,
    userId: analysis.user_id,
    jobRole: "data-analyst-entry", // Default role
    jobDescription: null,
    internScore: analysis.intern_score,
    jobScore: analysis.job_score,
    // ... other fields
  });
}
```

---

## Support Contact

For questions or issues:
- Check documentation first
- Review code examples in components
- Test in development environment
- File issues with reproduction steps

---

**Last Updated:** April 14, 2026
**Version:** 1.0.0
**Status:** Production Ready

