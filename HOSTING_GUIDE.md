# VocabVault — Hosting & Deployment Guide

A detailed step-by-step documentation of how VocabVault was hosted, deployed, and connected to a custom domain.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Step 1 — MongoDB Atlas Setup (Database)](#2-step-1--mongodb-atlas-setup-database)
3. [Step 2 — Code Changes for Production](#3-step-2--code-changes-for-production)
4. [Step 3 — Data Migration (JSON → MongoDB)](#4-step-3--data-migration-json--mongodb)
5. [Step 4 — Authentication System](#5-step-4--authentication-system)
6. [Step 5 — Deploying on Render.com](#6-step-5--deploying-on-rendercom)
7. [Step 6 — GoDaddy Domain Configuration](#7-step-6--godaddy-domain-configuration)
8. [Step 7 — Connecting Domain to Render](#8-step-7--connecting-domain-to-render)
9. [Step 8 — SSL Certificate Setup](#9-step-8--ssl-certificate-setup)
10. [Troubleshooting Issues We Faced](#10-troubleshooting-issues-we-faced)
11. [Final DNS Records](#11-final-dns-records)
12. [How It All Works Together](#12-how-it-all-works-together)

---

## 1. Architecture Overview

```
User (Browser / Mobile)
        │
        ▼
 versatilesoul.co.in  ──▶  GoDaddy DNS
        │                      │
        │         A record (@) │ → 216.24.57.1
        │       CNAME (www)    │ → vocabvault-8ooj.onrender.com
        │                      │
        ▼                      ▼
   Render.com  (Hosts the app)
        │
        ├── Serves React Frontend (static files from /dist)
        ├── Runs Express.js Backend (API server)
        │
        ▼
   MongoDB Atlas (Cloud Database)
        │
        └── Stores all vocabulary data (OWS, Idioms, Synonyms/Antonyms)
```

**Tech Stack:**
- **Frontend:** React + Vite (built to static files)
- **Backend:** Express.js (Node.js)
- **Database:** MongoDB Atlas (Free tier, AWS Mumbai region)
- **Hosting:** Render.com (Free tier Web Service)
- **Domain:** GoDaddy (`versatilesoul.co.in`)
- **SSL:** Auto-managed by Render via Let's Encrypt

---

## 2. Step 1 — MongoDB Atlas Setup (Database)

### Why MongoDB?
The app originally used local JSON files for data storage. For public hosting, we needed a cloud database so data persists and is accessible from anywhere.

### Steps:
1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas) and create an account
2. Create a new **Free Cluster**:
   - **Provider:** AWS
   - **Region:** Mumbai (ap-south-1) — closest to India for low latency
   - **Tier:** Free (M0 Sandbox) — 512 MB storage, shared RAM
   - **Cluster Name:** Cluster0
3. **Create a Database User:**
   - Username: `vocabadmin`
   - Password: (a strong password)
   - Role: Read and Write to any database
4. **Set Network Access:**
   - Go to **Network Access → Add IP Address**
   - Select **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - This is required because Render's IP addresses change dynamically
5. **Get Connection String:**
   - Go to **Database → Connect → Drivers**
   - Copy the connection string:
     ```
     mongodb+srv://vocabadmin:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0
     ```
   - Replace `<password>` with the actual database user password

---

## 3. Step 2 — Code Changes for Production

### 3.1 New Dependencies Added

```bash
npm install mongoose dotenv bcryptjs jsonwebtoken
```

| Package | Purpose |
|---------|---------|
| `mongoose` | ODM (Object Data Modeling) for MongoDB |
| `dotenv` | Load environment variables from `.env` file |
| `bcryptjs` | Hash and verify passwords |
| `jsonwebtoken` | Generate and verify JWT tokens for auth |

### 3.2 Created Mongoose Models

Created `models/` folder with schemas for each category:

- **`models/Ows.js`** — One Word Substitution (word, phrase, hindi)
- **`models/Idiom.js`** — Idioms & Phrases (phrase, meaning, hindi)
- **`models/SynAnt.js`** — Synonyms & Antonyms (word, meaning, hindi, synonyms, antonyms)

### 3.3 Updated `server.js`

- Replaced JSON file read/write with Mongoose database operations
- Added MongoDB connection using `mongoose.connect(process.env.MONGODB_URI)`
- Added static file serving for production:
  ```javascript
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }
  ```

### 3.4 Created `.env` File (Local Development)

```env
MONGODB_URI=mongodb+srv://vocabadmin:<password>@cluster0.xxxxx.mongodb.net/vocabvault
JWT_SECRET=<random-secret-key>
ADMIN_USERNAME=<admin-username>
ADMIN_PASSWORD_HASH=<bcrypt-hashed-password>
```

> **Important:** `.env` is in `.gitignore` — it is NEVER pushed to GitHub.

### 3.5 Updated `package.json`

- Moved `vite` and `@vitejs/plugin-react` from `devDependencies` to `dependencies`
  - Render installs only `dependencies` in production, and both are needed for the build step
- Added production scripts:
  ```json
  {
    "build": "vite build",
    "start": "node server.js"
  }
  ```

---

## 4. Step 3 — Data Migration (JSON → MongoDB)

Created `migrate.js` script to move existing data from local JSON files to MongoDB Atlas.

### How to run:
```bash
node migrate.js
```

### What it does:
1. Connects to MongoDB Atlas using the connection string from `.env`
2. Reads data from `data/ows.json`, `data/idioms.json`, `data/syn_ant.json`
3. Inserts all records into the corresponding MongoDB collections
4. Logs the count of migrated records

After migration, the `data/` folder is no longer needed (kept as local backup).

---

## 5. Step 4 — Authentication System

### Why?
Since the app is publicly hosted, we needed to protect add/edit/delete operations so only the admin can modify data, while anyone can view and take quizzes.

### How it works:

```
Public Users (no login):
  ✅ View all vocabulary entries
  ✅ Take quizzes
  ❌ Cannot add/edit/delete entries

Admin (logged in):
  ✅ Everything public users can do
  ✅ Add new entries
  ✅ Edit existing entries
  ✅ Delete entries
```

### Implementation:
- **Backend:** JWT-based authentication
  - `POST /api/auth/login` — validates credentials, returns JWT token
  - `requireAuth` middleware — protects POST, PUT, DELETE routes
  - Password stored as bcrypt hash (never plain text)
- **Frontend:** React Context (`AuthContext.jsx`)
  - Stores token in `localStorage`
  - Provides `isAdmin` flag to components
  - Login page at `/login`
  - Logout button in header (visible only when logged in)

---

## 6. Step 5 — Deploying on Render.com

### Why Render?
Free tier, supports Node.js, auto-deploys from GitHub, includes SSL.

### Steps:

1. Go to [https://render.com](https://render.com) and sign up (use GitHub account)
2. Click **"New +"** → **"Web Service"**
3. **Connect your GitHub repository** (`VersatileSoul/VocabVault`)
4. Configure the service:

   | Setting | Value |
   |---------|-------|
   | **Name** | vocabvault |
   | **Region** | Oregon (or closest) |
   | **Branch** | main |
   | **Runtime** | Node |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm run start` |
   | **Plan** | Free |

5. **Add Environment Variables** (in Render dashboard → Environment):

   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | `mongodb+srv://vocabadmin:...` (your full connection string) |
   | `JWT_SECRET` | (your secret key) |
   | `ADMIN_USERNAME` | (your admin username) |
   | `ADMIN_PASSWORD_HASH` | (your bcrypt hash) |
   | `NODE_ENV` | `production` |

6. Click **"Create Web Service"**
7. Wait for the build and deploy to complete
8. Your app is now live at: `https://vocabvault-8ooj.onrender.com`

### How Render Build Works:
```
GitHub Push → Render detects change → Runs build command:
  1. npm install        (installs all dependencies)
  2. npm run build      (vite builds React → /dist folder)

Then runs start command:
  3. node server.js     (Express serves API + static files from /dist)
```

---

## 7. Step 6 — GoDaddy Domain Configuration

### Domain: `versatilesoul.co.in`

We needed to point this domain to our Render-hosted app.

### DNS Records to Add/Modify:

Go to **GoDaddy → My Products → DNS Management** for your domain.

#### Record 1: Root Domain (A Record)
| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | `@` | `216.24.57.1` | 600 seconds |

> `216.24.57.1` is Render's load balancer IP address.

#### Record 2: WWW Subdomain (CNAME Record)
| Type | Name | Value | TTL |
|------|------|-------|-----|
| **CNAME** | `www` | `vocabvault-8ooj.onrender.com` | 1/2 Hour |

> This points `www.versatilesoul.co.in` to your Render app.

### Records to Delete:
- **Parked A records** — GoDaddy adds default A records (e.g., `3.33.251.168`, `15.197.225.128`). Delete ALL of them.
- **Domain forwarding rules** — Any forwarding in GoDaddy causes redirect loops. Delete ALL forwarding.
- **Extra AAAA records** — If any IPv6 records exist that don't point to Render, delete them.

---

## 8. Step 7 — Connecting Domain to Render

### Steps:

1. Go to **Render → Your Web Service → Settings → Custom Domains**
2. Click **"Add Custom Domain"**
3. Add: `versatilesoul.co.in`
   - Render will show: "Add an A record pointing to `216.24.57.1`" (already done)
4. Add: `www.versatilesoul.co.in`
   - Render will show: "Add a CNAME pointing to `vocabvault-8ooj.onrender.com`" (already done)
5. Wait for **DNS Verification** — Render checks if DNS records point correctly
6. Once verified, Render automatically issues an **SSL certificate** via Let's Encrypt

---

## 9. Step 8 — SSL Certificate Setup

Render uses **Let's Encrypt** to automatically issue free SSL certificates.

### What Render does automatically:
1. Verifies DNS records point to Render
2. Requests SSL certificate from Let's Encrypt
3. Installs the certificate
4. Redirects all HTTP → HTTPS automatically
5. Auto-renews the certificate before expiry

### CAA Record (if needed):
If certificate issuance fails, you may need to add a **CAA record** in GoDaddy:

| Type | Name | Flag | Tag | Value |
|------|------|------|-----|-------|
| **CAA** | `@` | `0` | `issue` | `letsencrypt.org` |

> A CAA record tells the world which Certificate Authorities are allowed to issue certificates for your domain. If no CAA record exists, any CA can issue (which is also fine).

---

## 10. Troubleshooting Issues We Faced

### Issue 1: `ERR_TOO_MANY_REDIRECTS`
- **Cause:** GoDaddy had a **domain forwarding rule** that conflicted with the DNS records
- **Fix:** Deleted ALL forwarding rules in GoDaddy (Forwarding → Delete)

### Issue 2: `HTTP Status: 404 (not found)`
- **Cause:** Only `versatilesoul.co.in` was added to Render, not the `www` version
- **Fix:** Added `www.versatilesoul.co.in` as a separate custom domain in Render

### Issue 3: `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`
- **Cause:** Multiple issues:
  1. GoDaddy's **parked A records** (`3.33.251.168`, `15.197.225.128`) were still present, pointing away from Render
  2. Missing **CAA record** for Let's Encrypt
- **Fix:**
  1. Deleted all parked/default A records
  2. Ensured only one A record exists: `@ → 216.24.57.1`
  3. Added CAA record for `letsencrypt.org`

### Issue 4: Certificate stuck on "Certificate Error"
- **Cause:** DNS changes hadn't fully propagated + stale certificate state in Render
- **Fix:** Deleted custom domains from Render and re-added them fresh. This forced Render to restart the entire verification and certificate process.

### Issue 5: `vite: not found` during Render build
- **Cause:** `vite` and `@vitejs/plugin-react` were in `devDependencies`. Render only installs `dependencies` in production.
- **Fix:** Moved both packages from `devDependencies` to `dependencies` in `package.json`

### General Tips:
- DNS propagation can take **15 minutes to 24 hours** (check at [dnschecker.org](https://dnschecker.org))
- Always test in an **incognito/private window** to avoid cached errors
- If certificate issuance fails, **delete and re-add** custom domains in Render for a fresh start
- Keep the Render `.onrender.com` URL as a fallback — it always works

---

## 11. Final DNS Records

These are the **only DNS records** needed in GoDaddy:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | `@` | `216.24.57.1` | 600 seconds |
| **CNAME** | `www` | `vocabvault-8ooj.onrender.com` | 1/2 Hour |
| **NS** | `@` | *(GoDaddy nameservers — don't touch)* | 1 Hour |
| **SOA** | `@` | *(auto-managed — don't touch)* | 1 Hour |

Optional records (won't affect the app):
| Type | Name | Value |
|------|------|-------|
| **CAA** | `@` | `0 issue letsencrypt.org` |
| **CNAME** | `_domainconnect` | GoDaddy's domain connect (default) |
| **TXT** | `_dmarc` | DMARC email policy (default) |

---

## 12. How It All Works Together

### Request Flow:

```
1. User types: versatilesoul.co.in
                    │
2. Browser asks DNS: "What's the IP for versatilesoul.co.in?"
                    │
3. GoDaddy DNS responds: "216.24.57.1" (Render's IP)
                    │
4. Browser connects to 216.24.57.1 (Render's server)
                    │
5. Render checks: "Is there an SSL cert?" → Yes → Serves over HTTPS
   (If HTTP request, Render redirects to HTTPS automatically)
                    │
6. Render's Express server receives the request
                    │
7. Is it an API request (/api/...)? 
   ├── YES → Express handles it, queries MongoDB Atlas, returns JSON
   └── NO  → Express serves the React app from /dist/index.html
                    │
8. React app loads in browser, makes API calls to /api/...
                    │
9. User sees VocabVault! 🎉
```

### All Working URLs:

| URL | How it reaches Render |
|-----|----------------------|
| `https://versatilesoul.co.in` | A record → `216.24.57.1` |
| `https://www.versatilesoul.co.in` | CNAME → `vocabvault-8ooj.onrender.com` |
| `https://vocabvault-8ooj.onrender.com` | Direct Render URL |
| `http://versatilesoul.co.in` | Auto-redirected to HTTPS by Render |

---

## Summary

| Component | Service | Cost |
|-----------|---------|------|
| Database | MongoDB Atlas (Free tier) | Free |
| Hosting | Render.com (Free tier) | Free |
| Domain | GoDaddy (`versatilesoul.co.in`) | ~₹199/year |
| SSL Certificate | Let's Encrypt (via Render) | Free |
| **Total** | | **~₹199/year** (domain only) |

The entire hosting stack costs virtually nothing — only the domain renewal fee!
