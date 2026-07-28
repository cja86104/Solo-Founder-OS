import React from "react";

interface LogoProps {
  compact?: boolean;
}

export default function Logo({ compact = false }: LogoProps) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative inline-flex h-8 w-8 items-center justify-center">
        <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true" focusable="false">
          <circle cx="16" cy="16" r="14.5" fill="none" stroke="#F5F5F0" strokeOpacity="0.22" strokeWidth="1" />
          <circle cx="16" cy="16" r="4.4" fill="none" stroke="#f97316" strokeWidth="1.6" />
          <g stroke="#F5F5F0" strokeWidth="1.6" strokeLinecap="round">
            <path d="M16 1.6v6.2M16 24.2v6.2M1.6 16h6.2M24.2 16h6.2" />
          </g>
          <g stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" opacity="0.9">
            <path d="M6.2 6.2l4.4 4.4M25.8 25.8l-4.4-4.4" />
          </g>
        </svg>
      </span>
      <span
        className={`overflow-hidden whitespace-nowrap font-display text-[19px] leading-none tracking-tight text-[#F5F5F0] transition-all duration-500 ${
          compact ? "max-w-[7.5rem] opacity-100 sm:max-w-[9rem]" : "max-w-[9rem]"
        }`}
      >
        Founders<span className="text-[#f97316]">.</span>Helm
      </span>
    </span>
  );
}
