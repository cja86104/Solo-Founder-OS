import Link from "next/link";
import { FoundersHelmIcon } from "@/components/founders-helm-icon";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#1A0E06",
        fontFamily: "var(--font-figtree), system-ui, sans-serif",
      }}
    >
      {/* ── Left panel — branding ───────────────────────────── */}
      <div
        style={{
          display: "none",
          width: "45%",
          flexShrink: 0,
          background: "#0A0602",
          borderRight: "1px solid rgba(196,168,130,0.10)",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          position: "relative",
          overflow: "hidden",
        }}
        className="auth-left-panel"
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(199,91,26,0.10) 0%, transparent 70%)",
            bottom: "-100px",
            left: "-100px",
            pointerEvents: "none",
          }}
        />

        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#C75B1A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FoundersHelmIcon className="h-5 w-5 text-white" />
          </div>
          <span
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: 20,
              fontWeight: 700,
              color: "#F2EAD8",
            }}
          >
            Founders Helm
          </span>
        </Link>

        {/* Core message */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#C4A882",
              marginBottom: 20,
              padding: "4px 12px",
              borderRadius: 100,
              border: "1px solid rgba(196,168,130,0.20)",
            }}
          >
            The OS for solo founders
          </div>
          <h2
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: "clamp(28px,3vw,40px)",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#F2EAD8",
              marginBottom: 20,
            }}
          >
            Your entire business.<br />
            <em style={{ fontStyle: "italic", color: "#C75B1A" }}>
              One dashboard.
            </em>
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "#A89070",
              lineHeight: 1.75,
              maxWidth: 380,
            }}
          >
            CRM, automations, landing pages, analytics, invoicing — all
            connected, all included. Built for how solo founders actually work.
          </p>
        </div>

        {/* Trust badges */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            position: "relative",
            zIndex: 1,
          }}
        >
          {[
            "10 integrated tools — one flat price",
            "Row-level security at the database layer",
            "Full data export, always",
          ].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                color: "#A89070",
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "rgba(74,140,106,0.20)",
                  border: "1px solid rgba(74,140,106,0.40)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#4A8C6A",
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ✓
              </div>
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 32px",
        }}
      >
        {/* Mobile logo */}
        <div
          style={{ marginBottom: 40 }}
          className="auth-mobile-logo"
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#C75B1A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FoundersHelmIcon className="h-4 w-4 text-white" />
            </div>
            <span
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 18,
                fontWeight: 700,
                color: "#F2EAD8",
              }}
            >
              Founders Helm
            </span>
          </Link>
        </div>

        {/* Form card */}
        <div
          style={{
            width: "100%",
            maxWidth: 440,
            background: "#2F190C",
            border: "1px solid rgba(196,168,130,0.15)",
            borderRadius: 20,
            padding: "40px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
          }}
        >
          {children}
        </div>

        {/* Back to marketing */}
        <p
          style={{
            marginTop: 24,
            fontSize: 13,
            color: "#6B5244",
          }}
        >
          <Link
            href="/"
            style={{ color: "#A89070", textDecoration: "none" }}
          >
            ← Back to foundershelm.com
          </Link>
        </p>
      </div>

      {/* Responsive: show left panel on lg+ */}
      <style>{`
        @media (min-width: 1024px) {
          .auth-left-panel { display: flex !important; }
          .auth-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
}
