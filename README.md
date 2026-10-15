# LAURREL SERVICES

> **Clean spaces. Smooth moves. Secure storage in Ottawa, Ontario.**

LAURREL SERVICES is a high-performance web platform and operations suite for a premier Ottawa service business providing residential and commercial Cleaning, Moving coordination, and Transitional Storage.

---

## 1. Architectural Overview

```
                      ┌────────────────────────────────────────┐
                      │             CLIENT BROWSERS            │
                      └───────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┴────────────────────────┐
                  ▼                                                ▼
       ┌──────────────────────┐                         ┌──────────────────────┐
       │   NETLIFY FRONTEND   │                         │  SANITY STUDIO (v3)  │
       │ Next.js 14 App Router│                         │ Content Management   │
       │  laurrelservices.ca  │                         │ laurrel.sanity.studio│
       └──────────┬───────────┘                         └──────────┬───────────┘
                  │                                                │
                  │ (Server Forwarding)                            │ (Published Content)
                  ▼                                                ▼
       ┌──────────────────────┐                         ┌──────────────────────┐
       │    RENDER BACKEND    │◄────────────────────────┤  SANITY CONTENT API  │
       │ Express / TypeScript │                         └──────────────────────┘
       │ api.laurrelservices  │
       └──────────┬───────────┘
                  │
        ┌─────────┴─────────┬───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ RENDER POSTGRES│  │  RESEND EMAIL  │  │ GOOGLE GEMINI │
│ Customer Leads │  │ Ottawa Dispatch│  │  AI Assistant │
└───────────────┘   └───────────────┘   └───────────────┘
```

- **Frontend**: Next.js 14 (App Router, React 18, Tailwind CSS, Framer Motion) hosted on **Netlify**.
- **Backend API**: Dedicated Express/TypeScript service on **Render**, binding to `0.0.0.0:PORT`.
- **Database**: Managed **PostgreSQL on Render** for customer enquiries, activity logs, and AI handoffs.
- **CMS**: Standalone **Sanity Studio v3** (`studio/`) deploying to `laurrel.sanity.studio`.
- **Transactional Email**: **Resend** (preferred) or shared-hosting SMTP with verified sender and reply-to.
- **AI Customer Assistant**: Grounded **Google Gemini 2.5-flash** with Canadian English style restraint and local rule-based fallback.
- **Operations Dashboard**: Authenticated `/admin` dashboard for viewing leads, AI handoffs, and updating status.

---

## 2. Directory Structure

```text
laurrel/
├── src/                               # Next.js 14 Frontend Application
│   ├── app/
│   │   ├── page.tsx                   # Homepage (Hero Video Rotator, Ticker, About, Services, FAQ)
│   │   ├── about/page.tsx             # Dedicated About Page
│   │   ├── services/page.tsx          # Services Page (Cleaning, Moving, Storage, Sidebar Form)
│   │   ├── contact/page.tsx           # Contact Page (Interactive Ottawa Map & Dispatch Form)
│   │   ├── admin/page.tsx             # Protected Operations Administration Dashboard
│   │   └── api/                       # Next.js Route Handlers (Enquiry & Assistant Forwarders)
│   ├── components/                    # Reusable UI & Layout Components
│   ├── content/site.ts                # Centralized Typed Fallback Content & Design Tokens
│   ├── lib/                           # Shared Types, Validators, and Utilities
│   └── sanity/                        # Sanity Client, Image Helpers, and Schema Types
├── backend/                           # Dedicated Render Backend API Service
│   ├── src/
│   │   ├── database/                  # PostgreSQL Pool, Schema DDL, and Repositories
│   │   ├── middleware/                # Admin Token Authentication & CORS
│   │   ├── routes/                    # Health, Enquire, Assistant Chat, and Admin APIs
│   │   ├── services/                  # Email Providers (Resend/SMTP) & Gemini Engine
│   │   └── index.ts                   # Express Server Entrypoint
│   ├── package.json
│   └── tsconfig.json
├── studio/                            # Standalone Sanity Studio v3 Workspace
│   ├── sanity.cli.ts
│   ├── sanity.config.ts
│   └── package.json
├── public/assets/                     # Video MP4s, Posters, Photography, and Brand Marks
└── docs/                              # Deployment Audits, Architecture, and CMS Inventories
```

