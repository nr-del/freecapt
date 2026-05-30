"use client";

// Stakeholder detail + edit (§5.7). View and edit a person/entity's profile,
// manage their holdings (add / edit / remove), and send them a portal invite.
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Pencil, Plus, Trash2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InstrumentOption, SecurityCategory } from "@/components/freecapt/add-stakeholder-modal";
import {
  createSecurityForStakeholder,
  deleteSecurity,
  deleteStakeholder,
  sendStakeholderInvite,
  updateSecurity,
  updateStakeholder,
  type GrantInput,
} from "../actions";

export type HoldingView = {
  id: string;
  label: string;
  category: SecurityCategory;
  subtype: string;
  quantity: string | null;
  amount: string | null;
  valueLabel: string;
  shareClass: string | null;
  strikePrice: string | null;
  capAmount: string | null;
  discountPercent: string | null;
  strikeLabel: string | null;
  vestingStartDate: string | null;
  vestingTotalMonths: number | null;
  vestingCliffMonths: number | null;
  vestingFrequency: string | null;
  vestingSummary: string;
  status: string;
};

type Stakeholder = {
  id: string;
  fullName: string;
  email: string | null;
  type: string;
  typeLabel: string;
  isEntity: boolean;
  entityRegistryId: string | null;
  notes: string | null;
  portalInvited: boolean;
  portalActive: boolean;
};

const TYPE_OPTIONS = [
  { value: "founder", label: "Founder" },
  { value: "employee", label: "Employee" },
  { value: "investor", label: "Investor" },
  { value: "advisor", label: "Advisor" },
  { value: "entity", label: "Entity" },
  { value: "other", label: "Other" },
];

const FREQUENCIES = ["monthly", "quarterly", "annually"] as const;

