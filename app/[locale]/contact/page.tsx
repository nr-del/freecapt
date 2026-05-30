import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MarketingShell, PageHeader } from "@/components/marketing/site-chrome";
import { alternatesFor } from "@/i18n/metadata";
import { Link } from "@/i18n/navigation";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternatesFor("/contact", locale),
  };
}

type Channel = { icon: string; title: string; body: string; email: string };

export default async function ContactPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  const channels = t.raw("channels") as Channel[];

  return (
    <MarketingShell>
      <PageHeader kicker={t("kicker")} title={t("title")} lede={t("lede")} />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {channels.map((c) => (
            <div key={c.email} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-3 text-2xl">{c.icon}</div>
              <div className="mb-1 text-sm font-semibold text-slate-900">{c.title}</div>
              <p className="mb-3 text-sm text-slate-600">{c.body}</p>
              <a
                href={`mailto:${c.email}`}
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                {c.email}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">{t("detailsHeading")}</h2>
          <dl className="space-y-2 text-sm text-slate-600">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-slate-500">{t("operatedByLabel")}</dt>
              <dd>{t("operatedByValue")}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-slate-500">{t("basedInLabel")}</dt>
              <dd>{t("basedInValue")}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-slate-500">{t("emailLabel")}</dt>
              <dd>
                <a href="mailto:hello@freecapt.com" className="text-brand-600 hover:text-brand-700">
                  hello@freecapt.com
                </a>
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-slate-500">{t("statusLabel")}</dt>
              <dd>
                <Link href="/status" className="text-brand-600 hover:text-brand-700">
                  freecapt.com/status
                </Link>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </MarketingShell>
  );
}
