# Solshine Service Detail Layout Reference Audit

**Reference URL:** `https://solshine.framer.website/services/solar-panel-cleaning-services`  
**Inspected Date:** October 15, 2026  
**Inspection Method:** Headless Chromium with computed CSS measurements, DOM inspection, and viewport captures (1840px, 1440px, 1024px, 768px, 390px).

---

## 1. Banner Architecture (Hero)

- **Banner Total Height:** `550px` (Desktop 1440px / 1840px).
- **Background:** Full-width photographic edge-to-edge image with dark semi-transparent overlay for text accessibility.
- **H1 Typography:**
  - Font Size: `65px`
  - Line Height: `70px` (`~1.08`)
  - Font Weight: `500` (Medium/Semibold)
  - Color: `#FFFFFF`
  - Alignment: Centered horizontally and vertically in the banner content area.
- **Breadcrumb:**
  - Position: Directly beneath H1 (`~24–32px` vertical gap).
  - Alignment: Centered with H1.
  - Structure: `Home` → `Services` (or current service title).
  - Visual treatment: Rounded pill container with subtle background for functional contrast.
- **Floating Header Clearance:** Banner extends behind the floating transparent/blurred header (`height: 86px`), with top padding `100px 0px 0px` ensuring H1 is fully visible below the header.

---

## 2. Two-Column Service Content Architecture

- **Section Padding:** `120px 20px` (top/bottom `120px`, horizontal gutters `20px` min, centering within `1400px` max-width container).
- **Total Usable Container Width:** `1400px` (at 1440px viewport).
- **Column Split:**
  - **Left Sidebar:** `width: 429.5px` (`~30.7%` of container).
  - **Right Main Content:** `width: 930.5px` (`~66.5%` of container).
  - **Column Gap:** `40px` (`~2.8%`).

---

## 3. Left Sidebar Navigation Panel

- **Outer Panel Container:**
  - Width: `429.5px`
  - Background: `rgb(248, 248, 248)` (Off-white / light neutral `#F8F8F8`)
  - Border Radius: `50px` (Rounded pill container)
  - Padding: `24px`
  - Positioning: `position: sticky; top: 120px;` (sticks while user reads through the substantial article on the right).
- **Navigation Row Items:**
  - Row Height: `58px`
  - Border Radius: `50px`
  - Inactive State: `background: #FFFFFF; color: #18181B;` with subtle hover interaction.
  - Active State: `background: rgb(202, 243, 29)` (Solshine Lime / Laurrel brand lime `#C8E80B`), `color: #18181B`.
  - Row Typography: `18px`, regular/medium weight, tracking-tight.
  - Right Icon: Directional arrow (`14px`) positioned on the right edge.
  - Row Gap: `20px` vertical spacing between stacked rows.

---

## 4. Right Main Article Column

- **Main Editorial H2:**
  - Font Size: `58px`
  - Line Height: `70px` (`~1.2`)
  - Font Weight: `500`
  - Color: `#18181B`
  - Margin Bottom: `24px–32px` to body copy.
- **Body Copy:**
  - Font Size: `18px`
  - Line Height: `1.6–1.65`
  - Color: `#202024` with high contrast readability.
- **Article Photography:**
  - Width: Matches full article column (`930px` desktop).
  - Height: `~380px–420px`.
  - Border Radius: `50px` (or `32px` in Laurrel system for clean architectural restraint).
  - Aspect Ratio: `~16:9` to `~2.35:1`.
- **Working Process & FAQs:**
  - Positioned within the main column flow, continuing the article rhythm.
  - Working process: Editorial numbered sequence.
  - FAQ: Section heading with clean accordion rows.

---

## 5. Responsive Breakpoints

| Viewport | Layout Mode | Sidebar Behavior | Banner Height | H1 Scale |
| :--- | :--- | :--- | :--- | :--- |
| **1840px Desktop** | 2-column split (1440–1560px container) | Sticky left panel (430px) | 550px | 65–72px |
| **1440px Desktop** | 2-column split (1400px container) | Sticky left panel (430px) | 550px | 65px |
| **1024px Laptop** | 2-column stacked or condensed | Sticky or top selector | 480px | 52px |
| **768px Tablet** | Single-column stacked | Top selector / horizontal pills | 420px | 44px |
| **390px Mobile** | Single-column stacked | Compact mobile service selector | 360px | 34px |
