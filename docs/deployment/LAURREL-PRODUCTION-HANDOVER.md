# LAURREL SERVICES — PRODUCTION DEPLOYMENT & OPERATIONS HANDOVER

**Document Date**: October 15, 2026  
**Project**: LAURREL SERVICES (Ottawa, Ontario)  
**Primary Repository**: `https://github.com/AleleChi/laurrel.git`  
**Deployment Target Status**: Ready for Staging & Production Activation

---

## 1. GitHub Repository & Source Control

| Parameter | Value | Verification Status |
| :--- | :--- | :---: |
| **Repository URL** | `https://github.com/AleleChi/laurrel.git` | **Verified** |
| **Deployment Branch** | `main` | **Verified** |
| **Commit ID** | `69da74a7ccdde01b14e41a87aa477e9a1c65420f` | **Verified on Remote** |
| **Commit Message** | `feat(deployment): configure production architecture with dedicated Render backend, PostgreSQL schema, unified email, Sanity hero media, and operations admin` | **Verified** |
| **Remote Push Confirmation** | Pushed successfully to `origin/main` (verified via `git ls-remote origin`) | **100% Synced** |
| **Security Audit Status** | Clean. No passwords, private tokens, customer submissions, or `.env` files tracked. | **Passed** |

---

## 2. Netlify Frontend Deployment Specification

The public website is architected to deploy directly from the GitHub repository to **Netlify** using dynamic Next.js App Router capabilities (no broken static exports).

### Build & Pipeline Settings
- **Connected Repository**: `https://github.com/AleleChi/laurrel.git`
- **Branch**: `main`
- **Base directory**: `/` (repository root)
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Netlify Plugin**: `@netlify/plugin-nextjs` (declared in `netlify.toml`)
- **Node Runtime**: Node.js 20.x

### Required Environment Variables on Netlify
```env
# CMS Hydration
NEXT_PUBLIC_SANITY_PROJECT_ID=<your-actual-sanity-project-id>
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_API_READ_TOKEN=<read-token>

# Dedicated Backend Routing (Points to Render)
BACKEND_API_URL=https://<your-render-service>.onrender.com

# Administration Security (Must match backend)
ADMIN_API_SECRET=<your-chosen-admin-passkey>

# Maps (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### Current Status
- Codebase and `netlify.toml` are committed and ready for 1-click import in Netlify Dashboard.

---

## 3. Render Dedicated Backend & Database Specification

A dedicated Node.js/TypeScript backend service has been extracted to `backend/` to run independently on **Render**, binding to `0.0.0.0:PORT`.

### Web Service Configuration
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Health Endpoint**: `GET /health` (returns `{ "status": "ok", "service": "laurrel-backend-api" }`)
- **Render Blueprint**: `render.yaml` provided in repository root for automated 1-click deployment.

### Managed PostgreSQL Configuration
- **Host**: Render PostgreSQL (Starter or Standard plan)
- **Database Name**: `laurrel_production`
- **Connection Variable**: `DATABASE_URL` (automatically linked via Blueprint)
- **Relational Tables**:
  1. `enquiries`: Full customer contact information, requested services array, Ottawa locations, timestamps, and delivery flags.
  2. `enquiry_notes`: Internal administrative follow-up timeline records.
  3. `ai_handoffs`: Logged AI human representative requests.
  4. `quotes` & `invoices`: Domain structures preserved for approved future billing.
- **Auto-Migration**: Schema migrations execute automatically on server startup via `backend/src/database/migrate.ts`.

### Required Environment Variables on Render
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@hostname:5432/laurrel_production?sslmode=require
FRONTEND_ORIGIN=https://laurrelservices.ca
ADMIN_API_SECRET=<your-chosen-admin-passkey>
GEMINI_API_KEY=<your-google-ai-studio-key>
EMAIL_PROVIDER=resend
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM="Laurrel Dispatch <dispatch@laurrelservices.ca>"
ENQUIRY_TO_EMAIL=info@laurrelservices.ca
```

---

## 4. Sanity CMS & Media Administration

Content and media are separated from application code using the standalone **Sanity Studio v3** workspace located in `studio/`.

### Studio Access & Hosted URL
- **Local Studio URL**: `http://localhost:3333`
- **Hosted Cloud URL**: `https://laurrel.sanity.studio` (deploy with `cd studio && npx sanity deploy`)
- **Authentication**: Managed securely through Sanity Cloud OAuth (Google, GitHub, or magic email link). No passwords stored in repository.
- **User Roles**: Administrator (owner), Editor (staff), Viewer.

### Editable Content Documents
1. **Homepage Hero & Service Videos (`homeHero`)**:
   - Cleaning Video (File upload or direct CDN URL) + Poster image + Alt text
   - Moving Video (File upload or direct CDN URL) + Poster image + Alt text
   - Storage Video (File upload or direct CDN URL) + Poster image + Alt text
   - Fallback Photograph + Alt text
   - Headlines and CTA destination links
