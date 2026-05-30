import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// next-intl plugin: points at the per-request i18n config.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Friendly aliases for the canonical sign-in route (/sign-in), so common
  // guesses like /login don't dead-end on a 404.
  async redirects() {
    return [
      { source: "/login", destination: "/sign-in", permanent: true },
      { source: "/signin", destination: "/sign-in", permanent: true },
    ];
  },
};

// withSentryConfig wires up tunneling + source-map upload. Source-map upload is
// skipped automatically unless SENTRY_AUTH_TOKEN (+ org/project) are set, so
// this is safe to apply unconditionally — it's a no-op until configured.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
