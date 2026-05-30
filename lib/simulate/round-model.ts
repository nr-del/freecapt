// Round modeling (docs/01_mvp_scope.md §5.25) — extends the basic single-round
// simulator (§5.5) to the real fundraising workflow: a list of *specific*
// investors, each with their own commitment shape, allocated against a target
// round size. Pure + deterministic so it runs identically server/client/tests.
//
// The cap-table math is the simulator's: a modeled round is just a priced round
// whose `roundSize` equals the sum of what's actually allocated to investors.
// We delegate the dilution/SAFE/pool math to `simulateRound`, then split its
// single "new investor" line into one line per investor (each holding
// `allocated / pricePerShare` shares). That keeps the two engines in lockstep —
// a one-investor model with a `fixed` commitment equal to the round size is
// numerically identical to the basic simulator.

import {
  simulateRound,
  type SimHolder,
  type SimResult,
  type SimRow,
  type SimSafe,
} from "./engine";

// How much an investor is willing to put in.
export type CommitmentShape =
  | { kind: "fixed"; amount: number } // exactly this much
  | { kind: "range"; min: number; max: number } // somewhere in [min, max]
  | { kind: "up_to"; max: number }; // 0..max, happy to be scaled to nothing

// Allocation priority hint, used by the suggestion solver. Lower binds first.
export type RoundPriority = "must_include" | "target" | "optional" | "fill_the_gap";

const PRIORITY_RANK: Record<RoundPriority, number> = {
  must_include: 0,
  target: 1,
  optional: 2,
  fill_the_gap: 3,
};

export type RoundInvestor = {
  id: string;
  name: string;
  type: string; // stakeholder type — drives color/rank in the shared UI
  isExisting?: boolean; // already on the cap table (pro-rata eligible)
  shape: CommitmentShape;
  priority?: RoundPriority; // defaults to "target"
  minCheck?: number; // smallest cheque they'll write if they're in at all
  proRataPct?: number; // % of the round they're entitled to (existing holders)
};

export type RoundTerms = {
  roundSize: number;
  preMoney: number;
  poolTopupPct?: number; // target post-round pool %, 0..100
};

export type AllocationStatus =
  | "ok" // within [min, max]
  | "cut" // allocated nothing (wasn't required)
  | "below_min" // 0 < allocated < min  (or < minCheck)
  | "over_max"; // allocated > max

export type AllocationRow = {
  id: string;
  name: string;
  type: string;
  requestedMin: number;
  requestedMax: number;
  proRataAmount: number | null; // entitlement = proRataPct × roundSize
  allocated: number;
  shares: number;
  pctOfRound: number; // allocated / target round size
  pctOfPost: number; // shares / post-round total
  status: AllocationStatus;
};

export type RoundMessage = { level: "ok" | "warn" | "error"; text: string };

export type RoundValidation = {
  roundSize: number;
  totalAllocated: number;
  gap: number; // roundSize − totalAllocated (positive ⇒ undersubscribed)
  status: "exact" | "under" | "over";
  satisfied: boolean; // every investor within range and round filled
  messages: RoundMessage[];
};

export type RoundModelResult = {
  pricePerShare: number;
  postMoney: number;
  allocations: AllocationRow[];
  validation: RoundValidation;
  // The shared cap-table result, reusable by ScenarioView. Its "new" rows are
  // the per-investor lines (not a single blended investor).
  scenario: SimResult;
};

const EPS = 0.5; // money rounding tolerance (sub-currency-unit)

// Lower/upper bound a commitment shape allows.
export function shapeBounds(shape: CommitmentShape): { min: number; max: number } {
  switch (shape.kind) {
    case "fixed":
      return { min: Math.max(0, shape.amount), max: Math.max(0, shape.amount) };
    case "range":
      return { min: Math.max(0, shape.min), max: Math.max(shape.min, shape.max, 0) };
    case "up_to":
      return { min: 0, max: Math.max(0, shape.max) };
  }
}

function classify(
  allocated: number,
  bounds: { min: number; max: number },
  minCheck: number | undefined,
): AllocationStatus {
  if (allocated > bounds.max + EPS) return "over_max";
  if (allocated <= EPS) return "cut";
  const floor = Math.max(bounds.min, minCheck ?? 0);
  if (allocated < floor - EPS) return "below_min";
  return "ok";
}

/**
 * Model a priced round against an explicit per-investor allocation (the manual
 * allocation mode — §5.25 mode 1). `allocations` maps investor id → amount; any
 * omitted investor is treated as 0.
 */
