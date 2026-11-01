# LAURREL SERVICES — SEO BASELINE AUDIT

**Date:** November 1, 2026  
**Auditor:** Senior Technical SEO Engineer & Next.js Architect  
**Domain:** `https://laurrelservices.com`  
**Git Branch:** `main` (commit `075b277`, synchronized with `origin/main` and `origin/feat/homepage-hero-redesign`)  
**Deployment Platform:** Netlify (automatic Next.js Runtime v5)  
**Database:** Neon PostgreSQL Pooler (`ep-raspy-dew-b4agbivi-pooler.c-6.us-east-2.aws.neon.tech`)

---

## 1. Executive Summary & Defect Inventory

The technical SEO audit of the Laurrel Services codebase, live Neon PostgreSQL CMS database, and production deployment at `https://laurrelservices.com` identified eight critical architectural and on-page SEO defects:

1. **Missing XML Sitemap**: Neither `src/app/sitemap.ts` nor a static `public/sitemap.xml` exists. Search engines have no authoritative discovery mechanism for public pages.
2. **Missing `robots.txt`**: Neither `src/app/robots.ts` nor `public/robots.txt` exists. Crawlers are not guided away from `/admin/`, internal APIs (`/api/`), or private booking management URLs (`/book/[token]`).
3. **Canonical Domain Drift & Instability**:
   - The Neon PostgreSQL `cms_pages.seo` records for `/about` and `/services` contain stale `.ca` canonical URLs: `https://laurrelservices.ca/about` and `https://laurrelservices.ca/services`.
   - `getSiteUrl()` in `src/content/site.ts` prioritizes `process.env.URL`. On Netlify deploy previews or branch builds, this injects the transient `*.netlify.app` domain instead of the permanent canonical `https://laurrelservices.com`.
4. **Disconnected `noindex` Propagation**:
   - Although `PageSeoEditor.tsx` in the admin CMS allows administrators to toggle `noIndex`, neither `src/lib/cms/content.ts` nor the public page components (`/`, `/about`, `/services`, `/contact`) inspect or forward `noIndex` to Next.js `generateMetadata()` robots configuration.
5. **Stale Open Graph Imagery in CMS**:
   - `cms_pages.seo` records in Neon DB still reference `/assets/hero/laurrel-room.png` for `home`, `services`, and `contact`, and `/assets/videos/moving-poster.jpg` for `about`.
   - Twitter card metadata (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) is omitted.
6. **Incomplete Structured Data**:
   - The Contact page contains a hardcoded `priceRange: "$$"` inside `LocalBusiness` schema, which is unsupported by verified fixed-rate pricing evidence.
   - The Homepage lacks a root `LocalBusiness` and `WebSite` JSON-LD entity.
   - The Services page contains only `BreadcrumbList` but lacks semantic `Service` schemas.
   - Schemas lack consistent `@id` node linking (`#organization`, `#localbusiness`, `#website`).
7. **Public Content Resolver Field Truncation**:
   - `src/lib/cms/content.ts` only extracts `title` and `description` from `result.page.seo`, dropping `canonical`, `ogImage`, `ogTitle`, `ogDescription`, and `noIndex`.
8. **Private Route Exposure**:
   - `/book/[token]` (private customer booking management and rescheduling) lacks server-rendered `noindex, nofollow` metadata.

---

## 2. Page-by-Page Metadata & Technical State

