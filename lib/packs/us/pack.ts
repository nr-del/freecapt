// United States country pack — Delaware C-corp (+ LLC stub).
// Minimal for now: enough to keep the seeded Acme demo's labels stable. The
// full US pack (ISO/NSO/RSA/SAFE rules, § 1202 QSBS, § 83(b) reminders) lands
// with the broader pack work — docs/04_country_packs_uk_us.md.
import type { CountryPack, EquityUnitNoun, Instrument } from "@/lib/packs/_shared/types";

const VERSION = "1.0.0";

const INSTRUMENTS: Instrument[] = [
  {
    subtype: "common_stock",
    localName: "Common stock",
    englishName: "Common stock",
    category: "equity_unit",
    allowedEntityTypes: ["us-de-ccorp"],
  },
  {
    subtype: "iso",
    localName: "ISO options",
    englishName: "Incentive stock options",
    category: "option_like",
    allowedEntityTypes: ["us-de-ccorp"],
    taxFavorableEligible: true,
  },
  {
    subtype: "nso",
    localName: "NSO options",
    englishName: "Non-qualified stock options",
    category: "option_like",
    allowedEntityTypes: ["us-de-ccorp"],
  },
  {
    subtype: "safe",
    localName: "SAFE",
    englishName: "Simple agreement for future equity",
    category: "convertible",
    allowedEntityTypes: ["us-de-ccorp"],
  },
];

export const usPack: CountryPack = {
  code: "us-de-ccorp",
  version: VERSION,
  packVersion: `us-de-ccorp@${VERSION}`,
  displayName: "United States — Delaware C-corp",
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
  ],
  registryId: {
    label: "EIN",
    pattern: /^\d{2}-\d{7}$/,
    example: "88-1234567",
  },
  registryLinkTemplate: "https://icis.corp.delaware.gov/Ecorp/EntitySearch/NameSearch.aspx?q={id}",
  instruments: INSTRUMENTS,
  defaults: {
    capital: 0,
    authorizedUnits: 10_000_000,
    parValue: 0.0001,
    vestingTotalMonths: 48,
    vestingCliffMonths: 12,
    vestingFrequency: "monthly",
  },
  legalReferences: {
    common_stock: "DGCL § 151",
    options: "DGCL § 157",
  },

  equityUnitNoun: (): EquityUnitNoun => ({
    singular: "share",
    plural: "shares",
    display: "Common stock",
  }),

  validateCapital: () => [],
  validateRegistryId: (id) => /^\d{2}-\d{7}$/.test(id.trim()),
  validateTransactionDate: () => [],
};
