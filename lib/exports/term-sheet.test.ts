import { describe, expect, it, vi } from "vitest";

import type { ActiveCompany } from "@/lib/db/queries";
import type { CountryPack } from "@/lib/packs/_shared/types";
import { type SimHolder } from "@/lib/simulate/engine";
import { modelRound, type RoundInvestor } from "@/lib/simulate/round-model";

// The renderers guard with `import "server-only"`, which throws outside an RSC
// bundle. Stub it so the pure render logic is unit-testable under vitest.
vi.mock("server-only", () => ({}));

import { renderTermSheetDocx } from "./term-sheet-docx";
import { buildTermSheet } from "./term-sheet";

const HOLDERS: SimHolder[] = [
  { id: "f1", name: "Founder A", type: "founder", kind: "equity", shares: 6_000_000 },
  { id: "f2", name: "Founder B", type: "founder", kind: "equity", shares: 3_000_000 },
  { id: "pool", name: "Pool", type: "pool", kind: "pool", shares: 1_000_000 },
];

// Minimal stubs — buildTermSheet only reads a handful of fields off each.
const COMPANY = {
  legalName: "Acme Inc.",
  displayName: "Acme",
  jurisdiction: "us",
  entityType: "us-de-ccorp",
  currency: "USD",
  registryIdentifier: null,
} as unknown as ActiveCompany;

const PACK = {
  registryId: { label: "Reg. no." },
  equityUnitNoun: () => ({ singular: "share", plural: "shares", display: "Shares" }),
} as unknown as CountryPack;

const TERMS = { roundSize: 2_000_000, preMoney: 8_000_000 };

const INVESTORS: RoundInvestor[] = [
  { id: "a", name: "Lead", type: "investor", shape: { kind: "fixed", amount: 1_500_000 } },
  { id: "b", name: "Angel", type: "investor", shape: { kind: "fixed", amount: 500_000 } },
];

describe("buildTermSheet", () => {
  it("carries the round economics from the model", () => {
    const model = modelRound(HOLDERS, [], TERMS, INVESTORS, { a: 1_500_000, b: 500_000 });
    const ts = buildTermSheet(COMPANY, PACK, TERMS, model);
    expect(ts.pricePerShare).toBeCloseTo(0.8, 9);
    expect(ts.postMoney).toBe(10_000_000);
    expect(ts.currency).toBe("USD");
    expect(ts.unitNounPlural).toBe("shares");
    expect(ts.fullyAllocated).toBe(true);
  });

  it("lists only allocated investors, largest first, with their share counts", () => {
    const model = modelRound(HOLDERS, [], TERMS, INVESTORS, { a: 1_500_000, b: 500_000 });
    const ts = buildTermSheet(COMPANY, PACK, TERMS, model);
    expect(ts.investors.map((i) => i.name)).toEqual(["Lead", "Angel"]);
    expect(ts.investors[0]!.shares).toBeCloseTo(1_875_000, 3); // 1.5M / 0.80
  });

  it("drops zero-allocation investors from the table", () => {
    const model = modelRound(HOLDERS, [], TERMS, INVESTORS, { a: 2_000_000, b: 0 });
    const ts = buildTermSheet(COMPANY, PACK, TERMS, model);
    expect(ts.investors.map((i) => i.name)).toEqual(["Lead"]);
  });

  it("uses jurisdiction-aware governing law in key terms", () => {
    const model = modelRound(HOLDERS, [], TERMS, INVESTORS, { a: 1_500_000, b: 500_000 });
    const ts = buildTermSheet(COMPANY, PACK, TERMS, model);
    const law = ts.keyTerms.find((t) => t.label === "Governing law");
    expect(law?.value).toContain("Delaware");
  });

  it("adds a SAFE-conversion key term only when SAFEs convert", () => {
    const withSafe = modelRound(
      HOLDERS,
      [{ id: "s", name: "Angel SAFE", type: "investor", amount: 1_000_000, cap: 5_000_000 }],
      TERMS,
      INVESTORS,
      { a: 1_500_000, b: 500_000 },
    );
    const tsSafe = buildTermSheet(COMPANY, PACK, TERMS, withSafe);
    expect(tsSafe.keyTerms.some((t) => t.label.startsWith("SAFE"))).toBe(true);

    const noSafe = modelRound(HOLDERS, [], TERMS, INVESTORS, { a: 1_500_000, b: 500_000 });
    const tsNoSafe = buildTermSheet(COMPANY, PACK, TERMS, noSafe);
    expect(tsNoSafe.keyTerms.some((t) => t.label.startsWith("SAFE"))).toBe(false);
  });
});

describe("renderTermSheetDocx", () => {
  it("renders a valid .docx (zip) document", async () => {
    const model = modelRound(HOLDERS, [], TERMS, INVESTORS, { a: 1_500_000, b: 500_000 });
    const ts = buildTermSheet(COMPANY, PACK, TERMS, model);
    const bytes = await renderTermSheetDocx(ts);
    expect(bytes.length).toBeGreaterThan(1000);
    // .docx is a ZIP archive — first two bytes are the local-file-header magic "PK".
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });
});
