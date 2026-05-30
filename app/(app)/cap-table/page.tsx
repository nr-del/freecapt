import { and, eq, isNull } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { getActiveCompany } from "@/lib/db/queries";
import { getPackForCompany, securityLabel } from "@/lib/packs/_shared/loader";
import {
  POOL_COLOR,
  TYPE_COLOR,
  TYPE_LABEL,
  TYPE_RANK,
  intFmt,
  moneyFmt,
} from "@/lib/cap-table/display";

import { CapTableClient, type CapRow, type Slice } from "./cap-table-client";

const { securities, stakeholders } = schema;

export default async function CapTablePage() {
  const company = await getActiveCompany();

  if (!company) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">No cap table yet</h1>
        <p className="mt-2 text-sm text-slate-500">
          Run <code className="rounded bg-slate-100 px-1.5 py-0.5">pnpm db:seed</code> to load the
          Acme demo.
        </p>
      </main>
    );
  }

  const currency = company.currency.trim();
  const authorized = Number(company.authorizedUnits ?? 0);
  const pack = getPackForCompany(company);
  const unitNoun = pack.equityUnitNoun(company.entityType);

  const holdings = await db
    .select({
      securityId: securities.id,
      category: securities.category,
      subtype: securities.subtype,
      quantity: securities.quantity,
      monetaryAmount: securities.monetaryAmount,
      monetaryCurrency: securities.monetaryCurrency,
      capAmount: securities.capAmount,
      discountPercent: securities.discountPercent,
      stakeholderName: stakeholders.fullName,
      stakeholderType: stakeholders.type,
    })
    .from(securities)
    .innerJoin(stakeholders, eq(securities.stakeholderId, stakeholders.id))
    .where(and(eq(securities.companyId, company.id), isNull(securities.deletedAt)));

  let totalOutstanding = 0; // issued equity units
  let totalGrantedOptions = 0;
  for (const h of holdings) {
    const qty = Number(h.quantity ?? 0);
    if (h.category === "equity_unit") totalOutstanding += qty;
    else if (h.category === "option_like") totalGrantedOptions += qty;
  }
  const unallocatedPool = Math.max(0, authorized - totalOutstanding - totalGrantedOptions);
  const fullyDilutedTotal = totalOutstanding + totalGrantedOptions + unallocatedPool;

  const rows: CapRow[] = holdings
    .slice()
    .sort((a, b) => {
      const r = (TYPE_RANK[a.stakeholderType] ?? 9) - (TYPE_RANK[b.stakeholderType] ?? 9);
      if (r !== 0) return r;
      return Number(b.quantity ?? 0) - Number(a.quantity ?? 0);
    })
    .map((h) => {
      const qty = Number(h.quantity ?? 0);
      const color = TYPE_COLOR[h.stakeholderType] ?? POOL_COLOR;
      const label = securityLabel(pack, h.category, h.subtype, company.entityType);

      if (h.category === "convertible") {
        const amount = Number(h.monetaryAmount ?? 0);
        const cur = (h.monetaryCurrency ?? currency).trim();
        const cap = Number(h.capAmount ?? 0);
        const disc = Number(h.discountPercent ?? 0);
        const sub = [
          `${moneyFmt(amount, cur)} invested`,
          cap ? `${moneyFmt(cap, cur)} cap` : null,
          disc ? `${disc}% disc.` : null,
        ]
          .filter(Boolean)
          .join(" · ");
        return {
          id: h.securityId,
          name: h.stakeholderName,
          typeLabel: TYPE_LABEL[h.stakeholderType] ?? "Other",
          securityLabel: label,
          securitySub: sub,
          color,
          quantityLabel: "-",
          outstandingPct: null,
          fullyDilutedPct: null,
        } satisfies CapRow;
      }

      const isEquity = h.category === "equity_unit";
      return {
        id: h.securityId,
        name: h.stakeholderName,
        typeLabel: TYPE_LABEL[h.stakeholderType] ?? "Other",
        securityLabel: label,
        color,
        quantityLabel: intFmt.format(qty),
        outstandingPct: isEquity && totalOutstanding > 0 ? (qty / totalOutstanding) * 100 : null,
        fullyDilutedPct: fullyDilutedTotal > 0 ? (qty / fullyDilutedTotal) * 100 : null,
      } satisfies CapRow;
    });

  // Unallocated pool as its own row (counts only on a fully-diluted basis).
  rows.push({
    id: "pool",
    name: "Unallocated pool",
    typeLabel: "Pool",
    securityLabel: "Unissued / reserved",
    color: POOL_COLOR,
    quantityLabel: intFmt.format(unallocatedPool),
    outstandingPct: null,
    fullyDilutedPct: fullyDilutedTotal > 0 ? (unallocatedPool / fullyDilutedTotal) * 100 : null,
  });

  // Donut slices grouped by type for each basis.
  const groupSlices = (basis: "outstanding" | "fd"): Slice[] => {
    const acc = new Map<string, { pct: number; color: string }>();
    for (const r of rows) {
      const pct = basis === "outstanding" ? r.outstandingPct : r.fullyDilutedPct;
      if (pct == null || pct === 0) continue;
      const label = r.typeLabel === "Pool" ? "Unallocated pool" : `${r.typeLabel}s`;
      const existing = acc.get(label);
      if (existing) existing.pct += pct;
      else acc.set(label, { pct, color: r.color });
    }
    return [...acc.entries()].map(([label, v]) => ({ label, pct: v.pct, color: v.color }));
  };

  const leftToGrantPct = authorized > 0 ? (unallocatedPool / authorized) * 100 : 0;

  return (
    <CapTableClient
      companyName={company.displayName}
      rows={rows}
      outstandingSlices={groupSlices("outstanding")}
      fullyDilutedSlices={groupSlices("fd")}
      leftToGrantPct={leftToGrantPct}
      leftToGrantLabel={`${intFmt.format(unallocatedPool)} of ${intFmt.format(authorized)} authorized ${unitNoun.plural}`}
      outstandingTotalLabel={intFmt.format(totalOutstanding)}
      fullyDilutedTotalLabel={intFmt.format(fullyDilutedTotal)}
    />
  );
}
