"use client";

// Carta import (§5.15). Upload a Carta "Equity Plan" .xlsx, review the grants we
// found, then commit. Parsing + writing both happen in server actions; this is a
// thin upload → preview → confirm wrapper. Carta exports are option-heavy and
// jurisdiction-flavoured ("EMI", "EU WARRANT"), so the preview lets the founder
// sanity-check the mapping before anything lands on their cap table.
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { importCartaGrants, previewCartaImport } from "@/app/(app)/stakeholders/actions";
import type { CartaGrant } from "@/lib/carta/parse";
import { intFmt } from "@/lib/cap-table/display";

type Preview = { grants: CartaGrant[]; shareClasses: string[]; warnings: string[] };

const CATEGORY_LABEL: Record<CartaGrant["category"], string> = {
  equity_unit: "Shares",
  option_like: "Options",
  convertible: "Convertible",
};

export function CartaImportModal({
  open,
  onOpenChange,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, startParsing] = useTransition();
  const [importing, startImporting] = useTransition();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPreview(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPreview(null);
    const formData = new FormData();
    formData.append("file", file);
    startParsing(async () => {
      const res = await previewCartaImport(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPreview({ grants: res.grants, shareClasses: res.shareClasses, warnings: res.warnings });
    });
  };

  const onConfirm = () => {
    if (!preview) return;
    startImporting(async () => {
      const res = await importCartaGrants(preview.grants);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const parts: string[] = [];
      if (res.stakeholdersCreated > 0)
        parts.push(`${res.stakeholdersCreated} new stakeholder${res.stakeholdersCreated === 1 ? "" : "s"}`);
      if (res.stakeholdersMatched > 0)
        parts.push(`${res.stakeholdersMatched} matched`);
      const who = parts.length ? ` (${parts.join(", ")})` : "";
      toast.success(`Imported ${res.holdings} holding${res.holdings === 1 ? "" : "s"}${who}.`);
      handleOpenChange(false);
      router.refresh();
    });
  };

  const busy = parsing || importing;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import from Carta</DialogTitle>
          <DialogDescription>
            Export the <span className="font-medium">Equity Plan</span> report from Carta as Excel
            (.xlsx) and drop it in. We&apos;ll match each person to your cap table and add their
            holdings.
          </DialogDescription>
        </DialogHeader>

        {!preview ? (
          <div className="py-2">
            <label
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40 ${
                parsing ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                disabled={parsing}
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <div className="mb-2 text-3xl text-slate-400">↥</div>
              <div className="text-sm font-semibold text-slate-900">
                {parsing ? "Reading your file…" : "Choose a Carta .xlsx export"}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                The whole grant ledger in one file. Up to 15 MB.
              </p>
            </label>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
          </div>
        ) : (
          <div className="py-1">
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <span>
                <span className="font-semibold text-slate-900">{preview.grants.length}</span>{" "}
                holding{preview.grants.length === 1 ? "" : "s"} ready to import
              </span>
              {preview.shareClasses.length > 0 && (
                <span className="text-slate-400">
                  Classes: {preview.shareClasses.join(", ")}
                </span>
              )}
            </div>

            {preview.warnings.map((w) => (
              <p
                key={w}
                className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700"
              >
                {w}
              </p>
            ))}

            <div className="max-h-[46vh] overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Stakeholder</th>
                    <th className="px-3 py-2 text-left font-semibold">Type</th>
                    <th className="px-3 py-2 text-left font-semibold">Holding</th>
                    <th className="px-3 py-2 text-right font-semibold">Quantity</th>
                    <th className="px-3 py-2 text-right font-semibold">Strike</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.grants.map((g, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-900">{g.stakeholderName}</div>
                        <div className="text-xs text-slate-400">
                          {g.stakeholderEmail || "no email"}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-600 capitalize">{g.type}</td>
                      <td className="px-3 py-2 text-slate-700">
                        <div>{CATEGORY_LABEL[g.category]}</div>
                        <div className="text-xs text-slate-400">
                          {g.awardType || g.subtype}
                          {g.shareClass ? ` · ${g.shareClass}` : ""}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-900">
                        {g.category === "convertible" ? "—" : intFmt.format(g.quantity)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                        {g.strikePrice != null ? `${currency} ${g.strikePrice}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Vesting schedules aren&apos;t carried over (Carta&apos;s export doesn&apos;t include
              the duration) — add them on each holding afterwards if you need them.
            </p>
          </div>
        )}

        <DialogFooter>
          {preview ? (
            <>
              <Button variant="ghost" onClick={reset} disabled={busy}>
                Choose a different file
              </Button>
              <Button onClick={onConfirm} disabled={busy}>
                {importing ? "Importing…" : `Import ${preview.grants.length} holding${preview.grants.length === 1 ? "" : "s"}`}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
