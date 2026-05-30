import { Inter, JetBrains_Mono } from "next/font/google";

// docs/12_design_system.md §2.2 - Inter (sans/display), JetBrains Mono (mono).
// Shared so every root-level layout (localized marketing, product, share) can
// apply the same font CSS variables to its <html> element.
export const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const fontVars = `${inter.variable} ${jetbrainsMono.variable}`;
