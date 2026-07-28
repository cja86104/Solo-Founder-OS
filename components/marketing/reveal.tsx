"use client";

import React, { useEffect, useRef, useState } from "react";
import { m, useInView, type Easing, type Variants } from "framer-motion";
import { useReducedMotion, ease } from "@/lib/marketing/motion";

export type RevealKind = "up" | "slideLeft" | "slideRight" | "mask" | "scale" | "blur";

/**
 * Intentionally varied reveal techniques so the page never reads as one
 * fade-up template repeated. `kind` picks the technique.
 * Uses the minimal `m` primitives (see LazyMotion in LandingShell).
 */
const variants: Record<RevealKind, Variants> = {
  up: { hidden: { opacity: 0, y: 34 }, show: { opacity: 1, y: 0 } },
  slideLeft: { hidden: { opacity: 0, x: 52 }, show: { opacity: 1, x: 0 } },
  slideRight: { hidden: { opacity: 0, x: -52 }, show: { opacity: 1, x: 0 } },
  mask: { hidden: { opacity: 0, clipPath: "inset(0 0 100% 0)" }, show: { opacity: 1, clipPath: "inset(0 0 0% 0)" } },
  scale: { hidden: { opacity: 0, scale: 0.94 }, show: { opacity: 1, scale: 1 } },
  blur: { hidden: { opacity: 0, filter: "blur(14px)", y: 16 }, show: { opacity: 1, filter: "blur(0px)", y: 0 } },
};

interface RevealProps {
  children: React.ReactNode;
  kind?: RevealKind;
  delay?: number;
  duration?: number;
  curve?: Easing;
  amount?: number;
  className?: string;
}

export default function Reveal({
  children,
  kind = "up",
  delay = 0,
  duration = 0.7,
  curve = ease.out,
  amount = 0.35,
  className = "",
}: RevealProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount });
  const [scrolledPast, setScrolledPast] = useState(false);

  /**
   * SAFETY — why this is not a plain `whileInView`.
   *
   * A `once` reveal only ever fires on an intersection. If the element is
   * already ABOVE the viewport when it mounts, IntersectionObserver never
   * reports it entering, so the reveal stays at its hidden state — opacity 0 /
   * clipPath inset(0 0 100% 0) — permanently. The content sits in the DOM and
   * in view-source but is never painted.
   *
   * That is not theoretical: it took out the 01 - Command Center copy on the
   * live site after a mid-session prefers-reduced-motion change remounted the
   * element below the fold.
   *
   * So: if the element is already past the top of the viewport at mount, show
   * it immediately. The animation itself is untouched — same variants, same
   * durations, same easing, still once-only.
   */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.getBoundingClientRect().bottom < 0) setScrolledPast(true);
  }, []);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView || scrolledPast ? "show" : "hidden"}
      variants={variants[kind]}
      transition={{ duration, delay, ease: curve }}
    >
      {children}
    </m.div>
  );
}
