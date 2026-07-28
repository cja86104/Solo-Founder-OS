import React from "react";

interface BrowserFrameProps {
  url?: string;
  children?: React.ReactNode;
  className?: string;
  tone?: "dark" | "light";
}

/**
 * A bespoke browser chrome wrapper — deliberately not a rounded-8 default.
 * Children render inside the viewport area.
 */
export default function BrowserFrame({
  url = "app.foundershelm.com",
  children,
  className = "",
  tone = "dark",
}: BrowserFrameProps) {
  return (
    <div
      className={`overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#101010] shadow-[0_60px_120px_-50px_rgba(0,0,0,0.95)] ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-white/[0.07] bg-[#151515] px-3 py-2.5 sm:px-4">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-[#3a3a3a]" />
          <span className="h-2 w-2 rounded-full bg-[#3a3a3a]" />
          <span className="h-2 w-2 rounded-full bg-[#f97316]/70" />
        </span>
        <span className="flex-1 truncate rounded-md bg-[#0d0d0d] px-2.5 py-1 font-mono text-[9px] text-[#A8A8A8] sm:text-[10px]">
          {url}
        </span>
      </div>
      <div className={tone === "dark" ? "bg-[#0C0C0C]" : "bg-[#F5F5F0]"}>{children}</div>
    </div>
  );
}
