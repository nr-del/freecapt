import { and, eq, isNull } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { getActiveCompany } from "@/lib/db/queries";
import { getPackForCompany, securityLabel } from "@/lib/packs/_shared/loader";
import type { SimHolder, SimSafe } from "@/lib/simulate/engine";

import { SimulateClient } from "./simulate-client";

const { securities, stakeholders } = schema;

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
  const authorized = Number(company.authorizedUnits ?? 0);
  const pack = getPackForCompany(company);

  const holdings = await db
    .select({
      securityId: securities.id,
      category: securities.category,
      subtype: securities.subtype,
      quantity: securities.quantity,
      monetaryAmount: securities.monetaryAmount,
      capAmount: securities.capAmount,
      discountPercent: securities.discountPercent,
      stakeholderName: stakeholders.fullName,
      stakeholderType: stakeholders.type,
    })
    .from(securities)
    .innerJoin(stakeholders, eq(securities.stakeholderId, stakeholders.id))
    .where(and(eq(securities.companyId, company.id), isNull(securities.deletedAt)));

  const holders: SimHolder[] = [];
  const safes: SimSafe[] = [];
  let outstanding = 0;
  let grantedOptions = 0;

  for (const h of holdings) {
    if (h.category === "convertible") {
      const amount = Number(h.monetaryAmount ?? 0);
      if (amount <= 0) continue;
      safes.push({
        id: h.securityId,
        name: `${h.stakeholderName} · ${securityLabel(pack, h.category, h.subtype, company.entityType)}`,
        type: h.stakeholderType,
        amount,
        cap: Number(h.capAmount ?? 0) || undefined,
        discountPercent: Number(h.discountPercent ?? 0) || undefined,
      });
      continue;
    }
    const qty = Number(h.quantity ?? 0);
    if (qty <= 0) continue;
    if (h.category === "equity_unit") outstanding += qty;
    else grantedOptions += qty;
    holders.push({
      id: h.securityId,
      name: h.stakeholderName,
      type: h.stakeholderType,
      kind: h.category === "equity_unit" ? "equity" : "option",
      shares: qty,
    });
  }

  // Unallocated pool as a synthetic pre-round line (fully-diluted).
  const unallocatedPool = Math.max(0, authorized - outstanding - grantedOptions);
  if (unallocatedPool > 0) {
    holders.push({
      id: "pool",
      name: "Unallocated pool",
      type: "pool",
      kind: "pool",
      shares: unallocatedPool,
    });
  }

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
