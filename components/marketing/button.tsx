"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const base =
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden text-center font-semibold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f97316] disabled:opacity-50";

const sizes = {
  md: "px-6 py-3.5 text-sm rounded-2xl",
  lg: "px-7 py-4 text-[15px] rounded-[20px]",
  xl: "px-8 py-5 text-base rounded-[24px]",
} as const;

const variants = {
  primary: "bg-[#f97316] text-black hover:-translate-y-0.5 shadow-[0_18px_40px_-18px_rgba(249,115,22,0.75)]",
  cream: "bg-[#F5F5F0] text-[#0A0A0A] hover:-translate-y-0.5",
  ghost: "border border-white/15 text-[#F5F5F0] hover:border-[#f97316]/70 hover:text-[#f97316]",
  bare: "text-[#F5F5F0] underline decoration-[#f97316] decoration-2 underline-offset-[6px] hover:text-[#f97316]",
} as const;

export type ButtonSize = keyof typeof sizes;
export type ButtonVariant = keyof typeof variants;

interface ButtonProps {
  children: React.ReactNode;
  /** Internal route -> next/link */
  to?: string;
  /** External or non-route URL -> plain anchor */
  href?: string;
  onClick?: () => void;
  /** Pricing uses this to move the focused plan on hover. */
  onMouseEnter?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  arrow?: boolean;
  full?: boolean;
  className?: string;
  "aria-label"?: string;
  id?: string;
}

export default function Button({
  children,
  to,
  href,
  onClick,
  onMouseEnter,
  variant = "primary",
  size = "md",
  arrow = false,
  full = false,
  className = "",
  "aria-label": ariaLabel,
  id,
}: ButtonProps) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${full ? "w-full" : ""} ${className}`;

  const inner = (
    <>
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {arrow && (
          <ArrowUpRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        )}
      </span>
      {variant === "primary" && (
        <span className="absolute inset-0 z-0 bg-gradient-to-r from-[#ffb26b] via-[#f97316] to-[#c2410c] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}
      {variant === "cream" && (
        <span className="absolute inset-0 z-0 translate-y-full bg-[#f97316] transition-transform duration-300 group-hover:translate-y-0" />
      )}
    </>
  );

  if (to) {
    return (
      <Link href={to} className={cls} onMouseEnter={onMouseEnter} aria-label={ariaLabel} id={id}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} onMouseEnter={onMouseEnter} aria-label={ariaLabel} id={id}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} onMouseEnter={onMouseEnter} className={cls} aria-label={ariaLabel} id={id}>
      {inner}
    </button>
  );
}
