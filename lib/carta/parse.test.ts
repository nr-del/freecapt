import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

// parse.ts is `server-only`; neutralize that so the pure parser runs under node.
vi.mock("server-only", () => ({}));

import { parseCartaWorkbook } from "./parse";

// A real Carta "Equity Plan" export the founder attached. Optional: the test
// only asserts against it when present (so CI without the fixture still passes).
const FIXTURE = "/Users/nicolairasmussen/Downloads/scaleup-finance-group-aps_2026-05-16_equity-plan.xlsx";

describe("parseCartaWorkbook", () => {
  it("rejects a non-xlsx buffer", async () => {
    const res = await parseCartaWorkbook(Buffer.from("not a spreadsheet"));
    expect(res.ok).toBe(false);
  });

  (existsSync(FIXTURE) ? it : it.skip)("parses the sample Carta export", async () => {
    const buf = readFileSync(FIXTURE);
    const res = await parseCartaWorkbook(buf);
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.grants.length).toBeGreaterThan(0);
    // Every grant has a name and a recognized category.
    for (const g of res.grants) {
      expect(g.stakeholderName).not.toBe("");
      expect(["equity_unit", "option_like", "convertible"]).toContain(g.category);
    }
    // The known first stakeholder appears with an option-like EMI award.
    const andrew = res.grants.find((g) => g.stakeholderName.includes("Andrew"));
    expect(andrew?.category).toBe("option_like");

    // Share classes were collected for the catalog.
    expect(res.shareClasses.length).toBeGreaterThan(0);
  });
});
