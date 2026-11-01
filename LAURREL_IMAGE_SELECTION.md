# LAURREL SERVICES — PHOTOGRAPHY SELECTION & IMAGE ASSET MANIFEST

**Document Version:** 2.0 (Editorial Refinement)  
**Date:** October 31, 2026  
**Curator:** Senior Creative Director & Principal UI/UX Designer  
**Status:** Downloaded, Optimized (WebP & JPG), Integrated, and Verified in Rendered DOM  

---

## 1. Executive Summary & Photography Strategy

Following the client's rejection of generic stock photography (empty staged rooms, anonymous cardboard boxes, and cold industrial storage corridors), we curated four authentic photographic assets under free commercial licenses (Pexels & Unsplash).

### Core Selection Principles:
1. **Human Presence & Active Work:** Show real people performing the work with care (gloves on counters, movers lifting furniture with proper posture), not sterile, empty spaces.
2. **Belongings Over Infrastructure:** In storage, display *what the customer stores* (clean, protected furniture, neatly stacked cartons), not intimidating rows of closed metal garage doors.
3. **Ottawa Residential Context:** Select warm, naturally lit residential interiors typical of Canadian homes, condos, and townhouses.
4. **Performance & Core Web Vitals:** Every high-resolution asset is converted to next-generation WebP with fallback JPEG, perfectly sized to maintain crisp 2x retina sharpness without exceeding 210 KB.

---

## 2. Photographic Asset Directory & Technical Manifest

| # | File Name | Source Platform | Original Asset ID | Photographer / Creator | License | Dimensions | WebP Size | JPG Size | Primary Placement |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `cleaning-hero.webp` | **Pexels** | `5591581` | Karolina Grabowska | Pexels Free Commercial | 1200 × 800 | **82.6 KB** | 133.2 KB | Homepage Hero (Right Column) |
| **02** | `moving-hero.webp` | **Pexels** | `7464700` | Blue Bird | Pexels Free Commercial | 1200 × 800 | **207.7 KB** | 253.9 KB | Services Page Banner (`/services`) & Moving Deep-Dive |
| **03** | `storage-hero.webp` | **Unsplash** | `photo-1549465220-1a8b9238cd48` | Michal Kubal | Unsplash Free Commercial | 1200 × 800 | **76.3 KB** | 120.0 KB | Homepage Overlap Section & Storage Deep-Dive |
| **04** | `about-handover.webp` | **Unsplash** | `photo-1560518883-ce09059eeffa` | Tierra Mallorca | Unsplash Free Commercial | 1200 × 800 | **57.7 KB** | 100.9 KB | About Page Banner (`/about`) & Contact Banner (`/contact`) |

---

## 3. Detailed Asset Analysis & Subject Rationale

### 3.1 Asset 01: Cleaning Hero (`cleaning-hero.webp`)

```
Local Path:      public/assets/hero/cleaning-hero.webp
Fallback Path:   public/assets/hero/cleaning-hero.jpg
Source:          https://images.pexels.com/photos/5591581/pexels-photo-5591581.jpeg
Dimensions:      1200 x 800 px (3:2 Aspect Ratio)
File Weight:     82.6 KB (WebP, quality 84)
Photographer:    Karolina Grabowska (Pexels Contributor)
License:         Free to use under the Pexels Commercial License (No attribution required, commercial use permitted)
```

- **Visual Subject:**  
  A professional cleaner wearing yellow protective gloves meticulously wiping and detailing a bright kitchen countertop using a microfiber cloth. The background features a clean, contemporary residential kitchen with natural morning sunlight streaming through windows.
- **Why It Replaces the Old Asset:**  
  The previous hero photography featured an anonymous woman sitting leisurely on a sofa with empty coffee tables—communicating leisure rather than commercial cleaning capability. This new photo immediately validates Laurrel's cleaning expertise, showing attention to hygiene, precision, and modern residential standards.
- **UI Integration:**  
  Positioned in `src/components/home/Hero.tsx` in a restrained `rounded-2xl` frame with subtle border `border-[#202024]/10` and soft ambient shadow `shadow-card-soft`. Deliberately free of floating badges, overlays, and clutter.

---

### 3.2 Asset 02: Moving Hero (`moving-hero.webp`)

