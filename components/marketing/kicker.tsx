import React from "react";

interface KickerProps {
  children: React.ReactNode;
  className?: string;
}

export default function Kicker({ children, className = "" }: KickerProps) {
  return (
    <p className={`flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.34em] text-[#f97316] sm:text-[11px] ${className}`}>
      <span aria-hidden="true" className="inline-block h-px w-8 bg-[#f97316]/60" />
      {children}
    </p>
  );
}
