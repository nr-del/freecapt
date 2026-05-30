import { and, eq, isNull } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { getActiveCompany } from "@/lib/db/queries";
import { getPackForCompany, securityLabel } from "@/lib/packs/_shared/loader";
import { TYPE_LABEL, colorForType, intFmt, moneyFmt } from "@/lib/cap-table/display";

import { StakeholdersClient, type StakeholderRow } from "./stakeholders-client";

const { securities, stakeholders } = schema;

export default async function StakeholdersPage() {
  const company = await getActiveCompany();

  if (!company) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">No company yet</h1>
        <p className="mt-2 text-sm text-slate-500">
          Run <code className="rounded bg-slate-100 px-1.5 py-0.5">pnpm db:seed</code> to load the
          Acme demo, or add stakeholders below.
        </p>
      </main>
    );
  }

  const currency = company.currency.trim();
  const pack = getPackForCompany(company);

  const people = await db
    .select({
      id: stakeholders.id,
      fullName: stakeholders.fullName,
      email: stakeholders.email,
      type: stakeholders.type,
    })
    .from(stakeholders)
    .where(and(eq(stakeholders.companyId, company.id), isNull(stakeholders.deletedAt)));

  const holdings = await db
    .select({
      stakeholderId: securities.stakeholderId,
      category: securities.category,
      subtype: securities.subtype,
      quantity: securities.quantity,
      monetaryAmount: securities.monetaryAmount,
      monetaryCurrency: securities.monetaryCurrency,
    })
    .from(securities)
    .where(and(eq(securities.companyId, company.id), isNull(securities.deletedAt)));

  // Fully-diluted base: all issued equity units + granted options.
  let fullyDilutedTotal = 0;
  for (const h of holdings) {
    if (h.category === "equity_unit" || h.category === "option_like") {
      fullyDilutedTotal += Number(h.quantity ?? 0);
    }
  }

  const byStakeholder = new Map<string, typeof holdings>();
  for (const h of holdings) {
    const list = byStakeholder.get(h.stakeholderId) ?? [];
    list.push(h);
    byStakeholder.set(h.stakeholderId, list);
  }

  const rows: StakeholderRow[] = people.map((p) => {
    const list = byStakeholder.get(p.id) ?? [];
    let ownedUnits = 0;
    const parts: string[] = [];
    for (const h of list) {
      const label = securityLabel(pack, h.category, h.subtype, company.entityType);
      if (h.category === "convertible") {
        const amount = Number(h.monetaryAmount ?? 0);
        const cur = (h.monetaryCurrency ?? currency).trim();
        parts.push(`${moneyFmt(amount, cur)} ${label}`);
      } else {
        const qty = Number(h.quantity ?? 0);
        ownedUnits += qty;
        parts.push(`${intFmt.format(qty)} ${label}`);
      }
    }
    return {
      id: p.id,
      name: p.fullName,
      typeLabel: TYPE_LABEL[p.type] ?? "Other",
      color: colorForType(p.type),
      email: p.email,
      holdingsLabel: parts.length > 0 ? parts.join(" · ") : "-",
      fullyDilutedPct: ownedUnits > 0 && fullyDilutedTotal > 0 ? (ownedUnits / fullyDilutedTotal) * 100 : null,
    } satisfies StakeholderRow;
  });

  // Founders first, then by ownership desc.
  rows.sort((a, b) => (b.fullyDilutedPct ?? -1) - (a.fullyDilutedPct ?? -1));

  return <StakeholdersClient companyName={company.displayName} rows={rows} />;
}
