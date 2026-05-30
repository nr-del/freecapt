// Builds the data shape for a non-binding term-sheet draft (docs/01_mvp_scope.md
// §5.25 — "Term sheet draft (PDF + Word, paid), jurisdiction-aware, summarizing:
// round size, pre/post-money, share price, allocation table per investor, pool
// top-up, key terms"). Pure transform from a company + round terms + a computed
// RoundModelResult, so it is unit-testable and renderer-agnostic.
//
// This is a *draft* for the founder to review with outside counsel — not legal
// advice and not a binding offer. The renderer prints that disclaimer.
import type { ActiveCompany } from "@/lib/db/queries";
import type { CountryPack, JurisdictionCode } from "@/lib/packs/_shared/types";
import type { RoundModelResult, RoundTerms } from "@/lib/simulate/round-model";

export interface TermSheetInvestor {
  name: string;
  allocated: number;
  pctOfRound: number;
  pctOfPost: number;
  shares: number;
}

export interface TermSheetKeyTerm {
  label: string;
  value: string;
}

export interface TermSheet {
  // Identity
  legalName: string;
  displayName: string;
  jurisdictionLabel: string;
  registryLabel: string | null; // e.g. "CVR-nr"
  registryIdentifier: string | null;
  entityTypeLabel: string;
  title: string;

  // Economics
  currency: string;
  unitNounSingular: string; // "share" / "anpart"
  unitNounPlural: string; // "shares" / "anparter"
  roundSize: number;
  totalAllocated: number;
  preMoney: number;
  postMoney: number;
  pricePerShare: number;
  poolTopupPct: number | null;
  newMoneyShares: number;
  safeShares: number;
  newMoneyPct: number; // new-money block as % of post

  investors: TermSheetInvestor[];
  keyTerms: TermSheetKeyTerm[];

  fullyAllocated: boolean;
  generatedAt: Date;
  disclaimer: string;
}

const JURISDICTION_LABEL: Record<JurisdictionCode, string> = {
  dk: "Denmark",
  no: "Norway",
  uk: "United Kingdom",
  us: "United States",
};

// Jurisdiction-aware governing-law phrasing for the key-terms block.
const GOVERNING_LAW: Record<string, string> = {
  dk: "Danish law",
  no: "Norwegian law",
  se: "Swedish law",
  de: "German law",
  ch: "Swiss law",
  uk: "the laws of England and Wales",
  us: "the laws of the State of Delaware",
};

export function buildTermSheet(
  company: ActiveCompany,
  pack: CountryPack,
  terms: RoundTerms,
  model: RoundModelResult,
): TermSheet {
  const jurisdiction = company.jurisdiction as JurisdictionCode;
  const noun = pack.equityUnitNoun(company.entityType);
  const currency = company.currency.trim();

  const investors: TermSheetInvestor[] = model.allocations
    .filter((a) => a.allocated > 0)
    .map((a) => ({
      name: a.name,
      allocated: a.allocated,
      pctOfRound: a.pctOfRound,
      pctOfPost: a.pctOfPost,
      shares: a.shares,
    }))
    .sort((a, b) => b.allocated - a.allocated);

  const newMoneyShares = model.scenario.newShares;
  const safeShares = model.scenario.safeShares;

  const governingLaw = GOVERNING_LAW[jurisdiction] ?? `the laws of ${jurisdiction.toUpperCase()}`;

  const keyTerms: TermSheetKeyTerm[] = [
    {
      label: "Security",
      value: `${capitalize(noun.plural)} of ${company.legalName}, issued at the price per ${noun.singular} below.`,
    },
    {
      label: "Pre-emption rights",
      value: `Existing shareholders have pro-rata pre-emption rights on the new ${noun.plural}, exercisable before allocation to new investors.`,
    },
    {
      label: "Conditions",
      value: "Completion is subject to satisfactory due diligence, board and shareholder approval, and execution of long-form investment documents.",
    },
    { label: "Governing law", value: `This term sheet and the proposed investment are governed by ${governingLaw}.` },
  ];

  if (model.scenario.safeShares > 0) {
    keyTerms.splice(1, 0, {
      label: "SAFE / convertible conversion",
      value: `Outstanding SAFEs and convertibles convert into ${noun.plural} at this round per their terms before the new money is invested.`,
    });
  }

  return {
    legalName: company.legalName,
    displayName: company.displayName,
    jurisdictionLabel: JURISDICTION_LABEL[jurisdiction] ?? jurisdiction.toUpperCase(),
    registryLabel: pack.registryId?.label ?? null,
    registryIdentifier: company.registryIdentifier,
    entityTypeLabel: company.entityType.toUpperCase(),
    title: "Term Sheet (Draft)",
    currency,
    unitNounSingular: noun.singular,
    unitNounPlural: noun.plural,
    roundSize: terms.roundSize,
    totalAllocated: model.validation.totalAllocated,
    preMoney: terms.preMoney,
    postMoney: model.postMoney,
    pricePerShare: model.pricePerShare,
    poolTopupPct: terms.poolTopupPct ?? null,
    newMoneyShares,
    safeShares,
    newMoneyPct: model.scenario.newInvestorPct,
    investors,
    keyTerms,
    fullyAllocated: model.validation.status === "exact",
    generatedAt: new Date(),
    disclaimer:
      "This is a non-binding draft prepared for discussion only. It is not legal, tax, or investment advice and does not constitute an offer. Have it reviewed by qualified counsel before relying on it.",
  };
}

function capitalize(s: string): string {
  return s.length ? s[0]!.toUpperCase() + s.slice(1) : s;
}
