import React from "react";
import Link from "next/link";
import { FoundersHelmIcon } from "@/components/founders-helm-icon";
import { MarketingNav } from "@/components/marketing/marketing-nav";

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  // Walnut backgrounds
  bg:         "#1A0E06",   // deepest — primary page bg
  bgAlt:      "#251409",   // alternate sections
  bgCard:     "#2F190C",   // card surfaces
  bgCardLift: "#3A2010",   // elevated within cards

  // Sand / tan
  sand:       "#C4A882",
  sandLight:  "#D6C4A4",

  // Text
  cream:      "#F2EAD8",
  creamMuted: "#A89070",

  // Accent
  orange:     "#C75B1A",
  amber:      "#D97706",

  // Borders
  border:     "rgba(196,168,130,0.10)",
  border2:    "rgba(196,168,130,0.20)",

  // Utility
  green:      "#4A8C6A",
};

const serif = "var(--font-fraunces), Georgia, serif";
const sans  = "var(--font-figtree), system-ui, sans-serif";

// ─── Static data ──────────────────────────────────────────────────────────────
const pillars = [
  {
    label:    "Replace your stack",
    headline: "One price.\nEvery tool.",
    body:     "CRM, automations, landing pages, analytics, invoicing — all connected, all included. Stop paying $200–500/month for tools that don't talk to each other.",
  },
  {
    label:    "AI with full context",
    headline: "Ask why your\nMRR is flat.",
    body:     "The AI Advisor reads your actual pipeline, revenue, and task data — not generic advice. Answers about your business, backed by your numbers.",
  },
  {
    label:    "Built acquisition-ready",
    headline: "Architecture\nthat holds up.",
    body:     "Row-level security, clean data export, documented stack. Built to the standard that acquirers and enterprise clients actually care about.",
  },
];

const proFeatures = [
  "All 10 integrated products",
  "Unlimited landing pages + custom domain",
  "10,000 CRM contacts",
  "100,000 page views / month",
  "Unlimited code vault items",
  "AI Advisor — full data context",
  "Unlimited automation workflows",
  "Advanced analytics + CSV export",
  "Up to 5 team members",
  "Priority support — <24h response",
];

const lifetimeFeatures = [
  "Everything in Pro",
  "Unlimited team members",
  "Unlimited contacts, page views, items",
  "All future features and updates",
  "White-label landing pages",
  "Lifetime price lock guarantee",
  "Priority support, forever",
];

const faqs = [
  {
    q: "Can I import data from my current tools?",
    a: "Yes. Founders Helm supports CSV import for contacts, deals, and vault items. You can also sync Gmail to automatically pull in contact history, or use our REST API to migrate programmatically. Most founders are fully imported within an hour.",
  },
  {
    q: "How is the AI Advisor different from ChatGPT?",
    a: 'The AI Advisor has read access to your actual Helm data — pipeline, revenue trends, task history, content performance. It can say "your biggest deal hasn\'t had contact in 12 days" or "your MRR growth slowed in Feb — here\'s why." Generic AI tools can\'t do that.',
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You retain full export access for 30 days after cancellation. All data is exportable as CSV or JSON. We don't hold your data hostage — it's yours, and you can always take it with you.",
  },
  {
    q: "What tech stack does Founders Helm run on?",
    a: "Next.js 15 (App Router), Supabase (PostgreSQL + Auth + Realtime), Stripe for billing, Vercel for global edge hosting, and OpenRouter for AI. Row-level security is enforced at the database layer for complete data isolation.",
  },
  {
    q: "Do landing pages support custom domains?",
    a: "Yes. Both Pro and Lifetime plans support custom domains with automatic SSL provisioning. Point your CNAME and your pages serve from your domain within minutes.",
  },
  {
    q: "Is there a team plan for multiple users?",
    a: "Pro includes up to 5 team members. Lifetime includes unlimited seats. For larger teams or agency use cases, reach out directly and we'll set you up.",
  },
];

