// Sentry — server runtime init (docs/13 Prompt 10). EU region per CLAUDE.md.
// Disabled automatically when SENTRY_DSN is unset, so local/CI builds are no-ops
// until the DSN is added in Vercel.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: Boolean(process.env.SENTRY_DSN),
});
