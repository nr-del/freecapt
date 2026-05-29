"use server";

import { randomBytes } from "node:crypto";

import { db, schema } from "@/lib/db";
import { getActiveCompany, getCurrentAccountId } from "@/lib/db/queries";
import type { SimHolder, SimInputs, SimSafe } from "@/lib/simulate/engine";

// The full, self-contained snapshot persisted on a saved scenario. Freezing the
// cap table (holders + safes) means a shared link renders identically even after
// the live cap table changes.
export type ScenarioSnapshot = {
  companyName: string;
  currency: string;
  inputs: SimInputs;
  holders: SimHolder[];
  safes: SimSafe[];
};

export type SaveScenarioResult =
  | { ok: true; token: string; path: string }
  | { ok: false; error: string };

export async function saveScenario(
  name: string,
  snapshot: ScenarioSnapshot,
): Promise<SaveScenarioResult> {
  const company = await getActiveCompany();
  if (!company) return { ok: false, error: "No active company to attach the scenario to." };

  const trimmed = name.trim() || "Untitled scenario";
  const token = randomBytes(18).toString("base64url");

  try {
    const accountId = await getCurrentAccountId();
    await db.insert(schema.scenarios).values({
      companyId: company.id,
      name: trimmed,
      inputs: snapshot,
      shareToken: token,
      createdByAccountId: accountId,
    });
    return { ok: true, token, path: `/share/${token}` };
  } catch {
    return { ok: false, error: "Couldn't save the scenario. Please try again." };
  }
}
