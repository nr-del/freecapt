import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MarketingShell, PageHeader } from "@/components/marketing/site-chrome";
import { Link } from "@/i18n/navigation";
import { alternatesFor } from "@/i18n/metadata";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternatesFor("/terms", locale),
  };
}

const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

export default async function TermsPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("terms");

  const s3Items = t.raw("s3Items") as string[];
  const s5Items = t.raw("s5Items") as string[];

  return (
    <MarketingShell>
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        lede={t("lastUpdated", { date: t("lastUpdatedDate") })}
      />
      <article className="mx-auto max-w-3xl px-6 py-16 text-sm leading-relaxed text-slate-600 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_li]:mb-1 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5">
        <p>{t("intro")}</p>

        <h2>{t("s1Heading")}</h2>
        <p>{t("s1Body")}</p>

        <h2>{t("s2Heading")}</h2>
        <p>{t("s2Body")}</p>

        <h2>{t("s3Heading")}</h2>
        <ul>
          {s3Items.map((_, i) => (
            <li key={i}>{t.rich(`s3Items.${i}`, { strong })}</li>
          ))}
        </ul>

        <h2>{t("s4Heading")}</h2>
        <p>
          {t.rich("s4Body", {
            link: (chunks) => (
              <Link href="/privacy" className="text-brand-600 hover:text-brand-700">
                {chunks}
              </Link>
            ),
          })}
        </p>

        <h2>{t("s5Heading")}</h2>
        <p>{t("s5Intro")}</p>
        <ul>
          {s5Items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          {t.rich("s5Outro", {
            email: (chunks) => (
              <a href="mailto:security@freecapt.com" className="text-brand-600 hover:text-brand-700">
                {chunks}
              </a>
            ),
          })}
        </p>

        <h2>{t("s6Heading")}</h2>
        <p>
          {t.rich("s6Body", {
            link: (chunks) => (
              <Link href="/status" className="text-brand-600 hover:text-brand-700">
                {chunks}
              </Link>
            ),
          })}
        </p>

        <h2>{t("s7Heading")}</h2>
        <p>{t("s7Body")}</p>

        <h2>{t("s8Heading")}</h2>
        <p>{t("s8Body")}</p>

        <h2>{t("s9Heading")}</h2>
        <p>{t("s9Body")}</p>

        <h2>{t("s10Heading")}</h2>
        <p>
          {t.rich("s10Body", {
            email: (chunks) => (
              <a href="mailto:hello@freecapt.com" className="text-brand-600 hover:text-brand-700">
                {chunks}
              </a>
            ),
          })}
        </p>
      </article>
    </MarketingShell>
  );
}
