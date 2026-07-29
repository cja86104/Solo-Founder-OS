"use client";

import React, { useEffect, useRef, useState } from "react";
import { m, type Easing, type Variants } from "framer-motion";
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
  /** Fraction of the element that must be on screen before it reveals. */
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
  const [shown, setShown] = useState(false);

  /**
   * TRIGGER — geometry, deliberately NOT IntersectionObserver.
   *
   * This used `whileInView` and then `useInView`, and both left the 01 -
   * Command Center copy stuck at its hidden state on the live desktop site:
   * present in the DOM, 856x323, on screen, still at
   * `opacity:0; clip-path:inset(0 0 100% 0)`. The observer simply never
   * reported that one element, while the two rows either side of it - same
   * component, same props - fired normally. A reveal that can end hidden is an
   * SEO and accessibility liability, so the trigger no longer depends on it.
   *
   * Measuring the rect on scroll gives the same timing and cannot silently
   * fail to fire. It also fixes a second latent bug: an element taller than
   * the viewport can never expose `amount` of ITSELF, so an amount-based
   * observer would leave it hidden forever - hence the half-screen ceiling.
   *
   * Once shown, stays shown. Same variants, durations, easing as before.
   */
  useEffect(() => {
    if (shown || reduced) return;
    const el = ref.current;
    if (!el) return;

    const check = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      const needed = Math.min(r.height * amount, vh * 0.5);
      if (visible >= needed) setShown(true);
    };

    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [shown, reduced, amount]);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={shown ? "show" : "hidden"}
      variants={variants[kind]}
      transition={{ duration, delay, ease: curve }}
    >
      {children}
    </m.div>
  );
}
