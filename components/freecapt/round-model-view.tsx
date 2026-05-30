"use client";

// Round modeling workflow (docs/01_mvp_scope.md §5.25) — the multi-investor
// allocation surface that extends the basic simulator. Founder lists specific
// investors with commitment shapes, allocates against a target round size
// (manually or via the greedy "Suggest" solver), and sees the resulting cap
// table (reusing ScenarioView), an allocation table, and a validation banner.
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScenarioView } from "@/components/freecapt/scenario-view";
import { moneyFmt } from "@/lib/cap-table/display";
import type { SimHolder, SimSafe } from "@/lib/simulate/engine";
import {
  modelRound,
  suggestAllocation,
  type AllocationRow,
  type CommitmentShape,
  type RoundInvestor,
  type RoundPriority,
  type RoundTerms,
} from "@/lib/simulate/round-model";

type ShapeKind = CommitmentShape["kind"];

// Editor row: flat fields the form binds to, normalized into a RoundInvestor.
type EditorRow = {
  id: string;
  name: string;
  shapeKind: ShapeKind;
  amount: number; // fixed amount / up_to max
  min: number; // range min
  max: number; // range max
  priority: RoundPriority;
  allocated: number;
};

const PRIORITY_LABEL: Record<RoundPriority, string> = {
  must_include: "Must include",
  target: "Target",
  optional: "Optional",
  fill_the_gap: "Fill the gap",
};

function toShape(row: EditorRow): CommitmentShape {
  switch (row.shapeKind) {
    case "fixed":
      return { kind: "fixed", amount: row.amount };
    case "range":
      return { kind: "range", min: row.min, max: row.max };
    case "up_to":
      return { kind: "up_to", max: row.amount };
  }
}

function toInvestor(row: EditorRow): RoundInvestor {
  return {
    id: row.id,
    name: row.name.trim() || "Investor",
    type: "investor",
    shape: toShape(row),
    priority: row.priority,
  };
}

function newRow(name = ""): EditorRow {
  return {
    id: crypto.randomUUID(),
    name,
    shapeKind: "fixed",
    amount: 250_000,
    min: 100_000,
    max: 250_000,
    priority: "target",
    allocated: 0,
  };
}

