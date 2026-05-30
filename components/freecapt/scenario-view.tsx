// Read-only presentation of a priced-round simulation: side-by-side current vs.
// post-round cap tables + donuts, with a per-stakeholder dilution column.
// Pure (no hooks) so it renders both inside the client simulator and on the
// public server-rendered share page.
import { CapTableDonut, Swatch, type Slice } from "@/components/freecapt/cap-table-donut";
import { POOL_COLOR, TYPE_LABEL, TYPE_RANK, colorForType, intFmt, moneyFmt } from "@/lib/cap-table/display";
import type { SimResult, SimRow } from "@/lib/simulate/engine";

const fmtPct = (n: number | null) => (n == null ? "-" : `${n.toFixed(2)}%`);

function groupLabel(r: SimRow): string {
  if (r.kind === "pool") return "Unallocated pool";
  return `${TYPE_LABEL[r.type] ?? "Other"}s`;
}
function rowColor(r: SimRow): string {
  return r.kind === "pool" ? POOL_COLOR : colorForType(r.type);
}

function slices(rows: SimRow[], basis: "pre" | "post", total: number): Slice[] {
  const acc = new Map<string, { pct: number; color: string; rank: number }>();
  for (const r of rows) {
    const shares = basis === "pre" ? r.preShares : r.postShares;
    if (shares <= 0 || total <= 0) continue;
    const label = groupLabel(r);
    const pct = (shares / total) * 100;
    const existing = acc.get(label);
    if (existing) existing.pct += pct;
    else acc.set(label, { pct, color: rowColor(r), rank: TYPE_RANK[r.type] ?? 9 });
  }
  return [...acc.entries()]
    .sort((a, b) => a[1].rank - b[1].rank)
    .map(([label, v]) => ({ label, pct: v.pct, color: v.color }));
}

function DilutionCell({ row }: { row: SimRow }) {
  if (row.dilutionPoints == null) {
    return <span className="text-xs text-slate-400">new</span>;
  }
  const pts = row.dilutionPoints;
  const negative = pts < -0.001;
  const positive = pts > 0.001;
  const cls = negative ? "text-red-600" : positive ? "text-brand-700" : "text-slate-400";
  const rel =
    row.dilutionRelative != null && Math.abs(row.dilutionRelative) > 0.0001
      ? ` (${(row.dilutionRelative * 100).toFixed(1)}%)`
      : "";
  return (
    <span className={`tabular-nums ${cls}`}>
      {pts >= 0 ? "+" : "−"}
      {Math.abs(pts).toFixed(2)} pp{rel}
    </span>
  );
}

export function ScenarioView({ result, currency }: { result: SimResult; currency: string }) {
  const preRows = result.rows.filter((r) => r.prePct != null);
  const preSlices = slices(result.rows, "pre", result.preTotal);
  const postSlices = slices(result.rows, "post", result.postTotal);

  return (
    <div className="space-y-6">
      {/* Round summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Price / share" value={moneyFmtPrecise(result.pricePerShare, currency)} />
        <Stat label="Post-money" value={moneyFmt(result.postMoney, currency)} />
        <Stat label="New investor" value={`${result.newInvestorPct.toFixed(2)}%`} accent />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Current cap table</h3>
          <div className="mt-4 flex justify-center">
            <CapTableDonut slices={preSlices} size={170} />
          </div>
          <CapTable
            rows={preRows}
            basis="pre"
            totalShares={result.preTotal}
            showDilution={false}
          />
        </section>

        {/* Post-round */}
        <section className="rounded-lg border border-brand-200 bg-white p-5 ring-1 ring-brand-100">
          <h3 className="text-sm font-semibold text-slate-900">After the round</h3>
          <div className="mt-4 flex justify-center">
            <CapTableDonut slices={postSlices} size={170} />
          </div>
          <CapTable
            rows={result.rows}
            basis="post"
            totalShares={result.postTotal}
            showDilution
          />
        </section>
      </div>
    </div>
  );
}

function CapTable({
  rows,
  basis,
  totalShares,
  showDilution,
}: {
  rows: SimRow[];
  basis: "pre" | "post";
  totalShares: number;
  showDilution: boolean;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Stakeholder</th>
            <th className="px-3 py-2 text-right font-semibold">Shares</th>
            <th className="px-3 py-2 text-right font-semibold">%</th>
            {showDilution && <th className="px-3 py-2 text-right font-semibold">Δ</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => {
            const shares = basis === "pre" ? r.preShares : r.postShares;
            const pct = basis === "pre" ? r.prePct : r.postPct;
            return (
              <tr key={`${basis}-${r.id}`} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <span className="flex items-center">
                    <Swatch color={rowColor(r)} />
                    <span className="font-medium text-slate-900">{r.name}</span>
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                  {intFmt.format(Math.round(shares))}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-900">{fmtPct(pct)}</td>
                {showDilution && (
                  <td className="px-3 py-2 text-right">
                    <DilutionCell row={r} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t border-slate-200 bg-slate-50 text-xs">
          <tr>
            <td className="px-3 py-2 font-semibold text-slate-600">Total</td>
            <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
              {intFmt.format(Math.round(totalShares))}
            </td>
            <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">100.00%</td>
            {showDilution && <td className="px-3 py-2" />}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  hide,
}: {
  label: string;
  value: string;
  accent?: boolean;
  hide?: boolean;
}) {
  if (hide) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <dt className="text-xs uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className={`mt-0.5 text-lg font-semibold tabular-nums ${accent ? "text-brand-700" : "text-slate-900"}`}>
        {value}
      </dd>
    </div>
  );
}

function moneyFmtPrecise(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: n < 1 ? 4 : 2,
  }).format(n);
}
