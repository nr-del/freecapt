// The canonical Data room layout (docs/01_mvp_scope.md §5.26): a structured,
// jurisdiction-aware folder repository that knows what documents a company
// *should* have. Folder + slot names are English (the product is English-only
// behind the auth wall) with the jurisdiction's local title shown alongside.
//
// Slots are matched to stored documents by `key` (persisted on
// documents.templateUsed). Adding a jurisdiction's local titles = extending the
// LOCAL_TITLES map; no core change.
import type { JurisdictionCode } from "@/lib/packs/_shared/types";

// Where a slot's document comes from. `auto` slots are generated from cap-table
// data and are always considered present (e.g. the shareholder register).
export type SlotSource = "auto" | "template" | "upload";

export interface DataRoomSlot {
  key: string; // stable slot key, stored on documents.templateUsed
  name: string; // English slot name
  description?: string; // shown in the +Add modal
  source: SlotSource; // primary/expected source
  paidToGenerate?: boolean; // generate-from-template is a Paid feature (§6.6)
  multiple?: boolean; // a collection (per stakeholder / per grant), not a single doc
  required?: boolean; // counts toward the readiness score
}

export interface DataRoomFolder {
  number: number;
  key: string;
  name: string;
  slots: DataRoomSlot[];
}

// Jurisdiction-local titles for slots that have an established local-language
// name. Keyed by slot key → jurisdiction → title. Missing entries fall back to
// the English slot name.
const LOCAL_TITLES: Record<string, Partial<Record<JurisdictionCode, string>>> = {
  certificate_of_incorporation: {
    dk: "Stiftelsesdokument",
    no: "Stiftelsesdokument",
    uk: "Certificate of Incorporation",
    us: "Certificate of Incorporation",
  },
  articles_of_association: {
    dk: "Vedtægter",
    no: "Vedtekter",
    uk: "Articles of Association",
    us: "Bylaws",
  },
  shareholder_register: {
    dk: "Ejerbog",
    no: "Aksjeeierbok",
    uk: "Register of Members",
    us: "Stock ledger",
  },
  shareholders_agreement: {
    dk: "Anpartshaveraftale",
    no: "Aksjeeieravtale",
    uk: "Shareholders' Agreement",
    us: "Stockholders' Agreement",
  },
  board_minutes: {
    dk: "Bestyrelsesreferat",
    no: "Styreprotokoll",
    uk: "Board minutes",
    us: "Board minutes",
  },
  shareholder_resolutions: {
    dk: "Generalforsamlingsprotokol",
    no: "Generalforsamlingsprotokoll",
    uk: "Shareholder resolutions",
    us: "Stockholder consents",
  },
};

// The jurisdiction-appropriate display title for a slot ("Vedtægter" for DK).
// Returns the English name when there's no local override.
export function slotLocalTitle(slotKey: string, jurisdiction: JurisdictionCode): string | null {
  const local = LOCAL_TITLES[slotKey]?.[jurisdiction];
  return local ?? null;
}

