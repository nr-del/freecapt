import type { Metadata } from "next";

import { ComparisonPage, type ComparisonData } from "@/components/marketing/comparison";

export const metadata: Metadata = {
  title: "FreeCapT vs Pulley - a free, multi-jurisdiction alternative",
  description:
    "How FreeCapT compares to Pulley for founders and small businesses: pricing, jurisdictions, AI features, and who each tool is built for. Free for personal cap tables; $15/month to share.",
  alternates: { canonical: "/compare/pulley" },
};

const DATA: ComparisonData = {
  competitor: "Pulley",
  competitorTagline: "A modern cap table and equity-management tool for startups.",
  lede: "Pulley is a well-regarded modern cap table tool aimed primarily at US startups. FreeCapT covers seven jurisdictions, is AI-native, and is free for your personal cap table. Here is an honest, factual comparison.",
  bestForFreeCapT:
    "Founders and small businesses outside the US venture track - or inside it - who want a free, multi-jurisdiction cap table in their own language, with AI built in.",
  bestForCompetitor:
    "US startups that want a clean, modern cap table with strong support for priced rounds, SAFEs, and US equity-compensation workflows.",
  whenCompetitor:
    "If you are a US startup and want a polished, well-supported equity tool with deep US fundraising workflows and 409A partnerships, Pulley is a strong choice. We differentiate on free pricing, European jurisdictions, and AI-native UX.",
  rows: [
    { feature: "Free plan", freecapt: "Yes - the full personal cap table, unlimited stakeholders, forever.", competitor: "Free tier for early-stage companies up to a stakeholder limit; paid plans above that.", edge: "freecapt" },
    { feature: "Entry pricing", freecapt: "$0 free, $15/month when you share, use AI, or export legal docs.", competitor: "Paid plans priced per company, typically rising with stage and headcount.", edge: "freecapt" },
    { feature: "Jurisdictions", freecapt: "DK, NO, SE, DE, CH, UK, US - local instruments, registries and tax schemes built in.", competitor: "US-focused, with some international coverage.", edge: "freecapt" },
    { feature: "Languages", freecapt: "English, Dansk, Norsk, Svenska, Deutsch (UI independent of jurisdiction).", competitor: "Primarily English.", edge: "freecapt" },
    { feature: "AI-native", freecapt: "Document extraction, plain-English bulk add, ask-your-cap-table chat, explain-this on every number.", competitor: "Modern UX; AI is not the central pitch.", edge: "freecapt" },
    { feature: "Local tax schemes", freecapt: "EMI, § 7P, opsjonsskatteordningen, QESO, ISO, profits interests - validated per jurisdiction.", competitor: "Strong US scheme support (ISO/NSO/SAFE); limited European schemes.", edge: "freecapt" },
    { feature: "Round modeling", freecapt: "Single-round simulator free; multi-investor modeling on the $15/month plan.", competitor: "Good scenario modeling for priced rounds and SAFEs.", edge: "even" },
    { feature: "Document generation", freecapt: "Per-jurisdiction legal-grade PDF/Word (ejerbog, Gesellschafterliste, Register of Members).", competitor: "US-oriented document workflows.", edge: "freecapt" },
    { feature: "Data ownership & export", freecapt: "One-click full export (ledger, docs, audit log). Magic-link auth, no passwords.", competitor: "Export available.", edge: "even" },
    { feature: "Setup", freecapt: "Self-serve in ~15 minutes, no sales call.", competitor: "Self-serve onboarding.", edge: "even" },
  ],
};

export default function ComparePage() {
  return <ComparisonPage data={DATA} />;
}
