# Founders Helm landing page — end of day, July 27 2026

## Where things stand

Rebuilt the landing page from scratch in your React/Vite builder, three rounds. Current state is genuinely good — full code reads of every round found no fake data, no dead links, real accessibility work, and it hits nearly everything in the original brief. Not the same species as the old walnut page.

**Gen 1** (`landing-page-builds/gen1-website-29.zip`) — first full build from `LANDING-PAGE-REBUILD-PROMPT.md`. True black + `#f97316`, Instrument Serif / Bricolage Grotesque / IBM Plex Mono, asymmetric bento layouts, hero word-unfurl + scroll-de-skew signature moment, marquee of struck-through tool names instead of a logo cloud, AI Advisor glass panel with a grounded example answer. Builds clean. Still plain JSX, Tailwind via CDN, one ~367KB JS chunk.

**Gen 2** (`landing-page-builds/gen2-founder-landing-v2.zip`) — ran the gen-2 chat-edit punch list (`LANDING-PAGE-GEN2-CHAT-EDITS.md`). Items 3 and 4 landed well and better than asked: switched every component from `motion.` to the lightweight `m.` primitive under `LazyMotion` (`strict` mode enforces it stays that way), and code-split the six below-fold sections behind one shared `Suspense` boundary — plus an error-boundary fallback for failed chunk loads and an idle-time prefetch, neither of which I asked for. Verified real numbers: main chunk 366.88KB → 293.61KB raw (114.23KB → 96.23KB gzipped). It also caught and fixed a real regression its own code-split introduced — `scrollToId` now polls briefly for a lazy-mounted section instead of silently no-op'ing. Items 1 (Tailwind CDN, Google Fonts) and 2 (TypeScript) were untouched this round — confirmed via diff, nothing else drifted.

**Gen 3 / v3** (`landing-page-builds/gen3-founders-landing-v3.zip`) — you asked it to do item 1 only. It did **not** fully complete it, and said so plainly: the builder can't install new npm packages (`tailwindcss`/`postcss`/`autoprefixer` never made it into `package.json`) or add binary `.woff2` files from inside its own environment, so Tailwind is still the CDN script and fonts are still Google-hosted. What it did instead, within that limit, is real and worth keeping: metric-adjusted fallback `@font-face` shims to kill the layout jump on font swap, the complete self-hosted `@font-face` block written and commented out ready to enable, `public/fonts/README.md` naming the exact five `.woff2` files it's waiting on, and `SETUP.md` updated with the exact migration commands. Verified clean build, confirmed via diff that only `index.html` + `src/index.css` + the new README changed — gen 2's work is fully intact, bundle numbers unchanged.

## Tomorrow morning — you + me, directly in this sandbox

The builder told us its own ceiling: no `npm install` for new packages, no binary file authoring. I have both here, so we finish what it couldn't:

**1. Real Tailwind migration + font self-hosting.** `SETUP.md` in v3 already has the exact recipe — `npm i -D tailwindcss postcss autoprefixer`, a ready-written `tailwind.config.js` and `postcss.config.js`, and the `@font-face` blocks are already sitting commented-out in `src/index.css` waiting to be uncommented. I still need to actually fetch the five font files (`instrument-serif-400.woff2`, `instrument-serif-400-italic.woff2`, `bricolage-grotesque-variable.woff2`, `ibm-plex-mono-400.woff2`, `ibm-plex-mono-600.woff2` — exact names from `public/fonts/README.md`) and confirm the sandbox can reach a font source; haven't checked that yet.

**2. TypeScript conversion.** Untouched since gen 1 — `.jsx` → `.tsx`, `src/lib/*.js` → `.ts`, `tsconfig.json` with `strict: true`, real interfaces for the content data (Pillar, Product, DeepDive, PricingPlan, Photo, FAQ, FooterColumn), zero `any`. This one's plain code editing, no external fetch needed, so no reason it can't just get done start to finish.

Starting point: `landing-page-builds/gen3-founders-landing-v3.zip` is the base — it's the most current gen with gen 2's perf work intact.

## Still open, not urgent

- Real product screenshots to replace the three hand-built mockups (`DashboardMock`, `CrmMock`, `BuilderMock`) and the AI Advisor chat panel — needs captures from your actual app, nobody else can do this step.
- Optional testimonial slot — deliberately not added anywhere yet, only worth building once you have a real quote.
- This is still a design source, not the deploy target. Once it's where you want it, the port into the real Next.js app follows `LANDING-PAGE-PORT-RUNBOOK.md` — that file already has the deploy-target-confusion and `publicPaths` traps documented from last time.
