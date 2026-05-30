"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScenarioView } from "@/components/freecapt/scenario-view";
import { RoundModelView } from "@/components/freecapt/round-model-view";
import { simulateRound, type SimHolder, type SimInputs, type SimSafe } from "@/lib/simulate/engine";

import { saveScenario } from "./actions";

export function SimulateClient({
  companyName,
  companyId,
  currency,
  holders,
  safes,
}: {
  companyName: string;
  companyId: string;
  currency: string;
  holders: SimHolder[];
  safes: SimSafe[];
}) {
  const [roundSize, setRoundSize] = useState(2_000_000);
  const [preMoney, setPreMoney] = useState(10_000_000);
  const [poolTopupPct, setPoolTopupPct] = useState(0);
  const [investorName, setInvestorName] = useState("New investor");

  const [saveOpen, setSaveOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const inputs: SimInputs = useMemo(
    () => ({
      roundSize,
      preMoney,
      poolTopupPct: poolTopupPct || undefined,
      newInvestorName: investorName,
    }),
    [roundSize, preMoney, poolTopupPct, investorName],
  );

  const result = useMemo(
    () => simulateRound(holders, safes, inputs),
    [holders, safes, inputs],
  );

  const onSave = () => {
    startTransition(async () => {
      const res = await saveScenario(scenarioName, {
        companyName,
        currency,
        inputs,
        holders,
        safes,
      });
      if (res.ok) {
        const url = `${window.location.origin}${res.path}`;
        setShareUrl(url);
        await navigator.clipboard?.writeText(url).catch(() => {});
        toast.success("Scenario saved - shareable link copied to clipboard.");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{companyName}</h1>
          <p className="text-sm text-slate-500">Simulate a priced round</p>
        </div>
      </header>

      <Tabs defaultValue="basic" className="mt-6">
        <TabsList>
          <TabsTrigger value="basic">Basic round</TabsTrigger>
          <TabsTrigger value="modeling">
            Round modeling
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
              Paid
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            {/* Inputs */}
            <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Round inputs</h2>
              <div className="mt-4 space-y-4">
                <MoneyField
                  id="round-size"
                  label="Round size"
                  currency={currency}
                  value={roundSize}
                  onChange={setRoundSize}
                />
                <MoneyField
                  id="pre-money"
                  label="Pre-money valuation"
                  currency={currency}
                  value={preMoney}
                  onChange={setPreMoney}
                />
                <div>
                  <Label htmlFor="pool-topup">Pool top-up (optional)</Label>
                  <div className="relative mt-1">
                    <Input
                      id="pool-topup"
                      type="number"
                      min={0}
                      max={50}
                      value={poolTopupPct || ""}
                      placeholder="0"
                      onChange={(e) => setPoolTopupPct(Math.max(0, Number(e.target.value) || 0))}
                      className="pr-8"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      %
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Target post-round pool size.</p>
                </div>
                <div>
                  <Label htmlFor="investor-name">New investor</Label>
                  <Input
                    id="investor-name"
                    value={investorName}
                    onChange={(e) => setInvestorName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <Button className="mt-5 w-full" onClick={() => setSaveOpen(true)}>
                Save & share scenario
              </Button>
              {safes.length > 0 && (
                <p className="mt-3 text-xs text-slate-500">
                  {safes.length} outstanding {safes.length === 1 ? "SAFE/convertible" : "SAFEs/convertibles"}{" "}
                  auto-converted at this round.
                </p>
              )}
            </aside>

            {/* Result */}
            <div>
              <ScenarioView result={result} currency={currency} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="modeling" className="mt-4">
          <RoundModelView currency={currency} holders={holders} safes={safes} />
        </TabsContent>
      </Tabs>

      {/* Save dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogTitle className="text-lg font-bold">Save this scenario</DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Saving creates a read-only link you can share with your cofounder - no sign-in required
            to view.
          </DialogDescription>
          <div className="mt-4">
            <Label htmlFor="scenario-name">Scenario name</Label>
            <Input
              id="scenario-name"
              className="mt-1"
              value={scenarioName}
              placeholder={`Seed round - ${new Date().getFullYear()}`}
              onChange={(e) => setScenarioName(e.target.value)}
            />
          </div>

          {shareUrl && (
            <div className="mt-4 rounded-md border border-brand-200 bg-brand-50 p-3">
              <p className="text-xs font-medium text-brand-800">Shareable link</p>
              <p className="mt-1 break-all font-mono text-xs text-brand-700">{shareUrl}</p>
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              {shareUrl ? "Done" : "Cancel"}
            </Button>
            <Button onClick={onSave} disabled={pending}>
              {pending ? "Saving…" : shareUrl ? "Save again" : "Save & copy link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* companyId reserved for future per-company scenario listing */}
      <span data-company={companyId} className="hidden" />
    </main>
  );
}

function MoneyField({
  id,
  label,
  currency,
  value,
  onChange,
}: {
  id: string;
  label: string;
  currency: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          {currency}
        </span>
        <Input
          id={id}
          type="number"
          min={0}
          step={10000}
          value={value || ""}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="pl-12 tabular-nums"
        />
      </div>
    </div>
  );
}
