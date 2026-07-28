"use client";

import React, { useRef } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import Button from "@/components/marketing/button";
import TrustRow from "@/components/marketing/trust-row";
import Photo from "@/components/marketing/photo";
import { brand, photos } from "@/lib/marketing/content";
import { useReducedMotion, ease, scrollToId } from "@/lib/marketing/motion";

export default function ClosingCta() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const glow = useTransform(scrollYProgress, [0, 1], [0.25, 1]);
  const lift = useTransform(scrollYProgress, [0, 1], [60, 0]);

  return (
    <section
      id="closing"
      ref={ref}
      aria-labelledby="closing-heading"
      className="helm-grain relative isolate overflow-hidden border-t border-white/[0.06] py-24 sm:py-32 lg:py-44"
    >
      <Photo photo={photos.closing} slot={5} className="pointer-events-none absolute inset-0 z-0 opacity-40" />
      <m.div
        aria-hidden="true"
        style={reduced ? undefined : { opacity: glow }}
        className="pointer-events-none absolute -bottom-40 left-1/2 z-[4] h-[42rem] w-[42rem] max-w-[150vw] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.75),rgba(194,65,12,0.28)_45%,transparent_72%)] blur-[110px] sm:h-[56rem] sm:w-[56rem]"
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 z-[5] h-px bg-gradient-to-r from-transparent via-[#f97316] to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <m.div style={reduced ? undefined : { y: lift }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#f97316] sm:text-[11px]">
            One dashboard. Ten products. $29.
          </p>
          <h2
            id="closing-heading"
            className="mt-6 max-w-[18ch] font-display text-[clamp(3rem,15vw,5rem)] leading-[0.82] tracking-[-0.035em] text-[#F5F5F0] sm:mt-8 md:text-[clamp(4.5rem,10vw,8rem)] xl:text-[9rem]"
          >
            Close the{" "}
            <span className="italic text-[#A8A8A8]">other</span>{" "}
            <span className="bg-gradient-to-r from-[#ffc48a] via-[#f97316] to-[#c2410c] bg-clip-text text-transparent">
              nine tabs.
            </span>
          </h2>

          <div className="mt-10 grid gap-8 sm:mt-14 lg:grid-cols-12 lg:items-end">
            <p className="max-w-md text-[15px] leading-[1.7] text-[#F5F5F0]/70 sm:text-[17px] lg:col-span-5">
              {brand.tagline} Start on the trial, move your contacts across in an hour, and decide with your own data in
              front of you.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:col-span-7 lg:justify-end">
              <Button to="/signup" variant="cream" size="xl" arrow className="w-full sm:w-auto">
                Start free trial
              </Button>
              <Button onClick={() => scrollToId("pricing")} variant="ghost" size="xl" className="w-full sm:w-auto">
                View pricing
              </Button>
            </div>
          </div>

          <div className="mt-10 border-t border-white/[0.12] pt-6">
            <TrustRow tone="bright" />
          </div>
        </m.div>
      </div>

      <m.p
        initial={reduced ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: ease.out }}
        className="relative z-10 mx-auto mt-16 w-full max-w-[1600px] px-5 font-mono text-[10px] uppercase tracking-[0.28em] text-[#F5F5F0]/45 sm:px-8 lg:px-12"
      >
        14-day trial · no card · export everything if you leave
      </m.p>
    </section>
  );
}
