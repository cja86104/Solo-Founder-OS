"use client";

import { useEffect, useState } from "react";
import type { Easing } from "framer-motion";

/** Detects the user's reduced-motion preference, live. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/** Easing curves used across the page, deliberately different per section. */
export const ease = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
  snap: [0.2, 0.9, 0.1, 1],
  soft: [0.33, 1, 0.68, 1],
} satisfies Record<string, Easing>;

function prefersReduced(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

interface ScrollToIdOptions {
  retries?: number;
  interval?: number;
}

/**
 * Smooth-scrolls to an in-page anchor without relying on router hash jumps.
 * Polls briefly (~1.5s) for the target before giving up silently, rather than
 * jumping the page. (In the Vite build this covered code-split sections that
 * had not mounted yet; it is kept here because it also covers a click that
 * lands before hydration finishes.)
 */
export function scrollToId(id: string, options: ScrollToIdOptions = {}): void {
  const { retries = 24, interval = 60 } = options;
  if (typeof document === "undefined") return;
  const target = String(id).replace("#", "");
  const behavior: ScrollBehavior = prefersReduced() ? "auto" : "smooth";
  let attempts = 0;

  const attempt = () => {
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior, block: "start" });
      return;
    }
    if (attempts < retries) {
      attempts += 1;
      window.setTimeout(() => window.requestAnimationFrame(attempt), interval);
    }
  };

  attempt();
}
