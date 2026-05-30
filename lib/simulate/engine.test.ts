import { describe, expect, it } from "vitest";

import { simulateRound, type SimHolder } from "./engine";

// A simple two-founder + pool pre-round table totalling 10,000,000 FD shares.
const HOLDERS: SimHolder[] = [
  { id: "f1", name: "Founder A", type: "founder", kind: "equity", shares: 6_000_000 },
  { id: "f2", name: "Founder B", type: "founder", kind: "equity", shares: 3_000_000 },
  { id: "pool", name: "Pool", type: "pool", kind: "pool", shares: 1_000_000 },
];

describe("simulateRound", () => {
  it("prices the round off pre-money / pre-round shares", () => {
    const r = simulateRound(HOLDERS, [], { roundSize: 2_000_000, preMoney: 8_000_000 });
    // 8,000,000 / 10,000,000 = $0.80 per share.
    expect(r.pricePerShare).toBeCloseTo(0.8, 9);
    // 2,000,000 / 0.80 = 2,500,000 new shares.
    expect(r.newShares).toBeCloseTo(2_500_000, 3);
    expect(r.postMoney).toBe(10_000_000);
  });

  it("gives the new investor roundSize / postMoney of the company", () => {
    const r = simulateRound(HOLDERS, [], { roundSize: 2_000_000, preMoney: 8_000_000 });
    // $2M into a $10M post ⇒ 20%.
    expect(r.newInvestorPct).toBeCloseTo(20, 6);
  });

  it("dilutes existing holders proportionally and reports the dilution", () => {
    const r = simulateRound(HOLDERS, [], { roundSize: 2_000_000, preMoney: 8_000_000 });
    const founderA = r.rows.find((row) => row.id === "f1");
    expect(founderA).toBeDefined();
    expect(founderA!.prePct).toBeCloseTo(60, 6); // 6M / 10M
    expect(founderA!.postPct).toBeCloseTo(48, 6); // 6M / 12.5M
    expect(founderA!.dilutionPoints).toBeCloseTo(-12, 6);
    expect(founderA!.dilutionRelative).toBeCloseTo(-0.2, 6); // 48/60 − 1
  });

  it("post-round ownership across all rows sums to ~100%", () => {
    const r = simulateRound(HOLDERS, [], { roundSize: 2_000_000, preMoney: 8_000_000 });
    const totalPct = r.rows.reduce((acc, row) => acc + row.postPct, 0);
    expect(totalPct).toBeCloseTo(100, 6);
  });

  it("converts a capped SAFE at the better of cap vs round price", () => {
    // $1M SAFE with a $5M cap converts on the 10M pre-round shares at
    // $5M/10M = $0.50, cheaper than the $0.80 round price ⇒ 2,000,000 shares.
    const r = simulateRound(
      HOLDERS,
      [{ id: "safe1", name: "Angel", type: "investor", amount: 1_000_000, cap: 5_000_000 }],
      { roundSize: 2_000_000, preMoney: 8_000_000 },
    );
    expect(r.safeShares).toBeCloseTo(2_000_000, 3);
    const safeRow = r.rows.find((row) => row.id === "safe1");
    expect(safeRow?.kind).toBe("safe");
    expect(safeRow?.prePct).toBeNull(); // brand-new line
  });

  it("applies a discount when there is no cap", () => {
    // 20% discount on $0.80 = $0.64; $640k / 0.64 = 1,000,000 shares.
    const r = simulateRound(
      HOLDERS,
      [{ id: "safe1", name: "Angel", type: "investor", amount: 640_000, discountPercent: 20 }],
      { roundSize: 2_000_000, preMoney: 8_000_000 },
    );
    expect(r.safeShares).toBeCloseTo(1_000_000, 3);
  });

  it("tops up the pool to the target post-round percentage", () => {
    const r = simulateRound(HOLDERS, [], {
      roundSize: 2_000_000,
      preMoney: 8_000_000,
      poolTopupPct: 15,
    });
    const poolRow = r.rows.find((row) => row.id === "pool");
    expect(poolRow).toBeDefined();
    // Post-round pool (existing 1M + top-up) should be ~15% of the post total.
    expect(poolRow!.postPct).toBeCloseTo(15, 4);
  });

  it("returns the pre-round table unchanged for degenerate input", () => {
    const r = simulateRound(HOLDERS, [], { roundSize: 1_000_000, preMoney: 0 });
    expect(r.postTotal).toBe(r.preTotal);
    expect(r.newShares).toBe(0);
    expect(r.pricePerShare).toBe(0);
  });
});
