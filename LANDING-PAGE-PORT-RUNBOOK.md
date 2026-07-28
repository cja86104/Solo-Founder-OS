Runbook — Porting a React/Vite landing page into an existing Next.js App Router app

Give this file to any new chat before it touches a landing page port. Written by Chris Allen (Allen Code Co) after a port that cost ~3 hours, most of it spent editing files that were never deployed. Every rule below traces to a specific failure, and each one is labelled with the symptom that revealed it.

0. How to use this

Paste the kickoff prompt at the bottom (§10) into a new chat, attach this file, and point at the repo. The agent works the phases in order and stops between sections.

The context this assumes:

An existing production Next.js App Router SaaS app (Next 15, React 19, TypeScript strict, Tailwind, shadcn/ui, Supabase, Vercel).
A new landing page delivered as a standalone React + Vite project — usually dropped into a subfolder of the same repo.
Goal: the new design ships as the real landing page. The Vite project is a design source, not a deployable.
1. Non-negotiable standards

These are hard rules. No exceptions, no "just this once."

No @ts-ignore, as any, : any, eslint-disable, or ignoreBuildErrors. Fix root cause.
No mock data, placeholders, or unfinished code.
Complete files, never snippets or diffs, unless a diff is explicitly requested.
Work in named sections. Stop after each. Wait for continue. Do not barrel through.
Read the file back after every write. Verify before claiming done.
Smallest safe change. Do not refactor what wasn't asked about.
Ask before guessing. Never invent commands, files, or behaviour.
If you cannot verify a claim, say so plainly.

File editing: in some of these repos the Edit/Write tools truncate files on disk. Use bash + python3 for every file modification, then verify with tail -5 <file> && wc -l <file>.

2. STOP — do this before writing a single line

The 3-hour mistake: an agent spent two hours editing components inside mtt-landing-template/, reporting success each time. That folder was a standalone Vite project with its own package.json and vite.config.js, referenced by nothing. Vercel was building the Next.js app at repo root the entire time. The user had to say "it is still the old site" twice before anyone checked.

Establish what actually ships, and say it out loud, before any edit.

bash
# What does the deploy platform build? Root package.json only.
cat package.json | head -30

# Find every nested project — each is a deployment decoy until proven otherwise.
find . -name "package.json" -not -path "*/node_modules/*"
find . -name "vite.config.*" -o -name "next.config.*" | grep -v node_modules

# Does ANYTHING in the app import the template folder?
grep -rn "<template-folder-name>" app components lib next.config.* tsconfig.json 2>/dev/null

Rules that follow:

A nested folder with its own package.json or vite.config.js is not deployed. Vercel builds the root project. Full stop.
If the grep for imports returns nothing, the template is inert. Changes to it have zero production effect.
The real landing page is whatever the root route renders. Find it and name it: app/page.tsx → what does it return?

Required output before proceeding — state these three things explicitly:

The file Vercel actually serves at / (e.g. app/page.tsx → app/landing-page.tsx).
The template folder, and confirmation it is a design reference only.
The exact list of files that will change.

If you cannot state all three, stop and ask.

3. Phase 0 — Recon
bash
# Framework versions — React 19 + Next 15 rules out some libraries
node -p "JSON.stringify(require('./package.json').dependencies,null,2)"

# Which package manager is REAL? The lockfile wins, not the docs.
ls package-lock.json pnpm-lock.yaml yarn.lock 2>/dev/null

# What the template needs that the app may not have
grep -rhoE "from '[a-z@][^']*'" <template>/src --include=*.jsx --include=*.tsx \
  | sort -u

# Existing route surface, middleware, global CSS
ls app; cat middleware.ts; wc -l app/globals.css

Trap — package manager mismatch. MTT's docs said pnpm throughout; the repo had only package-lock.json. Mixed managers produce "works for you, not for me" bugs and duplicate lockfiles. Trust the lockfile, tell the user about the mismatch, don't silently switch.

