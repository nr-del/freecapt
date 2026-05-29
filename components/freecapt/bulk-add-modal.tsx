"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createStakeholdersBulk } from "@/app/(app)/stakeholders/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ExtractResponse } from "@/lib/ai/extract";
import {
  COLUMNS,
  emptyRow,
  parsePaste,
  validateRow,
  validRows,
  type BulkField,
  type BulkRow,
} from "@/lib/bulk-add/parse";
import { cn } from "@/lib/utils";

const PLACEHOLDER = `Anna Founder\tanna@acme.com\tfounder\tcommon\t4000000\t2024-01-15
Ben Founder\tben@acme.com\tfounder\tcommon\t3000000\t2024-01-15
Dana\tdana@acme.com\temployee\tISO\t200000\t2024-06-01\t4y/1y`;

export function BulkAddModal({
  open,
  onOpenChange,
  onUpgrade,
  startRows = 3,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: (feature: string) => void;
  startRows?: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("paste");
  const [rows, setRows] = useState<BulkRow[]>(() =>
    Array.from({ length: Math.max(1, startRows) }, emptyRow),
  );
  const [pasteText, setPasteText] = useState("");
  const [aiText, setAiText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setTab("paste");
    setRows(Array.from({ length: Math.max(1, startRows) }, emptyRow));
    setPasteText("");
    setAiText("");
    setAssumptions([]);
    setExtracting(false);
  };

  // AI "type it out" → server extraction → editable grid (free one time per
  // account; a 402 means the free use is spent and routes to the paywall).
  const extractWithAi = async () => {
    const text = aiText.trim();
    if (text.length < 3) {
      toast.error("Describe your cap table first.");
      return;
    }
    setExtracting(true);
    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as ExtractResponse;
      if (!data.ok) {
        if (data.paywall) {
          onUpgrade("AI “type it out” bulk add");
        } else {
          toast.error(data.error);
        }
        return;
      }
      if (data.rows.length === 0) {
        toast.error("Couldn't find any stakeholders in that. Try adding more detail.");
        return;
      }
      setRows(data.rows);
      setAssumptions(data.assumptions);
      setTab("paste");
      toast.success(
        `Drafted ${data.rows.length} ${data.rows.length === 1 ? "stakeholder" : "stakeholders"} — review and edit below.`,
      );
    } catch {
      toast.error("The AI helper isn't available right now. Try Paste instead.");
    } finally {
      setExtracting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const updateCell = (index: number, field: BulkField, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const applyPaste = () => {
    const parsed = parsePaste(pasteText);
    if (parsed.length === 0) {
      toast.error("Nothing to parse — paste some rows first.");
      return;
    }
    setRows(parsed);
    setPasteText("");
    toast.success(`Loaded ${parsed.length} ${parsed.length === 1 ? "row" : "rows"}.`);
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (index: number) =>
    setRows((prev) => (prev.length === 1 ? [emptyRow()] : prev.filter((_, i) => i !== index)));

  const ready = validRows(rows);
  const count = ready.length;

  const submit = () => {
    if (count === 0) return;
    startTransition(async () => {
      const result = await createStakeholdersBulk(rows);
      if (result.ok) {
        toast.success(
          `Added ${result.count} ${result.count === 1 ? "stakeholder" : "stakeholders"}.`,
        );
        handleOpenChange(false);
        router.push("/cap-table");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] w-full max-w-4xl overflow-y-auto p-0">
        <DialogHeader className="border-b border-slate-100 p-5">
          <DialogTitle className="text-lg font-semibold">Bulk add stakeholders</DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-slate-500">
            Add everyone at once. You can edit and add more later.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="p-5">
          <TabsList className="mb-4">
            <TabsTrigger value="paste">Paste from spreadsheet</TabsTrigger>
            <TabsTrigger value="type" className="gap-1.5">
              Type it out
              <Badge variant="paid" className="bg-brand-100 text-brand-700">
                AI
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-1.5">
              Upload documents <Badge variant="paid">Paid</Badge>
            </TabsTrigger>
          </TabsList>

          {/* --- Paste (Free) --- */}
          <TabsContent value="paste" className="space-y-4">
            {assumptions.length > 0 && (
              <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-xs text-brand-800">
                <div className="mb-1 font-semibold">What the AI assumed — double-check these:</div>
                <ul className="list-disc space-y-0.5 pl-4">
                  {assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="space-y-2">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={PLACEHOLDER}
                rows={3}
                className="w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700 placeholder:text-slate-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Paste columns in any order — we auto-detect name, email, type, security,
                  quantity, date, vesting, strike.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={applyPaste}>
                  Parse rows
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    {COLUMNS.map((c) => (
                      <th key={c.key} className="px-2 py-2 text-left font-semibold">
                        {c.label}
                      </th>
                    ))}
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, i) => {
                    const errors = validateRow(row);
                    return (
                      <tr key={i}>
                        {COLUMNS.map((c) => (
                          <td key={c.key} className="px-1 py-1">
                            <input
                              value={row[c.key]}
                              onChange={(e) => updateCell(i, c.key, e.target.value)}
                              title={errors[c.key]}
                              aria-invalid={errors[c.key] ? true : undefined}
                              className={cn(
                                "w-full min-w-[7rem] rounded border bg-white px-2 py-1 text-sm text-slate-800 focus:outline-none focus:ring-1",
                                errors[c.key]
                                  ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                                  : "border-slate-200 focus:border-brand-500 focus:ring-brand-500",
                              )}
                            />
                          </td>
                        ))}
                        <td className="px-1 py-1 text-right">
                          <button
                            type="button"
                            onClick={() => removeRow(i)}
                            aria-label="Remove row"
                            className="px-2 text-slate-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Button type="button" variant="ghost" size="sm" onClick={addRow}>
              + Add row
            </Button>
          </TabsContent>

          {/* --- Type it out (AI extraction; free one time per account) --- */}
          <TabsContent value="type" className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Describe your cap table in plain words
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Type it out — “Anna and Ben are cofounders at 30% each, Dana has 200k options” —
                and AI turns it into a draft you can review and edit. Free once.
              </p>
              <textarea
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                rows={5}
                placeholder="Anna 30%, Ben 30%, Chris 18%, Dana has 200k options vesting 4y/1y…"
                className="mt-3 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Percentages become notes — we won&apos;t invent share counts.
                </p>
                <Button type="button" onClick={extractWithAi} disabled={extracting}>
                  {extracting ? "Reading…" : "Draft with AI →"}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* --- Upload (Paid stub) --- */}
          <TabsContent value="upload">
            <PaidStub
              title="Upload formation docs or a cap-table file"
              body="Drop in PDFs or spreadsheets and AI extracts the stakeholders and grants for review. Available on Paid."
              onUpgrade={() => onUpgrade("AI document extraction")}
            />
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50 p-4">
          <span className="text-xs text-slate-500">
            {count > 0
              ? `Will create ${count} ${count === 1 ? "stakeholder" : "stakeholders"} & ${count} ${count === 1 ? "transaction" : "transactions"}.`
              : "Fill in at least one valid row."}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={count === 0 || pending}>
              {pending
                ? "Creating…"
                : `Create ${count} ${count === 1 ? "stakeholder" : "stakeholders"} →`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PaidStub({
  title,
  body,
  onUpgrade,
}: {
  title: string;
  body: string;
  onUpgrade: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-xl text-brand-700">
        ✦
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">{body}</p>
      <Button type="button" size="sm" className="mt-4" onClick={onUpgrade}>
        Upgrade — $15/month →
      </Button>
    </div>
  );
}
