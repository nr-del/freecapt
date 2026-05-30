"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateCompanyJurisdiction } from "./actions";

export type JurisdictionOption = {
  value: string; // entity type code, e.g. "dk-aps"
  label: string; // "Private limited company (Anpartsselskab (ApS))"
  packName: string; // "Denmark - ApS / A/S"
  currency: string; // "DKK"
};

export function SettingsClient({
  companyName,
  currentEntityType,
  currentJurisdiction,
  currentCurrency,
  currentPackVersion,
  registryLabel,
  registryValue,
  options,
}: {
  companyName: string;
  currentEntityType: string;
  currentJurisdiction: string;
  currentCurrency: string;
  currentPackVersion: string;
  registryLabel: string;
  registryValue: string | null;
  options: JurisdictionOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(currentEntityType);

  const onChange = (value: string) => {
    if (value === currentEntityType) return;
    setSelected(value);
    startTransition(async () => {
      const result = await updateCompanyJurisdiction(value);
      if (result.ok) {
        const opt = options.find((o) => o.value === value);
        toast.success(`Jurisdiction updated${opt ? ` to ${opt.packName}` : ""}.`);
        router.refresh();
      } else {
        setSelected(currentEntityType);
        toast.error(result.error);
      }
    });
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{companyName}</h1>
        <p className="text-sm text-slate-500">Settings</p>
      </header>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Jurisdiction &amp; entity type</h2>
        <p className="mt-1 text-sm text-slate-500">
          The country pack drives instrument names, labels, and validation rules across the cap
          table.
        </p>

        <div className="mt-4 max-w-sm">
          <Select value={selected} onValueChange={onChange} disabled={pending}>
            <SelectTrigger aria-label="Entity type">
              <SelectValue placeholder="Select an entity type" />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pending && <p className="mt-2 text-xs text-slate-400">Updating…</p>}
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Field label="Jurisdiction" value={currentJurisdiction} />
          <Field label="Currency" value={currentCurrency} />
          <Field label="Pack version" value={currentPackVersion} mono />
          <Field label={registryLabel} value={registryValue ?? "-"} mono />
        </dl>
      </section>
    </main>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className={`mt-0.5 text-slate-900 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
