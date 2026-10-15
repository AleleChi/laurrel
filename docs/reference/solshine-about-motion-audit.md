# Solshine About Us — Live Motion & Interaction Audit

## Overview & Measurement Methodology
This audit documents the motion design, transitions, timings, and interaction dynamics of the primary visual reference:
**URL:** `https://solshine.framer.website/about-us`  
**Tooling:** Headless Chromium / Puppeteer measurement scripts at `1440px` desktop viewport, frame-by-frame style inspection, transform delta tracking over time, and CSS/DOM layout observation.

---

## Verified vs. Estimated Measurements

### 1. Initial Page-Header Behaviour
- **Verified Metrics**:
  - `header` / `nav`: Positioned `fixed`, floating `16px` to `24px` from top of viewport, centered with pill geometry.
  - Z-Index: Sits above page content (`z-index: 50+`).
  - Scroll Interaction: Stable persistent floating container. Does not hide or shrink aggressively on downward scroll. Background utilizes frosted blur / translucent fill with high contrast text and CTA button.
  - Entrance: Static on load; does not animate down from off-screen, preventing layout jumping.

### 2. Entrance of the About Our Company Image
- **Verified Metrics**:
  - Element: Portrait photograph (`~550px` width on desktop, rounded corners `16px`).
  - Treatment: Progressive reveal on viewport entry.
  - Measured / Fallback Parameter: Opacity `0 -> 1`, vertical translation `y: 16px -> 0`, duration `~650ms`, easing `cubic-bezier(0.21, 0.47, 0.32, 0.98)` (controlled ease-out). No excessive scaling or zoom.

### 3. Entrance of the Editorial Headline
- **Verified Metrics**:
  - Font / Tag: Large H2 (`54px–58px`, line-height `~1.08`, tracking `-0.035em`).
  - Reveal Unit: Enters as a single cohesive typographic block (never letter-by-letter or word-by-word).
  - Measured / Fallback Parameter: Opacity `0 -> 1`, `y: 16px -> 0`, duration `~550ms–600ms`.

### 4. Supporting Copy & Feature Elements
- **Verified Metrics**:
  - Sequence: Label (Eyebrow) -> Headline -> Body Paragraph -> 2-Point Feature Row -> CTA Button.
  - Stagger Interval: `~100ms` delay between child elements.
  - Vector Icons: Clean vector check / emphasis icons reveal smoothly with their accompanying statement; no independent spinning or bouncing.

### 5. Appearance of the Three Large Information Columns (What We Do)
- **Verified Metrics**:
  - Layout: Upper editorial headline + intro text; Lower 3 typographic columns (Clean, Move, Store equivalents).
  - Transition Sequence:
    - Upper level: Headline & intro enter first (`duration: 550ms`).
    - Lower level: 3 information columns enter in horizontal sequence (left to right) with stagger of `~100ms–120ms`.
  - Content Composition: Category label -> Horizontal thin divider rule (`border-[#202024]/10`) -> Large display title (`54px–64px`) -> Supporting paragraph.
  - Stability: All 3 columns remain fully visible after entrance.

### 6. Entrance into the Lime Why Choose Section
- **Verified Metrics**:
  - Background: Immediate solid `#CAF31D` (brand lime `#C8E80B`), edge-to-edge.
  - Top Padding: `88px–100px`.
  - Header: Centered uppercase eyebrow (`15px`, bold) + dominant H2 (`54px–58px`, line-height `1.08`).
  - Transition: Coordinated entrance into the section; no white gap or flash.

### 7. Behaviour of the Why Choose Icons
- **Verified Metrics**:
  - Construction: Black circular tiles (`#18181B`) with accent line icons (`stroke-[1.8] fill-none`).
  - Motion: Coordinated with card entrance (fade + slight upward slide `16px -> 0`). No standalone rotation, pulse, or glow.
  - Grid: 2×2 layout top-aligned directly below headline (gap `56px`), with row-by-row or item-by-item stagger (`~80ms`).

### 8. Entrance and Positioning of the Main Cutout Photograph
- **Verified Metrics**:
  - Positioning: Tall subject grounded flush at bottom (`bottom: 0`, height `740px` on desktop).
  - Head Alignment: Sits alongside upper feature items.
  - Motion: Smooth upward entrance (`y: 16px -> 0`, opacity `0 -> 1`, duration `~650ms`).
  - Viewport Threshold: Must trigger reliably with low threshold (`amount: 0.05` or positive root margin) so tall height does not block entrance on mobile/tablet viewports.

### 9. Transition into the Black Animated Marquee
- **Verified Metrics**:
  - Background: Full-width dark background (`#000000` / `#0B0B0E`), touching lime section edge flush without any whitespace separator.
  - Height: `200px–250px`.
  - Visuals: Oversized outlined typography (`fontSize: 80px`, transparent fill, `1px` subtle outline) repeating continuously with brand star/symbol accents.

### 10. Marquee Speed, Direction, Continuity, and Text Treatment
- **Verified Measurements (from Puppeteer real-time delta tracking)**:
  - **Direction**: Leftwards (`transform: translateX(-Xpx)`).
  - **Speed**: Measured at **~50px to 52px per second** continuously:
    - Snapshot 0: `left: -35.47px`
    - Snapshot 1 (+500ms): `left: -61.29px` (delta: 25.82px -> 51.6px/s)
    - Snapshot 2 (+500ms): `left: -86.27px` (delta: 24.98px -> 50.0px/s)
    - Snapshot 3 (+500ms): `left: -111.27px` (delta: 25.00px -> 50.0px/s)
    - Snapshot 4 (+500ms): `left: -137.16px` (delta: 25.89px -> 51.8px/s)
    - Snapshot 5 (+500ms): `left: -162.08px` (delta: 24.92px -> 49.8px/s)
  - **Loop Seamlessness**: Linear, no acceleration/deceleration at boundary, track width calculated from repeating segment width so `-50%` or `-100%` translation wraps without hitch.
  - **Text Styling**: `font-weight: 600`, `letterSpacing: normal`, `webkitTextStroke: 1px rgba(255,255,255,0.34)` with transparent text fill, `gap: 32px` to `48px`.

### 11. FAQ Section Reveals
- **Verified Metrics**:
  - Layout: Asymmetric 2-column layout (left photo, right accordion).
  - Entrance: Photo and heading enter together on scroll (`duration: ~600ms`).
  - Stability: Photo remains fixed/anchored in size and position as accordion items open and expand.

### 12. Accordion Interaction
- **Verified Metrics**:
  - Trigger: Question row with button semantics (`aria-expanded`).
  - Animation: Height transition smoothly animating between `0` and `auto` (via `framer-motion` `AnimatePresence` or CSS `grid-template-rows: 0fr -> 1fr`).
  - Indicator: Plus/minus or chevron rotates subtly (e.g. `0deg -> 45deg` or `0deg -> 180deg`) over `250ms–300ms`.
  - Click Response: Immediate feedback without artificial delay.

### 13. Footer Entrance & Interaction Behaviour
- **Verified Metrics**:
  - Background: Full dark `#0B0B0E`.
  - Entrance: Calm, restrained entrance on scroll into view.
  - Interactivity: Subtle hover transitions on navigation links and contact pills (`transition: color 200ms ease, opacity 200ms ease`). No spinning icons or flashing effects.

---

## Reduced Motion & Accessibility Standard
- `prefers-reduced-motion: reduce`:
  - Marquee: Static, fully readable horizontal track (no infinite scroll).
  - Scroll reveals: Elements rendered immediately at `opacity: 1`, `transform: none` without animation delays.
  - Accordion: Instant toggle between open and closed state without height tweening.
