"use client";

import React from "react";
import { m, type Easing, type Variants } from "framer-motion";
import { useReducedMotion, ease } from "@/lib/marketing/motion";

export type RevealKind = "up" | "slideLeft" | "slideRight" | "mask" | "scale" | "blur";
export type RevealTag = "div" | "section" | "article" | "ul" | "li" | "p" | "span";

/**
 * Intentionally varied reveal techniques so the page never reads as one
 * fade-up template repeated. `kind` picks the technique.
 * Uses the minimal `m` primitives (see LazyMotion in the page shell).
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
  as?: RevealTag;
  className?: string;
}

export default function Reveal({
  children,
  kind = "up",
  delay = 0,
  duration = 0.7,
  curve = ease.out,
  amount = 0.35,
  as = "div",
  className = "",
}: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    const Tag: React.ElementType = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = m[as];

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={variants[kind]}
      transition={{ duration, delay, ease: curve }}
    >
      {children}
    </MotionTag>
  );
}
