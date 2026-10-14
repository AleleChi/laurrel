# Technical Audit & Reference Analysis — Laurrel Services Phase 01

## 1. Reference Inspection Summary: https://acrepair.framer.website/

The reference site was analyzed via full runtime extraction (DOM, Framer bundles, component chunks, style sheets, and animation configs).

### Verified Reference Design System
- **Layout Architecture**:
  - Container max-width: `1300px` centered with responsive horizontal gutters (`padding: 0 30px` desktop, `0 20px` mobile).
  - Header: Floating navigation card (`width: 1300px; padding: 10px 10px 10px 30px`), rounded corners (`12px` - `16px`), subtle hairline border (`rgba(0,0,0,0.06)`), and backdrop blur.
  - Desktop Hero: 2-column asymmetric layout (left ~48% copy & action stack, right ~52% media display).
  - Button Geometry: Fixed height `56px`, `rounded-[10px]`, `padding: 16px 24px`, 14px icon-to-text gap, spring physics hover.
- **Reference Tokens**:
  - Primary Accent: Royal Blue `#003087` (Framer token `var(--token-f9349d72)`)
  - Off-white Surface: `#F4F5F3` (Framer token `var(--token-d09816c8)`)
  - Headline Dark: Slate `#0F172A` (Framer token `var(--token-9f8eee8c)`)
  - Body Text: Neutral Gray `#575757` (Framer token `var(--token-0d7b7c3d)`)
  - Hairlines: `#D8D8D8` / `rgba(0, 0, 0, 0.2)`
- **Typography**:
  - Reference embeds `Inter` / `Inter Display` with `Fragment Mono` for tags.
  - Per project guidelines, `Manrope` (Next.js `next/font/google`) is our designated primary font, providing a warm, modern, high-contrast grotesque style that matches Canadian premium service branding.
- **Motion Principles**:
  - Spring physics: `damping: 40`, `stiffness: 150`, `mass: 1`.
  - Appear transitions: Soft staggered fade/slide (0.4s - 0.7s) on initial viewport intersection.
  - Continuous Ticker: Pure CSS translate-x loop with `prefers-reduced-motion: reduce` override and pause-on-hover.

---

## 2. Laurrel Brand Translation & Asset Manifest

| Asset / Parameter | Source File | Status / Production Note |
| :--- | :--- | :--- |
| **Brand Palette** | Extracted from logo & specs | Deep Purple `#390044`, Brand Lime `#C8E80B` (accent/indicator), High-Contrast Editorial Lime `#608600` / `#4E6E00` (for accessible text on light backgrounds where WCAG AA 4.5:1 is required), Warm White `#F8F7F4`, Dark Ink `#202024`. |
| **Logo** | `public/assets/brand/laurrel-logo-source.png` | Authentic user promotional logo (1352×745). For crisp header navigation, we create an optimized, high-fidelity SVG/vector logo lockup matching the house/broom/truck/storage motif + clean wordmark, while referencing the authentic asset. |
| **Hero Media** | `public/assets/hero/laurrel-room.png` | Authentic user room photograph (1024×1024). Placed in high-definition aspect-ratio container with optimal object-positioning preserving window daylight, cream sectional sofa, and floating architectural staircase. |
| **Hero Video** | `public/assets/hero/laurrel-hero.mp4` | Not yet supplied. Graceful poster fallback implemented without blocking Phase 01. |
| **Layout Concept** | `references/visual-layout-target.png` & `mobile-concept.png` | Visual layout guidance only. Not used as background art. |

---

## 3. SEO, Accessibility & Interaction Readiness
- Canadian locale: `en-CA`.
- Canonical metadata, OpenGraph tags, semantic landmarks (`<header>`, `<main>`, `<section>`).
- Single H1 split into 3 deliberate lines: `Clean spaces.`, `Smooth moves.`, `Secure storage.`.
- Honest interactions: Non-destructive interactive quote inquiry drawer/modal ready for CMS integration, with clear disclaimer that backend dispatch is pending.