const footerCols: Record<string, string[]> = {
  Platform: ["CRM", "Landing Pages", "Automations", "AI Advisor", "Insights"],
  More:     ["Code Vault", "Content Engine", "Projects", "Feedback", "Command Center"],
  Company:  ["About", "Changelog", "Blog", "Terms", "Privacy"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Kicker({ children }: { children: string }) {
  return (
    <span
      style={{
        display: "block",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: C.sand,
        marginBottom: 12,
      }}
    >
      {children}
    </span>
  );
}

function CheckItem({ children }: { children: string }) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        fontSize: 14,
        color: C.sandLight,
      }}
    >
      <span style={{ color: C.orange, fontWeight: 700, flexShrink: 0 }}>✓</span>
      {children}
    </li>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div
      style={{
        background: C.bg,
        color: C.cream,
        fontFamily: sans,
        overflowX: "hidden",
      }}
    >
      <MarketingNav />

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <section
        style={{ maxWidth: 1200, margin: "0 auto", padding: "160px 32px 100px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 80,
            alignItems: "center",
          }}
        >
          {/* Left copy */}
          <div>
            <Kicker>The operating system for solo founders</Kicker>
            <h1
              style={{
                fontFamily: serif,
                fontSize: "clamp(48px,5.5vw,76px)",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                color: C.cream,
                marginBottom: 24,
              }}
            >
              Your entire<br />business.<br />
              <em style={{ fontStyle: "italic", color: C.orange }}>
                One dashboard.
              </em>
            </h1>
            <p
              style={{
                fontSize: 18,
                color: C.creamMuted,
                lineHeight: 1.75,
                marginBottom: 40,
                maxWidth: 480,
              }}
            >
              Founders Helm replaces your scattered stack of SaaS tools with one
              integrated platform — built for how solo founders actually work, at
              a price that makes sense.
            </p>

            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 48,
              }}
            >
              <Link
                href="/signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "15px 28px",
                  borderRadius: 10,
                  background: C.orange,
                  color: C.cream,
                  fontSize: 16,
                  fontWeight: 700,
                  textDecoration: "none",
                  fontFamily: sans,
                }}
              >
                Start free trial
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="#pricing"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 28px",
                  borderRadius: 10,
                  background: "transparent",
                  color: C.cream,
                  fontSize: 16,
                  fontWeight: 600,
                  textDecoration: "none",
                  border: `1.5px solid ${C.border2}`,
                  fontFamily: sans,
                }}
              >
                View pricing
              </Link>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
              {["14-day free trial", "No credit card", "Cancel anytime"].map(
                (t) => (
                  <div
                    key={t}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      color: C.creamMuted,
                      fontWeight: 500,
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: C.green,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </div>
                    {t}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div style={{ position: "relative" }}>
            {/* Top float */}
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -24,
                zIndex: 10,
                background: C.bgCard,
                border: `1px solid ${C.border2}`,
                borderRadius: 12,
                padding: "12px 16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>📈</span>
              <div>
                <div
                  style={{
                    fontFamily: serif,
                    fontWeight: 700,
                    fontSize: 16,
                    lineHeight: 1,
                    color: C.cream,
                  }}
                >
                  +$3,400
                </div>
                <div style={{ fontSize: 11, color: C.creamMuted }}>
                  MRR this month
                </div>
              </div>
            </div>

            {/* Card */}
            <div
              style={{
                background: C.bgCard,
                border: `1px solid ${C.border2}`,
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
              }}
            >
              {/* Browser bar */}
              <div
                style={{
                  background: "#0A0602",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#ef4444",
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#f59e0b",
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#10b981",
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    color: "rgba(242,234,216,0.25)",
                    marginLeft: 8,
                    fontFamily: "monospace",
                    letterSpacing: "0.04em",
                  }}
                >
                  foundershelm.com/dashboard
                </span>
              </div>

              <div style={{ padding: 24 }}>
                <div
                  style={{
                    fontFamily: serif,
                    fontSize: 22,
                    fontWeight: 700,
                    marginBottom: 4,
                    color: C.cream,
                  }}
                >
                  Good morning, Chris 👋
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: C.creamMuted,
                    marginBottom: 20,
                  }}
                >
                  Monday, March 16 · 3 tasks due today
                </div>

                {/* KPIs */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  {[
                    { label: "MRR",      val: "$8,400",  delta: "↑ 12%",    valColor: C.orange },
                    { label: "Pipeline", val: "$29,500", delta: "↑ 3 deals" },
                    { label: "Contacts", val: "1,248",   delta: "↑ 48 new"  },
                  ].map((k) => (
                    <div
                      key={k.label}
                      style={{
                        padding: "14px 16px",
                        borderRadius: 12,
                        background: C.bgCardLift,
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: C.creamMuted,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: 6,
                          fontWeight: 600,
                        }}
                      >
                        {k.label}
                      </div>
                      <div
                        style={{
                          fontFamily: serif,
                          fontSize: 22,
                          fontWeight: 700,
                          lineHeight: 1,
                          color: k.valColor ?? C.cream,
                        }}
                      >
                        {k.val}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          marginTop: 4,
                          fontWeight: 600,
                          color: C.green,
                        }}
                      >
                        {k.delta}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.creamMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 10,
                  }}
                >
                  Revenue — last 12 weeks
                </div>
                <div
                  style={{
                    background: C.bgCardLift,
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 4,
                      height: 60,
                    }}
                  >
                    {[45, 52, 38, 62, 55, 71, 64, 78, 70, 85, 82, 96].map(
                      (h, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            borderRadius: "4px 4px 0 0",
                            height: `${h}%`,
                            background:
                              h === 96
                                ? C.orange
                                : h > 75
                                ? C.amber
                                : C.sand,
                          }}
                        />
                      )
                    )}
                  </div>
                </div>

                {/* Tasks */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { done: true,  text: "Follow up with Marcus re: proposal", badge: "CRM",   bc: C.orange },
                    { done: false, text: "Review landing page A/B results",    badge: "Pages",  bc: C.green  },
                    { done: false, text: "Automation: welcome email flow",      badge: "Auto",   bc: C.amber  },
                  ].map((task) => (
                    <div
                      key={task.text}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 8,
                        background: C.bgCardLift,
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                      }}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: task.done ? C.green : "transparent",
                          border: task.done ? "none" : `1.5px solid ${C.border2}`,
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 700,
                        }}
                      >
                        {task.done ? "✓" : ""}
                      </div>
                      <span
                        style={{
                          flex: 1,
                          textDecoration: task.done ? "line-through" : "none",
                          color: task.done ? C.creamMuted : C.cream,
                        }}
                      >
                        {task.text}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 100,
                          fontWeight: 600,
                          background: `${task.bc}22`,
                          color: task.bc,
                        }}
                      >
                        {task.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom float */}
            <div
              style={{
                position: "absolute",
                bottom: -16,
                left: -24,
                zIndex: 10,
                background: C.bgCard,
                border: `1px solid ${C.border2}`,
                borderRadius: 12,
                padding: "12px 16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>⚡</span>
              <div>
                <div
                  style={{
                    fontFamily: serif,
                    fontWeight: 700,
                    fontSize: 16,
                    lineHeight: 1,
                    color: C.cream,
                  }}
                >
                  $200+/mo
                </div>
                <div style={{ fontSize: 11, color: C.creamMuted }}>
                  saved vs your old stack
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          THREE PILLARS
      ════════════════════════════════════════════ */}
      <section
        style={{
          background: C.bgAlt,
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
          padding: "80px 32px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 48,
          }}
        >
          {pillars.map((p) => (
            <div
              key={p.label}
              style={{ borderLeft: `2px solid ${C.orange}`, paddingLeft: 28 }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: C.sand,
                  marginBottom: 14,
                }}
              >
                {p.label}
              </div>
              <div
                style={{
                  fontFamily: serif,
                  fontSize: 24,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: C.cream,
                  marginBottom: 16,
                  whiteSpace: "pre-line",
                }}
              >
                {p.headline}
              </div>
              <div
                style={{ fontSize: 15, color: C.creamMuted, lineHeight: 1.75 }}
              >
                {p.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════ */}
      <section id="pricing" style={{ background: C.bg, padding: "120px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <Kicker>Pricing</Kicker>
            <h2
              style={{
                fontFamily: serif,
                fontSize: "clamp(36px,4vw,56px)",
                fontWeight: 900,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                color: C.cream,
                marginBottom: 20,
              }}
            >
              No hidden fees.{" "}
              <em style={{ fontStyle: "italic", color: C.orange }}>
                No surprises.
              </em>
            </h2>
            <p
              style={{
                fontSize: 18,
                color: C.creamMuted,
                lineHeight: 1.75,
                maxWidth: 580,
                margin: "0 auto",
              }}
            >
              One flat price. All 10 products included. No per-seat fees, no
              feature gating, no add-ons.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              maxWidth: 880,
              margin: "0 auto",
            }}
          >
            {/* Pro */}
            <div
              style={{
                borderRadius: 20,
                padding: 40,
                position: "relative",
                border: `1.5px solid ${C.orange}`,
                background: `linear-gradient(160deg,rgba(199,91,26,0.10),${C.bgCard} 55%)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -13,
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "5px 16px",
                  borderRadius: 100,
                  background: C.orange,
                  color: C.cream,
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 10px rgba(199,91,26,0.5)",
                }}
              >
                Most popular
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: C.orange,
                  marginBottom: 12,
                }}
              >
                Pro Plan · Monthly
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 4,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: serif,
                    fontSize: 60,
                    fontWeight: 900,
                    lineHeight: 1,
                    color: C.cream,
                  }}
                >
                  $29
                </span>
                <span style={{ fontSize: 16, color: C.creamMuted }}>/month</span>
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: C.sandLight,
                  marginBottom: 32,
                  lineHeight: 1.5,
                }}
              >
                All 10 products. Every feature. Nothing held back.
              </div>
              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 13,
                  marginBottom: 36,
                }}
              >
                {proFeatures.map((f) => (
                  <CheckItem key={f}>{f}</CheckItem>
                ))}
              </ul>
              <Link
                href="/signup"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: 15,
                  borderRadius: 10,
                  background: C.orange,
                  color: C.cream,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  fontFamily: sans,
                }}
              >
                Start 14-day free trial →
              </Link>
              <p
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: C.creamMuted,
                  marginTop: 12,
                }}
              >
                No credit card required
              </p>
            </div>

            {/* Lifetime */}
            <div
              style={{
                borderRadius: 20,
                padding: 40,
                position: "relative",
                border: `1.5px solid ${C.border2}`,
                background: C.bgCard,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: C.sand,
                  marginBottom: 12,
                }}
              >
                Lifetime Access · Pay once
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 4,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: serif,
                    fontSize: 60,
                    fontWeight: 900,
                    lineHeight: 1,
                    color: C.cream,
                  }}
                >
                  $299
                </span>
                <span style={{ fontSize: 16, color: C.creamMuted }}>
                  one-time
                </span>
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: C.sandLight,
                  marginBottom: 32,
                  lineHeight: 1.5,
                }}
              >
                Everything in Pro, forever. Pay once, never pay again.
              </div>
              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 13,
                  marginBottom: 36,
                }}
              >
                {lifetimeFeatures.map((f) => (
                  <CheckItem key={f}>{f}</CheckItem>
                ))}
              </ul>
              <Link
                href="/signup"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: 14,
                  borderRadius: 10,
                  background: "transparent",
                  color: C.cream,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  fontFamily: sans,
                  border: `1.5px solid ${C.border2}`,
                }}
              >
                Get lifetime access →
              </Link>
              <p
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: C.creamMuted,
                  marginTop: 12,
                }}
              >
                Includes 14-day trial before first charge
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════ */}
      <section id="faq" style={{ background: C.bgAlt, padding: "120px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "320px 1fr",
              gap: 80,
              alignItems: "start",
            }}
          >
            <div>
              <Kicker>FAQ</Kicker>
              <h2
                style={{
                  fontFamily: serif,
                  fontSize: 40,
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  color: C.cream,
                  marginBottom: 16,
                }}
              >
                Questions?<br />We&apos;ve got{" "}
                <em style={{ fontStyle: "italic", color: C.orange }}>
                  answers.
                </em>
              </h2>
              <p style={{ fontSize: 16, color: C.creamMuted, lineHeight: 1.7 }}>
                Everything you need to know before making the switch. Can&apos;t
                find what you&apos;re looking for? Email us at{" "}
                hello@foundershelm.com.
              </p>
            </div>
            <div>
              {faqs.map((item, i) => (
                <details
                  key={i}
                  style={{ borderBottom: `1px solid ${C.border2}` }}
                >
                  <summary
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "22px 0",
                      cursor: "pointer",
                      listStyle: "none",
                      color: C.cream,
                      fontFamily: sans,
                    }}
                  >
                    <span
                      style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}
                    >
                      {item.q}
                    </span>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: `1.5px solid ${C.border2}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: C.orange,
                        fontSize: 18,
                        flexShrink: 0,
                        marginLeft: 16,
                      }}
                    >
                      +
                    </span>
                  </summary>
                  <p
                    style={{
                      paddingBottom: 22,
                      fontSize: 15,
                      color: C.creamMuted,
                      lineHeight: 1.75,
                    }}
                  >
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CTA
      ════════════════════════════════════════════ */}
      <section
        style={{
          background: C.bgCard,
          padding: "120px 32px",
          position: "relative",
          overflow: "hidden",
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 800,
            height: 800,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(199,91,26,0.12) 0%,transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            maxWidth: 780,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <Kicker>Start today</Kicker>
          <h2
            style={{
              fontFamily: serif,
              fontSize: "clamp(44px,5vw,72px)",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              color: C.cream,
              marginBottom: 20,
            }}
          >
            Your entire business,<br />
            <em style={{ fontStyle: "italic", color: C.orange }}>
              finally organized.
            </em>
          </h2>
          <p
            style={{
              fontSize: 18,
              color: C.creamMuted,
              lineHeight: 1.7,
              marginBottom: 40,
            }}
          >
            14-day free trial. No credit card required. Cancel anytime.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "15px 32px",
                borderRadius: 10,
                background: C.orange,
                color: C.cream,
                fontSize: 16,
                fontWeight: 700,
                textDecoration: "none",
                fontFamily: sans,
              }}
            >
              Start free trial
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="#pricing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 28px",
                borderRadius: 10,
                background: "transparent",
                color: C.cream,
                fontSize: 16,
                fontWeight: 600,
                textDecoration: "none",
                border: `1.5px solid ${C.border2}`,
                fontFamily: sans,
              }}
            >
              View pricing
            </Link>
          </div>
          <div
            style={{
              marginTop: 28,
              display: "flex",
              justifyContent: "center",
              gap: 24,
              flexWrap: "wrap",
              fontSize: 13,
              color: C.creamMuted,
              fontWeight: 500,
            }}
          >
            {[
              "No credit card required",
              "14-day free trial",
              "Cancel anytime",
              "Export your data",
            ].map((t) => (
              <span key={t}>✓ {t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <footer
        style={{
          background: "#0A0602",
          borderTop: `1px solid ${C.border}`,
          padding: "56px 32px 32px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr auto auto auto",
            gap: 56,
            marginBottom: 48,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  background: C.orange,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FoundersHelmIcon className="h-4 w-4 text-white" />
              </div>
              <span
                style={{
                  fontFamily: serif,
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.cream,
                }}
              >
                Founders Helm
              </span>
            </div>
            <p
              style={{
                fontSize: 14,
                color: C.creamMuted,
                lineHeight: 1.65,
                maxWidth: 260,
              }}
            >
              The operating system for solo founders. One flat price, built
              acquisition-ready.
            </p>
          </div>
          {Object.entries(footerCols).map(([heading, links]) => (
            <div key={heading}>
              <h4
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.sand,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 18,
                  opacity: 0.5,
                }}
              >
                {heading}
              </h4>
              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 11,
                }}
              >
                {links.map((l) => (
                  <li key={l}>
                    <Link
                      href="#"
                      style={{
                        fontSize: 14,
                        color: C.creamMuted,
                        textDecoration: "none",
                      }}
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            borderTop: `1px solid ${C.border}`,
            paddingTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13,
            color: C.creamMuted,
            flexWrap: "wrap",
            gap: 12,
            opacity: 0.5,
          }}
        >
          <span>© 2025 Founders Helm. All rights reserved.</span>
          <span>Built on Next.js · Supabase · Stripe · Vercel</span>
        </div>
      </footer>
    </div>
  );
}
