import { defineRouting } from "next-intl/routing";

// The five launch UI languages (CLAUDE.md i18n rules). Language is independent
// of jurisdiction. English is the default and lives at the un-prefixed root
// (/); the others are URL-prefixed (/da, /no, /sv, /de) so each language gets
// its own indexable URL for SEO. `as-needed` = no /en prefix for the default.
export const routing = defineRouting({
  locales: ["en", "da", "no", "sv", "de"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

// Display names for the language switcher (each in its own language).
export const LOCALE_LABELS: Record<string, { flag: string; short: string; name: string }> = {
  en: { flag: "🇬🇧", short: "EN", name: "English" },
  da: { flag: "🇩🇰", short: "DA", name: "Dansk" },
  no: { flag: "🇳🇴", short: "NO", name: "Norsk" },
  sv: { flag: "🇸🇪", short: "SV", name: "Svenska" },
  de: { flag: "🇩🇪", short: "DE", name: "Deutsch" },
};
