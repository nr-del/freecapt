import type { MetadataRoute } from "next";

// Canonical production origin. Keep in sync with metadataBase in app/layout.tsx.
const BASE = "https://freecapt.com";

// Public, indexable routes only. The product (/cap-table, /stakeholders, …)
// lives behind the auth wall and is intentionally excluded.
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

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
