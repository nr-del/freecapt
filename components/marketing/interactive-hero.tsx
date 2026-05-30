"use client";

// Interactive hero card - a live, simplified round simulator. Drag the sliders
// and the donut + ownership rows recompute in real time. This is the product's
// actual value prop ("what if I raise X at Y?") made tangible on the landing
// page. Math is the simplified, non-circular model from lib/simulate/engine.ts:
// post = pre + raise; new investor % = raise / post; everyone else scales by
// pre / post. Labelled "simplified" so it's never mistaken for the real tool.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { CapTableDonut, Swatch } from "@/components/freecapt/cap-table-donut";

type Holder = { label: string; pct: number; color: string; founder?: boolean; kind?: string };

const NEW_INVESTOR_COLOR = "#d97706";

function fmtMillions(n: number): string {
  return n % 1 === 0 ? `${n}` : n.toFixed(1);
}

export function InteractiveHero() {
  const t = useTranslations("hero");
  const [raise, setRaise] = useState(2); // $M
  const [pre, setPre] = useState(8); // $M pre-money

  // Pre-round fully-diluted ownership (sums to 100). Founder names are
  // illustrative demo data; the role suffix and group labels are translated.
  const base: Holder[] = useMemo(
    () => [
      { label: `Anna (${t("founderSuffix")})`, pct: 30.7, color: "#047857", founder: true },
      { label: `Ben (${t("founderSuffix")})`, pct: 30.7, color: "#10b981", founder: true },
      { label: `Chris (${t("founderSuffix")})`, pct: 18.4, color: "#34d399", founder: true },
      { label: t("optionsLabel"), pct: 3.4, color: "#f59e0b" },
      { label: t("safeLabel"), pct: 4.8, color: "#fbbf24" },
      { label: t("poolLabel"), pct: 12.0, color: "#94a3b8", kind: "pool" },
    ],
    [t],
  );

  const { slices, rows, newInvestorPct, foundersBefore, foundersAfter } = useMemo(() => {
    const post = pre + raise;
    const factor = pre / post;
    const newPct = (raise / post) * 100;

    const scaled = base.map((h) => ({ ...h, pct: h.pct * factor }));
    const foundersBeforePct = base.filter((h) => h.founder).reduce((s, h) => s + h.pct, 0);
    const foundersAfterPct = scaled.filter((h) => h.founder).reduce((s, h) => s + h.pct, 0);

    // Donut: founders + options + SAFE, then new investor, then pool last.
    const poolHolder = scaled.find((h) => h.kind === "pool");
    const nonPool = scaled.filter((h) => h.kind !== "pool");
    const donut: Holder[] = [
      ...nonPool,
      { label: t("newInvestorLabel"), pct: newPct, color: NEW_INVESTOR_COLOR, kind: "newInvestor" },
      ...(poolHolder ? [poolHolder] : []),
    ];

    return {
      slices: donut.map(({ label, pct, color }) => ({ label, pct, color })),
      rows: donut,
      newInvestorPct: newPct,
      foundersBefore: foundersBeforePct,
      foundersAfter: foundersAfterPct,
    };
  }, [raise, pre, base, t]);

  return (
    <div className="relative">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">{t("company")}</div>
            <div className="text-lg font-semibold">{t("title")}</div>
          </div>
          <div className="rounded bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
            {t("livePreview")}
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="shrink-0">
            <CapTableDonut slices={slices} size={160} />
          </div>
          <div className="w-full flex-1 space-y-1.5 text-sm">
            {rows.map((h) => (
              <div
                key={h.label}
                className={`flex justify-between ${
                  h.kind === "newInvestor" ? "font-semibold text-amber-700" : ""
                } ${h.kind === "pool" ? "text-slate-500" : ""}`}
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
              <span className="font-medium text-slate-600">{t("raiseAmount")}</span>
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
              aria-label={t("raiseAria")}
              className="w-full accent-brand-600"
            />
          </label>
          <label className="block">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">{t("preMoney")}</span>
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
              aria-label={t("preAria")}
              className="w-full accent-brand-600"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
          <span className="text-slate-500">
            {t("newInvestorOwns")}{" "}
            <span className="font-semibold text-amber-700 tabular-nums">
              {newInvestorPct.toFixed(1)}%
            </span>
          </span>
          <span className="text-slate-500">
            {t("founders")}{" "}
            <span className="tabular-nums text-slate-400">{foundersBefore.toFixed(1)}%</span> →{" "}
            <span className="font-semibold text-slate-900 tabular-nums">
              {foundersAfter.toFixed(1)}%
            </span>
          </span>
        </div>
      </div>

      <div className="absolute -right-3 -top-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-md">
        {t("gdpr")}
      </div>
      <div className="absolute -bottom-3 -left-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-brand-700 shadow-md">
        {t("simplified")}
      </div>
    </div>
  );
}
