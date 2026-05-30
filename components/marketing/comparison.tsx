// Shared renderer for "FreeCapT vs X" comparison pages. Data-driven so each
// competitor page is a thin data file (sourced from the message catalog). Tone
// follows docs/07_brand_package.md: factual, never sneering. NOTE: these pages
// intentionally reference a single competitor by name multiple times (the
// CLAUDE.md "one Carta reference per page" rule is relaxed for dedicated
// comparison pages) - kept strictly factual and dated, with a public-information
// disclaimer at the foot. Chrome strings come from next-intl; the comparison
// data is passed in already-translated by the page.
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { MarketingShell, PageHeader } from "@/components/marketing/site-chrome";

export type CompareRow = {
  feature: string;
  freecapt: string;
  competitor: string;
  /** Which column reads as the advantage, for the subtle highlight. */
  edge?: "freecapt" | "competitor" | "even";
};

export type ComparisonData = {
  competitor: string;
  /** One-line positioning of the competitor, factual. */
  competitorTagline: string;
  lede: string;
  /** Short "who it's for" framing for each side. */
  bestForFreeCapT: string;
  bestForCompetitor: string;
  rows: CompareRow[];
  /** Honest note on where the competitor is the better pick. */
  whenCompetitor: string;
};

function Cell({ value, highlight }: { value: string; highlight?: boolean }) {
  return (
    <td
      className={`px-4 py-3 align-top text-sm ${
        highlight ? "bg-brand-50/60 font-medium text-slate-900" : "text-slate-600"
      }`}
    >
      {value}
    </td>
  );
}

export function ComparisonPage({ data }: { data: ComparisonData }) {
  const t = useTranslations("comparison");
  const competitor = data.competitor;

  return (
    <MarketingShell>
      <PageHeader
        kicker={t("kicker")}
        title={t("title", { competitor })}
        lede={data.lede}
      />

      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Who each is for */}
        <div className="mb-12 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-6">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
              {t("freecaptIsFor")}
            </div>
            <p className="text-sm text-slate-700">{data.bestForFreeCapT}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("competitorIsFor", { competitor })}
            </div>
            <p className="text-sm text-slate-600">{data.bestForCompetitor}</p>
          </div>
        </div>

        {/* Feature table - scrolls horizontally on narrow screens so the three
            columns stay readable instead of crushing. */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[36rem] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">{t("featureHeader")}</th>
                <th className="px-4 py-3 text-brand-700">{t("freecaptHeader")}</th>
                <th className="px-4 py-3">{competitor}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.rows.map((row) => (
                <tr key={row.feature}>
                  <td className="px-4 py-3 align-top text-sm font-medium text-slate-900">
                    {row.feature}
                  </td>
                  <Cell value={row.freecapt} highlight={row.edge === "freecapt"} />
                  <Cell value={row.competitor} highlight={row.edge === "competitor"} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Honest "when to pick them" */}
        <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <div className="mb-1 text-sm font-semibold text-slate-900">
            {t("whenBetter", { competitor })}
          </div>
          <p className="text-sm text-slate-600">{data.whenCompetitor}</p>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-6 py-3 text-base font-medium text-white hover:bg-brand-700"
          >
            {t("ctaButton")} <span>→</span>
          </Link>
          <p className="mt-3 text-xs text-slate-500">{t("ctaNote", { competitor })}</p>
        </div>

        <p className="mt-12 border-t border-slate-200 pt-6 text-xs text-slate-400">
          {t.rich("disclaimer", {
            competitor,
            link: (chunks) => (
              <Link href="/contact" className="text-brand-600 hover:text-brand-700">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </MarketingShell>
  );
}
