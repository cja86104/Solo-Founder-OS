import React from "react";
import { brand } from "@/lib/marketing/content";

interface TrustRowProps {
  className?: string;
  tone?: "muted" | "bright";
}

export default function TrustRow({ className = "", tone = "muted" }: TrustRowProps) {
  const color = tone === "bright" ? "text-[#F5F5F0]/80" : "text-[#A8A8A8]";
  return (
    <ul className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[11px] tracking-wide sm:text-[12px] ${color} ${className}`}>
      {brand.trustRow.map((item, i) => (
        <li key={item} className="flex items-center gap-3">
          {i > 0 && <span aria-hidden="true" className="text-[#f97316]">·</span>}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
