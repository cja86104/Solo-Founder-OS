"use client";

import React from "react";
import { ShieldCheck, Database, FileJson, type LucideIcon } from "lucide-react";
import Kicker from "@/components/marketing/kicker";
import Reveal from "@/components/marketing/reveal";
import Photo from "@/components/marketing/photo";
import { pillars, photos } from "@/lib/marketing/content";
import { ease } from "@/lib/marketing/motion";

interface SpecRow {
  icon: LucideIcon;
  label: string;
  detail: string;
}

const specRows: SpecRow[] = [
  { icon: ShieldCheck, label: "Row-level security", detail: "enforced at the database layer" },
  { icon: FileJson, label: "Clean export", detail: "CSV or JSON, on demand" },
  { icon: Database, label: "Documented stack", detail: "Next.js · Supabase · Stripe · Vercel" },
];

function accented(title: string, accent: string): React.ReactNode {
  const parts = title.split(accent);
  if (parts.length < 2) return title;
  return (
    <>
      {parts[0]}
      <span className="italic text-[#f97316]">{accent}</span>
      {parts[1]}
    </>
  );
}

export default function Pillars() {
  const [p1, p2, p3] = pillars;
  /** Only pillar 01 carries a flow rail, so `flow` is optional on the type. */
  const flow = p1.flow ?? [];

  return (
    <section id="product" aria-labelledby="pillars-heading" className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
      <div className="mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Kicker>Three reasons, no filler</Kicker>
          </div>
          <h2
            id="pillars-heading"
            className="mt-3 font-display text-[clamp(2.4rem,9vw,3.4rem)] leading-[0.9] tracking-[-0.02em] text-[#F5F5F0] sm:text-6xl lg:col-span-7 lg:mt-0 lg:text-[4.6rem]"
          >
            Not another tab.
            <br />
            <span className="pl-[0.6em] text-[#A8A8A8]">The</span>{" "}
            <span className="italic">last</span> one.
          </h2>
        </div>

        {/* asymmetric bento: 12-col grid, uneven spans and heights */}
        <div className="mt-12 grid gap-4 sm:mt-16 sm:gap-5 lg:mt-20 lg:grid-cols-12 lg:grid-rows-[auto_auto]">
          {/* 01 — big text panel with photo bleed */}
          <Reveal
            kind="blur"
            duration={0.85}
            curve={ease.out}
            className="lg:col-span-7 lg:row-span-2"
          >
            <article className="helm-grain group relative flex h-full min-h-[22rem] flex-col justify-between overflow-hidden rounded-[30px] border border-white/[0.07] bg-[#101010] p-6 sm:min-h-[26rem] sm:p-9 lg:min-h-full">
              <Photo
                photo={photos.windowNight}
                slot={2}
                className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[46%] opacity-70 sm:block"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-[#101010] via-[#101010]/85 to-transparent"
              />
              <div className="relative z-[4]">
                <span className="font-mono text-[11px] tracking-[0.3em] text-[#f97316]">{p1.index}</span>
                <h3 className="mt-6 max-w-md font-display text-[clamp(2rem,7.5vw,2.6rem)] leading-[0.95] tracking-tight text-[#F5F5F0] sm:text-5xl">
                  {accented(p1.title, p1.accent)}
                </h3>

                {/* the claim, shown working: one event moving through four products */}
                <ol className="mt-8 max-w-sm sm:mt-9" aria-label="One deal closing, as it moves through Founders Helm">
                  {flow.map((step, i) => (
                    <li key={step.label} className="flex gap-4 pb-5 last:pb-0">
                      <span aria-hidden="true" className="relative flex w-2 shrink-0 justify-center">
                        <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-[#f97316] ring-4 ring-[#f97316]/[0.14]" />
                        {i < flow.length - 1 && (
                          <span className="absolute left-1/2 top-[19px] bottom-[-13px] w-px -translate-x-1/2 bg-gradient-to-b from-[#f97316]/40 to-white/[0.07]" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[#F5F5F0]/85">
                          {step.label}
                        </span>
                        <span className="mt-1.5 block text-[13px] leading-snug text-[#6f6f6f]">{step.detail}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="relative z-[4] mt-10">
                <p className="max-w-sm text-[15px] leading-relaxed text-[#A8A8A8] sm:text-base">{p1.body}</p>
                <p className="mt-6 inline-flex rounded-full border border-white/10 bg-[#0A0A0A]/70 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#F5F5F0]/80">
                  {p1.proof}
                </p>
              </div>
            </article>
          </Reveal>

          {/* 02 — chat-detail panel */}
          <Reveal kind="slideLeft" duration={0.75} delay={0.08} curve={ease.snap} className="lg:col-span-5">
            <article className="relative h-full overflow-hidden rounded-[30px] border border-white/[0.07] bg-gradient-to-b from-[#141414] to-[#0C0C0C] p-6 sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.3),transparent_70%)] blur-2xl"
              />
              <span className="relative font-mono text-[11px] tracking-[0.3em] text-[#f97316]">{p2.index}</span>
              <h3 className="relative mt-4 font-display text-[clamp(1.8rem,6.6vw,2.2rem)] leading-[1] tracking-tight text-[#F5F5F0] sm:text-4xl">
                {accented(p2.title, p2.accent)}
              </h3>
              <p className="relative mt-4 text-[14px] leading-relaxed text-[#A8A8A8] sm:text-[15px]">{p2.body}</p>
              <div className="relative mt-6 rounded-2xl border border-white/[0.08] bg-[#0A0A0A] p-3.5">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#5f5f5f]">context loaded</p>
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {p2.proof.split(" · ").map((chip) => (
                    <li
                      key={chip}
                      className="rounded-md border border-[#f97316]/25 bg-[#f97316]/[0.07] px-2 py-1 font-mono text-[9px] text-[#f97316]"
                    >
                      {chip}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 border-t border-white/[0.06] pt-2.5 text-[13px] leading-snug text-[#F5F5F0]/85">
                  “Your biggest deal hasn’t had contact in 12 days.”
                </p>
              </div>
            </article>
          </Reveal>

          {/* 03 — spec panel */}
          <Reveal kind="up" duration={0.8} delay={0.14} curve={ease.soft} className="lg:col-span-5">
            <article className="relative flex h-full flex-col justify-between overflow-hidden rounded-[30px] border border-white/[0.07] bg-[#0E0E0E] p-6 sm:p-8">
              <div>
                <span className="font-mono text-[11px] tracking-[0.3em] text-[#f97316]">{p3.index}</span>
                <h3 className="mt-4 font-display text-[clamp(1.8rem,6.6vw,2.2rem)] leading-[1] tracking-tight text-[#F5F5F0] sm:text-4xl">
                  {accented(p3.title, p3.accent)}
                </h3>
                <p className="mt-4 text-[14px] leading-relaxed text-[#A8A8A8] sm:text-[15px]">{p3.body}</p>
              </div>
              <ul className="mt-7 divide-y divide-white/[0.07] border-t border-white/[0.07]">
                {specRows.map((row) => (
                  <li key={row.label} className="flex items-start gap-3 py-3">
                    <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#f97316]" aria-hidden="true" />
                    <span className="text-[13px] text-[#F5F5F0]/90">
                      {row.label}
                      <span className="block font-mono text-[10px] text-[#6f6f6f]">{row.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
