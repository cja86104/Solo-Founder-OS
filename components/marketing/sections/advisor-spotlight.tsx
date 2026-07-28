"use client";

import React from "react";
import { m } from "framer-motion";
import { CornerDownLeft, Lock } from "lucide-react";
import Kicker from "@/components/marketing/kicker";
import Photo from "@/components/marketing/photo";
import { advisorChat, photos } from "@/lib/marketing/content";
import { useReducedMotion, ease } from "@/lib/marketing/motion";

export default function AdvisorSpotlight() {
  const reduced = useReducedMotion();

  return (
    <section
      id="advisor"
      aria-labelledby="advisor-heading"
      className="helm-grain relative overflow-hidden border-y border-white/[0.06] bg-[#0C0C0C] py-20 sm:py-28 lg:py-36"
    >
      <Photo
        photo={photos.quietOffice}
        slot={4}
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.28]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[4] bg-[radial-gradient(120%_90%_at_80%_0%,rgba(249,115,22,0.22),transparent_60%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4 lg:pt-6">
            <Kicker>04 — AI Advisor</Kicker>
            <h2
              id="advisor-heading"
              className="mt-5 font-display text-[clamp(2.4rem,9.5vw,3.4rem)] leading-[0.88] tracking-[-0.025em] text-[#F5F5F0] sm:text-6xl"
            >
              It has read
              <br />
              <span className="italic text-[#f97316]">your numbers.</span>
            </h2>
            <p className="mt-6 max-w-sm text-[15px] leading-[1.7] text-[#A8A8A8] sm:text-base">
              Every other chatbot guesses. This one has read access to your pipeline, revenue trends, task history and
              content performance — so it answers about your business, with the dates and dollar figures attached.
            </p>
            <p className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0A0A0A]/70 px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A8A8A8]">
              <Lock className="h-3 w-3 text-[#f97316]" aria-hidden="true" />
              {advisorChat.footnote}
            </p>
          </div>

          {/* the one deliberate glassmorphism moment on the page */}
          <div className="lg:col-span-8 lg:col-start-5">
            <m.div
              initial={reduced ? false : { opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.9, ease: ease.out }}
              className="overflow-hidden rounded-[30px] border border-white/[0.12] bg-white/[0.045] shadow-[0_50px_130px_-60px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.09] px-4 py-3 sm:px-6">
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#A8A8A8] sm:text-[10px]">
                  {advisorChat.workspace}
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {advisorChat.context.map((c) => (
                    <li
                      key={c}
                      className="rounded-md border border-[#f97316]/25 bg-[#f97316]/[0.08] px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#f97316] sm:text-[9px]"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-5 px-4 py-6 sm:px-7 sm:py-8">
                <div className="flex justify-end">
                  <p className="max-w-[85%] rounded-[20px] rounded-br-[6px] bg-[#F5F5F0] px-4 py-3 text-[14px] font-medium leading-snug text-[#0A0A0A] sm:text-[15px]">
                    {advisorChat.question}
                  </p>
                </div>

                <div className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1 h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-[#f97316] to-[#7c2d12]"
                  />
                  <div className="min-w-0 flex-1 space-y-3">
                    {advisorChat.answer.map((para, i) => (
                      <m.p
                        key={i}
                        initial={reduced ? false : { opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.6 }}
                        transition={{ duration: 0.55, delay: 0.25 + i * 0.18, ease: ease.soft }}
                        className="rounded-[20px] rounded-tl-[6px] border border-white/[0.08] bg-[#0F0F0F]/85 px-4 py-3 text-[13.5px] leading-[1.65] text-[#F5F5F0]/90 sm:text-[15px]"
                      >
                        {para}
                      </m.p>
                    ))}
                    <m.ul
                      initial={reduced ? false : { opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                      className="flex flex-wrap gap-2 pt-1"
                    >
                      {advisorChat.actions.map((a) => (
                        <li key={a}>
                          <button
                            type="button"
                            className="rounded-full border border-white/15 px-3.5 py-2 text-[12px] text-[#F5F5F0]/85 transition-colors duration-300 hover:border-[#f97316] hover:text-[#f97316]"
                          >
                            {a}
                          </button>
                        </li>
                      ))}
                    </m.ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-white/[0.09] px-4 py-3.5 sm:px-6">
                <p className="flex-1 truncate font-mono text-[11px] text-[#6f6f6f]">
                  Ask about churn, tasks, content…<span className="helm-caret ml-0.5 align-middle">&nbsp;</span>
                </p>
                <span
                  aria-hidden="true"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#f97316] text-black"
                >
                  <CornerDownLeft className="h-4 w-4" />
                </span>
              </div>
            </m.div>
          </div>
        </div>
      </div>
    </section>
  );
}
