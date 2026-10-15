# LAURREL SERVICES — PRODUCTION DEPLOYMENT & OPERATIONS HANDOVER

**Document Version**: 2.0.0 (Pre-Deployment Hardening & Staging Baseline)  
**Date**: October 15, 2026  
**Project**: LAURREL SERVICES (Ottawa, Ontario)  
**Primary Repository**: `https://github.com/AleleChi/laurrel.git`  
**Deployment Target Status**: Hardened & Staging Ready  

---

## 1. Executive Summary & Architecture Overview

Laurrel Services is prepared for dual-platform production staging:
- **Frontend**: Next.js 14 App Router hosted on **Netlify**, using dynamic server runtime and SSR (no static exports).
- **Backend API**: Dedicated Express/TypeScript service hosted on **Render**, listening on `0.0.0.0:PORT`.
- **Database**: Dedicated managed **PostgreSQL on Render** with automated idempotent migrations and relational persistence for leads, notes, and AI handoffs.
- **Content & Media CMS**: **Sanity Studio v3** (`studio/`), with all 12 images, 3 hero videos, and editorial text bound to schemas with localized fallbacks.
- **Operations Administration**: Protected `/admin` operations portal with individual administrator accounts, scrypt password hashing, and server-managed `HttpOnly` cookie sessions.
- **Transactional Email**: Unified email service via **Resend** (preferred) or **Shared-Hosting SMTP**, with configurable sender/recipient addresses and preserved root MX records.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PUBLIC INTERNET VISITORS                        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTPS
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   NETLIFY (Next.js 14 App Router)                     │
│  - Public Website & Design System (Ottawa regional focus)             │
│  - Operations Admin Portal UI (/admin)                                 │
│  - Server-Side Route Forwarders (/api/enquire, /api/assistant/chat)   │
│  - Session Auth Guard (laurrel_admin_session HttpOnly cookie)          │
└───────────────┬───────────────────┬─────────────────────┬──────────────┘
                │                   │                     │
    Sanity CDN  │       HTTPS API   │       Client Auth   │
    (Read-only) │       (Private)   │       (HttpOnly)    │
                ▼                   ▼                     ▼
┌──────────────────────┐  ┌────────────────────┐  ┌──────────────────────┐
│  SANITY STUDIO v3    │  │   RENDER BACKEND   │  │   ADMIN BROWSER      │
│  (laurrel.sanity.io) │  │   (Express/TS)     │  │   (Encrypted cookie, │
│  - Hero videos/posters│  │  - Rate Limiter   │  │    zero API secret   │
│  - About & Services  │  │  - Enquiry Engine  │  │    exposure)         │
│  - Overlapping Plans │  │  - Gemini Engine   │  └──────────────────────┘
│  - Contact & Office  │  │  - Resend Email    │
└──────────────────────┘  └─────────┬──────────┘
                                    │ SQL (SSL)
                                    ▼
                          ┌────────────────────┐
                          │ RENDER POSTGRESQL  │
                          │ - enquiries        │
                          │ - enquiry_notes    │
                          │ - ai_handoffs      │
                          │ - admin_users      │
                          │ - quotes/invoices  │
                          └────────────────────┘
```

---

## 2. GitHub Repository & Source Control Verification

| Check | Expected | Result | Notes |
| :--- | :--- | :---: | :--- |
| **Remote Origin** | `https://github.com/AleleChi/laurrel.git` | **Verified** | Synced with GitHub remote |
| **Deployment Branch** | `main` | **Verified** | Clean working tree |
| **Commit History** | Preserved | **Verified** | All historical commits maintained |
| **Private Files** | `.env*`, `data/`, `node_modules/` | **Protected** | Ignored by `.gitignore` |
| **Historical Data Audit**| No leaked live credentials or customer PII | **Passed** | Commit `3d544a8` contained mock test data (`example.ca`), purged in `570ba33`. |

---

## 3. Operations Administration Hardening

### Previous Flaw Remediated
Previously, `/admin` used a single passkey matching `ADMIN_API_SECRET`, stored it in browser `sessionStorage`, and exposed the master backend secret to client-side scripts.

### New Production Architecture
1. **Server-Managed Sessions**:
   - Authentication sets an encrypted, signed `laurrel_admin_session` cookie.
   - Flags: `HttpOnly: true`, `Secure: true` (in production), `SameSite: Lax`, `Path: /`, `Max-Age: 12 hours`.
   - Browser scripts and XSS vectors cannot read or exfiltrate the session token.
2. **Individual Administrator Accounts**:
   - `admin_users` table in PostgreSQL stores individual accounts (`email`, `password_hash`, `name`, `role`, `is_active`, `last_login_at`).
   - Cryptographic hashing: Node `crypto.scryptSync` with unique 16-byte random salts and constant-time verification (`crypto.timingSafeEqual`).
   - Role-based permissions: `'owner'`, `'admin'`, `'dispatcher'`.
