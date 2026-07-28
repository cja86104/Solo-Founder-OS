"use client";

import React from "react";
import { LazyMotion, domAnimation } from "framer-motion";

/**
 * Client shell for the marketing landing page.
 *
 * Ported from the design source's App.jsx. Two jobs:
 *
 * 1. MOTION PAYLOAD. Every animated component on this page uses the minimal
 *    `m` primitives rather than the full `motion` components, which keeps
 *    Framer Motion's drag / layout-projection features out of the bundle.
 *    `strict` makes that contract enforceable — a stray `motion.div` throws in
 *    development instead of silently re-inflating the payload. Consequence to
 *    know: no `layoutId` / layout animations. The pricing toggle's sliding pill
 *    is a plain CSS transform for exactly this reason.
 *
 * 2. CSS SCOPE. `.helm-landing` is what activates the landing's typography and
 *    page colours without touching the ~40 dashboard routes that share
 *    globals.css. Do not remove it — see the SCOPING CONTRACT in
 *    app/globals.css. It replaces the design source's global `body` rules.
 *
 * The page itself stays a server component so all copy is server-rendered.
 */
export default function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="helm-grain-fixed" aria-hidden="true" />
      <div className="helm-landing relative min-h-screen bg-[#0A0A0A] text-[#F5F5F0] antialiased">
        {children}
      </div>
    </LazyMotion>
  );
}
