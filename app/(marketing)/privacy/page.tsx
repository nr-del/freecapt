import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell, PageHeader } from "@/components/marketing/site-chrome";

export const metadata: Metadata = {
  title: "Privacy policy - FreeCapT",
  description:
    "How FreeCapT collects, uses, and protects your data. GDPR-compliant, EU and US regions, no third-party trackers, one-click export and deletion.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "30 May 2026";

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <PageHeader kicker="Legal" title="Privacy policy" lede={`Last updated ${LAST_UPDATED}`} />
      <article className="mx-auto max-w-3xl px-6 py-16 text-sm leading-relaxed text-slate-600 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_li]:mb-1 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5">
        <p>
          This policy explains what data FreeCapT collects, why, and what you can do about it.
          FreeCapT is operated by Bifrost Studios (&ldquo;we&rdquo;), Copenhagen, Denmark. We are the
          data controller for your account data, and a data processor for the cap table content you
          store with us. We write this in plain English on purpose.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account data:</strong> your email address (used for magic-link sign-in) and basic
            profile and workspace settings.
          </li>
          <li>
            <strong>Cap table content:</strong> the companies, stakeholders, securities, and
            transactions you create. You control this; we process it to provide the service.
          </li>
          <li>
            <strong>Usage and diagnostics:</strong> minimal, privacy-respecting product analytics and
            error reports to keep the service working. Account identifiers are hashed in event
            payloads.
          </li>
        </ul>
        <p>
          We do not use Google Analytics, advertising trackers, or third-party session-replay tools
          that we do not control. We do not sell your data, ever.
        </p>

        <h2>Where your data lives</h2>
        <p>
          You choose your data region when you create a company. EU customers&apos; data is hosted in
          the EU (Frankfurt); US customers in us-east. The region is fixed once a company is created.
          A small number of carefully chosen sub-processors (hosting, email delivery, AI inference,
          error tracking) support the service; each is bound by a data processing agreement and
          selected for EU data handling where applicable.
        </p>

        <h2>AI features</h2>
        <p>
          When you use AI features (document extraction, plain-English bulk add, ask-your-cap-table),
          the relevant content is sent to our AI provider to generate a response, in your region
          where supported. We do not allow your content to be used to train third-party models.
        </p>

        <h2>Legal basis (GDPR)</h2>
        <p>
          We process account and cap table data to perform our contract with you, usage and security
          data under our legitimate interest in keeping the service safe and reliable, and any
          optional communications with your consent. EU/UK data subjects have rights of access,
          rectification, erasure, restriction, portability, and objection.
        </p>

        <h2>Your controls</h2>
        <ul>
          <li>
            <strong>Export:</strong> one click exports everything - ledger, documents, and audit log
            - as a ZIP.
          </li>
          <li>
            <strong>Deletion:</strong> deleting your account starts a 30-day grace period, then a full
            purge.
          </li>
          <li>
            <strong>Requests:</strong> data subject access requests are handled within 30 days.
          </li>
        </ul>

        <h2>Security</h2>
        <p>
          AES-256 encryption at rest, TLS 1.3 in transit, per-tenant encryption keys, an append-only
          audit log, and magic-link authentication (no passwords). More detail is on our{" "}
          <Link href="/#security" className="text-brand-600 hover:text-brand-700">
            security overview
          </Link>
          .
        </p>

        <h2>Cookies</h2>
        <p>
          We use only the cookies required to keep you signed in and the service secure. We do not use
          advertising or cross-site tracking cookies.
        </p>

        <h2>Contact</h2>
        <p>
          For any privacy request or question, email{" "}
          <a href="mailto:privacy@freecapt.com" className="text-brand-600 hover:text-brand-700">
            privacy@freecapt.com
          </a>
          . A Data Processing Agreement is available on request.
        </p>

        <p className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-400">
          This policy is provided in good faith and in plain language. If anything here conflicts with
          your rights under applicable law, those rights prevail.
        </p>
      </article>
    </MarketingShell>
  );
}
