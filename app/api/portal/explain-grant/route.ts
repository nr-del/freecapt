// POST /api/portal/explain-grant - a plain-English explanation of one
// stakeholder's grant (docs/01_mvp_scope.md §5.7 "Explain my grant"). Claude
// runs SERVER-SIDE only; ANTHROPIC_API_KEY never reaches the client (CLAUDE.md).
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { NextResponse } from "next/server";

import { CLAUDE_MODEL, isClaudeConfigured } from "@/lib/ai/claude";
import { SYSTEM_EXPLAIN } from "@/lib/ai/prompts";
import { getPortalUser } from "@/lib/portal/queries";

export const runtime = "nodejs";
export const maxDuration = 30;

export interface ExplainGrantResponse {
  ok: boolean;
  text?: string;
  error?: string;
}

export async function POST(req: Request): Promise<NextResponse<ExplainGrantResponse>> {
  const user = await getPortalUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Please sign in to use this." }, { status: 401 });
  }

  let summary = "";
  let jurisdiction = "";
  try {
    const body = (await req.json()) as { grantSummary?: unknown; jurisdiction?: unknown };
    summary = typeof body.grantSummary === "string" ? body.grantSummary.trim() : "";
    jurisdiction = typeof body.jurisdiction === "string" ? body.jurisdiction.trim() : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't read your request." }, { status: 400 });
  }
  if (summary.length < 3) {
    return NextResponse.json({ ok: false, error: "Nothing to explain." }, { status: 400 });
  }

  if (!isClaudeConfigured()) {
    return NextResponse.json(
      { ok: false, error: "AI explanations aren't switched on in this environment yet." },
      { status: 503 },
    );
  }

  try {
    const { text } = await generateText({
      model: anthropic(CLAUDE_MODEL),
      system: SYSTEM_EXPLAIN,
      prompt:
        `Explain this equity grant to the person who holds it, in 3-4 short, warm, plain ` +
        `sentences. Lead with what they have. Don't repeat the raw numbers back verbatim; ` +
        `interpret them. ${jurisdiction ? `The company is in ${jurisdiction.toUpperCase()}; ` : ""}` +
        `note any tax angle only briefly and say it depends on their situation.\n\nGrant: ${summary}`,
    });
    return NextResponse.json({ ok: true, text: text.trim() });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Couldn't generate an explanation just now. Please try again." },
      { status: 502 },
    );
  }
}
