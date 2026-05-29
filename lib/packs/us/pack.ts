// United States country pack — Delaware C-corp + Delaware LLC.
// Source of truth: docs/04_country_packs_uk_us.md §2. Two entity types share one
// pack (common Delaware + federal-tax + counsel infrastructure). § 83(b) handling
// is the founder's personal-money problem — surfaced as a hard 30-day deadline.
// Document templates are not in this pack.
import type {
  CountryPack,
  EquityUnitNoun,
  Instrument,
  TaxSchemeInput,
  ValidationIssue,
} from "@/lib/packs/_shared/types";

const VERSION = "1.0.0";

// § 83(b) election deadline — 30 days from grant, no exceptions. Surfaced as a
// hard reminder cascade for every RSA and profits-interest grant (§2.5).
export const SECTION_83B_DEADLINE_DAYS = 30;

// EIN: 9 digits formatted XX-XXXXXXX. §2.1.
const EIN = /^\d{2}-\d{7}$/;
function isValidEin(raw: string): boolean {
  return EIN.test(raw.trim());
}

// §2.3 (C-Corp) + §2.4 (LLC) instrument catalogs, merged and filtered by
// allowedEntityTypes. `subtype` is the stable persisted key.
const INSTRUMENTS: Instrument[] = [
  // --- C-Corp ---
  {
    subtype: "common_stock",
    localName: "Common stock",
    englishName: "Common stock",
    category: "equity_unit",
    allowedEntityTypes: ["us-de-ccorp"],
    notes: "The founder/employee class. DGCL § 151.",
  },
  {
    subtype: "iso",
    localName: "ISO options",
    englishName: "Incentive stock options",
    category: "option_like",
    allowedEntityTypes: ["us-de-ccorp"],
    taxFavorableEligible: true,
    notes: "IRC § 422. Employees only, strike ≥ FMV, $100k annual vest limit. Excess spills to NSO.",
  },
  {
    subtype: "nso",
    localName: "NSO options",
    englishName: "Non-qualified stock options",
    category: "option_like",
    allowedEntityTypes: ["us-de-ccorp"],
    notes: "Advisors, contractors, board members, employees over the ISO limit. Income at exercise on the spread.",
  },
  {
    subtype: "rsa",
    localName: "Restricted stock award",
    englishName: "Restricted stock award",
    category: "equity_unit",
    allowedEntityTypes: ["us-de-ccorp"],
    taxFavorableEligible: true,
    notes: "Shares issued upfront with reverse vesting. § 83(b) election required within 30 days of grant.",
  },
  {
    subtype: "safe",
    localName: "SAFE",
    englishName: "Simple agreement for future equity",
    category: "convertible",
    allowedEntityTypes: ["us-de-ccorp"],
    notes: "Y Combinator post-money SAFE only. Converts to preferred at next priced round.",
  },
  // --- LLC ---
  {
    subtype: "membership_units",
    localName: "Membership units",
    englishName: "Membership units (capital interest)",
    category: "equity_unit",
    allowedEntityTypes: ["us-de-llc"],
    notes: 'The LLC equivalent of shares. Default class "Common Units" / "Class A Units".',
  },
  {
    subtype: "profits_interests",
    localName: "Profits interests",
    englishName: "Profits interests (Class B / carry units)",
    category: "equity_unit",
    allowedEntityTypes: ["us-de-llc"],
    taxFavorableEligible: true,
    notes: "Granted with hurdle = company FMV at grant; tax-free at grant per Rev. Proc. 93-27. Grantee shares only in future appreciation.",
  },
  {
    subtype: "unit_options",
    localName: "Options on units",
    englishName: "Options on membership units",
    category: "option_like",
    allowedEntityTypes: ["us-de-llc"],
    notes: "Rare. Used when the company specifically wants exercise mechanics.",
  },
  {
    subtype: "convertible_note",
    localName: "Convertible note",
    englishName: "Convertible promissory note",
    category: "convertible",
    allowedEntityTypes: ["us-de-llc"],
    notes: "LLCs rarely take SAFEs (no native preferred); convertible notes are the usual early-money instrument.",
  },
];

