import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db, schema } from "@/lib/db";
import { getActiveCompany } from "@/lib/db/queries";
import { getPackForCompany, securityLabel } from "@/lib/packs/_shared/loader";
import { getShareClassNames } from "@/lib/share-classes/queries";
import { TYPE_LABEL, intFmt, moneyFmt } from "@/lib/cap-table/display";

import type { InstrumentOption } from "@/components/freecapt/add-stakeholder-modal";
import { StakeholderDetailClient, type HoldingView } from "./stakeholder-detail-client";

const { securities, stakeholders } = schema;

const GENERIC_INSTRUMENTS: InstrumentOption[] = [
  { subtype: "common_stock", label: "Common stock", category: "equity_unit" },
  { subtype: "iso", label: "ISO options", category: "option_like" },
  { subtype: "nso", label: "NSO options", category: "option_like" },
  { subtype: "safe", label: "SAFE", category: "convertible" },
];

function vestingSummary(
  totalMonths: number | null,
  cliffMonths: number | null,
  frequency: string | null,
): string {
  if (!totalMonths) return "Fully vested";
  const years = totalMonths % 12 === 0 ? `${totalMonths / 12}y` : `${totalMonths}mo`;
  const cliff = cliffMonths ? `, ${cliffMonths}mo cliff` : "";
  const freq = frequency ? `, ${frequency}` : "";
  return `${years}${cliff}${freq}`;
}

export default async function StakeholderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getActiveCompany();
  if (!company) notFound();

  const [person] = await db
    .select({
      id: stakeholders.id,
      fullName: stakeholders.fullName,
      email: stakeholders.email,
      type: stakeholders.type,
      isEntity: stakeholders.isEntity,
      entityRegistryId: stakeholders.entityRegistryId,
      notes: stakeholders.notes,
      portalInviteSentAt: stakeholders.portalInviteSentAt,
      portalFirstSeenAt: stakeholders.portalFirstSeenAt,
    })
    .from(stakeholders)
    .where(
      and(
        eq(stakeholders.id, id),
        eq(stakeholders.companyId, company.id),
        isNull(stakeholders.deletedAt),
      ),
    )
    .limit(1);
  if (!person) notFound();

  const currency = company.currency.trim();
  const pack = getPackForCompany(company);

  const packInstruments: InstrumentOption[] = pack.instruments
    .filter((i) => i.allowedEntityTypes.includes(company.entityType))
    .map((i) => ({ subtype: i.subtype, label: i.localName, category: i.category }));
  const instruments = packInstruments.length > 0 ? packInstruments : GENERIC_INSTRUMENTS;

  const [shareClassNames, rawHoldings] = await Promise.all([
    getShareClassNames(company.id),
    db
      .select()
      .from(securities)
      .where(
        and(
          eq(securities.stakeholderId, id),
          eq(securities.companyId, company.id),
          isNull(securities.deletedAt),
        ),
      ),
  ]);

  const holdings: HoldingView[] = rawHoldings.map((h) => {
    const label = securityLabel(pack, h.category, h.subtype, company.entityType);
    const isMoney = h.category === "convertible";
    return {
      id: h.id,
      label,
      category: h.category,
      subtype: h.subtype,
      quantity: h.quantity,
      amount: h.monetaryAmount,
      valueLabel: isMoney
        ? moneyFmt(Number(h.monetaryAmount ?? 0), (h.monetaryCurrency ?? currency).trim())
        : intFmt.format(Number(h.quantity ?? 0)),
      shareClass: h.shareClass,
      strikePrice: h.strikePrice,
      capAmount: h.capAmount,
      discountPercent: h.discountPercent,
      strikeLabel:
        h.strikePrice != null ? moneyFmt(Number(h.strikePrice), (h.strikeCurrency ?? currency).trim()) : null,
      vestingStartDate: h.vestingStartDate,
      vestingTotalMonths: h.vestingTotalMonths,
      vestingCliffMonths: h.vestingCliffMonths,
      vestingFrequency: h.vestingFrequency,
      vestingSummary: isMoney
        ? "—"
        : vestingSummary(h.vestingTotalMonths, h.vestingCliffMonths, h.vestingFrequency),
      status: h.status ?? "active",
    } satisfies HoldingView;
  });

  return (
    <StakeholderDetailClient
      companyName={company.displayName}
      stakeholder={{
        id: person.id,
        fullName: person.fullName,
        email: person.email,
        type: person.type,
        typeLabel: TYPE_LABEL[person.type] ?? "Other",
        isEntity: person.isEntity,
        entityRegistryId: person.entityRegistryId,
        notes: person.notes,
        portalInvited: person.portalInviteSentAt != null,
        portalActive: person.portalFirstSeenAt != null,
      }}
      holdings={holdings}
      instruments={instruments}
      shareClassNames={shareClassNames}
      currency={currency}
    />
  );
}
