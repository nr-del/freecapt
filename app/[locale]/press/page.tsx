import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MarketingShell, PageHeader } from "@/components/marketing/site-chrome";
import { Link } from "@/i18n/navigation";
import { alternatesFor } from "@/i18n/metadata";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "press.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternatesFor("/press", locale),
  };
}

type Fact = { label: string; value: string };

export default async function PressPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("press");

  const facts = t.raw("facts") as Fact[];

  return (
    <MarketingShell>
      <PageHeader kicker={t("kicker")} title={t("title")} lede={t("lede")} />

      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Boilerplate */}
        <section className="mb-12">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">{t("boilerplateHeading")}</h2>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm leading-relaxed text-slate-600">
            <p>{t("boilerplate")}</p>
          </div>
        </section>

        {/* Fast facts */}
        <section className="mb-12">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">{t("factsHeading")}</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <dl className="divide-y divide-slate-100">
              {facts.map((f) => (
                <div key={f.label} className="flex gap-4 px-5 py-3 text-sm">
                  <dt className="w-32 shrink-0 font-medium text-slate-500">{f.label}</dt>
                  <dd className="text-slate-700">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Assets */}
        <section className="mb-12">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">{t("assetsHeading")}</h2>
          <p className="mb-4 text-sm text-slate-600">{t("assetsBody")}</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-4 text-2xl font-bold tracking-tight text-slate-900">
              Free<span className="text-brand-600">C</span>apT
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 px-6 py-4 text-2xl font-bold tracking-tight text-white">
              Free<span className="text-brand-500">C</span>apT
            </div>
            <a
              href="mailto:press@freecapt.com?subject=FreeCapT%20logo%20pack"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              {t("requestLogo")}
            </a>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">{t("mediaHeading")}</h2>
          <p className="text-sm text-slate-600">
            {t.rich("mediaBody", {
              email: (chunks) => (
                <a href="mailto:press@freecapt.com" className="text-brand-600 hover:text-brand-700">
                  {chunks}
                </a>
              ),
              link: (chunks) => (
                <Link href="/contact" className="text-brand-600 hover:text-brand-700">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </section>
      </div>
    </MarketingShell>
  );
}
