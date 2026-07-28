"use client";

import React, { useRef } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Reveal, { type RevealKind } from "@/components/marketing/reveal";
import BrowserFrame from "@/components/marketing/browser-frame";
import DashboardMock from "@/components/marketing/mock/dashboard-mock";
import CrmMock from "@/components/marketing/mock/crm-mock";
import BuilderMock from "@/components/marketing/mock/builder-mock";
import { deepDives, type DeepDive } from "@/lib/marketing/content";
import { useReducedMotion, ease } from "@/lib/marketing/motion";

interface MockEntry {
  node: React.ReactNode;
  url: string;
}

const mocks: Record<string, MockEntry> = {
  "command-center": { node: <DashboardMock />, url: "app.foundershelm.com/command-center" },
  crm: { node: <CrmMock />, url: "app.foundershelm.com/crm/pipeline" },
  "landing-pages": { node: <BuilderMock />, url: "app.foundershelm.com/pages/launch/edit" },
};

interface VisualProps {
  item: DeepDive;
  index: number;
}

function Visual({ item, index }: VisualProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end 20%"] });
  // Per-dive drift and tilt — not an index % 2 flip, which would just be the
  // same alternation expressed in motion instead of layout.
  const drift = [[96, -72], [58, -116], [118, -44]][index % 3];
  const tilt = [[9, -4], [-6.5, 3.5], [3.6, -9]][index % 3];
  const y = useTransform(scrollYProgress, [0, 1], drift);
  const rotate = useTransform(scrollYProgress, [0, 1], tilt);

  const mock = mocks[item.id];

  return (
    <div ref={ref} className="relative">
      <m.div style={reduced ? undefined : { y, rotate }} className="relative z-10">
        <BrowserFrame url={mock.url}>{mock.node}</BrowserFrame>
      </m.div>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -z-0 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.4),transparent_70%)] blur-3xl ${
          ["-bottom-10 -right-6 h-40 w-40", "-bottom-16 -left-10 h-56 w-56", "-top-12 -right-10 h-32 w-32"][index % 3]
        }`}
      />
    </div>
  );
}

interface DeepDiveLayout {
  gap: string;
  row: string;
  copy: string;
  visual: string;
}

/**
 * One bespoke layout per dive — deliberately NO shared template.
 * Side, column spans, edge bleed, vertical offset, row alignment and the gap
 * above each row all differ, so this can never resolve into the alternating
 * text/image feature strip every generated landing page ships with.
 * Horizontal bleed is contained by `overflow-x: hidden` on the landing root
 * (see app/globals.css, `body:has(.helm-landing)`).
 */
const layouts: DeepDiveLayout[] = [
  {
    // 01 — narrow copy pinned to the baseline, mock oversized and running off
    // the right edge of the page.
    gap: "",
    row: "lg:items-end",
    copy: "lg:col-span-4 lg:col-start-1 lg:row-start-1 lg:pb-12",
    visual: "lg:col-span-8 lg:col-start-5 lg:row-start-1 lg:w-[116%]",
  },
  {
    // 02 — flipped and heavier: mock bleeds off the LEFT edge, copy sits far
    // right and drops well below the top of the mock.
    gap: "mt-24 sm:mt-32 lg:mt-56",
    row: "lg:items-start",
    copy: "lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:mt-36",
    visual: "lg:col-span-8 lg:col-start-1 lg:row-start-1 lg:-ml-[14%] lg:w-[114%]",
  },
  {
    // 03 — no bleed at all. Small mock held high right, copy dropped low left,
    // the empty diagonal between them left deliberately open.
    gap: "mt-24 sm:mt-36 lg:mt-28",
    row: "lg:items-start",
    copy: "lg:col-span-5 lg:col-start-2 lg:row-start-1 lg:mt-48",
    visual: "lg:col-span-5 lg:col-start-8 lg:row-start-1",
  },
];

export default function DeepDives() {
  const revealFor: Record<DeepDive["reveal"], RevealKind> = {
    scrub: "mask",
    slide: "slideRight",
    mask: "blur",
  };

  return (
    <section aria-label="Inside the platform" className="relative border-t border-white/[0.06] py-20 sm:py-28 lg:py-32">
      <div className="mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <div>
          {deepDives.map((item, index) => {
            const layout = layouts[index % layouts.length];
            return (
              <article
                key={item.id}
                id={item.id}
                className={`grid gap-10 lg:grid-cols-12 lg:gap-12 ${layout.row} ${layout.gap}`}
              >
                <div className={layout.copy}>
                  <Reveal kind={revealFor[item.reveal]} duration={1.15} amount={0.25} curve={ease.out}>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#f97316]">{item.kicker}</p>
                    <h3 className="mt-4 font-display text-[clamp(2rem,7.4vw,2.6rem)] leading-[0.96] tracking-[-0.02em] text-[#F5F5F0] sm:text-5xl">
                      {item.title}{" "}
                      <span className="italic text-[#A8A8A8]">{item.titleAccent}</span>
                    </h3>
                    <p className="mt-5 max-w-md text-[15px] leading-[1.7] text-[#A8A8A8] sm:text-[16px]">{item.body}</p>
                    <ul className="mt-7 space-y-2.5">
                      {item.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-3 text-[14px] text-[#F5F5F0]/85 sm:text-[15px]">
                          <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[#f97316]" aria-hidden="true" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                </div>

                <div className={layout.visual}>
                  <Visual item={item} index={index} />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
