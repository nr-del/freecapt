"use client";

// Locale switcher for the marketing chrome. Switching keeps you on the current
// path and swaps only the locale prefix (next-intl router.replace with a locale
// option). The native <select> arrow is removed so only our single chevron
// shows. appearance:none + forced webkit/moz, per the design tokens.
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_LABELS, routing } from "@/i18n/routing";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  function onChange(next: string) {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className={`relative ${className}`}>
      <select
        aria-label={t("language")}
        value={locale}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none rounded-md border border-slate-200 bg-white py-1.5 pl-2 pr-7 text-xs [-moz-appearance:none] [-webkit-appearance:none]"
      >
        {routing.locales.map((l) => {
          const label = LOCALE_LABELS[l];
          return (
            <option key={l} value={l}>
              {label ? `${label.flag} ${label.short}` : l.toUpperCase()}
            </option>
          );
        })}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
