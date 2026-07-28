# Founders Helm — Landing Page Rebuild Prompt

How to use this: everything under the line **"PASTE EVERYTHING BELOW THIS LINE"** is one continuous prompt, written to be pasted as-is into a React/Vite AI builder (Lovable, v0, Bolt, Same.new, etc.). Don't summarize or trim it — the length is doing work; vague builder prompts regress to the generic template you're trying to escape.

This is a **design source, not the deploy target.** Once you like an output, port it into the real Next.js app following your own `LANDING-PAGE-PORT-RUNBOOK.md` — don't let the Vite project become a decoy that nothing builds.

---

## PASTE EVERYTHING BELOW THIS LINE

You are building a single-page marketing landing page for **Founders Helm**, as a standalone **React 18/19 + Vite + TypeScript** project. This is a design-and-copy build — static content, real working scroll/nav/accordion interactions, buttons that link to placeholder routes (`/signup`, `/login`, `#pricing`), no real backend calls.

I am not looking for a template with the brand colors swapped in. I want something that looks like a small, expensive design studio built it in 2026 — not something an AI generator spat out. If your default instinct is a centered hero over a solid gradient panel followed by three identical icon cards, do not do that. Read the "what not to do" section at the end before you start — it's not filler, it's the actual brief.

### 1. The product — use only these facts, invent nothing else

Founders Helm is an all-in-one business operating system for solo founders, freelancers, and small teams. It replaces a scattered stack of 8–10 separate SaaS subscriptions with one flat-priced dashboard.

**Tagline:** Your entire business. One dashboard.

**The 10 integrated products:**
1. **Command Center** — SaaS metrics dashboard: MRR, churn, revenue overview, customer metrics synced from Stripe
2. **CRM** — Contact database with deal pipeline, Kanban board, sales stages, deal history
3. **Projects & Tasks** — Task management with time tracking, project assignment, status tracking
4. **Content Engine** — AI-powered content creation: idea generation, media uploads, publishing analytics
5. **Landing Pages** — Visual page builder: section templates, SEO, custom CSS/JS, lead capture, password protection
6. **Invoices** — Create, send, track invoices with payment status and public invoice views
7. **Feedback Widget** — Embeddable feedback widgets, multiple styles and rating types
8. **Code Vault** — Store and organize code snippets and prompts with search/filter/tagging
9. **Automations** — Workflow automation: 12+ triggers, 10+ actions (email, webhooks, conditional branching, delays)
10. **AI Advisor** — Chat-based AI business advisor with real context from the user's own data

**Other capabilities worth surfacing:** analytics (page views, sessions, geo/device, conversions, UTM tracking), full activity/audit log, multi-workspace with team collaboration, role-based access control (Owner/Admin/Editor/Viewer), dark/light mode, full data export.

**Pricing:**
- Pro — $29/month. All 10 products, unlimited landing pages + custom domain, 10,000 CRM contacts, 100,000 page views/month, unlimited automations, up to 5 team members, priority support.
- Lifetime — $299 one-time. Everything in Pro, unlimited everything, all future features, white-label landing pages, price-lock guarantee, forever.
- 14-day free trial, no credit card required, cancel anytime.

**The three differentiators to build the page around:**
1. **Replace your stack** — one price, every tool, instead of $200–500/month across disconnected SaaS subscriptions
2. **AI with full context** — the AI Advisor reads actual pipeline, revenue, and task data and answers with specifics, not generic chatbot advice
3. **Built acquisition-ready** — row-level security, clean data export, documented stack; built to a standard that acquirers and enterprise buyers actually care about

**FAQ content to include (verbatim facts, you may restyle the presentation):**
- Can I import data from my current tools? — Yes, CSV import for contacts/deals/vault items, Gmail sync for contact history, REST API for programmatic migration. Most founders fully imported within an hour.
- How is the AI Advisor different from ChatGPT? — It has read access to actual Helm data (pipeline, revenue trends, task history, content performance) and can say things like "your biggest deal hasn't had contact in 12 days."
- What happens to my data if I cancel? — Full export access for 30 days after cancellation, CSV or JSON, no data hostage-taking.
- What tech stack does it run on? — Next.js, Supabase (Postgres + Auth + Realtime), Stripe, Vercel, OpenRouter for AI. Row-level security enforced at the database layer.
- Do landing pages support custom domains? — Yes, both paid tiers, automatic SSL.
- Team plans? — Pro includes up to 5 seats, Lifetime is unlimited.

**Audience:** solo founders and very small teams — technical enough to care about "acquisition-ready" as a phrase, sick of subscription sprawl, allergic to enterprise sales process.

**Voice:** direct, confident, a little dry. Founder-to-founder, not marketing-department-to-lead. Short sentences. Zero "synergize/leverage/unlock your potential" language. It's fine to be blunt about the pain of juggling ten tools — that's the hook.

### 2. Technical requirements

