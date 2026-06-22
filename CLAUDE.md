# Founders Helm — Claude Code Instructions

## Blueprint Guardian (MANDATORY)

At the start of every session, invoke the blueprint-guardian agent before writing any code:
```md
/agent blueprint-guardian
```

After completing any phase or batch, invoke it again to verify completion and get the next step.

The blueprint guardian will:
- Read the project reference (`README.md`)
- Confirm current position in the build sequence
- Flag any deviations from the specification
- Deliver the next steps and active rules

Do not write code, create files, or make architectural decisions until the guardian has run.

## Project reference

All project decisions, architecture, and specifications are defined in:

```md
README.md
```

This is the single source of truth. If anything in conversation conflicts with it, the README wins.

## Tech stack summary

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

## Critical rules

- TypeScript strict mode: zero `any`, zero `eslint-disable`.
- Auth before DB: every API route authenticates first, no exceptions.
- Zod on every mutation: validate all POST/PATCH bodies before DB writes.
- Service role scope: `SUPABASE_SERVICE_ROLE_KEY` server-side only, never in client components.
- Never commit `.env.local`.
- Multi-workspace: all data must be workspace-scoped, RLS enforced at DB level.
- RBAC enforced at both API and UI layers.

## Verification and testing

- Treat every change as production-bound.
- Do not claim completion without fresh verification evidence.
- Read modified files back before saying a change is done.
- Run the narrowest relevant validation first.
- Then run `pnpm typecheck` for TypeScript changes.
- Run `pnpm lint` for code-style and structural changes.
- Run `pnpm build` for changes affecting app compilation or deployability.
- Run `pnpm test` when tests exist for the changed area.
- Run `pnpm test:e2e` for user-flow, auth, payment, or browser-visible changes.
- If a step fails, fix it and rerun before moving on.

## Client-facing answers

A response is client-facing if it is intended to be sent to a client, stakeholder, or end user as a status update, handoff, estimate, or completion note.

Before any client-facing answer, include a short verification summary with:

- Files changed:
- Commands run:
- Results:
- Known limitations:
- Ready for client: yes/no

Rules:
- Do not leave any field blank.
- If nothing changed, say `none`.
- If no commands were run, say `none` and explain why.
- If anything is unverified, list it under `Known limitations`.
- Never mark `Ready for client: yes` unless the result was actually verified in this session.

## Session workflow

- Work in sections.
- Stop after each section and report what changed.
- Wait for explicit `continue` before moving on.
- Do not make architectural decisions without checking the README first.
- If a requirement is unclear, ask before guessing.