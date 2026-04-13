# ATS Resume Analyzer - Quick Start Guide

Get the application running locally in 5 minutes!

## Prerequisites
- Node.js v18+ (https://nodejs.org/)
- MySQL v8+ (https://dev.mysql.com/downloads/mysql/)
- OpenAI API Key (https://platform.openai.com/account/api-keys)

## Quick Setup

### 1. Install pnpm
```bash
npm install -g pnpm
```

### 2. Install Dependencies
```bash
cd resume-optimizer-ats
pnpm install
```

### 3. Create Database
```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE resume_optimizer_ats;

# Exit
exit
```

### 4. Configure Environment
Create `.env.local` in project root:
```env
DATABASE_URL=mysql://root:password@localhost:3306/resume_optimizer_ats
OPENAI_API_KEY=sk-your-api-key-here
JWT_SECRET=your-secret-key-min-32-characters-long
NODE_ENV=development
VITE_APP_TITLE=ATS Resume Analyzer
```

### 5. Apply Database Schema
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 6. Start Development Server
```bash
pnpm dev
```

### 7. Open Browser
Navigate to: **http://localhost:3000**

---

## What You Can Do Now

✅ Upload PDF resumes  
✅ Get instant ATS scores  
✅ See keyword analysis  
✅ View improvement recommendations  
✅ Track resume history  
✅ Get AI-powered suggestions  

---

## Useful Commands

```bash
# Run tests
pnpm test

# Type check
pnpm check

# Format code
pnpm format

# Build for production
pnpm build

# Start production server
pnpm start
```

---

## Troubleshooting

**MySQL won't connect?**
```bash
# Start MySQL service
# macOS: brew services start mysql
# Linux: sudo systemctl start mysql
# Windows: net start MySQL80
```

**Port 3000 in use?**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Dependencies not installing?**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

For detailed setup instructions, see **SETUP_GUIDE.md**