- React 18/19 + Vite + TypeScript, strict mode, no `any`
- Tailwind CSS for styling
- Framer Motion for animation — every animation must be purposeful, not decorative filler. Respect `prefers-reduced-motion`.
- Single-page composition: `/src/components/sections/*` (one file per section), `/src/components/ui/*` for reusable primitives (buttons, badges, marquee, accordion), `/src/lib/content.ts` for the copy/data above so it's not hardcoded inline
- Fully responsive from 375px to 1920px+. Design mobile-first — this converts on phones, not just desktop demos. Explicitly verify the 768px and 1024px breakpoints, not just min/max.
- Images: explicit width/height or aspect-ratio on every image to prevent layout shift, lazy-load anything below the fold
- Semantic HTML, one `h1`, real heading hierarchy, alt text on every image, visible keyboard focus states, AA contrast against the dark background
- Ship complete, working files — this needs to run with `npm run dev` immediately, not fragments I have to assemble
- Include a short `SETUP.md` noting anything I need to swap manually (real product screenshots, font files, image sources used)

### 3. Brand system — non-negotiable

- **Background:** true black to deep charcoal, `#0A0A0A` through `#141414`. Not warm brown, not navy, not off-white light mode.
- **Signature accent:** `#f97316` (Tailwind `orange-500`). This is the one saturated color in the entire palette and it means something — treat it as precious, not as a fill color. It shows up in one or two decisive places per section: a glow, a gradient stop trailing off into black, a single highlighted word in a headline, a button, an underline, a chart bar. It never washes flat across an entire section background — that's the exact "boring solid color" trap I'm trying to get away from.
- **Text:** warm off-white/cream (`#F5F5F0` range) for primary text, muted gray (`#8A8A8A` range) for secondary/body copy on dark surfaces
- **Surfaces:** one or two more near-black tones slightly lifted off pure background black for cards/panels, so depth reads through subtle value shifts, not colored fills
- **Typography:** a confident serif or serif-adjacent display face for headlines — something with real character, not a safe system font — paired with a clean grotesk/sans for body and UI text. Headlines should feel oversized and a little reckless, not centered and cautious.
- Absolutely no purple-to-blue or teal-to-blue gradients anywhere. No default violet "AI startup" accent. Orange is the only saturated hue in the system.

### 4. What "2026, not AI-generated" actually means here — build these in deliberately

- **Grain/noise texture** as a subtle overlay on dark sections instead of flat color — gives the black real depth instead of looking like a CSS background-color swatch
- **Broken/asymmetric grid layouts** — not every section needs to be a centered column with identical top/bottom padding. Let some content bleed to the edge, offset columns unevenly, let elements overlap slightly.
- **Oversized kinetic typography** — headlines that are large enough to feel a little unreasonable, mixed weights within the same headline, words picked out in the orange accent
- **Scroll-scrubbed motion, not just fade-up-on-scroll** — vary timing and easing between sections so it doesn't read as one repeated animation template applied 8 times. Give the hero one signature motion moment that nothing else on the page repeats.
- **Bento-grid feature layout with varied card sizes** — not a uniform 3-column grid of identically sized icon cards
- **Real dashboard screenshots in a realistic device/browser frame**, angled or layered with photography and texture — not floating alone on an empty gradient
- **Environmental photography** (a founder working — desk, laptop, coffee, late-night window light) color-graded/duotoned to pull the orange accent through the image, tying photography into the palette instead of leaving it looking like generic stock. Source from Unsplash or Pexels with search terms like: "solo entrepreneur laptop night," "minimalist home office desk," "founder working late city window," "hands typing laptop dark room." Apply a consistent CSS filter/duotone treatment across every photo you use so they read as one shot, not a stock-photo grab bag.
- **A marquee/ticker element** — genuinely useful here: scroll the logos/names of the tools Founders Helm replaces (Notion, Airtable, HubSpot, Mailchimp, Trello, a generic invoicing tool, a generic analytics tool) crossed out or fading, contrasted against the single Founders Helm dashboard
- **Micro-copy with actual personality** in buttons, empty states, and labels instead of generic "Learn More" / "Get Started" everywhere
- Use glassmorphism (blurred translucent panels) in exactly one deliberate spot if at all — not smeared across every card

### 5. Page structure — section by section

**Nav:** sticky, minimal. Logo mark + wordmark, 3–4 anchor links (Product, Pricing, FAQ), single CTA button. Background transitions from transparent to a blurred dark bar as the user scrolls past the hero.

**Hero:** Not a centered headline over a browser-mockup card floating on a gradient. Build an asymmetric composition: a big, kinetic headline built from "Your entire business. One dashboard." (rewrite it further if a stronger line lands — the point is it should feel inevitable, not safe), a real dashboard screenshot in a tilted/perspective device frame layered with environmental photography and grain texture, an orange glow or accent line tracking through the composition. Sub-headline: "Founders Helm replaces your scattered stack of SaaS tools with one integrated platform — built for how solo founders actually work, at a price that makes sense." Primary CTA "Start free trial," secondary "View pricing." Trust row: 14-day free trial · no credit card · cancel anytime. Give this section the one signature motion moment on the page.

