"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CapTableDonut, Swatch, type Slice } from "@/components/freecapt/cap-table-donut";

export type { Slice };

export type CapRow = {
  id: string;
  name: string;
  typeLabel: string;
  securityLabel: string;
  securitySub?: string;
  color: string;
  quantityLabel: string;
  outstandingPct: number | null;
  fullyDilutedPct: number | null;
};

type Basis = "outstanding" | "fd";

const fmtPct = (n: number | null) => (n == null ? "—" : `${n.toFixed(2)}%`);

const PAID_FEATURES = [
  "Rich PDF & Word cap-table exports",
  "Excel workbook with ownership charts",
  "Ongoing AI chat — “ask your cap table”",
  "AI document extraction from uploads",
  "Stakeholder portal access",
];

export function CapTableClient({
  companyName,
  rows,
  outstandingSlices,
  fullyDilutedSlices,
  leftToGrantPct,
  leftToGrantLabel,
  outstandingTotalLabel,
  fullyDilutedTotalLabel,
}: {
  companyName: string;
  rows: CapRow[];
  outstandingSlices: Slice[];
  fullyDilutedSlices: Slice[];
  leftToGrantPct: number;
  leftToGrantLabel: string;
  outstandingTotalLabel: string;
  fullyDilutedTotalLabel: string;
}) {
  const [basis, setBasis] = useState<Basis>("fd");
  const [paywall, setPaywall] = useState<string | null>(null);

  const slices = basis === "fd" ? fullyDilutedSlices : outstandingSlices;
  const totalLabel = basis === "fd" ? fullyDilutedTotalLabel : outstandingTotalLabel;

  const pctOf = (r: CapRow) => (basis === "fd" ? r.fullyDilutedPct : r.outstandingPct);

  const exportCsv = () => {
    const header = ["Stakeholder", "Type", "Security", "Quantity", "Ownership %"];
    const lines = rows.map((r) => {
      const pct = pctOf(r);
      return [
        r.name,
        r.typeLabel,
        r.securityLabel,
        r.quantityLabel.replace(/,/g, ""),
        pct == null ? "" : pct.toFixed(4),
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${companyName.toLowerCase().replace(/\s+/g, "-")}-cap-table-${basis}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{companyName}</h1>
          <p className="text-sm text-slate-500">Cap table</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-sm">
            <button
              onClick={() => setBasis("outstanding")}
              className={`rounded px-3 py-1 ${
                basis === "outstanding"
                  ? "bg-slate-100 font-medium text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Outstanding
            </button>
            <button
              onClick={() => setBasis("fd")}
              className={`rounded px-3 py-1 ${
                basis === "fd"
                  ? "bg-slate-100 font-medium text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Fully diluted
            </button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Export ▾</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={exportCsv}>Download CSV</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPaywall("a rich PDF export")}>
                <span className="flex-1">PDF</span>
                <Badge variant="paid">Paid</Badge>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPaywall("a Word export")}>
                <span className="flex-1">Word (.docx)</span>
                <Badge variant="paid">Paid</Badge>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPaywall("an Excel export")}>
                <span className="flex-1">Excel (.xlsx)</span>
                <Badge variant="paid">Paid</Badge>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* "You have X% left to grant" banner */}
      <div className="mt-6 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3">
        <p className="text-sm text-brand-800">
          You have{" "}
          <span className="font-semibold tabular-nums">{leftToGrantPct.toFixed(1)}% left to grant</span>{" "}
          — <span className="tabular-nums">{leftToGrantLabel}</span> are unissued.
        </p>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[auto_1fr]">
        {/* Donut + legend */}
        <div className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-6">
          <CapTableDonut slices={slices} />
          <ul className="mt-5 w-full space-y-1.5 text-sm">
            {slices.map((s) => (
              <li key={s.label} className="flex items-center justify-between">
                <span className="text-slate-600">
                  <Swatch color={s.color} />
                  {s.label}
                </span>
                <span className="tabular-nums text-slate-900">{s.pct.toFixed(2)}%</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Stakeholder</th>
                <th className="px-4 py-2.5 text-left font-semibold">Security</th>
                <th className="px-4 py-2.5 text-right font-semibold">Quantity</th>
                <th className="px-4 py-2.5 text-right font-semibold">Ownership</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center">
                      <Swatch color={r.color} />
                      <span className="font-medium text-slate-900">{r.name}</span>
                    </span>
                    <span className="ml-4 text-xs text-slate-400">{r.typeLabel}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-slate-700">{r.securityLabel}</span>
                    {r.securitySub && (
                      <span className="block text-xs text-slate-400">{r.securitySub}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                    {r.quantityLabel}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">
                    {fmtPct(pctOf(r))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50 text-xs">
              <tr>
                <td className="px-4 py-2.5 font-semibold text-slate-600" colSpan={2}>
                  Total {basis === "fd" ? "fully diluted" : "outstanding"}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                  {totalLabel}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                  100.00%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Paywall modal (§6.6) */}
      <Dialog open={paywall != null} onOpenChange={(o) => !o && setPaywall(null)}>
        <DialogContent className="max-w-lg p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-2xl text-brand-700">
            ✦
          </div>
          <DialogTitle className="mb-2 text-2xl font-bold">Upgrade to Paid · $15/mo</DialogTitle>
          <DialogDescription className="mb-6 text-sm text-slate-600">
            You&apos;re trying to use a Paid feature — {paywall ?? "this feature"}.
          </DialogDescription>
          <div className="mb-6 rounded-lg bg-slate-50 p-4 text-left text-sm">
            <div className="mb-2 font-semibold">All Paid features:</div>
            <ul className="space-y-1 text-slate-600">
              {PAID_FEATURES.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-brand-600">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <Button size="lg" className="mb-2 w-full">
            Upgrade — $15/month →
          </Button>
          <Button variant="ghost" size="sm" className="w-full" onClick={() => setPaywall(null)}>
            Not now
          </Button>
          <p className="mt-3 text-xs text-slate-400">Cancel anytime. Your data stays yours.</p>
        </DialogContent>
      </Dialog>
    </main>
  );
}
