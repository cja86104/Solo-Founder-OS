"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Logo from "@/components/marketing/logo";
import { navLinks } from "@/lib/marketing/content";
import { ease, scrollToId } from "@/lib/marketing/motion";

/** Everything the browser will hand focus to via Tab. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 90);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /**
   * FOCUS TRAP.
   *
   * The open menu covers the page and locks body scroll, so it behaves as a
   * modal — but the sections behind it are still in the tab order, which lets a
   * keyboard user tab straight out of the menu into content they cannot see.
   *
   * Focus is confined to the header (toggle + panel) while open, Escape closes
   * and hands focus back to the toggle that opened it, and the first item is
   * focused on open. Elements hidden at this breakpoint report no offsetParent
   * and are skipped, so the desktop links never enter the mobile cycle.
   */
  useEffect(() => {
    if (!open) return undefined;
    const root = headerRef.current;
    if (!root) return undefined;

    const items = () =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el === toggleRef.current || el.offsetParent !== null
      );

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = items();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = active !== null && root.contains(active);

      if (event.shiftKey) {
        if (!inside || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!inside || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  /** Move focus into the panel as it opens, so the trap starts from inside. */
  const onPanelMount = useCallback((node: HTMLDivElement | null) => {
    node?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, []);

  const go = (href: string) => {
    setOpen(false);
    scrollToId(href);
  };

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/[0.07] bg-[#0A0A0A]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0A0A0A]/60"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-6 px-5 py-4 sm:px-8 lg:px-12">
        <Link href="/" aria-label="Founders Helm — home" className="shrink-0">
          <Logo compact={scrolled} />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => go(link.href)}
              className="group relative rounded-full px-4 py-2 text-[13px] font-medium tracking-wide text-[#A8A8A8] transition-colors duration-300 hover:text-[#F5F5F0]"
            >
              {link.label}
              <span className="absolute inset-x-4 bottom-1.5 h-px origin-left scale-x-0 bg-[#f97316] transition-transform duration-300 group-hover:scale-x-100" />
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-[13px] font-medium text-[#A8A8A8] transition-colors duration-300 hover:text-[#F5F5F0]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="group relative overflow-hidden rounded-full bg-[#F5F5F0] px-5 py-2.5 text-[13px] font-semibold text-[#0A0A0A] transition-transform duration-300 hover:-translate-y-0.5"
          >
            <span className="relative z-10">Start free trial</span>
            <span className="absolute inset-0 -translate-y-full bg-[#f97316] transition-transform duration-300 group-hover:translate-y-0" />
          </Link>
        </div>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 text-[#F5F5F0] md:hidden"
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <m.div
            ref={onPanelMount}
            id="mobile-nav"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease: ease.out }}
            className="relative border-t border-white/[0.07] bg-[#0A0A0A]/97 px-5 pb-8 pt-4 backdrop-blur-xl md:hidden"
          >
            <ul className="divide-y divide-white/[0.06]">
              {navLinks.map((link, i) => (
                <li key={link.href}>
                  <button
                    type="button"
                    onClick={() => go(link.href)}
                    className="flex w-full items-baseline gap-4 py-4 text-left"
                  >
                    <span className="font-mono text-[10px] text-[#f97316]">0{i + 1}</span>
                    <span className="font-display text-3xl text-[#F5F5F0]">{link.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-white/12 px-4 py-3.5 text-center text-sm font-medium text-[#F5F5F0]"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-[#f97316] px-4 py-3.5 text-center text-sm font-semibold text-black"
              >
                Start free trial
              </Link>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
