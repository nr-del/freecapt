import { getActiveCompany } from "@/lib/db/queries";
import { loadSimData } from "@/lib/simulate/load";

import { SimulateClient } from "./simulate-client";

export default async function SimulatePage() {
  const company = await getActiveCompany();

  if (!company) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">No cap table yet</h1>
        <p className="mt-2 text-sm text-slate-500">
          Run <code className="rounded bg-slate-100 px-1.5 py-0.5">pnpm db:seed</code> to load the
          Acme demo, then come back to model a round.
        </p>
      </main>
    );
  }

  const currency = company.currency.trim();
  const { holders, safes } = await loadSimData(company);

  return (
    <SimulateClient
      companyName={company.displayName}
      companyId={company.id}
      currency={currency}
      holders={holders}
      safes={safes}
    />
  );
}
