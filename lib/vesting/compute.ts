// Pure, deterministic vesting math (docs/01_mvp_scope.md §5.7 portal, §5.5
// vesting tracker). No DB, no I/O — takes a grant's vesting parameters and an
// as-of date and returns vested/unvested amounts plus the next milestone. Used
// by the stakeholder portal today and the founder-side vesting tracker later.
//
// Convention: a grant with no schedule (no start date or no total months) is
// treated as fully owned immediately — founder common stock, investor shares,
// and SAFEs have no vesting. A standard 4y/1y grant vests nothing until the
// 12-month cliff, when 12/48 vests at once, then 1/48 per month thereafter.

export type VestingFrequency = "monthly" | "quarterly" | "annual";

export interface VestingInput {
  quantity: number;
  startDate: Date | string | null;
  totalMonths: number | null;
  cliffMonths: number | null;
  frequency?: string | null;
  asOf?: Date;
}

export interface VestingResult {
  hasSchedule: boolean;
  quantity: number;
  vestedQty: number;
  unvestedQty: number;
  vestedPct: number; // 0..100
  cliffDate: Date | null;
  cliffPassed: boolean;
  fullyVested: boolean;
  fullyVestedDate: Date | null;
  nextVestDate: Date | null;
  nextVestQty: number; // 0 when fully vested or no schedule
}

const PERIOD_MONTHS: Record<VestingFrequency, number> = {
  monthly: 1,
  quarterly: 3,
  annual: 12,
};

function normalizeFrequency(freq: string | null | undefined): VestingFrequency {
  switch ((freq ?? "").toLowerCase()) {
    case "quarterly":
      return "quarterly";
    case "annual":
    case "annually":
    case "yearly":
      return "annual";
    default:
      return "monthly";
  }
}

function toDate(d: Date | string | null): Date | null {
  if (d == null) return null;
  if (d instanceof Date) return Number.isNaN(d.getTime()) ? null : d;
  // Accept "YYYY-MM-DD" (the Drizzle `date` column type) as a UTC midnight.
  const parsed = new Date(`${d}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addMonths(base: Date, months: number): Date {
  const r = new Date(base);
  r.setUTCMonth(r.getUTCMonth() + months);
  return r;
}

// Cumulative vested quantity after `k` of `n` periods, rounded so the parts
// always sum back to exactly `quantity` (no lost or phantom shares).
function cumulative(quantity: number, k: number, n: number): number {
  if (k <= 0) return 0;
  if (k >= n) return quantity;
  return Math.round((quantity * k) / n);
}

export function computeVesting(input: VestingInput): VestingResult {
  const quantity = Number.isFinite(input.quantity) ? input.quantity : 0;
  const asOf = input.asOf ?? new Date();
  const start = toDate(input.startDate);
  const totalMonths = input.totalMonths ?? 0;

  // No schedule ⇒ fully owned on day one.
  if (!start || totalMonths <= 0) {
    return {
      hasSchedule: false,
      quantity,
      vestedQty: quantity,
      unvestedQty: 0,
      vestedPct: 100,
      cliffDate: null,
      cliffPassed: true,
      fullyVested: true,
      fullyVestedDate: start,
      nextVestDate: null,
      nextVestQty: 0,
    };
  }

  const cliffMonths = Math.max(0, input.cliffMonths ?? 0);
  const cliffDate = cliffMonths > 0 ? addMonths(start, cliffMonths) : start;
  const periodMonths = PERIOD_MONTHS[normalizeFrequency(input.frequency)];
  const n = Math.max(1, Math.round(totalMonths / periodMonths));
  const fullyVestedDate = addMonths(start, totalMonths);

  // Per-period vesting dates, with anything before the cliff bundled to vest
  // at the cliff date.
  const vestDate = (i: number) => {
    const raw = addMonths(start, Math.min(i * periodMonths, totalMonths));
    return raw < cliffDate ? cliffDate : raw;
  };

  const cliffPassed = asOf >= cliffDate;

  // Count periods that have vested by `asOf` (zero until the cliff passes).
  let k = 0;
  if (cliffPassed) {
    for (let i = 1; i <= n; i++) {
      if (vestDate(i) <= asOf) k++;
      else break;
    }
  }

  const vestedQty = cumulative(quantity, k, n);
  const unvestedQty = Math.max(0, quantity - vestedQty);
  const fullyVested = k >= n;

  let nextVestDate: Date | null = null;
  let nextVestQty = 0;
  if (!fullyVested) {
    nextVestDate = vestDate(k + 1);
    nextVestQty = cumulative(quantity, k + 1, n) - vestedQty;
  }

  return {
    hasSchedule: true,
    quantity,
    vestedQty,
    unvestedQty,
    vestedPct: quantity > 0 ? (vestedQty / quantity) * 100 : 0,
    cliffDate,
    cliffPassed,
    fullyVested,
    fullyVestedDate,
    nextVestDate,
    nextVestQty,
  };
}
