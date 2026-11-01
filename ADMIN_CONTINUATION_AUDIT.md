# LAURREL SERVICES — ADMINISTRATIVE APPLICATION CONTINUATION AUDIT

**Target Application:** Laurrel Services Operations & Dispatch Portal  
**Public Website:** [https://laurrelservices.com](https://laurrelservices.com)  
**Admin Portal:** [https://laurrelservices.com/admin](https://laurrelservices.com/admin)  
**Backend API:** [https://laurrel-backend-api.onrender.com](https://laurrel-backend-api.onrender.com)  
**Repository:** [AleleChi/laurrel](https://github.com/AleleChi/laurrel) (Branch: `main`)  
**Audit Date:** November 1, 2026  
**Auditors:** Principal Full-Stack Engineer, Admin Product Designer, Database Architect, Security Engineer & QA Lead  
**Assessment Type:** Read-Only Technical Architecture & UI/UX Audit (Non-destructive)

---

## 1. Executive Summary

This audit assesses the current state of the administrative application for **Laurrel Services** following the completion and production release of the public-facing website. The admin portal is an integrated operations platform managing customer enquiries, appointment scheduling, website content (CMS), and media assets for residential and commercial cleaning, moving, and storage services across Ottawa and the National Capital Region.

### Key Audit Findings
1. **Architecture & Foundation:** The system possesses a sound enterprise foundation. The Next.js 14 App Router frontend proxies administrative requests through a secure server-side gateway to an Express backend backed by a managed Neon PostgreSQL database with SSL encryption. Production storage leverages Cloudflare R2 for zero-egress asset distribution.
2. **Security & Authentication:** Robust security controls are operational. Authentication utilizes Argon2id password hashing with legacy scrypt upgrade paths, progressive 15-minute account lockouts after 5 failed attempts, server-side session tracking in PostgreSQL (`admin_sessions`), and role-based access control (RBAC) enforced on Express backend endpoints.
3. **Confirmed Operational Defects:**
   - **P0 Defect (Appointment Settings Route Collision):** Navigating to `/admin/appointments/settings` results in an HTTP 404 error (`{"error":"Appointment not found."}`). The parameterized route `/api/admin/appointments/:id` in `backend/src/routes/appointments.ts` shadows the literal route `/api/admin/appointments/settings` in `appointmentSettingsRouter` due to Express middleware mounting order in `backend/src/index.ts`.
   - **P1 Defect (AI Human Handoff Action Missing):** The enquiries interface lists pending customer callback handoffs from the AI assistant, but lacks interactive resolution/dismissal action controls.
   - **P1 Defect (Media Library Video Preload Warnings):** Video assets in the media catalog trigger aborted network requests in Chromium because `<video>` elements lack poster attributes and preload constraints.
4. **Overall Health:** The administrative application is approximately **85% complete**. Core workflows for enquiry assessment, status management, consultation scheduling, content revision rollback, and media cataloging are functional, secure, and visually cohesive with the approved Laurrel brand identity.

---

## 2. Current Architecture

```
[ Public Customer ] ---> Next.js 14 Frontend (Netlify CDN)
                                |
[ Staff Dispatcher ] ---> /admin (Authenticated Session Cookie: laurrel_admin_session)
                                |
                   Next.js API Gateway Proxy
                   (src/app/api/admin/[...slug]/route.ts)
                                |  HMAC Token / Session Verification
                                v
               Express Business Backend (Render)
            (https://laurrel-backend-api.onrender.com)
            |                   |                    |
            v                   v                    v
     Neon PostgreSQL      Cloudflare R2        Resend / SMTP
     (Managed DB)         (Media Storage)      (Email Delivery)
```

### 2.1 Technology Stack
- **Frontend Framework:** Next.js 14.2.18 (App Router), React 18, TypeScript (Strict).
- **Styling & UI:** Tailwind CSS 3.4, Lucide React icons, Recharts for analytics data visualization.
- **Backend Service:** Express 4.21 with TypeScript (`ts-node`), Argon2id password hashing, Multer memory storage.
- **Database:** Neon PostgreSQL with connection pooling (`pg` 8.13), 21 relational tables, full audit logging.
- **Storage Infrastructure:** Cloudflare R2 (`@aws-sdk/client-s3`) in production; local disk storage provider for offline development.
- **Email Providers:** Modular provider interface supporting Resend and standard SMTP with automatic fallback.

### 2.2 Repository Organization
```
laurrel/
├── src/
│   ├── app/
│   │   ├── admin/                    # Admin Portal Routes (SSR + Client Components)
│   │   │   ├── appointments/         # Calendar, Agenda, Consultation Dispatch
│   │   │   │   └── settings/         # Business Hours, Buffer, OAuth Config
│   │   │   ├── enquiries/            # Inbound Leads & AI Handoff Management
│   │   │   ├── forgot-password/      # Password Recovery Request
│   │   │   ├── login/                # Authenticated Sign-in
│   │   │   ├── media/                # Asset Catalog & Usage Tracking
│   │   │   ├── reset-password/       # Token-based Password Reset
│   │   │   ├── website/              # CMS Page Overviews
│   │   │   │   ├── [pageId]/         # Page Section & SEO Editor
│   │   │   │   └── preview/[pageId]/ # Draft Content Preview Sandbox
│   │   │   ├── layout.tsx            # Persistent Admin Shell (Sidebar, Header, Time)
│   │   │   └── page.tsx              # Operations Overview Dashboard
│   │   └── api/admin/                # Server-side Gateway Proxies
│   ├── components/admin/             # Reusable UI & Domain Components
│   │   ├── cms/                      # Specialized Page & Section Editors
│   │   ├── media/                    # Media Drawers, Pickers, Upload Modals
│   │   └── ui/                       # Design System Primitives (Badges, Buttons, Dialogs)
│   └── lib/auth/session.ts           # Tamper-proof HMAC Session Token Logic
└── backend/
    ├── src/
    │   ├── database/                 # Repositories, Schemas & Migrations
    │   ├── middleware/auth.ts        # RBAC & Database Session Verification
    │   ├── routes/                   # Express REST Route Handlers
    │   └── services/                 # Email, Video, Storage & Availability Engines
```

---

## 3. Admin Route Inventory

| Route | File Path | Access Level | Implemented Status | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| `/admin` | `src/app/admin/page.tsx` | All Staff | Complete | Verified Working (HTTP 200) |
| `/admin/login` | `src/app/admin/login/page.tsx` | Public | Complete | Verified Working (HTTP 200) |
| `/admin/forgot-password` | `src/app/admin/forgot-password/page.tsx` | Public | Complete | Verified Working (HTTP 200) |
| `/admin/reset-password` | `src/app/admin/reset-password/page.tsx` | Public | Complete | Verified Working (HTTP 200) |
| `/admin/enquiries` | `src/app/admin/enquiries/page.tsx` | All Staff | Complete | Verified Working (HTTP 200) |
| `/admin/appointments` | `src/app/admin/appointments/page.tsx` | All Staff | Complete | Verified Working (HTTP 200) |
| `/admin/appointments/settings`| `src/app/admin/appointments/settings/page.tsx`| Owner / Admin | Broken (Route Collision)| **Failed (HTTP 404 on API)** |
| `/admin/website` | `src/app/admin/website/page.tsx` | All Staff | Complete | Verified Working (HTTP 200) |
| `/admin/website/[pageId]` | `src/app/admin/website/[pageId]/page.tsx`| Editor+ | Complete | Verified Working (HTTP 200) |
| `/admin/website/preview/[pageId]`| `src/app/admin/website/preview/[pageId]/page.tsx`| Editor+ | Partial | Implemented (Sandbox Mode) |
| `/admin/media` | `src/app/admin/media/page.tsx` | All Staff | Complete | Verified Working (HTTP 200) |

---

## 4. Module-by-Module Functionality Assessment

### 4.1 Overview Dashboard (`/admin`)
- **Status:** **Verified Working**
- **Data Source:** Live SQL aggregate metrics via `GET /api/admin/stats` querying `enquiries`, `appointments`, and `ai_handoffs`. Zero mock data.
- **Verified Metrics:**
  - Total enquiries (All-time: 22 records verified in PostgreSQL).
  - Awaiting Review count (15 new records).
  - Upcoming consultations count (8 confirmed records).
  - Callback requests (5 pending handoff records).
  - 60-day interactive activity timeline chart using `Recharts` area curve with custom brand tooltips.
  - Service demand percentage distribution (Moving, Cleaning, Storage).
  - Recent customer submissions table with direct navigation to lead review.
  - Live Ottawa Dispatch Time clock updated every 30 seconds (`America/Toronto`).
- **Defects & Gaps:**
  - The reporting period for the activity timeline is hardcoded to 60 days in SQL; dynamic date filtering (7d, 30d, 90d, YTD) is not yet exposed in the UI.

### 4.2 Customer Enquiries & Lead Management (`/admin/enquiries`)
- **Status:** **Verified Working**
- **Data Source:** PostgreSQL `enquiries` and `enquiry_notes` tables via `GET /api/admin/enquiries`.
- **Verified Capabilities:**
  - Automatic lead reception from public quote request modals and contact form submissions.
  - Search across customer name, email, telephone number, and Ottawa service address.
  - Status filter tabs: *All, New (Awaiting Review), Reviewed, Quoted, Scheduled, Closed*.
  - Lead detail drawer with complete service requirements, timing preference, and source attribution.
  - Status updates (`PATCH /api/admin/enquiries/:id/status`) with atomic database transactions.
  - Internal administrative notes timeline attributing notes to authenticated session identity.
  - One-click consultation booking trigger opening `ScheduleMeetingModal` with customer details pre-filled.
- **Defects & Gaps:**
  - In the "AI Callback Requests" tab, staff can review handoff context, but there are no interactive status buttons (*Mark Contacted*, *Dismiss*) to update `ai_handoffs.status`.

### 4.3 Appointments & Consultation Dispatch (`/admin/appointments`)
- **Status:** **Verified Working (Core) / Broken (Settings)**
- **Data Source:** PostgreSQL `appointments`, `appointment_activity`, and `appointment_notifications`.
- **Verified Capabilities:**
  - Table View and Agenda View modes.
  - Status filters (*Pending, Confirmed, Completed, Rescheduled, Cancelled*).
  - Consultation creation with automated conflict checking against staff schedules.
  - Rescheduling workflow with historical linkage via `rescheduled_from_id`.
  - Cancellation dialog with mandatory cancellation reason and optional customer notification dispatch.
  - ICS calendar invite generation (`generateIcsInvitation`) with meeting attachments.
  - Timezone lock to Ottawa (`America/Toronto`) across all date/time presentation helpers.
- **Confirmed Defects:**
  - **P0 Defect:** `/admin/appointments/settings` fails to load configuration data due to route collision in backend Express router.

### 4.4 Website Content Management (`/admin/website`)
- **Status:** **Verified Working**
- **Data Source:** PostgreSQL `cms_pages`, `cms_sections`, `cms_revisions`, and `cms_site_settings`.
- **Verified Capabilities:**
  - Management of all 4 core pages (*Homepage, About Us, Services, Contact*).
  - Structured editors for heroes, company story, service highlights, process steps, and FAQs.
  - SEO metadata editor with live Google SERP snippet preview and OpenGraph image selection.
  - Seamless media picker integration (`MediaPickerModal`) linking directly to media catalog.
  - Non-destructive draft editing: Saving a draft updates `cms_sections.draft_content` without modifying the live public website.
  - Transactional publishing: Generates an immutable snapshot in `cms_revisions`, updates `cms_sections.content`, and logs audit trail.
  - Point-in-time rollback: One-click restoration of any past revision snapshot.
  - Granular permissions: Content editors can draft; only Owners and Admins can publish or rollback.

### 4.5 Media Library (`/admin/media`)
- **Status:** **Verified Working**
- **Data Source:** PostgreSQL `media_assets` table; physical assets in Cloudflare R2 and local storage.
- **Verified Capabilities:**
  - Drag-and-drop file uploads with magic byte validation (verifies real headers for JPEG, PNG, WebP, AVIF, MP4, WebM; rejects disguised executables and unescaped SVG).
  - Folder categorization (*General, Hero, About, Services, Brand, Videos*).
  - Media search and sorting (by date, filename, file size).
  - Asset detail drawer with copyable public URL, preview, and metadata editing (alt text, caption, focal point).
  - **Guarded Deletion:** Multi-tier safeguard checks `getMediaAssetUsage()`. Deletion is strictly blocked if an asset is actively referenced on a published public page or preserved in revision history.

---

## 5. Database and API Dependencies

### 5.1 Database Entity State (Neon PostgreSQL)
All 21 production tables are initialized and populated:
- `enquiries`: 22 rows (15 new, 1 reviewed, 1 quoted, 5 scheduled)
- `enquiry_notes`: 21 rows
- `ai_handoffs`: 5 rows
- `appointments`: 8 rows (all confirmed)
- `appointment_activity`: 5 rows
- `appointment_notifications`: 1 row
- `appointment_settings`: 1 row (default configuration)
- `provider_integrations`: 3 rows (`google_meet`, `ms_teams`, `zoom` - all disconnected)
- `cms_pages`: 4 rows (`home`, `about`, `services`, `contact`)
- `cms_sections`: 26 rows across all 4 pages
- `cms_revisions`: 23 historical published snapshots
- `cms_site_settings`: 3 records
- `media_assets`: 26 records (20 local fallback, 6 production R2)
- `admin_users`: 5 accounts (1 owner, 1 admin, 2 operations staff, 1 viewer)
- `admin_sessions`: 50 sessions
- `admin_auth_events`: 81 logged security events
- `audit_logs`: 49 operational audit records

### 5.2 External Service Dependencies
- **Render Backend API:** Operational (`HTTP 200 /ready`).
- **Cloudflare R2:** Operational for media asset hosting.
- **Google OAuth / Google Meet:** Disconnected in production (credentials unconfigured). System safely falls back to manual video links and telephone consultations.
- **Email Delivery:** Operational with Resend / SMTP fallbacks.

---

## 6. UI/UX Findings

### 6.1 Design Integrity & Brand Alignment
- **Color System:** Adheres strictly to approved Laurrel tokens:
  - Deep brand purple (`#390044` / `#49056B`) utilized for primary accents, brand headers, and key tiles.
  - Brand orange (`#FE6000`) applied to action-required indicators, attention badges, and review triggers.
  - Brand lime (`#C8E80B`) reserved for chart activity curves and watermarks.
  - Neutral warm background (`#F8F7F4`) provides high visual comfort for extended dispatcher usage.
- **Typography:** Consistent application of **Manrope** across all headers, tables, badges, and drawers.
- **Layout Rhythm:** Inspired by professional dispatch consoles (WowDash / Geex patterns):
  - Collapsible desktop sidebar (64px collapsed, 256px expanded).
  - Mobile slide-out drawer with backdrop blur.
  - Sticky header bar housing live Ottawa time and user profile badge.
  - Restrained cards with subtle borders (`border-zinc-200/80`) and minimal shadows (`shadow-2xs`).
  - Zero decorative AI clichés, glowing borders, or unnecessary gradients.

### 6.2 Ergonomics & Accessibility
- **Table Density:** Compact, readable row heights with clear column hierarchy and responsive cell truncation.
- **Status Indicators:** Restrained badge treatments using distinct color pairs (Orange for Awaiting Review, Purple for Quoted, Emerald for Scheduled, Zinc for Closed).
- **Usability Gaps:**
  - Video cards in the media library display default browser player controls without custom poster images, causing layout shifts during asset scanning.
  - Status filter buttons in the enquiry list lack clear active counts inline (e.g. *Awaiting Review (15)*).

---

## 7. Security and Permissions Audit

### 7.1 Role-Based Access Control (RBAC) Matrix

| Operation / Endpoint | Owner | Admin | Content Editor | Operations Staff | Viewer | System Credential |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| View Overview Dashboard (`/stats`) | Allowed | Allowed | Allowed | Allowed | Allowed | Denied |
| List & View Enquiries (`/enquiries`) | Allowed | Allowed | Allowed | Allowed | Allowed | Denied |
| Update Enquiry Status (`/status`) | Allowed | Allowed | Denied | Allowed | Denied | Denied |
| Schedule Consultations (`/appointments` POST)| Allowed | Allowed | Denied | Allowed | Denied | Denied |
| Cancel Consultations (`/cancel` POST) | Allowed | Allowed | Denied | Allowed | Denied | Denied |
| View CMS Pages & Revisions | Allowed | Allowed | Allowed | Allowed | Allowed | Denied |
| Save CMS Draft (`/draft` PATCH) | Allowed | Allowed | Allowed | Denied | Denied | Denied |
| Publish CMS Page (`/publish` POST) | Allowed | Allowed | **Denied (403)**| **Denied (403)**| **Denied (403)**| Denied |
| Rollback Revision (`/restore` POST) | Allowed | Allowed | **Denied (403)**| **Denied (403)**| **Denied (403)**| Denied |
| Upload & Edit Media Assets | Allowed | Allowed | Allowed | Denied | Denied | Denied |
| Delete Media Asset (`/media/:id` DELETE) | Allowed | Allowed | **Denied (403)**| **Denied (403)**| **Denied (403)**| Denied |
| Edit Appointment Settings (`/settings` PATCH)| Allowed | Allowed | **Denied (403)**| **Denied (403)**| **Denied (403)**| Denied |

### 7.2 Security Verification Proofs
1. **Server-Side Enforcement:** RBAC permissions are validated directly inside backend Express middleware (`backend/src/middleware/auth.ts:requireRole`). Bypassing client-side button states produces immediate HTTP 403 Forbidden responses.
2. **Session Integrity:** Every authenticated request verifies the database session against `admin_sessions`. Revoked or expired sessions return HTTP 401 instantly.
3. **Password Security:** Hashes start with `$argon2id$v=19$m=65536,t=3,p=4$`. Lockout parameters enforce a strict 15-minute wait after 5 failed attempts.
4. **Data Sanitization:** Media uploads strictly check magic bytes against known signatures. CMS inputs are scrubbed of executable scripts and malicious attribute payloads.

---

## 8. Existing Tests & Verification Results

### 8.1 Automated Suite Results
- **Frontend TypeScript (`npx tsc --noEmit`):** **0 errors** (Clean compilation).
- **Backend TypeScript (`cd backend; npx tsc --noEmit`):** **0 errors** (Clean compilation).
- **Production Build (`npm run build`):** **Successful** (30/30 static and dynamic routes compiled).
- **Backend Readiness Probe (`GET /ready`):** **HTTP 200** (`database: "connected"`, `migrations: "applied"`, `storageProvider: "r2"`).
- **Local Formatter Test (`scripts/test-formatters.js`):** **Passed** (Ottawa timezone calculations validated).

---

## 9. Confirmed Issues

### Priority 0 — Critical / Blocker
- **ISSUE-01: Express Route Collision on `/api/admin/appointments/settings`**
  - **Symptom:** Admin Appointment Settings screen fails to load and console logs HTTP 404.
  - **Confirmed Cause:** Parameterized route `GET /api/admin/appointments/:id` in `appointmentsRouter` matches `:id = 'settings'` before `appointmentSettingsRouter` is evaluated. Returns `{"error":"Appointment not found."}`.
  - **Impact:** Administrators cannot view or configure dispatch working hours, appointment buffers, or Google Calendar OAuth settings.

### Priority 1 — High Operational Priority
- **ISSUE-02: Missing Action Controls for AI Callback Requests**
  - **Symptom:** AI assistant handoffs cannot be marked as contacted, resolved, or dismissed from the enquiries interface.
  - **Confirmed Cause:** Missing PATCH endpoint for `ai_handoffs` status and lack of action buttons in `src/app/admin/enquiries/page.tsx`.
- **ISSUE-03: Media Library Video Preload Abort Warnings**
  - **Symptom:** Navigating to Media Library triggers console network aborts for video assets (`clean.mp4`, `movinng.mp4`, `storagge.mp4`).
  - **Confirmed Cause:** `<video>` elements in grid cells lack `preload="none"` and default poster frames, causing Chromium to initiate and immediately drop binary video range requests.
- **ISSUE-04: Billing & Invoicing Module UI Route Unmounted**
  - **Symptom:** Invoicing and quoting domain models exist in PostgreSQL, but there is no navigation entry or UI screen for staff to manage customer billing quotes.

### Priority 2 — Usability & Workflow Ergonomics
- **ISSUE-05: Fixed 60-Day Date Window on Overview Dashboard**
  - **Symptom:** Dispatchers cannot filter activity charts by custom date periods (e.g., 7 days, 30 days, Year-to-Date).
- **ISSUE-06: CSV Export Missing for Customer Enquiries**
  - **Symptom:** Dispatchers cannot export filtered lead lists for offline reporting or accounting reconciliation.
- **ISSUE-07: Enquiry Status Pill Counts Omitted**
  - **Symptom:** Status filter tabs on `/admin/enquiries` do not display count badges (e.g. *Awaiting Review (15)*), forcing staff to click tabs to see volume.

### Priority 3 — Polish & Infrastructure Enhancements
- **ISSUE-08: CMS Live Preview Uses Sandbox Rather Than Native Next.js Draft Mode**
  - **Symptom:** Previewing draft CMS changes relies on client-side iframe rendering rather than Next.js server-side draft cookies.

---

## 10. Prioritised Improvements

1. **Fix Route Shadowing on Appointment Settings (P0):** Ensure literal administrative sub-routes are mounted and matched before generic ID parameters.
2. **Implement AI Handoff Status Controls (P1):** Provide interactive *Mark Resolved* and *Dismiss* actions directly inside the Enquiries UI.
3. **Optimize Media Library Video Rendering (P1):** Add `preload="none"` and poster frames to eliminate aborted video requests.
4. **Add Enquiry CSV Export (P2):** Enable client-side/server-side CSV export of filtered customer leads.
5. **Add Dynamic Reporting Periods to Overview (P2):** Allow switching between 7-day, 30-day, and 60-day views.
6. **Add Count Badges to Enquiry Status Tabs (P2):** Display real-time badge counters on each filter tab.

---

## 11. Recommended Implementation Order

```
Sprint 1 (Immediate Fixes & Operational Polish)
  ├── Step 1: Reorder appointments routers to resolve ISSUE-01 (P0)
  ├── Step 2: Implement AI handoff status PATCH & UI buttons for ISSUE-02 (P1)
  ├── Step 3: Add preload="none" & posters to video cards for ISSUE-03 (P1)
  └── Step 4: Add status count badges to enquiry filter tabs (P2)

Sprint 2 (Analytics & Data Portability)
  ├── Step 1: Implement dynamic date range selector on Overview Dashboard (P2)
  └── Step 2: Implement CSV lead export on Enquiries page (P2)

Sprint 3 (Billing & Quoting Interface)
  └── Step 1: Build /admin/quotes interface connecting existing database schema (P1)
```

---

## 12. Exact Files Requiring Modification

| File Path | Purpose of Modification |
| :--- | :--- |
| `backend/src/index.ts` | Mount `appointmentSettingsRouter` prior to `appointmentsRouter` to eliminate route shadowing. |
| `backend/src/routes/appointments.ts` | Ensure parameterized route `/:id` validates format or delegates known literal sub-routes. |
| `backend/src/routes/admin.ts` | Add `PATCH /api/admin/handoffs/:id/status` endpoint to support AI handoff resolution. |
| `backend/src/database/enquiryRepo.ts` | Add database helper `updateAiHandoffStatus(id, status, notes)`. |
| `src/app/admin/enquiries/page.tsx` | Add action buttons to the AI Callback Requests tab; add status badge counts to tabs. |
| `src/app/admin/media/page.tsx` | Add `preload="none"` and poster fallbacks to video asset cards. |
| `src/app/admin/page.tsx` | Connect dynamic date range filter dropdown to stats query. |

---

## 13. Screenshots of the Current Admin Interface

*Authenticated screenshots captured directly from the live application:*

### 13.1 Sign-in Experience
![Admin Login Screen](file:///C:/Users/alele/.gemini/antigravity/brain/c70a239b-70e3-4f46-8e85-097913698ed0/01-admin-login-desktop.png)

### 13.2 Operations Overview Dashboard
![Overview Dashboard Desktop](file:///C:/Users/alele/.gemini/antigravity/brain/c70a239b-70e3-4f46-8e85-097913698ed0/02-admin-overview-desktop.png)
![Overview Dashboard Mobile](file:///C:/Users/alele/.gemini/antigravity/brain/c70a239b-70e3-4f46-8e85-097913698ed0/02-admin-overview-mobile.png)

### 13.3 Customer Enquiries & Dispatch Management
![Customer Enquiries Desktop](file:///C:/Users/alele/.gemini/antigravity/brain/c70a239b-70e3-4f46-8e85-097913698ed0/03-admin-enquiries-desktop.png)
![Customer Enquiries Mobile](file:///C:/Users/alele/.gemini/antigravity/brain/c70a239b-70e3-4f46-8e85-097913698ed0/03-admin-enquiries-mobile.png)

### 13.4 Appointments & Consultations
![Appointments Desktop](file:///C:/Users/alele/.gemini/antigravity/brain/c70a239b-70e3-4f46-8e85-097913698ed0/04-admin-appointments-desktop.png)

### 13.5 Website Content (CMS) Overview & Section Editor
![Website CMS Overview](file:///C:/Users/alele/.gemini/antigravity/brain/c70a239b-70e3-4f46-8e85-097913698ed0/06-admin-website-overview-desktop.png)
![Homepage Section Editor](file:///C:/Users/alele/.gemini/antigravity/brain/c70a239b-70e3-4f46-8e85-097913698ed0/07-admin-website-home-editor-desktop.png)

### 13.6 Media Library
![Media Library Desktop](file:///C:/Users/alele/.gemini/antigravity/brain/c70a239b-70e3-4f46-8e85-097913698ed0/08-admin-media-library-desktop.png)
![Media Library Mobile](file:///C:/Users/alele/.gemini/antigravity/brain/c70a239b-70e3-4f46-8e85-097913698ed0/08-admin-media-library-mobile.png)

---

## 14. Proposed First Implementation Sprint

**Sprint Goal:** Resolve the critical P0 Appointment Settings bug, implement AI callback handoff resolution, optimize media library video handling, and add enquiry count badges.

### Scope of Work
1. **Task 1 (P0): Fix Express Router Mounting Order in `backend/src/index.ts`**
   - Mount `app.use(appointmentSettingsRouter)` before `app.use(appointmentsRouter)`.
   - Add negative lookahead or explicit literal route check to `GET /api/admin/appointments/:id` so it never captures `'settings'`.
   - Verify `/api/admin/appointments/settings` returns HTTP 200 with full configuration payload.
2. **Task 2 (P1): Implement AI Handoff Status Actions**
   - Implement `PATCH /api/admin/handoffs/:id/status` accepting `status: 'resolved' | 'dismissed'`.
   - Add "Resolve" and "Dismiss" buttons in the AI Callback Requests tab on `/admin/enquiries`.
3. **Task 3 (P1): Fix Media Library Video Aborts**
   - In `src/app/admin/media/page.tsx` and `MediaDetailDrawer.tsx`, add `preload="none"` to all `<video>` elements.
   - Use assigned `thumbnail_url` or fallback poster images for video tiles.
4. **Task 4 (P2): Enquiry Status Count Badges**
   - Calculate live counts per status tab directly from enquiry state and display subtle badge pills (*e.g. "Awaiting Review (15)"*).
5. **Verification & Regression Testing:**
   - Execute TypeScript check and full production build.
   - Run browser automation verification on all modified views.
