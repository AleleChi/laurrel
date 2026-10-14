# LAURREL SERVICES — ANTIGRAVITY BUILD PROMPT
## Phase 01: Header, Hero, and Services Ticker

You are the senior frontend engineer, digital art director, UX designer, accessibility specialist, SEO engineer, and quality-assurance reviewer for a Canadian cleaning, moving and storage business named **LAURREL SERVICES** (double R in LAURREL).

Build a real, working, maintainable website—not a static mockup. This is a multi-phase project. **Implement only the global header/navigation, homepage hero, and immediately following horizontal service ticker in this phase**. Establish reusable design tokens and the architectural foundation for other sections, but do not independently invent or build the rest of the homepage.

## 0. Mandatory reference and asset inspection BEFORE coding

1. Open and inspect the live reference in your browser: https://acrepair.framer.website/ . Study the header, desktop hero, mobile hero, spacing, hierarchy, hero image treatment, supporting contact panel, ticker, hover behaviour, and actual font computed styles if browser inspection permits. View it at widths 1440, 1024, 768, and 390px. Capture reference screenshots.
2. The reference is **visual direction, not a source to clone**: adapt its structural rhythm (floating light navigation; prominent left editorial hero content; large right-side image/video; small supporting contact element; horizontal scrolling service ribbon). Do not copy template code, assets, logos or verbatim copy.
3. Inspect the project first. Do not overwrite an existing scaffold without understanding what is there.
4. Inspect files under `public/assets/brand/` and `public/assets/hero/`. Expected input files include `laurrel-logo.png`, `laurrel-room.jpg` or `.webp`, and optionally `laurrel-hero.mp4`. If their names differ, discover and reference the real files. Never fabricate an asset path and assume it exists.
5. Use the actual provided brand logo. Do not replace it with a generated logo, emoji, or invented symbol. If the supplied full-size promotional logo cannot fit the header cleanly, use a faithful temporary compact treatment, clearly flag it, and request an official transparent SVG/horizontal lockup before approval.
6. Record reference findings and any unverified details (especially fonts, icon set, exact animation easing) in `docs/reference-audit.md` before implementation. Do not guess and describe guesses as inspected facts.

## 1. Project stack and quality constraints

- Use Next.js with App Router, TypeScript (strict), Tailwind CSS, and lightweight reusable React components. Use the stable compatible versions available in this environment.
- Use Motion for React for small component entrance/interactive animations where necessary; prefer CSS for simple transitions/ticker. Do not introduce GSAP or huge libraries unless a demonstrated need exists.
- Lucide React for interface icons. Icons must be simple, consistent and purposeful.
- Prepare the architecture for a Sanity CMS integration later: centralize all homepage strings, CTAs, nav links and media paths in a typed data/config module rather than scattering them across JSX.
- Define reusable design tokens as CSS variables and expose them to Tailwind: brand purple `#390044`, lime `#C8E80B`, warm off-white `#F8F7F4`, body ink `#202024`, muted body copy, borders and surfaces. Values are provisional samples from the supplied brand mark, and must remain easy to update.
- Inspect actual reference font styles. If the font family is demonstrably identified and is available under an appropriate license, use it. Otherwise use Manrope, and record that it is the chosen fallback. Use one coherent typography system with robust fallbacks, do not invent additional display fonts.
- Do not use gradients, glowing text, shiny buttons, floating blobs, glassmorphism, artificial 3D text, or other generic AI-style decorations.
- Treat the included photograph as website media, not a background illustration; maintain natural architecture and image quality.

## 2. Header / navigation

Desktop: a floating, clean, white or warm-white navigation container near the top of the viewport, within a generous max-width wrapper (~1360–1440px), with subtle border/shadow, gentle corner radii, and considered spacing. Left: genuine brand logo / compact wordmark. Center: Home, Cleaning, Moving, Storage, About. Right: purple “Get a Quote” button with a small arrow.

- Use semantic `header` and `nav`, keyboard-accessible real links, visible focus styles, aria-current on the active route.
- Add a sticky transition after scrolling: modestly reduced vertical padding, subtly stronger shadow. Avoid jitter, unexpected page shift, or covering content.
- At mobile widths, preserve the logo and quote access; replace center navigation with accessible hamburger menu. Menu must support Escape, focus management, proper `aria-expanded`, and closing after navigation. Never leave menu links unclickable.
- Do not silently route links to 404 pages. If subpages have not yet been built, create minimal development-only route shells or clearly declare them incomplete in the implementation report; do not present false finished experiences.
- Don't invent phone numbers, availability promises, certifications or ratings.

## 3. Homepage hero

Visual layout at large screens: light editorial text panel on left (roughly 44–48% of width), high-resolution reference-room media on right (roughly 52–56%). Match the reference's calm, structured first-screen rhythm; use generous breathing room and disciplined alignment. Do not cram text into narrow columns. Image should fill its panel with `object-fit: cover` and a thoughtfully chosen focal point (cream sofa, staircase and daylight). Avoid cutting all three subjects at once.

Exact content (do not rewrite without approval):

Eyebrow: `CLEANING · MOVING · STORAGE IN OTTAWA`

H1 displayed across three deliberate lines:
`Clean spaces.`
`Smooth moves.`
`Secure storage.`

