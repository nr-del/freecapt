import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MarketingShell, PageHeader } from "@/components/marketing/site-chrome";
import { Link } from "@/i18n/navigation";
import { alternatesFor } from "@/i18n/metadata";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternatesFor("/about", locale),
  };
}

type Value = { title: string; body: string };

export default async function AboutPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  const paragraphs = t.raw("paragraphs") as string[];
  const values = t.raw("values") as Value[];

  return (
    <MarketingShell>
      <PageHeader kicker={t("kicker")} title={t("title")} lede={t("lede")} />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="prose-sm space-y-5 text-slate-600">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {values.map((v) => (
            <div key={v.title} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-2 text-sm font-semibold text-slate-900">{v.title}</div>
              <p className="text-sm text-slate-600">{v.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">{t("whoHeading")}</h2>
          <p className="text-sm text-slate-600">
            {t.rich("whoBody", {
              studio: (chunks) => <span className="font-medium text-slate-900">{chunks}</span>,
            })}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/sign-in"
              className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/contact"
              className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-white"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