const selectCls =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export function RoundModelView({
  currency,
  holders,
  safes,
}: {
  currency: string;
  holders: SimHolder[];
  safes: SimSafe[];
}) {
  const [roundSize, setRoundSize] = useState(2_000_000);
  const [preMoney, setPreMoney] = useState(10_000_000);
  const [poolTopupPct, setPoolTopupPct] = useState(0);
  const [rows, setRows] = useState<EditorRow[]>(() => [
    newRow("Lead investor"),
    newRow("Angel"),
  ]);

  const terms: RoundTerms = useMemo(
    () => ({ roundSize, preMoney, poolTopupPct: poolTopupPct || undefined }),
    [roundSize, preMoney, poolTopupPct],
  );

  const investors = useMemo(() => rows.map(toInvestor), [rows]);
  const allocations = useMemo(() => {
    const out: Record<string, number> = {};
    for (const r of rows) out[r.id] = r.allocated;
    return out;
  }, [rows]);

  const result = useMemo(
    () => modelRound(holders, safes, terms, investors, allocations),
    [holders, safes, terms, investors, allocations],
  );

  const update = (id: string, patch: Partial<EditorRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const remove = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const suggest = () => {
    const alloc = suggestAllocation(terms, investors);
    setRows((prev) => prev.map((r) => ({ ...r, allocated: Math.round(alloc[r.id] ?? 0) })));
  };

  const [downloading, setDownloading] = useState<"pdf" | "docx" | null>(null);
  const downloadTermSheet = async (format: "pdf" | "docx") => {
    setDownloading(format);
    try {
      const res = await fetch("/simulate/term-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms, investors, allocations, format }),
      });
      if (!res.ok) throw new Error("Failed to generate term sheet");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `term-sheet.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Couldn't generate the term sheet. Try again.");
    } finally {
      setDownloading(null);
    }
  };

  const anyAllocated = result.validation.totalAllocated > 0;

  const v = result.validation;
  const bannerCls =
    v.status === "over"
      ? "border-red-200 bg-red-50 text-red-800"
      : v.satisfied
        ? "border-brand-200 bg-brand-50 text-brand-800"
        : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <div className="space-y-6">
      {/* Round terms */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Round terms</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <MoneyField id="rm-round" label="Round size" currency={currency} value={roundSize} onChange={setRoundSize} />
          <MoneyField id="rm-pre" label="Pre-money valuation" currency={currency} value={preMoney} onChange={setPreMoney} />
          <div>
            <Label htmlFor="rm-pool">Pool top-up (optional)</Label>
            <div className="relative mt-1">
              <Input
                id="rm-pool"
                type="number"
                min={0}
                max={50}
                value={poolTopupPct || ""}
                placeholder="0"
                onChange={(e) => setPoolTopupPct(Math.max(0, Number(e.target.value) || 0))}
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Price / share <span className="font-mono text-slate-700">{moneyFmtPrecise(result.pricePerShare, currency)}</span> ·
          Post-money <span className="font-mono text-slate-700">{moneyFmt(result.postMoney, currency)}</span>
          {safes.length > 0 && <> · {safes.length} SAFE{safes.length === 1 ? "" : "s"} auto-converting</>}
        </p>
      </section>

      {/* Investor editor */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Investors</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={suggest}>
              Suggest allocation
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRows((p) => [...p, newRow()])}>
              + Add investor
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {rows.length === 0 && (
            <p className="rounded-md border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
              No investors yet. Add a few to model how the round fills.
            </p>
          )}
          {rows.map((r) => (
            <div key={r.id} className="grid items-end gap-2 rounded-md border border-slate-100 bg-slate-50/60 p-3 lg:grid-cols-[1.3fr_0.9fr_1.4fr_1fr_1fr_auto]">
              <div>
                <Label htmlFor={`name-${r.id}`} className="text-xs">Name</Label>
                <Input
                  id={`name-${r.id}`}
                  value={r.name}
                  placeholder="Investor"
                  onChange={(e) => update(r.id, { name: e.target.value })}
                  className="mt-1 bg-white"
                />
              </div>
              <div>
                <Label htmlFor={`shape-${r.id}`} className="text-xs">Commitment</Label>
                <select
                  id={`shape-${r.id}`}
                  value={r.shapeKind}
                  onChange={(e) => update(r.id, { shapeKind: e.target.value as ShapeKind })}
                  className={`mt-1 ${selectCls}`}
                >
                  <option value="fixed">Fixed</option>
                  <option value="range">Range</option>
                  <option value="up_to">Up to</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">{r.shapeKind === "range" ? "Min / Max" : r.shapeKind === "up_to" ? "Maximum" : "Amount"}</Label>
                {r.shapeKind === "range" ? (
                  <div className="mt-1 flex gap-1">
                    <NumInput value={r.min} onChange={(n) => update(r.id, { min: n })} />
                    <NumInput value={r.max} onChange={(n) => update(r.id, { max: n })} />
                  </div>
                ) : (
                  <NumInput className="mt-1" value={r.amount} onChange={(n) => update(r.id, { amount: n })} />
                )}
              </div>
              <div>
                <Label htmlFor={`prio-${r.id}`} className="text-xs">Priority</Label>
                <select
                  id={`prio-${r.id}`}
                  value={r.priority}
                  onChange={(e) => update(r.id, { priority: e.target.value as RoundPriority })}
                  className={`mt-1 ${selectCls}`}
                >
                  {(Object.keys(PRIORITY_LABEL) as RoundPriority[]).map((p) => (
                    <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor={`alloc-${r.id}`} className="text-xs">Allocated</Label>
                <NumInput className="mt-1" value={r.allocated} onChange={(n) => update(r.id, { allocated: n })} />
              </div>
              <button
                type="button"
                onClick={() => remove(r.id)}
                aria-label={`Remove ${r.name || "investor"}`}
                className="mb-1 h-9 rounded-md px-2 text-sm text-slate-400 hover:bg-slate-100 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Validation banner */}
      <div className={`rounded-lg border px-4 py-3 text-sm ${bannerCls}`}>
        <div className="flex items-center justify-between font-medium">
          <span>
            Allocated {moneyFmt(v.totalAllocated, currency)} of {moneyFmt(v.roundSize, currency)}
          </span>
          <span className="tabular-nums">
            {v.status === "over" ? "Oversubscribed" : v.status === "under" ? "Undersubscribed" : "Fully allocated"}
          </span>
        </div>
        {v.messages.filter((m) => m.level !== "ok").length > 0 && (
          <ul className="mt-2 space-y-0.5 text-xs">
            {v.messages
              .filter((m) => m.level !== "ok")
              .map((m, i) => (
                <li key={i}>• {m.text}</li>
              ))}
          </ul>
        )}
      </div>

      {/* Allocation table */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Investor</th>
              <th className="px-3 py-2 text-right font-semibold">Requested</th>
              <th className="px-3 py-2 text-right font-semibold">Pro-rata</th>
              <th className="px-3 py-2 text-right font-semibold">Allocated</th>
              <th className="px-3 py-2 text-right font-semibold">% round</th>
              <th className="px-3 py-2 text-right font-semibold">% post</th>
              <th className="px-3 py-2 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.allocations.map((a) => (
              <AllocationTableRow key={a.id} a={a} currency={currency} />
            ))}
            {result.allocations.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-slate-400">
                  Add investors above to see the allocation.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Term-sheet draft */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
            Term sheet draft
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
              Paid
            </span>
          </p>
          <p className="text-xs text-slate-500">
            A non-binding draft summarizing terms, allocation, and key clauses — for your counsel to review.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadTermSheet("pdf")}
            disabled={downloading !== null || !anyAllocated}
          >
            <Download className="mr-1.5 h-4 w-4" />
            {downloading === "pdf" ? "Generating…" : "PDF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadTermSheet("docx")}
            disabled={downloading !== null || !anyAllocated}
          >
            <Download className="mr-1.5 h-4 w-4" />
            {downloading === "docx" ? "Generating…" : "Word"}
          </Button>
        </div>
      </div>

      {/* Resulting cap table */}
      <ScenarioView result={result.scenario} currency={currency} />
    </div>
  );
}

function AllocationTableRow({ a, currency }: { a: AllocationRow; currency: string }) {
  const requested =
    a.requestedMin === a.requestedMax
      ? moneyFmt(a.requestedMax, currency)
      : `${moneyFmt(a.requestedMin, currency)}–${moneyFmt(a.requestedMax, currency)}`;
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-3 py-2 font-medium text-slate-900">{a.name}</td>
      <td className="px-3 py-2 text-right tabular-nums text-slate-600">{requested}</td>
      <td className="px-3 py-2 text-right tabular-nums text-slate-500">
        {a.proRataAmount != null ? moneyFmt(a.proRataAmount, currency) : "—"}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-slate-900">{moneyFmt(a.allocated, currency)}</td>
      <td className="px-3 py-2 text-right tabular-nums text-slate-700">{a.pctOfRound.toFixed(1)}%</td>
      <td className="px-3 py-2 text-right tabular-nums text-slate-700">{a.pctOfPost.toFixed(2)}%</td>
      <td className="px-3 py-2 text-right">
        <StatusPill status={a.status} />
      </td>
    </tr>
  );
}

function StatusPill({ status }: { status: AllocationRow["status"] }) {
  const map: Record<AllocationRow["status"], { label: string; cls: string }> = {
    ok: { label: "OK", cls: "bg-brand-50 text-brand-700" },
    cut: { label: "Cut", cls: "bg-slate-100 text-slate-500" },
    below_min: { label: "Below min", cls: "bg-amber-100 text-amber-700" },
    over_max: { label: "Over max", cls: "bg-red-100 text-red-700" },
  };
  const { label, cls } = map[status];
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>{label}</span>;
}

function NumInput({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  className?: string;
}) {
  return (
    <Input
      type="number"
      min={0}
      step={10000}
      value={value || ""}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      className={`bg-white tabular-nums ${className ?? ""}`}
    />
  );
}

function MoneyField({
  id,
  label,
  currency,
  value,
  onChange,
}: {
  id: string;
  label: string;
  currency: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          {currency}
        </span>
        <Input
          id={id}
          type="number"
          min={0}
          step={10000}
          value={value || ""}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="pl-12 tabular-nums"
        />
      </div>
    </div>
  );
}

function moneyFmtPrecise(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: n < 1 ? 4 : 2,
  }).format(n);
}