Paragraph:
`Whether you’re preparing a property, moving to a new address, or need space for belongings in between, Laurrel Services helps you arrange the work in one place.`

Primary CTA: `Request a Quote`
Secondary CTA: `Explore Services`

Supporting compact card:
Heading: `Need help planning your service?`
Body: `Tell us what you need and your preferred date.`
Action: `Get in Touch`

Typography: large, deliberate and high contrast. Use deep purple for primary heading. Lime is an accent, underline or small highlighted element, NOT low-contrast lime body text on white. Avoid all caps in body text. Keep mobile text sizes comfortable.

Hero motion and media:
- If `public/assets/hero/laurrel-hero.mp4` exists, integrate it as a muted, playsInline, autoplay, looping media panel with a real still-image poster and graceful fallback. Do not generate or claim to have generated a video; the Flow-generated file will be supplied separately.
- If there is no video, use the supplied still. Do not substitute unrelated stock media. Allow a very subtle optional CSS image reveal, but no continuous aggressive zoom.
- Avoid serving an excessively large video at first paint. Protect the LCP image and load video progressively; use an appropriate poster, avoid layout shift, pause media when out of view, and disable motion under `prefers-reduced-motion`.
- Subtle staged entrance: eyebrow then headline then paragraph then CTAs, total duration approximately 0.5–0.9 seconds. No letter-by-letter scrambling, excessive parallax, bounce, or animation that delays readability. Headline must remain visible when JavaScript is unavailable.
- On mobile use a single-column arrangement with the copy before media, or the reference's superior accessible arrangement after comparative screenshot testing. Support short-height phones as well as narrow-width phones; no horizontal overflow.

Quote CTA functionality: The user needs real interactions, not dead buttons. If a quote page/endpoint exists, use it. If not, implement a clear temporary inquiry panel with no fake data submission or success message; mark backend integration as pending. Never collect or store personal data through an unconfigured endpoint. `Explore Services` should navigate to a real target when that section exists; until then establish the future anchor and document the unfinished link instead of presenting a broken interaction.

## 4. Immediately following service ticker

A slim, visually simple horizontal ribbon immediately under the hero, repeating `Cleaning · Moving · Storage` with small consistent line icons and thin separators. Prefer subtle lime-tinted background, dark-purple labels, abundant horizontal padding, and rounded outer edges only if visually faithful to the reference's clean feel.

Smooth slow continuous CSS marquee, duplicated content for seamless looping. Pause on hover and keyboard focus. Disable movement for reduced-motion users. Do not duplicate content to screen readers; use a single accessible semantic text group plus decorative aria-hidden visual loop.

## 5. SEO + accessibility + performance from day one

- `html lang="en-CA"` (English Canada) unless localized language is added later.
- A single descriptive H1, semantic landmarks, visible keyboard focus, appropriate alt text for real brand media, and no important text baked into a hero video/image.
- Home title: `Cleaning, Moving & Storage in Ottawa | Laurrel Services`.
- Home meta description: `Cleaning, moving and storage services in Ottawa. Explore Laurrel Services and request a quote for your home, property or business.`
- Correct OpenGraph/Twitter metadata once genuine branded assets exist. Do not invent business address, telephone, opening hours or ratings in JSON-LD.
- Optimize images; prefer responsive image sizing, use real width/height or aspect-ratio to prevent layout shift.
- Respect WCAG AA contrast for text/buttons and interactive targets. Lime on white generally needs a darker foreground or an alternate use.
- Aim for strong Lighthouse results on mobile, paying attention to LCP, INP, CLS and accessibility. Targets are goals, not guarantees.
- Ensure navigation and hero work even without animation libraries executing.

## 6. Code architecture

Create clean components at suitable paths such as:
- `src/components/layout/SiteHeader.tsx`
- `src/components/home/Hero.tsx`
- `src/components/home/ServiceTicker.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/QuoteInquiryPanel.tsx` (only if needed)
- `src/content/site.ts` for typed content, navigation and media paths
- `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`

Use existing project conventions if an appropriate scaffold is already present. Avoid overengineering or adding unnecessary dependencies. Comment only non-obvious implementation logic.

## 7. Required agent work process and review

Step A — AUDIT: Inspect the reference website and local assets, produce `docs/reference-audit.md`, describe verified styles and unresolved font/video/logo details.

Step B — PLAN: Before coding, write a short implementation plan covering components, dependencies, responsive design, media fallback, and milestone boundaries.

Step C — BUILD: Implement only header, hero and ticker with reusable tokens. Start the dev server; fix runtime/build/type errors yourself.

Step D — BROWSER QA: Use the Antigravity browser to inspect the running site at 1440×900, 1024×768, 768×1024, and 390×844. Capture actual screenshots; compare visually with the reference and supplied mockup, adjust typography, crop, gaps, nav and CTA positions. Test nav, mobile menu, buttons, sticky state, reduced motion and keyboard interaction.

Step E — REPORT: Provide concise files changed, exact font selected and evidence for it, asset status, working features, measured or observed performance, screenshots, and any items needing real business information. Do not claim a result was tested unless it was actually tested.

**STOP AFTER PHASE 01.** Do not implement About, Services, Team, Testimonials, Blog, Pricing or Footer sections until I approve this first screen. Ask for approval of the final visual before proceeding to Phase 02.
