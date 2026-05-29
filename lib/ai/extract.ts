// Shared types + schema for AI cap-table extraction. Lives outside the route so
// both the server (generateObject) and the client (response typing) agree on
// the shape. The extracted shape mirrors the bulk-add grid (lib/bulk-add/parse).
import { z } from "zod";

import { STAKEHOLDER_TYPES, type BulkField, type BulkRow, emptyRow } from "@/lib/bulk-add/parse";

// Securities the extractor is allowed to emit (matches lib/bulk-add SECURITIES).
const SECURITY_KEYS = ["common_stock", "iso", "nso", "safe"] as const;

export const extractedRowSchema = z.object({
  name: z.string(),
  email: z.string(),
  type: z.enum(STAKEHOLDER_TYPES),
  security: z.enum(SECURITY_KEYS),
  quantity: z.string(),
  date: z.string(),
  vesting: z.string(),
  strike: z.string(),
  notes: z.string(),
});

export const extractionSchema = z.object({
  rows: z.array(extractedRowSchema),
  assumptions: z.array(z.string()),
});

export type ExtractedRow = z.infer<typeof extractedRowSchema>;
export type Extraction = z.infer<typeof extractionSchema>;

// Response payload from POST /api/ai/extract.
export type ExtractResponse =
  | { ok: true; rows: BulkRow[]; assumptions: string[] }
  | { ok: false; error: string; paywall?: boolean };

// Convert a model-extracted row into a full BulkRow (every BulkField present),
// so it drops straight into the editable grid without further massaging.
export function toBulkRow(r: ExtractedRow): BulkRow {
  const row = emptyRow();
  const fields: BulkField[] = [
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
  for (const f of fields) row[f] = String(r[f] ?? "").trim();
  return row;
}