// The base layout shared by all jurisdictions (folders 1–9). German GmbH adds a
// notary folder (10) — guarded for when a DE/GmbH pack lands.
const BASE_FOLDERS: DataRoomFolder[] = [
  {
    number: 1,
    key: "formation",
    name: "Formation",
    slots: [
      {
        key: "certificate_of_incorporation",
        name: "Certificate of Incorporation",
        source: "upload",
        required: true,
        description: "The state/registry document that created the company.",
      },
      {
        key: "articles_of_association",
        name: "Articles of Association",
        source: "template",
        paidToGenerate: true,
        required: true,
        description: "The company's constitution. Usually produced at incorporation — upload what you have, or generate a starting point.",
      },
      {
        key: "registry_filing_confirmation",
        name: "Initial registry filing confirmation",
        source: "upload",
        description: "Proof the company is registered with the authority.",
      },
    ],
  },
  {
    number: 2,
    key: "equity_register",
    name: "Equity register",
    slots: [
      {
        key: "shareholder_register",
        name: "Shareholder register",
        source: "auto",
        required: true,
        description: "Generated from your cap table — always current.",
      },
      {
        key: "share_certificates",
        name: "Share certificates",
        source: "upload",
        multiple: true,
        description: "Per stakeholder, if issued.",
      },
      {
        key: "authorized_capital_doc",
        name: "Authorized capital documentation",
        source: "upload",
      },
    ],
  },
  {
    number: 3,
    key: "share_issuances",
    name: "Share issuances & transfers",
    slots: [
      {
        key: "share_purchase_agreements",
        name: "Share Purchase Agreements",
        source: "template",
        paidToGenerate: true,
        multiple: true,
        description: "Per founder, per investor.",
      },
      { key: "transfer_agreements", name: "Transfer agreements", source: "upload", multiple: true },
    ],
  },
  {
    number: 4,
    key: "options",
    name: "Options & employee equity",
    slots: [
      { key: "option_pool_consent", name: "Option pool board consent", source: "template", paidToGenerate: true },
      {
        key: "option_grant_agreements",
        name: "Option grant agreements",
        source: "template",
        paidToGenerate: true,
        multiple: true,
        description: "Per grant — ISO / NSO / EMI / Tegningsoption / VSOP.",
      },
      { key: "option_plan", name: "Option plan / scheme document", source: "template", paidToGenerate: true },
    ],
  },
  {
    number: 5,
    key: "convertibles",
    name: "Convertibles",
    slots: [
      {
        key: "convertible_instruments",
        name: "SAFEs / convertible notes",
        source: "template",
        paidToGenerate: true,
        multiple: true,
        description: "Per instrument — SAFE / ASA / Konvertibelt gældsbrev / Wandeldarlehen.",
      },
    ],
  },
  {
    number: 6,
    key: "investor_agreements",
    name: "Investor agreements",
    slots: [
      {
        key: "shareholders_agreement",
        name: "Shareholders' Agreement",
        source: "template",
        paidToGenerate: true,
        required: true,
        description: "A jurisdiction-appropriate SHA for SMB-stage companies. Word format, ready for your lawyer to review.",
      },
      { key: "voting_agreement", name: "Voting Agreement", source: "upload" },
      { key: "investment_agreement", name: "Investment Agreement", source: "upload", description: "For priced rounds." },
    ],
  },
  {
    number: 7,
    key: "governance",
    name: "Governance",
    slots: [
      { key: "board_minutes", name: "Board minutes", source: "upload", multiple: true },
      { key: "shareholder_resolutions", name: "Shareholder resolutions", source: "upload", multiple: true },
      { key: "written_consents", name: "Written consents in lieu of meetings", source: "upload", multiple: true },
    ],
  },
  {
    number: 8,
    key: "founder_agreements",
    name: "Founder & key employee agreements",
    slots: [
      {
        key: "founder_employment_agreements",
        name: "Founder employment agreements",
        source: "template",
        paidToGenerate: true,
        multiple: true,
        description: "With vesting + IP assignment + non-compete.",
      },
      { key: "ip_assignment", name: "IP assignment agreements", source: "template", paidToGenerate: true, multiple: true },
      { key: "restrictive_covenants", name: "Restrictive covenants", source: "upload", multiple: true },
    ],
  },
  {
    number: 9,
    key: "other",
    name: "Other corporate documents",
    slots: [
      {
        key: "other",
        name: "Other documents",
        source: "upload",
        multiple: true,
        description: "Free-form uploads that don't fit a canonical slot.",
      },
    ],
  },
];

// German GmbH notary folder (§15 GmbHG). Added when a DE/GmbH entity type lands.
const NOTARY_FOLDER: DataRoomFolder = {
  number: 10,
  key: "notary",
  name: "Notary documents",
  slots: [
    {
      key: "notary_deeds",
      name: "Notarized deeds",
      source: "upload",
      multiple: true,
      description: "Notarisierte Urkunden — required for GmbH share transfers.",
    },
  ],
};

// The Data room layout for a company. Jurisdiction drives local titles; entity
// type adds jurisdiction-specific folders (GmbH notary).
export function getDataRoomLayout(
  jurisdiction: JurisdictionCode,
  entityType: string,
): DataRoomFolder[] {
  const isGmbH = entityType.startsWith("de-");
  return isGmbH ? [...BASE_FOLDERS, NOTARY_FOLDER] : BASE_FOLDERS;
}

// All slot keys that count toward the readiness score, across the layout.
export function requiredSlotKeys(folders: DataRoomFolder[]): string[] {
  return folders.flatMap((f) => f.slots.filter((s) => s.required).map((s) => s.key));
}
