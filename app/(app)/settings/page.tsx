import { getActiveCompany } from "@/lib/db/queries";
import { AVAILABLE_PACKS, getPackForCompany } from "@/lib/packs/_shared/loader";

import { SettingsClient, type JurisdictionOption } from "./settings-client";

export default async function SettingsPage() {
  const company = await getActiveCompany();

  if (!company) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">No company yet</h1>
        <p className="mt-2 text-sm text-slate-500">
          Run <code className="rounded bg-slate-100 px-1.5 py-0.5">pnpm db:seed</code> to load the
          Acme demo.
        </p>
      </main>
    );
  }

  const pack = getPackForCompany(company);

  // One option per supported entity type, grouped under its pack.
  const options: JurisdictionOption[] = AVAILABLE_PACKS.flatMap((p) =>
    p.entityTypes.map((et) => ({
      value: et.code,
      label: `${et.englishName} (${et.localName})`,
      packName: p.displayName,
      currency: p.currency,
    })),
  );

  return (
    <SettingsClient
      companyName={company.displayName}
      currentEntityType={company.entityType}
      currentJurisdiction={company.jurisdiction.toUpperCase()}
      currentCurrency={company.currency.trim()}
      currentPackVersion={company.packVersion}
      registryLabel={pack.registryId.label}
      registryValue={company.registryIdentifier}
      options={options}
    />
  );
}
