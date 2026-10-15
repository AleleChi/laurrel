# LAURREL SERVICES — MEDIA INVENTORY & CMS SPECIFICATION

**Document Version**: 1.0.0  
**Status**: Production Baseline  
**Target CMS**: Sanity Studio v3 (`studio/`)  
**Scope**: All Public Pages, Hero Rotator Videos, Photographic Story Sections, and Promotional Assets

---

## 1. Executive Media Overview

The LAURREL SERVICES website utilizes a restrained, editorial Canadian visual language. The brand visual system pairs deep regal purple (`#390044`), high-contrast electric lime (`#C8E80B`), warm architectural white (`#F8F7F4`), and ink typography (`#202024`).

This inventory catalogs every visual asset on the website, maps each to its corresponding Sanity CMS field, documents required aspect ratios, and provides the **Phase 8 Premium Photography Workflow** guidelines for future authentic Ottawa photo replacements.

---

## 2. Complete Asset Matrix

| ID | Page | Section | Component | Current Asset Path | Sanity Schema & Field | Aspect Ratio | Editable in CMS? | Replacement Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **VID-01** | Home (`/`) | Hero Showcase | `HeroVideoRotator` | `/assets/videos/clean.mp4` | `homeHero` → `cleaningVideo` / `cleaningVideoUrl` | 16:9 / 4:3 | **Yes** | Future authentic crew shoot |
| **PST-01** | Home (`/`) | Hero Showcase | `HeroVideoRotator` | `/assets/videos/cleaning-poster.jpg` | `homeHero` → `cleaningPoster` | 16:9 / 4:3 | **Yes** | Ready for high-res photo |
| **VID-02** | Home (`/`) | Hero Showcase | `HeroVideoRotator` | `/assets/videos/movinng.mp4` | `homeHero` → `movingVideo` / `movingVideoUrl` | 16:9 / 4:3 | **Yes** | Future authentic crew shoot |
| **PST-02** | Home (`/`) | Hero Showcase | `HeroVideoRotator` | `/assets/videos/moving-poster.jpg` | `homeHero` → `movingPoster` | 16:9 / 4:3 | **Yes** | Ready for high-res photo |
| **VID-03** | Home (`/`) | Hero Showcase | `HeroVideoRotator` | `/assets/videos/storagge.mp4` | `homeHero` → `storageVideo` / `storageVideoUrl` | 16:9 / 4:3 | **Yes** | Future authentic facility shoot |
| **PST-03** | Home (`/`) | Hero Showcase | `HeroVideoRotator` | `/assets/videos/storage-poster.jpg` | `homeHero` → `storagePoster` | 16:9 / 4:3 | **Yes** | Ready for high-res photo |
| **IMG-01** | Home (`/`) | Hero Fallback | `HeroVideoRotator` | `/assets/hero/laurrel-room.png` | `homeHero` → `fallbackImage` | 4:3 | **Yes** | Approved architectural base |
| **IMG-02** | Home (`/`) | About Section | `AboutSection` | `/assets/videos/moving-poster.jpg` | `homeAbout` → `mainImage` | 4:5 Portrait | **Yes** | Replace with Ottawa residential move |
| **ART-01** | Home (`/`) | Services Highlight| `ServicesHighlight` | `ServiceIllustrations.tsx` (SVG) | `homeServices` → `services[0].illustration` | Vector | Yes (Icon Type) | Approved minimal line-art |
| **ART-02** | Home (`/`) | Services Highlight| `ServicesHighlight` | `ServiceIllustrations.tsx` (SVG) | `homeServices` → `services[1].illustration` | Vector | Yes (Icon Type) | Approved minimal line-art |
| **ART-03** | Home (`/`) | Services Highlight| `ServicesHighlight` | `ServiceIllustrations.tsx` (SVG) | `homeServices` → `services[2].illustration` | Vector | Yes (Icon Type) | Approved minimal line-art |
| **IMG-03** | Home (`/`) | When Plans Overlap| `WhenPlansOverlap` | `/assets/videos/cleaning-poster.jpg` | `homeOverlappingPlans` → `situations[].image` | 16:10 | **Yes** | Replace with authentic Ottawa residential transition photo |
| **IMG-04** | About (`/about`) | Top Banner | `AboutPageClient` | `/assets/hero/laurrel-room.png` | `aboutPage` → `banner.image` | 21:9 Wide | **Yes** | Architectural Ottawa exterior / interior |
| **IMG-05** | About (`/about`) | Company Story | `AboutPageClient` | `/assets/hero/laurrel-room.png` | `aboutPage` → `aboutCompany.image` | 4:3 | **Yes** | Team meeting / dispatch room |
| **IMG-06** | About (`/about`) | Why Laurrel | `AboutPageClient` | `/assets/videos/moving-poster.jpg` | `aboutPage` → `whyLaurrel.image` | 16:11 | **Yes** | Moving vehicle prep / equipment |
| **IMG-07** | About (`/about`) | FAQ Visual | `AboutPageClient` | `/assets/videos/cleaning-poster.jpg` | `aboutPage` → `faq.image` | 4:5 Portrait | **Yes** | Finished sparkling space detail |
| **IMG-08** | Services (`/services`) | Top Banner | `ServicesPageClient` | `/assets/hero/laurrel-room.png` | `servicesPage` → `banner.image` | 21:9 Wide | **Yes** | Clean architectural space |
| **IMG-09** | Services (`/services`) | Cleaning Detail | `ServicesPageClient` | `/assets/videos/cleaning-poster.jpg` | `servicesPage` → `services[0].image` | 16:10 | **Yes** | Post-renovation handover clean |
| **IMG-10** | Services (`/services`) | Moving Detail | `ServicesPageClient` | `/assets/videos/moving-poster.jpg` | `servicesPage` → `services[1].image` | 16:10 | **Yes** | Protective blanket wrap / moving |
| **IMG-11** | Services (`/services`) | Storage Detail | `ServicesPageClient` | `/assets/videos/storage-poster.jpg` | `servicesPage` → `services[2].image` | 16:10 | **Yes** | Clean climate-controlled storage |
| **IMG-12** | Contact (`/contact`) | Top Banner | `ContactPageClient` | `/assets/hero/laurrel-room.png` | `contactPage` → `banner.image` | 21:9 Wide | **Yes** | Ottawa streetscape / architecture |

