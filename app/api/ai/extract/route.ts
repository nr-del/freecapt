// POST /api/ai/extract — turn a founder's free-text cap-table description into
// structured rows for the bulk-add grid. Claude runs SERVER-SIDE only; the
// ANTHROPIC_API_KEY never reaches the client (CLAUDE.md).
//
// AI onboarding is free ONE time per account (docs/13 Prompt 9), tracked via
// accounts.has_used_ai_onboarding. A second attempt returns a paywall flag.
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { CLAUDE_MODEL, isClaudeConfigured } from "@/lib/ai/claude";
import { extractionSchema, toBulkRow, type ExtractResponse } from "@/lib/ai/extract";
import { SYSTEM_EXTRACT_CAP_TABLE } from "@/lib/ai/prompts";
import { db, schema } from "@/lib/db";
import { getCurrentAccountId } from "@/lib/db/queries";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request): Promise<NextResponse<ExtractResponse>> {
  const accountId = await getCurrentAccountId();
  if (!accountId) {
    return NextResponse.json({ ok: false, error: "Please sign in to use the AI helper." }, { status: 401 });
  }

  let text = "";
  try {
    const body = (await req.json()) as { text?: unknown };
    text = typeof body.text === "string" ? body.text.trim() : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't read your request." }, { status: 400 });
  }
  if (text.length < 3) {
    return NextResponse.json(
      { ok: false, error: "Describe your cap table first — e.g. “Anna 30%, Ben 30%”." },
      { status: 400 },
    );
  }

  // Free-one-time gate. (Stripe enforcement lands week 10; for now we only gate
  // on the boolean and surface the paywall in the UI.)
  const [account] = await db
    .select({ used: schema.accounts.hasUsedAiOnboarding })
    .from(schema.accounts)
    .where(eq(schema.accounts.id, accountId))
    .limit(1);
  if (account?.used) {
    return NextResponse.json(
      { ok: false, paywall: true, error: "You've used your free AI extraction. It's included on the Paid plan." },
      { status: 402 },
    );
  }

  if (!isClaudeConfigured()) {
    return NextResponse.json(
      { ok: false, error: "AI isn't switched on in this environment yet." },
      { status: 503 },
    );
  }

  let extraction;
  try {
    const result = await generateObject({
      model: anthropic(CLAUDE_MODEL),
      schema: extractionSchema,
      system: SYSTEM_EXTRACT_CAP_TABLE,
      prompt: text,
    });
    extraction = result.object;
  } catch {
    return NextResponse.json(
      { ok: false, error: "The AI couldn't read that. Try rephrasing, or use Paste instead." },
      { status: 502 },
    );
  }

  // Burn the free use only on a successful extraction.
  await db
    .update(schema.accounts)
    .set({ hasUsedAiOnboarding: true })
    .where(eq(schema.accounts.id, accountId));

  return NextResponse.json({
    ok: true,
    rows: extraction.rows.map(toBulkRow),
    assumptions: extraction.assumptions,
  });
}
