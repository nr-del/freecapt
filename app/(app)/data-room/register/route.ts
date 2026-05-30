// Streams the statutory shareholder register as a print-ready PDF (§5.27
// legal-grade exports). Auth-walled: route handlers are not wrapped by the
// (app) layout, so we re-check the Supabase session here. The register is
// generated on demand from the live cap table, so it is always current.
import { NextResponse } from "next/server";

import { createServerClient } from "@/lib/auth/supabase-server";
import { getActiveCompany } from "@/lib/db/queries";
import { buildShareholderRegister } from "@/lib/exports/register";
import { renderRegisterPdf } from "@/lib/exports/register-pdf";

// Generated from per-request session + DB — never cache.
export const dynamic = "force-dynamic";

// Make a filesystem-safe slug from the company name for the download filename.
function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "company"
  );
}

export async function GET() {
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

  const register = await buildShareholderRegister(company);
  const pdf = await renderRegisterPdf(register);

  const filename = `${slugify(company.legalName)}-shareholder-register.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
