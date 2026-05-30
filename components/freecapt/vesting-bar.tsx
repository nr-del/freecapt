// Pure-CSS vesting progress bar for the stakeholder portal (§5.7). Emerald
// fill for vested, neutral track for unvested, a thin marker for the cliff.
// No client JS — the width is a server-computed inline CSS variable.
import { cn } from "@/lib/utils";

export function VestingBar({
  vestedPct,
  cliffPct,
  className,
}: {
  vestedPct: number; // 0..100
  cliffPct?: number | null; // 0..100, optional cliff marker
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, vestedPct));
  const cliff = cliffPct == null ? null : Math.max(0, Math.min(100, cliffPct));

  return (
    <div
      className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-brand-500 transition-[width]"
        style={{ width: `${pct}%` }}
      />
      {cliff != null && cliff > 0 && cliff < 100 ? (
        <div
          className="absolute top-0 h-full w-px bg-slate-400/70"
          style={{ left: `${cliff}%` }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
