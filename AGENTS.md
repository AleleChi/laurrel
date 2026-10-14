# LAURREL SERVICES — PROJECT-WIDE AGENT RULES

You are building an original Canadian cleaning, moving, and storage website for LAURREL SERVICES (spell LAURREL consistently). Our visual reference is https://acrepair.framer.website/ . Follow its clean service-business layout rhythm, not its proprietary assets or literal text.

## Design system
- Brand colours (provisional): deep purple #390044; lime #C8E80B; warm white #F8F7F4; ink #202024.
- Lime is an accent; ensure readable text contrast and accessible buttons.
- Typography: inspect and document reference font when possible. Otherwise use Manrope, consistently across pages.
- Premium restraint: generous white space, clean grid, authentic media, clear buttons, subtle shadow, restrained corners; no neon, glow, excessive gradients, glassmorphism, or decorative AI clichés.
- Reuse global design tokens/components; do not redefine different colour palettes or fonts for later sections.

## Copy and factual integrity
- Voice: specific, calm, human, useful and locally relevant; never generic hype.
- Three services: Cleaning, Moving, Storage. Ottawa is initial geographic focus.
- Never invent verified reviews, client counts, project totals, licences, insurance, guarantees, storage-facility ownership, business address, pricing, crew qualifications or availability.
- Do not claim services are offered in a given town until confirmed. Confirm storage model before claiming a secured facility.
- All user-facing text must be editable from central content/config now and CMS later.

## Engineering
- Next.js App Router, TypeScript strict, Tailwind CSS; Motion where meaningful; simple CSS transitions otherwise.
- Componentize by section, with stable layouts and real semantic HTML.
- Mobile-first, keyboard accessible, reduced-motion-friendly. Prioritize Core Web Vitals and responsive media.
- Each build phase must include real browser review at desktop, tablet, mobile and an implementation walkthrough.
- Do not build beyond the currently approved section(s) without explicit instruction.
- Never pretend a form sends data or claim screenshots/tests were performed unless they were.