**Replace your stack:** the marquee/ticker described above — the tools it replaces, crossed out or dissolving, resolving into the single Founders Helm dashboard.

**Three pillars:** Replace your stack / AI with full context / Built acquisition-ready — from the differentiators above. Redesign as an asymmetric bento layout mixing photography, a small screenshot detail, and text per pillar — not three identical bordered text blocks in a row.

**Feature deep-dive:** pick 3–4 of the 10 products (Command Center, CRM, AI Advisor, Landing Pages are the strongest) and give each a real section — alternating left/right layout, a realistic screenshot mockup, and copy that's specific rather than a one-line feature-grid caption. Scroll-triggered reveal, varied per section.

**AI Advisor spotlight:** its own moment. A realistic chat mockup: "Why is my MRR flat this month?" answered with something specific and data-grounded rather than generic — this is the section that has to prove the "full context" claim, not just assert it.

**Pricing:** Pro $29/mo, Lifetime $299 one-time, facts as listed above. Redesign the two-card layout so the recommended plan actually looks chosen through scale/depth/motion, not just an orange border. Consider a monthly/lifetime toggle interaction even though there are only two static options — motion sells the section.

**FAQ:** the six questions above. Accordion is fine functionally, but elevate it visually — don't ship the default plain list-with-plus-icon look.

**Final CTA:** a real closing moment, not a small centered "Ready to get started?" band. Full-bleed, oversized type, the orange glow at its most saturated point on the page, a background photo treatment, dual CTAs, the trust row repeated.

**Footer:** logo + one-line tagline, link columns (Platform: CRM/Landing Pages/Automations/AI Advisor/Insights — More: Code Vault/Content Engine/Projects/Feedback/Command Center — Company: About/Changelog/Blog/Terms/Privacy), copyright, "Built on Next.js · Supabase · Stripe · Vercel."

### 6. What NOT to do — read this before you generate anything

This list exists because the current landing page and most AI-builder output default to these patterns. Avoiding every item on this list is as important as anything above.

1. **No purple-to-blue or teal-to-blue gradient hero background.** This is the single most recognizable "built by AI" signature of the last two years. Black + orange-500 only.
2. **No centered single-column layout repeated identically section after section.** Vary the grid. Let things break alignment on purpose.
3. **No floating 3D blob/orb shapes as the only decorative element.** Pair real photography and texture instead, or skip decoration entirely.
4. **No emoji as section icons** (📈 ⚡ 🚀). Use a real SVG icon set, or drop icons in favor of typography and numerals.
5. **No uniform 3-icon feature grid with one-sentence captions.** That's the laziest, most recognizable AI-template tell — the bento layout above is the replacement.
6. **No fake testimonials.** No stock headshots, no invented quotes, no "Sarah K., Founder of [made-up company]," no 5-star widgets. Either skip the section or leave a clearly marked placeholder for me to fill with a real quote later — never fabricate one.
7. **No invented stats or numbers** not present in the product facts above (no "10,000+ founders trust us" type claims).
8. **No Inter or system-ui as the display headline font.** Safe system fonts are the fastest way to look like every other template — pick something with character.
9. **No "✨ AI-Powered" badge pinned above every headline.** Let the AI Advisor section prove it through a real example instead of announcing it with a pill badge.
10. **No pricing cards that are visually identical rectangles differentiated only by an orange border.** Make the recommended plan actually look chosen.
11. **No small centered "Ready to get started?" band as the only closing gesture** — make the final CTA feel like an event.
12. **No hover-only interactions for anything essential.** Design mobile-first; a phone user has to be able to convert.
13. **No identical fade-up-on-scroll animation applied to every single element on the page.** Vary duration, easing, and technique per section; give the hero one moment nothing else repeats.
14. **No empty alt text, no leftover Lorem Ipsum, no dead `#` anchor links.** Every interactive element either works or is clearly flagged as a TODO for me.
15. **No flat single-color section backgrounds as "the pop of color."** That's the exact boring-solid-color problem this rebuild exists to fix — color is accents, glows, and gradients-with-grain, never a flat panel fill.
16. **No glassmorphism smeared across every card.** One deliberate spot, if any.
17. **No default 8px-rounded-everything shadcn look with zero customization.** Push border radius, shadow, and surface treatment until it feels bespoke to this brand, not a component library default.

---

## Notes for you, Chris (not part of the paste)

- This locks in true black + `#f97316` per your global brand standard, not the walnut palette the current `app/page.tsx` uses — that's a deliberate reset, not an oversight.
- Real product screenshots will read far better than any placeholder the builder invents for the dashboard mockups. Worth grabbing 3–4 clean screenshots of the actual Command Center, CRM, and AI Advisor once you've got a direction you like, and swapping them in.
- When you're ready to bring the winning output into the real app, hand `LANDING-PAGE-PORT-RUNBOOK.md` to whatever agent does the port — it already has the exact traps (deploy-target confusion, middleware `publicPaths` gaps, hardcoded absolute URLs) documented from the last time this happened.
