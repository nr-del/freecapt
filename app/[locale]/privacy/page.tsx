import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MarketingShell, PageHeader } from "@/components/marketing/site-chrome";
import { Link } from "@/i18n/navigation";
import { alternatesFor } from "@/i18n/metadata";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternatesFor("/privacy", locale),
  };
}

const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

export default async function PrivacyPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");

  const collectItems = t.raw("collectItems") as string[];
  const controlsItems = t.raw("controlsItems") as string[];

  return (
    <MarketingShell>
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        lede={t("lastUpdated", { date: t("lastUpdatedDate") })}
      />
      <article className="mx-auto max-w-3xl px-6 py-16 text-sm leading-relaxed text-slate-600 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_li]:mb-1 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5">
        <p>{t("intro")}</p>

        <h2>{t("collectHeading")}</h2>
        <ul>
          {collectItems.map((_, i) => (
            <li key={i}>{t.rich(`collectItems.${i}`, { strong })}</li>
          ))}
        </ul>
        <p>{t("collectNote")}</p>

        <h2>{t("whereHeading")}</h2>
        <p>{t("whereBody")}</p>

        <h2>{t("aiHeading")}</h2>
        <p>{t("aiBody")}</p>

        <h2>{t("legalHeading")}</h2>
        <p>{t("legalBody")}</p>

        <h2>{t("controlsHeading")}</h2>
        <ul>
          {controlsItems.map((_, i) => (
            <li key={i}>{t.rich(`controlsItems.${i}`, { strong })}</li>
          ))}
        </ul>

        <h2>{t("securityHeading")}</h2>
        <p>
          {t.rich("securityBody", {
            link: (chunks) => (
              <Link href="/#security" className="text-brand-600 hover:text-brand-700">
                {chunks}
              </Link>
            ),
          })}
        </p>

        <h2>{t("cookiesHeading")}</h2>
        <p>{t("cookiesBody")}</p>

        <h2>{t("contactHeading")}</h2>
        <p>
          {t.rich("contactBody", {
            email: (chunks) => (
              <a href="mailto:privacy@freecapt.com" className="text-brand-600 hover:text-brand-700">
                {chunks}
              </a>
            ),
          })}
        </p>

        <p className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-400">{t("disclaimer")}</p>
      </article>
    </MarketingShell>
  );
}
