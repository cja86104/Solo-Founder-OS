import React from "react";
import Link from "next/link";
import { FoundersHelmIcon } from "@/components/founders-helm-icon";
import { MarketingNav } from "@/components/marketing/marketing-nav";

// ─── Color constants ──────────────────────────────────────────────────────────

const C = {
  cream:      "#F5F0E8",
  parchment:  "#EDE8DD",
  tan:        "#D9D2C2",
  warmWhite:  "#FDFAF5",
  ink:        "#1C1814",
  inkSoft:    "#3D3530",
  muted:      "#42342A",
  muted2:     "#6B5347",
  orange:     "#C75B1A",
  amber:      "#D97706",
  amberLight: "#FBD38D",
  green:      "#2D6A4F",
  border:     "rgba(28,24,20,0.08)",
  border2:    "rgba(28,24,20,0.14)",
};

const serif = "var(--font-fraunces), Georgia, serif";
const sans  = "var(--font-figtree), system-ui, sans-serif";

// ─── Static data ──────────────────────────────────────────────────────────────

const replacedTools = ["HubSpot CRM","Webflow","Zapier","Notion","Buffer","Mixpanel","FreshBooks","Typeform"];

const comparisonRows = [
  { feature: "Monthly cost",            helm: "$29/mo",        diy: "$200–500/mo",  hub: "$20–800/mo",  price: true },
  { feature: "CRM & Pipeline",          helm: "✓",             diy: "Separate tool",hub: "✓" },
  { feature: "Landing Pages",           helm: "✓",             diy: "Separate tool",hub: "Basic only" },
  { feature: "Automations / Workflows", helm: "✓",             diy: "Zapier add-on",hub: "Limited" },
  { feature: "Code Vault / Snippets",   helm: "✓",             diy: "Separate tool",hub: "✗" },
  { feature: "AI Business Advisor",     helm: "✓",             diy: "✗",            hub: "✗" },
  { feature: "Content Calendar",        helm: "✓",             diy: "Separate tool",hub: "✗" },
  { feature: "Invoicing & Projects",    helm: "✓",             diy: "Separate tool",hub: "✗" },
  { feature: "Real-time SaaS metrics",  helm: "✓",             diy: "Separate tool",hub: "✗" },
  { feature: "One login, unified data", helm: "✓",             diy: "✗",            hub: "Partial" },
  { feature: "Built for solo founders", helm: "✓",             diy: "✗",            hub: "✗" },
];

// Row 1: 5 + 4 + 3 = 12
// Row 2: 3 + 5 + 4 = 12
// Row 3: 4 + 4 + 4 = 12
const productRows = [
  [
    { icon:"👥", name:"Personal CRM",    cols:5, desc:"Track contacts, manage your deal pipeline, and never let a relationship go cold. Built for how founders actually work — not enterprise sales teams.", replaces:"HubSpot · Pipedrive · Streak" },
    { icon:"⚡", name:"Automations",     cols:4, desc:"Build visual workflows triggered by CRM events, form submissions, or schedules. Chain actions across all Helm products.", replaces:"Zapier · Make" },
    { icon:"📊", name:"Insights",        cols:3, desc:"Real-time dashboards unifying your revenue, pipeline, content, and task data.", replaces:"Mixpanel" },
  ],
  [
    { icon:"📄", name:"Landing Pages",   cols:3, desc:"Build, publish, and A/B test landing pages on your own domain. Built-in lead capture and analytics.", replaces:"Webflow · Unbounce" },
    { icon:"🤖", name:"AI Advisor",      cols:5, desc:"An AI that knows your entire business — pipeline, metrics, tasks, content. Ask \"why is my MRR flat?\" and get a real, data-backed answer.", replaces:"12 browser tabs of ChatGPT" },
    { icon:"✍️", name:"Content Engine", cols:4, desc:"Plan your content calendar, draft with AI assistance, and schedule across platforms — all from one interface.", replaces:"Buffer · ContentCal · Notion" },
  ],
  [
    { icon:"📁", name:"Projects",        cols:4, desc:"Task management, time tracking, and milestones — with one-click invoice generation from tracked hours.", replaces:"Linear · Harvest · FreshBooks" },
    { icon:"🗄️", name:"Code Vault",     cols:4, desc:"Store snippets, prompts, API keys, and templates with full-text search, tagging, and private collections.", replaces:"Notion · GitHub Gists" },
    { icon:"💬", name:"Feedback",        cols:4, desc:"Embeddable feedback widgets for your products. Collect, triage, and close the loop in one place.", replaces:"Canny · Typeform" },
  ],
];

