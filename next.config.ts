import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// withSentryConfig wires up tunneling + source-map upload. Source-map upload is
// skipped automatically unless SENTRY_AUTH_TOKEN (+ org/project) are set, so
// this is safe to apply unconditionally — it's a no-op until configured.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
