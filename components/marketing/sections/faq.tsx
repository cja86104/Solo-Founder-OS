"use client";

import React from "react";
import Kicker from "@/components/marketing/kicker";
import Accordion from "@/components/marketing/accordion";
import Reveal from "@/components/marketing/reveal";
import Button from "@/components/marketing/button";
import { faqs } from "@/lib/marketing/content";
import { ease, scrollToId } from "@/lib/marketing/motion";

export default function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="relative border-t border-white/[0.06] bg-[#0C0C0C] py-20 sm:py-28 lg:py-32">
      <div className="mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <Kicker>FAQ</Kicker>
            <h2
              id="faq-heading"
              className="mt-4 font-display text-[clamp(2.2rem,8.4vw,3rem)] leading-[0.9] tracking-[-0.025em] text-[#F5F5F0] sm:text-5xl"
            >
              The six things
              <br />
              <span className="italic text-[#f97316]">people ask.</span>
            </h2>
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-[#A8A8A8] sm:text-[15px]">
              Anything else, email us. There is no discovery call and no “solutions consultant.”
            </p>
            <Reveal kind="up" delay={0.1} duration={0.6} curve={ease.soft} className="mt-8">
              <Button onClick={() => scrollToId("closing")} variant="bare" size="md" className="px-0">
                Skip to the part where you sign up
              </Button>
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            <Accordion items={faqs} />
          </div>
        </div>
      </div>
    </section>
  );
}
