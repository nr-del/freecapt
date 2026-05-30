// Server-side builder for the statutory shareholder register (§5.26 auto slot,
// §5.27 legal-grade exports). The register is the legal record of who owns the
// company's *issued shares* — it lists equity-unit holders only (options and
// convertibles are not yet shares and so do not belong on the register).
//
// The data is computed straight from the cap table, so the register is always
// current. `lib/exports/register-pdf.ts` renders this shape to a PDF.
import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import type { ActiveCompany } from "@/lib/db/queries";
import { getPackForCompany, securityLabel } from "@/lib/packs/_shared/loader";
import { slotLocalTitle } from "@/lib/data-room/slots";
import type { JurisdictionCode } from "@/lib/packs/_shared/types";

const { securities, stakeholders } = schema;

export interface RegisterEntry {
  name: string;
  isEntity: boolean;
  shareClass: string; // resolved class label (share class or security label)
  shares: number;
  pctIssued: number; // share of total issued shares (0–100)
  nominalValue: number | null; // shares × par value, when a par value is set
}

export interface ShareholderRegister {
  // Company identity (header block).
  legalName: string;
  displayName: string;
  jurisdictionLabel: string; // e.g. "Denmark"
  registryIdentifier: string | null;
  entityTypeLabel: string;
  title: string; // English title, e.g. "Register of Members"
  localTitle: string | null; // jurisdiction-local title, e.g. "Ejerbog"

  entries: RegisterEntry[];
  totalIssued: number;
  authorizedUnits: number | null;
  parValue: number | null;
  parValueCurrency: string | null;
  unitNounPlural: string; // e.g. "shares"

  generatedAt: Date;
}

const JURISDICTION_LABEL: Record<JurisdictionCode, string> = {
  dk: "Denmark",
  no: "Norway",
  uk: "United Kingdom",
  us: "United States",
};

// Build the statutory shareholder register for a company from its cap table.
export async function buildShareholderRegister(
  company: ActiveCompany,
): Promise<ShareholderRegister> {
  const jurisdiction = company.jurisdiction as JurisdictionCode;
  const pack = getPackForCompany(company);
  const unitNoun = pack.equityUnitNoun(company.entityType);
  const parValue = company.parValue != null ? Number(company.parValue) : null;

  const holdings = await db
    .select({
      category: securities.category,
      subtype: securities.subtype,
      quantity: securities.quantity,
      shareClass: securities.shareClass,
      name: stakeholders.fullName,
      isEntity: stakeholders.isEntity,
    })
    .from(securities)
    .innerJoin(stakeholders, eq(securities.stakeholderId, stakeholders.id))
    .where(and(eq(securities.companyId, company.id), isNull(securities.deletedAt)))
    .orderBy(asc(stakeholders.fullName));

  // Only issued equity units belong on the statutory register.
  const equity = holdings.filter((h) => h.category === "equity_unit");
  const totalIssued = equity.reduce((sum, h) => sum + Number(h.quantity ?? 0), 0);

  const entries: RegisterEntry[] = equity
    .map((h) => {
      const shares = Number(h.quantity ?? 0);
      const classLabel =
        h.shareClass?.trim() ||
        securityLabel(pack, h.category, h.subtype, company.entityType);
      return {
        name: h.name,
        isEntity: h.isEntity,
        shareClass: classLabel,
        shares,
        pctIssued: totalIssued > 0 ? (shares / totalIssued) * 100 : 0,
        nominalValue: parValue != null ? shares * parValue : null,
      } satisfies RegisterEntry;
    })
    .sort((a, b) => b.shares - a.shares);

  return {
    legalName: company.legalName,
    displayName: company.displayName,
    jurisdictionLabel: JURISDICTION_LABEL[jurisdiction] ?? jurisdiction.toUpperCase(),
    registryIdentifier: company.registryIdentifier,
    entityTypeLabel: company.entityType.toUpperCase(),
    title: "Register of Members",
    localTitle: slotLocalTitle("shareholder_register", jurisdiction),
    entries,
    totalIssued,
    authorizedUnits: company.authorizedUnits != null ? Number(company.authorizedUnits) : null,
    parValue,
    parValueCurrency: company.parValueCurrency,
    unitNounPlural: unitNoun.plural,
    generatedAt: new Date(),
  };
}
