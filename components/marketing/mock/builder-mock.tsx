import React from "react";
import { Globe, Lock, Type, Image as ImageIcon, Rows3, type LucideIcon } from "lucide-react";

interface BuilderSection {
  i: LucideIcon;
  l: string;
}

const sections: BuilderSection[] = [
  { i: Rows3, l: "Hero / split" },
  { i: Type, l: "Feature copy" },
  { i: ImageIcon, l: "Media band" },
  { i: Rows3, l: "Lead capture" },
];

export default function BuilderMock() {
  return (
    <div className="flex" role="img" aria-label="Founders Helm Landing Pages: visual section builder with SEO, custom code and password protection controls.">
      <aside className="hidden w-32 shrink-0 border-r border-white/[0.07] bg-[#101010] p-2.5 sm:block lg:w-40">
        <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#A8A8A8]">Sections</p>
        <ul className="mt-2 space-y-1">
          {sections.map((s, idx) => (
            <li
              key={s.l}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] ${
                idx === 3 ? "bg-[#f97316]/12 text-[#f97316]" : "text-[#F5F5F0]/70"
              }`}
            >
              <s.i className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{s.l}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.2em] text-[#A8A8A8]">Custom</p>
        <p className="mt-1.5 rounded-lg bg-[#0c0c0c] p-2 font-mono text-[8px] leading-relaxed text-[#6f6f6f]">
          .cta{"{"}letter-spacing:-.02em{"}"}
        </p>
      </aside>

      <div className="min-w-0 flex-1 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 font-mono text-[8px] text-[#A8A8A8]">
            <Globe className="h-2.5 w-2.5" aria-hidden="true" /> launch.yourdomain.com · SSL
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#f97316]/40 bg-[#f97316]/10 px-2 py-1 font-mono text-[8px] text-[#f97316]">
            <Lock className="h-2.5 w-2.5" aria-hidden="true" /> password on
          </span>
        </div>

        <div className="mt-3 overflow-hidden rounded-lg border border-white/[0.07] bg-gradient-to-b from-[#141414] to-[#0c0c0c] p-3 sm:p-4">
          <div className="h-1.5 w-16 rounded-full bg-[#f97316]/70" />
          <div className="mt-2.5 h-3 w-3/4 rounded bg-white/[0.16] sm:h-4" />
          <div className="mt-1.5 h-3 w-1/2 rounded bg-white/[0.09] sm:h-4" />
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <div className="h-8 rounded bg-white/[0.05] sm:h-10" />
            <div className="h-8 rounded bg-white/[0.05] sm:h-10" />
            <div className="h-8 rounded bg-white/[0.05] sm:h-10" />
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <div className="h-6 flex-1 rounded-md border border-dashed border-[#f97316]/50 bg-[#f97316]/[0.06]" />
            <div className="h-6 w-16 rounded-md bg-[#f97316]" />
          </div>
          <p className="mt-2 font-mono text-[8px] text-[#6f6f6f]">lead → CRM · contact created</p>
        </div>
      </div>
    </div>
  );
}
