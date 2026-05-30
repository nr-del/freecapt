// Server-side parser for Carta's "Equity Plan" Excel export. Carta lays the
// grant ledger out on a sheet called "Equity Plan Granted" with a banner title
// (rows 1-4) and the real column header a few rows down — so we scan for the
// header by keyword rather than assuming a fixed row, which keeps us robust to
// Carta reordering or renaming columns between exports.
//
// exceljs is a heavy, Node-only dependency, so this module is server-only and is
// only ever reached from a server action. The output (`CartaGrant[]`) is plain
// JSON so it can round-trip to the client for a preview/confirm step.
import "server-only";

import ExcelJS from "exceljs";

import type { StakeholderType } from "@/lib/bulk-add/parse";

export type CartaCategory = "equity_unit" | "option_like" | "convertible";

// One grant row, normalized and serializable for the preview table.
export type CartaGrant = {
  stakeholderName: string;
  stakeholderEmail: string; // "" when Carta has none
  type: StakeholderType;
  relationship: string; // raw Carta relationship, kept for context
  jobTitle: string;
  category: CartaCategory;
  subtype: string;
  shareClass: string; // "" for convertibles
  awardType: string; // raw Carta "Base Award Type"
  planName: string;
  quantity: number; // chosen: outstanding, falling back to issued
  quantityIssued: number;
  quantityOutstanding: number;
  strikePrice: number | null;
  vestingStartDate: string | null; // ISO yyyy-mm-dd
  vestingSchedule: string; // raw schedule name (no reliable duration in the export)
};

export type CartaParseResult =
  | { ok: true; grants: CartaGrant[]; shareClasses: string[]; warnings: string[]; skipped: number }
  | { ok: false; error: string };

// Carta names the grant sheet "Equity Plan Granted"; accept close variants.
const GRANT_SHEET_HINTS = ["equity plan granted", "equity plan", "granted", "outstanding equity"];

type Field =
  | "name"
  | "email"
  | "issued"
  | "outstanding"
  | "shareClass"
  | "plan"
  | "awardType"
  | "strike"
  | "vestingSchedule"
  | "vestingStart"
  | "relationship"
  | "jobTitle";

// Header keywords, most-specific first. We test each header cell against these
// in order and take the first field that matches, so "base award type" claims
// `awardType` before a looser "type" rule could grab it.
const HEADER_KEYWORDS: { field: Field; keywords: string[] }[] = [
  { field: "name", keywords: ["stakeholder name", "holder name", "participant name", "name"] },
  { field: "email", keywords: ["stakeholder email", "email", "e-mail"] },
  { field: "outstanding", keywords: ["quantity outstanding", "shares outstanding", "outstanding"] },
  { field: "issued", keywords: ["quantity issued", "shares issued", "quantity granted", "issued", "granted quantity"] },
  { field: "shareClass", keywords: ["share class", "security class", "stock class", "class"] },
  { field: "plan", keywords: ["plan name", "equity plan", "plan"] },
  { field: "awardType", keywords: ["base award type", "award type", "security type", "instrument"] },
  { field: "strike", keywords: ["exercise price", "strike price", "strike", "purchase price"] },
  { field: "vestingSchedule", keywords: ["vesting schedule", "vesting type", "schedule"] },
  { field: "vestingStart", keywords: ["vesting start date", "vesting start", "vest start", "vesting commencement"] },
  { field: "relationship", keywords: ["relationship", "stakeholder relationship"] },
  { field: "jobTitle", keywords: ["job title", "title", "position"] },
];

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

// exceljs cell values are a union (string, number, Date, formula result, rich
// text, hyperlink object). Coerce any of them to display text.
function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    const v = value as unknown as Record<string, unknown>;
    if ("text" in v && typeof v.text === "string") return v.text.trim();
    if ("result" in v) return cellText(v.result as ExcelJS.CellValue);
    if ("richText" in v && Array.isArray(v.richText)) {
      return v.richText.map((r) => (r as { text?: string }).text ?? "").join("").trim();
    }
    if ("hyperlink" in v && typeof v.hyperlink === "string") return String(v.hyperlink).trim();
  }
  return "";
}

