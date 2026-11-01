# LAURREL SERVICES — HERO REFINEMENT & SIMPLIFICATION REPORT

**Report Date:** October 31, 2026  
**Auditor / Engineer:** Principal UI/UX Designer & Senior Next.js Engineer  
**Status:** Implemented, Tested, and Verified on `http://localhost:3000`  
**Reference Build:** Next.js 14.2.35 Production Server (Localhost Port 3000)

---

## 1. Executive Summary & Problem Diagnosis

When Laurrel Services was reverted from the rejected Cleaneva full-bleed redesign back to its approved two-column layout, the hero section had accumulated several interface defects that detracted from its quality:
1. **Interactive Clutter in Hero Media:** The right column incorporated a complex tabbed dashboard (`01 Cleaning`, `02 Moving`, `03 Storage`), thumbnail preview strips, floating badge overlays (`Get a Fast Quote / Average response under 15 mins`), and duplicate quote buttons superimposed over the photo. This made the hero feel like an over-engineered SaaS software mock-up rather than a professional, trustworthy local service business.
2. **Impersonal Photography:** The previous hero asset displayed an empty, staged residential living room with a woman sitting passively on a sofa, failing to communicate operational capability.
3. **Advertising Jargon in Left Column:** Headline and supporting copy relied on marketing clichés rather than clear service definitions.

### The Refinement Objective
Restore visual authority, calm confidence, and high conversion utility by **simplifying the hero to a clean, authoritative two-column presentation**:
- **Left Column:** Deliberate 3-line headline (`Cleaning.` / `Moving.` / `Storage.`), clear supporting copy, two distinct CTA buttons, and a compact planning card.
- **Right Column:** A **single striking, authentic photograph** of a professional cleaner detailing a bright residential kitchen counter, held in a restrained `rounded-2xl` frame with subtle border and soft shadow—completely free of tabs, thumbnails, badges, or overlays.

---

## 2. Detailed Breakdown of Controls Removed

The following dashboard elements previously present in `src/components/home/HeroMediaShowcase.tsx` were deliberately removed to eliminate visual clutter:

| Removed Element | Previous Implementation | Issue & Why It Was Removed |
| :--- | :--- | :--- |
| **Numbered Service Tabs** | Three pills (`01 Cleaning`, `02 Moving`, `03 Storage`) sitting above or over the hero media. | Forced users into an artificial tab-switching mental model above the fold. Visitors do not want to click tabs to see different photos; they want to quickly understand what Laurrel offers and how to contact them. |
| **Thumbnail Selection Strip** | A row of small thumbnail images below the main photo. | Added visual noise, degraded mobile performance, and caused layout shifting while waiting for multiple thumbnail images to load. |
| **Floating Quote Badge Card** | An overlay badge reading `"Get a Fast Quote / Average response under 15 mins"` floating over the bottom-right corner of the image. | Obscured the photograph, created visual conflict with the primary CTA button on the left, and made an unverified response time claim. |
| **Duplicate "Request a Quote" Button Over Image** | A secondary quote button embedded inside the media container. | Created duplicate interactive targets on the same screen, confusing keyboard navigation and screen readers. |
| **Floating Category Tag Pills** | Small text chips (`"Residential & Commercial"`, `"Turnover Detailing"`) anchored to corners of the photo. | Cluttered the image subject and competed with the clean white-space aesthetics of the brand. |

---

## 3. Approved Hero Architecture & Visual System

```
+---------------------------------------------------------------------------------------------------+
|  GLOBAL FLOATING HEADER: [LAURREL SERVICES]       Home  Services  About  Contact      [Get a Quote] |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  LEFT COLUMN (~48% width)                                RIGHT COLUMN (~52% width)                |
|                                                                                                   |
|  [—] CLEANING · MOVING · STORAGE IN OTTAWA                +------------------------------------+  |
|                                                           |                                    |  |
|  Cleaning.                                                |                                    |  |
|  Moving.                                                  |      SINGLE AUTHENTIC PHOTO        |  |
|  Storage.                                                 |      (Professional cleaner         |  |
|                                                           |       detailing bright kitchen      |  |
|  Coordinated services for homes and businesses            |       countertop in Ottawa home)   |  |
|  across Ottawa. Book one service when you need            |                                    |  |
|  it, or combine all three when you are moving             |      - No tabs (01, 02, 03)        |  |
|  or renovating.                                           |      - No thumbnail strip          |  |
|                                                           |      - No floating badges          |  |
|  [ Request a Quote ]   [ Explore Services ]               |      - No duplicate CTA buttons    |  |
|                                                           |      - Restrained rounded-2xl      |  |
|  +---------------------------------------------+          |      - Subtle border & soft shadow |  |
|  | Need help planning your service?            |          |                                    |  |
|  | Tell us what you need and your date.        |          +------------------------------------+  |
|  | [ Get in Touch -> ]                         |                                                  |
|  +---------------------------------------------+                                                  |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

### 3.1 Design Tokens & Typography
- **Background:** `#F8F7F4` (Warm White).
- **Eyebrow:** Accent bar `#FE6000` (w-6 to w-8, h-[3px]), text in `#202024`/85, uppercase, tracking `0.16em`, font-weight 700.
- **H1 Headline:** Font-weight 800 (`font-extrabold`), tracking `-0.03em`, leading `[1.08]`.
  - Line 1: `Cleaning.` (`#49056B` Deep Brand Purple)
  - Line 2: `Moving.` (`#FE6000` Brand Accent Orange)
  - Line 3: `Storage.` (`#49056B` Deep Brand Purple)