---

## 3. Video Asset Technical Requirements

### Rotating Hero Service Videos (`clean.mp4`, `movinng.mp4`, `storagge.mp4`)
1. **Container & Codec**: MP4 (H.264 / AVC video with baseline profile for maximum mobile/iOS compatibility).
2. **Audio**: Entirely stripped or muted (audio stream removed to prevent browser autoplay blocking).
3. **Resolution**: 1920x1080 (1080p) or 1280x720 (720p).
4. **File Size Budget**: Under 3.5 MB per clip (achieved via CRF 24-28).
5. **Frame Rate**: 24 or 30 fps (constant frame rate).
6. **Autoplay Policy Compliance**:
   - `muted`
   - `playsInline`
   - `autoPlay`
   - `preload="auto"`
7. **Accessibility & Reduced Motion**:
   - When user enables `prefers-reduced-motion: reduce`, the video element is unmounted and the corresponding high-resolution poster photograph is displayed statically.
   - Interactive manual Pause/Play button is pinned to the bottom-right of the player for keyboard and touch users.

---

## 4. Phase 8 — Premium Photography Brief & Shot List

To replace stock and temporary promotional imagery with authentic, premium Canadian photography for LAURREL SERVICES, use the following shot specifications:

### Style Guide & Creative Direction
- **Lighting**: Bright natural daylight, soft architectural shadows, directional window light. Never harsh artificial flashes or murky night lighting.
- **Colour Grading**: Neutral, clean, slightly warm tones matching `#F8F7F4`. Whites must read clean and crisp, not yellowed or fluorescent blue.
- **Composition**: Calmed geometric grids, leading architectural lines, uncluttered negative space for overlaid copy.
- **Models & Talent**: Authentic, professional Canadian service crew wearing neat, unobtrusive apparel in neutral charcoal or dark purple (`#390044`). Never cheesy staged smiles or thumbs-up poses.
- **Authenticity**: Never generate or deploy fake buildings or non-existent company vehicles. Focus on genuine spaces, authentic packing materials (clean kraft boxes, heavy-duty quilted blankets), and real Ottawa residential interiors (glebe, centretown, westboro, kanata architectural styles).