3. **Owner Bootstrap Process**:
   - Configured via `ADMIN_OWNER_EMAIL` and `ADMIN_OWNER_PASSWORD`.
   - On server startup, the backend automatically provisions or updates the Owner account in PostgreSQL.
4. **Server-Side API Protection**:
   - `src/app/api/admin/[...slug]/route.ts` verifies the session cookie server-side before contacting Render.
   - Next.js attaches the internal `x-admin-token: ADMIN_API_SECRET` server-to-server. The master secret **never** leaves the server.
   - Unauthenticated visitors cannot view leads, update statuses, or probe backend endpoints.
5. **Account Recovery & AI Handoffs**:
   - Added recovery flow (`/api/admin/auth/recover`) with secure handling.
   - Added dedicated AI Assistant Handoffs review tab in the dashboard for monitoring escalated customer chats.

---

## 4. Sanity Media & CMS Audit

### Studio Build Verification
- Standalone Studio in `studio/` tested with `npm --prefix studio run build`:
  - **Result**: `✓ Build Sanity Studio (48783ms) - Zero errors`.

### Complete Media Inventory & Schema Mapping

| ID | Location | Component | Sanity Schema & Field | Hotspot & Alt | Fallback Asset |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **VID-01** | Home Hero | `HeroVideoRotator` | `homeHero` → `cleaningVideo` | Yes (Poster) | `/assets/videos/clean.mp4` |
| **PST-01** | Home Hero | `HeroVideoRotator` | `homeHero` → `cleaningPoster` | Yes | `/assets/videos/cleaning-poster.jpg` |
| **VID-02** | Home Hero | `HeroVideoRotator` | `homeHero` → `movingVideo` | Yes (Poster) | `/assets/videos/movinng.mp4` |
| **PST-02** | Home Hero | `HeroVideoRotator` | `homeHero` → `movingPoster` | Yes | `/assets/videos/moving-poster.jpg` |
| **VID-03** | Home Hero | `HeroVideoRotator` | `homeHero` → `storageVideo` | Yes (Poster) | `/assets/videos/storagge.mp4` |
| **PST-03** | Home Hero | `HeroVideoRotator` | `homeHero` → `storagePoster` | Yes | `/assets/videos/storage-poster.jpg` |
| **IMG-01** | Home Hero | `HeroVideoRotator` | `homeHero` → `fallbackImage` | Yes | `/assets/hero/laurrel-room.png` |
| **IMG-02** | Home About | `AboutSection` | `homeAbout` → `mainImage` | Yes | `/assets/videos/moving-poster.jpg` |
| **IMG-03** | When Plans Overlap | `WhenPlansOverlap` | `homeOverlappingPlans` → `situations[].image` | Yes | `/assets/videos/cleaning-poster.jpg` |
| **IMG-04** | About Banner | `AboutHeroBanner` | `aboutPage` → `banner.image` | Yes | `/assets/hero/laurrel-room.png` |
| **IMG-05** | About Company | `AboutCompanySection` | `aboutPage` → `aboutCompany.image` | Yes | `/assets/hero/laurrel-room.png` |
| **IMG-06** | About Why Laurrel | `AboutWhySection` | `aboutPage` → `whyLaurrel.image` | Yes | `/assets/videos/moving-poster.jpg` |
| **IMG-07** | About FAQ | `AboutFaqSection` | `aboutPage` → `faq.image` | Yes | `/assets/videos/cleaning-poster.jpg` |
| **IMG-08** | Services Banner | `PageBanner` | `servicesPage` → `banner.image` | Yes | `/assets/hero/laurrel-room.png` |
| **IMG-09** | Services Detail | `ServicesPageClient` | `servicesPage` → `services[0].image` | Yes | `/assets/videos/cleaning-poster.jpg` |
| **IMG-10** | Services Detail | `ServicesPageClient` | `servicesPage` → `services[1].image` | Yes | `/assets/videos/moving-poster.jpg` |
| **IMG-11** | Services Detail | `ServicesPageClient` | `servicesPage` → `services[2].image` | Yes | `/assets/videos/storage-poster.jpg` |
| **IMG-12** | Contact Banner | `PageBanner` | `contactPage` → `banner.image` | Yes | `/assets/hero/laurrel-room.png` |

---

## 5. Render Backend & Database Preparation

### Infrastructure Plans & Pricing

> [!IMPORTANT]
> **Plan Confirmation Before Provisioning:**
> - **Starter Web Service**: **$7 USD / month** (512 MB RAM, 0.5 CPU, 24/7 uptime, no cold starts).
> - **Starter PostgreSQL Database**: **$7 USD / month** (1 GB storage, 256 MB RAM, daily automated backups).
> - **Total Recurring Cost**: **$14 USD / month**.
> 
> *Staging / Zero-Cost Alternative*: You can deploy the web service on Render's **Free** plan ($0/mo, spins down after 15 min idle) and attach a Free PostgreSQL instance (active for 30 days) for initial staging review.

