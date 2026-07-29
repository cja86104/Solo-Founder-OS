import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Fraunces, Figtree } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Founders Helm",
    template: "%s | Founders Helm",
  },
  description:
    "Your entire business. One dashboard. 10 integrated tools for founders.",
  keywords: [
    "SaaS",
    "founder tools",
    "indie hacker",
    "startup",
    "business dashboard",
    "CRM",
    "analytics",
    "project management",
  ],
  authors: [{ name: "Founders Helm" }],
  creator: "Founders Helm",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://www.foundershelm.com"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Founders Helm",
    description:
      "Your entire business. One dashboard. 10 integrated tools for founders.",
    siteName: "Founders Helm",
  },
  twitter: {
    card: "summary_large_image",
    title: "Founders Helm",
    description:
      "Your entire business. One dashboard. 10 integrated tools for founders.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${fraunces.variable} ${figtree.variable}`}
    >
      <head>
        {/*
          NO-JS FALLBACK FOR THE LANDING REVEALS.

          Framer Motion server-renders every `initial` state as an inline style,
          so the reveal sections ship as `opacity:0` (and `clip-path:inset(...)`,
          `filter:blur(...)`, `transform:translate(...)`) and only become visible
          once JS hydrates. A visitor with JS off — or one whose hydration fails —
          sees the hero, the footer, and a page of blank between them.

          This lives in <noscript>, which is the whole point: the browser only
          parses it when scripting is disabled, so it is physically incapable of
          reaching the animated path. Nothing here runs for a normal visitor.

          `!important` is required — these are author rules competing with inline
          styles, which otherwise win. Scoped to `.helm-landing` so the ~40
          dashboard routes are untouched, and `:not([aria-hidden="true"])` keeps
          decorative glows (which are scroll-driven, not reveals) from being
          forced to full strength.
        */}
        <noscript>
          <style>{`.helm-landing [style*="opacity:0"]:not([aria-hidden="true"]){opacity:1!important;transform:none!important;clip-path:none!important;filter:none!important;}`}</style>
        </noscript>
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster richColors closeButton position="bottom-right" />
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
