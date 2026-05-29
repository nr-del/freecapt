// United Kingdom country pack — private limited company (Ltd).
// Source of truth: docs/04_country_packs_uk_us.md §1. EMI valuation handling is
// marked [counsel review] in that doc (§1.4/§1.8) — mishandling it is the
// founder's personal-money problem. Document templates are not in this pack.
import type {
  CountryPack,
  EquityUnitNoun,
  Instrument,
  TaxSchemeInput,
  ValidationIssue,
} from "@/lib/packs/_shared/types";

const VERSION = "1.0.0";

// Companies House company number: 8 characters. England & Wales is 8 digits;
// Scotland is "SC" + 6 digits; Northern Ireland is "NI" + 6 digits. We accept an
// optional two-letter prefix followed by 6–8 digits. §1.5. No published check
// digit, so this is a format-only validation.
const COMPANY_NUMBER = /^([A-Z]{2})?\d{6,8}$/;
function isValidCompanyNumber(raw: string): boolean {
  return COMPANY_NUMBER.test(raw.trim().toUpperCase());
}

// §1.3 instrument catalog. `subtype` is the stable persisted key.
const INSTRUMENTS: Instrument[] = [
  {
    subtype: "ordinary_shares",
    localName: "Ordinary shares",
    englishName: "Ordinary shares",
    category: "equity_unit",
    allowedEntityTypes: ["uk-ltd"],
    notes: "Standard one-class shares for founders + employees who exercise. Nominal value typically £0.01–£1.00.",
  },
  {
    subtype: "emi_options",
    localName: "EMI options",
    englishName: "Enterprise Management Incentives options",
    category: "option_like",
    allowedEntityTypes: ["uk-ltd"],
    taxFavorableEligible: true,
    notes: "HMRC-favored scheme (Schedule 5, ITEPA 2003). 10% CGT vs 47% income tax. Strict eligibility — see §1.4.",
  },
  {
    subtype: "unapproved_options",
    localName: "Unapproved options",
    englishName: "Unapproved (non-tax-advantaged) options",
    category: "option_like",
    allowedEntityTypes: ["uk-ltd"],
    notes: "Fallback when EMI doesn't fit (over limits, or non-employees). Taxed as employment income on exercise.",
  },
  {
    subtype: "asa",
    localName: "ASA",
    englishName: "Advance Subscription Agreement",
    category: "convertible",
    allowedEntityTypes: ["uk-ltd"],
    notes: "UK equivalent of a SAFE. Default flavor is SEIS/EIS-compliant (what angels expect).",
  },
];

