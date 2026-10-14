# CONTINUE LAURREL SERVICES — EXECUTE PHASE 01 NOW

You have already inspected https://acrepair.framer.website/ in depth and reported its layout, design tokens, animation principles and header/hero structure. **Do not restart another long reverse-engineering exercise. It is time to implement.**

I am providing a project starter package with `AGENTS.md`, `PHASE_01_BUILD_PROMPT.md`, actual brand/hero assets and a labelled visual target.

First, confirm these exact relative files are present in your project (if I uploaded the ZIP, extract/copy its contents into the project root, preserving the directory structure):
- `AGENTS.md` (permanent global rules)
- `PHASE_01_BUILD_PROMPT.md` (complete technical and copy specification)
- `public/assets/brand/laurrel-logo-source.png` (authentic user-supplied promotional logo; not a transparent SVG)
- `public/assets/hero/laurrel-room.png` (authentic user-supplied photo of the living room)
- `references/visual-layout-target.png` (concept image: layout direction only, NOT production website artwork or authentic logo source)
- `references/mobile-concept.png` (earlier responsive concept: direction only)

If an expected file is missing, name it precisely and proceed with everything else possible; do not silently replace user assets with invented images. Do not claim you can see the user images unless they exist in the local project.

## BUILD DECISIONS ALREADY APPROVED FOR THIS PHASE

- Company name: `LAURREL SERVICES` (spell LAURREL, with double R). Ottawa, Ontario is the initial target market. Do not revert to the earlier provisional brand name Closing Deals.
- Three services: Cleaning, Moving, Storage. Do not invent additional service capabilities.
- Reference: AC Repair Framer layout rhythm — floating light nav, text-left/media-right hero, concise contact support card, and restrained ticker — translated into original brand design, not copied code.
- Colour foundation (provisional samples from logo): deep purple `#390044`, lime `#C8E80B`, warm white `#F8F7F4`, dark ink `#202024`. Configure as updateable CSS variables.
- Typography: use the exact identified reference font only if the audit can VERIFY it. Otherwise use Manrope consistently and record the choice. No decorative or generative fonts.
- Tech: Next.js App Router, TypeScript strict, Tailwind, Motion for React only where it improves UX, Lucide icons, CMS-ready typed content/config. Sanity integration is planned later, not required in Phase 01.
- Responsive, accessible, keyboard tested, reduced-motion aware, mobile-first, SEO-conscious.

## HEADER — BUILD IT, DO NOT ONLY DESCRIBE IT

Responsive, compact, floating/sticky warm-white bar with authentic brand identity on left, center links `Home`, `Cleaning`, `Moving`, `Storage`, `About`, and right purple `Get a Quote` CTA with arrow icon. The header must feel editorial and premium rather than like an AI-generated dashboard. On mobile: logo + accessible menu + accessible quote pathway. Do not put the entire original promotional logo screenshot in the header if it becomes unreadable; use a faithful text wordmark with the original logo mark if practical and flag the transparent-vector logo as a future needed asset. Avoid fabricating a symbol unrelated to the supplied logo.

## HERO — USE THIS EXACT COPY

Eyebrow: `CLEANING · MOVING · STORAGE IN OTTAWA`

H1, three purposeful lines:
`Clean spaces.`
`Smooth moves.`
`Secure storage.`

Body: `Whether you’re preparing a property, moving to a new address, or need space for belongings in between, Laurrel Services helps you arrange the work in one place.`

Primary action: `Request a Quote`
Secondary action: `Explore Services`

Compact supporting element:
`Need help planning your service?`
`Tell us what you need and your preferred date.`
`Get in Touch`

Right media: use `public/assets/hero/laurrel-room.png` with a carefully adjusted object-position preserving windows, sofa and staircase. The still image must be attractive on its own. Do not use the screenshot mockup as the actual hero image.

When `public/assets/hero/laurrel-hero.mp4` is supplied later, support muted autoplay looping playsInline video, progressive loading and image fallback. **No hero video is currently supplied; do not fabricate a video or block implementation waiting for one.** Respect reduced-motion preferences.

After hero: slim repeating ticker of `Cleaning`, `Moving`, `Storage` with understated Lucide icons and a slow seamless motion that stops for reduced-motion users, without duplicate screen reader announcements.

## INTERACTIONS AND QUALITY

Every button needs an honest and usable action. If quote/contact backend is not connected yet, provide a clearly labelled inquiry interface with no fake successful submission. Avoid broken routes and false contact information. Keep labels, images and other content centralized in typed config, ready for Sanity CMS mapping later.

Implement semantic HTML, one H1, en-CA locale, title `Cleaning, Moving & Storage in Ottawa | Laurrel Services`, relevant meta description, real image alt text, visible keyboard focus and accessible mobile menu. No fabricated testimonials, ratings, insured claims, secure facility details, availability or guarantees. Brand tagline `Secure storage` is supplied in the logo, but facility protections and the exact service model still require business confirmation before production release.

Desktop target first: 1440 × 900; then 1024 × 768, 768 × 1024, 390 × 844 and 375 × 812. Layout, spacing, font weight, headline wrap, image cropping, button states, ticker speed and header positioning must be reviewed at these sizes.

## EXECUTION INSTRUCTIONS

1. Read `AGENTS.md` and `PHASE_01_BUILD_PROMPT.md`. Leverage your completed reference inspection, and write the key findings into `docs/reference-audit.md` with notes on any unverifiable values.
2. Show a concise implementation plan (maximum 10 lines), then **implement the files immediately**. Do not stop to ask for files already in the project.
3. Start the dev server and fix TypeScript, build, accessibility and layout issues that are visible in the browser.
4. Capture actual running-page screenshots at desktop and mobile. Compare against `references/visual-layout-target.png` and the live Framer reference; refine the implementation. No claims of screenshot validation unless performed.
5. Report what actually works, exact files created/changed, unresolved integration items and screenshot locations.
6. **STOP after the header, hero and ticker.** Do not start the About section or a full generic website. Wait for my approval.

Be decisive. I am requesting a working Phase 01 implementation, not another research report.