### Database Migration Safety
- Migrations in `backend/src/database/schema.sql` use idempotent `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.
- Non-destructive: Existing rows, customer submissions, and notes are never dropped or truncated.
- Enquiries are saved directly to PostgreSQL (`enquiries` table). Temporary local file storage is only used as a fallback if `DATABASE_URL` is absent.

---

## 6. Transactional Email Configuration

- **Domain Setup Guide**: Documented in `docs/email/resend-domain-setup.md`.
- **Sender Address**: Configurable via `EMAIL_FROM` (e.g. `Laurrel Dispatch <dispatch@laurrelservices.ca>`).
- **Intake Address**: Configurable via `ENQUIRY_TO_EMAIL` (e.g. `info@laurrelservices.ca`).
- **MX Record Safety**: Outbound transactional sending through Resend requires only **TXT (SPF)** and **CNAME (DKIM)** DNS records. Root MX records are **never changed**, keeping existing shared-hosting or business mailboxes active.
- **Shared Hosting SMTP**: Available anytime by switching `EMAIL_PROVIDER=smtp`.

---

## 7. Netlify Configuration

- `netlify.toml` updated to modern standard:
  - Removed redundant manual plugin declaration (`@netlify/plugin-nextjs`) in favor of Netlify's automatic Next.js Runtime (v5).
  - Added HTTP security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`).
  - Next.js API routes run as serverless edge/lambda functions with automated SSR and image optimization via `cdn.sanity.io`.

---

## 8. Staging Deployment Checklist

Follow this exact sequence to deploy staging:

### Step 1: Deploy Render Backend & PostgreSQL
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **Blueprint** → connect `https://github.com/AleleChi/laurrel`.
3. Render reads `render.yaml` and displays the proposed resources (`laurrel-backend-api` and `laurrel-postgres`).
4. Review plan selection (Starter $14/mo or Free).
5. Provide required environment variables:
   - `GEMINI_API_KEY`: (from Google AI Studio)
   - `RESEND_API_KEY`: (from Resend)
   - `EMAIL_FROM`: (e.g. `Laurrel Dispatch <onboarding@resend.dev>` or verified domain)
   - `ENQUIRY_TO_EMAIL`: (your test email address)
   - `ADMIN_OWNER_EMAIL`: `owner@laurrelservices.ca`
   - `ADMIN_OWNER_PASSWORD`: (your chosen strong password)
6. Click **Apply**.
7. Once deployed, note your backend URL: `https://laurrel-backend-api.onrender.com`.
8. Verify health endpoint: `curl https://laurrel-backend-api.onrender.com/health` returns `status: "ok"`.

### Step 2: Deploy Netlify Frontend
1. Log in to [app.netlify.com](https://app.netlify.com).
2. Click **Add new site** → **Import an existing project** → select GitHub repo `AleleChi/laurrel`.
3. Build command: `npm run build` | Publish directory: `.next`.
4. Add environment variables in Netlify Site Settings:
   - `BACKEND_API_URL`: `https://laurrel-backend-api.onrender.com`
   - `ADMIN_API_SECRET`: (matching value from Render)
   - `ADMIN_SESSION_SECRET`: (a random 32-character string)
   - `ADMIN_OWNER_EMAIL`: `owner@laurrelservices.ca`
   - `ADMIN_OWNER_PASSWORD`: (matching value from Render)
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`: (your Sanity Project ID)
   - `NEXT_PUBLIC_SANITY_DATASET`: `production`
   - `SANITY_API_READ_TOKEN`: (optional read token)
5. Click **Deploy Site**.
6. Note your staging URL: `https://<site-name>.netlify.app`.

### Step 3: Configure Sanity Studio
1. In `studio/`:
   ```bash
   npx sanity deploy
   ```
2. Deploys to `https://laurrel.sanity.studio` (or your configured studio hostname).
3. Add your Netlify staging URL (`https://<site-name>.netlify.app`) to Sanity CORS origins at [sanity.io/manage](https://sanity.io/manage).

### Step 4: Staging Verification Run
1. [ ] Load public staging homepage: verify hero video rotation and Ottawa copy.
2. [ ] Submit test enquiry via quote modal: verify reference ID is generated.
3. [ ] Verify email delivery in `ENQUIRY_TO_EMAIL`.
4. [ ] Log in to `/admin` using owner credentials: verify HttpOnly cookie session and enquiry row.
5. [ ] Update enquiry status to `reviewed` and add an internal note: verify persistence in PostgreSQL.
6. [ ] Test AI Assistant chat: verify response and Ottawa context.
