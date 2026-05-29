"use client";

import { useState } from "react";

import { BulkAddModal } from "@/components/freecapt/bulk-add-modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Swatch } from "@/components/freecapt/cap-table-donut";

export type StakeholderRow = {
  id: string;
  name: string;
  typeLabel: string;
  color: string;
  email: string | null;
  holdingsLabel: string;
  fullyDilutedPct: number | null;
};

const PAID_FEATURES = [
  "Rich PDF & Word cap-table exports",
  "Excel workbook with ownership charts",
  "Ongoing AI chat — “ask your cap table”",
  "AI document extraction from uploads",
  "Stakeholder portal access",
];

const fmtPct = (n: number | null) => (n == null ? "—" : `${n.toFixed(2)}%`);

export function StakeholdersClient({
  companyName,
  rows,
}: {
  companyName: string;
  rows: StakeholderRow[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [startRows, setStartRows] = useState(3);
  const [paywall, setPaywall] = useState<string | null>(null);

  const openBulk = () => {
    setStartRows(3);
    setModalOpen(true);
  };
  const openSingle = () => {
    setStartRows(1);
    setModalOpen(true);
  };

  const isEmpty = rows.length === 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{companyName}</h1>
          <p className="text-sm text-slate-500">Stakeholders</p>
        </div>
        {!isEmpty && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={openSingle}>
              + Add one
            </Button>
            <Button onClick={openBulk}>+ Bulk add stakeholders</Button>
          </div>
        )}
      </header>

      {isEmpty ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mb-4 text-5xl">◯</div>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">
            Let&apos;s get {companyName}&apos;s cap table set up.
          </h2>
          <p className="mx-auto mb-8 max-w-md text-sm text-slate-600">
            Pick the fastest way to add everyone. You can edit and add more later.
          </p>
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
            <EmptyCta
              icon="⌗"
              title="Paste from spreadsheet"
              body="Copy rows from Excel or Google Sheets. Fastest for migrating."
              cta="Paste rows"
              onClick={openBulk}
            />
            <EmptyCta
              icon="✦"
              title="Type it out"
              body="Describe your cap table in plain words and let AI structure it."
              cta="Upgrade"
              paid
              onClick={() => setPaywall("AI “type it out” bulk add")}
            />
            <EmptyCta
              icon="↥"
              title="Upload documents"
              body="Drop in formation docs or a cap-table PDF for AI extraction."
              cta="Upgrade"
              paid
              onClick={() => setPaywall("AI document extraction")}
            />
          </div>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Stakeholder</th>
                <th className="px-4 py-2.5 text-left font-semibold">Email</th>
                <th className="px-4 py-2.5 text-left font-semibold">Holdings</th>
                <th className="px-4 py-2.5 text-right font-semibold">Fully diluted</th>
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
                  <td className="px-4 py-2.5 text-slate-600">{r.email ?? "—"}</td>
                  <td className="px-4 py-2.5 text-slate-700">{r.holdingsLabel}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">
                    {fmtPct(r.fullyDilutedPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BulkAddModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpgrade={(feature) => {
          setModalOpen(false);
          setPaywall(feature);
        }}
        startRows={startRows}
      />

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

function EmptyCta({
  icon,
  title,
  body,
  cta,
  onClick,
  paid,
}: {
  icon: string;
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
  paid?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-5 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
    >
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-xl text-brand-700">
        {icon}
      </div>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <p className="mt-1 text-xs text-slate-500">{body}</p>
      <span className="mt-3 text-xs font-medium text-brand-700">
        {cta} {paid ? "" : "→"}
      </span>
    </button>
  );
}
