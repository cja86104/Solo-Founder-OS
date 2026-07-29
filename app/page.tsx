import React from "react";
import LandingShell from "@/components/marketing/landing-shell";
import Nav from "@/components/marketing/nav";
import Hero from "@/components/marketing/sections/hero";
import StackMarquee from "@/components/marketing/sections/stack-marquee";
import Pillars from "@/components/marketing/sections/pillars";
import DeepDives from "@/components/marketing/sections/deep-dives";
import AdvisorSpotlight from "@/components/marketing/sections/advisor-spotlight";
import ProductIndex from "@/components/marketing/sections/product-index";
import Pricing from "@/components/marketing/sections/pricing";
import Faq from "@/components/marketing/sections/faq";
import ClosingCta from "@/components/marketing/sections/closing-cta";
import Footer from "@/components/marketing/sections/footer";

/**
 * Founders Helm marketing landing page.
 *
 * Design source: Desktop/FOUNDERS-HELM-REDESIGN (Vite + JSX). That project is a
 * DESIGN SOURCE ONLY — it is never built or deployed. Change the design there
 * first, then mirror it here.
 *
 * This is a server component: every section renders to HTML on the server, so
 * the copy is indexable and readable without JS. The sections are client
 * components (motion, state), mounted inside LandingShell.
 *
 * The design source code-split the six below-fold sections behind React.lazy +
 * Suspense to shrink a single-bundle SPA. That is not carried over: Next already
 * splits per route, and `dynamic(..., { ssr: false })` would put the copy back
 * behind JS — the exact failure this port removed. See useCanReveal in
 * lib/marketing/motion.ts.
 */
export default function HomePage() {
  return (
    <LandingShell>
      {/*
        Instrument Serif 400 is the face behind the hero headline — the largest
        above-fold text on the page — and it is declared in globals.css, so the
        browser only discovers it after the stylesheet parses. React hoists this
        into <head>, restoring the preload the design source's index.html had.

        Deliberately on the page and not in app/layout.tsx: the root layout is
        shared with every dashboard route, none of which render this face.
        crossOrigin is required — font fetches are always CORS-mode, and without
        it the preload is discarded and refetched.
      */}
      <link
        rel="preload"
        href="/fonts/instrument-serif-400.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-[#f97316] focus:px-5 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <StackMarquee />
        <Pillars />
        <DeepDives />
        <AdvisorSpotlight />
        <ProductIndex />
        <Pricing />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </LandingShell>
  );
}