const steps = [
  {
    num: "01", title: "Create your workspace",
    body: "Sign up, create your workspace, and import your existing contacts via CSV or Gmail sync. Your CRM is ready in under 5 minutes.",
    detail: "✓ No credit card to start  ·  ✓ Full 14-day trial  ·  ✓ Import from any tool",
  },
  {
    num: "02", title: "Activate your tools",
    body: "Enable the products you need, connect your custom domain for landing pages, and set up your first automation workflow — all from one dashboard.",
    detail: "✓ Guided setup for each product  ·  ✓ Pre-built automation templates  ·  ✓ Custom domain support",
  },
  {
    num: "03", title: "Automate & grow",
    body: "Let automations handle the routine work. Watch your Insights dashboard as your business grows. Ask the AI Advisor when you need strategic guidance.",
    detail: "✓ Unlimited automations  ·  ✓ Real-time metrics  ·  ✓ AI with full business context",
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
  { q: "Can I import data from my current tools?",       a: "Yes. Founders Helm supports CSV import for contacts, deals, and vault items. You can also sync Gmail to automatically pull in contact history, or use our REST API to migrate programmatically. Most founders are fully imported within an hour." },
  { q: "How is the AI Advisor different from ChatGPT?",  a: "The AI Advisor has read access to your actual Helm data — pipeline, revenue trends, task history, content performance. It can say \"your biggest deal hasn't had contact in 12 days\" or \"your MRR growth slowed in Feb — here's why.\" Generic AI tools can't do that." },
  { q: "What happens to my data if I cancel?",           a: "You retain full export access for 30 days after cancellation. All data is exportable as CSV or JSON. We don't hold your data hostage — it's yours, and you can always take it with you." },
  { q: "What tech stack does Founders Helm run on?",     a: "Next.js 15 (App Router), Supabase (PostgreSQL + Auth + Realtime), Stripe for billing, Vercel for global edge hosting, and OpenRouter for AI. Row-level security is enforced at the database layer for complete data isolation." },
  { q: "Do landing pages support custom domains?",       a: "Yes. Both Pro and Lifetime plans support custom domains with automatic SSL provisioning. Point your CNAME and your pages serve from your domain within minutes." },
  { q: "Is there a team plan for multiple users?",       a: "Pro includes up to 5 team members. Lifetime includes unlimited seats. For larger teams or agency use cases, reach out directly and we'll set you up." },
];

const footerCols: Record<string, string[]> = {
  Platform: ["CRM","Landing Pages","Automations","AI Advisor","Insights"],
  More:     ["Code Vault","Content Engine","Projects","Feedback","Command Center"],
  Company:  ["About","Changelog","Blog","Terms","Privacy"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Kicker({ children }: { children: string }) {
  return (
    <span style={{ display:"block", fontSize:12, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.orange, marginBottom:12 }}>
      {children}
    </span>
  );
}

function SectionTitle({ children, light }: { children: string | React.ReactNode; light?: boolean }) {
  return (
    <h2 style={{ fontFamily:serif, fontSize:"clamp(36px,4vw,56px)", fontWeight:900, lineHeight:1.08, letterSpacing:"-0.02em", color: light ? C.cream : C.ink, marginBottom:20 }}>
      {children}
    </h2>
  );
}

function CheckItem({ children }: { children: string }) {
  return (
    <li style={{ display:"flex", alignItems:"flex-start", gap:10, fontSize:14, color:C.inkSoft }}>
      <span style={{ color:C.orange, fontWeight:700, flexShrink:0 }}>✓</span>
      {children}
    </li>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div style={{ background:C.cream, color:C.ink, fontFamily:sans, overflowX:"hidden" }}>
      <MarketingNav />

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"160px 32px 100px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"center" }}>

          {/* Left copy */}
          <div>
            <h1 style={{ fontFamily:serif, fontSize:"clamp(48px,5.5vw,76px)", fontWeight:900, lineHeight:1.05, letterSpacing:"-0.025em", color:C.ink, marginBottom:24 }}>
              Run your whole<br />business from<br />
              <em style={{ fontStyle:"italic", color:C.orange }}>one dashboard.</em>
            </h1>
            <p style={{ fontSize:18, color:C.inkSoft, lineHeight:1.75, marginBottom:40, maxWidth:480 }}>
              Founders Helm gives solo founders and small teams{" "}
              <strong style={{ color:C.ink, fontWeight:600 }}>10 integrated tools</strong> — CRM,
              automations, landing pages, analytics, invoicing, and more — in one platform,
              at a price that makes sense.
            </p>

            <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:48 }}>
              <Link href="/signup" style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"15px 28px", borderRadius:10, background:C.ink, color:C.cream, fontSize:16, fontWeight:600, textDecoration:"none", fontFamily:sans }}>
                Start free trial
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link href="#platform" style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"14px 28px", borderRadius:10, background:"transparent", color:C.ink, fontSize:16, fontWeight:600, textDecoration:"none", border:`1.5px solid ${C.border2}`, fontFamily:sans }}>
                See the platform
              </Link>
            </div>

            <div style={{ display:"flex", flexWrap:"wrap", gap:24 }}>
              {["14-day free trial","No credit card","Cancel anytime"].map((t) => (
                <div key={t} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:C.inkSoft, fontWeight:500 }}>
                  <div style={{ width:18, height:18, borderRadius:"50%", background:C.green, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:10, fontWeight:700, flexShrink:0 }}>✓</div>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — dashboard card */}
          <div style={{ position:"relative" }}>
            {/* Top float */}
            <div style={{ position:"absolute", top:-20, right:-24, zIndex:10, background:C.warmWhite, border:`1px solid ${C.border2}`, borderRadius:12, padding:"12px 16px", boxShadow:"0 8px 32px rgba(28,24,20,0.1)", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}>📈</span>
              <div>
                <div style={{ fontFamily:serif, fontWeight:700, fontSize:16, lineHeight:1, color:C.ink }}>+$3,400</div>
                <div style={{ fontSize:11, color:C.muted2 }}>MRR this month</div>
              </div>
            </div>

            {/* Card */}
            <div style={{ background:C.warmWhite, border:`1px solid ${C.border2}`, borderRadius:20, overflow:"hidden", boxShadow:"0 24px 80px rgba(28,24,20,0.12), 0 4px 12px rgba(28,24,20,0.06)" }}>
              {/* Browser bar */}
              <div style={{ background:C.ink, padding:"16px 20px", display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:"#ef4444" }} />
                <div style={{ width:10, height:10, borderRadius:"50%", background:"#f59e0b" }} />
                <div style={{ width:10, height:10, borderRadius:"50%", background:"#10b981" }} />
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginLeft:8, fontFamily:"monospace", letterSpacing:"0.04em" }}>foundershelm.com/dashboard</span>
              </div>
              <div style={{ padding:24 }}>
                <div style={{ fontFamily:serif, fontSize:22, fontWeight:700, marginBottom:4, color:C.ink }}>Good morning, Chris 👋</div>
                <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Monday, March 16 · 3 tasks due today</div>

                {/* KPIs */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
                  {[
                    { label:"MRR",      val:"$8,400",  delta:"↑ 12%",    valColor:C.orange },
                    { label:"Pipeline", val:"$29,500", delta:"↑ 3 deals" },
                    { label:"Contacts", val:"1,248",   delta:"↑ 48 new"  },
                  ].map((k) => (
                    <div key={k.label} style={{ padding:"14px 16px", borderRadius:12, background:C.parchment, border:`1px solid ${C.border}` }}>
                      <div style={{ fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6, fontWeight:600 }}>{k.label}</div>
                      <div style={{ fontFamily:serif, fontSize:22, fontWeight:700, lineHeight:1, color: k.valColor ?? C.ink }}>{k.val}</div>
                      <div style={{ fontSize:11, marginTop:4, fontWeight:600, color:C.green }}>{k.delta}</div>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div style={{ fontSize:12, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}>Revenue — last 12 weeks</div>
                <div style={{ background:C.parchment, borderRadius:10, padding:16, marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:60 }}>
                    {[45,52,38,62,55,71,64,78,70,85,82,96].map((h,i) => (
                      <div key={i} style={{ flex:1, borderRadius:"4px 4px 0 0", height:`${h}%`, background: h===96 ? C.orange : h>75 ? C.amber : C.tan }} />
                    ))}
                  </div>
                </div>

                {/* Tasks */}
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    { done:true,  text:"Follow up with Marcus re: proposal", badge:"CRM",   bc:C.orange },
                    { done:false, text:"Review landing page A/B results",    badge:"Pages",  bc:C.green  },
                    { done:false, text:"Automation: welcome email flow",      badge:"Auto",   bc:C.amber  },
                  ].map((task) => (
                    <div key={task.text} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, background:C.parchment, border:`1px solid ${C.border}`, fontSize:13 }}>
                      <div style={{ width:16, height:16, borderRadius:4, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background: task.done ? C.green : "transparent", border: task.done ? "none" : `1.5px solid ${C.tan}`, color:"#fff", fontSize:9, fontWeight:700 }}>
                        {task.done ? "✓" : ""}
                      </div>
                      <span style={{ flex:1, textDecoration: task.done ? "line-through" : "none", color: task.done ? C.muted2 : C.inkSoft }}>{task.text}</span>
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:100, fontWeight:600, background:`${task.bc}18`, color:task.bc }}>{task.badge}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom float */}
            <div style={{ position:"absolute", bottom:-16, left:-24, zIndex:10, background:C.warmWhite, border:`1px solid ${C.border2}`, borderRadius:12, padding:"12px 16px", boxShadow:"0 8px 32px rgba(28,24,20,0.1)", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}>⚡</span>
              <div>
                <div style={{ fontFamily:serif, fontWeight:700, fontSize:16, lineHeight:1, color:C.ink }}>6 tools</div>
                <div style={{ fontSize:11, color:C.muted2 }}>replaced this month</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════
          REPLACES BAR
      ════════════════════════════════════════════ */}
      <div style={{ background:C.parchment, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:"28px 32px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", gap:40, flexWrap:"wrap" }}>
          <div style={{ fontSize:12, color:C.muted2, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600, whiteSpace:"nowrap" }}>Replaces</div>
          <div style={{ display:"flex", alignItems:"center", gap:32, flexWrap:"wrap", flex:1, justifyContent:"center" }}>
            {replacedTools.map((t) => (
              <div key={t} style={{ fontSize:14, color:C.muted, fontWeight:500 }}>{t}</div>
            ))}
            <div style={{ fontSize:14, color:C.muted2, fontWeight:500 }}>+ many more</div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          COMPARISON TABLE
      ════════════════════════════════════════════ */}
      <section id="compare" style={{ background:C.ink, padding:"120px 32px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ marginBottom:48 }}>
            <Kicker>Why switch</Kicker>
            <SectionTitle light>
              Stop paying for <em style={{ fontStyle:"italic", color:C.amber }}>ten tools.</em>
            </SectionTitle>
            <p style={{ fontSize:18, color:"rgba(245,240,232,0.7)", lineHeight:1.75, maxWidth:580 }}>
              Here&apos;s how Founders Helm stacks up against building your own stack of best-of-breed tools.
            </p>
          </div>

          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding:"20px 24px", textAlign:"left", fontSize:14, color:C.cream, borderBottom:"1px solid rgba(255,255,255,0.08)" }} />
                  <th style={{ padding:"20px 24px", textAlign:"center", fontSize:14, color:C.cream, borderBottom:"1px solid rgba(255,255,255,0.08)", background:"rgba(199,91,26,0.15)", borderRadius:"12px 12px 0 0" }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:100, background:C.orange, color:"#fff", fontSize:13, fontWeight:700 }}>
                      ⚓ Founders Helm
                    </span>
                  </th>
                  <th style={{ padding:"20px 24px", textAlign:"center", fontSize:14, fontWeight:700, color:C.cream, borderBottom:"1px solid rgba(255,255,255,0.08)" }}>DIY Stack</th>
                  <th style={{ padding:"20px 24px", textAlign:"center", fontSize:14, fontWeight:700, color:C.cream, borderBottom:"1px solid rgba(255,255,255,0.08)" }}>HubSpot Starter</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => {
                  const isCheck = (v: string) => v === "✓";
                  const isCross = (v: string) => v === "✗";
                  const cellColor = (v: string) => isCheck(v) ? "#4ade80" : isCross(v) ? "rgba(245,240,232,0.2)" : C.amber;
                  const cellSize  = (v: string) => isCheck(v) || isCross(v) ? 18 : 13;
                  return (
                    <tr key={row.feature}>
                      <td style={{ padding:"16px 24px", fontSize:14, fontWeight:500, color:C.cream, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>{row.feature}</td>
                      <td style={{ padding:"16px 24px", textAlign:"center", borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(199,91,26,0.08)", fontSize: row.price ? 15 : 18, fontWeight: row.price ? 700 : 400, color: row.price ? C.amberLight : "#4ade80", fontFamily: row.price ? "monospace" : undefined }}>{row.helm}</td>
                      <td style={{ padding:"16px 24px", textAlign:"center", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:cellSize(row.diy), color:cellColor(row.diy), fontWeight: !isCheck(row.diy) && !isCross(row.diy) ? 600 : 400 }}>{row.diy}</td>
                      <td style={{ padding:"16px 24px", textAlign:"center", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:cellSize(row.hub), color:cellColor(row.hub), fontWeight: !isCheck(row.hub) && !isCross(row.hub) ? 600 : 400 }}>{row.hub}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          PRODUCTS — BENTO GRID (inline col spans)
      ════════════════════════════════════════════ */}
      <section id="platform" style={{ background:C.warmWhite, padding:"120px 32px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ marginBottom:72 }}>
            <Kicker>The Platform</Kicker>
            <SectionTitle>10 products. One subscription.</SectionTitle>
            <p style={{ fontSize:18, color:C.inkSoft, lineHeight:1.75, maxWidth:580 }}>
              Every tool built to work with the others. No integrations to set up. No webhooks to debug.
            </p>
          </div>

          {/* Three rows of bento cards */}
          {productRows.map((row, ri) => (
            <div key={ri} style={{ display:"grid", gridTemplateColumns:"repeat(12,1fr)", gap:16, marginBottom:16 }}>
              {row.map((p) => (
                <div
                  key={p.name}
                  style={{
                    gridColumn: `span ${p.cols}`,
                    background:C.warmWhite, border:`1px solid ${C.border2}`,
                    borderRadius:16, padding:28, position:"relative", overflow:"hidden",
                  }}
                >
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${C.orange},${C.amber})`, opacity:0 }} className="group-hover:opacity-100" />
                  <div style={{ width:48, height:48, borderRadius:12, background:C.parchment, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:16 }}>
                    {p.icon}
                  </div>
                  <div style={{ fontFamily:serif, fontSize:20, fontWeight:700, marginBottom:8, lineHeight:1.2, color:C.ink }}>{p.name}</div>
                  <div style={{ fontSize:14, color:C.inkSoft, lineHeight:1.65, marginBottom:14 }}>{p.desc}</div>
                  <div style={{ fontSize:11, color:C.muted2, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Replaces: {p.replaces}</div>
                </div>
              ))}
            </div>
          ))}

          {/* Command Center — full width */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(12,1fr)", gap:16 }}>
            <div style={{ gridColumn:"span 12", background:C.warmWhite, border:`1px solid ${C.border2}`, borderRadius:16, padding:28, display:"flex", alignItems:"flex-start", gap:24 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:C.parchment, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                🖥️
              </div>
              <div>
                <div style={{ fontFamily:serif, fontSize:20, fontWeight:700, marginBottom:8, lineHeight:1.2, color:C.ink }}>Command Center</div>
                <div style={{ fontSize:14, color:C.inkSoft, lineHeight:1.65, marginBottom:14 }}>
                  Your mission control: live SaaS metrics — MRR, churn, active users, conversion rates — all in a real-time unified view. The dashboard you always wanted but couldn&apos;t justify paying $200/month for.
                </div>
                <div style={{ fontSize:11, color:C.muted2, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Replaces: ChartMogul · Baremetrics · ProfitWell</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════ */}
      <section style={{ background:C.cream, padding:"120px 32px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:72 }}>
            <Kicker>Getting started</Kicker>
            <SectionTitle>Up and running in <em style={{ fontStyle:"italic", color:C.orange }}>minutes.</em></SectionTitle>
            <p style={{ fontSize:18, color:C.inkSoft, lineHeight:1.75, maxWidth:580, margin:"0 auto" }}>
              No onboarding calls. No implementation specialists. Just sign up and start running your business.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:48 }}>
            {steps.map((s) => (
              <div key={s.num}>
                <div style={{ fontFamily:serif, fontSize:72, fontWeight:900, lineHeight:1, color:C.border2, marginBottom:16, letterSpacing:"-0.04em" }}>{s.num}</div>
                <div style={{ fontFamily:serif, fontSize:24, fontWeight:700, marginBottom:12, lineHeight:1.2, color:C.ink }}>{s.title}</div>
                <div style={{ fontSize:15, color:C.inkSoft, lineHeight:1.75, marginBottom:20 }}>{s.body}</div>
                <div style={{ padding:16, borderRadius:10, background:C.parchment, border:`1px solid ${C.border}`, fontSize:13, color:C.inkSoft, lineHeight:1.6 }}>{s.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════ */}
      <section id="pricing" style={{ background:C.warmWhite, padding:"120px 32px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:72 }}>
            <Kicker>Pricing</Kicker>
            <SectionTitle>No hidden fees. <em style={{ fontStyle:"italic", color:C.orange }}>No surprises.</em></SectionTitle>
            <p style={{ fontSize:18, color:C.inkSoft, lineHeight:1.75, maxWidth:580, margin:"0 auto" }}>
              One flat price. All 10 products included. No per-seat fees, no feature gating, no add-ons.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, maxWidth:880, margin:"0 auto" }}>
            {/* Pro */}
            <div style={{ borderRadius:20, padding:40, position:"relative", border:`1.5px solid ${C.orange}`, background:`linear-gradient(160deg,rgba(199,91,26,0.04),${C.warmWhite} 50%)` }}>
              <div style={{ position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)", padding:"5px 16px", borderRadius:100, background:C.orange, color:"#fff", fontSize:12, fontWeight:700, whiteSpace:"nowrap", boxShadow:"0 2px 8px rgba(199,91,26,0.3)" }}>Most popular</div>
              <div style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:C.orange, marginBottom:12 }}>Pro Plan · Monthly</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:4 }}>
                <span style={{ fontFamily:serif, fontSize:60, fontWeight:900, lineHeight:1, color:C.ink }}>$29</span>
                <span style={{ fontSize:16, color:C.muted }}>/month</span>
              </div>
              <div style={{ fontSize:14, color:C.inkSoft, marginBottom:32, lineHeight:1.5 }}>All 10 products. Every feature. Nothing held back.</div>
              <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:13, marginBottom:36 }}>
                {proFeatures.map((f) => <CheckItem key={f}>{f}</CheckItem>)}
              </ul>
              <Link href="/signup" style={{ display:"block", textAlign:"center", padding:15, borderRadius:10, background:C.ink, color:C.cream, fontWeight:700, fontSize:15, textDecoration:"none", fontFamily:sans }}>
                Start 14-day free trial →
              </Link>
              <p style={{ textAlign:"center", fontSize:12, color:C.muted2, marginTop:12 }}>No credit card required</p>
            </div>

            {/* Lifetime */}
            <div style={{ borderRadius:20, padding:40, position:"relative", border:`1.5px solid ${C.border2}`, background:C.warmWhite }}>
              <div style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:C.orange, marginBottom:12 }}>Lifetime Access · Pay once</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:4 }}>
                <span style={{ fontFamily:serif, fontSize:60, fontWeight:900, lineHeight:1, color:C.ink }}>$299</span>
                <span style={{ fontSize:16, color:C.muted }}>one-time</span>
              </div>
              <div style={{ fontSize:14, color:C.inkSoft, marginBottom:32, lineHeight:1.5 }}>Everything in Pro, forever. Pay once, never pay again.</div>
              <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:13, marginBottom:36 }}>
                {lifetimeFeatures.map((f) => <CheckItem key={f}>{f}</CheckItem>)}
              </ul>
              <Link href="/signup" style={{ display:"block", textAlign:"center", padding:14, borderRadius:10, background:"transparent", color:C.ink, fontWeight:700, fontSize:15, textDecoration:"none", fontFamily:sans, border:`1.5px solid ${C.border2}` }}>
                Get lifetime access →
              </Link>
              <p style={{ textAlign:"center", fontSize:12, color:C.muted2, marginTop:12 }}>Includes 14-day trial before first charge</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════ */}
      <section id="faq" style={{ background:C.cream, padding:"120px 32px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:80, alignItems:"start" }}>
            <div>
              <Kicker>FAQ</Kicker>
              <h2 style={{ fontFamily:serif, fontSize:40, fontWeight:900, lineHeight:1.1, letterSpacing:"-0.02em", color:C.ink, marginBottom:16 }}>
                Questions?<br />We&apos;ve got <em style={{ fontStyle:"italic", color:C.orange }}>answers.</em>
              </h2>
              <p style={{ fontSize:16, color:C.inkSoft, lineHeight:1.7 }}>
                Everything you need to know before making the switch. Can&apos;t find what you&apos;re looking for? Email us at hello@foundershelm.com.
              </p>
            </div>
            <div>
              {faqs.map((item, i) => (
                <details key={i} style={{ borderBottom:`1px solid ${C.border2}` }}>
                  <summary style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"22px 0", cursor:"pointer", listStyle:"none", color:C.ink, fontFamily:sans }}>
                    <span style={{ fontSize:15, fontWeight:600, lineHeight:1.4 }}>{item.q}</span>
                    <span style={{ width:28, height:28, borderRadius:"50%", border:`1.5px solid ${C.border2}`, display:"flex", alignItems:"center", justifyContent:"center", color:C.orange, fontSize:18, flexShrink:0, marginLeft:16 }}>+</span>
                  </summary>
                  <p style={{ paddingBottom:22, fontSize:15, color:C.inkSoft, lineHeight:1.75 }}>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CTA
      ════════════════════════════════════════════ */}
      <section style={{ background:C.ink, padding:"120px 32px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", width:800, height:800, borderRadius:"50%", background:"radial-gradient(circle,rgba(199,91,26,0.15) 0%,transparent 70%)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }} />
        <div style={{ position:"relative", maxWidth:780, margin:"0 auto", textAlign:"center" }}>
          <Kicker>Start today</Kicker>
          <h2 style={{ fontFamily:serif, fontSize:"clamp(44px,5vw,72px)", fontWeight:900, lineHeight:1.05, letterSpacing:"-0.025em", color:C.cream, marginBottom:20 }}>
            Your entire business,<br />
            <em style={{ fontStyle:"italic", color:C.amber }}>finally organized.</em>
          </h2>
          <p style={{ fontSize:18, color:"rgba(245,240,232,0.8)", lineHeight:1.7, marginBottom:40 }}>
            14-day free trial. No credit card required. Cancel anytime. Join founders who replaced their entire SaaS stack with one $29/month subscription.
          </p>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, flexWrap:"wrap" }}>
            <Link href="/signup" style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"15px 32px", borderRadius:10, background:C.amber, color:C.ink, fontSize:16, fontWeight:700, textDecoration:"none", fontFamily:sans }}>
              Start free trial
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="#pricing" style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"14px 28px", borderRadius:10, background:"transparent", color:C.cream, fontSize:16, fontWeight:600, textDecoration:"none", border:"1.5px solid rgba(245,240,232,0.2)", fontFamily:sans }}>
              View pricing
            </Link>
          </div>
          <div style={{ marginTop:28, display:"flex", justifyContent:"center", gap:24, flexWrap:"wrap", fontSize:13, color:"rgba(245,240,232,0.4)", fontWeight:500 }}>
            {["No credit card required","14-day free trial","Cancel anytime","Export your data"].map((t) => (
              <span key={t}>✓ {t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <footer style={{ background:C.ink, borderTop:"1px solid rgba(255,255,255,0.06)", padding:"56px 32px 32px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr auto auto auto", gap:56, marginBottom:48 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <div style={{ width:30, height:30, borderRadius:6, background:C.orange, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <FoundersHelmIcon className="h-4 w-4 text-white" />
              </div>
              <span style={{ fontFamily:serif, fontSize:20, fontWeight:700, color:C.cream }}>Founders Helm</span>
            </div>
            <p style={{ fontSize:14, color:"rgba(245,240,232,0.4)", lineHeight:1.65, maxWidth:260 }}>
              The operating system for solo founders. 10 integrated tools, one flat price, built acquisition-ready.
            </p>
          </div>
          {Object.entries(footerCols).map(([heading, links]) => (
            <div key={heading}>
              <h4 style={{ fontSize:11, fontWeight:700, color:"rgba(245,240,232,0.3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:18 }}>{heading}</h4>
              <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:11 }}>
                {links.map((l) => (
                  <li key={l}><Link href="#" style={{ fontSize:14, color:"rgba(245,240,232,0.55)", textDecoration:"none" }}>{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ maxWidth:1200, margin:"0 auto", borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:24, display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:13, color:"rgba(245,240,232,0.3)", flexWrap:"wrap", gap:12 }}>
          <span>© 2025 Founders Helm. All rights reserved.</span>
          <span>Built on Next.js · Supabase · Stripe · Vercel</span>
        </div>
      </footer>
    </div>
  );
}
