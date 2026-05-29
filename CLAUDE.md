# FreeCapT — Claude Code instructions

**This file is read by Claude Code on every session in this repo.** It sets project context, doc map, rules, and the build sequence. Update it as the project evolves.

---

## What we're building

**FreeCapT** is the free cap table for European founders — built for bootstrapped startups, family businesses, agencies, small SaaS, and holding companies across seven jurisdictions (Denmark, Norway, Sweden, Germany, Switzerland, the UK, the US).

**Domain:** freecapt.com · **Operating entity:** Bifrost Studios (Copenhagen)

**Wedge:** AI-native, multi-jurisdiction, free for personal cap tables, $15/mo when you want to share with stakeholders / use AI / generate legal docs. Anti-Carta in positioning and pricing.

**Stage:** solo-founder build, pre-launch. Target: closed beta with 10–20 friendly founders in ~16 weeks.

---

## The spec docs (read in this order, treat as canon)

The full design and decision history lives in `docs/`. When in doubt, read the doc, don't improvise.

1. **`docs/01_mvp_scope.md`** — the master spec (v1.1). Every product decision, screen, paywall split, country pack, simplification move. Most important doc.
2. **`docs/02_wireframes.html`** — clickable wireframe prototype showing every screen and key flow. Open in a browser for visual reference.
3. **`docs/05_data_model.md`** — Postgres schema, RLS policies, audit log, FX rates, timezone handling. Buildable as written.
4. **`docs/09_tech_stack.md`** — the stack: Next.js 15 + TypeScript + Supabase + Vercel + shadcn/ui + Drizzle (or Supabase client + Drizzle). Solo-founder calibrated.
5. **`docs/12_design_system.md`** — design tokens, component inventory, FreeCapT-specific patterns. **Read this before writing any UI.**
6. **`docs/07_brand_package.md`** — voice, tone, copy rules, banned words. **Read this before writing any user-facing copy.**
7. **`docs/03_country_packs_dk_no.md`**, **`04_country_packs_uk_us.md`**, **`06_country_packs_se_de_ch.md`** — instrument catalogs, validation rules, document templates per jurisdiction.
8. **`docs/11_kickoff.md`** — week-by-week build plan. Use this as the sequencing reference.
9. **`docs/08_landing_page.html`** — production-quality reference for marketing pages.
10. **`docs/10_interview_kit.md`** — customer interview script. For when Nicolai reports back from calls.

---

## The non-negotiable rules

These exist because we've made the decision once already. Don't re-litigate without flagging.

**Architecture & data:**
- **Multi-tenancy via Postgres RLS** on every tenanted table. Belt-and-suspenders. App-layer checks are not enough.
- **Money is `numeric(20, 4)`** with a separate ISO 4217 currency column. Never floats.
- **Share/option counts are `numeric(20, 0)`.** Never int. (Overflow on edge cases is unacceptable.)
- **UUIDs v7** for primary keys. Time-ordered, no leaking record counts.
- **`pack_version` snapshotted on every Transaction** — when statutes change, old grants stay interpreted under their original pack rules.
- **`audit_events` is append-only at the DB level** — `REVOKE UPDATE, DELETE`. Logical replication to immutable storage for 7-year retention.
- **All timestamps UTC**, IANA names for timezones (`Europe/Copenhagen`, never offsets).
- **Soft delete** (`deleted_at`) for tenanted data. Hard delete only via GDPR workflow.

**Auth:**
- **Magic-link only across all surfaces.** No passwords, ever. Supabase Auth configured to disable password sign-up.
- **Optional TOTP 2FA** for users who want it.
- **Session: HTTP-only cookies**, server-side validated, 30-day default.

