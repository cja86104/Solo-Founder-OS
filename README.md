# Founders Helm

Your entire business. One dashboard. 10 integrated tools for founders.

Founders Helm is an all-in-one business management platform designed for founders, freelancers, and small teams. It consolidates the tools you need to run your business into a single, unified dashboard — replacing the need to juggle dozens of separate SaaS subscriptions.

---

## Features

### 10 Integrated Products

| Product | Description |
|---------|-------------|
| **Command Center** | SaaS metrics dashboard — MRR, churn rate, revenue overview, and customer metrics synced from Stripe |
| **CRM** | Contact database with deal pipeline, Kanban board, sales stages, and deal history |
| **Projects & Tasks** | Task management with time tracking, project assignment, and status tracking |
| **Content Engine** | AI-powered content creation with idea generation, media uploads, and publishing analytics |
| **Landing Pages** | Visual page builder with section templates (hero, features, pricing, CTA), SEO, custom CSS/JS, lead capture, and password protection |
| **Invoices** | Create, send, and track invoices with payment status and public invoice views |
| **Feedback Widget** | Embeddable feedback collection widgets with multiple styles and rating types |
| **Code Vault** | Store and organize code snippets and prompts with search, filtering, and tagging |
| **Automations** | Workflow automation with 12+ triggers and 10+ actions including email, webhooks, conditional branching, and delays |
| **AI Advisor** | Chat-based AI business advisor powered by LLM for context-aware insights |

### Additional Capabilities

