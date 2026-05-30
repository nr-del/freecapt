import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MarketingShell, PageHeader } from "@/components/marketing/site-chrome";
import { alternatesFor } from "@/i18n/metadata";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "changelog.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternatesFor("/changelog", locale),
  };
}

type Entry = { date: string; tag: string; tagColor: string; title: string; items: string[] };

export default async function ChangelogPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("changelog");

  const entries = t.raw("entries") as Entry[];

  return (
    <MarketingShell>
      <PageHeader kicker={t("kicker")} title={t("title")} lede={t("lede")} />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <ol className="space-y-10">
          {entries.map((entry, i) => (
            <li key={i} className="relative border-l border-slate-200 pl-6">
              <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500" />
              <div className="mb-2 flex items-center gap-3">
                <span className="text-xs font-medium text-slate-400">{entry.date}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    entry.tagColor || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {entry.tag}
                </span>
              </div>
              <h2 className="mb-2 text-base font-semibold text-slate-900">{entry.title}</h2>
              <ul className="space-y-1 text-sm text-slate-600">
                {entry.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-brand-500">·</span> {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </MarketingShell>
  );
}
