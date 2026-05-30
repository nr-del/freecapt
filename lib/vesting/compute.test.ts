import { describe, expect, it } from "vitest";

import { computeVesting } from "./compute";

// A canonical 4-year monthly grant with a 1-year cliff.
const STANDARD = {
  quantity: 48_000,
  startDate: "2024-01-01",
  totalMonths: 48,
  cliffMonths: 12,
  frequency: "monthly",
} as const;

const at = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("computeVesting", () => {
  it("treats a grant with no schedule as fully owned immediately", () => {
    const r = computeVesting({
      quantity: 1_000,
      startDate: null,
      totalMonths: null,
      cliffMonths: null,
    });
    expect(r.hasSchedule).toBe(false);
    expect(r.vestedQty).toBe(1_000);
    expect(r.unvestedQty).toBe(0);
    expect(r.vestedPct).toBe(100);
    expect(r.fullyVested).toBe(true);
    expect(r.nextVestQty).toBe(0);
  });

  it("vests nothing before the cliff", () => {
    const r = computeVesting({ ...STANDARD, asOf: at("2024-11-30") });
    expect(r.cliffPassed).toBe(false);
    expect(r.vestedQty).toBe(0);
    expect(r.unvestedQty).toBe(48_000);
    // The next milestone is the cliff itself, worth 12 months at once.
    expect(r.nextVestDate).toEqual(at("2025-01-01"));
    expect(r.nextVestQty).toBe(12_000);
  });

  it("vests the full cliff amount the day the cliff lands", () => {
    const r = computeVesting({ ...STANDARD, asOf: at("2025-01-01") });
    expect(r.cliffPassed).toBe(true);
    expect(r.vestedQty).toBe(12_000); // 12/48
    expect(r.fullyVested).toBe(false);
    expect(r.nextVestQty).toBe(1_000); // 1/48 per month thereafter
  });

  it("accrues one period per month after the cliff", () => {
    // 18 months in: cliff (12) + 6 monthly periods = 18/48.
    const r = computeVesting({ ...STANDARD, asOf: at("2025-07-01") });
    expect(r.vestedQty).toBe(18_000);
    expect(r.vestedPct).toBeCloseTo(37.5, 5);
  });

  it("is fully vested at and after the end date", () => {
    const r = computeVesting({ ...STANDARD, asOf: at("2028-01-01") });
    expect(r.fullyVested).toBe(true);
    expect(r.vestedQty).toBe(48_000);
    expect(r.unvestedQty).toBe(0);
    expect(r.nextVestDate).toBeNull();
    expect(r.nextVestQty).toBe(0);
  });

  it("never loses or invents shares — vested + unvested always equals quantity", () => {
    // Odd quantity that doesn't divide evenly across 48 periods.
    const q = 100_001;
    for (const month of ["2025-01-01", "2025-09-15", "2026-06-01", "2027-03-01"]) {
      const r = computeVesting({ ...STANDARD, quantity: q, asOf: at(month) });
      expect(r.vestedQty + r.unvestedQty).toBe(q);
    }
  });

  it("bundles all pre-cliff periods into the cliff for quarterly grants", () => {
    // 2-year quarterly grant (8 periods) with a 1-year cliff: at the cliff,
    // 4 of 8 periods (half) vest at once.
    const r = computeVesting({
      quantity: 800,
      startDate: "2024-01-01",
      totalMonths: 24,
      cliffMonths: 12,
      frequency: "quarterly",
      asOf: at("2025-01-01"),
    });
    expect(r.vestedQty).toBe(400);
    expect(r.cliffDate).toEqual(at("2025-01-01"));
  });
});
