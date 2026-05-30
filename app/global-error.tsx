"use client";

// Top-level client error boundary - reports unhandled render errors to Sentry
// (no-op when SENTRY_DSN is unset) and shows a calm, blame-free fallback
// (docs/07_brand_package.md §4: error tone is specific and points at the fix).
import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
