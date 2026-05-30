import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { Toaster } from "@/components/ui/sonner";
import { fontVars } from "@/lib/fonts";
import { routing } from "@/i18n/routing";

// Root layout for the localized marketing routes. Renders <html lang={locale}>
// so the document language is correct per URL (/, /da, /no, /sv, /de) and wires
// the next-intl client provider so client components can translate too.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const SITE_NAME = "FreeCapT";
const SITE_URL = "https://freecapt.com";
const SITE_DESC =
  "The free cap table for founders and small businesses. Multi-jurisdiction, AI-native, free for personal cap tables.";

// Organization structured data for richer search results.
const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESC,
  parentOrganization: { "@type": "Organization", name: "Bifrost Studios" },
  email: "hello@freecapt.com",
  foundingLocation: "Copenhagen, Denmark",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html lang={locale} className={fontVars}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