function cellNumber(value: ExcelJS.CellValue): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const t = cellText(value).replace(/[$£€,\s]/g, "");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// Vesting Start Date arrives as a JS Date (typed cells), an Excel serial number,
// or a string — handle all three and return an ISO date or null.
function cellIsoDate(value: ExcelJS.CellValue): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && value > 0) {
    // Excel serial date → JS: day 1 is 1900-01-01, with the well-known 1900 leap bug.
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  const t = cellText(value);
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const slash = t.match(/^(\d{1,4})[/.](\d{1,2})[/.](\d{1,4})$/);
  if (slash) {
    const [, g1 = "", g2 = "", g3 = ""] = slash;
    const yearFirst = g1.length === 4;
    const y = yearFirst ? g1 : g3.length === 2 ? `20${g3}` : g3;
    const d = yearFirst ? g3 : g1;
    const iso = `${y.padStart(4, "0")}-${g2.padStart(2, "0")}-${d.padStart(2, "0")}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
  }
  const parsed = new Date(t);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

// Map a Carta relationship/award context to one of our stakeholder types.
function relationshipToType(relationship: string): StakeholderType {
  const r = norm(relationship);
  if (!r) return "other";
  if (r.includes("founder")) return "founder";
  if (r.includes("employee") || r.includes("staff")) return "employee";
  if (r.includes("investor") || r.includes("shareholder")) return "investor";
  if (r.includes("advisor") || r.includes("adviser") || r.includes("consultant") || r.includes("mentor"))
    return "advisor";
  if (r.includes("entity") || r.includes("company") || r.includes("fund") || r.includes("trust"))
    return "entity";
  return "other";
}

// Derive (category, subtype) from Carta's "Base Award Type", share class, and
// whether there's a strike — Carta's award types are jurisdiction-flavoured
// ("EMI", "EU WARRANT", "ISO", "SAFE"), so we keyword-classify them.
function classifyAward(
  awardType: string,
  shareClass: string,
  strike: number | null,
): { category: CartaCategory; subtype: string } {
  const a = norm(awardType);
  const c = norm(shareClass);

  if (/(safe|convertible|conv\.? note|kisses|loan note|g"ldsbrev|note)/.test(a)) {
    return { category: "convertible", subtype: a.includes("note") ? "convertible_note" : "safe" };
  }
  if (a.includes("warrant")) return { category: "option_like", subtype: "warrant" };
  if (a.includes("emi")) return { category: "option_like", subtype: "emi" };
  if (a.includes("iso") || a.includes("incentive stock")) return { category: "option_like", subtype: "iso" };
  if (a.includes("nso") || a.includes("non-qualified") || a.includes("nonqualified") || a.includes("nonstatutory"))
    return { category: "option_like", subtype: "nso" };
  if (a.includes("sar") || a.includes("appreciation")) return { category: "option_like", subtype: "sar" };
  if (a.includes("rsu") || a.includes("restricted stock unit")) return { category: "option_like", subtype: "rsu" };
  if (a.includes("option") || a.includes("optio")) return { category: "option_like", subtype: "option" };

  // No explicit option/convertible signal: a strike usually means an option-like
  // award, otherwise treat it as a straight equity unit (shares).
  if (strike != null && strike > 0) return { category: "option_like", subtype: "option" };

  if (a.includes("rsa") || a.includes("restricted stock")) return { category: "equity_unit", subtype: "rsa" };
  if (c.includes("preferred") || a.includes("preferred")) return { category: "equity_unit", subtype: "preferred_stock" };
  return { category: "equity_unit", subtype: "common_stock" };
}

// Locate the worksheet most likely to hold the grant ledger.
function pickSheet(wb: ExcelJS.Workbook): ExcelJS.Worksheet | null {
  for (const hint of GRANT_SHEET_HINTS) {
    const match = wb.worksheets.find((ws) => norm(ws.name).includes(hint));
    if (match) return match;
  }
  return wb.worksheets[0] ?? null;
}

// Scan the first rows for the column header, returning the row index and a
// field→column-number map. Requires a name column plus at least one quantity
// column to be confident it's really the header.
function findHeader(
  ws: ExcelJS.Worksheet,
): { headerRow: number; cols: Partial<Record<Field, number>> } | null {
  const maxScan = Math.min(ws.rowCount, 30);
  for (let r = 1; r <= maxScan; r++) {
    const row = ws.getRow(r);
    const cols: Partial<Record<Field, number>> = {};
    let matched = 0;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const text = norm(cellText(cell.value));
      if (!text) return;
      for (const { field, keywords } of HEADER_KEYWORDS) {
        if (cols[field] != null) continue; // first column wins for a field
        if (keywords.some((kw) => text === kw || text.includes(kw))) {
          cols[field] = colNumber;
          matched++;
          break;
        }
      }
    });
    if (cols.name != null && (cols.issued != null || cols.outstanding != null) && matched >= 3) {
      return { headerRow: r, cols };
    }
  }
  return null;
}

export async function parseCartaWorkbook(buffer: ArrayBuffer | Buffer): Promise<CartaParseResult> {
  const wb = new ExcelJS.Workbook();
  try {
    const buf = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;
    // exceljs's bundled Buffer type skews against this @types/node version;
    // the runtime accepts the Node Buffer fine, so bypass the structural check.
    await wb.xlsx.load(buf as never);
  } catch {
    return { ok: false, error: "That file didn't read as an Excel workbook (.xlsx)." };
  }

  const ws = pickSheet(wb);
  if (!ws) return { ok: false, error: "The workbook has no worksheets." };

  const header = findHeader(ws);
  if (!header) {
    return {
      ok: false,
      error:
        "Couldn't find the grant table in this file. Export the \"Equity Plan\" report from Carta and upload the .xlsx.",
    };
  }

  const { headerRow, cols } = header;
  const grants: CartaGrant[] = [];
  const classSet = new Set<string>();
  const warnings: string[] = [];
  let skipped = 0;

  const get = (row: ExcelJS.Row, field: Field): ExcelJS.CellValue => {
    const col = cols[field];
    return col == null ? null : row.getCell(col).value;
  };

  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const name = cellText(get(row, "name"));
    if (!name) continue; // blank / spacer / totals row

    // Skip an accidental re-matched header or footer row.
    if (norm(name) === "stakeholder name" || norm(name).startsWith("total")) continue;

    const issued = cellNumber(get(row, "issued")) ?? 0;
    const outstanding = cellNumber(get(row, "outstanding"));
    const quantity = outstanding != null && outstanding > 0 ? outstanding : issued;

    const awardType = cellText(get(row, "awardType"));
    const shareClassRaw = cellText(get(row, "shareClass"));
    const strike = cellNumber(get(row, "strike"));
    const { category, subtype } = classifyAward(awardType, shareClassRaw, strike);

    // A zero-quantity, non-convertible row is a fully-cancelled/returned grant —
    // nothing to put on the cap table, so skip it (and count it for the summary).
    if (category !== "convertible" && quantity <= 0) {
      skipped++;
      continue;
    }

    const shareClass = category === "convertible" ? "" : shareClassRaw.trim() || "common";
    if (shareClass) classSet.add(shareClass);

    grants.push({
      stakeholderName: name,
      stakeholderEmail: cellText(get(row, "email")),
      type: relationshipToType(cellText(get(row, "relationship"))),
      relationship: cellText(get(row, "relationship")),
      jobTitle: cellText(get(row, "jobTitle")),
      category,
      subtype,
      shareClass,
      awardType,
      planName: cellText(get(row, "plan")),
      quantity,
      quantityIssued: issued,
      quantityOutstanding: outstanding ?? 0,
      strikePrice: category === "option_like" && strike != null && strike > 0 ? strike : null,
      vestingStartDate: cellIsoDate(get(row, "vestingStart")),
      vestingSchedule: cellText(get(row, "vestingSchedule")),
    });
  }

  if (grants.length === 0) {
    return { ok: false, error: "No live grants found in that file — every row had zero outstanding." };
  }
  if (skipped > 0) {
    warnings.push(`Skipped ${skipped} cancelled or fully-returned grant${skipped === 1 ? "" : "s"} (zero outstanding).`);
  }

  return { ok: true, grants, shareClasses: Array.from(classSet).sort(), warnings, skipped };
}