export function StakeholderDetailClient({
  companyName,
  stakeholder,
  holdings,
  instruments,
  shareClassNames,
  currency,
}: {
  companyName: string;
  stakeholder: Stakeholder;
  holdings: HoldingView[];
  instruments: InstrumentOption[];
  shareClassNames: string[];
  currency: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // --- profile edit ---
  const [fullName, setFullName] = useState(stakeholder.fullName);
  const [email, setEmail] = useState(stakeholder.email ?? "");
  const [type, setType] = useState(stakeholder.type);
  const [isEntity, setIsEntity] = useState(stakeholder.isEntity);
  const [entityRegistryId, setEntityRegistryId] = useState(stakeholder.entityRegistryId ?? "");
  const [notes, setNotes] = useState(stakeholder.notes ?? "");

  const dirty =
    fullName !== stakeholder.fullName ||
    email !== (stakeholder.email ?? "") ||
    type !== stakeholder.type ||
    isEntity !== stakeholder.isEntity ||
    entityRegistryId !== (stakeholder.entityRegistryId ?? "") ||
    notes !== (stakeholder.notes ?? "");

  const saveProfile = () => {
    if (!fullName.trim()) {
      toast.error("Give the stakeholder a name.");
      return;
    }
    startTransition(async () => {
      const res = await updateStakeholder(stakeholder.id, {
        fullName,
        email,
        type,
        isEntity,
        entityRegistryId,
        notes,
      });
      if (res.ok) {
        toast.success("Saved.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  // --- grant dialog ---
  const [grantOpen, setGrantOpen] = useState(false);
  const [editing, setEditing] = useState<HoldingView | null>(null);

  const openAdd = () => {
    setEditing(null);
    setGrantOpen(true);
  };
  const openEdit = (h: HoldingView) => {
    setEditing(h);
    setGrantOpen(true);
  };

  // --- portal invite ---
  const invite = () => {
    if (!stakeholder.email) {
      toast.error("Add an email address first, then save.");
      return;
    }
    startTransition(async () => {
      const res = await sendStakeholderInvite(stakeholder.id);
      if (res.ok) {
        toast.success(`Invite sent to ${stakeholder.email}.`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  // --- delete ---
  const [confirmDelete, setConfirmDelete] = useState(false);
  const removeStakeholder = () => {
    startTransition(async () => {
      const res = await deleteStakeholder(stakeholder.id);
      if (res.ok) {
        toast.success("Stakeholder removed.");
        router.push("/stakeholders");
      } else {
        toast.error(res.error);
        setConfirmDelete(false);
      }
    });
  };

  const removeHolding = (h: HoldingView) => {
    startTransition(async () => {
      const res = await deleteSecurity(h.id);
      if (res.ok) {
        toast.success("Holding removed.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <button
        type="button"
        onClick={() => router.push("/stakeholders")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Stakeholders
      </button>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {stakeholder.fullName}
          </h1>
          <p className="text-sm text-slate-500">
            {stakeholder.typeLabel} · {companyName}
          </p>
        </div>
        {stakeholder.email ? (
          <Button variant="outline" onClick={invite} disabled={pending}>
            <Mail className="mr-1.5 h-4 w-4" />
            {stakeholder.portalActive
              ? "Portal active"
              : stakeholder.portalInvited
                ? "Resend invite"
                : "Send portal invite"}
          </Button>
        ) : null}
      </header>

      {/* --- Holdings --- */}
      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Holdings</h2>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" /> Add holding
          </Button>
        </div>

        {holdings.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No holdings yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Security</th>
                  <th className="px-4 py-2 text-right font-semibold">Quantity / amount</th>
                  <th className="px-4 py-2 text-left font-semibold">Class</th>
                  <th className="px-4 py-2 text-left font-semibold">Vesting</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {holdings.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      {h.label}
                      {h.strikeLabel ? (
                        <span className="ml-2 text-xs text-slate-400">@ {h.strikeLabel}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                      {h.valueLabel}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{h.shareClass ?? "—"}</td>
                    <td className="px-4 py-2.5 text-slate-600">{h.vestingSummary}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label="Edit holding"
                          onClick={() => openEdit(h)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove holding"
                          disabled={pending}
                          onClick={() => removeHolding(h)}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
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
      </section>

      {/* --- Details --- */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Details</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="d-name">Name</Label>
            <Input
              id="d-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="d-email">Email</Label>
            <Input
              id="d-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="d-type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="d-type" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isEntity}
              onChange={(e) => setIsEntity(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            This stakeholder is a company or other entity
          </label>
          {isEntity ? (
            <div className="col-span-2">
              <Label htmlFor="d-reg">Entity registry ID</Label>
              <Input
                id="d-reg"
                value={entityRegistryId}
                onChange={(e) => setEntityRegistryId(e.target.value)}
                className="mt-1"
              />
            </div>
          ) : null}
          <div className="col-span-2">
            <Label htmlFor="d-notes">Notes</Label>
            <Input
              id="d-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              className="mt-1"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={saveProfile} disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </section>

      {/* --- Danger zone --- */}
      <section className="mt-6 rounded-lg border border-red-200 bg-red-50/40 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Remove stakeholder</h2>
            <p className="text-xs text-slate-500">
              Removes {stakeholder.fullName} and their holdings from the cap table.
            </p>
          </div>
          <Button variant="outline" className="text-red-600" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Remove
          </Button>
        </div>
      </section>

      <GrantDialog
        open={grantOpen}
        onOpenChange={setGrantOpen}
        editing={editing}
        instruments={instruments}
        shareClassNames={shareClassNames}
        currency={currency}
        pending={pending}
        onSubmit={(grant) => {
          startTransition(async () => {
            const res = editing
              ? await updateSecurity(editing.id, grant)
              : await createSecurityForStakeholder(stakeholder.id, grant);
            if (res.ok) {
              toast.success(editing ? "Holding updated." : "Holding added.");
              setGrantOpen(false);
              setEditing(null);
              router.refresh();
            } else {
              toast.error(res.error);
            }
          });
        }}
      />

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove {stakeholder.fullName}?</DialogTitle>
            <DialogDescription>
              This removes them and their holdings from the cap table. You can re-add them later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={pending}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={removeStakeholder} disabled={pending}>
              {pending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

// --- Grant add/edit dialog ----------------------------------------------

type GrantDraft = {
  subtype: string;
  shareClass: string;
  quantity: string;
  amount: string;
  issueDate: string;
  strikePrice: string;
  capAmount: string;
  discountPercent: string;
  vestingTotalMonths: string;
  vestingCliffMonths: string;
  vestingFrequency: string;
};

function draftFromHolding(h: HoldingView | null): GrantDraft {
  if (!h) {
    return {
      subtype: "",
      shareClass: "",
      quantity: "",
      amount: "",
      issueDate: new Date().toISOString().slice(0, 10),
      strikePrice: "",
      capAmount: "",
      discountPercent: "",
      vestingTotalMonths: "",
      vestingCliffMonths: "",
      vestingFrequency: "monthly",
    };
  }
  return {
    subtype: h.subtype,
    shareClass: h.shareClass ?? "",
    quantity: h.quantity ?? "",
    amount: h.amount ?? "",
    issueDate: h.vestingStartDate ?? new Date().toISOString().slice(0, 10),
    strikePrice: h.strikePrice ?? "",
    capAmount: h.capAmount ?? "",
    discountPercent: h.discountPercent ?? "",
    vestingTotalMonths: h.vestingTotalMonths != null ? String(h.vestingTotalMonths) : "",
    vestingCliffMonths: h.vestingCliffMonths != null ? String(h.vestingCliffMonths) : "",
    vestingFrequency: h.vestingFrequency ?? "monthly",
  };
}

function GrantDialog({
  open,
  onOpenChange,
  editing,
  instruments,
  shareClassNames,
  currency,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: HoldingView | null;
  instruments: InstrumentOption[];
  shareClassNames: string[];
  currency: string;
  pending: boolean;
  onSubmit: (grant: GrantInput) => void;
}) {
  // Re-seed the draft whenever the dialog opens for a (different) holding.
  const [draft, setDraft] = useState<GrantDraft>(() => draftFromHolding(editing));
  const [seededFor, setSeededFor] = useState<string | null>(editing?.id ?? null);
  if (open && seededFor !== (editing?.id ?? "new")) {
    setDraft(draftFromHolding(editing));
    setSeededFor(editing?.id ?? "new");
  }
  if (!open && seededFor !== null) setSeededFor(null);

  const selected = useMemo(
    () => instruments.find((i) => i.subtype === draft.subtype) ?? null,
    [instruments, draft.subtype],
  );
  const category = selected?.category ?? null;
  const isMoney = category === "convertible";
  const isOption = category === "option_like";
  const showVesting = category === "equity_unit" || category === "option_like";

  const setG = (patch: Partial<GrantDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const num = (v: string) => v.replace(/[^0-9.]/g, "");

  const submit = () => {
    if (!category) {
      toast.error("Pick a security.");
      return;
    }
    onSubmit({
      category,
      subtype: draft.subtype,
      shareClass: draft.shareClass,
      quantity: draft.quantity,
      amount: draft.amount,
      issueDate: draft.issueDate,
      strikePrice: draft.strikePrice,
      capAmount: draft.capAmount,
      discountPercent: draft.discountPercent,
      vestingTotalMonths: draft.vestingTotalMonths,
      vestingCliffMonths: draft.vestingCliffMonths,
      vestingFrequency: draft.vestingFrequency,
      taxScheme: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit holding" : "Add holding"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Updates the live holding the cap table reads."
              : "Record a new holding for this stakeholder."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="g-sec">Security</Label>
              <Select value={draft.subtype} onValueChange={(v) => setG({ subtype: v })}>
                <SelectTrigger id="g-sec" className="mt-1">
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  {instruments.map((i) => (
                    <SelectItem key={i.subtype} value={i.subtype}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="g-date">Issue date</Label>
              <Input
                id="g-date"
                type="date"
                value={draft.issueDate}
                onChange={(e) => setG({ issueDate: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {isMoney ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="g-amount">Invested amount ({currency})</Label>
                <Input
                  id="g-amount"
                  inputMode="decimal"
                  value={draft.amount}
                  onChange={(e) => setG({ amount: num(e.target.value) })}
                  className="mt-1 tabular-nums"
                />
              </div>
              <div>
                <Label htmlFor="g-cap">Valuation cap ({currency})</Label>
                <Input
                  id="g-cap"
                  inputMode="decimal"
                  value={draft.capAmount}
                  onChange={(e) => setG({ capAmount: num(e.target.value) })}
                  placeholder="optional"
                  className="mt-1 tabular-nums"
                />
              </div>
              <div>
                <Label htmlFor="g-disc">Discount (%)</Label>
                <Input
                  id="g-disc"
                  inputMode="decimal"
                  value={draft.discountPercent}
                  onChange={(e) => setG({ discountPercent: num(e.target.value) })}
                  placeholder="optional"
                  className="mt-1 tabular-nums"
                />
              </div>
            </div>
          ) : category ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="g-qty">Quantity</Label>
                  <Input
                    id="g-qty"
                    inputMode="numeric"
                    value={draft.quantity}
                    onChange={(e) => setG({ quantity: num(e.target.value) })}
                    className="mt-1 tabular-nums"
                  />
                </div>
                <div>
                  <Label htmlFor="g-class">Share class</Label>
                  <Input
                    id="g-class"
                    list="g-class-list"
                    value={draft.shareClass}
                    onChange={(e) => setG({ shareClass: e.target.value })}
                    placeholder="Common"
                    className="mt-1"
                  />
                  <datalist id="g-class-list">
                    {shareClassNames.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </div>
              </div>
              {isOption ? (
                <div>
                  <Label htmlFor="g-strike">Strike price ({currency})</Label>
                  <Input
                    id="g-strike"
                    inputMode="decimal"
                    value={draft.strikePrice}
                    onChange={(e) => setG({ strikePrice: num(e.target.value) })}
                    className="mt-1 tabular-nums"
                  />
                </div>
              ) : null}
              {showVesting ? (
                <div className="grid grid-cols-3 gap-3 rounded-md bg-slate-50 p-3">
                  <div>
                    <Label htmlFor="g-vt" className="text-xs">
                      Vesting (months)
                    </Label>
                    <Input
                      id="g-vt"
                      inputMode="numeric"
                      value={draft.vestingTotalMonths}
                      onChange={(e) => setG({ vestingTotalMonths: e.target.value.replace(/[^0-9]/g, "") })}
                      placeholder="48"
                      className="mt-1 tabular-nums"
                    />
                  </div>
                  <div>
                    <Label htmlFor="g-vc" className="text-xs">
                      Cliff (months)
                    </Label>
                    <Input
                      id="g-vc"
                      inputMode="numeric"
                      value={draft.vestingCliffMonths}
                      onChange={(e) => setG({ vestingCliffMonths: e.target.value.replace(/[^0-9]/g, "") })}
                      placeholder="12"
                      className="mt-1 tabular-nums"
                    />
                  </div>
                  <div>
                    <Label htmlFor="g-vf" className="text-xs">
                      Frequency
                    </Label>
                    <Select value={draft.vestingFrequency} onValueChange={(v) => setG({ vestingFrequency: v })}>
                      <SelectTrigger id="g-vf" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map((f) => (
                          <SelectItem key={f} value={f} className="capitalize">
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="col-span-3 text-[11px] text-slate-400">
                    Leave months blank for a fully-vested holding.
                  </p>
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Saving…" : editing ? "Save holding" : "Add holding"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
