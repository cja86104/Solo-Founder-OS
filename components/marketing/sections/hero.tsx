"use client";

import React, { useRef } from "react";
import { m, useScroll, useTransform, useSpring } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Button from "@/components/marketing/button";
import TrustRow from "@/components/marketing/trust-row";
import BrowserFrame from "@/components/marketing/browser-frame";
import DashboardMock from "@/components/marketing/mock/dashboard-mock";
import Photo from "@/components/marketing/photo";
import { brand, photos, replacedTools } from "@/lib/marketing/content";
import { useReducedMotion, ease, scrollToId } from "@/lib/marketing/motion";

interface HeadlineWord {
  text: string;
  accent: boolean;
}

/**
 * Signature motion moment (used nowhere else on the page):
 * the headline words unfurl on a 3D X-axis rotation from a shared origin,
 * while the framed dashboard de-skews out of perspective as you scroll.
 */
const words: HeadlineWord[] = [
  { text: "Your", accent: false },
  { text: "entire", accent: false },
  { text: "business.", accent: false },
  { text: "One", accent: false },
  { text: "dashboard.", accent: true },
];

export default function Hero() {
  const reduced = useReducedMotion();
  const shellRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: shellRef, offset: ["start start", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });

  const frameRotate = useTransform(smooth, [0, 1], [8.5, -1.5]);
  const frameY = useTransform(smooth, [0, 1], [0, -70]);
  const frameScale = useTransform(smooth, [0, 1], [1, 1.05]);
  const glowOpacity = useTransform(smooth, [0, 0.7], [0.85, 0.15]);

  return (
    <section ref={shellRef} id="top" className="helm-grain relative overflow-hidden pb-16 pt-28 sm:pb-24 sm:pt-32 lg:pb-32 lg:pt-40">
      {/* ----------------------------------------------------------------
          Section photograph — a full-bleed backdrop for the whole hero,
          not a card. It sits at z-0 beneath every layer; the scrims below
          crush it back into the black so the copy column keeps its
          contrast and the framed product reads as the only lit object.
          ---------------------------------------------------------------- */}
      <Photo
        photo={photos.heroDesk}
        slot={1}
        priority
        className="absolute inset-0 z-0"
        imgClassName="object-[65%_center] lg:object-[72%_center]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#0A0A0A_0%,rgba(10,10,10,0.94)_34%,rgba(10,10,10,0.66)_58%,rgba(10,10,10,0.88)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-64 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent"
      />

      {/* accent glow — a gradient trailing off into black, never a flat fill */}
      <m.div
        aria-hidden="true"
        style={reduced ? undefined : { opacity: glowOpacity }}
        className="pointer-events-none absolute -right-24 -top-32 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.55),transparent_66%)] blur-[90px] sm:h-[52rem] sm:w-[52rem]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f97316]/45 to-transparent"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-8">
          {/* ---------- copy column: offset, not centered ---------- */}
          <div className="lg:col-span-7 lg:pb-6 xl:col-span-6">
            <m.p
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: ease.out }}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.3em] text-[#A8A8A8] sm:text-[11px]"
            >
              <span className="text-[#f97316]">Ten products</span>
              <span aria-hidden="true">/</span>
              <span>one login</span>
              <span aria-hidden="true">/</span>
              <span>one flat price</span>
            </m.p>

            <h1 className="mt-5 font-display text-[clamp(3.1rem,13.5vw,5.6rem)] leading-[0.84] tracking-[-0.03em] text-[#F5F5F0] sm:mt-7 md:text-[clamp(4rem,8.4vw,7.5rem)] xl:text-[8.4rem]">
              <span className="sr-only">{brand.tagline}</span>
              <span aria-hidden="true" className="block" style={{ perspective: "900px" }}>
                {words.map((w, i) => (
                  <m.span
                    key={w.text}
                    initial={reduced ? false : { opacity: 0, rotateX: -78, y: "0.34em" }}
                    animate={{ opacity: 1, rotateX: 0, y: 0 }}
                    transition={{ duration: 1.05, delay: 0.12 + i * 0.11, ease: ease.out }}
                    style={{ transformOrigin: "50% 100%", display: "inline-block" }}
                    className={`mr-[0.22em] ${
                      w.accent
                        ? "bg-gradient-to-tr from-[#c2410c] via-[#f97316] to-[#ffc48a] bg-clip-text italic text-transparent"
                        : i === 3
                          ? "font-normal"
                          : ""
                    }`}
                  >
                    {w.text}
                  </m.span>
                ))}
              </span>
            </h1>

            <m.p
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.72, ease: ease.out }}
              className="mt-7 max-w-xl text-[15px] leading-[1.65] text-[#A8A8A8] sm:mt-8 sm:text-[17px] lg:max-w-lg xl:max-w-xl"
            >
              {brand.subhead}
            </m.p>

            <m.div
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.86, ease: ease.out }}
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <Button to="/signup" variant="primary" size="lg" arrow className="w-full sm:w-auto">
                Start free trial
              </Button>
              <Button onClick={() => scrollToId("pricing")} variant="ghost" size="lg" className="w-full sm:w-auto">
                View pricing
              </Button>
            </m.div>

            <m.div
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 1.02 }}
              className="mt-7"
            >
              <TrustRow />
            </m.div>
          </div>

          {/* ---------- composition column: the tilted frame, floating on the section photo ---------- */}
          <div className="relative lg:col-span-5 lg:-mb-4 xl:col-span-6">
            <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none lg:translate-x-6 xl:translate-x-12">
              <m.div
                style={
                  reduced
                    ? undefined
                    : {
                        rotate: frameRotate,
                        y: frameY,
                        scale: frameScale,
                        transformPerspective: 1200,
                        rotateY: -6,
                      }
                }
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.1, delay: 0.5, ease: ease.out }}
                className="relative z-10 w-full lg:w-[104%]"
              >
                <BrowserFrame url="app.foundershelm.com/command-center">
                  <DashboardMock />
                </BrowserFrame>
              </m.div>

              <div
                aria-hidden="true"
                className="absolute -right-2 top-6 hidden h-[70%] w-px bg-gradient-to-b from-[#f97316] via-[#f97316]/25 to-transparent lg:block"
              />
              <p className="absolute -right-1 top-8 hidden origin-bottom-right translate-x-full rotate-90 font-mono text-[9px] uppercase tracking-[0.3em] text-[#A8A8A8] xl:block">
                live workspace
              </p>
            </div>
          </div>
        </div>

        {/* ticker-lite: the stack it displaces, stated once, low-key */}
        <div className="mt-28 flex flex-col gap-4 border-t border-white/[0.07] pt-6 sm:mt-36 sm:flex-row sm:items-center sm:justify-between lg:mt-44">
          <button
            type="button"
            onClick={() => scrollToId("stack")}
            className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-[#A8A8A8] transition-colors hover:text-[#F5F5F0]"
          >
            What it replaces
            <ChevronDown className="h-3.5 w-3.5 text-[#f97316] transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" />
          </button>
          <p className="max-w-md text-[13px] leading-relaxed text-[#5f5f5f] sm:text-right">
            Currently spread across {replacedTools.length} tabs, {replacedTools.length} invoices and one increasingly
            theoretical grasp of your own numbers.
          </p>
        </div>
      </div>
    </section>
  );
}