**UI:**
- **Read `docs/12_design_system.md` before any UI work.** Follow tokens, component inventory, patterns. Reference them by section in code comments where relevant.
- **shadcn/ui as the component library.** Install via `pnpm dlx shadcn@latest add <component>` — don't write from scratch.
- **Tailwind classes only.** No inline `style={{}}` except for dynamic CSS variables (donut gradient, vest bar percentage).
- **Color usage canon:** emerald = action/brand only; amber = needs attention only; red = destructive only; slate = everything else. No indigo / purple / blue.
- **Numbers right-aligned with `tabular-nums`** anywhere they're in a list or table.

**Copy:**
- **Read `docs/07_brand_package.md` before any user-facing copy.**
- **Banned words:** *empower, unlock, supercharge, solution, industry-leading, game-changer, revolutionize, disrupt, next-generation, best-in-class*.
- **Plain language always.** Tax jargon in tooltips, not headlines.
- **Carta mention rule:** max one Carta reference per page; always factual, never sneering.

**Internationalization:**
- **5 launch UI languages:** English, Dansk, Norsk, Svenska, Deutsch. Use `next-intl`.
- **Language ≠ jurisdiction.** A Danish founder running a UK Ltd. should be able to use Danish UI; we don't conflate them.
- **Legal-grade exports stay in the jurisdiction's regulatory language** (Danish ejerbog stays in Danish even if UI is English).

**Multi-region:**
- **EU + US clusters**, immutable post-create per company.
- **EU launch first.** Add US Supabase project + Vercel region a few months in once there's actual US demand. (Spec said simultaneous; for solo-founder build, EU-only at launch.)

**Security & trust:**
- **Read `docs/01_mvp_scope.md` §5.17 before adding anything security-adjacent.**
- **No third-party trackers.** No Google Analytics. No Hotjar. No Intercom messenger. Vercel Analytics + PostHog (EU) only.
- **No PII in third-party tools** we don't control. Hash account IDs in event payloads.
- **The audit log is the source of truth.** Every state change writes to it.

---

## The stack — exact picks

| Layer | Pick | Notes |
|---|---|---|
| Language | TypeScript (strict) | tsconfig: `strict: true`, `noUncheckedIndexedAccess: true` |
| Runtime | Node.js 22 LTS | |
| Framework | **Next.js 16 (App Router)** | One codebase for marketing + product + `/admin`. Spec said 15; scaffolded on current stable 16 (create-next-app default). |
| Database | **Supabase** (Postgres 16+, EU region) | Was Neon in original spec; pivoted to Supabase |
| ORM | **Drizzle** | Use with Supabase Postgres connection string. Don't use the Supabase client for ORM-shaped queries. |
| Auth | **Supabase Auth** (magic-link only) | Was Lucia in original spec; pivoted to Supabase. Disable password sign-up in dashboard. |
| Storage | **Supabase Storage** | Was Cloudflare R2; pivoted to Supabase |
| Hosting | **Vercel** | Was Fly.io; pivoted to Vercel |
| Email | Resend | Add `freecapt.com` to Resend, verify DNS, store API key in Vercel env |
| AI | Anthropic SDK (Claude) + Vercel AI SDK | EU inference region |
| Background jobs | Inngest | Type-safe, no Redis |
| PDF | react-pdf primary, Puppeteer fallback | Legal-grade exports |
| Word | `docx` npm package | |
| Excel | `exceljs` | Multi-sheet, formulas |
| i18n | `next-intl` | ICU MessageFormat |
| Validation | Zod | API + form + DB-output parsing |
| UI components | shadcn/ui + Tailwind | Per `docs/12_design_system.md` |
| Icons | Lucide React | |
| Charts | Recharts | For vest projections, scenario comparisons; donut is custom CSS |
| Forms | react-hook-form + Zod | Standard combo |
| Payments | Stripe | Test mode until launch |
| Error tracking | Sentry (EU) | |
| Product analytics | PostHog (EU) | All events server-side |
| Logs | Vercel + Axiom (EU) | |
| Secrets | Vercel env vars; Doppler later | |

---

## Repo structure (target shape)

