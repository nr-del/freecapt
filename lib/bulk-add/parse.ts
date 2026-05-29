// Pure helpers for the bulk-add paste flow. No client/server-only imports —
// safe to use in both the modal (client) and the server action.
// Spec: docs/01_mvp_scope.md §5.15 (Bulk stakeholder add).

export type BulkField =
  | "name"
  | "email"
  | "type"
  | "security"
  | "quantity"
  | "date"
  | "vesting"
  | "strike"
  | "notes";

export type BulkRow = Record<BulkField, string>;

export const COLUMNS: { key: BulkField; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "type", label: "Type" },
  { key: "security", label: "Security" },
  { key: "quantity", label: "Quantity / amount" },
  { key: "date", label: "Date" },
  { key: "vesting", label: "Vesting" },
  { key: "strike", label: "Strike" },
  { key: "notes", label: "Notes" },
];

export function emptyRow(): BulkRow {
  return {
    name: "",
    email: "",
    type: "",
    security: "",
    quantity: "",
    date: "",
    vesting: "",
    strike: "",
    notes: "",
  };
}

export const STAKEHOLDER_TYPES = [
  "founder",
  "employee",
  "investor",
  "advisor",
  "entity",
  "other",
] as const;
export type StakeholderType = (typeof STAKEHOLDER_TYPES)[number];

const TYPE_ALIASES: Record<string, StakeholderType> = {
  founder: "founder",
  cofounder: "founder",
  "co-founder": "founder",
  ceo: "founder",
  employee: "employee",
  staff: "employee",
  team: "employee",
  hire: "employee",
  investor: "investor",
  vc: "investor",
  angel: "investor",
  fund: "investor",
  advisor: "advisor",
  adviser: "advisor",
  mentor: "advisor",
  entity: "entity",
  company: "entity",
  trust: "entity",
  other: "other",
};

// Returns the normalized type, or null if the value is non-empty but unknown.
// Blank defaults to "other" (a valid catch-all).
export function normalizeType(raw: string): StakeholderType | null {
  const s = raw.trim().toLowerCase();
  if (!s) return "other";
  return TYPE_ALIASES[s] ?? null;
}

export type SecurityKey = "common_stock" | "iso" | "nso" | "safe";
export type SecurityKind = "quantity" | "money";

export const SECURITIES: Record<
  SecurityKey,
  { label: string; category: "equity_unit" | "option_like" | "convertible"; kind: SecurityKind }
> = {
  common_stock: { label: "Common stock", category: "equity_unit", kind: "quantity" },
  iso: { label: "ISO options", category: "option_like", kind: "quantity" },
  nso: { label: "NSO options", category: "option_like", kind: "quantity" },
  safe: { label: "SAFE", category: "convertible", kind: "money" },
};

const SECURITY_ALIASES: Record<string, SecurityKey> = {
  common: "common_stock",
  commonstock: "common_stock",
  commonshares: "common_stock",
  shares: "common_stock",
  share: "common_stock",
  stock: "common_stock",
  ordinary: "common_stock",
  ordinaryshares: "common_stock",
  equity: "common_stock",
  iso: "iso",
  isos: "iso",
  isooptions: "iso",
  incentivestockoption: "iso",
  incentivestockoptions: "iso",
  nso: "nso",
  nsos: "nso",
  nsooptions: "nso",
  nonqualified: "nso",
  nonqualifiedstockoption: "nso",
  option: "nso",
  options: "nso",
  safe: "safe",
  safenote: "safe",
};

// Blank defaults to common_stock; non-empty but unknown returns null.
export function normalizeSecurity(raw: string): SecurityKey | null {
  const s = raw.trim().toLowerCase().replace(/[\s_.-]/g, "");
  if (!s) return "common_stock";
  return SECURITY_ALIASES[s] ?? null;
}

