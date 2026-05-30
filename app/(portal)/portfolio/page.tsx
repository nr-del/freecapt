import Link from "next/link";

import { getMyHoldings, getPortalUser } from "@/lib/portal/queries";
import { TYPE_LABEL } from "@/lib/cap-table/display";

export const metadata = {
  title: "Your equity · FreeCapT",
};

// Portfolio dashboard (§5.23): every company where the signed-in person holds
// equity. Angels/advisors with grants in several companies see them all here.
export default async function PortfolioPage() {
  const [user, holdings] = await Promise.all([getPortalUser(), getMyHoldings()]);
  const firstName = user?.email?.split("@")[0] ?? "there";

  if (holdings.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">No equity linked yet</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          When a company grants you equity and invites you to FreeCapT, your stake will appear
          here. We match grants to{" "}
          <span className="font-medium text-slate-700">{user?.email}</span>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Welcome{user?.email ? `, ${firstName}` : ""}.
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {holdings.length === 1
          ? "Here's the company where you hold equity."
          : `You hold equity in ${holdings.length} companies.`}
      </p>

      <ul className="mt-6 space-y-3">
        {holdings.map((h) => (
          <li key={h.companyId}>
            <Link
              href={`/portfolio/${h.companyId}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-brand-300 hover:bg-brand-50/30"
            >
              <div>
                <div className="text-base font-semibold text-slate-900">{h.companyName}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {TYPE_LABEL[h.stakeholderType] ?? "Stakeholder"} ·{" "}
                  {h.entityType.toUpperCase()} · {h.jurisdiction.toUpperCase()}
                </div>
              </div>
              <span className="shrink-0 text-sm font-medium text-brand-600">View your stake →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