### Targeted Shot Specifications

#### Shot 1: Residential Handover Clean (`cleaning-poster.jpg` / Services Detail)
- **Subject**: A spotless sunlit living room or kitchen island showing reflective clean surfaces, vacuumed wood flooring, and freshly dusted architectural millwork.
- **Composition**: Wide interior angle, camera at 1.2m height. Foreground clean surface leading into background depth.
- **People**: Optional: Cleaner in clean charcoal uniform seen from the side/back finishing a surface with a microfiber cloth.
- **Aspect Ratio**: 4:3 (Hero) and 16:10 (Services page). Minimum 2400x1800 px.
- **Recommended Filename**: `laurrel-ottawa-cleaning-handover-01.jpg`

#### Shot 2: Professional Move Transit (`moving-poster.jpg` / Services Detail)
- **Subject**: Careful placement of well-labelled, durable packing boxes and furniture wrapped in navy/charcoal moving blankets inside a bright residential foyer.
- **Composition**: Centered 4:5 or 3:4 portrait crop for the Homepage About section, landscape 16:10 for the Services page.
- **People**: Two professional movers lifting a protected piece of furniture with proper form.
- **Aspect Ratio**: 4:5 portrait and 16:10 landscape. Minimum 2400x3000 px.
- **Recommended Filename**: `laurrel-ottawa-moving-coordination-01.jpg`

#### Shot 3: Transitional Storage Organization (`storage-poster.jpg` / Services Detail)
- **Subject**: Well-organized, clean, secure holding space with neatly stacked boxes, protective mattress covers, and tidy aisle space.
- **Composition**: Straight-on linear perspective showing order and security.
- **People**: None (emphasizes calm security and organization).
- **Aspect Ratio**: 16:10. Minimum 2400x1500 px.
- **Recommended Filename**: `laurrel-transitional-storage-secure-01.jpg`

#### Shot 4: National Capital Region Shared Banner (`laurrel-room.png` / Banners)
- **Subject**: Modern, airy Canadian residential living space with high ceilings and expansive windows.
- **Composition**: Extreme panoramic wide (21:9), with the lower two-thirds having soft, clean negative space suitable for white/purple typography.
- **Aspect Ratio**: 21:9 (1440x480 px minimum).
- **Recommended Filename**: `laurrel-ottawa-interior-banner-01.jpg`

---

## 5. Media Editing & Publishing Workflow in Sanity

1. **Access Studio**: Open `https://laurrel.sanity.studio` (or `http://localhost:3333` locally).
2. **Log in**: Sign in using your authorized Sanity Google, GitHub, or email account.
3. **Navigate to Document**:
   - For Hero Service Videos and Posters: Click **Homepage Hero & Service Videos**.
   - For Homepage About Photo: Click **Homepage About Section** → **Centre Service Photograph**.
   - For Service Page Images: Click **Services Page** → **Services** → Choose Cleaning, Moving, or Storage.
4. **Upload or Replace Asset**:
   - Drag and drop your new image or video MP4 file into the asset field.
   - Or paste an approved CDN / S3 URL in the External Video URL field.
   - Set the **Focal Point / Hotspot** on the uploaded image so automatic responsive crops maintain the primary subject on mobile and desktop.
   - Enter descriptive **Alt Text** for accessibility and SEO.
5. **Publish**: Click the green **Publish** button at the bottom-right.
6. **Website Update**: The Next.js website revalidates content every 60 seconds (ISR) and will immediately serve the new media to all visitors.
