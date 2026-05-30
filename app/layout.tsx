import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";

// docs/12_design_system.md §2.2 - Inter (sans/display), JetBrains Mono (mono)
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

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
  alternates: { canonical: "/" },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
