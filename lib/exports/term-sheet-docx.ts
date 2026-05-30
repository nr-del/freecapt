// Renders a TermSheet to a .docx (Word) document using the `docx` package
// (pure TS, no native binaries — safe in a serverless route). Mirrors the
// term-sheet PDF's content and house style (FreeCapT wordmark, emerald accents,
// slate ink): identity header → round-terms grid → allocation table → key terms
// → signature lines → non-binding disclaimer. The PDF and Word exports are built
// from the same `TermSheet` shape, so they always agree.
import "server-only";

import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import type { TermSheet, TermSheetInvestor } from "./term-sheet";

// House palette (hex, no leading #), matching the PDF renderer.
const BRAND = "059669"; // emerald-600
const INK = "1E293B"; // slate-800
const MUTED = "64748B"; // slate-500
const HAIRLINE = "E2E8F0"; // slate-200

const intFmt = new Intl.NumberFormat("en-US");
const pctFmt = (n: number) => `${n.toFixed(2)}%`;

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "auto" } as const;
const HAIRLINE_BORDER = { style: BorderStyle.SINGLE, size: 4, color: HAIRLINE } as const;

export async function renderTermSheetDocx(ts: TermSheet): Promise<Uint8Array> {
  const money = (n: number): string =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: ts.currency, maximumFractionDigits: 0 }).format(n);
  const moneyPrecise = (n: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: ts.currency,
      maximumFractionDigits: n < 1 ? 4 : 2,
    }).format(n);

  // --- header: wordmark + jurisdiction ---
  const wordmark = new Paragraph({
    children: [
      new TextRun({ text: "FreeC", bold: true, size: 22, color: INK }),
      new TextRun({ text: "apT", bold: true, size: 22, color: BRAND }),
      new TextRun({ text: `\t${ts.jurisdictionLabel}`, size: 18, color: MUTED }),
    ],
    tabStops: [{ type: "right", position: 9000 }],
    spacing: { after: 240 },
  });

  const title = new Paragraph({
    children: [new TextRun({ text: ts.title, bold: true, size: 36, color: INK })],
    spacing: { after: 120 },
  });

  // --- identity block ---
  const legalName = new Paragraph({
    children: [new TextRun({ text: ts.legalName, bold: true, size: 24, color: INK })],
    spacing: { after: 40 },
  });
  const idParts = [
    ts.entityTypeLabel,
    ts.registryIdentifier ? `${ts.registryLabel ?? "Reg. no."} ${ts.registryIdentifier}` : null,
  ].filter(Boolean) as string[];
  const identityMeta = new Paragraph({
    children: [new TextRun({ text: idParts.join("  ·  "), size: 18, color: MUTED })],
    spacing: { after: 40 },
  });
  const prepared = new Paragraph({
    children: [
      new TextRun({
        text: `Proposed priced round — prepared ${ts.generatedAt.toISOString().slice(0, 10)} (UTC)`,
        size: 18,
        color: MUTED,
      }),
    ],
    border: { bottom: { ...HAIRLINE_BORDER, space: 8 } },
    spacing: { after: 240 },
  });

  // --- round terms (label / value table) ---
  const termRows: Array<[string, string]> = [
    ["Round size", money(ts.roundSize)],
    ["Pre-money valuation", money(ts.preMoney)],
    ["Post-money valuation", money(ts.postMoney)],
    [`Price per ${ts.unitNounSingular}`, moneyPrecise(ts.pricePerShare)],
    [`New ${ts.unitNounPlural} issued`, intFmt.format(Math.round(ts.newMoneyShares))],
    ["New money ownership", pctFmt(ts.newMoneyPct)],
  ];
  if (ts.poolTopupPct != null && ts.poolTopupPct > 0) {
    termRows.push(["Option pool (post)", `${ts.poolTopupPct.toFixed(1)}%`]);
  }
  if (ts.safeShares > 0) {
    termRows.push([`Converted SAFE ${ts.unitNounPlural}`, intFmt.format(Math.round(ts.safeShares))]);
  }

  const sectionHeading = (label: string): Paragraph =>
    new Paragraph({
      children: [new TextRun({ text: label, bold: true, size: 22, color: INK })],
      spacing: { before: 200, after: 120 },
    });

  const labelValueTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: NO_BORDER,
      bottom: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
      insideHorizontal: NO_BORDER,
      insideVertical: NO_BORDER,
    },
    rows: termRows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: cellNoBorders(),
              children: [
                new Paragraph({ children: [new TextRun({ text: label, size: 18, color: MUTED })] }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: cellNoBorders(),
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun({ text: value, bold: true, size: 20, color: INK })],
                }),
              ],
            }),
          ],
        }),
    ),
  });

  // --- allocation table ---
  const allocHeader = new TableRow({
    tableHeader: true,
    children: [
      allocHeaderCell("INVESTOR", AlignmentType.LEFT),
      allocHeaderCell("AMOUNT", AlignmentType.RIGHT),
      allocHeaderCell("% ROUND", AlignmentType.RIGHT),
      allocHeaderCell(ts.unitNounPlural.toUpperCase(), AlignmentType.RIGHT),
      allocHeaderCell("% POST", AlignmentType.RIGHT),
    ],
  });

  const allocRow = (inv: TermSheetInvestor): TableRow =>
    new TableRow({
      children: [
        allocCell(inv.name, AlignmentType.LEFT, INK),
        allocCell(money(inv.allocated), AlignmentType.RIGHT, INK),
        allocCell(`${inv.pctOfRound.toFixed(1)}%`, AlignmentType.RIGHT, MUTED),
        allocCell(intFmt.format(Math.round(inv.shares)), AlignmentType.RIGHT, INK),
        allocCell(pctFmt(inv.pctOfPost), AlignmentType.RIGHT, MUTED),
      ],
    });

  const totalsRow = new TableRow({
    children: [
      allocCell("Total allocated", AlignmentType.LEFT, INK, true),
      allocCell(money(ts.totalAllocated), AlignmentType.RIGHT, INK, true),
      allocCell("", AlignmentType.RIGHT, MUTED),
      allocCell("", AlignmentType.RIGHT, INK),
      allocCell(
        ts.fullyAllocated ? "" : `of ${money(ts.roundSize)} target`,
        AlignmentType.RIGHT,
        MUTED,
      ),
    ],
  });

  const allocBodyRows =
    ts.investors.length === 0
      ? [
          new TableRow({
            children: [
              allocCell("No allocation yet.", AlignmentType.LEFT, MUTED),
              allocCell("", AlignmentType.RIGHT, MUTED),
              allocCell("", AlignmentType.RIGHT, MUTED),
              allocCell("", AlignmentType.RIGHT, MUTED),
              allocCell("", AlignmentType.RIGHT, MUTED),
            ],
          }),
        ]
      : ts.investors.map(allocRow);

  const allocTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [3400, 1900, 1300, 1700, 1300],
    borders: {
      top: NO_BORDER,
      bottom: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
      insideHorizontal: HAIRLINE_BORDER,
      insideVertical: NO_BORDER,
    },
    rows: [allocHeader, ...allocBodyRows, totalsRow],
  });

  // --- key terms ---
  const keyTermBlocks: Paragraph[] = [];
  for (const term of ts.keyTerms) {
    keyTermBlocks.push(
      new Paragraph({
        children: [new TextRun({ text: term.label, bold: true, size: 18, color: INK })],
        spacing: { before: 120, after: 20 },
      }),
    );
    keyTermBlocks.push(
      new Paragraph({
        children: [new TextRun({ text: term.value, size: 18, color: MUTED })],
        spacing: { after: 40 },
      }),
    );
  }

  // --- signature lines ---
  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: NO_BORDER,
      bottom: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
      insideHorizontal: NO_BORDER,
      insideVertical: NO_BORDER,
    },
    rows: [
      new TableRow({
        children: [signatureCell("For the Company"), signatureCell("For the Investor")],
      }),
    ],
  });

  const doc = new Document({
    creator: "FreeCapT (freecapt.com)",
    title: `${ts.title} — ${ts.legalName}`,
    subject: "Non-binding term sheet draft",
    description: "Non-binding term sheet draft",
    sections: [
      {
        properties: {},
        children: [
          wordmark,
          title,
          legalName,
          ...(idParts.length ? [identityMeta] : []),
          prepared,
          sectionHeading("Round terms"),
          labelValueTable,
          sectionHeading("Investor allocation"),
          allocTable,
          sectionHeading("Key terms"),
          ...keyTermBlocks,
          new Paragraph({ text: "", border: { top: { ...HAIRLINE_BORDER, space: 8 } }, spacing: { before: 240 } }),
          sigTable,
        ],
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: { top: { ...HAIRLINE_BORDER, space: 6 } },
                children: [new TextRun({ text: ts.disclaimer, size: 14, color: MUTED })],
              }),
            ],
          }),
        },
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  return new Uint8Array(buf);
}

function cellNoBorders() {
  return { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };
}

function allocHeaderCell(label: string, alignment: (typeof AlignmentType)[keyof typeof AlignmentType]): TableCell {
  return new TableCell({
    borders: { ...cellNoBorders(), bottom: HAIRLINE_BORDER },
    children: [
      new Paragraph({
        alignment,
        children: [new TextRun({ text: label, bold: true, size: 14, color: MUTED })],
      }),
    ],
  });
}

function allocCell(
  text: string,
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType],
  color: string,
  bold = false,
): TableCell {
  return new TableCell({
    borders: cellNoBorders(),
    children: [new Paragraph({ alignment, children: [new TextRun({ text, size: 18, color, bold })] })],
  });
}

function signatureCell(label: string): TableCell {
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    margins: { right: 240 },
    borders: cellNoBorders(),
    children: [
      // The signature rule, then the caption beneath it.
      new Paragraph({ text: "", border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: INK } }, spacing: { before: 360 } }),
      new Paragraph({ children: [new TextRun({ text: label, size: 16, color: MUTED })], spacing: { before: 40 } }),
    ],
  });
}
