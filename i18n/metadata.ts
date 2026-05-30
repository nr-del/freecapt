import { routing } from "./routing";

// Per-locale canonical + hreflang alternates for marketing pages. With
// localePrefix "as-needed", the default locale (en) lives at the un-prefixed
// path and the others get a /{locale} prefix. Returned paths are relative and
// resolve against `metadataBase` (https://freecapt.com) set in the root layout.
//
// Pass the path WITHOUT a locale prefix, e.g. "/about". For the home page pass
// "" so the en canonical resolves to the bare root.
export function alternatesFor(path: string, locale: string) {
  const prefix = (l: string) => (l === routing.defaultLocale ? "" : `/${l}`);
  const href = (l: string) => `${prefix(l)}${path}` || "/";

  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = href(l);
  languages["x-default"] = href(routing.defaultLocale);

  return {
    canonical: href(locale),
    languages,
  };
}
