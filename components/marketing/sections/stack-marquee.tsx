"use client";

import React from "react";
import { m } from "framer-motion";
import { Check } from "lucide-react";
import Marquee from "@/components/marketing/marquee";
import Kicker from "@/components/marketing/kicker";
import Reveal from "@/components/marketing/reveal";
import Logo from "@/components/marketing/logo";
import { replacedTools } from "@/lib/marketing/content";
import { useReducedMotion, ease } from "@/lib/marketing/motion";

interface StruckToolProps {
  label: string;
}

function StruckTool({ label }: StruckToolProps) {
  return (
    <span className="group relative mx-4 inline-flex items-center whitespace-nowrap font-display text-[8vw] leading-none tracking-tight text-[#F5F5F0]/25 transition-colors duration-500 hover:text-[#F5F5F0]/45 sm:mx-7 sm:text-[4.4rem] lg:text-[5.6rem]">
      {label}
      <span
        aria-hidden="true"
        className="absolute left-[-4%] right-[-4%] top-1/2 h-[2px] -rotate-2 bg-[#f97316]/70"
      />
    </span>
  );
}

export default function StackMarquee() {
  const reduced = useReducedMotion();

  return (
    <section id="stack" aria-labelledby="stack-heading" className="helm-grain relative overflow-hidden border-y border-white/[0.06] bg-[#0C0C0C] py-16 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.16),transparent_70%)] blur-3xl"
      />

      <div className="relative z-10 mx-auto mb-10 w-full max-w-[1600px] px-5 sm:mb-14 sm:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Kicker>Replace your stack</Kicker>
            <h2
              id="stack-heading"
              className="mt-4 max-w-2xl font-display text-[clamp(2.2rem,8vw,3rem)] leading-[0.94] tracking-tight text-[#F5F5F0] sm:text-5xl lg:text-6xl"
            >
              Cancel the other nine.{" "}
              <span className="italic text-[#A8A8A8]">Keep the work.</span>
            </h2>
          </div>
          <p className="max-w-sm text-[14px] leading-relaxed text-[#A8A8A8] sm:text-[15px] lg:col-span-5 lg:justify-self-end lg:text-right">
            $200–500 a month, across disconnected subscriptions that never talk to each other. One price replaces the
            lot.
          </p>
        </div>
      </div>

      <div className="relative z-10">
        <Marquee
          items={replacedTools}
          duration={reduced ? 0 : 44}
          ariaLabel={`Tools Founders Helm replaces: ${replacedTools.join(", ")}`}
          renderItem={(tool) => <StruckTool label={tool} />}
        />

        <div className="relative mx-auto mt-10 w-full max-w-[1600px] px-5 sm:mt-14 sm:px-8 lg:px-12">
          <Reveal kind="scale" duration={0.8} curve={ease.snap}>
            <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-[#f97316]/25 bg-[#0F0F0F] p-6 shadow-[0_40px_120px_-60px_rgba(249,115,22,0.55)] sm:p-9">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.35),transparent_68%)] blur-2xl"
              />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Logo />
                  <p className="mt-4 max-w-sm font-display text-2xl leading-tight text-[#F5F5F0] sm:text-3xl">
                    One dashboard, and it already knows about the other work.
                  </p>
                </div>
                <m.ul
                  initial={reduced ? false : "hidden"}
                  whileInView="show"
                  viewport={{ once: true, amount: 0.5 }}
                  variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
                  className="shrink-0 space-y-2"
                >
                  {["10 products", "1 login", "1 invoice", "$29/mo"].map((item) => (
                    <m.li
                      key={item}
                      variants={{ hidden: { opacity: 0, x: 14 }, show: { opacity: 1, x: 0 } }}
                      transition={{ duration: 0.5, ease: ease.out }}
                      className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#F5F5F0]/85"
                    >
                      <Check className="h-3.5 w-3.5 text-[#f97316]" aria-hidden="true" />
                      {item}
                    </m.li>
                  ))}
                </m.ul>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
