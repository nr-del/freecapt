"use client";

// Single-stakeholder add (§5.15). A structured form — name/email/type/entity
// plus an optional first grant (security from the jurisdiction's instrument
// catalog, share class, quantity or invested amount, vesting, strike) — that
// replaces the old "one row of the bulk grid" single-add. Bulk paste stays for
// migrating many at once.
import { useMemo, useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStakeholder } from "@/app/(app)/stakeholders/actions";

export type SecurityCategory = "equity_unit" | "option_like" | "convertible";

export type InstrumentOption = {
  subtype: string;
  label: string;
  category: SecurityCategory;
};

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "founder", label: "Founder" },
  { value: "employee", label: "Employee" },
  { value: "investor", label: "Investor" },
  { value: "advisor", label: "Advisor" },
  { value: "entity", label: "Entity" },
  { value: "other", label: "Other" },
];

const FREQUENCIES = ["monthly", "quarterly", "annually"] as const;

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

const blankGrant = (): GrantDraft => ({
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
});

export function AddStakeholderModal({
  open,
  onOpenChange,
  instruments,
  shareClassNames,
  currency,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  instruments: InstrumentOption[];
  shareClassNames: string[];
  currency: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("employee");
  const [isEntity, setIsEntity] = useState(false);
  const [entityRegistryId, setEntityRegistryId] = useState("");
  const [notes, setNotes] = useState("");

  const [addGrant, setAddGrant] = useState(true);
  const [grant, setGrant] = useState<GrantDraft>(blankGrant());

  const selectedInstrument = useMemo(
    () => instruments.find((i) => i.subtype === grant.subtype) ?? null,
    [instruments, grant.subtype],
  );
  const category = selectedInstrument?.category ?? null;
  const isMoney = category === "convertible";
  const isOption = category === "option_like";
  const showVesting = category === "equity_unit" || category === "option_like";

  const reset = () => {
    setFullName("");
    setEmail("");
    setType("employee");
    setIsEntity(false);
    setEntityRegistryId("");
    setNotes("");
    setAddGrant(true);
    setGrant(blankGrant());
  };

  const close = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const save = () => {
    const name = fullName.trim();
    if (!name) {
      toast.error("Give the stakeholder a name.");
      return;
    }
    if (addGrant && !grant.subtype) {
      toast.error("Pick a security, or turn off the grant.");
      return;
    }
    if (addGrant && category && !isMoney && !grant.quantity.trim()) {
      toast.error("Enter a quantity for the grant.");
      return;
    }
    if (addGrant && isMoney && !grant.amount.trim()) {
      toast.error("Enter the invested amount.");
      return;
    }

    startTransition(async () => {
      const res = await createStakeholder({
        fullName: name,
        email,
        type,
        isEntity,
        entityRegistryId,
        notes,
        grant:
          addGrant && category
            ? {
                category,
                subtype: grant.subtype,
                shareClass: grant.shareClass,
                quantity: grant.quantity,
                amount: grant.amount,
                issueDate: grant.issueDate,
                strikePrice: grant.strikePrice,
                capAmount: grant.capAmount,
                discountPercent: grant.discountPercent,
                vestingTotalMonths: grant.vestingTotalMonths,
                vestingCliffMonths: grant.vestingCliffMonths,
                vestingFrequency: grant.vestingFrequency,
                taxScheme: "",
              }
            : null,
      });
      if (res.ok) {
        toast.success(`${name} added.`);
        reset();
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const setG = (patch: Partial<GrantDraft>) => setGrant((g) => ({ ...g, ...patch }));
  const num = (v: string) => v.replace(/[^0-9.]/g, "");

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a stakeholder</DialogTitle>
          <DialogDescription>
            Add the person or entity and, if you like, their first holding. You can edit everything
            later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* --- Identity --- */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="sh-name">Name</Label>
              <Input
                id="sh-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Anna Founder"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sh-email">Email</Label>
              <Input
                id="sh-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anna@acme.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sh-type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="sh-type" className="mt-1">
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
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isEntity}
              onChange={(e) => setIsEntity(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            This stakeholder is a company or other entity
          </label>
          {isEntity ? (
            <div>
              <Label htmlFor="sh-reg">Entity registry ID</Label>
              <Input
                id="sh-reg"
                value={entityRegistryId}
                onChange={(e) => setEntityRegistryId(e.target.value)}
                placeholder="Company / registration number"
                className="mt-1"
              />
            </div>
          ) : null}

          {/* --- Grant --- */}
          <div className="rounded-lg border border-slate-200">
            <label className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                checked={addGrant}
                onChange={(e) => setAddGrant(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Add a holding now
            </label>

            {addGrant ? (
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sh-sec">Security</Label>
                    <Select value={grant.subtype} onValueChange={(v) => setG({ subtype: v })}>
                      <SelectTrigger id="sh-sec" className="mt-1">
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
                    <Label htmlFor="sh-date">Issue date</Label>
                    <Input
                      id="sh-date"
                      type="date"
                      value={grant.issueDate}
                      onChange={(e) => setG({ issueDate: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                {isMoney ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sh-amount">Invested amount ({currency})</Label>
                      <Input
                        id="sh-amount"
                        inputMode="decimal"
                        value={grant.amount}
                        onChange={(e) => setG({ amount: num(e.target.value) })}
                        placeholder="250000"
                        className="mt-1 tabular-nums"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sh-cap">Valuation cap ({currency})</Label>
                      <Input
                        id="sh-cap"
                        inputMode="decimal"
                        value={grant.capAmount}
                        onChange={(e) => setG({ capAmount: num(e.target.value) })}
                        placeholder="optional"
                        className="mt-1 tabular-nums"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sh-disc">Discount (%)</Label>
                      <Input
                        id="sh-disc"
                        inputMode="decimal"
                        value={grant.discountPercent}
                        onChange={(e) => setG({ discountPercent: num(e.target.value) })}
                        placeholder="optional"
                        className="mt-1 tabular-nums"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sh-qty">Quantity</Label>
                        <Input
                          id="sh-qty"
                          inputMode="numeric"
                          value={grant.quantity}
                          onChange={(e) => setG({ quantity: num(e.target.value) })}
                          placeholder="100000"
                          className="mt-1 tabular-nums"
                        />
                      </div>
                      <div>
                        <Label htmlFor="sh-class">Share class</Label>
                        <Input
                          id="sh-class"
                          list="sh-class-list"
                          value={grant.shareClass}
                          onChange={(e) => setG({ shareClass: e.target.value })}
                          placeholder="Common"
                          className="mt-1"
                        />
                        <datalist id="sh-class-list">
                          {shareClassNames.map((n) => (
                            <option key={n} value={n} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {isOption ? (
                      <div>
                        <Label htmlFor="sh-strike">Strike price ({currency})</Label>
                        <Input
                          id="sh-strike"
                          inputMode="decimal"
                          value={grant.strikePrice}
                          onChange={(e) => setG({ strikePrice: num(e.target.value) })}
                          placeholder="0.50"
                          className="mt-1 tabular-nums"
                        />
                      </div>
                    ) : null}

                    {showVesting ? (
                      <div className="grid grid-cols-3 gap-3 rounded-md bg-slate-50 p-3">
                        <div>
                          <Label htmlFor="sh-vt" className="text-xs">
                            Vesting (months)
                          </Label>
                          <Input
                            id="sh-vt"
                            inputMode="numeric"
                            value={grant.vestingTotalMonths}
                            onChange={(e) =>
                              setG({ vestingTotalMonths: e.target.value.replace(/[^0-9]/g, "") })
                            }
                            placeholder="48"
                            className="mt-1 tabular-nums"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sh-vc" className="text-xs">
                            Cliff (months)
                          </Label>
                          <Input
                            id="sh-vc"
                            inputMode="numeric"
                            value={grant.vestingCliffMonths}
                            onChange={(e) =>
                              setG({ vestingCliffMonths: e.target.value.replace(/[^0-9]/g, "") })
                            }
                            placeholder="12"
                            className="mt-1 tabular-nums"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sh-vf" className="text-xs">
                            Frequency
                          </Label>
                          <Select
                            value={grant.vestingFrequency}
                            onValueChange={(v) => setG({ vestingFrequency: v })}
                          >
                            <SelectTrigger id="sh-vf" className="mt-1">
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
                )}
              </div>
            ) : null}
          </div>

          <div>
            <Label htmlFor="sh-notes">Notes</Label>
            <Input
              id="sh-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Add stakeholder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