// Parse a number that may include thousands separators or a currency symbol.
export function parseAmount(raw: string): number | null {
  const s = raw.trim().replace(/[$£€,\s]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isEmail(raw: string): boolean {
  return EMAIL_RE.test(raw.trim());
}

// Normalize a date to YYYY-MM-DD, or null if unparseable. Accepts ISO and
// common slash forms. Returns null only when a non-empty value can't be parsed.
export function toIsoDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const slash = s.match(/^(\d{1,4})[/.](\d{1,2})[/.](\d{1,4})$/);
  if (slash) {
    const [, g1 = "", g2 = "", g3 = ""] = slash;
    // If the first group is a 4-digit year, treat as Y/M/D; else D/M/Y.
    const yearFirst = g1.length === 4;
    const y = yearFirst ? g1 : g3.length === 2 ? `20${g3}` : g3;
    const m = g2;
    const d = yearFirst ? g3 : g1;
    const iso = `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
  }
  return null;
}

export type Vesting = {
  totalMonths: number | null;
  cliffMonths: number | null;
  frequency: string | null;
};

// Best-effort vesting parse. Never throws; unrecognized input yields nulls.
// Recognizes forms like "4y", "4y/1y", "48/12", "4 years 1 year cliff".
export function parseVesting(raw: string): Vesting {
  const s = raw.trim().toLowerCase();
  if (!s) return { totalMonths: null, cliffMonths: null, frequency: null };

  // "48/12" or "4y/1y"
  const slash = s.match(/(\d+)\s*(y(?:ears?|r)?)?\s*\/\s*(\d+)\s*(y(?:ears?|r)?)?/);
  if (slash) {
    const total = Number(slash[1]) * (slash[2] ? 12 : 1);
    const cliff = Number(slash[3]) * (slash[4] ? 12 : 1);
    return { totalMonths: total, cliffMonths: cliff, frequency: "monthly" };
  }

  let total: number | null = null;
  let cliff: number | null = null;
  const totalMatch = s.match(/(\d+)\s*y(?:ears?|r)?/);
  if (totalMatch?.[1]) total = Number(totalMatch[1]) * 12;
  const cliffMatch = s.match(/(\d+)\s*y?(?:ears?|r)?\s*(?:month|mo)?s?\s*cliff|cliff[^0-9]*(\d+)/);
  if (cliffMatch) {
    const n = cliffMatch[1] ?? cliffMatch[2];
    if (n) cliff = Number(n) * (s.includes("year") || /\dy/.test(s) ? 12 : 1);
  }
  return { totalMonths: total, cliffMonths: cliff, frequency: total ? "monthly" : null };
}

export type RowErrors = Partial<Record<BulkField, string>>;

export function isRowEmpty(row: BulkRow): boolean {
  return COLUMNS.every(({ key }) => row[key].trim() === "");
}

// Validate one row. Empty rows produce no errors (they're skipped on submit).
export function validateRow(row: BulkRow): RowErrors {
  const errors: RowErrors = {};
  if (isRowEmpty(row)) return errors;

  if (!row.name.trim()) errors.name = "Name is required.";

  if (row.email.trim() && !isEmail(row.email)) errors.email = "Doesn't look like an email address.";

  if (normalizeType(row.type) === null) {
    errors.type = "Unknown type. Try founder, employee, investor, advisor, or entity.";
  }

  const sec = normalizeSecurity(row.security);
  if (sec === null) {
    errors.security = "Unknown security. Try common stock, ISO, NSO, or SAFE.";
  }

  const amount = parseAmount(row.quantity);
  if (amount === null || amount <= 0) {
    errors.quantity =
      sec && SECURITIES[sec].kind === "money"
        ? "Enter the invested amount."
        : "Enter a quantity greater than zero.";
  }

  if (row.date.trim() && toIsoDate(row.date) === null) {
    errors.date = "Use a date like 2024-01-15.";
  }

  if (row.strike.trim() && parseAmount(row.strike) === null) {
    errors.strike = "Strike must be a number.";
  }

  return errors;
}

export function rowHasErrors(row: BulkRow): boolean {
  return Object.keys(validateRow(row)).length > 0;
}

// Rows that are non-empty and error-free — the set that will be created.
export function validRows(rows: BulkRow[]): BulkRow[] {
  return rows.filter((r) => !isRowEmpty(r) && !rowHasErrors(r));
}

// --- Paste parsing -------------------------------------------------------

const HEADER_KEYWORDS: Record<BulkField, string[]> = {
  name: ["name", "stakeholder", "holder", "person", "who"],
  email: ["email", "e-mail", "mail"],
  type: ["type", "role", "relationship"],
  security: ["security", "instrument", "class", "shareclass"],
  quantity: ["quantity", "qty", "shares", "amount", "units", "number", "count"],
  date: ["date", "issued", "issue", "granted", "grant"],
  vesting: ["vesting", "vest", "schedule"],
  strike: ["strike", "exercise", "price"],
  notes: ["notes", "note", "comment", "comments"],
};

function splitCells(line: string, delimiter: string): string[] {
  return line.split(delimiter).map((c) => c.trim());
}

// Detect whether the first row is a header and, if so, map column index → field.
function detectHeaderMapping(cells: string[]): (BulkField | null)[] | null {
  let matches = 0;
  const mapping: (BulkField | null)[] = cells.map((cell) => {
    const c = cell.toLowerCase().trim();
    for (const col of COLUMNS) {
      if (HEADER_KEYWORDS[col.key].some((kw) => c === kw || c.includes(kw))) {
        matches++;
        return col.key;
      }
    }
    return null;
  });
  // Treat as a header only if at least two cells look like known column names.
  return matches >= 2 ? mapping : null;
}

const DEFAULT_ORDER: BulkField[] = [
  "name",
  "email",
  "type",
  "security",
  "quantity",
  "date",
  "vesting",
  "strike",
  "notes",
];

// Parse pasted spreadsheet text (tab- or comma-separated) into rows.
export function parsePaste(text: string): BulkRow[] {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];

  const delimiter = lines.some((l) => l.includes("\t")) ? "\t" : ",";
  const grid = lines.map((l) => splitCells(l, delimiter));

  const firstRow = grid[0] ?? [];
  const headerMapping = detectHeaderMapping(firstRow);
  const dataRows = headerMapping ? grid.slice(1) : grid;
  const mapping: (BulkField | null)[] =
    headerMapping ?? DEFAULT_ORDER.map((f, i) => (i < firstRow.length ? f : null));

  return dataRows.map((cells) => {
    const row = emptyRow();
    cells.forEach((value, i) => {
      const field = mapping[i];
      if (field) row[field] = value;
    });
    return row;
  });
}
