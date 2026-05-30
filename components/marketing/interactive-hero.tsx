"use client";

// Interactive hero card - a live, simplified round simulator. Drag the sliders
// and the donut + ownership rows recompute in real time. This is the product's
// actual value prop ("what if I raise X at Y?") made tangible on the landing
// page. Math is the simplified, non-circular model from lib/simulate/engine.ts:
// post = pre + raise; new investor % = raise / post; everyone else scales by
// pre / post. Labelled "simplified" so it's never mistaken for the real tool.
import { useMemo, useState } from "react";

import { CapTableDonut, Swatch } from "@/components/freecapt/cap-table-donut";

type Holder = { label: string; pct: number; color: string; founder?: boolean };

// Pre-round fully-diluted ownership (sums to 100).
const BASE: Holder[] = [
  { label: "Anna (Founder)", pct: 30.7, color: "#047857", founder: true },
  { label: "Ben (Founder)", pct: 30.7, color: "#10b981", founder: true },
  { label: "Chris (Founder)", pct: 18.4, color: "#34d399", founder: true },
  { label: "Options (Dana, Erik)", pct: 3.4, color: "#f59e0b" },
  { label: "Frank (SAFE)", pct: 4.8, color: "#fbbf24" },
  { label: "Pool", pct: 12.0, color: "#94a3b8" },
];

const NEW_INVESTOR_COLOR = "#d97706";

function fmtMillions(n: number): string {
  return n % 1 === 0 ? `${n}` : n.toFixed(1);
}

export function InteractiveHero() {
  const [raise, setRaise] = useState(2); // $M
  const [pre, setPre] = useState(8); // $M pre-money

  const { slices, rows, newInvestorPct, foundersBefore, foundersAfter } = useMemo(() => {
    const post = pre + raise;
    const factor = pre / post;
    const newPct = (raise / post) * 100;

    const scaled = BASE.map((h) => ({ ...h, pct: h.pct * factor }));
    const foundersBeforePct = BASE.filter((h) => h.founder).reduce((s, h) => s + h.pct, 0);
    const foundersAfterPct = scaled.filter((h) => h.founder).reduce((s, h) => s + h.pct, 0);

    // Donut: founders + options + SAFE, then new investor, then pool last.
    const poolHolder = scaled.find((h) => h.label === "Pool");
    const nonPool = scaled.filter((h) => h.label !== "Pool");
    const donut: Holder[] = [
      ...nonPool,
      { label: "New investor", pct: newPct, color: NEW_INVESTOR_COLOR },
      ...(poolHolder ? [poolHolder] : []),
    ];

    return {
      slices: donut.map(({ label, pct, color }) => ({ label, pct, color })),
      rows: donut,
      newInvestorPct: newPct,
      foundersBefore: foundersBeforePct,
      foundersAfter: foundersAfterPct,
    };
  }, [raise, pre]);

  return (
    <div className="relative">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Acme ApS · Round simulator</div>
            <div className="text-lg font-semibold">What if you raise?</div>
          </div>
          <div className="rounded bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
            Live preview
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="shrink-0">
            <CapTableDonut slices={slices} size={160} />
          </div>
          <div className="flex-1 space-y-1.5 text-sm">
            {rows.map((h) => (
              <div
                key={h.label}
                className={`flex justify-between ${
                  h.label === "New investor" ? "font-semibold text-amber-700" : ""
                } ${h.label === "Pool" ? "text-slate-500" : ""}`}
              >
                <span>
                  <Swatch color={h.color} />
                  {h.label}
                </span>
                <span className="font-medium tabular-nums">{h.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
          <label className="block">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">Raise amount</span>
              <span className="font-semibold tabular-nums text-slate-900">
                ${fmtMillions(raise)}M
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.1}
              value={raise}
              onChange={(e) => setRaise(Number(e.target.value))}
              aria-label="Raise amount in millions"
              className="w-full accent-brand-600"
            />
          </label>
          <label className="block">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">Pre-money valuation</span>
              <span className="font-semibold tabular-nums text-slate-900">
                ${fmtMillions(pre)}M
              </span>
            </div>
            <input
              type="range"
              min={4}
              max={20}
              step={0.5}
              value={pre}
              onChange={(e) => setPre(Number(e.target.value))}
              aria-label="Pre-money valuation in millions"
              className="w-full accent-brand-600"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
          <span className="text-slate-500">
            New investor owns{" "}
            <span className="font-semibold text-amber-700 tabular-nums">
              {newInvestorPct.toFixed(1)}%
            </span>
          </span>
          <span className="text-slate-500">
            Founders{" "}
            <span className="tabular-nums text-slate-400">{foundersBefore.toFixed(1)}%</span> →{" "}
            <span className="font-semibold text-slate-900 tabular-nums">
              {foundersAfter.toFixed(1)}%
            </span>
          </span>
        </div>
      </div>

      <div className="absolute -right-3 -top-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-md">
        🇪🇺 GDPR
      </div>
      <div className="absolute -bottom-3 -left-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-brand-700 shadow-md">
        Simplified preview - try the full simulator free
      </div>
    </div>
  );
}
