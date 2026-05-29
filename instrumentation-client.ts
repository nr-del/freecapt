// Sentry — client runtime init (Next 16 instrumentation-client convention).
// Uses the public DSN so it can run in the browser; disabled when unset.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
