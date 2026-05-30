import type { Metadata } from "next";
import "./globals.css";

// Root layout. Because the app mixes localized routes (marketing, under
// [locale]) with non-localized routes (the product, share links), the <html>
// and <body> tags live in the per-section layouts - app/[locale]/layout.tsx,
// app/(app)/layout.tsx, and app/share/layout.tsx - and this root just passes
// children through. Global CSS + default metadata still belong here so every
// route inherits them.
const SITE_URL = "https://freecapt.com";
const SITE_NAME = "FreeCapT";
const SITE_DESC =
  "The free cap table for founders and small businesses. Multi-jurisdiction, AI-native, free for personal cap tables.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FreeCapT - the free cap table for founders and small businesses",
    template: "%s | FreeCapT",
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: [
    "cap table",
    "free cap table",
    "captable software",
    "equity management",
    "Carta alternative",
    "Pulley alternative",
    "ESOP",
    "EMI options",
    "SAFE",
    "startup equity",
    "founders",
    "small business",
  ],
  authors: [{ name: "Bifrost Studios" }],
  creator: "Bifrost Studios",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "FreeCapT - the free cap table for founders and small businesses",
    description: SITE_DESC,
    url: SITE_URL,
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: "FreeCapT - the free cap table for founders and small businesses",
    description: SITE_DESC,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