---

## 3. Local Development Setup

### Prerequisites
- Node.js 20.x or later
- npm 10.x or later

### Step 1: Install Frontend Dependencies
```bash
npm install
```

### Step 2: Install Backend Dependencies
```bash
npm --prefix backend install
```

### Step 3: Install Sanity Studio Dependencies
```bash
npm --prefix studio install --legacy-peer-deps
```

### Step 4: Configure Local Environment
Copy `.env.example` to `.env.local` in the project root:
```bash
cp .env.example .env.local
```

### Step 5: Start Development Servers
- **Frontend** (`http://localhost:3000`):
  ```bash
  npm run dev
  ```
- **Backend API** (`http://localhost:5000`):
  ```bash
  npm --prefix backend run dev
  ```
- **Sanity Studio** (`http://localhost:3333`):
  ```bash
  npm --prefix studio run dev
  ```

---

## 4. Building for Production

### Frontend Build (Netlify)
```bash
npx tsc --noEmit
npm run build
```

### Backend Build (Render)
```bash
npm --prefix backend run build
```

---

## 5. Deployment Procedures

### A. Dedicated Backend on Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect repository: `https://github.com/AleleChi/laurrel.git` (branch `main`).
3. Set **Root Directory** to `backend`.
4. Configure commands:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
5. Create a **PostgreSQL Database** on Render:
   - Copy the database internal/external connection string.
   - Add `DATABASE_URL` to the Web Service environment variables.
6. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `FRONTEND_ORIGIN=https://laurrelservices.ca`
   - `ADMIN_API_SECRET=<your-chosen-secure-passkey>`
   - `RESEND_API_KEY=<your-resend-key>`
   - `EMAIL_FROM=Laurrel Dispatch <dispatch@laurrelservices.ca>`
   - `ENQUIRY_TO_EMAIL=info@laurrelservices.ca`
   - `GEMINI_API_KEY=<your-gemini-key>`

### B. Frontend on Netlify
1. Create a new site from Git on [Netlify](https://netlify.com).
2. Connect `https://github.com/AleleChi/laurrel.git` (branch `main`).
3. Build Settings:
   - **Base directory**: Leave empty (root)
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
4. Add environment variables in Netlify:
   - `BACKEND_API_URL=https://<your-render-service>.onrender.com`
   - `ADMIN_API_SECRET=<matching-admin-secret>`
   - `NEXT_PUBLIC_SANITY_PROJECT_ID=<your-sanity-project-id>`
   - `NEXT_PUBLIC_SANITY_DATASET=production`
   - `NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01`
   - `SANITY_API_READ_TOKEN=<read-token>`

### C. Sanity Studio Hosted Deployment
1. Navigate to `studio/`:
   ```bash
   cd studio
   npx sanity deploy
   ```
2. Choose a studio hostname (e.g. `laurrel.sanity.studio`).
3. Authorize editors through [Sanity Management](https://www.sanity.io/manage).

---

## 6. Testing & Quality Assurance

- **TypeScript Verification**:
  ```bash
  npx tsc --noEmit
  npm --prefix backend run build
  ```
- **Backend Health Check**:
  ```bash
  curl https://api.laurrelservices.ca/health
  # Response: {"status":"ok","service":"laurrel-backend-api","databaseConfigured":true}
  ```
- **Operations Dashboard**:
  Visit `/admin` on the website, enter your configured `ADMIN_API_SECRET`, and view submitted leads, notes, and AI handoffs.

---

## 7. Factual Integrity & Privacy Rules

- **Spelling**: Spell **LAURREL** consistently across all interfaces.
- **Geographic Area**: Services are strictly focused within **Ottawa, Ontario and the National Capital Region**. Inquiries outside this region require direct staff review.
- **Customer Privacy**: Customer messages and contact details are stored in secured database records and never logged to public application consoles or committed to Git.
- **Honest Communications**: We never publish unverified client totals, fake review counts, unconfirmed guarantees, or invented rates.
