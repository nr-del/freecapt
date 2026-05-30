// Server-side loader that turns a company's live cap table into the
// fully-diluted holder + SAFE lines the simulation engines consume. Shared by
// the /simulate page and the round-model term-sheet route so both price a round
// off the exact same authoritative pre-round table.
import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import type { ActiveCompany } from "@/lib/db/queries";
import { getPackForCompany, securityLabel } from "@/lib/packs/_shared/loader";
import type { SimHolder, SimSafe } from "@/lib/simulate/engine";

const { securities, stakeholders } = schema;

export type SimData = {
  holders: SimHolder[];
  safes: SimSafe[];
  outstanding: number; // issued equity units
  grantedOptions: number; // granted (not pooled) options
  unallocatedPool: number;
};

export async function loadSimData(company: ActiveCompany): Promise<SimData> {
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

  return { holders, safes, outstanding, grantedOptions, unallocatedPool };
}
