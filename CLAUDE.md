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

**Phase:** Weeks 3–4 complete — Prompt 10 (deploy + Sentry) shipped. Prompt 8 (basic Simulator, `e241ab0`) + Prompt 9 (AI onboarding helper, `e7053b9`) done. Prompt 7 (Norway/UK/US country packs, `22daf79`). Week 2: Prompt 5 (bulk add + Stakeholders, `c40b61f`) + Prompt 6 (Denmark pack, `96e0b85`). Scaffold (Prompt 1) + full schema (Prompts 2/4) + magic-link auth (Prompt 3) + cap-table view (Prompt 4) complete. **Week 5 (stakeholder magic-link claim flow + portal) is next.**

**Prompt 10 (done):** Sentry wired (`@sentry/nextjs`) — `sentry.server.config.ts` / `sentry.edge.config.ts` / `instrumentation-client.ts` (all DSN-gated: `enabled: Boolean(process.env.SENTRY_DSN)` so empty-DSN envs are no-ops), `instrumentation.ts` (`register()` loads the runtime config + `onRequestError = captureRequestError`), `app/global-error.tsx` (client error boundary → `captureException`), `next.config.ts` wrapped with `withSentryConfig` (org/project from env; source-map upload auto-skipped without `SENTRY_AUTH_TOKEN`). **pnpm 11 gotcha:** the Sentry installer wrote `pnpm-workspace.yaml` with `allowBuilds: { '@sentry/cli': "set this to true or false" }` — that placeholder string makes `pnpm run <script>`'s pre-run deps check fail with `ERR_PNPM_IGNORED_BUILDS` (exit 1). Fixed by setting `'@sentry/cli': false` (we skip the optional CLI binary; it's only for source-map upload, which needs an auth token we don't set). The `pnpm` field in `package.json` is no longer read by pnpm 11 — settings live in `pnpm-workspace.yaml`. **User TODO before Sentry/AI go live in prod:** set Vercel env vars `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` (+ optional `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN`), `ANTHROPIC_API_KEY`, `RESEND_API_KEY`. Custom domain freecapt.com DNS still user-side (currently live at freecapt.vercel.app).

**Prompt 9 (done):** AI onboarding helper + Claude. `lib/ai/claude.ts` (lazy Anthropic client, model `claude-sonnet-4-6`, `isClaudeConfigured()`), `lib/ai/prompts.ts` (`SYSTEM_ONBOARDING` / `SYSTEM_EXTRACT_CAP_TABLE` / `SYSTEM_EXPLAIN`, FreeCapT voice), `lib/ai/extract.ts` (zod `extractionSchema` + `toBulkRow` mapping, shared by route + client). `app/api/ai/chat` (streaming onboarding chat via Vercel AI SDK `streamText` + `@ai-sdk/anthropic`; `convertToModelMessages` is **async in AI SDK v6 — must `await`**), `app/api/ai/extract` (`generateObject` → structured rows; **free ONE time per account** via `accounts.has_used_ai_onboarding`, a spent free use returns 402 → paywall). `components/freecapt/ai-helper-panel.tsx` (420px right drawer, `useChat` from `@ai-sdk/react`) mounted app-wide via `ai-helper-launcher.tsx` (floating button in `(app)/layout.tsx`). Bulk-add "Type it out" tab now calls the extractor → editable grid + "AI assumptions" review note. Migration `0003` adds `accounts.has_used_ai_onboarding`. **All inference server-side; ANTHROPIC_API_KEY never reaches the client.** Build/tsc/lint green; live extraction blocked until the key is set.

**Prompt 8 (done):** Basic single-round simulator. `lib/simulate/engine.ts` (pure/deterministic; with no SAFE/top-up reduces exactly to the spec formula — verified $2M@$10M-pre → new investor 16.67%, founders −16.67%, sums to 100%; SAFEs auto-convert at min(cap price, discount price) on pre-round FD shares; closed-form pool top-up). `components/freecapt/scenario-view.tsx` (pure read-only before/after cap tables + donuts + per-stakeholder dilution column, red for negative — shared by client + share page). `app/(app)/simulate` (server page loads live cap table → client UI with "Basic round" live + "Round modeling" Paid stub). `app/share/[token]/page.tsx` (public read-only link, outside the auth wall, renders a frozen snapshot). `scenarios` table (RLS-enabled, migration `0002`) + `saveScenario` action. "Simulate" added to app nav.

