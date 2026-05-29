// Pack registry + resolution. getPackForCompany() is the single entry point the
// app uses to turn a company row into its jurisdiction bundle. Adding a pack =
// importing it and adding one registry entry (no other code changes).
import { dkPack } from "@/lib/packs/dk/pack";
import { noPack } from "@/lib/packs/no/pack";
import { ukPack } from "@/lib/packs/uk/pack";
import { usPack } from "@/lib/packs/us/pack";
import type { CountryPack, EquityUnitNoun, SecurityCategory } from "@/lib/packs/_shared/types";

// Keyed by entity type (== the value stored on companies.entityType). Packs that
// cover multiple entity types (DK ApS/AS, NO AS/ASA, US C-Corp/LLC) appear once
// per type.
const REGISTRY: Record<string, CountryPack> = {
  "dk-aps": dkPack,
  "dk-as": dkPack,
  "no-as": noPack,
  "no-asa": noPack,
  "uk-ltd": ukPack,
  "us-de-ccorp": usPack,
  "us-de-llc": usPack,
};

// Fallback for any entity type without a registered pack. Keeps the cap table
// rendering with plain-English labels — see docs/13_starter_prompts.md Prompt 7.
const FALLBACK_PACK: CountryPack = {
  code: "generic",
  version: "0.0.0",
  packVersion: "generic@0.0.0",
  displayName: "Generic",
  jurisdiction: "us",
  currency: "USD",
  capitalMinimum: 0,
  entityTypes: [],
  registryId: { label: "Registry ID", pattern: /.*/, example: "" },
  registryLinkTemplate: "{id}",
  instruments: [],
  defaults: {
    capital: 0,
    authorizedUnits: 0,
    parValue: 0,
    vestingTotalMonths: 48,
    vestingCliffMonths: 12,
    vestingFrequency: "monthly",
  },
  legalReferences: {},
  equityUnitNoun: (): EquityUnitNoun => ({ singular: "share", plural: "shares", display: "Shares" }),
  validateCapital: () => [],
  validateRegistryId: () => true,
  validateTransactionDate: () => [],
};

// All packs available for the jurisdiction switcher (deduped — each pack once).
export const AVAILABLE_PACKS: CountryPack[] = [usPack, dkPack, noPack, ukPack];

export function getPackByEntityType(entityType: string): CountryPack {
  return REGISTRY[entityType] ?? FALLBACK_PACK;
}

export function getPackForCompany(company: { entityType: string }): CountryPack {
  return getPackByEntityType(company.entityType);
}

// The display label for a security, jurisdiction-aware. Equity units take the
// pack's noun for the company's entity type (shares ↔ anparter ↔ aktier);
// everything else uses the instrument's local name, falling back to the subtype.
export function securityLabel(
  pack: CountryPack,
  category: SecurityCategory | string,
  subtype: string,
  entityType: string,
): string {
  if (category === "equity_unit") return pack.equityUnitNoun(entityType).display;
  const inst = pack.instruments.find((i) => i.subtype === subtype);
  if (inst) return inst.localName;
  // Generic English fallbacks for the seeded US subtypes when no pack matches.
  const GENERIC: Record<string, string> = {
    common_stock: "Common stock",
    iso: "ISO options",
    nso: "NSO options",
    safe: "SAFE",
  };
  return GENERIC[subtype] ?? subtype;
}
