// Denmark country pack — ApS + A/S.
// Source of truth: docs/03_country_packs_dk_no.md §2. Sections marked
// [counsel review] in that doc must be confirmed by DK corporate counsel
// before any document template ships (templates are not in this pack — §9).
import type {
  CountryPack,
  EquityUnitNoun,
  Instrument,
  TaxSchemeInput,
  ValidationIssue,
} from "@/lib/packs/_shared/types";

const VERSION = "1.0.0";

// CVR-nr: 8 digits with a modulus-11 check (weights 2,7,6,5,4,3,2,1; the
// weighted sum must be divisible by 11). §2.1.
function isValidCvr(raw: string): boolean {
  const s = raw.trim();
  if (!/^\d{8}$/.test(s)) return false;
  const weights = [2, 7, 6, 5, 4, 3, 2, 1];
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += Number(s[i]) * (weights[i] ?? 0);
  }
  return sum % 11 === 0;
}

// §2.3 instrument catalog. `subtype` is the stable key stored on securities.
const INSTRUMENTS: Instrument[] = [
  {
    subtype: "anparter",
    localName: "Anparter",
    englishName: "Shares (private)",
    category: "equity_unit",
    allowedEntityTypes: ["dk-aps"],
    notes: "Single-class default. Multiple classes legal since the 2014 Selskabsloven revision but uncommon in SMB.",
  },
  {
    subtype: "aktier",
    localName: "Aktier",
    englishName: "Shares (public)",
    category: "equity_unit",
    allowedEntityTypes: ["dk-as"],
    notes: "Multiple classes typical (A/B with voting differentiation).",
  },
  {
    subtype: "tegningsoptioner",
    localName: "Tegningsoptioner",
    englishName: "Warrants / options",
    category: "option_like",
    allowedEntityTypes: ["dk-aps", "dk-as"],
    taxFavorableEligible: true,
    notes: "Selskabsloven §§ 52–66. Real employee options; strike + vesting + exercise period required. Default choice when § 7P treatment is intended.",
  },
  {
    subtype: "warranter",
    localName: "Warranter",
    englishName: "Warrants (investor-side)",
    category: "option_like",
    allowedEntityTypes: ["dk-as"],
    notes: "Often investor-side warrants from a financing; used loosely alongside tegningsoptioner.",
  },
  {
    subtype: "differenceaktier",
    localName: "Differenceaktier",
    englishName: "Phantom shares / SARs",
    category: "option_like",
    allowedEntityTypes: ["dk-aps", "dk-as"],
    taxFavorableEligible: false,
    notes: "Synthetic, cash-settled equity. Avoids notary/registration overhead but does NOT qualify for § 7P.",
  },
  {
    subtype: "konvertibelt_gaeldsbrev",
    localName: "Konvertibelt gældsbrev",
    englishName: "Convertible debt note",
    category: "convertible",
    allowedEntityTypes: ["dk-aps", "dk-as"],
    notes: "Selskabsloven §§ 167–177. Debt with conversion to anparter/aktier on a trigger event.",
  },
];

// §2.4 Ligningsloven § 7P eligibility (encode as live validators). Failing
// eligibility before signing saves a tax bill the founder didn't expect.
function checkSection7P(input: TaxSchemeInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!input.isEmployee) {
    issues.push({
      level: "error",
      code: "ll7p_not_employee",
      message: "§ 7P requires an employee or consultant (a CEO qualifies only if also employed).",
    });
  }

  const inst = INSTRUMENTS.find((i) => i.subtype === input.subtype);
  if (!inst || inst.taxFavorableEligible !== true) {
    issues.push({
      level: "error",
      code: "ll7p_ineligible_instrument",
      message:
        "§ 7P only covers tegningsoptioner or aktier — synthetic instruments like differenceaktier don't qualify.",
    });
  }

  // Cap: 10% of annual salary, or 20% if the scheme is open to >80% of employees.
  const capPct = input.broadBased ? 20 : 10;
  const maxGrantValue = (input.annualSalary * capPct) / 100;
  if (input.annualSalary > 0 && input.grantValue > maxGrantValue) {
    issues.push({
      level: "error",
      code: "ll7p_over_salary_cap",
      message: `Grant value exceeds ${capPct}% of annual salary (max ${Math.round(
        maxGrantValue,
      ).toLocaleString("da-DK")} DKK). Reduce the grant or split it across years.`,
    });
  }

  if (input.optedInAgreement === false) {
    issues.push({
      level: "warning",
      code: "ll7p_not_opted_in",
      message:
        'The grant agreement must state "Optionerne er omfattet af ligningsloven § 7P" for the scheme to apply.',
    });
  }

  return issues;
}

const ENTITY_MINIMUMS: Record<string, number> = {
  "dk-aps": 40_000,
  "dk-as": 400_000,
};

export const dkPack: CountryPack = {
  code: "dk-aps",
  version: VERSION,
  packVersion: `dk-aps@${VERSION}`,
  displayName: "Denmark — ApS / A/S",
  jurisdiction: "dk",
  currency: "DKK",
  capitalMinimum: ENTITY_MINIMUMS["dk-aps"] ?? 40_000,
  entityTypes: [
    {
      code: "dk-aps",
      localName: "Anpartsselskab (ApS)",
      englishName: "Private limited company",
      capitalMinimum: 40_000,
    },
    {
      code: "dk-as",
      localName: "Aktieselskab (A/S)",
      englishName: "Public limited company",
      capitalMinimum: 400_000,
    },
  ],
  registryId: {
    label: "CVR-nr",
    pattern: /^\d{8}$/,
    example: "12345678",
    checksum: isValidCvr,
  },
  registryLinkTemplate: "https://datacvr.virk.dk/enhed/virksomhed/{id}",
  instruments: INSTRUMENTS,
  defaults: {
    capital: 40_000,
    authorizedUnits: 40_000, // kr 1 nominal per anpart keeps the math simple
    parValue: 1,
    vestingTotalMonths: 48, // 4 år
    vestingCliffMonths: 12, // 12 mdr cliff
    vestingFrequency: "monthly",
    defaultOptionTaxScheme: "ll-7p",
  },
  legalReferences: {
    ownership_register: "Selskabsloven § 50",
    options: "Selskabsloven §§ 52–66",
    convertible: "Selskabsloven §§ 167–177",
    capital_increase: "Selskabsloven § 154 ff.",
    board_minutes: "Selskabsloven § 130",
    articles: "Selskabsloven § 28",
    section_7p: "Ligningsloven § 7P",
  },
  taxScheme: {
    code: "ll-7p",
    localName: "Ligningsloven § 7P",
    summary:
      "Employee taxed only on capital gains at sale (~42%), not as income at grant/exercise (~55%+).",
    legalReference: "Ligningsloven § 7P",
    checkEligibility: checkSection7P,
  },

  equityUnitNoun: (entityTypeCode: string): EquityUnitNoun =>
    entityTypeCode === "dk-as"
      ? { singular: "aktie", plural: "aktier", display: "Aktier" }
      : { singular: "anpart", plural: "anparter", display: "Anparter" },

  validateCapital: (entityTypeCode, capital) => {
    const min = ENTITY_MINIMUMS[entityTypeCode] ?? 40_000;
    if (capital < min) {
      return [
        {
          level: "error",
          code: "capital_below_minimum",
          message: `Selskabskapital must be at least ${min.toLocaleString("da-DK")} DKK for ${entityTypeCode === "dk-as" ? "an A/S" : "an ApS"}.`,
        },
      ];
    }
    return [];
  },

  validateRegistryId: isValidCvr,

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