**Prompt 7 (done):** `lib/packs/no/pack.ts` — NO AS/ASA: Organisasjonsnummer mod-11 (weights 3,2,7,6,5,4,3,2; valid example `974760673`), 30k/1M NOK aksjekapital minimums, instruments (aksjer, opsjoner, tegningsretter, konvertibelt lån, tildelte aksjer), live **opsjonsskatteordningen** validator (company age<10/employees<50/balance<80M/revenue<80M/qualifying industry + per-employee 3M & company 60M caps + ≥25h/week & ≥12mo + Skatteetaten 1-month notice). `lib/packs/uk/pack.ts` — UK Ltd: Companies House number `/^([A-Z]{2})?\d{6,8}$/` (SC/NI prefixes), no min capital (100 ordinary × £0.01 default), instruments (ordinary shares, EMI options, unapproved options, ASA), live **EMI** validator (gross assets<£30M/FTE<250/qualifying trade/independent + per-employee £250k & company £3M caps + ≥25h or ≥75% time + HMRC valuation ≤90d + 92-day notice). `lib/packs/us/pack.ts` — **expanded** to full Delaware C-corp + LLC: C-corp (common_stock, iso, nso, rsa, safe) + LLC (membership_units, profits_interests, unit_options, convertible_note); equity-unit noun swaps Common stock↔Membership units by entity type; one favorable-treatment validator dispatched by instrument — ISO ($100k first-year limit + strike≥FMV + employee-only), profits interests (hurdle=FMV, Rev. Proc. 93-27 + 83(b)/safe-harbor), RSA (§83(b) 30-day deadline, exported `SECTION_83B_DEADLINE_DAYS`). `types.ts` gained `ValidationResult` + `toValidationResult()` (the typed `{ok}|{ok:false,errors,warnings}` result) and optional company/employee fields on `TaxSchemeInput`. `loader.ts` registers `no-as`/`no-asa`/`uk-ltd`/`us-de-llc` and adds all four packs to `AVAILABLE_PACKS` (switcher now lists 7 entity types). Verified: tsc + build green, registry/capital/eligibility validators exercised (pass + fail) for all packs, labels resolve across every entity type. **Note:** `securityLabel()` still maps any `equity_unit` to the pack's equity-unit noun, so RSA→"Common stock" and profits_interests→"Membership units" (no seed issues those; revisit when transactions UI needs the instrument-specific label).

**Prompt 6 (done):** The country-pack pattern + first pack. `lib/packs/_shared/types.ts` (the `CountryPack` contract — entity types, instrument catalog, registry-id format with checksum, tax scheme, pure validators), `lib/packs/_shared/loader.ts` (`getPackForCompany`/`getPackByEntityType` registry + generic fallback for not-yet-built packs, `securityLabel()` — the single chokepoint where the equity-unit noun swaps shares↔anparter↔aktier and instruments resolve to local names, `AVAILABLE_PACKS` for the switcher). `lib/packs/dk/pack.ts` — full DK pack: ApS + A/S, instruments (anparter, aktier, tegningsoptioner, warranter, differenceaktier, konvertibelt gældsbrev), DKK, 40k/400k DKK capital minimums, CVR-nr mod-11 checksum (weights 2,7,6,5,4,3,2,1; valid example `12345674`), 30-day future-date rule, and a live **Ligningsloven § 7P** eligibility validator (employee + eligible instrument + ≤10%/20%-of-salary cap + opt-in). `lib/packs/us/pack.ts` — minimal Delaware C-corp pack so the seeded Acme keeps "Common stock" labels. Cap-table + stakeholders label instruments via the pack; the authorized-units banner uses the pack noun. **Seed is parametrized**: `pnpm db:seed` = Acme Inc. (US), `pnpm db:seed dk` = Acme ApS (DKK/anparter/tegningsoptioner/differenceaktier/konvertibelt). `getActiveCompany()` now resolves the most-recent active company named "Acme" (so the DK seed becomes active). `/settings` has a shadcn-`select` jurisdiction switcher + `updateCompanyJurisdiction` server action (updates jurisdiction/entityType/currency/packVersion); "Settings" added to the app nav. Verified live: seeding DK swaps every label across cap-table/stakeholders/settings to Danish, then `pnpm db:seed` restores US. Document templates intentionally deferred to Prompt 9. **Note:** a stray inactive "Acme ApS" row may linger in the DB after DK-seed experiments — harmless (US is newest → active); `pnpm db:seed dk` refreshes it in place.

