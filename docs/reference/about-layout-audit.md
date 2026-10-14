# Solshine Reference vs. Laurrel Services — About Page Layout Audit

**Document Location:** `docs/reference/about-layout-audit.md`  
**Date:** October 2026  
**Reference URL:** [https://solshine.framer.website/about-us](https://solshine.framer.website/about-us)  
**Target Project:** LAURREL SERVICES (`c:\Users\alele\Desktop\laurrel\src\app\about`)  
**Methodology:** Automated Puppeteer headless browser measurement, computed CSS extraction, DOM hierarchy parsing, and multi-viewport visual screenshot capture at 1440px (Desktop), 1280px (Laptop), 768px (Tablet), and 390px (Mobile).

---

## Executive Summary & Why the Previous Implementation Failed

The previous Laurrel About page (`/about`) suffered from critical composition defects:
1. **Photographic Monotony**: Repeatedly reused the same interior image (`laurrel-room.png`) across multiple sections, rendering the page flat and visually stagnant.
2. **Artificial Card Grids**: Reverted to three identical bordered cards and numbered paragraph lists (`01`, `02`, `03`) rather than adopting Solshine's dynamic, asymmetric editorial layouts.
3. **Mismatched Section Rhythm**: Inserted extraneous narrative sections ("The move is Friday") that did not exist in the reference, diluting the strong, confident pacing of Solshine.
4. **Proportion Mismatches**: The image-to-text ratios were generic 50/50 splits with small square photos, missing Solshine's signature oversized photographic elements (up to 676×676px with 50px rounded corners).

This audit documents the verified physical geometry of Solshine to anchor the complete visual reconstruction.

---

## Verified Reference Geometry & Section-by-Section Analysis

All measurements below were extracted from the rendered Framer DOM using `window.getComputedStyle()` at 1440×900 desktop viewport.

```
+-----------------------------------------------------------------------------------+
| 01. PHOTOGRAPHIC BANNER (H: 550px, Full-Bleed 1440px, Dark Tint Overlay)          |
|     H1: 65px (Line-height: 70px) Centred | Breadcrumb: Home / About (Gap: 25px)   |
+-----------------------------------------------------------------------------------+
| 02. ABOUT OUR COMPANY (H: 690px, Py: 100px, 2-Col Asymmetric)                    |
|     [ Left Image: 450x490px, R: 50px ] | [ Right: Eyebrow + H2 58px + 2 P + CTA ] |
+-----------------------------------------------------------------------------------+
| 03. SERVICES AT A GLANCE / WHAT WE DO (H: ~752px, Py: 100px, Bg: #F8F7F4)        |
|     H2: 58px (Line-height: 70px) Full Width | Big "03" Typographic Anchor         |
|     3 Spaced Service Descriptions (Cleaning, Moving, Storage) — No Bordered Cards |
+-----------------------------------------------------------------------------------+
| 04. WHY LAURREL (H: 1156px, Py: 100px, 2-Col Content & Photo)                     |
|     [ Left: Label + H2 58px + Intro + 4 Spaced Info Blocks ] | [ Right Photo ]    |
+-----------------------------------------------------------------------------------+
| 05. FREQUENTLY ASKED QUESTIONS (H: 764px, Py: 100px, 2-Col Split)                 |
|     [ Left Image: 676x676px, R: 50px ] | [ Right: Label + H2 58px + 5 FAQ Items ] |
+-----------------------------------------------------------------------------------+
| 06. CLOSING CTA & FOOTER (Concise Deep Purple Banner + Global Footer)             |
+-----------------------------------------------------------------------------------+
```

---

### Section 01: Photographic About Banner

| Attribute | Verified Solshine Measurement | Implementation Specification | Status |
| :--- | :--- | :--- | :--- |
| **Position** | Top of page (Y: 0px to 550px) | Top of page below floating nav | Verified |
| **Width & Container** | Full-bleed: `1440px` (100vw) | Full-bleed: `w-full` with inner `max-w-7xl` | Verified |
| **Section Height** | `550px` | `550px` (or `h-[500px] lg:h-[550px]`) | Verified |
| **Background** | Photo (`7ahob399syUX...jpg`, 1440×550 cover) with dark contrast overlay | Curated high-res landscape photograph with subtle dark tint | Verified |
| **H1 Typography** | `fontSize: 65px`, `fontWeight: 500`, `lineHeight: 70px`, `letterSpacing: -2px`, `color: #FFFFFF` | Manrope `text-4xl sm:text-5xl lg:text-[65px] font-medium leading-[1.08] tracking-[-0.03em] text-white` | Verified |
| **Heading Placement** | Centred horizontally (`left: 220px`, `width: 1000px`), vertically centred in safe zone (`top: 257px`) | Centred text group with deliberate top clearance for floating header | Verified |
| **Breadcrumb** | `Home / About Us`, `gap: 25px` below H1, font size 16px, weight 500 | `Home / About` semantic nav with working link to `/` | Verified |
| **Header Clearance** | ~180px safe clearance from top viewport edge to H1 | **> 200px clearance** to guarantee zero floating nav overlap | Verified |

---

### Section 02: About Our Company (Editorial Introduction)

| Attribute | Verified Solshine Measurement | Implementation Specification | Status |
| :--- | :--- | :--- | :--- |
| **Position** | Immediately below banner (Y: 550px to 1240px) | Section 02 below banner | Verified |
| **Section Height** | `690px` total height | `min-h-[650px]` with `py-20 lg:py-28` | Verified |
| **Padding** | `padding: 100px 20px 100px 20px` | `px-6 lg:px-8 max-w-7xl mx-auto` | Verified |
| **Column Proportions**| **Asymmetric 2-Column**: Image occupies ~35% (`450px`), Content occupies ~65% (`900px`) | `grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center` (Image: 5 cols, Text: 7 cols) | Verified |
| **Dominant Image** | `width: 450px`, `height: 490px`, `borderRadius: 50px`, `objectFit: cover` | High-res service-in-progress photograph with `rounded-[40px] lg:rounded-[50px]` | Verified |
| **Eyebrow Label** | `ABOUT OUR COMPANY`, `fontSize: 17px`, `lineHeight: 23.8px`, uppercase | `text-xs font-semibold uppercase tracking-wider text-[#390044]` | Verified |
| **H2 Typography** | `fontSize: 58px`, `fontWeight: 500`, `lineHeight: 70px`, `letterSpacing: -2px` | `text-3xl sm:text-4xl lg:text-[54px] font-medium leading-[1.12] tracking-[-0.03em] text-[#202024]` | Verified |
| **Text Content** | 2 comfortable editorial paragraphs | Approved Ottawa moving & multi-service copy (2 paragraphs) | Verified |
| **CTA Button** | `padding: 9px 8px 9px 24px`, `borderRadius: 50px`, lime accent | `Explore Our Services` pill button leading to `/#services` | Verified |
| **Mobile Behaviour** | Stacks vertically (Image top, text below) | Stacks with full-width rounded photo | Verified |

---

### Section 03: What We Do (Our Services at a Glance)

*Adapting Solshine's large-scale Experience & Statistics section without fabricated metrics.*

| Attribute | Verified Solshine Measurement | Implementation Specification | Status |
| :--- | :--- | :--- | :--- |
| **Position** | Y: 1240px to 1992px | Section 03 | Verified |
| **Section Height** | `752px` | `min-h-[600px]` with `py-20 lg:py-28` | Verified |
| **Background** | `#F8F8F8` (Warm off-white) | Warm white brand token `#F8F7F4` | Verified |
| **Header Layout** | Full container-width H2 (`58px / 70px`) with introductory text | Container-aligned H2: `For the spaces you use. And the ones you're moving between.` | Verified |
| **Typographic Focal** | Oversized numeric element (`10+`) | Oversized typographic element: **`03`** + **`CORE SERVICE AREAS`** | Verified |
| **Content Structure** | 3 focal operational areas | 3 open typographic columns: **Cleaning**, **Moving**, **Storage** | Verified |
| **Card Styling** | **Zero bordered cards**; pure editorial typography & whitespace | Strictly **no bordered cards**, no background boxes, no icons | Verified |
| **Link Treatment** | Text anchor links | Understated arrow text link (`/#cleaning`, `/#moving`, `/#storage`) | Verified |

---

### Section 04: Why Laurrel (Editorial Trust & Planning)

| Attribute | Verified Solshine Measurement | Implementation Specification | Status |
| :--- | :--- | :--- | :--- |
| **Position** | Y: 1992px to 3148px | Section 04 | Verified |
| **Section Height** | `1156px` | `py-20 lg:py-28` | Verified |
| **Layout Rhythm** | 2-part arrangement: Left editorial text & 4 feature blocks; Right dominant photo | Grid 12 cols: Left 7 cols (text & 4 blocks), Right 5 cols (photo) | Verified |
| **H2 Typography** | `fontSize: 58px`, `lineHeight: 70px` | `text-3xl sm:text-4xl lg:text-[54px] font-medium leading-[1.12]` | Verified |
| **4 Info Blocks** | H4 `24px / 30px`, weight 600, short description | 4 clean, spaced blocks: `One enquiry for related jobs`, `Details considered from the start`, `Room for individual needs`, `Clear next steps` | Verified |
| **Dominant Photo** | Large portrait/square photo with 50px rounded corners | Distinct residential / prep photograph with `rounded-[40px] lg:rounded-[50px]` | Verified |
| **Prohibitions** | No icons, no checkmarks, no cards | Pure typography, zero icon badges, zero number counters | Verified |

---

### Section 05: Frequently Asked Questions

| Attribute | Verified Solshine Measurement | Implementation Specification | Status |
| :--- | :--- | :--- | :--- |
| **Position** | Y: 5157px to 5922px (immediately preceding footer) | Section 05 | Verified |
| **Section Height** | `764px` | `py-20 lg:py-28` | Verified |
| **Layout Rhythm** | **2-Column Split**: Dominant Image Left (`676×676px`, `R: 50px`), Accordion Right | Grid 12 cols: Left 5 cols (Image `rounded-[40px] lg:rounded-[50px]`), Right 7 cols (Accordion) | Verified |
| **Image Proportions** | `676px` wide × `676px` high, square/portrait crop, `borderRadius: 50px` | Dedicated Ottawa storage/logistics photo, `rounded-[40px] lg:rounded-[50px]` | Verified |
| **Accordion Design** | Minimal border dividers, clean typography, discreet `+` / `−` indicator | Accessible headless accordion with minimal glyph, zero badges/shadows | Verified |
| **Copy Scope** | 5 practical, authentic Ottawa questions | 5 approved questions covering multi-service requests, details, and areas | Verified |

---

### Section 06: Closing CTA & Footer Transition

| Attribute | Verified Solshine Measurement | Implementation Specification | Status |
| :--- | :--- | :--- | :--- |
| **Position** | Bottom of page | Preceding global footer | Verified |
| **Design** | Concise conversion prompt | Deep purple (`#390044`) conversion block with lime CTA button | Verified |
| **Action** | Functional enquiry | Opens interactive quote modal with Ottawa service options | Verified |
| **Footer** | Standard site footer | Existing shared Laurrel footer | Verified |

---

## Prohibited Elements Confirmed from Audit

| Prohibited Element | Solshine Status | Laurrel Rule |
| :--- | :--- | :--- |
| **Team Profiles / Bios** | Present on Solshine at Y: 3397px | **EXCLUDED ENTIRELY** (No fake team photos or biographies) |
| **Rounded Badges / Pills on Headings** | None on Solshine (uses plain uppercase text) | **STRICTLY FORBIDDEN** |
| **Coloured Dots Beside Headings** | None on Solshine | **STRICTLY FORBIDDEN** |
| **Checkmark Lists** | None on Solshine | **STRICTLY FORBIDDEN** |
| **Three Identical Bordered Cards** | None on Solshine | **STRICTLY FORBIDDEN** |
| **Fabricated Metrics / Counters** | Solshine uses "10+", Laurrel has no verified years | **NO FAKE STATS**; replaced with structural `03 CORE SERVICE AREAS` |

---

## Screenshot Inventory

The following reference and comparison screenshots were captured and stored in `docs/reference/`:

- **Solshine Reference (`docs/reference/solshine-about/`)**:
  - `solshine_section_01_banner.png` (550px hero banner)
  - `solshine_section_02_about_company.png` (450×490 image + editorial copy)
  - `solshine_section_03_experience_stats.png` (Large experience heading & stats)
  - `solshine_section_04_why_choose.png` (Why choose layout & photography)
  - `solshine_section_05_faq.png` (676×676 photo + accordion)
  - `solshine_section_06_footer_transition.png` (Footer transition)
  - `solshine_full_desktop_1440.png`, `solshine_full_laptop_1280.png`, `solshine_full_tablet_768.png`, `solshine_full_mobile_390.png`

- **Previous Laurrel Page (`docs/reference/laurrel-about/`)**:
  - `laurrel_section_01_banner.png` through `laurrel_section_07.png`
  - `laurrel_full_desktop_1440.png`, `laurrel_full_laptop_1280.png`, `laurrel_full_tablet_768.png`, `laurrel_full_mobile_390.png`