Trap — CRLF churn. If git status shows hundreds of modified files but git diff --numstat reports equal add/delete counts per file (58 58), that's whole-file line-ending churn, not real change. It makes your diffs unreviewable. Use git diff --ignore-cr-at-eol to see your actual work, and flag it — the fix (.gitattributes with * text=auto eol=lf plus renormalize) is a separate commit.

4. Phase 1 — Plan the sections

Propose a section list and get approval before building. A port of ~13 components:

Section 1 — dependencies + globals.css additions + Tailwind config
Section 2 — primitives (Logo, Reveal/animation wrapper, Ticker, mockups)
Section 3 — upper page sections
Section 4 — lower page sections + modals
Section 5 — assemble the page component
Section 6 — routes, middleware, metadata, assets
Section 7 — full verification + deploy checklist

Stop after each. Report files changed and what was verified.

5. Phase 2 — Vite → Next conversion rules

Apply mechanically to every ported component:

Vite / CRA	Next.js App Router
no directive	'use client' on anything with hooks, state, events, or animation
react-router-dom <Link to>	next/link <Link href>
useNavigate()	useRouter() from next/navigation
<img src>	next/image (or keep <img> and say why)
import.meta.env.VITE_X	process.env.NEXT_PUBLIC_X
index.html <head> tags	export const metadata
.jsx	.tsx with real types
assets in public/	root public/ of the Next app

Additional rules:

.jsx → .tsx means writing real types. The MTT port hit 9 type errors in one mockups file. Define the prop interfaces (ChromeProps, keyed unions like GradeKey) — do not reach for any.
Every URL internal to the app must be relative. See §8, trap 2.
Fonts: prefer next/font. A raw @import url(...) inside globals.css works but is render-blocking and unhosted.
Check the animation library is actually installed in the Next app before porting components that depend on it. MTT's app had no framer-motion — it existed only in the Vite template's package.json.
6. Phase 3 — Routes, middleware, public paths

This is where the worst production bug came from. Read it carefully.

When the new landing page introduces routes or API endpoints, they must be added to the auth middleware's public allowlist.

Trap — a redirect on POST returns 405. MTT's demo endpoint /api/demo/generate wasn't in publicPaths. An anonymous POST got NextResponse.redirect('/login'). A 307 preserves the HTTP method, so the browser re-POSTed to the /login page route, which has no POST handler → 405. The client did res.json().catch(() => ({})) on an HTML error body and displayed a generic "something went wrong". Symptom looked like a broken AI call. It was routing.

The same omission sent the footer's /schools and /help links to the login page.

Checklist:

bash
cat middleware.ts && cat lib/supabase/middleware.ts   # or wherever the gate lives
 Every new public page added to publicPaths
 Every new public API route added to publicPaths
 Confirm the matcher doesn't exclude something you need — or include something you don't
 Note that publicPaths.some(p => pathname.startsWith(p)) is prefix matching: /help also matches /helpdesk. Deliberate or not, know which.

Free verification, no AI spend — POST an empty body to a new public API route:

powershell
curl.exe -i -X POST http://localhost:3000/api/<route> -H "Content-Type: application/json" -d '{}'
400 → reached the handler, validation rejected it. Correct.
307 → still gated. Check publicPaths.
405 → redirect landed on a page route. The exact bug above.
7. Phase 4 — Public AI endpoints must be rate limited

If the landing page calls AI without a session (demo, generator, "try it free"), that endpoint bills your provider for anonymous traffic.

Trap — the existing limiter probably can't help you. MTT's check_rate_limit() RPC returns false when auth.uid() is NULL, and its log table's user_id is NOT NULL REFERENCES auth.users(id). It structurally cannot represent an anonymous caller. The middleware also only invokes it inside if (user && ...). A public endpoint therefore has no ceiling at all unless you build one.

Required design:

Two ceilings. Per-IP sliding window and a global daily cap. Per-IP alone does nothing against rotating IPs or a distributed script; the global cap is what bounds the bill.
Never store raw IPs. HMAC-SHA256 with a dedicated salt env var. A plain hash of an IPv4 is reversible by enumeration — the keyed construction is what makes it non-identifying.
Fail closed. If the check errors, deny. An unavailable spend guard that allows is not a guard. Return 503 (check failed) vs 429 (limit hit) so logs stay honest.
Enforce after validation, before the AI call — malformed input shouldn't spend budget, and a denial should never reach the provider.
Deploy order: migration first, then code. Fail-closed means the reverse order takes the feature down.
Set the salt in Vercel before deploying. Missing salt = 503 for everyone.
8. The trap catalogue