**Prompt 5 (done):** `lib/bulk-add/parse.ts` (pure paste/validate helpers — header auto-detect, type/security aliasing, amount/date/vesting parsing, per-row validation; client+server safe), `app/(app)/stakeholders/actions.ts` (`createStakeholdersBulk` server action: one stakeholder + security + issuance transaction per valid row in a single `db.transaction`, then revalidates /stakeholders + /cap-table), `components/freecapt/bulk-add-modal.tsx` (paste textarea → editable validated grid; "Type it out"/"Upload" tabs gated behind the §6.6 paywall), `app/(app)/stakeholders/{page,stakeholders-client}.tsx` (server page computes holdings + fully-diluted %; client renders table + empty-state CTAs + paywall dialog), `lib/cap-table/display.ts` (shared colors/labels/formatters now consumed by both cap-table and stakeholders), app nav (Cap table / Stakeholders) + mounted sonner `Toaster`. Verified: `pnpm build` green, `tsc --noEmit` clean, lint clean (modulo pre-existing tailwind.config `require()` errors), parse pipeline smoke-tested on clean + messy input. **Not yet done:** a live in-browser paste→appears round-trip (would mutate seeded demo data); the write path is type-checked and mirrors the proven seed insert.
**Done:** Next.js 16 (App Router, TS strict + `noUncheckedIndexedAccess`), Tailwind v3 with design tokens (`docs/12_design_system.md` §2–3), Inter + JetBrains Mono via next/font, shadcn/ui (New York / slate) with FreeCapT button/input/badge overrides (§5), repo dir structure, coming-soon marketing page. Drizzle ORM wired to Supabase (`lib/db/index.ts`, `schema.ts`); **all ten tables** live in the EU project per `docs/05_data_model.md` §2.1–2.10 (accounts, companies, memberships, stakeholders, securities, transactions, documents, audit_events, subscriptions, vesting_schedules). Magic-link auth via `@supabase/ssr`: `lib/auth/supabase-{browser,server}.ts`, `proxy.ts` (session refresh), `/sign-in` (§6.8 card), `/api/auth/callback` (exchange + upsert accounts row), `(app)/layout.tsx` auth wall. **Cap-table view** (`/cap-table`): server component computes ownership from seeded data; client renders pure-CSS donut (`components/freecapt/cap-table-donut.tsx`), §5.4 compact table, emerald "X% left to grant" banner, Outstanding/Fully-diluted toggle, export dropdown (CSV real + client-side; PDF/Word/Excel gated behind §6.6 paywall modal). Seed (`lib/db/seed.ts`, `pnpm db:seed`): Acme Inc. — 3 founders common, 2 employees ISO, 1 advisor NSO, 1 SAFE investor ($250k @ $5M cap), 10M authorized ⇒ 6% pool unallocated. Auth wall verified (unauth `/cap-table` → 307 `/sign-in`). `pnpm build` green.
**Supabase:** project `freecapt` (ref `ucvjnhpytdwbbfoaxgzm`), region `eu-central-1`. URL + anon key (`sb_publishable_…`) in `.env.local`. `SUPABASE_SERVICE_ROLE_KEY` holds a **new-format secret key** (`sb_secret_…`) — the original legacy `service_role` JWT was rotated out (user to disable the legacy JWT in dashboard → API Keys → Legacy). `DATABASE_URL` uses the **session pooler** (`aws-1-eu-central-1.pooler.supabase.com:5432`, user `postgres.<ref>`) — direct `db.<ref>` host is IPv6-only and fails locally. **Email templates** (Magic Link + Confirm signup) updated to link `{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=email` so real emails use the robust `verifyOtp` flow (not PKCE `?code=`). `RESEND_API_KEY` still empty (Supabase built-in email, rate-limited). RLS is **enabled** (deny-by-default) on all ten tables — closes the anon REST surface; Drizzle owner role unaffected. Tenant policies (§3) still TODO when reads route through the authenticated role.
**Migration workflow:** `pnpm db:generate` produces SQL offline; apply via the Supabase MCP `apply_migration` (no local DB password). `db:migrate` is bypassed for now. `citext` extension created in migration 0000; RLS enabled via a separate MCP migration (tracked in Supabase history, not the drizzle journal).
**Stack notes:** Next 15→16 (current stable; uses `proxy.ts` not `middleware.ts`). Tailwind pinned to v3. UUIDv7 PKs app-side (`uuidv7` pkg); `citext` + `bytea` via Drizzle customType.
**Last spec update:** v1.1 (2026-05-27) — added Data room (§5.26).
**Deployed:** live at **https://freecapt.vercel.app** (Vercel project on a personal account scope, not the MCP-connected team — harmless). Verified in prod: landing 200, `/sign-in` 200, `/cap-table` 307→sign-in when unauth, and a real `verifyOtp` sign-in renders the seeded Acme cap table (DATABASE_URL session pooler reachable from Vercel, secret key authenticates). 4 env vars set in Vercel. Note: a stray `nr-del/freecapt-vercel` GitHub repo was created during a template-import misstep — safe to delete; the real repo is `nr-del/freecapt`.

