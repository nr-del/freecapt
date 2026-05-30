import type { Metadata } from "next";

import { ComparisonPage, type ComparisonData } from "@/components/marketing/comparison";

export const metadata: Metadata = {
  title: "FreeCapT vs Carta - a free, multi-jurisdiction alternative",
  description:
    "How FreeCapT compares to Carta for founders and small businesses: pricing, jurisdictions, AI features, and who each tool is built for. Free for personal cap tables; $15/month to share.",
  alternates: { canonical: "/compare/carta" },
};

const DATA: ComparisonData = {
  competitor: "Carta",
  competitorTagline: "The market-leading US equity-management platform for venture-backed companies.",
  lede: "Carta is the best-known cap table platform, built for venture-backed US scaleups. FreeCapT is built for everyone else - bootstrapped founders, family businesses, agencies, and small SaaS, in seven jurisdictions. Here is an honest, factual comparison.",
  bestForFreeCapT:
    "Bootstrapped and early-stage founders, family businesses, agencies and small SaaS who want a real cap table for free, in their own jurisdiction and language, without a sales call.",
  bestForCompetitor:
    "Venture-backed US startups and scaleups that need 409A valuations, fund administration, and the broad equity-management suite investors already expect.",
  whenCompetitor:
    "If you are a US C-corp raising priced venture rounds and need integrated 409A valuations, fund administration, or features your investors specifically request, Carta's depth in that ecosystem is hard to match. We focus on the long tail Carta is not optimised for.",
  rows: [
    { feature: "Free plan", freecapt: "Yes - the full personal cap table, unlimited stakeholders, forever.", competitor: "Limited free tier for the smallest companies; paid plans scale up quickly.", edge: "freecapt" },
    { feature: "Entry pricing", freecapt: "$0 free, $15/month when you share, use AI, or export legal docs.", competitor: "Paid plans are typically several hundred to thousands of dollars per year as you grow.", edge: "freecapt" },
    { feature: "Jurisdictions", freecapt: "DK, NO, SE, DE, CH, UK, US - local instruments, registries and tax schemes built in.", competitor: "Strong US coverage; some international support, US-first by design.", edge: "freecapt" },
    { feature: "Languages", freecapt: "English, Dansk, Norsk, Svenska, Deutsch (UI independent of jurisdiction).", competitor: "Primarily English.", edge: "freecapt" },
    { feature: "AI-native", freecapt: "Document extraction, plain-English bulk add, ask-your-cap-table chat, explain-this on every number.", competitor: "Adding AI features; not the core of the product.", edge: "freecapt" },
    { feature: "409A valuations", freecapt: "Not offered - we are not a US valuation provider.", competitor: "Integrated 409A valuations and audit support.", edge: "competitor" },
    { feature: "Fund administration", freecapt: "Not offered - focused on the company cap table.", competitor: "Full fund administration and LP tooling.", edge: "competitor" },
    { feature: "Round modeling", freecapt: "Single-round simulator free; multi-investor modeling on the $15/month plan.", competitor: "Comprehensive scenario and waterfall modeling.", edge: "even" },
    { feature: "Data ownership & export", freecapt: "One-click full export (ledger, docs, audit log). Magic-link auth, no passwords.", competitor: "Export available; broader platform lock-in as you adopt more modules.", edge: "freecapt" },
    { feature: "Setup", freecapt: "Self-serve in ~15 minutes, no sales call.", competitor: "Self-serve for small plans; sales-led for larger ones.", edge: "even" },
  ],
};

export default function ComparePage() {
  return <ComparisonPage data={DATA} />;
}
