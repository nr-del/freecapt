"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { completeOnboarding } from "./actions";

export interface JurisdictionOption {
  code: string; // "dk" | "no" | "uk" | "us"
  label: string;
  currency: string;
  defaultTimezone: string;
  registryLabel: string;
  registryExample: string;
  defaultAuthorizedUnits: number;
  defaultParValue: number;
  entityTypes: Array<{ code: string; localName: string; englishName: string }>;
}

const LANGUAGES: Array<{ code: string; label: string }> = [
  { code: "en", label: "English" },
  { code: "da", label: "Dansk" },
  { code: "no", label: "Norsk" },
  { code: "sv", label: "Svenska" },
  { code: "de", label: "Deutsch" },
];

const TIMEZONES = [
  "Europe/Copenhagen",
  "Europe/Oslo",
  "Europe/Stockholm",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Zurich",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

const selectCls =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export function OnboardingClient({
  email,
  defaultName,
  defaultLanguage,
  jurisdictions,
}: {
  email: string;
  defaultName: string;
  defaultLanguage: string;
  jurisdictions: JurisdictionOption[];
}) {
  const first = jurisdictions[0]!;

  // Profile
  const [fullName, setFullName] = useState(defaultName);
  const [language, setLanguage] = useState(defaultLanguage);
  const [timezone, setTimezone] = useState(first.defaultTimezone);

  // Company
  const [jurisdiction, setJurisdiction] = useState(first.code);
  const [entityType, setEntityType] = useState(first.entityTypes[0]!.code);
  const [legalName, setLegalName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [currency, setCurrency] = useState(first.currency);
  const [registryIdentifier, setRegistryIdentifier] = useState("");
  const [incorporationDate, setIncorporationDate] = useState("");
  const [authorizedUnits, setAuthorizedUnits] = useState(String(first.defaultAuthorizedUnits || ""));
  const [parValue, setParValue] = useState(String(first.defaultParValue || ""));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pack = useMemo(
    () => jurisdictions.find((j) => j.code === jurisdiction) ?? first,
    [jurisdiction, jurisdictions, first],
  );

  // When the jurisdiction changes, re-seed the pack-derived fields so the form
  // always reflects the chosen country's currency, units, and registry label.
  const onJurisdictionChange = (code: string) => {
    const next = jurisdictions.find((j) => j.code === code) ?? first;
    setJurisdiction(code);
    setEntityType(next.entityTypes[0]!.code);
    setCurrency(next.currency);
    setTimezone(next.defaultTimezone);
    setAuthorizedUnits(String(next.defaultAuthorizedUnits || ""));
    setParValue(String(next.defaultParValue || ""));
  };

  const canSubmit = fullName.trim() && legalName.trim() && displayName.trim() && !submitting;

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    const res = await completeOnboarding({
      fullName,
      language: language as "en" | "da" | "no" | "sv" | "de",
      timezone,
      entityType: entityType as never,
      legalName,
      displayName,
      currency,
      registryIdentifier: registryIdentifier || undefined,
      incorporationDate: incorporationDate || undefined,
      authorizedUnits: authorizedUnits ? Number(authorizedUnits) : undefined,
      parValue: parValue ? Number(parValue) : undefined,
    }).catch(() => null);
    // On success the action redirects; we only get here with an error.
    if (res && !res.ok) {
      setError(res.error);
      toast.error(res.error);
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <p className="text-sm font-bold tracking-tight text-slate-900">
          Free<span className="text-brand-600">C</span>apT
        </p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Set up your company</h1>
        <p className="mt-1 text-sm text-slate-500">
          A couple of details and your cap table is ready. You can change all of this later in
          Settings.
        </p>
      </header>

      <div className="space-y-8">
        {/* Profile */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Your profile</h2>
          <p className="text-xs text-slate-500">Signed in as {email}</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Founder"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`mt-1 ${selectCls}`}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="timezone">Time zone</Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={`mt-1 ${selectCls}`}
              >
                {/* Include the pack default even if it's not in the curated list. */}
                {Array.from(new Set([pack.defaultTimezone, ...TIMEZONES])).map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Company */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Your company</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <select
                id="jurisdiction"
                value={jurisdiction}
                onChange={(e) => onJurisdictionChange(e.target.value)}
                className={`mt-1 ${selectCls}`}
              >
                {jurisdictions.map((j) => (
                  <option key={j.code} value={j.code}>
                    {j.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="entityType">Entity type</Label>
              <select
                id="entityType"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className={`mt-1 ${selectCls}`}
              >
                {pack.entityTypes.map((e) => (
                  <option key={e.code} value={e.code}>
                    {e.localName} — {e.englishName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="legalName">Legal name</Label>
              <Input
                id="legalName"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Acme Holding ApS"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Acme"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
                maxLength={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="registry">{pack.registryLabel}</Label>
              <Input
                id="registry"
                value={registryIdentifier}
                onChange={(e) => setRegistryIdentifier(e.target.value)}
                placeholder={pack.registryExample || "Optional"}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="incorporationDate">Incorporation date</Label>
              <Input
                id="incorporationDate"
                type="date"
                value={incorporationDate}
                onChange={(e) => setIncorporationDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="authorizedUnits">Authorized shares</Label>
              <Input
                id="authorizedUnits"
                inputMode="numeric"
                value={authorizedUnits}
                onChange={(e) => setAuthorizedUnits(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="10000000"
                className="mt-1 tabular-nums"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Defaults come from the {pack.label} pack — adjust them to match your founding documents.
          </p>
        </section>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex items-center justify-end gap-3">
          <Button onClick={submit} disabled={!canSubmit}>
            {submitting ? "Creating…" : "Create company"}
          </Button>
        </div>
      </div>
    </main>
  );
}
