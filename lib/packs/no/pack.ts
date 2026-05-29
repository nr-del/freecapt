// Norway country pack — AS + ASA.
// Source of truth: docs/03_country_packs_dk_no.md §3. Sections marked
// [counsel review] in that doc must be confirmed by NO corporate counsel before
// any document template ships (templates are not in this pack — §3.6). Scheme
// parameters (§3.4) are as of the doc's knowledge cutoff and need confirmation
// against current Skatteetaten guidance.
import type {
  CountryPack,
  EquityUnitNoun,
  Instrument,
  TaxSchemeInput,
  ValidationIssue,
} from "@/lib/packs/_shared/types";

const VERSION = "1.0.0";

// Organisasjonsnummer: 9 digits with a modulus-11 check. Weights for the first
// 8 digits are 3,2,7,6,5,4,3,2; the check digit (9th) = 11 − (weighted sum % 11),
// where 11 → 0 and 10 → the number is invalid. §3.1.
function isValidOrgnr(raw: string): boolean {
  const s = raw.replace(/\s/g, "");
  if (!/^\d{9}$/.test(s)) return false;
  const weights = [3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += Number(s[i]) * (weights[i] ?? 0);
  }
  const remainder = sum % 11;
  const check = remainder === 0 ? 0 : 11 - remainder;
  if (check === 10) return false; // no valid org number has this control digit
  return check === Number(s[8]);
}

// §3.3 instrument catalog [counsel review]. `subtype` is the stable persisted key.
const INSTRUMENTS: Instrument[] = [
  {
    subtype: "aksjer",
    localName: "Aksjer",
    englishName: "Shares",
    category: "equity_unit",
    allowedEntityTypes: ["no-as", "no-asa"],
    notes: "Multiple classes (A/B) permitted; common once VC-backed.",
  },
  {
    subtype: "opsjoner",
    localName: "Opsjoner",
    englishName: "Options",
    category: "option_like",
    allowedEntityTypes: ["no-as", "no-asa"],
    taxFavorableEligible: true,
    notes:
      "Employee options. Skatteloven § 5-14 by default; opsjonsskatteordningen if the company + grant qualify (§3.4).",
  },
  {
    subtype: "tegningsretter",
    localName: "Tegningsretter",
    englishName: "Subscription rights / warrants",
    category: "option_like",
    allowedEntityTypes: ["no-as", "no-asa"],
    notes: "Investor warrants typically; legally distinct from employee opsjoner but mechanically similar.",
  },
  {
    subtype: "konvertibelt_laan",
    localName: "Konvertibelt lån",
    englishName: "Convertible loan",
    category: "convertible",
    allowedEntityTypes: ["no-as", "no-asa"],
    notes: "Aksjeloven §§ 11-1 ff. Debt convertible to aksjer on a trigger event.",
  },
  {
    subtype: "tildelte_aksjer",
    localName: "Tildelte aksjer",
    englishName: "Restricted stock units (RSU-like)",
    category: "option_like",
    allowedEntityTypes: ["no-as", "no-asa"],
    taxFavorableEligible: false,
    notes: "Synthetic, RSU-style. Taxed as employment income on vest by default; does NOT use the scheme.",
  },
];

// §3.4 Opsjonsskatteordningen for små selskaper — encode as live validators.
// Multi-dimensional company test plus per-employee/per-company caps. Checks fire
// only when their input is supplied (we don't fail on data we don't have), except
// employee status and instrument eligibility, which are always known.
function checkOpsjonsskatteordningen(input: TaxSchemeInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nok = (n: number) => `${Math.round(n).toLocaleString("nb-NO")} NOK`;

  if (!input.isEmployee) {
    issues.push({
      level: "error",
      code: "noscheme_not_employee",
      message: "Opsjonsskatteordningen requires an employee of the company.",
    });
  }

  const inst = INSTRUMENTS.find((i) => i.subtype === input.subtype);
  if (!inst || inst.taxFavorableEligible !== true) {
    issues.push({
      level: "error",
      code: "noscheme_ineligible_instrument",
      message:
        "Only employee opsjoner qualify for the scheme — tegningsretter and tildelte aksjer don't.",
    });
  }

  if (input.companyAgeYears !== undefined && input.companyAgeYears >= 10) {
    issues.push({
      level: "error",
      code: "noscheme_company_too_old",
      message: "The company must be less than 10 years old to use the scheme.",
    });
  }
  if (input.avgEmployees !== undefined && input.avgEmployees >= 50) {
    issues.push({
      level: "error",
      code: "noscheme_too_many_employees",
      message: "The company averaged 50 or more employees last year — over the scheme limit.",
    });
  }
  if (input.balanceSheet !== undefined && input.balanceSheet >= 80_000_000) {
    issues.push({
      level: "error",
      code: "noscheme_balance_sheet",
      message: `Balance sheet of ${nok(input.balanceSheet)} is at or above the 80,000,000 NOK limit.`,
    });
  }
  if (input.revenue !== undefined && input.revenue >= 80_000_000) {
    issues.push({
      level: "error",
      code: "noscheme_revenue",
      message: `Revenue of ${nok(input.revenue)} is at or above the 80,000,000 NOK limit.`,
    });
  }
  if (input.excludedIndustry === true) {
    issues.push({
      level: "error",
      code: "noscheme_excluded_industry",
      message:
        "The company's industry is excluded (finance, insurance, real estate, mining, oil/gas, legal/accounting, some consulting).",
    });
  }

  // Per-employee lifetime cap: 3,000,000 NOK at grant valuation.
  const lifetimeUsed = input.lifetimeGrantsSoFar ?? 0;
  if (input.grantValue + lifetimeUsed > 3_000_000) {
    const remaining = Math.max(0, 3_000_000 - lifetimeUsed);
    issues.push({
      level: "error",
      code: "noscheme_per_employee_cap",
      message: `Grant exceeds the 3,000,000 NOK lifetime per-employee cap (${nok(remaining)} remaining).`,
    });
  }

  // Per-company cap: 60,000,000 NOK total outstanding under the scheme.
  if (
    input.companyOutstandingSchemeValue !== undefined &&
    input.companyOutstandingSchemeValue + input.grantValue > 60_000_000
  ) {
    issues.push({
      level: "error",
      code: "noscheme_company_cap",
      message: "This grant pushes the company over the 60,000,000 NOK total scheme cap.",
    });
  }

  // Employee work requirement: ≥ 25 hours/week and ≥ 12 months in the company.
  if (input.weeklyHours !== undefined && input.weeklyHours < 25) {
    issues.push({
      level: "error",
      code: "noscheme_hours",
      message: "The employee must work at least 25 hours per week to qualify.",
    });
  }
  if (input.monthsEmployed !== undefined && input.monthsEmployed < 12) {
    issues.push({
      level: "warning",
      code: "noscheme_tenure",
      message: "Scheme generally expects ≥ 12 months in the company — confirm tenure at grant.",
    });
  }

  // Notification deadline reminder.
  issues.push({
    level: "warning",
    code: "noscheme_notify_skatteetaten",
    message: "Notify Skatteetaten within 1 month of grant for the scheme to apply.",
  });

  return issues;
}