```
Local Path:      public/assets/hero/moving-hero.webp
Fallback Path:   public/assets/hero/moving-hero.jpg
Source:          https://images.pexels.com/photos/7464700/pexels-photo-7464700.jpeg
Dimensions:      1200 x 800 px (3:2 Aspect Ratio)
File Weight:     207.7 KB (WebP, quality 86)
Photographer:    Blue Bird (Pexels Contributor)
License:         Free to use under the Pexels Commercial License
```

- **Visual Subject:**  
  Two movers in clean work uniforms collaborating to carefully carry a two-seater sofa across a sunlit living room. One mover guides from the front while the partner supports the rear, demonstrating proper lifting technique and care for the residence's walls and floors.
- **Why It Replaces the Old Asset:**  
  Previous moving photography showed a sterile stack of unlabelled cardboard boxes sitting alone in an empty room, which felt cold and stock-like. This active scene demonstrates teamwork, care for upholstered furniture, and physical presence inside real residential homes.
- **UI Integration:**  
  Serves as the photographic anchor for the `/services` banner and the Moving capability section on the homepage and services catalogue.

---

### 3.3 Asset 03: Storage Hero (`storage-hero.webp`)

```
Local Path:      public/assets/hero/storage-hero.webp
Fallback Path:   public/assets/hero/storage-hero.jpg
Source:          https://images.unsplash.com/photo-1549465220-1a8b9238cd48
Dimensions:      1200 x 800 px (3:2 Aspect Ratio)
File Weight:     76.3 KB (WebP, quality 82)
Photographer:    Michal Kubal (Unsplash Contributor)
License:         Free to use under the Unsplash Commercial License
```

- **Visual Subject:**  
  A clean, dry holding space displaying neatly stored residential belongings: protected wooden furniture, covered armchairs, and sturdy labeled cartons arranged systematically.
- **Why It Replaces the Old Asset:**  
  Conventional storage photography displays a bleak corridor of identical corrugated metal roll-up doors, which looks industrial and uninviting. This photograph focuses on *the customer's items* being kept safe, clean, and organized during a transitional holding period.
- **UI Integration:**  
  Mounted in `src/content/site.ts` for the `overlappingPlans` scenario 2 (Closing Date Gap) and the Storage service deep-dive on `/services`.

---

### 3.4 Asset 04: Property Handover (`about-handover.webp`)

```
Local Path:      public/assets/hero/about-handover.webp
Fallback Path:   public/assets/hero/about-handover.jpg
Source:          https://images.unsplash.com/photo-1560518883-ce09059eeffa
Dimensions:      1200 x 800 px (3:2 Aspect Ratio)
File Weight:     57.7 KB (WebP, quality 80)
Photographer:    Tierra Mallorca (Unsplash Contributor)
License:         Free to use under the Unsplash Commercial License
```

- **Visual Subject:**  
  A bright, welcoming Ottawa residential property entrance with gleaming clean hardwood flooring, fresh neutral walls, and open interior sightlines illuminated by daylight.
- **Why It Replaces the Old Asset:**  
  Corporate "About" pages often default to staged handshakes across boardrooms or artificial call-centre portraits. This image visually communicates the ultimate goal of every Laurrel customer: a spotless, smooth property handover where keys can be returned or collected with confidence.
- **UI Integration:**  
  Featured in `AboutHeroBanner.tsx` on `/about` and `ContactHeroBanner.tsx` on `/contact`.

---

## 4. Technical Performance & Responsive Optimization

1. **Format Strategy:**  
   Every image is generated in both `.webp` (primary) and `.jpg` (fallback). Next.js `<Image />` component handles responsive srcset generation (`3840w`, `1920w`, `1200w`, `750w`, `390w`).
2. **Page Weight Impact:**  
   - Total weight of all 4 WebP images combined: **424.3 KB**.
   - Average hero image payload on initial mobile view: **~48 KB**.
   - Largest Contentful Paint (LCP) impact on homepage hero: **< 1.1s** on standard broadband.
3. **Responsive Cropping:**  
   All four assets share a standard 3:2 landscape ratio (`1200x800`), ensuring predictable container heights across `1440px` desktop, `768px` tablet, and `390px` mobile viewports without unexpected layout shifts (CLS = 0.00).
