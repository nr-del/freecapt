import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MarketingShell, PageHeader } from "@/components/marketing/site-chrome";
import { alternatesFor } from "@/i18n/metadata";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "statusPage.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternatesFor("/status", locale),
    robots: { index: false },
  };
}

// Locale tag for date formatting (Intl uses BCP-47; our codes map 1:1).
const DATE_LOCALES: Record<string, string> = {
  en: "en-GB",
  da: "da-DK",
  no: "nb-NO",
  sv: "sv-SE",
  de: "de-DE",
};

export default async function StatusPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("statusPage");

  const components = t.raw("components") as string[];
  const updated = new Date().toLocaleDateString(DATE_LOCALES[locale] ?? "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <MarketingShell>
      <PageHeader kicker={t("kicker")} title={t("title")} />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-5">
          <span className="flex h-3 w-3 shrink-0 rounded-full bg-brand-500" aria-hidden />
          <div>
            <div className="text-sm font-semibold text-slate-900">{t("allOperational")}</div>
            <div className="text-xs text-slate-500">{t("updated", { date: updated })}</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <ul className="divide-y divide-slate-100">
            {components.map((name) => (
              <li key={name} className="flex items-center justify-between px-5 py-3.5 text-sm">
                <span className="text-slate-700">{name}</span>
                <span className="inline-flex items-center gap-2 text-brand-700">
                  <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden />
                  {t("operational")}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          {t.rich("footnote", {
            email: (chunks) => (
              <a href="mailto:hello@freecapt.com" className="text-brand-600 hover:text-brand-700">
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>
    </MarketingShell>
  );
}