2. **Homepage About Section (`homeAbout`)**:
   - Large headline, intro paragraph, core stat, and center service photograph.
3. **Homepage Services Highlight (`homeServices`)**:
   - Headlines and editorial service cards.
4. **Dedicated Services Page (`servicesPage`)**:
   - Panoramic banner, editorial text, cleaning/moving/storage detail images, and FAQ accordions.
5. **Dedicated About Page (`aboutPage`)**:
   - Header banner, company story photography, team values, and FAQ items.
6. **Contact Page (`contactPage`)**:
   - Location dispatch details, hours, and map settings.

### Media Replacement Workflow
1. Log in at `https://laurrel.sanity.studio`.
2. Open **Homepage Hero & Service Videos** or **Services Page**.
3. Drag and drop the new MP4 video file or photo into the asset field.
4. Set the **Focal Point Hotspot** to preserve proper centering on mobile devices.
5. Click **Publish**. Next.js revalidates published content every 60 seconds.

---

## 5. Transactional Email System

Customer enquiries submitted via any form or AI flow trigger automated email delivery through a unified provider abstraction.

| Feature | Resend (Preferred) | Shared-Hosting SMTP (Alternative) |
| :--- | :--- | :--- |
| **Provider Flag** | `EMAIL_PROVIDER=resend` | `EMAIL_PROVIDER=smtp` |
| **Credentials** | `RESEND_API_KEY` | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` |
| **Sender Address** | `Laurrel Dispatch <dispatch@laurrelservices.ca>` | Configured SMTP email |
| **Recipient** | `info@laurrelservices.ca` | `info@laurrelservices.ca` |
| **Reply-To** | Set directly to customer's submitted email | Set directly to customer's submitted email |
| **Customer Receipt** | Automated branded confirmation with enquiry Ref ID | Automated branded confirmation with enquiry Ref ID |

### Domain Verification (DNS Requirements for Resend)
To send email from `@laurrelservices.ca`, add the following DNS records at your domain registrar:
1. **DKIM**: TXT record `resend._domainkey.laurrelservices.ca` with value provided in Resend dashboard.
2. **SPF**: TXT record `@` or `send.laurrelservices.ca` with `v=spf1 include:amazonses.com ~all`.
3. **DMARC**: TXT record `_dmarc.laurrelservices.ca` with `v=DMARC1; p=none;`.
*Note: Do not touch existing MX records to preserve incoming mail.*

---

## 6. Laurrel Operations Admin Portal

A dedicated, protected operations administration portal has been implemented at `/admin` on the website.

- **URL**: `https://laurrelservices.ca/admin` (or `http://localhost:3000/admin`)
- **Authentication**: Token-gated using `ADMIN_API_SECRET`.
- **Capabilities**:
  - Live metric summary: Total Leads, New Submissions, Under Review, Scheduled, Dispatches, and AI Handoffs.
  - Multi-criteria filtering by Service (Cleaning, Moving, Storage) and Status (New, Reviewed, Quoted, Scheduled, Closed).
  - Search by Customer Name, Email, Reference ID, or Ottawa Postal Code/Location.
  - Full enquiry inspection showing property size, job requirements, and preferred timing.
  - Status updates and chronological internal notes log.
  - Inspection of AI Human Handoff requests.
- **Safety Gate**: Customer billing and invoice dispatch are withheld in staging mode pending final business merchant configuration.

---

## 7. Media Inventory Summary

Complete asset specifications are cataloged in `docs/cms/media-inventory.md`:
- **Active Rotating Hero Videos**:
  - `clean.mp4` (2.65 MB) + `cleaning-poster.jpg`
  - `movinng.mp4` (2.77 MB) + `moving-poster.jpg`
  - `storagge.mp4` (2.56 MB) + `storage-poster.jpg`
- **Photographic Story Images**:
  - High-res residential spaces and equipment photographs mapped across Home, About, Services, and Contact.
- **Phase 8 Photography Workflow**:
  - Detailed shot list, aspect ratio requirements, lighting directions, and Canadian aesthetic standards documented for future original photography shoots.

---

## 8. Launch Checklist & Remaining Action Items

To take the website live on production hosting:

- [ ] **Netlify**: Log in to Netlify, click "Add new site" -> "Import an existing project", select `AleleChi/laurrel`, and enter the environment variables from Section 2.
- [ ] **Render**: Log in to Render, click "New Blueprint Instance", select `AleleChi/laurrel` (using `render.yaml`), which provisions the backend Web Service and PostgreSQL database.
- [ ] **DNS & Custom Domain**:
  - Point `laurrelservices.ca` to Netlify DNS / CNAME.
  - Point `api.laurrelservices.ca` to Render Web Service URL.
- [ ] **Sanity Studio**: Run `cd studio && npx sanity deploy` to deploy `laurrel.sanity.studio`.
- [ ] **Resend**: Verify DNS TXT records for `laurrelservices.ca` in Resend dashboard.
