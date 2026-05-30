// Renders a ShareholderRegister to a print-ready, A4 PDF using pdf-lib (pure
// TS, no native binaries — safe in a Next.js serverless route). The output is a
// clean statutory register: identity header, a one-row-per-holder table, totals
// and a generation footer. Document metadata is set so the file is self-
// describing when downloaded.
import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import type { ShareholderRegister, RegisterEntry } from "./register";

// Geometry (A4 portrait, points). 1pt = 1/72in.
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Brand emerald (#059669) + slate ink, matching the app's color canon.
const BRAND = rgb(0.02, 0.588, 0.412);
const INK = rgb(0.118, 0.161, 0.231); // slate-800
const MUTED = rgb(0.392, 0.455, 0.545); // slate-500
const HAIRLINE = rgb(0.886, 0.91, 0.941); // slate-200

// Column layout (x offsets from left margin, widths in pt). Numeric columns are
// right-aligned to their right edge.
const COL = {
  num: { x: 0, w: 24 },
  holder: { x: 24, w: 200 },
  klass: { x: 224, w: 110 },
  shares: { x: 334, right: 410 },
  pct: { x: 410, right: 458 },
  nominal: { x: 458, right: CONTENT_W },
};

const intFmt = new Intl.NumberFormat("en-US");
const pctFmt = (n: number) => `${n.toFixed(2)}%`;

export async function renderRegisterPdf(reg: ShareholderRegister): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  pdf.setTitle(`${reg.title} — ${reg.legalName}`);
  pdf.setAuthor(reg.legalName);
  pdf.setSubject("Statutory shareholder register");
  pdf.setCreator("FreeCapT (freecapt.com)");
  pdf.setProducer("FreeCapT");
  pdf.setCreationDate(reg.generatedAt);
  pdf.setModificationDate(reg.generatedAt);

  const money = (n: number | null): string => {
    if (n == null) return "—";
    const cur = reg.parValueCurrency?.trim();
    return cur
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(n)
      : intFmt.format(n);
  };

  // --- pagination state ---
  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;
  let pageNo = 1;
  const pages: PDFPage[] = [page];

  const text = (
    s: string,
    x: number,
    yy: number,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {},
  ) => {
    page.drawText(s, {
      x: MARGIN + x,
      y: yy,
      font: opts.font ?? font,
      size: opts.size ?? 9,
      color: opts.color ?? INK,
    });
  };

  const textRight = (
    s: string,
    rightX: number,
    yy: number,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {},
  ) => {
    const f = opts.font ?? font;
    const size = opts.size ?? 9;
    const w = f.widthOfTextAtSize(s, size);
    page.drawText(s, { x: MARGIN + rightX - w, y: yy, font: f, size, color: opts.color ?? INK });
  };

  const hairline = (yy: number) => {
    page.drawLine({
      start: { x: MARGIN, y: yy },
      end: { x: MARGIN + CONTENT_W, y: yy },
      thickness: 0.75,
      color: HAIRLINE,
    });
  };

  const truncate = (s: string, maxW: number, f: PDFFont, size: number): string => {
    if (f.widthOfTextAtSize(s, size) <= maxW) return s;
    let out = s;
    while (out.length > 1 && f.widthOfTextAtSize(`${out}…`, size) > maxW) out = out.slice(0, -1);
    return `${out}…`;
  };

  // --- header (first page only) ---
  text("FreeC", 0, y, { font: bold, size: 11, color: INK });
  text("apT", 0 + bold.widthOfTextAtSize("FreeC", 11), y, { font: bold, size: 11, color: BRAND });
  textRight(reg.jurisdictionLabel, CONTENT_W, y, { size: 9, color: MUTED });
  y -= 28;

  text(reg.title, 0, y, { font: bold, size: 18, color: INK });
  if (reg.localTitle && reg.localTitle !== reg.title) {
    text(reg.localTitle, 0, y - 16, { size: 10, color: MUTED });
    y -= 16;
  }
  y -= 26;

  // Identity block: legal name + registry id + entity type.
  text(reg.legalName, 0, y, { font: bold, size: 12, color: INK });
  y -= 15;
  const idParts = [
    reg.entityTypeLabel,
    reg.registryIdentifier ? `Reg. no. ${reg.registryIdentifier}` : null,
  ].filter(Boolean) as string[];
  if (idParts.length) {
    text(idParts.join("  ·  "), 0, y, { size: 9, color: MUTED });
    y -= 15;
  }
  y -= 8;
  hairline(y);
  y -= 18;

  // --- table header ---
  const drawTableHeader = () => {
    text("#", COL.num.x, y, { font: bold, size: 8, color: MUTED });
    text("HOLDER", COL.holder.x, y, { font: bold, size: 8, color: MUTED });
    text("CLASS", COL.klass.x, y, { font: bold, size: 8, color: MUTED });
    textRight(reg.unitNounPlural.toUpperCase(), COL.shares.right, y, {
      font: bold,
      size: 8,
      color: MUTED,
    });
    textRight("%", COL.pct.right, y, { font: bold, size: 8, color: MUTED });
    textRight("NOMINAL", COL.nominal.right, y, { font: bold, size: 8, color: MUTED });
    y -= 10;
    hairline(y);
    y -= 14;
  };
  drawTableHeader();

  const ROW_H = 18;
  const BOTTOM_LIMIT = MARGIN + 70; // leave room for totals + footer

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    pageNo += 1;
    y = PAGE_H - MARGIN;
    drawTableHeader();
  };

  const drawRow = (entry: RegisterEntry, idx: number) => {
    if (y < BOTTOM_LIMIT) newPage();
    text(String(idx + 1), COL.num.x, y, { size: 9, color: MUTED });
    text(truncate(entry.name, COL.holder.w - 6, font, 9), COL.holder.x, y, { size: 9 });
    text(truncate(entry.shareClass, COL.klass.w - 6, font, 9), COL.klass.x, y, {
      size: 9,
      color: MUTED,
    });
    textRight(intFmt.format(entry.shares), COL.shares.right, y, { size: 9 });
    textRight(pctFmt(entry.pctIssued), COL.pct.right, y, { size: 9, color: MUTED });
    textRight(money(entry.nominalValue), COL.nominal.right, y, { size: 9, color: MUTED });
    y -= ROW_H;
  };

  if (reg.entries.length === 0) {
    text("No issued shares recorded.", COL.holder.x, y, { size: 9, color: MUTED });
    y -= ROW_H;
  } else {
    reg.entries.forEach(drawRow);
  }

  // --- totals row ---
  if (y < BOTTOM_LIMIT) newPage();
  y -= 2;
  hairline(y);
  y -= 16;
  text("Total issued", COL.holder.x, y, { font: bold, size: 9, color: INK });
  textRight(intFmt.format(reg.totalIssued), COL.shares.right, y, { font: bold, size: 9 });
  textRight("100.00%", COL.pct.right, y, { font: bold, size: 9, color: MUTED });
  const totalNominal =
    reg.parValue != null ? reg.parValue * reg.totalIssued : null;
  textRight(money(totalNominal), COL.nominal.right, y, { font: bold, size: 9 });
  y -= 18;

  // Per-class breakdown, only when the company has more than one share class.
  if (reg.classTotals.length > 0) {
    y -= 6;
    const summary = reg.classTotals
      .map((c) => `${c.shareClass}: ${intFmt.format(c.shares)} (${pctFmt(c.pctIssued)})`)
      .join("    ·    ");
    text(truncate(`By class — ${summary}`, CONTENT_W, font, 8), COL.holder.x, y, {
      size: 8,
      color: MUTED,
    });
    y -= 14;
  }

  const meta: string[] = [];
  if (reg.authorizedUnits != null) {
    meta.push(`Authorized: ${intFmt.format(reg.authorizedUnits)} ${reg.unitNounPlural}`);
  }
  if (reg.parValue != null && reg.parValueCurrency) {
    meta.push(`Par value: ${money(reg.parValue)} per ${reg.unitNounPlural.replace(/s$/, "")}`);
  }
  if (meta.length) {
    text(meta.join("    ·    "), COL.holder.x, y, { size: 8, color: MUTED });
  }

  // --- footer on every page ---
  const generatedLine = `Generated from the FreeCapT cap table on ${reg.generatedAt.toISOString().slice(0, 10)} (UTC). This document reflects the register as recorded at generation time.`;
  pages.forEach((p, i) => {
    p.drawLine({
      start: { x: MARGIN, y: MARGIN + 24 },
      end: { x: MARGIN + CONTENT_W, y: MARGIN + 24 },
      thickness: 0.5,
      color: HAIRLINE,
    });
    p.drawText(truncate(generatedLine, CONTENT_W - 60, font, 7), {
      x: MARGIN,
      y: MARGIN + 12,
      font,
      size: 7,
      color: MUTED,
    });
    const pageLabel = `Page ${i + 1} of ${pages.length}`;
    const w = font.widthOfTextAtSize(pageLabel, 7);
    p.drawText(pageLabel, { x: MARGIN + CONTENT_W - w, y: MARGIN + 12, font, size: 7, color: MUTED });
  });

  return pdf.save();
}