### 2.1 Homepage (`/`)
- **Rendered Title**: `Cleaning, Moving & Storage in Ottawa | Laurrel Services`
- **Rendered Description**: `Cleaning, moving and storage services in Ottawa. Explore Laurrel Services and request a quote for your home, property or business.`
- **Target Title (Phase 3)**: `Cleaning, Moving & Storage in Ottawa | Laurrel Services`
- **Target Description (Phase 3)**: `Cleaning, moving and storage services in Ottawa and the National Capital Region. Tell Laurrel Services what you need and request a quote for your home or business.`
- **DB `cms_pages.seo`**: Canonical: `https://laurrelservices.com/`, ogImage: `/assets/hero/laurrel-room.png` (STALE), noIndex: `false`.
- **H1 Heading**: `"Make space for what's next."` (Semantic, accessible, styled with brand purple/black).
- **H2 Headings**: `"ABOUT LAURREL SERVICES"`, `"WHAT CAN WE HELP YOU WITH?"`, `"WHEN PLANS OVERLAP"`, `"COMMON QUESTIONS"`, `"GET IN TOUCH"`.
- **Canonical Status**: Hardcoded in `page.tsx` as `${getSiteUrl()}/`, but ignores DB canonical override.
- **Structured Data**: None currently present on Homepage.

### 2.2 About Page (`/about`)
- **Rendered Title**: `About Laurrel Services | Cleaning, Moving & Storage in Ottawa`
- **Rendered Description**: `Learn about Laurrel Services and our cleaning, moving and storage services in Ottawa. Understand our approach to planning related service requests.`
- **Target Title (Phase 3)**: `About Laurrel Services | Cleaning, Moving & Storage Ottawa`
- **Target Description (Phase 3)**: `Learn about Laurrel Services and our cleaning, moving and storage services in Ottawa. Find out how to enquire about one service or several related jobs.`
- **DB `cms_pages.seo`**: Canonical: `https://laurrelservices.ca/about` (**DEFECT: .ca domain**), ogImage: `/assets/videos/moving-poster.jpg` (**DEFECT: video poster**).
- **H1 Heading**: `"About Laurrel Services"` (inside page banner).
- **H2 Headings**: `"ABOUT OUR WORK"`, `"WHAT WE DO"`, `"HOW WE WORK"`, `"FREQUENTLY ASKED QUESTIONS"`, `"Tell us what needs doing."`.
- **Canonical Status**: Hardcoded in `page.tsx` as `${getSiteUrl()}/about`.
- **Structured Data**: `BreadcrumbList` present.

### 2.3 Services Page (`/services`)
- **Rendered Title**: `Cleaning, Moving & Storage Services Ottawa | Laurrel Services`
- **Rendered Description**: `Explore cleaning, moving and storage services in Ottawa. Learn what to include in your enquiry and request availability and a quote from Laurrel Services.`
- **Target Title (Phase 3)**: `Cleaning, Moving & Storage Services in Ottawa | Laurrel`
- **Target Description (Phase 3)**: `Explore Laurrel's cleaning, moving and storage services in Ottawa. Find out what details to include when requesting a service estimate or discussing your plans.`
- **DB `cms_pages.seo`**: Canonical: `https://laurrelservices.ca/services` (**DEFECT: .ca domain**), ogImage: `/assets/hero/laurrel-room.png` (**DEFECT: stale asset**).
- **H1 Heading**: `"Our Services"` (inside page banner).
- **H2 Headings**: `"Cleaning, moving and storage planned around your needs."`, `"Cleaning Services in Ottawa"`, `"Moving Services in Ottawa"`, `"Transitional Storage Arrangements"`, `"A straightforward process from inquiry to completion."`, `"Answers to practical questions about our services."`, `"Tell us about your upcoming project."`.
- **Canonical Status**: Hardcoded in `page.tsx` as `${getSiteUrl()}/services`.
- **Structured Data**: `BreadcrumbList` present; `Service` schemas missing.

### 2.4 Contact Page (`/contact`)
- **Rendered Title**: `Contact Us | Laurrel Services Ottawa`
- **Rendered Description**: `Get in touch with Laurrel Services for cleaning, moving and storage in Ottawa. Send an enquiry or discuss your property transition plans.`
- **Target Title (Phase 3)**: `Contact Laurrel Services | Ottawa, Ontario`
- **Target Description (Phase 3)**: `Contact Laurrel Services about cleaning, moving or storage in Ottawa. Call (343) 843-3032 or send an enquiry with your location and preferred date.`
- **DB `cms_pages.seo`**: Canonical: `https://laurrelservices.com/contact`, ogImage: `/assets/hero/laurrel-room.png` (**DEFECT: stale asset**).
- **H1 Heading**: `"Contact Us"` (inside page banner).
- **H2 Headings**: `"Tell us about your upcoming project."`, `"Serving Ottawa and Surrounding Communities"`, `"Send us an enquiry"`.
- **Canonical Status**: Hardcoded in `page.tsx` as `${getSiteUrl()}/contact`.
- **Structured Data**: `BreadcrumbList` and `LocalBusiness` present, but contains unsupported `priceRange: "$$"`.