```
freecapt/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # /, /pricing, /dk, /de, etc.
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── (app)/                    # Authed product
│   │   ├── cap-table/
│   │   ├── stakeholders/
│   │   ├── transactions/
│   │   ├── simulate/
│   │   ├── data-room/
│   │   ├── settings/
│   │   └── layout.tsx            # Auth wall + nav
│   ├── (portal)/                 # Stakeholder portal — separate layout
│   │   ├── page.tsx              # Portfolio dashboard
│   │   └── [company]/page.tsx    # Single-company portal
│   ├── (admin)/                  # /admin — IP-allowlist staff only
│   ├── api/                      # Webhooks (Stripe, Inngest)
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn/ui — installed components
│   └── freecapt/                 # FreeCapT-specific patterns (donut, vest bar, etc.)
├── lib/
│   ├── db/                       # Drizzle schema + migrations
│   ├── auth/                     # Supabase auth helpers
│   ├── packs/                    # Country pack definitions
│   │   ├── _shared/
│   │   ├── dk/
│   │   ├── no/
│   │   ├── se/
│   │   ├── de/
│   │   ├── ch/
│   │   ├── uk/
│   │   └── us/
│   ├── ai/                       # Claude clients + prompts
│   ├── exports/                  # PDF, Word, Excel generators
│   ├── i18n/                     # Locale files + helpers
│   └── fx/                       # ECB rate fetcher
├── emails/                       # React Email templates
├── inngest/                      # Background functions
├── docs/                         # All spec docs (this file + 01-12 + landing.html + wireframes.html)
├── public/
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## The build sequence (per `11_kickoff.md`)

**Week 1:** Scaffold + Supabase Auth (magic link) + first empty Cap Table screen, deployed to Vercel.
**Week 2:** Real cap table data via Drizzle + bulk-add (paste mode only) + Stakeholders screen + first country pack (DK).
**Week 3:** Add NO/UK/US packs, jurisdiction-aware labels (next-intl), basic Simulator, Transactions screen, New Grant modal.
**Week 4:** AI onboarding helper (Claude side panel), Document upload + Claude extraction for bulk-add upload mode, Stakeholder portal stub. SE/DE/CH packs added.
**Week 5–6:** Stakeholder magic-link claim flow, Members + invitation flow, basic Settings.
**Week 7–8:** **Data room** (§5.26) + legal-grade PDF/Word exports (Paid features).
**Week 9–10:** **Round modeling** (§5.25) + Stripe paywall enforcement. First paying customer this phase.
**Week 11–12:** Internal admin app at `/admin`, remaining export polish, audit log surface, Security settings page.
**Week 13–14:** Polish, error handling, observability (Sentry + PostHog wired), bug fixes.
**Week 15–16:** Closed beta with 10–20 friendly founders, fix what breaks.

**What to NOT build in the first 4 weeks** (per `11_kickoff.md` §Phase 4):
- Legal-grade exports → week 7–8
- Round modeling → week 9–10
- Internal admin → week 11–12
- Stripe paywall → week 10
- SOC 2 prep → month 4+
- SSO → month 6+
- French/Italian UI → month 4+

If you find yourself building these earlier, you're procrastinating on the harder thing.

---

## Decisions deferred (these are open and OK to leave open)

- **Drizzle vs. Supabase client.** Spec picks Drizzle. If you find Drizzle + Supabase friction-y, switching to `@supabase/supabase-js` for queries (still PostgREST under the hood) is a reasonable mid-build pivot. The data model doesn't care.
- **ORM-managed migrations vs. Supabase CLI.** Both work. Pick one and stick to it.
- **Inngest vs. Vercel Cron.** Inngest is more capable; Vercel Cron is simpler. Start with Vercel Cron for scheduled emails until complexity demands Inngest.
- **PDF: react-pdf vs. Puppeteer.** Try react-pdf first. If layouts get painful, switch specific templates to Puppeteer.
- **US region setup.** Defer until first paying US customer asks.

---

## How to use this doc in conversation

When Claude Code starts a session:
1. It reads this file automatically (this is what `CLAUDE.md` at repo root does).
2. It also reads any file referenced when you ask. So `"read docs/05_data_model.md and write the companies + accounts migrations"` works.
3. **Reference docs by file + section** when you want precision: *"Per docs/12_design_system.md §6.1, build the cap table donut as a pure CSS conic-gradient component."*

If something in this `CLAUDE.md` becomes stale because a decision changed, **update it.** This file should drift forward with the project, not become a fossil.

---

## Current build status

**Phase:** Week 1 in progress — scaffold (Prompt 1) + full schema (Prompts 2/4) + magic-link auth (Prompt 3) + cap-table view (Prompt 4) code-complete. Full end-to-end sign-in test pending (magic link must be clicked by the user); the authenticated `/cap-table` screen is not yet visually verified in-browser for the same reason.
**Done:** Next.js 16 (App Router, TS strict + `noUncheckedIndexedAccess`), Tailwind v3 with design tokens (`docs/12_design_system.md` §2–3), Inter + JetBrains Mono via next/font, shadcn/ui (New York / slate) with FreeCapT button/input/badge overrides (§5), repo dir structure, coming-soon marketing page. Drizzle ORM wired to Supabase (`lib/db/index.ts`, `schema.ts`); **all ten tables** live in the EU project per `docs/05_data_model.md` §2.1–2.10 (accounts, companies, memberships, stakeholders, securities, transactions, documents, audit_events, subscriptions, vesting_schedules). Magic-link auth via `@supabase/ssr`: `lib/auth/supabase-{browser,server}.ts`, `proxy.ts` (session refresh), `/sign-in` (§6.8 card), `/api/auth/callback` (exchange + upsert accounts row), `(app)/layout.tsx` auth wall. **Cap-table view** (`/cap-table`): server component computes ownership from seeded data; client renders pure-CSS donut (`components/freecapt/cap-table-donut.tsx`), §5.4 compact table, emerald "X% left to grant" banner, Outstanding/Fully-diluted toggle, export dropdown (CSV real + client-side; PDF/Word/Excel gated behind §6.6 paywall modal). Seed (`lib/db/seed.ts`, `pnpm db:seed`): Acme Inc. — 3 founders common, 2 employees ISO, 1 advisor NSO, 1 SAFE investor ($250k @ $5M cap), 10M authorized ⇒ 6% pool unallocated. Auth wall verified (unauth `/cap-table` → 307 `/sign-in`). `pnpm build` green.
**Supabase:** project `freecapt` (ref `ucvjnhpytdwbbfoaxgzm`), region `eu-central-1`. URL + anon key in `.env.local`. `DATABASE_URL` uses the **session pooler** (`aws-1-eu-central-1.pooler.supabase.com:5432`, user `postgres.<ref>`) — direct `db.<ref>` host is IPv6-only and fails locally. **Still optional from dashboard:** `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` (Supabase built-in email works rate-limited). RLS is **enabled** (deny-by-default) on all ten tables — closes the anon REST surface; Drizzle owner role unaffected. Tenant policies (§3) still TODO when reads route through the authenticated role.
**Migration workflow:** `pnpm db:generate` produces SQL offline; apply via the Supabase MCP `apply_migration` (no local DB password). `db:migrate` is bypassed for now. `citext` extension created in migration 0000; RLS enabled via a separate MCP migration (tracked in Supabase history, not the drizzle journal).
**Stack notes:** Next 15→16 (current stable; uses `proxy.ts` not `middleware.ts`). Tailwind pinned to v3. UUIDv7 PKs app-side (`uuidv7` pkg); `citext` + `bytea` via Drizzle customType.
**Last spec update:** v1.1 (2026-05-27) — added Data room (§5.26).
**Next action:** Test magic-link sign-in end-to-end (user clicks email link) and visually verify the authenticated `/cap-table` screen; then Prompt 5. Deploy Week-1 build to Vercel.

When you complete a phase, update this status. When you ship to beta, this section becomes a release log.
