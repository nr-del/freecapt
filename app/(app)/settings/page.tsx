import { getActiveCompany, getCompanyMembers, getCurrentAccountId } from "@/lib/db/queries";
import { AVAILABLE_PACKS, getPackForCompany } from "@/lib/packs/_shared/loader";
import { getShareClasses } from "@/lib/share-classes/queries";

import { MembersSection, type MemberRow } from "./members-section";
import { SettingsClient, type JurisdictionOption } from "./settings-client";
import { ShareClassesSection } from "./share-classes-section";

export default async function SettingsPage() {
  const company = await getActiveCompany();

  if (!company) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">No company yet</h1>
        <p className="mt-2 text-sm text-slate-500">
          Run <code className="rounded bg-slate-100 px-1.5 py-0.5">pnpm db:seed</code> to load the
          Acme demo.
        </p>
      </main>
    );
  }

  const pack = getPackForCompany(company);

  // One option per supported entity type, grouped under its pack.
  const options: JurisdictionOption[] = AVAILABLE_PACKS.flatMap((p) =>
    p.entityTypes.map((et) => ({
      value: et.code,
      label: `${et.englishName} (${et.localName})`,
      packName: p.displayName,
      currency: p.currency,
    })),
  );

  const [members, meId, shareClasses] = await Promise.all([
    getCompanyMembers(company.id),
    getCurrentAccountId(),
    getShareClasses(company.id),
  ]);
  const memberRows: MemberRow[] = members.map((m) => ({
    membershipId: m.membershipId,
    email: m.email,
    fullName: m.fullName,
    role: m.role,
    pending: m.acceptedAt == null,
    isSelf: meId != null && m.accountId === meId,
  }));

  return (
    <>
      <SettingsClient
        companyName={company.displayName}
        currentEntityType={company.entityType}
        currentJurisdiction={company.jurisdiction.toUpperCase()}
        currentCurrency={company.currency.trim()}
        currentPackVersion={company.packVersion}
        registryLabel={pack.registryId.label}
        registryValue={company.registryIdentifier}
        options={options}
      />
      <div className="mx-auto max-w-2xl px-6 pb-8">
        <ShareClassesSection
          classes={shareClasses.map((c) => ({
            id: c.id,
            name: c.name,
            seniority: c.seniority,
            isPreferred: c.isPreferred,
            liquidationPreferenceMultiple: c.liquidationPreferenceMultiple,
            participating: c.participating,
            votesPerShare: c.votesPerShare,
            inUse: c.inUse,
          }))}
        />
        <MembersSection members={memberRows} />
      </div>
    </>
  );
}
