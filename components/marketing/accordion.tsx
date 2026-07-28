"use client";

import React, { useId, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useReducedMotion, ease } from "@/lib/marketing/motion";
import type { Faq } from "@/lib/marketing/content";

interface AccordionProps {
  items: Faq[];
}

export default function Accordion({ items }: AccordionProps) {
  const [open, setOpen] = useState(0);
  const reduced = useReducedMotion();
  const baseId = useId();
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowDown") next = index === last ? 0 : index + 1;
    if (event.key === "ArrowUp") next = index === 0 ? last : index - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = last;
    if (next !== null) {
      event.preventDefault();
      btnRefs.current[next]?.focus();
    }
  };

  return (
    <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className={`group relative transition-colors duration-500 ${isOpen ? "bg-white/[0.025]" : "hover:bg-white/[0.015]"}`}
          >
            <span
              aria-hidden="true"
              className={`absolute inset-y-0 left-0 w-[2px] origin-top bg-[#f97316] transition-transform duration-500 ${
                isOpen ? "scale-y-100" : "scale-y-0"
              }`}
            />
            <h3 className="m-0">
              <button
                ref={(el) => {
                  btnRefs.current[i] = el;
                }}
                type="button"
                id={`${baseId}-btn-${i}`}
                aria-expanded={isOpen}
                aria-controls={`${baseId}-panel-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className="flex w-full items-start gap-4 px-4 py-6 text-left sm:gap-8 sm:px-8 sm:py-8"
              >
                <span
                  className={`mt-1 font-mono text-[10px] tabular-nums transition-colors duration-300 sm:text-xs ${
                    isOpen ? "text-[#f97316]" : "text-[#A8A8A8]"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`flex-1 font-display text-[24px] leading-[1.12] tracking-tight transition-colors duration-300 sm:text-[30px] lg:text-[34px] ${
                    isOpen ? "text-[#F5F5F0]" : "text-[#F5F5F0]/80"
                  }`}
                >
                  {item.q}
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-500 ${
                    isOpen
                      ? "rotate-[135deg] border-[#f97316] bg-[#f97316]/15 text-[#f97316]"
                      : "border-white/15 text-[#A8A8A8] group-hover:border-white/35"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <m.div
                  id={`${baseId}-panel-${i}`}
                  role="region"
                  aria-labelledby={`${baseId}-btn-${i}`}
                  initial={reduced ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: reduced ? 0.01 : 0.45, ease: ease.inOut }}
                  className="overflow-hidden"
                >
                  <p className="max-w-3xl px-4 pb-8 pl-[2.2rem] text-[15px] leading-relaxed text-[#A8A8A8] sm:px-8 sm:pb-10 sm:pl-[4.5rem] sm:text-[17px]">
                    {item.a}
                  </p>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
