// Streams a non-binding term-sheet draft PDF for a modeled round (§5.25). POST
// because the round terms + investor allocation live in client state, not the
// DB. Auth-walled (route handlers aren't wrapped by the (app) layout). The cap
// table is loaded server-side so the price/post-money math is authoritative —
// the client only supplies the round terms and the per-investor allocation.
import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerClient } from "@/lib/auth/supabase-server";
import { getActiveCompany } from "@/lib/db/queries";
import { buildTermSheet } from "@/lib/exports/term-sheet";
import { renderTermSheetPdf } from "@/lib/exports/term-sheet-pdf";
import { getPackForCompany } from "@/lib/packs/_shared/loader";
import { loadSimData } from "@/lib/simulate/load";
import { modelRound, type RoundInvestor } from "@/lib/simulate/round-model";

export const dynamic = "force-dynamic";

const shapeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("fixed"), amount: z.number().nonnegative() }),
  z.object({ kind: z.literal("range"), min: z.number().nonnegative(), max: z.number().nonnegative() }),
  z.object({ kind: z.literal("up_to"), max: z.number().nonnegative() }),
]);

const bodySchema = z.object({
  terms: z.object({
    roundSize: z.number().nonnegative(),
    preMoney: z.number().nonnegative(),
    poolTopupPct: z.number().min(0).max(100).optional(),
  }),
  investors: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string(),
        type: z.string().default("investor"),
        shape: shapeSchema,
        priority: z.enum(["must_include", "target", "optional", "fill_the_gap"]).optional(),
        minCheck: z.number().nonnegative().optional(),
        proRataPct: z.number().min(0).max(100).optional(),
      }),
    )
    .max(100),
  allocations: z.record(z.string(), z.number()),
});

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "company"
  );
}

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const company = await getActiveCompany();
  if (!company) {
    return NextResponse.json({ error: "No company" }, { status: 404 });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { holders, safes } = await loadSimData(company);
  const pack = getPackForCompany(company);

  const investors: RoundInvestor[] = parsed.investors.map((i) => ({
    id: i.id,
    name: i.name,
    type: i.type,
    shape: i.shape,
    priority: i.priority,
    minCheck: i.minCheck,
    proRataPct: i.proRataPct,
  }));

  const model = modelRound(holders, safes, parsed.terms, investors, parsed.allocations);
  const ts = buildTermSheet(company, pack, parsed.terms, model);
  const pdf = await renderTermSheetPdf(ts);

  const filename = `${slugify(company.legalName)}-term-sheet.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