### 2.5 Public Booking Page (`/book`)
- **Current Component**: `'use client'` component without dedicated metadata or server layout.
- **Indexability**: Inherits root layout metadata.
- **Evaluation**: The booking wizard is an interactive transaction tool. CTAs across marketing pages lead users directly to this workflow. It should be crawlable if linked, but does not serve as a primary search landing page compared to `/services` or `/contact`.

### 2.6 Private Booking Management Page (`/book/[token]`)
- **Current Component**: `'use client'` component without server layout.
- **Risk**: If search engines discover a customer's private cancellation/reschedule token URL, customer personal data and private appointment details could be indexed.
- **Required Action**: Explicit server layout with `robots: { index: false, follow: false, nocache: true }`, plus disallow in `robots.ts`.

---

## 3. Canonical Architecture Audit (`getSiteUrl()`)

Current implementation in `src/content/site.ts`:
```ts
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.URL) {
    return process.env.URL.replace(/\/$/, '');
  }
  return 'https://laurrelservices.com';
}
```

### Risk Analysis
Netlify automatically injects `process.env.URL` during builds.
- On Netlify production, `process.env.URL` is set to the primary site URL, but if the custom domain is not yet recognized or on deploy previews, it resolves to `https://<site-name>.netlify.app`.
- If `process.env.URL` is prioritized over the default, canonical tags can output `https://laurrel-services.netlify.app/about`, splitting index equity.
- **Remediation**:
  Define a strict `PRODUCTION_SITE_URL = 'https://laurrelservices.com'`. If `NODE_ENV === 'production'` and not in a preview environment, always return `PRODUCTION_SITE_URL`. Ensure no trailing slash on base URL, and trailing slash consistency on page paths.

---

## 4. CMS Revision Tracking & Round-Trip State

The Neon DB contains 4 pages in `cms_pages`:
- `home`: Current revision `rev_home_9_1793523873192`
- `about`: Current revision `rev_about_2_1793523232502`
- `services`: Current revision `rev_services_2_1793523216534`
- `contact`: Current revision `rev_contact_2_1793523203636`

All updates to SEO metadata in Neon PostgreSQL must be executed using the established `savePageDraft` $\to$ `publishPage` workflow in `backend/src/database/cmsRepo.ts` to ensure:
1. Increment of `revision_number`
2. Generation of immutable revision snapshot in `cms_revisions`
3. Entry in `audit_logs` table
4. Updating `cms_pages.current_revision_id` and `cms_pages.updated_at`

---

## 5. Structured Data Schema Mapping

| Entity Type | Location | Properties | Verification Status |
| :--- | :--- | :--- | :--- |
| **`WebSite`** | `RootLayout` (`/`) | `@id`, `name`, `url`, `publisher` | To be added |
| **`Organization`** / **`LocalBusiness`** | `RootLayout` (`/`) | `@id: "https://laurrelservices.com/#organization"`, `name: "Laurrel Services"`, `url`, `logo`, `email`, `telephone: "+13438433032"`, `address: { Ottawa, ON, CA }`, `areaServed`, `sameAs` | To be implemented globally |
| **`BreadcrumbList`** | `/about`, `/services`, `/contact` | `itemListElement` with absolute canonical items | Exists; needs consolidation with global graph |
| **`Service`** | `/services` | 3 distinct entities: Cleaning, Moving, Storage with provider `@id` linking | To be implemented |