- **Analytics** — Page views, sessions, visitor tracking, device/geo breakdown, goals, conversions, UTM parameters, and referrer analysis
- **Activity Feed** — Full audit log of all workspace changes and events
- **Multi-Workspace** — Create and manage multiple workspaces with team collaboration
- **Role-Based Access Control** — Owner, Admin, Editor, and Viewer roles with per-feature permissions
- **Billing & Subscriptions** — Free, Pro (monthly/yearly), and Lifetime plans via Stripe
- **Dark/Light Mode** — Full theme support with system preference detection
- **Data Export** — Export your data from any tool

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) with [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (strict mode) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) and [Radix UI](https://www.radix-ui.com/) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL with Row-Level Security) |
| **Authentication** | Supabase Auth (email/password, email verification, password reset) |
| **Payments** | [Stripe](https://stripe.com/) (subscriptions, webhooks, customer sync) |
| **Email** | [Resend](https://resend.com/) (transactional emails) |
| **AI** | [OpenRouter](https://openrouter.ai/) (LLM inference) + [Anthropic SDK](https://docs.anthropic.com/) |
| **State Management** | [TanStack React Query](https://tanstack.com/query) + [Zustand](https://zustand.docs.pmnd.rs/) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation |
| **Rich Text Editor** | [Tiptap](https://tiptap.dev/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (compatible with Next.js 16)
- **npm**, **yarn**, or **pnpm**
- A [Supabase](https://supabase.com/) account and project
- A [Stripe](https://stripe.com/) account (for payments)
- An [OpenRouter](https://openrouter.ai/) API key (for AI features)
- (Optional) A [Resend](https://resend.com/) API key (for emails)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/founders-helm.git
cd founders-helm
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp "env (1).example" .env.local
```

Required variables:

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_APP_URL` | Your app's public URL (no trailing slash) | Your deployment URL or `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) | Supabase Dashboard > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | Supabase Dashboard > Project Settings > API |
| `STRIPE_SECRET_KEY` | Stripe secret API key | Stripe Dashboard > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Stripe Dashboard > Developers > Webhooks |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Price ID for Pro monthly plan | Stripe Dashboard > Products > Pricing |
| `STRIPE_PRO_YEARLY_PRICE_ID` | Price ID for Pro yearly plan | Stripe Dashboard > Products > Pricing |
| `STRIPE_LIFETIME_PRICE_ID` | Price ID for Lifetime plan | Stripe Dashboard > Products > Pricing |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `RESEND_API_KEY` | Resend API key for emails (optional) | [resend.com/api-keys](https://resend.com/api-keys) |

> **Warning:** Never commit `.env.local` to version control. The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row-Level Security and must be kept secret.

### 4. Set Up the Database

Push the Supabase migrations to your project:

```bash
npm run db:push
```

To generate TypeScript types from your database schema:

```bash
npm run db:generate
```

### 5. Set Up Stripe (Local Development)

Forward Stripe webhook events to your local server using the Stripe CLI:

```bash
npm run stripe:listen
```

This runs `stripe listen --forward-to localhost:3000/api/stripe/webhook`. You'll need the [Stripe CLI](https://stripe.com/docs/stripe-cli) installed.

### 6. Run the Development Server

```bash
npm run dev
```

The app will start at [http://localhost:3000](http://localhost:3000) using Turbopack for fast refresh.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate TypeScript types from Supabase schema |
| `npm run db:push` | Push database migrations to Supabase |
| `npm run db:reset` | Reset the local database |
| `npm run stripe:listen` | Forward Stripe webhooks to localhost |

---

## Project Structure

```
founders-helm/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, signup, verify, reset)
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── page.tsx              # Dashboard home
│   │   ├── activity/             # Activity log
│   │   ├── advisor/              # AI Advisor
│   │   ├── analytics/            # Analytics
│   │   ├── automations/          # Workflow automations
│   │   ├── command/              # Command Center (SaaS metrics)
│   │   ├── contacts/             # Contact management
│   │   ├── content/              # Content Engine
│   │   ├── crm/                  # CRM & deal pipeline
│   │   ├── feedback/             # Feedback widgets
│   │   ├── invoices/             # Invoice management
│   │   ├── landing/              # Landing page builder
│   │   ├── projects/             # Project & task management
│   │   ├── settings/             # User & workspace settings
│   │   ├── vault/                # Code vault
│   │   └── workspaces/           # Workspace management
│   ├── api/                      # API routes (~50 endpoints)
│   └── invoice/                  # Public invoice view
├── components/                   # React components
│   ├── ui/                       # shadcn/ui base components
│   ├── layout/                   # App shell, sidebar, header
│   ├── providers/                # Context providers
│   └── [feature]/                # Feature-specific components
├── lib/                          # Utilities and helpers
│   ├── supabase/                 # Supabase clients (browser, server, admin)
│   ├── stripe/                   # Stripe config and sync
│   ├── automations/              # Automation engine (executor, variables)
│   ├── hooks/                    # Custom React hooks
│   ├── validations/              # Zod schemas
│   ├── permissions.ts            # RBAC permission system
│   └── workspace-context.tsx     # Workspace state management
├── types/                        # TypeScript type definitions
│   ├── database.ts               # Auto-generated Supabase types
│   └── [feature].ts              # Feature-specific types
├── supabase/                     # Supabase configuration
│   ├── migrations/               # SQL migration files
│   └── config.toml               # Local Supabase config
├── public/                       # Static assets
├── middleware.ts                  # Next.js auth middleware
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── vercel.json                   # Vercel deployment & cron jobs
└── env (1).example               # Environment variable template
```

---

## Architecture

### Authentication Flow

All dashboard routes are protected by Next.js middleware that validates Supabase sessions on every request. Auth pages (login, signup, password reset, email verification) are public. Public endpoints like the Stripe webhook, analytics collector, and public invoice views bypass authentication.

### Multi-Workspace & Permissions

The app supports multiple workspaces per user. Each workspace has its own data, team members, and role-based access control:

- **Owner** — Full access, can delete workspace and manage billing
- **Admin** — Full access to all features, can manage members
- **Editor** — Can create and edit content across all tools
- **Viewer** — Read-only access

Permissions are enforced at both the API layer and UI layer via a centralized permission system.

### Automation Engine

The automation system supports event-driven workflows:

- **Triggers**: new contact, contact updated, deal created, deal stage changed, form submitted, feedback received, task completed, scheduled (cron), webhook, manual
- **Actions**: send email, create task, update contact, add/remove tag, move deal, create/update deal, fire webhook, delay, conditional branch
- **Execution**: Scheduled automations run via Vercel Cron Jobs (every minute). Event-based triggers fire in real-time from API routes.

### Data Layer

All data flows through Next.js API routes to Supabase (PostgreSQL). Row-Level Security policies enforce multi-tenancy at the database level. The Supabase service role key is used server-side only for admin operations.

---

## Deployment

The project is configured for deployment on [Vercel](https://vercel.com/):

1. Connect your GitHub repository to Vercel
2. Add all environment variables in the Vercel project settings
3. Deploy — Vercel will automatically build and deploy on push

The `vercel.json` file includes cron job configuration for scheduled automations.

### Post-Deployment

- Configure your Stripe webhook endpoint to point to `https://your-domain.com/api/stripe/webhook`
- Update `NEXT_PUBLIC_APP_URL` to your production domain
- Ensure Supabase RLS policies are properly configured

---

## License

This project is private. All rights reserved.