**Next action:** Start **Prompt 8 — Basic Simulator** (`app/(app)/simulate/page.tsx`): single priced round (Free) + round-modeling stub (Paid); inputs round size / pre-money / pool top-up %; before/after cap table + donuts; auto-convert SAFEs; per-stakeholder dilution column (red for negative). Add a `scenarios` table + shareable read-only `share_token` link. Math: post = pre + round; new investor % = round/post; existing dilution = old% × pre/post. Then Prompt 9 (AI helper — **blocked on empty `ANTHROPIC_API_KEY`, build-only**) and Prompt 10 (deploy/Sentry/domain). **All user-side setup is done:** Supabase Site URL set + prod sign-in works; legacy `service_role` JWT disabled; stray `nr-del/freecapt-vercel` repo deleted.

**Landing page (done, `8fd0be7`):** the public root `/` is now the full marketing landing page — a faithful React/Tailwind port of `docs/08_landing_page.html` (sticky nav, hero with the cap-table preview card reusing `CapTableDonut`, three value props, seven country packs, six product screens, Free/Paid pricing, six security cards, eight-item FAQ accordion via native `<details>`, final CTA, footer). Server component; every CTA links to `/sign-in`. Added a `.grid-bg` utility to `globals.css` for the hero backdrop. The product (`/cap-table`, `/stakeholders`, etc.) still lives behind the magic-link auth wall and is intentionally NOT linked from the landing page. `/login` + `/signin` permanently redirect to `/sign-in`.

**Magic-link email (DONE, user-side, 2026-05-30):** custom Resend SMTP is configured in Supabase → Auth (Host `smtp.resend.com`, Port 465, User `resend`, Password = `RESEND_API_KEY`, sender `noreply@freecapt.com`) and the email rate limit is raised. Supabase Auth Site URL is `https://freecapt.com` with `https://freecapt.com/**` in the Redirect URLs allowlist. A **new `RESEND_API_KEY` was rotated in** and is set in both Supabase (SMTP password) and Vercel (env var) — if any code reads it, use the Vercel value; the old key is dead. The `/sign-in` page surfaces auth errors in a visible alert (`friendlyAuthError`). The earlier `429 over_email_send_rate_limit` from the built-in `noreply@mail.app.supabase.io` sender is resolved by the custom SMTP.

**Mobile + full i18n (done, this batch):** (1) The whole marketing site is mobile-optimized (`43481d8`). (2) **Localization** via `next-intl` 4.13 with URL-prefixed locales — English at `/` (un-prefixed), the rest at `/da`, `/no`, `/sv`, `/de` (`localePrefix: "as-needed"`, `defaultLocale: "en"`). Structure committed at `ce5167b`; marketing pages/components moved under `app/[locale]/` and rewired to next-intl (`getTranslations` + `setRequestLocale` in async pages, `useTranslations` in client components, `t.raw` for arrays, `t.rich` with `<studio>`/`<strong>`/`<link>`/`<email>` tags). All copy — including legal (privacy/terms) — is translated in `messages/{en,da,no,sv,de}.json` (en is the source of truth, 642 lines). `i18n/metadata.ts` `alternatesFor()` emits per-locale canonical + hreflang; `app/sitemap.ts` emits one entry per locale per route with `alternates.languages` + `x-default`. `components/marketing/language-switcher.tsx` swaps the locale prefix while keeping the current path (`useRouter().replace(pathname, { locale })`). next-intl THROWS on a missing message, so all five message files must stay structurally in sync. **Build verified green across all five locales (no `MISSING_MESSAGE`).** The product (`/cap-table`, `/stakeholders`, …), `/share`, and `/api` stay non-localized behind the auth wall; `/sign-in` IS localized but its card copy is intentionally left English for now. **Ready to push:** the mobile commit + all i18n commits deploy together in one `git push origin main`.

When you complete a phase, update this status. When you ship to beta, this section becomes a release log.