Symptom → cause → fix. These all actually happened.

1. "I deployed and it's still the old site." Editing a nested Vite/CRA project that nothing builds. → §2. Verify the deploy target first.

2. Internal links hardcoded to the production domain. href="https://myapp.com/help", const API = 'https://myapp.com/api/x'. Works in prod, silently hits production from localhost and every preview deploy. A local test of an API change appears to do nothing because you're calling the live server. → Use relative paths for anything same-origin. Only a genuinely separate origin (the standalone template) gets an absolute URL — and that's the only reason to keep CORS headers on the route.

3. Build fails on Vercel but typecheck passed locally. tsc --noEmit does not catch everything Next's build does. MTT shipped a stale import (generateWithClaude → generateWithAI) that only surfaced in the Vercel build log. → Run the real next build before pushing. If your sandbox can't (see trap 8), say so explicitly and have the user run it.

4. package-lock.json merge conflict, hundreds of markers. Never hand-resolve a lockfile.

git merge --abort
git merge <branch> -X ours
npm install          # regenerates a clean, correct lock

5. /favicon.ico 404. No public/ directory and no icon file. → Add app/favicon.ico (App Router file convention — auto-served and auto-linked, no layout change). Don't also add app/icon.*; duplicates are a build error.

6. Scroll-reveal content invisible. Components using framer-motion whileInView SSR at opacity: 0 and depend on IntersectionObserver firing. Two distinct situations:

Blank in a full-page screenshot only — false alarm. DevTools "capture full size" outruns the async IO callbacks. Confirm by scrolling normally before changing code.
Blank while scrolling — real. Discriminator: does any other framer component using plain animate= work on the same page? If yes, framer is fine and the fault is isolated to the IO path (suspect React Strict Mode double-mount + viewport={{ once: true }}, which is dev-only — production builds are unaffected). Design implication: content that is invisible without JS is an SEO and accessibility liability on a marketing page. Consider a reveal that degrades to visible.

7. Demo/modal shows a generic error with no detail. await res.json().catch(() => ({})) swallows non-JSON error bodies, so a 405/500 HTML response becomes {} and falls through to a default message. → Always check the Network tab for the real status before debugging the feature itself.

8. Never background a next build in an ephemeral sandbox. Processes are killed when the call ends, leaving a half-written .next/ in the user's repo (no BUILD_ID, no required-server-files.json). Also: don't burn turns trying to boot next dev inside a short command timeout — a cold Next compile won't finish. Hand build and dev verification to the user.

9. Don't guess twice. When a diagnosis is wrong, stop theorising and design the decisive experiment. A reversible git stash push <the two files you touched> settles "did you break it" in 30 seconds and is worth more than three more hypotheses.

9. Verification ladder

Narrowest useful check first, expand only as needed. Fix failures before moving up.

Read the modified file back — tail -5 <file> && wc -l <file>
npx tsc --noEmit
npm run lint (or npx next lint --file <changed files>)
npm test if tests exist for the area
npm run build — mandatory before any push. Catches what tsc doesn't.
npm run dev + real browser pass
Deploy, then verify in production

Banned-pattern sweep before reporting done:

bash
grep -nE "@ts-ignore|@ts-expect-error|eslint-disable|: any\b|as any|TODO|FIXME|placeholder" <changed files>

Browser pass:

 Every nav and footer link, logged out (auth gating hides broken links from you)
 Network tab: internal calls go to the current origin, not the production domain
 Console clean — no 404s, no red
 Favicon in the tab
 Mobile viewport
 Any public AI endpoint: trip the rate limit and confirm 429 + Retry-After

Client-facing report format — no blank fields:

Files changed:
Commands run:
Results:
Known limitations:
Ready for client: yes/no

Never yes unless verified in this session with real output.