const ENTITY_MINIMUMS: Record<string, number> = {
  "no-as": 30_000,
  "no-asa": 1_000_000,
};

export const noPack: CountryPack = {
  code: "no-as",
  version: VERSION,
  packVersion: `no-as@${VERSION}`,
  displayName: "Norway — AS / ASA",
  jurisdiction: "no",
  currency: "NOK",
  capitalMinimum: ENTITY_MINIMUMS["no-as"] ?? 30_000,
  entityTypes: [
    {
      code: "no-as",
      localName: "Aksjeselskap (AS)",
      englishName: "Private limited company",
      capitalMinimum: 30_000,
    },
    {
      code: "no-asa",
      localName: "Allmennaksjeselskap (ASA)",
      englishName: "Public limited company",
      capitalMinimum: 1_000_000,
    },
  ],
  registryId: {
    label: "Organisasjonsnummer",
    pattern: /^\d{9}$/,
    example: "974760673",
    checksum: isValidOrgnr,
  },
  registryLinkTemplate: "https://virksomhet.brreg.no/nb/oppslag/enheter/{id}",
  instruments: INSTRUMENTS,
  defaults: {
    capital: 30_000,
    authorizedUnits: 30_000, // 1 NOK pålydende per aksje keeps the math simple
    parValue: 1,
    vestingTotalMonths: 48, // 4 år
    vestingCliffMonths: 12, // 12 mnd cliff
    vestingFrequency: "monthly",
    defaultOptionTaxScheme: "opsjonsskatteordningen",
  },
  legalReferences: {
    ownership_register: "Aksjeloven § 4-5",
    options: "Aksjeloven § 11-12 + Skatteloven § 5-14",
    convertible: "Aksjeloven §§ 11-1 ff.",
    capital_increase: "Aksjeloven §§ 10-1 ff.",
    board_minutes: "Aksjeloven § 6-29",
    general_meeting: "Aksjeloven §§ 5-15 ff.",
    articles: "Aksjeloven § 2-2",
    option_scheme: "Opsjonsskatteordningen for små selskaper",
  },
  taxScheme: {
    code: "opsjonsskatteordningen",
    localName: "Opsjonsskatteordningen for små selskaper",
    summary:
      "Employee taxed only on capital gains at sale (≈37.8%), not as employment income at exercise (~47% + employer's social security).",
    legalReference: "Opsjonsskatteordningen (Skatteloven, reformed 2022)",
    checkEligibility: checkOpsjonsskatteordningen,
  },

  equityUnitNoun: (): EquityUnitNoun => ({
    singular: "aksje",
    plural: "aksjer",
    display: "Aksjer",
  }),

  validateCapital: (entityTypeCode, capital) => {
    const min = ENTITY_MINIMUMS[entityTypeCode] ?? 30_000;
    if (capital < min) {
      return [
        {
          level: "error",
          code: "capital_below_minimum",
          message: `Aksjekapital must be at least ${min.toLocaleString("nb-NO")} NOK for ${
            entityTypeCode === "no-asa" ? "an ASA" : "an AS"
          }.`,
        },
      ];
    }
    return [];
  },

  validateRegistryId: isValidOrgnr,

  validateTransactionDate: (effectiveDate, today) => {
    const eff = new Date(`${effectiveDate}T00:00:00Z`);
    if (Number.isNaN(eff.getTime())) {
      return [{ level: "error", code: "bad_date", message: "Date isn't a valid calendar date." }];
    }
    const base = today ? new Date(`${today}T00:00:00Z`) : new Date();
    const maxFuture = new Date(base);
    maxFuture.setUTCDate(maxFuture.getUTCDate() + 30);
    if (eff.getTime() > maxFuture.getTime()) {
      return [
        {
          level: "error",
          code: "date_too_far_future",
          message: "Transactions can't be dated more than 30 days in the future.",
        },
      ];
    }
    return [];
  },
};
