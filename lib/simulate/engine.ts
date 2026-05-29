// Priced-round simulation engine (the only v1 scenario — docs/01_mvp_scope.md
// §5.5). Pure + deterministic so it runs identically on the server, in the
// client preview, and in tests.
//
// Math (the spec's reference, generalized to a share model that sums to 100%):
//   pps          = pre_money / pre_round_fully_diluted_shares
//   new_shares   = round_size / pps
//   post_money   = pre_money + round_size
//   new_investor% = round_size / post_money         (exact when no SAFE/top-up)
//   existing post% = pre% × pre_money / post_money   (exact when no SAFE/top-up)
// With no SAFEs and no pool top-up this reduces *exactly* to the spec formula:
// every existing holder's relative drop is round_size / post_money.
//
// SAFEs auto-convert at the round (their whole purpose): each converts at the
// better of its valuation-cap price or its discount price, measured against the
// pre-round fully-diluted share count — the standard simplified, non-circular
// conversion. Converted SAFE shares and the new-money shares both enlarge the
// post-round denominator, so adding a SAFE dilutes existing holders a little
// more than the headline round-only figure.

export type SimKind = "equity" | "option" | "pool";

// A pre-round, fully-diluted line: founders/employees (equity), granted options,
// and the unallocated pool.
export type SimHolder = {
  id: string;
  name: string;
  type: string; // stakeholder type — drives color/rank in the UI
  kind: SimKind;
  shares: number;
};

// An outstanding SAFE to convert at the round.
export type SimSafe = {
  id: string;
  name: string;
  type: string;
  amount: number; // money invested
  cap?: number; // valuation cap
  discountPercent?: number; // e.g. 20 for 20%
};

export type SimInputs = {
  roundSize: number;
  preMoney: number;
  poolTopupPct?: number; // target post-round pool %, 0–100 (optional)
  newInvestorName?: string;
};

export type SimRowKind = SimKind | "new" | "safe";

export type SimRow = {
  id: string;
  name: string;
  type: string;
  kind: SimRowKind;
  preShares: number;
  postShares: number;
  prePct: number | null; // null for lines that didn't exist pre-round
  postPct: number;
  // Absolute ownership change in percentage points (postPct − prePct). Null for
  // brand-new lines (new investor, converted SAFE).
  dilutionPoints: number | null;
  // Relative change (postPct / prePct − 1), e.g. −0.1667. Null for new lines.
  dilutionRelative: number | null;
};

export type SimResult = {
  preTotal: number;
  postTotal: number;
  pricePerShare: number;
  postMoney: number;
  newShares: number;
  newInvestorPct: number;
  safeShares: number;
  poolTopupShares: number;
  rows: SimRow[];
};

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function simulateRound(
  holders: SimHolder[],
  safes: SimSafe[],
  inputs: SimInputs,
): SimResult {
  const preTotal = sum(holders.map((h) => h.shares));
  const roundSize = Math.max(0, inputs.roundSize);
  const preMoney = Math.max(0, inputs.preMoney);
  const postMoney = preMoney + roundSize;

  // Degenerate input (no existing shares or no pre-money) → return the pre-round
  // table unchanged so the UI still renders something sensible.
  if (preTotal <= 0 || preMoney <= 0) {
    const rows: SimRow[] = holders.map((h) => ({
      id: h.id,
      name: h.name,
      type: h.type,
      kind: h.kind,
      preShares: h.shares,
      postShares: h.shares,
      prePct: preTotal > 0 ? (h.shares / preTotal) * 100 : 0,
      postPct: preTotal > 0 ? (h.shares / preTotal) * 100 : 0,
      dilutionPoints: 0,
      dilutionRelative: 0,
    }));
    return {
      preTotal,
      postTotal: preTotal,
      pricePerShare: 0,
      postMoney,
      newShares: 0,
      newInvestorPct: 0,
      safeShares: 0,
      poolTopupShares: 0,
      rows,
    };
  }

  const pricePerShare = preMoney / preTotal;

  // SAFE conversions: better of cap price vs discount price, on pre-round FD shares.
  const safeConversions = safes.map((s) => {
    const capPrice = s.cap && s.cap > 0 ? s.cap / preTotal : Infinity;
    const discPrice = s.discountPercent ? pricePerShare * (1 - s.discountPercent / 100) : pricePerShare;
    const convPrice = Math.min(capPrice, discPrice);
    const shares = convPrice > 0 && Number.isFinite(convPrice) ? s.amount / convPrice : 0;
    return { safe: s, shares };
  });
  const safeShares = sum(safeConversions.map((c) => c.shares));

  const newShares = pricePerShare > 0 ? roundSize / pricePerShare : 0;

  // Optional pool top-up: grow the pool so it reaches the target % of the
  // post-round total. Closed-form (proportional) so it stays simple for v1.
  const existingPool = sum(holders.filter((h) => h.kind === "pool").map((h) => h.shares));
  const p = Math.min(0.99, Math.max(0, (inputs.poolTopupPct ?? 0) / 100));
  let poolTopupShares = 0;
  if (p > 0) {
    const base = preTotal + safeShares + newShares;
    poolTopupShares = Math.max(0, (p * base - existingPool) / (1 - p));
  }

  const postTotal = preTotal + safeShares + newShares + poolTopupShares;

  const pct = (shares: number, total: number) => (total > 0 ? (shares / total) * 100 : 0);

  const rows: SimRow[] = holders.map((h) => {
    const postShares = h.kind === "pool" ? h.shares + poolTopupShares : h.shares;
    const prePct = pct(h.shares, preTotal);
    const postPct = pct(postShares, postTotal);
    return {
      id: h.id,
      name: h.name,
      type: h.type,
      kind: h.kind,
      preShares: h.shares,
      postShares,
      prePct,
      postPct,
      dilutionPoints: postPct - prePct,
      dilutionRelative: prePct > 0 ? postPct / prePct - 1 : null,
    };
  });

  // Converted SAFE lines.
  for (const { safe, shares } of safeConversions) {
    rows.push({
      id: safe.id,
      name: safe.name,
      type: safe.type,
      kind: "safe",
      preShares: 0,
      postShares: shares,
      prePct: null,
      postPct: pct(shares, postTotal),
      dilutionPoints: null,
      dilutionRelative: null,
    });
  }

  // New-money investor line.
  rows.push({
    id: "new-investor",
    name: inputs.newInvestorName?.trim() || "New investor",
    type: "investor",
    kind: "new",
    preShares: 0,
    postShares: newShares,
    prePct: null,
    postPct: pct(newShares, postTotal),
    dilutionPoints: null,
    dilutionRelative: null,
  });

  return {
    preTotal,
    postTotal,
    pricePerShare,
    postMoney,
    newShares,
    newInvestorPct: pct(newShares, postTotal),
    safeShares,
    poolTopupShares,
    rows,
  };
}
