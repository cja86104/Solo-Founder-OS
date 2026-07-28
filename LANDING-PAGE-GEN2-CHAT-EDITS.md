# Founders Helm — Gen 2 Chat-Edit Punch List

This is a follow-up to `LANDING-PAGE-REBUILD-PROMPT.md`, written after reading every file in the gen-1 build (`website (29).zip`) and confirming it installs and builds clean with `npm install` + `vite build` (2,070 modules, no errors).

Gen 1 is genuinely strong — full read of every section found no conceptual problems, no fake data, no dead links, no accessibility gaps. What's below is the next round: real production blockers first, then performance, then optional polish. Paste into the builder's chat one block at a time, in this order — don't ask for all of it in one message, the earlier items change files the later ones touch.

---

## 1. Fix the two render-blocking dependencies (do this first, it's flagged in the build's own SETUP.md)

`index.html` currently loads Tailwind from `cdn.tailwindcss.com` and fonts from a Google Fonts `<link>`. Both are fine for prototyping and both are things this project's own documentation says to fix before launch.

Paste:

> Replace the Tailwind CDN script in `index.html` with a real Tailwind build: add `tailwindcss`, `postcss`, and `autoprefixer` as dev dependencies, create `tailwind.config.js` with the `display`/`sans`/`mono` font family block currently inline in the CDN config, create `postcss.config.js`, and add the `@tailwind base/components/utilities` directives to the top of `src/index.css`. Remove the `<script src="https://cdn.tailwindcss.com">` tag entirely.
>
> Then self-host the three Google Fonts (Instrument Serif, Bricolage Grotesque, IBM Plex Mono) as static files with `@font-face` declarations and `font-display: swap`, instead of the `fonts.googleapis.com` link tag. If self-hosting isn't practical in this environment, at minimum keep the `preconnect` tags and add `font-display: swap` is already implied by the `&display=swap` param — just confirm the preconnects stay.
>
> Rebuild and confirm `npm run build` still succeeds with no errors before reporting done.

## 2. Convert to TypeScript

SETUP.md already says the data in `content.js` is shaped cleanly for this and there's no loose typing to unpick — have it actually done instead of left as a note.

Paste:

> Convert this project to TypeScript: rename every `.jsx` to `.tsx` and `src/lib/*.js` to `.ts`, add `typescript`, `@types/react`, and `@types/react-dom` as dev dependencies, add a `tsconfig.json` with `"strict": true`, and add real interfaces for the shapes in `src/lib/content.ts` (Pillar, Product, DeepDive, PricingPlan, Photo, FAQ, FooterColumn). No `any` anywhere. Run `npx tsc --noEmit` and fix every error before reporting done — don't leave any suppressed with `@ts-ignore` or `@ts-expect-error`.

## 3. Cut the JS bundle with framer-motion's lazy API

Current production build is one ~367KB JS chunk (114KB gzipped) — not alarming for a marketing page, but framer-motion is almost certainly the biggest line item in that, and it ships a lighter-weight API for exactly this case.

Paste:

> Check the current production bundle size with `npm run build`. Then convert the framer-motion usage from the full `motion.div` / `motion.span` components to the `LazyMotion` + `m` pattern (`<LazyMotion features={domAnimation}>` wrapping the app, `m.div` instead of `motion.div` everywhere) to cut the framer-motion payload. Rebuild and report the before/after bundle size from the `vite build` output — don't claim a size reduction without showing the actual numbers from both builds.

## 4. Lazy-load below-the-fold sections

Paste:

> Convert `DeepDives`, `AdvisorSpotlight`, `ProductIndex`, `Pricing`, `Faq`, and `ClosingCta` in `src/pages/Landing.jsx` to `React.lazy()` imports wrapped in a single `Suspense` with a minimal fallback (a blank div matching the background color is fine — no spinner needed, these are below the fold). Keep `Hero`, `StackMarquee`, and `Pillars` as regular imports since they're above or near the fold. Confirm the page still scrolls and all anchor links (`#pricing`, `#faq`, `#advisor`, `#product`) still work after the split, since `Suspense` can affect scroll-to-id timing on first load.

---

## 5. Not a chat-edit — this one's on you, Chris

The single highest-leverage visual upgrade left is swapping the three hand-built mockups (`DashboardMock.jsx`, `CrmMock.jsx`, `BuilderMock.jsx`) and the AI Advisor chat panel for real captures of your actual Command Center, CRM, and Landing Pages builder. They're well-built illustrative UI — genuinely good ones, not lazy placeholders — but a real screenshot will out-perform any mockup a builder generates, and it's the one item on this list no chat-edit prompt can do for you. Grab 3–4 clean captures once you're happy with gen 2's layout, drop them into `Photo`/`BrowserFrame` per the swap notes already in SETUP.md, and delete the "Illustrative interface — TODO" line in `AdvisorSpotlight.jsx`.

## 6. Optional, only if you want it: a real social-proof slot

Gen 1 correctly has zero testimonials rather than inventing fake ones — that's the right call per your own no-fake-data rule. If you want a place to drop a real quote later, this is a self-contained addition, not a fix:

> Add a small, optional testimonial section between `AdvisorSpotlight` and `ProductIndex` — single quote, attribution, and company, styled consistently with the rest of the page (font-display for the quote, font-mono kicker for the attribution). Leave the copy as an obvious placeholder string like `"[Real customer quote goes here]"` with a comment flagging it as not-for-launch, don't invent a plausible-sounding fake one.
