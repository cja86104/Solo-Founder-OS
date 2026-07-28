/**
 * All page copy + data lives here so no strings are hardcoded into JSX.
 * Facts are limited strictly to the supplied product brief.
 *
 * PORTED VERBATIM from the design source:
 *   Desktop/FOUNDERS-HELM-REDESIGN/src/lib/content.js
 * Every string below is design-locked copy. Types were added around the data;
 * not one character of the data itself was retyped or reworded.
 */

export interface Brand {
  name: string;
  tagline: string;
  subhead: string;
  trustRow: string[];
  builtOn: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface PillarFlowStep {
  label: string;
  detail: string;
}

export interface Pillar {
  index: string;
  title: string;
  accent: string;
  body: string;
  proof: string;
  flow?: PillarFlowStep[];
}

/** Names of the lucide icons the product index renders, one per product. */
export type ProductIconName =
  | 'Gauge'
  | 'Users'
  | 'ListChecks'
  | 'PenLine'
  | 'LayoutTemplate'
  | 'ReceiptText'
  | 'MessageSquareDot'
  | 'Braces'
  | 'Workflow'
  | 'Sparkle';

export interface Product {
  id: string;
  name: string;
  icon: ProductIconName;
  blurb: string;
}

export interface DeepDive {
  id: string;
  kicker: string;
  title: string;
  titleAccent: string;
  body: string;
  bullets: string[];
  reveal: 'scrub' | 'slide' | 'mask';
}

export interface AdvisorChat {
  question: string;
  workspace: string;
  context: string[];
  answer: string[];
  actions: string[];
  footnote: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  cadence: string;
  recommended: boolean;
  pitch: string;
  features: string[];
  cta: string;
}

export interface Pricing {
  plans: PricingPlan[];
  note: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface FooterColumn {
  title: string;
  links: string[];
}

export interface Footer {
  columns: FooterColumn[];
}

export interface PhotoAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export type PhotoKey =
  | 'heroDesk'
  | 'windowNight'
  | 'handsTyping'
  | 'quietOffice'
  | 'closing';

export const brand: Brand = {
  name: 'Founders Helm',
  tagline: 'Your entire business. One dashboard.',
  subhead:
    'Founders Helm replaces your scattered stack of SaaS tools with one integrated platform — built for how solo founders actually work, at a price that makes sense.',
  trustRow: ['14-day free trial', 'no credit card', 'cancel anytime'],
  builtOn: 'Built on Next.js · Supabase · Stripe · Vercel.'
};

export const navLinks: NavLink[] = [
  { label: 'Product', href: '#product' },
  { label: 'The AI', href: '#advisor' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' }
];

/** Tools Founders Helm replaces — used by the marquee. */
export const replacedTools: string[] = [
  'Notion',
  'Airtable',
  'HubSpot',
  'Mailchimp',
  'Trello',
  'Your invoicing tool',
  'Your analytics tool',
  'Your snippet manager',
  'Your form widget',
  'Your automation glue'
];

export const pillars: Pillar[] = [
  {
    index: '01',
    title: 'Everything connects',
    accent: 'connects',
    body:
      'A deal closes in the CRM and the invoice, the revenue chart and next quarter’s forecast already know. No exports, no Zapier tax, no copying numbers between tabs.',
    proof: 'One database. No integrations to maintain.',
    /** Rendered as the flow rail inside the 01 panel — the claim, shown working. */
    flow: [
      { label: 'Deal marked won', detail: 'CRM · pipeline stage moves to closed' },
      { label: 'Invoice raised and sent', detail: 'Invoices · line items pulled from the deal' },
      { label: 'MRR and forecast redraw', detail: 'Command Center · no export, no refresh' },
      { label: 'Advisor already knows', detail: 'AI Advisor · reflected in the next answer' }
    ]
  },
  {
    index: '02',
    title: 'AI with full context',
    accent: 'context',
    body:
      'The AI Advisor reads your actual pipeline, revenue and task data. It answers with specifics about your business, not generic chatbot advice.',
    proof: 'Reads pipeline · revenue · tasks · content'
  },
  {
    index: '03',
    title: 'Built acquisition-ready',
    accent: 'acquisition-ready',
    body:
      'Row-level security, clean data export, a documented stack. Built to a standard that acquirers and enterprise buyers actually care about.',
    proof: 'RLS at the database layer · CSV + JSON export'
  }
];

/** All ten products — surfaced as a bento/index grid. */
export const products: Product[] = [
  {
    id: 'command-center',
    name: 'Command Center',
    icon: 'Gauge',
    blurb: 'SaaS metrics dashboard: MRR, churn, revenue overview, customer metrics synced from Stripe.'
  },
  {
    id: 'crm',
    name: 'CRM',
    icon: 'Users',
    blurb: 'Contact database with deal pipeline, Kanban board, sales stages and deal history.'
  },
  {
    id: 'projects',
    name: 'Projects & Tasks',
    icon: 'ListChecks',
    blurb: 'Task management with time tracking, project assignment and status tracking.'
  },
  {
    id: 'content-engine',
    name: 'Content Engine',
    icon: 'PenLine',
    blurb: 'AI-powered content creation: idea generation, media uploads, publishing analytics.'
  },
  {
    id: 'landing-pages',
    name: 'Landing Pages',
    icon: 'LayoutTemplate',
    blurb: 'Visual page builder: section templates, SEO, custom CSS/JS, lead capture, password protection.'
  },
  {
    id: 'invoices',
    name: 'Invoices',
    icon: 'ReceiptText',
    blurb: 'Create, send and track invoices with payment status and public invoice views.'
  },
  {
    id: 'feedback',
    name: 'Feedback Widget',
    icon: 'MessageSquareDot',
    blurb: 'Embeddable feedback widgets, multiple styles and rating types.'
  },
  {
    id: 'code-vault',
    name: 'Code Vault',
    icon: 'Braces',
    blurb: 'Store and organize code snippets and prompts with search, filter and tagging.'
  },
  {
    id: 'automations',
    name: 'Automations',
    icon: 'Workflow',
    blurb: 'Workflow automation: 12+ triggers, 10+ actions — email, webhooks, conditional branching, delays.'
  },
  {
    id: 'ai-advisor',
    name: 'AI Advisor',
    icon: 'Sparkle',
    blurb: 'Chat-based AI business advisor with real context from your own data.'
  }
];

export const platformExtras: string[] = [
  'Analytics: page views, sessions, geo/device, conversions, UTM tracking',
  'Full activity and audit log',
  'Multi-workspace with team collaboration',
  'Role-based access control — Owner / Admin / Editor / Viewer',
  'Dark and light mode',
  'Full data export'
];

/**
 * Deep-dive sections. Layout is NOT driven from here — each dive gets its own
 * bespoke grid from the `layouts` array in DeepDives.jsx, on purpose, so the
 * section can't collapse back into an alternating strip.
 */
export const deepDives: DeepDive[] = [
  {
    id: 'command-center',
    kicker: '01 — Command Center',
    title: 'Every number that matters,',
    titleAccent: 'before your first coffee.',
    body:
      'MRR, churn, revenue overview and customer metrics, synced straight from Stripe. No spreadsheet export, no Monday-morning reconciliation ritual. Open one tab and know where the business stands.',
    bullets: ['MRR and churn, synced from Stripe', 'Revenue overview at a glance', 'Customer metrics in the same view'],
    reveal: 'scrub'
  },
  {
    id: 'crm',
    kicker: '02 — CRM',
    title: 'A pipeline you can',
    titleAccent: 'actually drag.',
    body:
      'Contacts, deals and history in one database. Kanban board, sales stages, full deal history — so the follow-up you forgot is visible instead of buried in a thread from three weeks ago.',
    bullets: ['Kanban deal board with sales stages', 'Contact database with deal history', 'Gmail sync for contact history'],
    reveal: 'slide'
  },
  {
    id: 'landing-pages',
    kicker: '03 — Landing Pages',
    title: 'Ship the page',
    titleAccent: 'without shipping a repo.',
    body:
      'Visual builder with section templates, SEO fields, custom CSS and JS when you need to go off-script, lead capture wired into the CRM, and password protection for the ones that aren’t public yet. Custom domain, automatic SSL.',
    bullets: ['Section templates + custom CSS/JS', 'Lead capture straight into your CRM', 'Custom domains with automatic SSL'],
    reveal: 'mask'
  }
];

/** AI Advisor spotlight — a grounded, data-specific exchange. */
export const advisorChat: AdvisorChat = {
  question: 'Why is my MRR flat this month?',
  workspace: 'workspace: helm-solo',
  context: ['Stripe revenue', 'Deal pipeline', 'Task history', 'Content performance'],
  answer: [
    'Flat, not stalled — you added $412 in new MRR and lost $398 to churn, so it nets out to +$14.',
    'Two things are actually happening. Three of the five accounts that churned were on the plan you upgraded in March, and none of them had a task or contact logged against them in the 40 days before they left.',
    'And your biggest deal hasn’t had contact in 12 days. It’s been sitting in Proposal since the 4th, which is longer than any deal you’ve closed this year sat in that stage.'
  ],
  actions: ['Draft the follow-up', 'Open the deal', 'Show me the churned five'],
  footnote: 'Read-only access to your Helm data. Nothing leaves the workspace.'
};

export const pricing: Pricing = {
  plans: [
    {
      id: 'pro',
      name: 'Pro',
      price: '$29',
      cadence: '/month',
      recommended: true,
      pitch: 'The whole platform, billed monthly. Cancel the other nine subscriptions.',
      features: [
        'All 10 products',
        'Unlimited landing pages + custom domain',
        '10,000 CRM contacts',
        '100,000 page views/month',
        'Unlimited automations',
        'Up to 5 team members',
        'Priority support'
      ],
      cta: 'Start free trial'
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: '$299',
      cadence: 'one-time',
      recommended: false,
      pitch: 'Pay once. Never see this pricing page again.',
      features: [
        'Everything in Pro',
        'Unlimited everything',
        'All future features',
        'White-label landing pages',
        'Price-lock guarantee',
        'Forever'
      ],
      cta: 'Buy once, done'
    }
  ],
  note: '14-day free trial, no credit card required, cancel anytime.'
};

export const faqs: Faq[] = [
  {
    q: 'Can I import data from my current tools?',
    a: 'Yes. CSV import for contacts, deals and vault items, Gmail sync for contact history, and a REST API for programmatic migration. Most founders fully imported within an hour.'
  },
  {
    q: 'How is the AI Advisor different from ChatGPT?',
    a: 'It has read access to your actual Helm data — pipeline, revenue trends, task history, content performance — so it can say things like “your biggest deal hasn’t had contact in 12 days.”'
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'You keep full export access for 30 days after cancellation, in CSV or JSON. No data hostage-taking.'
  },
  {
    q: 'What tech stack does it run on?',
    a: 'Next.js, Supabase (Postgres + Auth + Realtime), Stripe, Vercel, and OpenRouter for AI. Row-level security is enforced at the database layer.'
  },
  {
    q: 'Do landing pages support custom domains?',
    a: 'Yes, on both paid tiers, with automatic SSL.'
  },
  {
    q: 'Team plans?',
    a: 'Pro includes up to 5 seats. Lifetime is unlimited.'
  }
];

export const footer: Footer = {
  columns: [
    {
      title: 'Platform',
      links: ['CRM', 'Landing Pages', 'Automations', 'AI Advisor', 'Insights']
    },
    {
      title: 'More',
      links: ['Code Vault', 'Content Engine', 'Projects', 'Feedback', 'Command Center']
    },
    {
      title: 'Company',
      links: ['About', 'Changelog', 'Blog', 'Terms', 'Privacy']
    }
  ]
};

/**
 * Photography — Unsplash source URLs.
 * All photos receive the same duotone grade via .helm-photo-wrap / .helm-duotone.
 * Swap these for licensed or original photography before launch (see SETUP.md).
 */
export const photos: Record<PhotoKey, PhotoAsset> = {
  heroDesk: {
    src: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=70',
    alt: 'A founder’s desk late at night: open laptop, notebook and coffee under a single warm lamp.',
    width: 1200,
    height: 800
  },
  windowNight: {
    src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=70',
    alt: 'Working late beside a window with city light spilling across the table.',
    width: 1000,
    height: 1250
  },
  /** Full-bleed backdrop for the product index — requested wide enough not to
   *  soften when stretched across a 1600px section. */
  handsTyping: {
    src: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=70',
    alt: 'Hands typing on a laptop keyboard in a dark room.',
    width: 1600,
    height: 1067
  },
  quietOffice: {
    src: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=70',
    alt: 'A minimalist home office desk at dusk, chair pushed back from a single monitor.',
    width: 1400,
    height: 933
  },
  closing: {
    src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=70',
    alt: 'A small team working shoulder to shoulder around one table in low light.',
    width: 1600,
    height: 1067
  }
};