# MongoDB Atlas Setup Guide

Your ATS Resume Analyzer is now **MongoDB-based** and ready to connect to MongoDB Atlas!

## Your MongoDB Atlas Organization
- **Organization:** Karthick's Org - 2026-04-05
- **Dashboard:** https://cloud.mongodb.com

---

## 🚀 Quick Setup (Follow These Steps in Order)

### Step 1: Create a Project
1. Go to https://cloud.mongodb.com
2. Click **"New Project"** button (top right)
3. Name it: `resume-optimizer` 
4. Click **"Create Project"** 
5. Wait for it to load

### Step 2: Create a Cluster
1. From the project dashboard, click **"Build a Database"** or **"Create"**
2. Choose **"M0 FREE"** tier (free forever)
3. Select your preferred region (closest to you)
4. Click **"Create Deployment"**
5. Wait 2-3 minutes for cluster to initialize

### Step 3: Create Database User
1. In your cluster, go to **"Security" → "Database Access"**
2. Click **"+ ADD NEW DATABASE USER"**
3. Enter:
   - **Username:** `ats_user`
   - **Password:** (generate strong password, copy it!)
   - **Role:** `Built-in Role: atlasAdmin`
4. Click **"Add User"**

### Step 4: Get Connection String
1. Go back to **Clusters** view
2. Click **"CONNECT"** button on your cluster
3. Choose **"Drivers"** (NOT "MongoDB Compass")
4. Copy the connection string that looks like:
```
mongodb+srv://ats_user:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Step 5: Update Your Connection String
Replace `PASSWORD` with what you set in Step 3, then paste into environment:

**Windows PowerShell:**
```powershell
Set-Content -Path "D:\resume optimizer\.env.local" -Value @"
MONGODB_URI=mongodb+srv://ats_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/resume_optimizer_ats?retryWrites=true&w=majority
OPENAI_API_KEY=sk-your-openai-api-key-here
JWT_SECRET=your-32-character-secret-here
NODE_ENV=development
VITE_APP_TITLE=ATS Resume Analyzer
VITE_OAUTH_PORTAL_URL=http://localhost:3001
VITE_APP_ID=local-dev-app
VITE_ANALYTICS_ENDPOINT=http://localhost:8080/api/send
VITE_ANALYTICS_WEBSITE_ID=local-dev
OAUTH_SERVER_URL=http://localhost:3001
"@
```

### Step 6: Add IP to Whitelist
1. In MongoDB Atlas, go to **"Security" → "Network Access"**
2. Click **"+ ADD IP ADDRESS"**
3. Choose **"Allow Access from Anywhere"** (for development)
   - Or enter your IP: `0.0.0.0/0`
4. Click **"Confirm"**

### Step 7: Test & Run
```bash
# From D:\resume optimizer in PowerShell
Set-Location 'D:\resume optimizer'
npx pnpm dev
```

Wait for message: **"Server running on http://localhost:3001/"**

---

## 📖 Understanding Your Connection String

```
mongodb+srv://ats_user:password@cluster0.xxxxx.mongodb.net/resume_optimizer_ats?retryWrites=true&w=majority
```

| Part | Meaning |
|------|---------|
| `mongodb+srv://` | MongoDB Atlas protocol (secure) |
| `ats_user:password` | Your database user credentials |
| `cluster0.xxxxx.mongodb.net` | Your cluster address |
| `/resume_optimizer_ats` | Database name (auto-created) |
| `retryWrites=true` | Retry on network failure |
| `w=majority` | Wait for write confirmation |

---

## 🔄 Switch Between Local & Atlas

### To Use **Local MongoDB** (for offline work):
```
MONGODB_URI=mongodb://localhost:27017/resume_optimizer_ats
```
(requires `mongod` running locally)

### To Use **MongoDB Atlas** (recommended for production):
```
MONGODB_URI=mongodb+srv://ats_user:PASSWORD@cluster0.xxxxx.mongodb.net/resume_optimizer_ats?retryWrites=true&w=majority
```

---

## ✅ Testing Connection

### From PowerShell:
```powershell
# Install MongoDB CLI (if needed)
winget install MongoDB.Mongosh

# Test connection
. "C:\Program Files\MongoDB\Tools\mongosh\bin\mongosh.exe" "mongodb+srv://ats_user:PASSWORD@cluster0.xxxxx.mongodb.net/resume_optimizer_ats"

# Should see: "my_cluster [primaryMirrored] my_db>"
```

### From Browser (after running `pnpm dev`):
1. Open http://localhost:3001/
2. Try uploading a resume
3. Check MongoDB Atlas dashboard - should see:
   - New collection: `analyses`
   - New collection: `resumes`
   - New collection: `rewriteSuggestions`
   - New collection: `users`

---

## ❌ Troubleshooting

**Error: "Failed to connect to cluster"**
- Check IP whitelist in Security → Network Access
- Verify username/password are correct
- Replace `PASSWORD` in connection string with actual password

**Error: "ETIMEDOUT"**
- Internet connection working?
- firewall blocking MongoDB Atlas?
- Try: `ping cluster0.xxxxx.mongodb.net`

**Error: "authentication failed"**
- Username/password mismatch
- Verify in MongoDB Atlas → Security → Database Users

**Collections not appearing?**
- Upload a resume first (triggers data creation)
- Check app at http://localhost:3001/

---

## 📊 What Gets Stored

Once running, MongoDB stores:
- **Users** - OAuth login info
- **Resumes** - Upload PDFs (text extracted)
- **Analyses** - ATS scores & keyword matches
- **Rewrite Suggestions** - AI-powered improvements

All visible in MongoDB Atlas dashboard under:
Collections → Database → Collection Name → Documents

---

## 🔐 Security Notes (Production)

Before deploying to production:
1. ✅ Use strong database password (20+ chars, mix of symbols)
2. ✅ Restrict IP whitelist (don't use 0.0.0.0/0)
3. ✅ Use separate credentials for each environment
4. ✅ Enable encryption in MongoDB Atlas
5. ✅ Rotate credentials periodically
6. ✅ Use `.env` file (never commit credentials)

---

## 📝 Next Actions

1. ✅ Open https://cloud.mongodb.com
2. ✅ Create project named `resume-optimizer`
3. ✅ Create M0 FREE cluster
4. ✅ Create user `ats_user` with strong password
5. ✅ Get connection string
6. ✅ Update `.env.local`
7. ✅ Whitelist your IP
8. ✅ Run `npx pnpm dev`
9. ✅ Visit http://localhost:3001/

**Ready? Let's go! 🚀**
