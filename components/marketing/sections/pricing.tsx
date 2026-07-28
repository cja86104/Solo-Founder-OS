"use client";

import React, { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Check, Infinity as InfinityIcon } from "lucide-react";
import Kicker from "@/components/marketing/kicker";
import Button from "@/components/marketing/button";
import { pricing } from "@/lib/marketing/content";
import { useReducedMotion, ease } from "@/lib/marketing/motion";

export default function Pricing() {
  const [focus, setFocus] = useState<string>("pro");
  const reduced = useReducedMotion();
  const [pro, lifetime] = pricing.plans;

  const plans = [pro, lifetime];

  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="relative overflow-hidden border-t border-white/[0.06] py-20 sm:py-28 lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[30rem] w-[70rem] max-w-[130vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.18),transparent_65%)] blur-3xl"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Kicker>Pricing</Kicker>
            <h2
              id="pricing-heading"
              className="mt-4 font-display text-[clamp(2.4rem,9vw,3.4rem)] leading-[0.9] tracking-[-0.025em] text-[#F5F5F0] sm:text-6xl lg:text-[4.4rem]"
            >
              Two prices.
              <br />
              <span className="italic text-[#f97316]">No sales call.</span>
            </h2>
          </div>

          {/*
            Toggle — the sliding pill is a single absolutely-positioned element
            driven by a CSS transform transition (no layout-projection features
            needed, so the minimal motion bundle stays sufficient). Reduced
            motion is handled globally in app/globals.css.
          */}
          <div
            role="tablist"
            aria-label="Choose a billing shape"
            className="relative flex w-full max-w-xs gap-1 self-end rounded-full border border-white/10 bg-[#0E0E0E] p-1 lg:col-span-5 lg:justify-self-end"
          >
            <span
              aria-hidden="true"
              style={{
                transform: focus === "pro" ? "translateX(0px)" : "translateX(calc(100% + 0.25rem))",
              }}
              className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.375rem)] rounded-full bg-[#f97316] shadow-[0_10px_28px_-14px_rgba(249,115,22,0.9)] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.2,0.9,0.1,1)]"
            />
            {plans.map((plan) => {
              const isOn = focus === plan.id;
              return (
                <button
                  key={plan.id}
                  role="tab"
                  aria-selected={isOn}
                  type="button"
                  onClick={() => setFocus(plan.id)}
                  className="relative flex-1 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-colors duration-300"
                >
                  <span className={isOn ? "text-black" : "text-[#A8A8A8]"}>
                    {plan.id === "pro" ? "Monthly" : "Lifetime"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12 grid gap-5 sm:mt-16 lg:grid-cols-12 lg:items-stretch">
          {plans.map((plan) => {
            const chosen = focus === plan.id;
            return (
              <m.article
                key={plan.id}
                animate={
                  reduced
                    ? {}
                    : {
                        scale: chosen ? 1 : 0.975,
                        y: chosen ? -10 : 6,
                      }
                }
                transition={{ duration: 0.6, ease: ease.out }}
                className={`relative flex flex-col overflow-hidden p-6 sm:p-9 ${
                  chosen
                    ? "z-10 rounded-[34px] border border-[#f97316]/40 bg-gradient-to-b from-[#171717] to-[#0C0C0C] shadow-[0_60px_140px_-60px_rgba(249,115,22,0.6)]"
                    : "rounded-[26px] border border-white/[0.07] bg-[#0C0C0C]"
                } ${plan.id === "pro" ? "lg:col-span-7" : "lg:col-span-5"}`}
              >
                {chosen && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.4),transparent_68%)] blur-2xl"
                  />
                )}

                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#A8A8A8]">{plan.name}</p>
                    <p className="mt-4 flex flex-wrap items-baseline gap-2">
                      <span
                        className={`font-display leading-none tracking-[-0.03em] text-[#F5F5F0] ${
                          chosen ? "text-[clamp(3.4rem,13vw,4.6rem)]" : "text-[clamp(2.8rem,11vw,3.6rem)]"
                        }`}
                      >
                        {plan.price}
                      </span>
                      <span className="font-mono text-[12px] tracking-wide text-[#A8A8A8]">{plan.cadence}</span>
                    </p>
                    <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-[#A8A8A8] sm:text-[15px]">
                      {plan.pitch}
                    </p>
                  </div>
                  <AnimatePresence>
                    {plan.recommended && (
                      <m.span
                        initial={reduced ? false : { opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="shrink-0 rounded-full border border-[#f97316]/40 bg-[#f97316]/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#f97316]"
                      >
                        most taken
                      </m.span>
                    )}
                  </AnimatePresence>
                </div>

                <ul
                  className={`relative mt-8 grid flex-1 content-start gap-y-3 ${
                    plan.id === "pro" ? "sm:grid-cols-2 sm:gap-x-6" : ""
                  }`}
                >
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[14px] leading-snug text-[#F5F5F0]/88 sm:text-[15px]">
                      {f === "Unlimited everything" || f === "Forever" ? (
                        <InfinityIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#f97316]" aria-hidden="true" />
                      ) : (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f97316]" aria-hidden="true" />
                      )}
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="relative mt-9">
                  <Button
                    to="/signup"
                    variant={chosen ? "primary" : "ghost"}
                    size="lg"
                    full
                    arrow={chosen}
                    onMouseEnter={() => setFocus(plan.id)}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </m.article>
            );
          })}
        </div>

        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-[#A8A8A8]">
          <span className="text-[#f97316]">·</span> {pricing.note}
        </p>
      </div>
    </section>
  );
}
