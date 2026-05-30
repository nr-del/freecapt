import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell, PageHeader } from "@/components/marketing/site-chrome";

export const metadata: Metadata = {
  title: "Terms of service - FreeCapT",
  description:
    "The terms for using FreeCapT, the free cap table for founders and small businesses. Plain-English terms covering accounts, plans, your data, and acceptable use.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "30 May 2026";

export default function TermsPage() {
  return (
    <MarketingShell>
      <PageHeader kicker="Legal" title="Terms of service" lede={`Last updated ${LAST_UPDATED}`} />
      <article className="mx-auto max-w-3xl px-6 py-16 text-sm leading-relaxed text-slate-600 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_li]:mb-1 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5">
        <p>
          These terms govern your use of FreeCapT, operated by Bifrost Studios (&ldquo;we&rdquo;),
          Copenhagen, Denmark. By creating an account you agree to them. We have kept them short and
          readable.
        </p>

        <h2>1. The service</h2>
        <p>
          FreeCapT helps you record and model a company&apos;s capitalisation. It is a software tool,
          not a law firm, accountant, or tax adviser. Nothing in the product is legal, financial, or
          tax advice. For actual fundraises, tax elections, and statutory filings, consult a
          qualified professional.
        </p>

        <h2>2. Accounts</h2>
        <p>
          You sign in with a magic link sent to your email - there are no passwords. You are
          responsible for keeping access to your email secure and for activity in your workspace. You
          must be old enough to form a binding contract in your jurisdiction.
        </p>

        <h2>3. Plans and billing</h2>
        <ul>
          <li>
            <strong>Free plan:</strong> the personal cap table is free, with no time limit and no
            stakeholder cap.
          </li>
          <li>
            <strong>Paid plan ($15/month):</strong> unlocks sharing with stakeholders, AI features
            beyond initial setup, and legal-grade document generation. Billed in advance; cancel any
            time and your plan stays active until the end of the period.
          </li>
          <li>
            Prices are shown exclusive of any applicable taxes (e.g. VAT), which are added where
            required.
          </li>
        </ul>

        <h2>4. Your data</h2>
        <p>
          You own the content you put into FreeCapT. You grant us the limited rights needed to host
          and process it to provide the service. You can export everything at any time, and deleting
          your account purges your data after a 30-day grace period. Our handling of personal data is
          described in the{" "}
          <Link href="/privacy" className="text-brand-600 hover:text-brand-700">
            privacy policy
          </Link>
          .
        </p>

        <h2>5. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>break the law or infringe others&apos; rights using the service;</li>
          <li>attempt to access data that is not yours, or probe our security without authorisation;</li>
          <li>resell or white-label the service without our written agreement;</li>
          <li>upload malware or interfere with the service&apos;s operation.</li>
        </ul>
        <p>
          Security researchers acting in good faith are welcome - see our responsible disclosure
          contact at{" "}
          <a href="mailto:security@freecapt.com" className="text-brand-600 hover:text-brand-700">
            security@freecapt.com
          </a>
          .
        </p>

        <h2>6. Availability</h2>
        <p>
          We work hard to keep FreeCapT available and accurate, but the service is provided on an
          &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties. Planned and
          unplanned status is published at{" "}
          <Link href="/status" className="text-brand-600 hover:text-brand-700">
            freecapt.com/status
          </Link>
          .
        </p>

        <h2>7. Liability</h2>
        <p>
          To the extent permitted by law, our total liability arising from the service is limited to
          the amount you paid us in the 12 months before the claim. We are not liable for indirect or
          consequential losses. Nothing limits liability that cannot be limited by law.
        </p>

        <h2>8. Changes and termination</h2>
        <p>
          We may update these terms; material changes will be notified by email or in-product. You can
          stop using and delete your account at any time. We may suspend or end access for serious or
          repeated breaches of these terms.
        </p>

        <h2>9. Governing law</h2>
        <p>
          These terms are governed by the laws of Denmark, with the courts of Copenhagen having
          jurisdiction, except where mandatory local consumer law gives you other rights.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions about these terms? Email{" "}
          <a href="mailto:hello@freecapt.com" className="text-brand-600 hover:text-brand-700">
            hello@freecapt.com
          </a>
          .
        </p>
      </article>
    </MarketingShell>
  );
}