- **Supporting Copy:** `#202024`/80, text size `1.125rem` (18px), leading `relaxed` (1.625), max-width `520px`.
- **Primary CTA:** Solid `#49056B` background, white text, `rounded-[14px]`, `px-7 py-3.5`, hover transition to `#370352`, subtle shadow.
- **Secondary CTA:** Border `1.5px solid #202024/20`, text `#18181B`, `rounded-[14px]`, `px-7 py-3.5`, hover background `#FFFFFF`.
- **Planning Card:** Clean card container with `border border-[#202024]/10 bg-white/70 backdrop-blur-xs rounded-xl p-4 sm:p-5 max-w-[500px] shadow-xs`.

---

## 4. Visual Verification & Viewport Responsiveness

The refined hero was audited across three standard viewports:

### 4.1 Desktop Viewport (1440 × 900 px)
- **Layout:** Balanced two-column grid (`grid-cols-12`, 6 cols left / 6 cols right).
- **Rhythm:** Generous breathing room (padding-top 32px, padding-bottom 56px). Eyebrow, H1, paragraph, buttons, and planning card stack logically without crowding.
- **Media:** The 1200×800 photo renders at approximately 600px width with sharp 2x pixel density. The subtle `border-[#202024]/10` and `shadow-card-soft` ground the photo against the warm white background.
- **Screenshot Evidence:** `docs/screenshots/editorial-refinement/homepage-desktop-above-fold.png`

### 4.2 Tablet Viewport (768 × 1024 px)
- **Layout:** Single column layout with left-aligned typographic hierarchy followed immediately by full-width photo.
- **Rhythm:** Font size adjusts to `text-[3.25rem]`, maintaining comfortable line-height without awkward word breaks.
- **Media:** The photograph maintains its 3:2 aspect ratio, filling the width of the container with clean margins.
- **Screenshot Evidence:** `docs/screenshots/editorial-refinement/homepage-tablet-above-fold.png`

### 4.3 Mobile Viewport (390 × 844 px)
- **Layout:** Optimized single-column stack.
- **Rhythm:** Headline scales smoothly to `2.5rem` (40px). Buttons stack vertically if needed with full touch targets (`min-h-[48px]`).
- **Media:** Renders with `rounded-xl`, zero horizontal overflow, and instant LCP loading.
- **Screenshot Evidence:** `docs/screenshots/editorial-refinement/homepage-mobile-above-fold.png`

---

## 5. Automated DOM Verification Results

The automated Puppeteer test suite (`scripts/verify-editorial-refinement.js`) executed against `http://localhost:3000` confirmed the following metrics:

| Check Item | Verified Value in DOM | Status |
| :--- | :--- | :--- |
| **Eyebrow Text** | `"CLEANING · MOVING · STORAGE IN OTTAWA"` | **PASS** |
| **H1 Headline** | `"Cleaning. Moving. Storage."` | **PASS** |
| **Primary CTA Button** | `"Request a Quote"` (Opens Quote Inquiry Modal) | **PASS** |
| **Secondary CTA Button** | `"Explore Services"` (Links to `#services`) | **PASS** |
| **Planning Card** | `"Need help planning your service?"` | **PASS** |
| **Hero Image Source** | `/_next/image?url=%2Fassets%2Fhero%2Fcleaning-hero.webp...` | **PASS** |
| **Absence of Tabs** | `hasNumberedTabs: false` | **PASS** |
| **Absence of Thumbnails** | `hasThumbnails: false` | **PASS** |
| **Absence of Overlays** | `hasFloatingBadge: false` | **PASS** |
| **Cumulative Layout Shift (CLS)** | `0.00` | **PASS** |
| **TypeScript Typecheck** | `0 errors` (`npx tsc --noEmit`) | **PASS** |

---

## 6. Summary of Files Modified & Current Git State

- **`src/components/home/Hero.tsx`**: Simplified right column to single photo; removed interactive tab state, thumbnail bindings, and overlay badge markup.
- **`src/content/site.ts`**: Grounded copy rewritten across hero, services, about, overlap, closing quote, and FAQ configurations.
- **`src/components/home/ServicesHighlightSection.tsx`**: Updated to render `activeContent.intro` and distinct per-service view links.
- **`public/assets/hero/`**: 4 authentic photographic assets converted to WebP and JPG.
- **Safety Compliance**: No commits made to Git, no remote pushes executed, no production deployments triggered. Local server remains live at `http://localhost:3000`.