// §1.4 EMI eligibility — encode as live validators. Company-level + employee-
// level tests plus the HMRC valuation discipline. Checks fire only when their
// input is supplied, except instrument eligibility, which is always known.
function checkEmi(input: TaxSchemeInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

  const inst = INSTRUMENTS.find((i) => i.subtype === input.subtype);
  if (!inst || inst.taxFavorableEligible !== true) {
    issues.push({
      level: "error",
      code: "emi_ineligible_instrument",
      message: "EMI treatment only applies to EMI options — unapproved options are taxed as income.",
    });
  }

  if (!input.isEmployee) {
    issues.push({
      level: "error",
      code: "emi_not_employee",
      message: "EMI is employee-only. Advisors and contractors must use unapproved options.",
    });
  }

  if (input.grossAssets !== undefined && input.grossAssets >= 30_000_000) {
    issues.push({
      level: "error",
      code: "emi_gross_assets",
      message: `Company gross assets of ${gbp(input.grossAssets)} are at or above the £30M EMI limit.`,
    });
  }
  if (input.avgEmployees !== undefined && input.avgEmployees >= 250) {
    issues.push({
      level: "error",
      code: "emi_too_many_employees",
      message: "Company has 250 or more full-time-equivalent employees — over the EMI limit.",
    });
  }
  if (input.excludedIndustry === true) {
    issues.push({
      level: "error",
      code: "emi_excluded_trade",
      message:
        "Company trade is excluded (finance, property, legal, accountancy, farming, hotels, nursing).",
    });
  }
  if (input.independent === false) {
    issues.push({
      level: "error",
      code: "emi_not_independent",
      message: "EMI requires the company not be majority-controlled by another company.",
    });
  }

  // Per-employee lifetime cap: £250,000 at grant valuation.
  const lifetimeUsed = input.lifetimeGrantsSoFar ?? 0;
  if (input.grantValue + lifetimeUsed > 250_000) {
    const remaining = Math.max(0, 250_000 - lifetimeUsed);
    issues.push({
      level: "error",
      code: "emi_per_employee_cap",
      message: `Grant exceeds the £250,000 lifetime per-employee EMI cap (${gbp(remaining)} remaining).`,
    });
  }

  // Per-company outstanding cap: £3,000,000 at grant valuation.
  if (
    input.companyOutstandingSchemeValue !== undefined &&
    input.companyOutstandingSchemeValue + input.grantValue > 3_000_000
  ) {
    issues.push({
      level: "error",
      code: "emi_company_cap",
      message: "This grant pushes the company over the £3,000,000 outstanding EMI cap.",
    });
  }

  // Work commitment: ≥ 25 hours/week OR ≥ 75% of working time.
  if (input.weeklyHours !== undefined || input.workingTimePercent !== undefined) {
    const hoursOk = (input.weeklyHours ?? 0) >= 25;
    const percentOk = (input.workingTimePercent ?? 0) >= 75;
    if (!hoursOk && !percentOk) {
      issues.push({
        level: "error",
        code: "emi_work_commitment",
        message: "EMI needs ≥ 25 hours/week or ≥ 75% of the employee's working time.",
      });
    }
  }

  // HMRC valuation discipline: agreed value, ≤ 90 days old at grant.
  if (!input.valuationReference) {
    issues.push({
      level: "warning",
      code: "emi_no_valuation_ref",
      message: "Agree a fair market value with HMRC before grant and store the EMI valuation reference.",
    });
  } else if (input.valuationDate && input.grantDate) {
    const valued = new Date(`${input.valuationDate}T00:00:00Z`);
    const granted = new Date(`${input.grantDate}T00:00:00Z`);
    const ageDays = (granted.getTime() - valued.getTime()) / 86_400_000;
    if (ageDays > 90) {
      issues.push({
        level: "error",
        code: "emi_valuation_expired",
        message: "The HMRC EMI valuation is more than 90 days old at grant — refresh it before granting.",
      });
    }
  }

  // Notification deadline reminder.
  issues.push({
    level: "warning",
    code: "emi_notify_hmrc",
    message: "Notify HMRC within 92 days of grant or EMI status is lost.",
  });

  return issues;
}

export const ukPack: CountryPack = {
  code: "uk-ltd",
  version: VERSION,
  packVersion: `uk-ltd@${VERSION}`,
  displayName: "United Kingdom — Ltd",
  jurisdiction: "uk",
  currency: "GBP",
  capitalMinimum: 0, // no statutory minimum share capital
  entityTypes: [
    {
      code: "uk-ltd",
      localName: "Private limited company (Ltd)",
      englishName: "Private limited company",
      capitalMinimum: 0,
    },
  ],
  registryId: {
    label: "Company number",
    pattern: COMPANY_NUMBER,
    example: "12345678",
    checksum: isValidCompanyNumber,
  },
  registryLinkTemplate: "https://find-and-update.company-information.service.gov.uk/company/{id}",
  instruments: INSTRUMENTS,
  defaults: {
    capital: 1, // 100 ordinary × £0.01 = £1.00 issued
    authorizedUnits: 100,
    parValue: 0.01,
    vestingTotalMonths: 48, // 4 years
    vestingCliffMonths: 12,
    vestingFrequency: "monthly",
    defaultOptionTaxScheme: "emi",
  },
  legalReferences: {
    register_of_members: "Companies Act 2006 s.113",
    allotment_return: "Companies Act 2006 s.554",
    board_minutes: "Companies Act 2006 s.248",
    emi: "Schedule 5, ITEPA 2003",
  },
  taxScheme: {
    code: "emi",
    localName: "Enterprise Management Incentives (EMI)",
    summary:
      "Options taxed at 10% Business Asset Disposal Relief CGT on sale instead of 20–47% income tax + NI on exercise.",
    legalReference: "Schedule 5, ITEPA 2003",
    checkEligibility: checkEmi,
  },

  equityUnitNoun: (): EquityUnitNoun => ({
    singular: "share",
    plural: "shares",
    display: "Ordinary shares",
  }),

  validateCapital: () => [], // no statutory minimum
  validateRegistryId: isValidCompanyNumber,

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
