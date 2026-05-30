import type { MetadataRoute } from "next";

const BASE = "https://freecapt.com";

// Allow crawling of public marketing pages; keep crawlers out of the
// authenticated product, API, and auth callback.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cap-table", "/stakeholders", "/simulate", "/settings", "/api/", "/share/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