// §2.5/§2.6 favorable-treatment validators, dispatched by instrument. ISO carries
// the $100k limit + strike-≥-FMV test; profits interests carry the hurdle-=-FMV
// (Rev. Proc. 93-27) test; RSA carries the § 83(b) deadline reminder.
function checkUsFavorable(input: TaxSchemeInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const usd = (n: number) =>
    `$${n.toLocaleString("en-US", { maximumFractionDigits: Math.abs(n) < 100 ? 4 : 0 })}`;

  switch (input.subtype) {
    case "iso": {
      if (!input.isEmployee) {
        issues.push({
          level: "error",
          code: "iso_not_employee",
          message: "ISOs are employee-only. Advisors and contractors must use NSOs.",
        });
      }
      if (
        input.strikePrice !== undefined &&
        input.fmvAtGrant !== undefined &&
        input.strikePrice < input.fmvAtGrant
      ) {
        issues.push({
          level: "error",
          code: "iso_strike_below_fmv",
          message: `Strike price ${usd(input.strikePrice)} is below the ${usd(
            input.fmvAtGrant,
          )} 409A fair market value — ISOs require strike ≥ FMV.`,
        });
      }
      if (input.firstYearVestValue !== undefined && input.firstYearVestValue > 100_000) {
        issues.push({
          level: "warning",
          code: "iso_100k_limit",
          message: `First-year vest value of ${usd(
            input.firstYearVestValue,
          )} exceeds the $100,000 ISO limit — the excess is treated as NSO.`,
        });
      }
      break;
    }

    case "profits_interests": {
      // Rev. Proc. 93-27: hurdle must equal company FMV at grant, or the interest
      // is a taxable capital interest at grant.
      if (
        input.hurdleValue !== undefined &&
        input.fmvAtGrant !== undefined &&
        input.hurdleValue < input.fmvAtGrant
      ) {
        issues.push({
          level: "error",
          code: "pi_hurdle_below_fmv",
          message: `Hurdle ${usd(input.hurdleValue)} is below company FMV ${usd(
            input.fmvAtGrant,
          )} — set the hurdle to FMV at grant (Rev. Proc. 93-27) or it's a taxable capital interest.`,
        });
      }
      if (input.electionFiled === false) {
        issues.push({
          level: "warning",
          code: "pi_election",
          message: `File the § 83(b) election within ${SECTION_83B_DEADLINE_DAYS} days of grant (or rely on the Rev. Proc. 2001-43 safe harbor).`,
        });
      }
      break;
    }

    case "rsa": {
      issues.push({
        level: "warning",
        code: "rsa_83b_deadline",
        message: `File the § 83(b) election within ${SECTION_83B_DEADLINE_DAYS} days of grant — miss it and you pay income tax as the shares vest.`,
      });
      break;
    }

    default:
      issues.push({
        level: "error",
        code: "us_ineligible_instrument",
        message: "Favorable tax treatment applies to ISOs, RSAs, and LLC profits interests.",
      });
  }

  return issues;
}

export const usPack: CountryPack = {
  code: "us-de-ccorp",
  version: VERSION,
  packVersion: `us-de-ccorp@${VERSION}`,
  displayName: "United States — Delaware C-corp / LLC",
  jurisdiction: "us",
  currency: "USD",
  capitalMinimum: 0, // no statutory minimum capital in Delaware
  entityTypes: [
    {
      code: "us-de-ccorp",
      localName: "Delaware C-corporation",
      englishName: "Delaware C-corporation",
      capitalMinimum: 0,
    },
    {
      code: "us-de-llc",
      localName: "Delaware LLC",
      englishName: "Delaware limited liability company",
      capitalMinimum: 0,
    },
  ],
  registryId: {
    label: "EIN",
    pattern: EIN,
    example: "88-1234567",
    checksum: isValidEin,
  },
  registryLinkTemplate: "https://icis.corp.delaware.gov/Ecorp/EntitySearch/NameSearch.aspx?q={id}",
  instruments: INSTRUMENTS,
  defaults: {
    capital: 0,
    authorizedUnits: 10_000_000, // C-Corp default: 10M authorized common
    parValue: 0.00001,
    vestingTotalMonths: 48,
    vestingCliffMonths: 12,
    vestingFrequency: "monthly",
    defaultOptionTaxScheme: "iso",
  },
  legalReferences: {
    common_stock: "DGCL § 151",
    options: "DGCL § 157",
    iso: "IRC § 422",
    section_83b: "IRC § 83(b)",
    section_409a: "IRC § 409A",
    qsbs: "IRC § 1202",
    profits_interests: "Rev. Proc. 93-27",
  },
  taxScheme: {
    code: "iso",
    localName: "ISO / § 83(b) / profits interests",
    summary:
      "Favorable employee equity: ISO capital-gains treatment (IRC § 422), RSA/profits-interest § 83(b) elections, LLC profits-interest hurdle (Rev. Proc. 93-27).",
    legalReference: "IRC § 422 / § 83(b) / Rev. Proc. 93-27",
    checkEligibility: checkUsFavorable,
  },

  // C-Corp owns "Common stock"; LLC owns "Membership units".
  equityUnitNoun: (entityTypeCode: string): EquityUnitNoun =>
    entityTypeCode === "us-de-llc"
      ? { singular: "unit", plural: "units", display: "Membership units" }
      : { singular: "share", plural: "shares", display: "Common stock" },

  validateCapital: () => [], // no statutory minimum in Delaware
  validateRegistryId: isValidEin,

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
