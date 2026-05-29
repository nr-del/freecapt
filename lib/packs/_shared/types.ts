// The CountryPack contract — the shape every jurisdiction bundle implements.
// A pack is a self-contained, versioned bundle (jurisdiction + entity types +
// instrument catalog + labels + validation rules + tax-scheme metadata).
// Adding a jurisdiction = shipping one pack; no core code changes.
// Source of truth: docs/03_country_packs_dk_no.md §1 + docs/01_mvp_scope.md §5.11.

export type JurisdictionCode = "dk" | "no" | "uk" | "us";

// Mirrors lib/db/schema.ts securityCategory enum.
export type SecurityCategory = "equity_unit" | "option_like" | "convertible";

// One entry in a pack's instrument catalog (§2.3). `subtype` is the stable key
// persisted on securities.subtype.
export type Instrument = {
  subtype: string; // e.g. "anparter", "tegningsoptioner", "common_stock"
  localName: string; // "Anparter"
  englishName: string; // "Shares (private)"
  category: SecurityCategory;
  allowedEntityTypes: string[]; // pack entity codes, e.g. ["dk-aps", "dk-as"]
  taxFavorableEligible?: boolean; // can carry the pack's favorable tax scheme
  notes?: string;
};

// One entity type supported by the pack (§2.2).
export type PackEntityType = {
  code: string; // "dk-aps" — matches lib/db/schema.ts entityType enum
  localName: string; // "Anpartsselskab (ApS)"
  englishName: string; // "Private limited company"
  capitalMinimum: number; // statutory minimum capital, in the pack currency
};

export type RegistryIdFormat = {
  label: string; // "CVR-nr"
  pattern: RegExp; // /^\d{8}$/
  example: string; // "12345678"
  checksum?: (id: string) => boolean; // optional check-digit validation
};

// A validation finding. `error` blocks the action; `warning` is advisory.
export type ValidationLevel = "error" | "warning";
export type ValidationIssue = { level: ValidationLevel; code: string; message: string };

// The typed result the app consumes at a validation boundary (Prompt 7).
// `ok: false` carries flattened error + warning message lists; `ok: true` means
// no blocking errors (there may still be advisory warnings — see `warnings`).
export type ValidationResult =
  | { ok: true; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };

// Fold a list of issues into the typed result. Errors block (ok: false);
// warnings alone don't.
export function toValidationResult(issues: ValidationIssue[]): ValidationResult {
  const errors = issues.filter((i) => i.level === "error").map((i) => i.message);
  const warnings = issues.filter((i) => i.level === "warning").map((i) => i.message);
  return errors.length > 0 ? { ok: false, errors, warnings } : { ok: true, warnings };
}

// Favorable employee-equity tax scheme metadata + a live eligibility check (§2.4).
// Fields beyond the first block are optional company/employee inputs the
// jurisdiction schemes need (NO opsjonsskatteordningen, UK EMI, US ISO). Checks
// that depend on a field are skipped when it's absent — we don't fail what we
// can't see — except the always-known core checks (employee status, instrument).
export type TaxSchemeInput = {
  subtype: string; // instrument being granted
  grantValue: number; // value of the grant at grant date, in pack currency
  annualSalary: number; // employee's annual salary, in pack currency
  isEmployee: boolean; // employee/consultant (CEO counts if also employed)
  broadBased?: boolean; // offered to >80% of employees (raises the cap 10% → 20%)
  optedInAgreement?: boolean; // grant agreement references the scheme

  // Company-level eligibility inputs (NO opsjonsskatteordningen, UK EMI).
  companyAgeYears?: number; // NO: < 10 years
  avgEmployees?: number; // NO: < 50; UK FTE: < 250
  balanceSheet?: number; // NO: < 80M NOK
  revenue?: number; // NO: < 80M NOK
  grossAssets?: number; // UK: < £30M
  excludedIndustry?: boolean; // NO/UK: non-qualifying trade
  independent?: boolean; // UK: not majority-controlled by another company

  // Employee work commitment.
  weeklyHours?: number; // NO ≥ 25; UK ≥ 25
  workingTimePercent?: number; // UK alt: ≥ 75% of working time
  monthsEmployed?: number; // NO: ≥ 12

  // Lifetime / company-wide scheme caps.
  lifetimeGrantsSoFar?: number; // prior scheme grant value for this employee
  companyOutstandingSchemeValue?: number; // total outstanding under the scheme

  // FMV / valuation discipline (UK EMI valuation, US ISO strike ≥ FMV / 409A).
  strikePrice?: number;
  fmvAtGrant?: number;
  firstYearVestValue?: number; // US ISO $100k annual vest limit
  hurdleValue?: number; // US LLC profits-interest hurdle (Rev. Proc. 93-27)
  electionFiled?: boolean; // US § 83(b) / profits-interest election filed
  valuationReference?: string; // UK HMRC EMI ref / US 409A ref
  valuationDate?: string; // YYYY-MM-DD
  grantDate?: string; // YYYY-MM-DD
};

export type TaxScheme = {
  code: string; // "ll-7p"
  localName: string; // "Ligningsloven § 7P"
  summary: string; // one-line plain-language description
  legalReference: string; // "Ligningsloven § 7P"
  // Returns issues if the grant fails eligibility; empty array = eligible.
  checkEligibility: (input: TaxSchemeInput) => ValidationIssue[];
};

// The lowercase nouns + display label for a pack's primary equity unit, which
// can vary by entity type (ApS → anparter, A/S → aktier).
export type EquityUnitNoun = {
  singular: string; // "anpart"
  plural: string; // "anparter"
  display: string; // "Anparter" — the cap-table security label
};

// Sensible jurisdiction-aware defaults applied at company creation (§2.7).
export type PackDefaults = {
  capital: number;
  authorizedUnits: number;
  parValue: number;
  vestingTotalMonths: number;
  vestingCliffMonths: number;
  vestingFrequency: string;
  defaultOptionTaxScheme?: string; // tax scheme code, e.g. "ll-7p"
};

export type CountryPack = {
  code: string; // pack code == primary entity type, e.g. "dk-aps"
  version: string; // "1.0.0" — bumped on statute changes
  packVersion: string; // "dk-aps@1.0.0" — snapshotted onto every transaction
  displayName: string; // "Denmark — ApS / A/S"
  jurisdiction: JurisdictionCode;
  entityTypes: PackEntityType[];
  currency: string; // ISO 4217, e.g. "DKK"
  capitalMinimum: number; // minimum for the pack's default entity type
  registryId: RegistryIdFormat;
  registryLinkTemplate: string; // "{id}" placeholder, e.g. "https://datacvr.virk.dk/enhed/virksomhed/{id}"
  instruments: Instrument[];
  defaults: PackDefaults;
  legalReferences: Record<string, string>; // citation key → statute string
  taxScheme?: TaxScheme;

  // The equity-unit noun for a given entity type (drives the shares↔anparter swap).
  equityUnitNoun: (entityTypeCode: string) => EquityUnitNoun;

  // Pack-specific validators (§2.5). Pure functions, run on transaction submit.
  validateCapital: (entityTypeCode: string, capital: number) => ValidationIssue[];
  validateRegistryId: (id: string) => boolean;
  validateTransactionDate: (effectiveDate: string, today?: string) => ValidationIssue[];
};
