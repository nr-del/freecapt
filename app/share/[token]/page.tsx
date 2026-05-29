import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ScenarioView } from "@/components/freecapt/scenario-view";
import { db, schema } from "@/lib/db";
import { simulateRound, type SimHolder, type SimInputs, type SimSafe } from "@/lib/simulate/engine";

// Public, read-only scenario share page — deliberately OUTSIDE the (app) auth
// wall (docs/01_mvp_scope.md §5.5: "Shareable read-only link"). The full cap
// table is frozen into the scenario's `inputs` snapshot at save time, so this
// renders identically even after the live cap table changes — and needs no
// sign-in to view.

// The snapshot persisted by saveScenario(). Mirror of ScenarioSnapshot.
type ScenarioSnapshot = {
  companyName: string;
  currency: string;
  inputs: SimInputs;
  holders: SimHolder[];
  safes: SimSafe[];
};

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [scenario] = await db
    .select({
      name: schema.scenarios.name,
      inputs: schema.scenarios.inputs,
      createdAt: schema.scenarios.createdAt,
    })
    .from(schema.scenarios)
    .where(eq(schema.scenarios.shareToken, token))
    .limit(1);

  if (!scenario) notFound();

  const snapshot = scenario.inputs as ScenarioSnapshot;
  const result = simulateRound(snapshot.holders, snapshot.safes, snapshot.inputs);

  const savedOn = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(scenario.createdAt);

  return (
    <main className="min-h-dvh bg-slate-50/50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-sm font-bold tracking-tight text-slate-900">
            Free<span className="text-brand-600">C</span>apT
          </Link>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            Read-only scenario
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{scenario.name}</h1>
          <p className="text-sm text-slate-500">
            {snapshot.companyName} · priced-round simulation · saved {savedOn}
          </p>
        </div>

        <ScenarioView result={result} currency={snapshot.currency} />

        <footer className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          <p>
            Simulated with{" "}
            <Link href="/" className="font-medium text-brand-600 hover:text-brand-700">
              FreeCapT
            </Link>{" "}
            — the free cap table for European founders.
          </p>
          <p className="mt-1">
            This is a what-if projection, not legal or tax advice. Numbers assume a simplified,
            non-circular SAFE conversion.
          </p>
        </footer>
      </div>
    </main>
  );
}
