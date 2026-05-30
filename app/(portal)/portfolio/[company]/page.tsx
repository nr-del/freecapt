import { notFound } from "next/navigation";

import { ExplainGrantButton } from "@/components/freecapt/explain-grant-button";
import { VestingBar } from "@/components/freecapt/vesting-bar";
import { intFmt, moneyFmt } from "@/lib/cap-table/display";
import { getPackByEntityType, securityLabel } from "@/lib/packs/_shared/loader";
import { getMyCompanyDetail } from "@/lib/portal/queries";
import { computeVesting } from "@/lib/vesting/compute";

const fmtDate = (d: Date | null) =>
  d
    ? new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(d)
    : "—";

// FAQ shown to every stakeholder — plain English, no jargon (§5.7).
const FAQ: { q: string; a: string }[] = [
  {
    q: "What are stock options?",
    a: "Options give you the right to buy shares later at a fixed price (the strike price). If the company grows in value, you can buy at the old, lower price. You don't own the shares until you exercise the options.",
  },
  {
    q: "What does vesting mean?",
    a: "Vesting is how you earn your equity over time, usually monthly over four years. A one-year cliff means nothing vests until your first anniversary, when a chunk vests at once; after that it vests gradually.",
  },
  {
    q: "What happens if I leave?",
    a: "You usually keep what has vested and lose what hasn't. Options typically have a window after you leave in which to exercise. The exact rules are in your grant agreement — ask the company if you're unsure.",
  },
  {
    q: "Do I owe tax on this?",
    a: "Sometimes — it depends on the instrument and your country. Equity can be taxed when it's granted, when it vests, when you exercise, or when you sell. This isn't tax advice; check with a professional for anything binding.",
  },
];

export default async function CompanyPortalPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company: companyId } = await params;
  const detail = await getMyCompanyDetail(companyId);
  if (!detail) notFound();

  const { company, stakeholderName, grants } = detail;
  const pack = getPackByEntityType(company.entityType);
  const authorized = Number(company.authorizedUnits ?? 0);
  const firstName = stakeholderName.split(" ")[0] || stakeholderName;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Welcome, {firstName}.
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Here&apos;s what you own at {company.displayName}.
      </p>

      {grants.length === 0 ? (
        <p className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Your record is set up, but no active grants are recorded yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {grants.map((g) => {
            const label = securityLabel(pack, g.category, g.subtype, company.entityType);
            const qty = Number(g.quantity ?? 0);
            const isConvertible = g.category === "convertible";
            const fdPct = authorized > 0 && qty > 0 ? (qty / authorized) * 100 : null;

            const v = computeVesting({
              quantity: qty,
              startDate: g.vestingStartDate,
              totalMonths: g.vestingTotalMonths,
              cliffMonths: g.vestingCliffMonths,
              frequency: g.vestingFrequency,
            });

            const cliffPct =
              v.hasSchedule && v.cliffDate && g.vestingTotalMonths && g.vestingStartDate
                ? (Math.max(0, v.cliffDate.getTime() - new Date(`${g.vestingStartDate}T00:00:00Z`).getTime()) /
                    (g.vestingTotalMonths * 30.4375 * 24 * 3600 * 1000)) *
                  100
                : null;

            // Plain-English summary string for the AI explainer + screen readers.
            const summaryParts: string[] = [];
            if (isConvertible) {
              const amount = Number(g.monetaryAmount ?? 0);
              const cur = (g.monetaryCurrency ?? company.currency).trim();
              summaryParts.push(`A ${label} of ${moneyFmt(amount, cur)} at ${company.displayName}.`);
              if (g.capAmount)
                summaryParts.push(`Valuation cap ${moneyFmt(Number(g.capAmount), cur)}.`);
              if (g.discountPercent) summaryParts.push(`${Number(g.discountPercent)}% discount.`);
            } else {
              summaryParts.push(`${intFmt.format(qty)} ${label} at ${company.displayName}.`);
              if (g.strikePrice)
                summaryParts.push(
                  `Strike price ${moneyFmt(Number(g.strikePrice), (g.strikeCurrency ?? company.currency).trim())}.`,
                );
              if (v.hasSchedule) {
                summaryParts.push(
                  `Vests over ${Math.round((g.vestingTotalMonths ?? 0) / 12)} years` +
                    (g.vestingCliffMonths
                      ? ` with a ${g.vestingCliffMonths}-month cliff.`
                      : "."),
                );
              }
            }
            const grantSummary = summaryParts.join(" ");

            return (
              <li
                key={g.securityId}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-slate-900">{label}</div>
                    {fdPct != null ? (
                      <div className="mt-0.5 text-xs text-slate-500">
                        ≈ {fdPct.toFixed(fdPct < 1 ? 2 : 1)}% of {company.displayName} (fully
                        diluted)
                      </div>
                    ) : null}
                  </div>
                  {g.status !== "active" ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {g.status}
                    </span>
                  ) : null}
                </div>

                {isConvertible ? (
                  <p className="mt-3 text-sm text-slate-600">
                    You invested{" "}
                    <span className="font-medium text-slate-900">
                      {moneyFmt(Number(g.monetaryAmount ?? 0), (g.monetaryCurrency ?? company.currency).trim())}
                    </span>
                    . It converts to shares at the next priced round.
                  </p>
                ) : (
                  <div className="mt-3">
                    <p className="text-sm text-slate-600">
                      You hold{" "}
                      <span className="font-medium tabular-nums text-slate-900">
                        {intFmt.format(qty)}
                      </span>{" "}
                      {label.toLowerCase()}.
                    </p>

                    {v.hasSchedule ? (
                      <div className="mt-3 space-y-2">
                        <VestingBar vestedPct={v.vestedPct} cliffPct={cliffPct} />
                        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>
                            Vested{" "}
                            <span className="font-medium tabular-nums text-slate-700">
                              {intFmt.format(v.vestedQty)}
                            </span>{" "}
                            of {intFmt.format(qty)} ({v.vestedPct.toFixed(0)}%)
                          </span>
                          {v.fullyVested ? (
                            <span className="text-brand-700">Fully vested</span>
                          ) : v.nextVestDate ? (
                            <span>
                              Next: {intFmt.format(v.nextVestQty)} on {fmtDate(v.nextVestDate)}
                            </span>
                          ) : null}
                        </div>
                        {!v.fullyVested && v.fullyVestedDate ? (
                          <p className="text-xs text-slate-400">
                            {v.cliffPassed
                              ? `Fully vested on ${fmtDate(v.fullyVestedDate)}.`
                              : `Cliff on ${fmtDate(v.cliffDate)} — nothing vests before then.`}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-slate-400">Fully owned — no vesting schedule.</p>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  <ExplainGrantButton grantSummary={grantSummary} jurisdiction={company.jurisdiction} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-slate-900">Common questions</h2>
        <div className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none text-sm font-medium text-slate-800 marker:content-none">
                {item.q}
              </summary>
              <p className="mt-2 text-sm text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
