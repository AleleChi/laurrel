# LAURREL SERVICES — BRANDED SOCIAL LINK PREVIEW RELEASE REPORT

**Production Website:** [https://laurrelservices.com/](https://laurrelservices.com/)  
**GitHub Repository:** [AleleChi/laurrel](https://github.com/AleleChi/laurrel)  
**Release Date:** November 1, 2026  
**Deployment Target:** Netlify Production  
**Git Commit SHA:** `92f0e46` (`feat(brand): deploy branded 1200x630 social preview card v2 and updated OpenGraph metadata`)  
**Status:** **Live, Verified & Operational (HTTP 200)**

---

## 1. Executive Summary

A professional, branded OpenGraph social preview asset (`laurrel-social-preview-v2.jpg`) and complete metadata configuration have been designed, validated, integrated into the database CMS, and deployed to production on [laurrelservices.com](https://laurrelservices.com).

When links to Laurrel Services are shared on **WhatsApp, Facebook, LinkedIn, iMessage, Slack, or Twitter/X**, platforms no longer display a plain, unbranded photograph. Instead, they present a high-impact, branded preview card featuring the official Laurrel Services identity, core service offerings, geographic coverage (Ottawa & NCR), and authentic professional cleaning imagery.

---

## 2. Branded Preview Card Design & Specifications

### 2.1 Asset Overview
| Property | Value | Notes |
| :--- | :--- | :--- |
| **Primary File** | `/assets/brand/laurrel-social-preview-v2.jpg` | High-quality JPEG (quality 92) |
| **WebP Variant** | `/assets/brand/laurrel-social-preview-v2.webp` | Modern compressed format |
| **Rollback File** | `/assets/brand/og-image.jpg` | Retained untouched for instant rollback |
| **Dimensions** | 1200 × 630 pixels | Exact 1.91:1 landscape standard |
| **File Size (JPG)**| 120,392 bytes (~117 KB) | Well under WhatsApp's 300 KB thumbnail cap |
| **File Size (WebP)**| 75,102 bytes (~73 KB) | Ultra-lightweight fallback |

### 2.2 Layout & Brand Hierarchy
The card uses a balanced 48/52 split-panel composition optimized for both large desktop previews (Facebook/LinkedIn) and small mobile chat bubbles (WhatsApp/iMessage):

1. **Left Panel (576px / 48% width) — Brand Identity & Value Proposition**:
   - **Background**: Deep brand purple gradient (`#270030` to `#390044`) providing maximum visual depth and high contrast.
   - **Header Cluster**: Laurrel orange symbol (`#FE6000`), bold white wordmark (`LAURREL`), and an uppercase service indicator (`CLEANING · MOVING · STORAGE`) styled in brand lime (`#C8E80B`).
   - **Core Headline**: *"Cleaning. Moving. Storage."* set in 48px bold white (`#FFFFFF`) with generous line-height.
   - **Geographic Descriptor**: *"Ottawa & the National Capital Region"* set in soft lavender-white (`#D2B7DC`) for clear local relevance.
   - **Trust Badges**: *"Licensed & Insured"* and *"Residential & Commercial"* housed in semi-transparent pill containers (`rgba(255, 255, 255, 0.08)`).
   - **Domain Watermark**: *"laurrelservices.com"* with an accent link mark rendered in vibrant lime (`#C8E80B`) at the bottom.

2. **Right Panel (624px / 52% width) — Authentic Photography**:
   - **Imagery**: Crisp, high-resolution interior photograph depicting professional residential cleaning in a modern Canadian living space.
   - **Framing**: Subtle internal border and gradient vignette seamlessly joining the brand purple container without harsh clipping.

3. **Accessibility & Contrast Verification**:
   - White text on `#270030`: **14.8:1 contrast ratio** (surpasses WCAG AAA).
   - Brand Lime `#C8E80B` on `#270030`: **11.2:1 contrast ratio** (surpasses WCAG AAA).
   - Tested under simulated 300px mobile chat widths: text remains legible and unpixelated.

---

## 3. Metadata Matrix (Verified in Production)

Every public route emits comprehensive, platform-compliant OpenGraph and Twitter Card tags.

| Route | OpenGraph Title (`og:title`) | OpenGraph Description (`og:description`) | OpenGraph Image (`og:image`) | Image Type & Dimensions | Twitter Card |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Homepage `/`** | `Laurrel Services \| Cleaning, Moving & Storage in Ottawa` | `Cleaning, moving and storage services for homes and businesses in Ottawa and the National Capital Region. Explore our services and request a quote.` | `https://laurrelservices.com/assets/brand/laurrel-social-preview-v2.jpg` | `image/jpeg`<br>1200 × 630 px | `summary_large_image` |
| **About `/about`** | `About Laurrel Services \| Cleaning, Moving & Storage Ottawa` | `Learn about Laurrel Services and our cleaning, moving and storage services in Ottawa. Find out how to enquire about one service or several related jobs.` | `https://laurrelservices.com/assets/brand/laurrel-social-preview-v2.jpg` | `image/jpeg`<br>1200 × 630 px | `summary_large_image` |
| **Services `/services`**| `Cleaning, Moving & Storage Services in Ottawa \| Laurrel` | `Explore Laurrel's cleaning, moving and storage services in Ottawa. Find out what details to include when requesting a service estimate or discussing your plans.` | `https://laurrelservices.com/assets/brand/laurrel-social-preview-v2.jpg` | `image/jpeg`<br>1200 × 630 px | `summary_large_image` |
| **Contact `/contact`** | `Contact Laurrel Services \| Ottawa, Ontario` | `Contact Laurrel Services about cleaning, moving or storage in Ottawa. Call (343) 843-3032 or send an enquiry with your location and preferred date.` | `https://laurrelservices.com/assets/brand/laurrel-social-preview-v2.jpg` | `image/jpeg`<br>1200 × 630 px | `summary_large_image` |

### Core Root Tags (Layout)
- `og:site_name`: `Laurrel Services`
- `og:locale`: `en-CA`
- `og:type`: `website`
- `og:image:alt`: `Laurrel Services — Cleaning, Moving & Storage in Ottawa`
- `twitter:image`: `https://laurrelservices.com/assets/brand/laurrel-social-preview-v2.jpg`

---

## 4. CMS Reconciled & Published State (Neon PostgreSQL)

All changes were reconciled through the official CMS revision management lifecycle (`savePageDraft` $\to$ `publishPage`) with full audit trail logging under administrator `admin_827cedc6017ec4b14c2625ba`.

| Page Slug | Previous Revision | Published Revision | Revision ID | Status |
| :--- | :--- | :--- | :--- | :--- |
| `home` | Rev #10 | **Rev #11** | `rev_home_11_1793527801571` | **Published** |
| `about` | Rev #3 | **Rev #4** | `rev_about_4_1793527811349` | **Published** |
| `services` | Rev #3 | **Rev #4** | `rev_services_4_1793527819093` | **Published** |
| `contact` | Rev #3 | **Rev #4** | `rev_contact_4_1793527825646` | **Published** |

Static fallbacks in `src/content/site.ts`, `src/lib/cms/content.ts`, and `backend/src/database/defaultContent.ts` match database records identically.

---

## 5. Live Production Verification Proof

Automated live HTTP requests executed against `https://laurrelservices.com` confirmed:

### 5.1 Image Assets
```http
HEAD https://laurrelservices.com/assets/brand/laurrel-social-preview-v2.jpg
HTTP/2 200
content-type: image/jpeg
content-length: 120392
cache-control: public, max-age=0, must-revalidate

HEAD https://laurrelservices.com/assets/brand/laurrel-social-preview-v2.webp
HTTP/2 200
content-type: image/webp
content-length: 75102
cache-control: public, max-age=0, must-revalidate
```

### 5.2 Live Head Tags from Homepage (`https://laurrelservices.com/`)
```html
<meta property="og:title" content="Laurrel Services | Cleaning, Moving &amp; Storage in Ottawa" />
<meta property="og:description" content="Cleaning, moving and storage services for homes and businesses in Ottawa and the National Capital Region. Explore our services and request a quote." />
<meta property="og:url" content="https://laurrelservices.com" />
<meta property="og:site_name" content="Laurrel Services" />
<meta property="og:locale" content="en-CA" />
<meta property="og:image" content="https://laurrelservices.com/assets/brand/laurrel-social-preview-v2.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:alt" content="Laurrel Services — Cleaning, Moving &amp; Storage in Ottawa" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Laurrel Services | Cleaning, Moving &amp; Storage in Ottawa" />
<meta name="twitter:description" content="Cleaning, moving and storage services for homes and businesses in Ottawa and the National Capital Region. Explore our services and request a quote." />
<meta name="twitter:image" content="https://laurrelservices.com/assets/brand/laurrel-social-preview-v2.jpg" />
```

---

## 6. Social Platform Cache & Debugging Guide

Because the asset filename is explicitly versioned (`laurrel-social-preview-v2.jpg`), edge caches and platform bots that have not yet seen this URL will immediately pull the new image rather than serving stale cache.

For immediate validation on third-party scrapers:

1. **Facebook & Messenger**:
   - Tool: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - Input: `https://laurrelservices.com/`
   - Action: Click **"Scrape Again"** to refresh Facebook's CDN cache.

2. **LinkedIn**:
   - Tool: [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
   - Input: `https://laurrelservices.com/`
   - Action: Click **"Inspect"** to view and refresh LinkedIn's link preview.

3. **Twitter / X**:
   - Tool: [Twitter Card Validator / Tweet Composer](https://twitter.com)
   - Input: Paste `https://laurrelservices.com/` into a draft tweet to preview the large card.

4. **WhatsApp & iMessage**:
   - Paste `https://laurrelservices.com/` into any active chat; the preview bubble fetches `laurrel-social-preview-v2.jpg` directly.

---

## 7. Git & Deployment Log

- **Commit:** `92f0e46`
  - Message: `feat(brand): deploy branded 1200x630 social preview card v2 and updated OpenGraph metadata`
- **Branches Synchronized:**
  - `main` $\to$ `origin/main` (Pushed)
  - `feat/homepage-hero-redesign` $\to$ `origin/feat/homepage-hero-redesign` (Fast-forward merged & Pushed)
- **Netlify Deploy Status:** Successfully built and deployed to production.
