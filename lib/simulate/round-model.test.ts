import { describe, expect, it } from "vitest";

import { type SimHolder } from "./engine";
import {
  modelRound,
  shapeBounds,
  suggestAllocation,
  type RoundInvestor,
  type RoundTerms,
} from "./round-model";

// Same pre-round table as the engine tests: 10,000,000 FD shares.
const HOLDERS: SimHolder[] = [
  { id: "f1", name: "Founder A", type: "founder", kind: "equity", shares: 6_000_000 },
  { id: "f2", name: "Founder B", type: "founder", kind: "equity", shares: 3_000_000 },
  { id: "pool", name: "Pool", type: "pool", kind: "pool", shares: 1_000_000 },
];

// $2M at $8M pre ⇒ $0.80/share, $10M post.
const TERMS: RoundTerms = { roundSize: 2_000_000, preMoney: 8_000_000 };

describe("shapeBounds", () => {
  it("derives bounds for each commitment shape", () => {
    expect(shapeBounds({ kind: "fixed", amount: 500_000 })).toEqual({ min: 500_000, max: 500_000 });
    expect(shapeBounds({ kind: "range", min: 100_000, max: 200_000 })).toEqual({ min: 100_000, max: 200_000 });
    expect(shapeBounds({ kind: "up_to", max: 100_000 })).toEqual({ min: 0, max: 100_000 });
  });
});

describe("modelRound — manual allocation", () => {
  const investors: RoundInvestor[] = [
    { id: "a", name: "Investor A", type: "investor", shape: { kind: "fixed", amount: 1_000_000 } },
    { id: "b", name: "Investor B", type: "investor", shape: { kind: "range", min: 500_000, max: 1_500_000 } },
  ];

  it("matches the basic simulator when one investor takes the whole round", () => {
    const solo: RoundInvestor[] = [
      { id: "a", name: "Investor A", type: "investor", shape: { kind: "fixed", amount: 2_000_000 } },
    ];
    const r = modelRound(HOLDERS, [], TERMS, solo, { a: 2_000_000 });
    // $0.80/share, 2,500,000 new shares, 20% of post.
    expect(r.pricePerShare).toBeCloseTo(0.8, 9);
    const row = r.allocations[0]!;
    expect(row.shares).toBeCloseTo(2_500_000, 3);
    expect(row.pctOfPost).toBeCloseTo(20, 6);
    expect(r.validation.status).toBe("exact");
    expect(r.validation.satisfied).toBe(true);
  });

  it("splits the new money into one cap-table row per investor", () => {
    const r = modelRound(HOLDERS, [], TERMS, investors, { a: 1_000_000, b: 1_000_000 });
    const newRows = r.scenario.rows.filter((row) => row.kind === "new");
    expect(newRows.map((row) => row.id).sort()).toEqual(["a", "b"]);
    // Each put in $1M at $0.80 ⇒ 1,250,000 shares apiece.
    for (const row of newRows) expect(row.postShares).toBeCloseTo(1_250_000, 3);
  });

  it("post-round ownership across all rows sums to ~100%", () => {
    const r = modelRound(HOLDERS, [], TERMS, investors, { a: 1_000_000, b: 1_000_000 });
    const total = r.scenario.rows.reduce((acc, row) => acc + row.postPct, 0);
    expect(total).toBeCloseTo(100, 6);
  });

  it("flags oversubscription as an error", () => {
    const r = modelRound(HOLDERS, [], TERMS, investors, { a: 1_500_000, b: 1_000_000 });
    expect(r.validation.status).toBe("over");
    expect(r.validation.satisfied).toBe(false);
    expect(r.validation.messages.some((m) => m.level === "error")).toBe(true);
  });

  it("flags undersubscription as a warning", () => {
    const r = modelRound(HOLDERS, [], TERMS, investors, { a: 1_000_000, b: 500_000 });
    expect(r.validation.status).toBe("under");
    expect(r.validation.gap).toBeCloseTo(500_000, 3);
    expect(r.validation.messages.some((m) => m.level === "warn")).toBe(true);
  });

  it("marks an investor allocated above their max as over_max", () => {
    const r = modelRound(HOLDERS, [], TERMS, investors, { a: 1_000_000, b: 2_000_000 });
    const b = r.allocations.find((x) => x.id === "b")!;
    expect(b.status).toBe("over_max");
  });

  it("computes pro-rata entitlement as ownership × round size", () => {
    const existing: RoundInvestor[] = [
      {
        id: "ex",
        name: "Existing SAFE",
        type: "investor",
        isExisting: true,
        shape: { kind: "up_to", max: 1_000_000 },
        proRataPct: 10,
      },
    ];
    const r = modelRound(HOLDERS, [], TERMS, existing, { ex: 200_000 });
    // 10% of a $2M round = $200k entitlement.
    expect(r.allocations[0]!.proRataAmount).toBeCloseTo(200_000, 3);
  });
});

describe("suggestAllocation — greedy solver", () => {
  it("fills must-include first, then scales the gap-filler to the remainder", () => {
    const investors: RoundInvestor[] = [
      { id: "a", name: "A", type: "investor", shape: { kind: "fixed", amount: 500_000 }, priority: "must_include" },
      { id: "b", name: "B", type: "investor", shape: { kind: "range", min: 250_000, max: 250_000 }, priority: "target" },
      { id: "gap", name: "Gap", type: "investor", shape: { kind: "up_to", max: 5_000_000 }, priority: "fill_the_gap" },
    ];
    const alloc = suggestAllocation(TERMS, investors);
    expect(alloc.a).toBeCloseTo(500_000, 3);
    expect(alloc.b).toBeCloseTo(250_000, 3);
    // Gap-filler absorbs 2,000,000 − 500k − 250k = 1,250,000.
    expect(alloc.gap).toBeCloseTo(1_250_000, 3);
    const total = Object.values(alloc).reduce((x, y) => x + y, 0);
    expect(total).toBeCloseTo(2_000_000, 3);
  });

  it("scales optionals up toward their max when the round has room", () => {
    const investors: RoundInvestor[] = [
      { id: "a", name: "A", type: "investor", shape: { kind: "range", min: 100_000, max: 200_000 }, priority: "optional" },
      { id: "b", name: "B", type: "investor", shape: { kind: "range", min: 100_000, max: 200_000 }, priority: "optional" },
    ];
    // A small round so both fit at their max with room to spare.
    const alloc = suggestAllocation({ roundSize: 400_000, preMoney: 8_000_000 }, investors);
    expect(alloc.a).toBeCloseTo(200_000, 3);
    expect(alloc.b).toBeCloseTo(200_000, 3);
  });

  it("guarantees a must-include investor even if it oversubscribes the round", () => {
    const investors: RoundInvestor[] = [
      { id: "big", name: "Big", type: "investor", shape: { kind: "fixed", amount: 3_000_000 }, priority: "must_include" },
    ];
    const alloc = suggestAllocation(TERMS, investors);
    expect(alloc.big).toBeCloseTo(3_000_000, 3);
  });

  it("produces an allocation modelRound then validates as fully subscribed", () => {
    const investors: RoundInvestor[] = [
      { id: "a", name: "A", type: "investor", shape: { kind: "fixed", amount: 1_200_000 }, priority: "must_include" },
      { id: "gap", name: "Gap", type: "investor", shape: { kind: "up_to", max: 5_000_000 }, priority: "fill_the_gap" },
    ];
    const alloc = suggestAllocation(TERMS, investors);
    const r = modelRound(HOLDERS, [], TERMS, investors, alloc);
    expect(r.validation.status).toBe("exact");
    expect(r.validation.satisfied).toBe(true);
  });
});
