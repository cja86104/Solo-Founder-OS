import React from "react";
import { GripVertical } from "lucide-react";

interface DealCard {
  n: string;
  v: string;
  /** Only the idle deal carries a flag — optional on purpose. */
  flag?: string;
}

interface PipelineColumn {
  stage: string;
  count: number;
  cards: DealCard[];
}

const columns: PipelineColumn[] = [
  { stage: "Discovery", count: 6, cards: [{ n: "Halcyon Labs", v: "$980" }, { n: "Bright Fen", v: "$1,200" }] },
  { stage: "Proposal", count: 3, cards: [{ n: "Northwind Studio", v: "$4,800", flag: "idle 12d" }, { n: "Ourea", v: "$2,400" }] },
  { stage: "Negotiation", count: 2, cards: [{ n: "Merrick & Co.", v: "$2,150" }] },
  { stage: "Won", count: 9, cards: [{ n: "Sable Type", v: "$3,600" }] },
];

export default function CrmMock() {
  return (
    <div className="p-3 sm:p-5" role="img" aria-label="Founders Helm CRM: a Kanban deal board with Discovery, Proposal, Negotiation and Won stages.">
      <div className="flex items-center justify-between">
        <p className="font-display text-base text-[#F5F5F0] sm:text-xl">Pipeline</p>
        <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-[#A8A8A8] sm:text-[9px]">20 open · $18,340</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
        {columns.map((col) => (
          <div key={col.stage} className="rounded-xl border border-white/[0.06] bg-[#101010] p-2">
            <div className="flex items-center justify-between px-0.5">
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#A8A8A8] sm:text-[9px]">{col.stage}</p>
              <span className="font-mono text-[8px] text-[#5f5f5f]">{col.count}</span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {col.cards.map((c) => (
                <li
                  key={c.n}
                  className={`rounded-lg border p-2 ${
                    c.flag ? "border-[#f97316]/45 bg-[#f97316]/[0.07]" : "border-white/[0.07] bg-[#141414]"
                  }`}
                >
                  <div className="flex items-start gap-1">
                    <GripVertical className="mt-0.5 h-2.5 w-2.5 shrink-0 text-[#3f3f3f]" aria-hidden="true" />
                    <span className="text-[10px] leading-tight text-[#F5F5F0]/90 sm:text-[11px]">{c.n}</span>
                  </div>
                  <p className="mt-1.5 pl-3.5 font-mono text-[9px] text-[#A8A8A8]">{c.v}</p>
                  {c.flag && <p className="mt-1 pl-3.5 font-mono text-[8px] uppercase tracking-wider text-[#f97316]">{c.flag}</p>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
