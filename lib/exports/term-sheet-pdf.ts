// Renders a TermSheet to a print-ready A4 PDF using pdf-lib (pure TS, no native
// binaries — safe in a serverless route). Mirrors the register PDF's house style
// (FreeCapT wordmark, emerald accents, slate ink, per-page footer). Layout:
// identity header → round-terms summary grid → allocation table → key terms →
// signature lines → non-binding disclaimer footer.
import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import type { TermSheet, TermSheetInvestor } from "./term-sheet";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

const BRAND = rgb(0.02, 0.588, 0.412);
const INK = rgb(0.118, 0.161, 0.231); // slate-800
const MUTED = rgb(0.392, 0.455, 0.545); // slate-500
const HAIRLINE = rgb(0.886, 0.91, 0.941); // slate-200

const intFmt = new Intl.NumberFormat("en-US");
const pctFmt = (n: number) => `${n.toFixed(2)}%`;

// Allocation columns (x from margin / right edges for numeric columns).
const COL = {
  name: { x: 0, w: 200 },
  amount: { right: 320 },
  pctRound: { right: 390 },
  shares: { right: 470 },
  pctPost: { right: CONTENT_W },
};

export async function renderTermSheetPdf(ts: TermSheet): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  pdf.setTitle(`${ts.title} — ${ts.legalName}`);
  pdf.setAuthor(ts.legalName);
  pdf.setSubject("Non-binding term sheet draft");
  pdf.setCreator("FreeCapT (freecapt.com)");
  pdf.setProducer("FreeCapT");
  pdf.setCreationDate(ts.generatedAt);
  pdf.setModificationDate(ts.generatedAt);

  const money = (n: number): string =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: ts.currency, maximumFractionDigits: 0 }).format(n);
  const moneyPrecise = (n: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: ts.currency,
      maximumFractionDigits: n < 1 ? 4 : 2,
    }).format(n);

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;
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

  // Word-wrap a paragraph into lines fitting `maxW`, drawing at `size`.
  const wrap = (s: string, maxW: number, f: PDFFont, size: number): string[] => {
    const words = s.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(next, size) > maxW && line) {
        lines.push(line);
        line = w;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const BOTTOM_LIMIT = MARGIN + 70;
  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    y = PAGE_H - MARGIN;
  };
  const ensure = (needed: number) => {
    if (y - needed < BOTTOM_LIMIT) newPage();
  };

  // --- header ---
  text("FreeC", 0, y, { font: bold, size: 11, color: INK });
  text("apT", bold.widthOfTextAtSize("FreeC", 11), y, { font: bold, size: 11, color: BRAND });
  textRight(ts.jurisdictionLabel, CONTENT_W, y, { size: 9, color: MUTED });
  y -= 28;

  text(ts.title, 0, y, { font: bold, size: 18, color: INK });
  y -= 24;

  text(ts.legalName, 0, y, { font: bold, size: 12, color: INK });
  y -= 15;
  const idParts = [
    ts.entityTypeLabel,
    ts.registryIdentifier ? `${ts.registryLabel ?? "Reg. no."} ${ts.registryIdentifier}` : null,
  ].filter(Boolean) as string[];
  if (idParts.length) {
    text(idParts.join("  ·  "), 0, y, { size: 9, color: MUTED });
    y -= 15;
  }
  text(`Proposed priced round — prepared ${ts.generatedAt.toISOString().slice(0, 10)} (UTC)`, 0, y, {
    size: 9,
    color: MUTED,
  });
  y -= 12;
  hairline(y);
  y -= 22;

  // --- round terms grid ---
  text("Round terms", 0, y, { font: bold, size: 11, color: INK });
  y -= 16;
  const terms: Array<[string, string]> = [
    ["Round size", money(ts.roundSize)],
    ["Pre-money valuation", money(ts.preMoney)],
    ["Post-money valuation", money(ts.postMoney)],
    [`Price per ${ts.unitNounSingular}`, moneyPrecise(ts.pricePerShare)],
    [`New ${ts.unitNounPlural} issued`, intFmt.format(Math.round(ts.newMoneyShares))],
    ["New money ownership", pctFmt(ts.newMoneyPct)],
  ];
  if (ts.poolTopupPct != null && ts.poolTopupPct > 0) {
    terms.push(["Option pool (post)", `${ts.poolTopupPct.toFixed(1)}%`]);
  }
  if (ts.safeShares > 0) {
    terms.push([`Converted SAFE ${ts.unitNounPlural}`, intFmt.format(Math.round(ts.safeShares))]);
  }
  // Two-column key/value grid.
  const colW = CONTENT_W / 2;
  for (let i = 0; i < terms.length; i += 2) {
    ensure(16);
    const left = terms[i]!;
    text(left[0], 0, y, { size: 9, color: MUTED });
    text(left[1], 0, y - 11, { font: bold, size: 10, color: INK });
    const right = terms[i + 1];
    if (right) {
      text(right[0], colW, y, { size: 9, color: MUTED });
      text(right[1], colW, y - 11, { font: bold, size: 10, color: INK });
    }
    y -= 30;
  }
  y -= 4;
  hairline(y);
  y -= 20;

  // --- allocation table ---
  text("Investor allocation", 0, y, { font: bold, size: 11, color: INK });
  y -= 16;
  const drawAllocHeader = () => {
    text("INVESTOR", COL.name.x, y, { font: bold, size: 8, color: MUTED });
    textRight("AMOUNT", COL.amount.right, y, { font: bold, size: 8, color: MUTED });
    textRight("% ROUND", COL.pctRound.right, y, { font: bold, size: 8, color: MUTED });
    textRight(ts.unitNounPlural.toUpperCase(), COL.shares.right, y, { font: bold, size: 8, color: MUTED });
    textRight("% POST", COL.pctPost.right, y, { font: bold, size: 8, color: MUTED });
    y -= 10;
    hairline(y);
    y -= 14;
  };
  drawAllocHeader();

  const drawAllocRow = (inv: TermSheetInvestor) => {
    if (y < BOTTOM_LIMIT) {
      newPage();
      drawAllocHeader();
    }
    text(truncate(inv.name, COL.name.w - 6, font, 9), COL.name.x, y, { size: 9 });
    textRight(money(inv.allocated), COL.amount.right, y, { size: 9 });
    textRight(`${inv.pctOfRound.toFixed(1)}%`, COL.pctRound.right, y, { size: 9, color: MUTED });
    textRight(intFmt.format(Math.round(inv.shares)), COL.shares.right, y, { size: 9 });
    textRight(pctFmt(inv.pctOfPost), COL.pctPost.right, y, { size: 9, color: MUTED });
    y -= 18;
  };

  if (ts.investors.length === 0) {
    text("No allocation yet.", COL.name.x, y, { size: 9, color: MUTED });
    y -= 18;
  } else {
    ts.investors.forEach(drawAllocRow);
  }

  // Totals row.
  if (y < BOTTOM_LIMIT) newPage();
  y -= 2;
  hairline(y);
  y -= 16;
  text("Total allocated", COL.name.x, y, { font: bold, size: 9, color: INK });
  textRight(money(ts.totalAllocated), COL.amount.right, y, { font: bold, size: 9 });
  if (!ts.fullyAllocated) {
    textRight(
      `of ${money(ts.roundSize)} target`,
      COL.pctPost.right,
      y,
      { size: 8, color: MUTED },
    );
  }
  y -= 24;

  // --- key terms ---
  ensure(40);
  text("Key terms", 0, y, { font: bold, size: 11, color: INK });
  y -= 16;
  for (const term of ts.keyTerms) {
    const lines = wrap(term.value, CONTENT_W - 4, font, 9);
    ensure(14 + lines.length * 12 + 6);
    text(term.label, 0, y, { font: bold, size: 9, color: INK });
    y -= 12;
    for (const ln of lines) {
      text(ln, 0, y, { size: 9, color: MUTED });
      y -= 12;
    }
    y -= 6;
  }

  // --- signature lines ---
  ensure(60);
  y -= 6;
  hairline(y);
  y -= 24;
  const sigW = (CONTENT_W - 40) / 2;
  const sigLine = (label: string, x: number) => {
    page.drawLine({
      start: { x: MARGIN + x, y },
      end: { x: MARGIN + x + sigW, y },
      thickness: 0.75,
      color: INK,
    });
    text(label, x, y - 12, { size: 8, color: MUTED });
  };
  sigLine("For the Company", 0);
  sigLine("For the Investor", sigW + 40);
  y -= 24;

  // --- footer on every page: disclaimer + page numbers ---
  pages.forEach((p, i) => {
    p.drawLine({
      start: { x: MARGIN, y: MARGIN + 30 },
      end: { x: MARGIN + CONTENT_W, y: MARGIN + 30 },
      thickness: 0.5,
      color: HAIRLINE,
    });
    const discLines = wrap(ts.disclaimer, CONTENT_W - 60, font, 7);
    discLines.slice(0, 2).forEach((ln, j) => {
      p.drawText(ln, { x: MARGIN, y: MARGIN + 18 - j * 9, font, size: 7, color: MUTED });
    });
    const pageLabel = `Page ${i + 1} of ${pages.length}`;
    const w = font.widthOfTextAtSize(pageLabel, 7);
    p.drawText(pageLabel, { x: MARGIN + CONTENT_W - w, y: MARGIN + 18, font, size: 7, color: MUTED });
  });

  return pdf.save();
}