export function modelRound(
  holders: SimHolder[],
  safes: SimSafe[],
  terms: RoundTerms,
  investors: RoundInvestor[],
  allocations: Record<string, number>,
): RoundModelResult {
  const roundSize = Math.max(0, terms.roundSize);

  const allocated = investors.map((inv) => Math.max(0, allocations[inv.id] ?? 0));
  const totalAllocated = allocated.reduce((a, b) => a + b, 0);

  // Delegate the cap-table math: the modeled round IS a priced round of size
  // `totalAllocated`. This reuses SAFE conversion + pool top-up + dilution.
  const base = simulateRound(holders, safes, {
    roundSize: totalAllocated,
    preMoney: terms.preMoney,
    poolTopupPct: terms.poolTopupPct,
  });

  const pps = base.pricePerShare;
  const postTotal = base.postTotal;

  // Split the single blended "new investor" row into one row per investor.
  const investorRows: SimRow[] = investors.map((inv, i) => {
    const amt = allocated[i] ?? 0;
    const shares = pps > 0 ? amt / pps : 0;
    return {
      id: inv.id,
      name: inv.name,
      type: inv.type,
      kind: "new",
      preShares: 0,
      postShares: shares,
      prePct: null,
      postPct: postTotal > 0 ? (shares / postTotal) * 100 : 0,
      dilutionPoints: null,
      dilutionRelative: null,
    };
  });

  const scenarioRows: SimRow[] = [
    ...base.rows.filter((r) => r.kind !== "new"),
    ...investorRows,
  ];

  const scenario: SimResult = {
    ...base,
    rows: scenarioRows,
    // The headline "new investor %" becomes the whole new-money block.
    newInvestorPct: postTotal > 0 ? (base.newShares / postTotal) * 100 : 0,
  };

  const allocationsOut: AllocationRow[] = investors.map((inv, i) => {
    const amt = allocated[i] ?? 0;
    const bounds = shapeBounds(inv.shape);
    const shares = pps > 0 ? amt / pps : 0;
    return {
      id: inv.id,
      name: inv.name,
      type: inv.type,
      requestedMin: bounds.min,
      requestedMax: bounds.max,
      proRataAmount:
        inv.proRataPct != null ? (Math.max(0, inv.proRataPct) / 100) * roundSize : null,
      allocated: amt,
      shares,
      pctOfRound: roundSize > 0 ? (amt / roundSize) * 100 : 0,
      pctOfPost: postTotal > 0 ? (shares / postTotal) * 100 : 0,
      status: classify(amt, bounds, inv.minCheck),
    };
  });

  const validation = validate(roundSize, totalAllocated, investors, allocationsOut);

  return {
    pricePerShare: pps,
    postMoney: base.postMoney,
    allocations: allocationsOut,
    validation,
    scenario,
  };
}

function validate(
  roundSize: number,
  totalAllocated: number,
  investors: RoundInvestor[],
  rows: AllocationRow[],
): RoundValidation {
  const gap = roundSize - totalAllocated;
  const status: RoundValidation["status"] =
    Math.abs(gap) <= EPS ? "exact" : gap > 0 ? "under" : "over";

  const messages: RoundMessage[] = [];

  if (status === "over") {
    messages.push({
      level: "error",
      text: `Oversubscribed by ${fmtGap(-gap)} — allocations exceed the round size.`,
    });
  } else if (status === "under") {
    messages.push({
      level: "warn",
      text: `Undersubscribed by ${fmtGap(gap)} — the round isn't fully allocated yet.`,
    });
  } else {
    messages.push({ level: "ok", text: "Round is fully allocated." });
  }

  for (const row of rows) {
    const inv = investors.find((x) => x.id === row.id);
    if (row.status === "over_max") {
      messages.push({
        level: "error",
        text: `${row.name} is allocated more than their maximum.`,
      });
    } else if (row.status === "below_min") {
      messages.push({
        level: "warn",
        text: `${row.name} is below their minimum cheque.`,
      });
    } else if (row.status === "cut" && inv?.priority === "must_include") {
      messages.push({
        level: "error",
        text: `${row.name} is marked must-include but allocated nothing.`,
      });
    }
  }

  const satisfied =
    status === "exact" && !messages.some((m) => m.level === "error" || m.level === "warn");

  return { roundSize, totalAllocated, gap, status, satisfied, messages };
}

/**
 * Suggest an allocation (§5.25 mode 2 — constraint solver, v1 greedy). Fills the
 * round in priority order: must-include investors get their minimum first, then
 * targets, then optionals are topped toward their maximums, and any
 * `fill_the_gap` investors absorb the remainder. Deterministic; not a true LP,
 * but it satisfies the common "who fits, who gets scaled" workflow.
 */
export function suggestAllocation(
  terms: RoundTerms,
  investors: RoundInvestor[],
): Record<string, number> {
  const roundSize = Math.max(0, terms.roundSize);
  const alloc: Record<string, number> = {};
  for (const inv of investors) alloc[inv.id] = 0;

  const rank = (inv: RoundInvestor) => PRIORITY_RANK[inv.priority ?? "target"];
  const indexed = investors.map((inv, idx) => ({ inv, idx }));
  const ordered = [...indexed].sort((a, b) => rank(a.inv) - rank(b.inv) || a.idx - b.idx);

  const nonGap = ordered.filter(({ inv }) => (inv.priority ?? "target") !== "fill_the_gap");
  const gap = ordered.filter(({ inv }) => inv.priority === "fill_the_gap");

  let remaining = roundSize;

  // Pass 1 — seed each non-gap investor with its effective floor.
  for (const { inv } of nonGap) {
    const b = shapeBounds(inv.shape);
    const baseFloor = (inv.priority ?? "target") === "optional" ? 0 : b.min;
    const floor = Math.min(b.max, Math.max(baseFloor, baseFloor > 0 ? inv.minCheck ?? 0 : 0));
    // must-include is guaranteed its floor even if it pushes the round over.
    const give = inv.priority === "must_include" ? floor : Math.min(floor, Math.max(0, remaining));
    alloc[inv.id] = give;
    remaining -= give;
  }

  // Pass 2 — top up toward maximums in priority order.
  for (const { inv } of nonGap) {
    if (remaining <= EPS) break;
    const b = shapeBounds(inv.shape);
    const room = b.max - (alloc[inv.id] ?? 0);
    if (room <= 0) continue;
    const add = Math.min(room, remaining);
    alloc[inv.id] = (alloc[inv.id] ?? 0) + add;
    remaining -= add;
  }

  // Pass 3 — fill_the_gap investors absorb whatever's left.
  for (const { inv } of gap) {
    if (remaining <= EPS) {
      alloc[inv.id] = 0;
      continue;
    }
    const b = shapeBounds(inv.shape);
    const add = Math.min(b.max, remaining);
    alloc[inv.id] = add;
    remaining -= add;
  }

  return alloc;
}

function fmtGap(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n));
}
