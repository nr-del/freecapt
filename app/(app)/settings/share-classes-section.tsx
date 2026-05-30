"use client";

// Share classes (§5.4): the named classes of equity a company issues. Founders
// can define each class's economics here — seniority, liquidation preference,
// participation, votes — and the catalog feeds the class picker when adding or
// editing a holding. A class that's still referenced by a holding can't be
// deleted until those holdings are reassigned.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createShareClass,
  deleteShareClass,
  updateShareClass,
  type ShareClassInput,
} from "./share-class-actions";

export interface ShareClassRowView {
  id: string;
  name: string;
  seniority: number;
  isPreferred: boolean;
  liquidationPreferenceMultiple: string | null;
  participating: boolean;
  votesPerShare: string | null;
  inUse: number;
}

type Draft = {
  id: string | null;
  name: string;
  seniority: string;
  isPreferred: boolean;
  liquidationPreferenceMultiple: string;
  participating: boolean;
  votesPerShare: string;
};

const blankDraft = (): Draft => ({
  id: null,
  name: "",
  seniority: "0",
  isPreferred: false,
  liquidationPreferenceMultiple: "",
  participating: false,
  votesPerShare: "1",
});

const toDraft = (c: ShareClassRowView): Draft => ({
  id: c.id,
  name: c.name,
  seniority: String(c.seniority),
  isPreferred: c.isPreferred,
  liquidationPreferenceMultiple: c.liquidationPreferenceMultiple ?? "",
  participating: c.participating,
  votesPerShare: c.votesPerShare ?? "",
});

export function ShareClassesSection({ classes }: { classes: ShareClassRowView[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft | null>(null);

  const save = () => {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) {
      toast.error("Give the class a name.");
      return;
    }
    const input: ShareClassInput = {
      name,
      seniority: draft.seniority.trim() === "" ? 0 : Number(draft.seniority),
      isPreferred: draft.isPreferred,
      liquidationPreferenceMultiple:
        draft.liquidationPreferenceMultiple.trim() === ""
          ? null
          : Number(draft.liquidationPreferenceMultiple),
      participating: draft.participating,
      votesPerShare: draft.votesPerShare.trim() === "" ? null : Number(draft.votesPerShare),
    };
    startTransition(async () => {
      const res = draft.id
        ? await updateShareClass(draft.id, input)
        : await createShareClass(input);
      if (res.ok) {
        toast.success(draft.id ? "Class updated." : "Class added.");
        setDraft(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const onDelete = (c: ShareClassRowView) => {
    if (c.inUse > 0) {
      toast.error("That class is still in use. Reassign those holdings first.");
      return;
    }
    startTransition(async () => {
      const res = await deleteShareClass(c.id);
      if (res.ok) {
        toast.success("Class removed.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Share classes</h2>
          <p className="text-xs text-slate-500">
            The classes of equity you issue. Used when adding holdings and in the cap table.
          </p>
        </div>
        <Button size="sm" onClick={() => setDraft(blankDraft())}>
          + Add class
        </Button>
      </div>

      {classes.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No classes yet. Most companies start with a single &ldquo;Common&rdquo; or
          &ldquo;Ordinary&rdquo; class.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Class</th>
                <th className="px-4 py-2 text-left font-semibold">Liq. pref</th>
                <th className="px-4 py-2 text-right font-semibold">Votes</th>
                <th className="px-4 py-2 text-right font-semibold">In use</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-slate-900">{c.name}</span>
                    <span className="ml-2 inline-flex gap-1 align-middle">
                      {c.isPreferred ? (
                        <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                          Preferred
                        </span>
                      ) : null}
                      {c.participating ? (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          Participating
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {c.liquidationPreferenceMultiple
                      ? `${Number(c.liquidationPreferenceMultiple)}×`
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                    {c.votesPerShare ? Number(c.votesPerShare) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{c.inUse}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        aria-label={`Edit ${c.name}`}
                        onClick={() => setDraft(toDraft(c))}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${c.name}`}
                        disabled={pending || c.inUse > 0}
                        title={c.inUse > 0 ? "In use — reassign holdings first" : undefined}
                        onClick={() => onDelete(c)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={draft != null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit share class" : "Add share class"}</DialogTitle>
            <DialogDescription>
              Renaming a class updates every holding that uses it.
            </DialogDescription>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="sc-name">Name</Label>
                <Input
                  id="sc-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Ordinary A-shares"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sc-seniority">Seniority</Label>
                  <Input
                    id="sc-seniority"
                    inputMode="numeric"
                    value={draft.seniority}
                    onChange={(e) =>
                      setDraft({ ...draft, seniority: e.target.value.replace(/[^0-9-]/g, "") })
                    }
                    placeholder="0"
                    className="mt-1 tabular-nums"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Higher = paid out first.</p>
                </div>
                <div>
                  <Label htmlFor="sc-votes">Votes / share</Label>
                  <Input
                    id="sc-votes"
                    inputMode="decimal"
                    value={draft.votesPerShare}
                    onChange={(e) =>
                      setDraft({ ...draft, votesPerShare: e.target.value.replace(/[^0-9.]/g, "") })
                    }
                    placeholder="1"
                    className="mt-1 tabular-nums"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={draft.isPreferred}
                  onChange={(e) => setDraft({ ...draft, isPreferred: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Preferred class
              </label>
              {draft.isPreferred ? (
                <div className="grid grid-cols-2 gap-4 rounded-md bg-slate-50 p-3">
                  <div>
                    <Label htmlFor="sc-liq">Liquidation pref (×)</Label>
                    <Input
                      id="sc-liq"
                      inputMode="decimal"
                      value={draft.liquidationPreferenceMultiple}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          liquidationPreferenceMultiple: e.target.value.replace(/[^0-9.]/g, ""),
                        })
                      }
                      placeholder="1"
                      className="mt-1 tabular-nums"
                    />
                  </div>
                  <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={draft.participating}
                      onChange={(e) => setDraft({ ...draft, participating: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Participating
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={save} disabled={pending}>
              {pending ? "Saving…" : draft?.id ? "Save changes" : "Add class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
