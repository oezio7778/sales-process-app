# GitHub + Supabase Setup Guide

## What You Have

All your app files are ready in: `/Users/ezioarciniega/Documents/AntiGravity App/`

Files created:
- `.gitignore` - Protects sensitive data
- `schema.sql` - Database schema for Supabase
- All your app files (HTML, CSS, JS)

## Step-by-Step Setup (When Ready)

### Part 1: Install Git (One-time)

1. Open Terminal
2. Run: `xcode-select --install`
3. Click "Install" in the popup
4. Wait 5-10 minutes for installation

### Part 2: Create GitHub Repository

1. Go to https://github.com
2. Sign in (or create account)
3. Click "New Repository" (green button)
4. Settings:
   - Name: `sales-process-app`
   - **Private** (recommended - contains business data)
   - Don't initialize with README
5. Click "Create Repository"
6. **Copy the repository URL** (looks like: `https://github.com/YOUR_USERNAME/sales-process-app.git`)

### Part 3: Push Code to GitHub

Open Terminal and run these commands:

```bash
cd "/Users/ezioarciniega/Documents/AntiGravity App"
git init
git add .
git commit -m "Initial commit - Sales Process App"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL_HERE
git push -u origin main
```

### Part 4: Create Supabase Project

1. Go to https://supabase.com
2. Sign up (free)
3. Click "New Project"
4. Settings:
   - Name: `sales-process-app`
   - Database Password: (create a strong password - save it!)
   - Region: Choose closest to you
5. Wait 2-3 minutes for project creation

### Part 5: Set Up Database

1. In Supabase, click "SQL Editor" (left sidebar)
2. Click "New Query"
3. Open the file: `schema.sql` from your app folder
4. Copy all the SQL code
5. Paste into Supabase SQL Editor
6. Click "Run" (or press Cmd+Enter)
7. You should see "Success" - all tables created!

### Part 6: Get API Keys

1. In Supabase, go to "Project Settings" (gear icon)
2. Click "API" in the left menu
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Part 7: Configure App

1. Create a new file: `config.js` in your app folder
2. Add this code (replace with your actual values):

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = 'your-anon-key-here';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
```

3. Save the file

### Part 8: Update HTML

Add Supabase library to `index.html` (before `</head>`):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="config.js"></script>
```

### Part 9: Enable GitHub Pages (Optional - for web access)

1. Go to your GitHub repository
2. Click "Settings"
3. Click "Pages" (left sidebar)
4. Source: Select "main" branch
5. Click "Save"
6. Your app will be at: `https://YOUR_USERNAME.github.io/sales-process-app`

## What Happens Next

Once set up:
- ✅ App accessible from any device via URL
- ✅ Data syncs automatically across all tabs/browsers
- ✅ No more localStorage issues
- ✅ Never lose data again

## Need Help?

If you get stuck on any step, let me know which step and I'll help troubleshoot!

## Current Status

**Ready to go:** All files prepared
**Waiting for:** Git installation + your GitHub/Supabase accounts

Take your time - everything is ready when you are!
