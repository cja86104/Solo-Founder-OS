import React from "react";
import { ArrowDownRight, ArrowUpRight, Circle } from "lucide-react";

interface PipelineRow {
  name: string;
  stage: string;
  value: string;
  tone: "orange" | "plain";
}

interface Kpi {
  label: string;
  value: string;
  delta: string;
  up: boolean;
}

const bars: number[] = [38, 52, 44, 61, 57, 72, 66, 81, 74, 92, 86, 100];

const rows: PipelineRow[] = [
  { name: "Northwind Studio", stage: "Proposal", value: "$4,800", tone: "orange" },
  { name: "Merrick & Co.", stage: "Negotiation", value: "$2,150", tone: "plain" },
  { name: "Halcyon Labs", stage: "Discovery", value: "$980", tone: "plain" },
];

const kpis: Kpi[] = [
  { label: "MRR", value: "$11,482", delta: "+0.1%", up: true },
  { label: "Churn", value: "3.4%", delta: "+0.6%", up: false },
  { label: "Customers", value: "318", delta: "+7", up: true },
];

export default function DashboardMock() {
  return (
    <div className="relative p-3 sm:p-5" role="img" aria-label="Founders Helm Command Center: MRR, churn and pipeline in one dashboard view.">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-[#A8A8A8] sm:text-[9px]">Command Center</p>
          <p className="mt-1 font-display text-lg leading-none text-[#F5F5F0] sm:text-2xl">Good evening, Ada</p>
        </div>
        <span className="rounded-full border border-[#f97316]/40 bg-[#f97316]/10 px-2 py-1 font-mono text-[8px] uppercase tracking-widest text-[#f97316] sm:text-[9px]">
          Stripe · synced
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-white/[0.06] bg-[#111111] p-2.5 sm:p-3.5">
            <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-[#A8A8A8] sm:text-[9px]">{k.label}</p>
            <p className="mt-1.5 font-display text-base leading-none text-[#F5F5F0] sm:text-xl">{k.value}</p>
            <p
              className={`mt-1.5 flex items-center gap-1 font-mono text-[8px] sm:text-[9px] ${
                k.up ? "text-[#f97316]" : "text-[#A8A8A8]"
              }`}
            >
              {k.up ? <ArrowUpRight className="h-2.5 w-2.5" aria-hidden="true" /> : <ArrowDownRight className="h-2.5 w-2.5" aria-hidden="true" />}
              {k.delta}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-5 sm:gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-3 sm:col-span-3 sm:p-4">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-[#A8A8A8] sm:text-[9px]">Revenue · 12 mo</p>
            <p className="font-mono text-[8px] text-[#A8A8A8] sm:text-[9px]">net +$14</p>
          </div>
          <div className="mt-3 flex h-16 items-end gap-[3px] sm:h-24 sm:gap-1.5">
            {bars.map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-sm ${
                  i === bars.length - 1
                    ? "bg-gradient-to-t from-[#c2410c] to-[#f97316]"
                    : "bg-white/[0.11]"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-3 sm:col-span-2 sm:p-4">
          <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-[#A8A8A8] sm:text-[9px]">Pipeline</p>
          <ul className="mt-2.5 space-y-2">
            {rows.map((r) => (
              <li key={r.name} className="flex items-center gap-2">
                <Circle
                  className={`h-1.5 w-1.5 shrink-0 ${r.tone === "orange" ? "fill-[#f97316] text-[#f97316]" : "fill-[#3f3f3f] text-[#3f3f3f]"}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-[10px] text-[#F5F5F0]/85 sm:text-[11px]">{r.name}</span>
                <span className="hidden font-mono text-[8px] text-[#A8A8A8] sm:inline sm:text-[9px]">{r.stage}</span>
                <span className="font-mono text-[9px] text-[#F5F5F0]/70 sm:text-[10px]">{r.value}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-white/[0.06] pt-2 font-mono text-[8px] text-[#f97316] sm:text-[9px]">
            1 deal idle 12 days
          </p>
        </div>
      </div>
    </div>
  );
}
