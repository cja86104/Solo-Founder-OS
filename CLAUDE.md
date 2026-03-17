# Founders Helm — Claude Code Instructions

## Blueprint Guardian (MANDATORY)

**At the start of every session, invoke the blueprint-guardian agent before writing any code:**
```
/agent blueprint-guardian
```

**After completing any phase or batch, invoke it again to verify completion and get the next step.**

The blueprint guardian will:
- Read the project reference (`README.md`)
- Confirm current position in the build sequence
- Flag any deviations from the specification
- Deliver the next steps and active rules

Do not write code, create files, or make architectural decisions until the guardian has run.

## Project Reference

All project decisions, architecture, and specifications are defined in:
```
README.md
```

This is the single source of truth. If anything in conversation conflicts with it, the README wins.

## Tech Stack (Summary)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19, TypeScript strict |
| Styling | Tailwind CSS 3, shadcn/ui, Radix UI |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Payments | Stripe (subscriptions + webhooks) |
| Email | Resend |
| AI | OpenRouter + Anthropic SDK |
| State | TanStack Query + Zustand |
| Deployment | Vercel |

## Critical Rules

- **TypeScript strict mode** — zero `any`, zero `eslint-disable`
- **Auth before DB** — every API route authenticates first, no exceptions
- **Zod on every mutation** — validate all POST/PATCH bodies before DB writes
- **Service role scope** — `SUPABASE_SERVICE_ROLE_KEY` server-side only, never in client components
- **Never commit `.env.local`** — service role key bypasses RLS
- **Multi-workspace** — all data must be workspace-scoped, RLS enforced at DB level
- **RBAC enforced at both API and UI layers**
