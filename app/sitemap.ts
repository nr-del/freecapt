import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";

// Canonical production origin. Keep in sync with metadataBase in app/layout.tsx.
const BASE = "https://freecapt.com";

// Public, indexable routes only. The product (/cap-table, /stakeholders, …)
// lives behind the auth wall and is intentionally excluded, as is /status
// (robots: noindex). Every route here is localized under app/[locale]/, so we
// emit one entry per locale and cross-link them with hreflang alternates.
const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/compare", priority: 0.8, changeFrequency: "monthly" },
  { path: "/compare/carta", priority: 0.8, changeFrequency: "monthly" },
  { path: "/compare/pulley", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/press", priority: 0.5, changeFrequency: "monthly" },
  { path: "/changelog", priority: 0.6, changeFrequency: "weekly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/sign-in", priority: 0.4, changeFrequency: "yearly" },
];

// English (default locale) is un-prefixed; the others are /da, /no, /sv, /de.
const prefix = (locale: string) => (locale === routing.defaultLocale ? "" : `/${locale}`);
const urlFor = (locale: string, path: string) => `${BASE}${prefix(locale)}${path}`.replace(/\/$/, "") || BASE;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return ROUTES.flatMap((r) => {
    // Shared hreflang map for every locale variant of this route.
    const languages: Record<string, string> = {};
    for (const locale of routing.locales) languages[locale] = urlFor(locale, r.path);
    languages["x-default"] = urlFor(routing.defaultLocale, r.path);

    return routing.locales.map((locale) => ({
      url: urlFor(locale, r.path),
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      alternates: { languages },
    }));
  });
}
