"use client";

import React, { useState } from "react";
import { m } from "framer-motion";
import {
  Gauge,
  Users,
  ListChecks,
  PenLine,
  LayoutTemplate,
  ReceiptText,
  MessageSquareDot,
  Braces,
  Workflow,
  Sparkle,
  Plus,
  type LucideIcon,
} from "lucide-react";
import Kicker from "@/components/marketing/kicker";
import Reveal from "@/components/marketing/reveal";
import Photo from "@/components/marketing/photo";
import { products, platformExtras, photos, type ProductIconName } from "@/lib/marketing/content";
import { useReducedMotion, ease } from "@/lib/marketing/motion";

/** Keyed by ProductIconName, so a new product icon fails the build until mapped. */
const iconMap: Record<ProductIconName, LucideIcon> = {
  Gauge,
  Users,
  ListChecks,
  PenLine,
  LayoutTemplate,
  ReceiptText,
  MessageSquareDot,
  Braces,
  Workflow,
  Sparkle,
};

/** Varied spans keep this a bento, not a uniform icon grid. */
const spans: string[] = [
  "sm:col-span-2 lg:col-span-4 lg:row-span-2",
  "sm:col-span-2 lg:col-span-3",
  "sm:col-span-1 lg:col-span-2",
  "sm:col-span-1 lg:col-span-3",
  "sm:col-span-2 lg:col-span-3",
  "sm:col-span-1 lg:col-span-2",
  "sm:col-span-1 lg:col-span-2",
  "sm:col-span-1 lg:col-span-3",
  "sm:col-span-1 lg:col-span-3",
  "sm:col-span-2 lg:col-span-4",
];

export default function ProductIndex() {
  const [active, setActive] = useState<string | null>(null);
  const reduced = useReducedMotion();

  return (
    <section aria-labelledby="index-heading" className="relative overflow-hidden py-20 sm:py-28 lg:py-32">
      {/* ----------------------------------------------------------------
          Section photograph — full-bleed backdrop, decorative only (alt="").
          The cards are opaque, so the photo reads through the gutters and
          behind the heading; the scrims below keep contrast on the copy and
          fade both edges into #0A0A0A so it doesn't cut against the
          neighbouring sections.
          ---------------------------------------------------------------- */}
      <Photo
        photo={photos.handsTyping}
        slot={3}
        alt=""
        className="absolute inset-0 z-0"
        imgClassName="object-[50%_38%]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-[#0A0A0A]/70" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-56 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-56 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <Kicker>The full ten</Kicker>
            <h2
              id="index-heading"
              className="mt-4 font-display text-[clamp(2.2rem,8vw,3rem)] leading-[0.92] tracking-[-0.02em] text-[#F5F5F0] sm:text-5xl lg:text-6xl"
            >
              Everything else you were<br />
              <span className="italic text-[#f97316]">also</span> paying for.
            </h2>
          </div>
          <p className="text-[14px] leading-relaxed text-[#A8A8A8] sm:text-[15px] lg:col-span-4 lg:col-start-9 lg:text-right">
            Tap a product for the full description. All ten are on both plans — there is no “available on
            Enterprise.”
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-9 lg:auto-rows-[minmax(8rem,auto)]">
          {products.map((p, i) => {
            const Icon = iconMap[p.icon];
            const isOpen = active === p.id;
            const isFeature = i === 0 || i === 9;
            return (
              <m.li
                key={p.id}
                initial={reduced ? false : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: (i % 5) * 0.05, ease: ease.snap }}
                className={spans[i]}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setActive(isOpen ? null : p.id)}
                  className={`flex h-full w-full flex-col gap-4 rounded-[24px] border p-5 text-left transition-all duration-500 sm:p-6 ${
                    isOpen
                      ? "border-[#f97316]/45 bg-[#141414]"
                      : "border-white/[0.07] bg-[#0E0E0E] hover:border-white/[0.16] hover:bg-[#121212]"
                  }`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <Icon
                      className={`h-5 w-5 shrink-0 transition-colors duration-300 ${
                        isOpen ? "text-[#f97316]" : "text-[#A8A8A8]"
                      }`}
                      aria-hidden="true"
                    />
                    <Plus
                      className={`h-4 w-4 shrink-0 transition-transform duration-500 ${
                        isOpen ? "rotate-45 text-[#f97316]" : "text-[#3f3f3f]"
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="block">
                    <span
                      className={`block font-display tracking-tight text-[#f97316] ${
                        isFeature ? "text-[26px] sm:text-[34px]" : "text-[20px] sm:text-[23px]"
                      } leading-[1.02]`}
                    >
                      {p.name}
                    </span>
                    {/* Always legible at rest — clamped, not hidden. Tapping lifts the clamp
                        rather than revealing content that was invisible a moment ago. */}
                    <span
                      className={`mt-2 text-[13.5px] leading-relaxed transition-colors duration-500 ${
                        isOpen
                          ? "line-clamp-none text-[#F5F5F0]/75"
                          : `text-[#A8A8A8] ${isFeature ? "line-clamp-3" : "line-clamp-2"}`
                      }`}
                    >
                      {p.blurb}
                    </span>
                  </span>
                </button>
              </m.li>
            );
          })}
        </ul>

        <Reveal kind="mask" duration={0.9} curve={ease.inOut} className="mt-4">
          <div className="rounded-[24px] border border-white/[0.07] bg-[#0C0C0C] p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#f97316]">Also included, quietly</p>
            <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {platformExtras.map((extra) => (
                <li key={extra} className="flex gap-3 text-[13.5px] leading-snug text-[#A8A8A8]">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#f97316]" />
                  {extra}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
