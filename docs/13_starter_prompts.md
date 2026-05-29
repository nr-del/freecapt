# FreeCapT — Starter prompts for Claude Code

**Use:** Copy these prompts into your first Claude Code sessions, in order. Each gets you a concrete, deployable milestone. Don't skip ahead — earlier prompts establish patterns later ones depend on.

**Prerequisites:** Phase 0 of `11_kickoff.md` is complete (GitHub repo exists, Supabase EU project exists, Vercel project exists, Anthropic API key exists, Resend account exists with `freecapt.com` verified).

**Before each session:** open Claude Code in the repo (`cd ~/projects/freecapt && claude`). Make sure `CLAUDE.md` and `docs/` are in the repo root.

---

## Right Now — 15-minute setup before your first Claude Code prompt

```bash
# 1. Clone the (empty) GitHub repo locally
gh repo clone freecapt/freecapt
cd freecapt

# 2. Copy the spec docs into a docs/ folder
mkdir docs
cp /path/to/Build\ a\ carta\ killer/*.md docs/
cp /path/to/Build\ a\ carta\ killer/02_wireframes.html docs/
cp /path/to/Build\ a\ carta\ killer/08_landing_page.html docs/

# 3. Move CLAUDE.md to the repo root
mv docs/CLAUDE.md .

# 4. Initial commit
git add .
git commit -m "Initial docs"
git push

# 5. Start Claude Code
claude
```

That's it. Now you're ready for prompt #1.

---

## Prompt 1 — Project scaffold (Week 1, Day 1)

```
Read CLAUDE.md, then read docs/09_tech_stack.md and docs/12_design_system.md.

Scaffold a fresh Next.js 15 project (App Router, TypeScript strict, Tailwind CSS).
Use pnpm. Set up:

1. Next.js 15 with App Router, TypeScript strict mode
2. Tailwind CSS configured per docs/12_design_system.md §3 (drop in the
   tailwind.config.ts from that doc verbatim)
3. CSS variables from docs/12_design_system.md §2.1 in app/globals.css
4. Inter + JetBrains Mono from Google Fonts via next/font
5. shadcn/ui initialized (use 'New York' style, slate as base color)
6. Install shadcn/ui components: button, input, label, dialog, card, badge,
   table, tabs, dropdown-menu, separator, toast (use sonner)
7. Create the directory structure from CLAUDE.md (app/(marketing),
   app/(app), app/(portal), app/(admin), components/ui, components/freecapt,
   lib/db, lib/auth, lib/packs, lib/ai, lib/exports, lib/i18n, lib/fx,
   emails, inngest)
8. .gitignore for Next.js + .env*
9. Basic README.md (one-liner describing FreeCapT)

Then create a placeholder landing page at app/(marketing)/page.tsx that
displays "FreeCapT — coming soon" using the brand wordmark style from
docs/07_brand_package.md §1.

Commit when done with message "Initial project scaffold".
```

---

## Prompt 2 — Connect Supabase + database schema (Week 1, Day 2)

```
Read docs/05_data_model.md.

I have a Supabase project at [paste your project URL].
The connection string is in DATABASE_URL (already in .env.local — don't
print it back).

Set up Drizzle ORM with Supabase:

1. Install drizzle-orm, drizzle-kit, pg, @supabase/supabase-js, and dotenv
2. Create lib/db/index.ts with the Drizzle client connecting to DATABASE_URL
3. Create lib/db/schema.ts with the FIRST FOUR tables only:
   - accounts (§2.1)
   - companies (§2.2)
   - memberships (§2.3)
   - stakeholders (§2.4)
4. Use the column types from docs/05_data_model.md §1 conventions
   exactly (uuidv7, citext, numeric(20,4) for money, char(3) for currency,
   timestamptz, soft delete via deleted_at, etc.)
5. Set up Drizzle migrations: create drizzle.config.ts, scripts in
   package.json for `db:generate` and `db:migrate`
6. Generate the initial migration and run it
7. Verify tables exist by querying Supabase

Don't add securities, transactions, documents, or audit_events yet —
we'll add those after the core tables work.

When done, commit "Initial schema: accounts, companies, memberships, stakeholders".
```

---

## Prompt 3 — Supabase Auth with magic link (Week 1, Day 3)

```
Read docs/05_data_model.md §2.1 (accounts table) and CLAUDE.md (auth rules).

Wire up Supabase Auth as magic-link only:

1. In the Supabase dashboard (I'll do this manually): disable email/password
   sign-up; enable email magic links only. Confirm with me before
   continuing if you need me to.
2. Install @supabase/ssr (Server-Side Rendering helpers)
3. Create lib/auth/supabase.ts: createServerClient and createBrowserClient
   helpers following the @supabase/ssr docs
4. Create app/(marketing)/sign-in/page.tsx: a single magic-link form
   using the pattern from docs/12_design_system.md §6.8
5. Create app/api/auth/callback/route.ts: the magic-link callback that
   exchanges the token for a session, ensures an accounts row exists for
   this email (using the schema from prompt 2), and redirects to /cap-table
6. Create app/(app)/layout.tsx: a server-side auth wall that redirects
   to /sign-in if no session exists
7. Add a placeholder app/(app)/cap-table/page.tsx: just shows "Welcome
   to FreeCapT, {email}" using the brand wordmark
8. Set up Resend for sending the magic-link emails (read the Resend env
   key from RESEND_API_KEY)

Constraint: read docs/12_design_system.md §6.8 for the auth card pattern;
read §10 for the do/don't rules.

Test: sign in with your own email, verify you receive a magic link, click
it, end up at /cap-table.

Commit "Magic-link auth + auth wall".
```

---

## Prompt 4 — First Cap Table screen with seed data (Week 2, Day 1)

```
Read docs/05_data_model.md fully (we're now using securities + transactions),
docs/01_mvp_scope.md §5.2 (Cap Table view), and docs/02_wireframes.html
(Cap Table screen visual reference).

1. Add the remaining schema tables to lib/db/schema.ts:
   - securities (§2.5)
   - transactions (§2.6)
   - documents (§2.7)
   - audit_events (§2.8)
   - subscriptions (§2.9)
   - vesting_schedules (§2.10)
2. Generate + run migration
3. Create a seed script (lib/db/seed.ts) that creates the "Acme" demo
   company from the wireframes:
   - 3 founders (Anna, Ben, Chris) with common stock
   - 2 employees (Dana, Erik) with ISO grants
   - 1 SAFE investor (Frank, $250k @ $5M cap)
   - 1 advisor (Grace) with NSO grant
4. Build app/(app)/cap-table/page.tsx using the seeded data:
   - Donut chart (use components/freecapt/cap-table-donut.tsx per
     docs/12_design_system.md §6.1)
   - Cap table data table (compact density per §7)
   - "You have X% left to grant" emerald banner (matching wireframe)
   - Outstanding / Fully-diluted toggle (visual only for now)
   - Currency display (USD for now; real multi-currency next)
   - Export dropdown (CSV implemented; PDF/Word/Excel show "Paid" badge,
     trigger upgrade modal stub)

Use the table pattern from docs/12_design_system.md §5.4.
Use stakeholder swatches per §6.2.
Use badges per §5.3.

Test: navigate to /cap-table after signing in, see the Acme demo cap table.

Commit "Cap table view with seeded Acme demo".
```

---

## Prompt 5 — Bulk add (paste mode) and Stakeholders screen (Week 2, Day 3)

```
Read docs/01_mvp_scope.md §5.15 (Bulk stakeholder add) and §5.7 (which
mentions stakeholder add flow).

1. Build app/(app)/stakeholders/page.tsx with:
   - The stakeholders table (compact density)
   - Primary CTA: "Bulk add stakeholders" (emerald)
   - Secondary CTA: "+ Add one"
   - Empty state when no stakeholders (use the 3-CTA empty state pattern
     from docs/12_design_system.md §6.9)
2. Build components/freecapt/bulk-add-modal.tsx:
   - Three tabs: "Paste from spreadsheet" (Free), "Type it out" (Paid
     stub), "Upload documents" (Paid stub)
   - For v1, implement the Paste tab only:
     - Editable grid (use a simple table with <input> per cell)
     - Auto-detect columns: name, email, type, security, quantity, date,
       vesting
     - Inline validation: red border on invalid cells
     - Bottom CTA: "Create N stakeholders & M transactions"
   - For Type it out + Upload, show the upgrade modal (per §6.6)
3. Wire up the form submission: create stakeholder + security +
   transaction rows in one Drizzle transaction. Compute ownership %
   automatically.
4. After successful bulk add, return to /cap-table — show the updated
   cap table with the new stakeholders.

Test: from an empty cap table, paste a 3-row spreadsheet, verify the
3 stakeholders appear in /stakeholders and the cap table donut updates.

Commit "Bulk add (paste mode) + Stakeholders screen".
```

---

## Prompt 6 — First country pack (Denmark) (Week 2, Day 5)

```
Read docs/03_country_packs_dk_no.md §2 (Denmark pack) and docs/01_mvp_scope.md
§5.11 (country packs).

1. Create lib/packs/_shared/types.ts with the CountryPack TypeScript type
   based on the schema in docs/03_country_packs_dk_no.md §1
2. Create lib/packs/_shared/loader.ts: getPackForCompany(company)
3. Create lib/packs/dk/pack.ts: the full DK ApS pack:
   - jurisdiction code: 'dk-aps'
   - entity types: ApS + A/S
   - instrument catalog: anparter, tegningsoptioner, warrants,
     konvertibelt gældsbrev, differenceaktier
   - currency: DKK
   - capital minimum: 40,000 DKK
   - validation rules (per §2.5)
   - § 7P eligibility validator (per §2.4)
4. Make the cap table label aware:
   - When company.jurisdiction = 'dk-aps', show "anparter" instead of "shares"
   - Update the demo seed to allow creating an Acme ApS variant
5. Add a jurisdiction switcher in /settings (basic for now, just a
   select that updates company.jurisdiction)
6. Verify labels update across cap table + stakeholders + transactions
   when jurisdiction changes

Don't ship document templates yet — that's prompt 9.

Commit "Denmark country pack: instrument catalog + label swap".
```

---

## Prompt 7 — Norway, UK, US country packs (Week 3, Day 1)

```
Read docs/03_country_packs_dk_no.md §3 (Norway) and docs/04_country_packs_uk_us.md
fully.

Following the same pattern as lib/packs/dk/pack.ts (from prompt 6):

1. Create lib/packs/no/pack.ts (Norway AS + ASA):
   - Aksjer, Opsjoner (with opsjonsskatteordningen eligibility validator),
     Tegningsretter, Konvertibelt lån
   - Aksjekapital minimum 30,000 NOK
2. Create lib/packs/uk/pack.ts (UK Ltd.):
   - Ordinary shares, EMI options (with full eligibility validator),
     Unapproved options, ASA (SEIS/EIS-compliant default)
   - No min capital
3. Create lib/packs/us/pack.ts (US Delaware C-Corp + LLC):
   - C-Corp: Common stock, ISO (with $100k limit), NSO, RSA, SAFE
   - LLC: Membership units, Profits interests (with hurdle = FMV
     validator), Options on units, Convertible notes
   - 83(b) deadline tracker as a metadata flag on relevant grants

For each pack, the validator functions should return a typed result:
{ ok: true } | { ok: false, errors: string[], warnings: string[] }.

Test: switch a test company between jurisdictions, verify labels and
instrument options swap correctly. Verify a tax-scheme grant fails when
eligibility doesn't hold.

Commit "Norway, UK, US country packs".
```

---

## Prompt 8 — Simulator (basic round mode) (Week 3, Day 3)

```
Read docs/01_mvp_scope.md §5.5 (Simulator).

1. Build app/(app)/simulate/page.tsx with two tabs:
   - "Basic round" (Free) — implement this now
   - "Round modeling" (Paid) — show upgrade modal stub
2. Basic round mode:
   - Inputs panel: round size, pre-money valuation, pool top-up % (optional)
   - Display current cap table (left)
   - Display post-round cap table (right)
   - Auto-convert any outstanding SAFEs
   - Per-stakeholder dilution column (with color: red for negative)
3. Save scenario: stores to a scenarios table (we'll add it to schema
   if not present)
4. Shareable read-only link (use a random share_token)

Math reference: post-money = pre-money + round_size; new investor % =
round_size / post-money; existing dilution = old_% × pre-money / post-money.

Use the donut component from §6.1 for both before/after views.

Test: simulate raising $2M at $10M pre-money. Verify dilution math is
correct (founders should each drop by ~16.7% relative to original).

Commit "Basic simulator (single round)".
```

---

## Prompt 9 — AI onboarding helper + Claude integration (Week 4, Day 1)

```
Read docs/01_mvp_scope.md §5.1 (Founder onboarding) and §5.15 (Bulk add).

Wire up Anthropic Claude for the AI onboarding helper:

1. Install @anthropic-ai/sdk and ai (Vercel AI SDK)
2. Create lib/ai/claude.ts: a configured Anthropic client (use
   ANTHROPIC_API_KEY env var). Use claude-sonnet-4-6 by default.
3. Create lib/ai/prompts.ts with three named prompts:
   - SYSTEM_ONBOARDING: the system prompt for the helper (warm, plainspoken,
     follows the FreeCapT voice from docs/07_brand_package.md §4)
   - SYSTEM_EXTRACT_CAP_TABLE: extracts structured cap table from text
     or document (returns JSON matching our schema)
   - SYSTEM_EXPLAIN: plain-English explanation of a number/concept
4. Build components/freecapt/ai-helper-panel.tsx as a right-side drawer
   (420px wide on desktop) per docs/12_design_system.md §6.7
5. Wire up the bulk-add modal's "Type it out" tab:
   - User pastes free text ("Anna and Ben are cofounders at 30% each...")
   - Stream the structured extraction back via Vercel AI SDK
   - Show the parsed result in the same editable grid as the Paste tab
6. AI onboarding is free ONE-TIME per account. Track via
   accounts.has_used_ai_onboarding boolean.

Important: per CLAUDE.md, run Claude calls server-side (Vercel function
routes), never expose ANTHROPIC_API_KEY to the client.

Test: in bulk-add Type it out mode, paste "Anna 30%, Ben 30%, Chris 18%,
Dana has 200k options". Verify Claude returns a structured 4-stakeholder
draft you can edit.

Commit "AI onboarding helper + Type it out bulk add".
```

---

## Prompt 10 — Deploy to Vercel and end Week 4

```
You've now completed roughly Week 1–4 of the build plan in docs/11_kickoff.md.

1. Set up the Vercel project:
   - Connect to the GitHub repo
   - Set up environment variables: DATABASE_URL, SUPABASE_URL,
     SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY,
     RESEND_API_KEY
   - Configure custom domain freecapt.com (point Cloudflare/registrar DNS
     at Vercel)
2. Push to main, verify the production build succeeds
3. Visit freecapt.com — verify sign-in works, magic link arrives, you
   can sign in and see the Acme demo cap table
4. Set up Sentry for error tracking (install @sentry/nextjs, run the
   wizard, configure for both client and server)

You now have a deployable v0.1 of FreeCapT live on its own domain. From
here, the build plan in docs/11_kickoff.md guides you through weeks 5+:
stakeholder magic-link claim flow, members + invitations, then Data
room + legal-grade exports in week 7-8, etc.

This is also the right moment to send your friendly-beta-list (the 10-20
founders from your customer interviews) a link with a "first look —
would love feedback" message. They are the most leveraged users you'll
ever ship to, because their feedback shapes weeks 5-16.

Commit "Production deployment to freecapt.com".
```

---

## Pattern for subsequent prompts (weeks 5+)

After prompt 10, fall into a steady pattern:

1. **Open Claude Code in the repo.**
2. **Reference the spec doc + section** for what you're building this session.
3. **Pin the design system rules** by referencing docs/12_design_system.md.
4. **Build one screen or one feature per session** — don't try to build a week's worth in one prompt.
5. **Test in production after every merge** — your beta users are watching.
6. **Update CLAUDE.md "Current build status"** at the end of each week so future sessions know where you are.

Example prompts for weeks 5+:

```
Per docs/01_mvp_scope.md §5.7 and §5.24, build the stakeholder magic-link
claim flow. When a grant is issued, an invite email is sent (via Resend).
The recipient clicks the link, gets signed in via Supabase Auth, and
lands on /portal which shows their grant. Implement email deduplication
per §5.24 — if the email already has an Account, link to it; don't create
a new one.

UI patterns: stakeholder portal layout per docs/02_wireframes.html
(Stakeholder single-company view) and docs/12_design_system.md §6.8 for
the auth card.

Constraint: don't show the company-wide cap table. Only this stakeholder's
own slice. Privacy is absolute per §5.23.

Commit "Stakeholder portal: claim flow + grant view + portfolio dashboard".
```

```
Per docs/01_mvp_scope.md §5.26 (Data room), build the data room screen.
Folder structure per the canonical 9 folders + jurisdiction-aware
additions (10th folder for DE/CH notary docs). Each canonical slot per
the country pack's document_templates list (see lib/packs/{dk,no,...}/
templates lists).

Layout: folder tree on the left, slot list on the right, per
docs/02_wireframes.html (Data room view). Use the slot states pattern
from docs/12_design_system.md §6.5.

Add-doc modal: two paths (generate from template / upload existing) per
docs/12_design_system.md §6.6 paywall pattern when Paid features are
hit.

Don't implement template generation yet — that's the next session.
Just upload existing and mark canonical slots.

Commit "Data room: folder structure + slot system + upload".
```

---

## When to come back to Cowork (this chat)

After Claude Code work, come back here for:

- **Customer interview synthesis** — dump notes from calls, I'll update the scope.
- **Spec adjustments** — when 3+ customers say the same thing.
- **Marketing copy** — landing page revisions, FAQ additions, country-specific landing pages.
- **High-level strategy** — pricing pivots, positioning shifts, "should I expand to X or Y" decisions.
- **Brand iterations** — brand package updates, tone calibrations.

Don't come back here for:
- Day-to-day code questions (Claude Code is faster)
- Stack trace debugging (Claude Code has the codebase)
- "Why isn't my migration working" (Claude Code can run it)

---

## Final note

You're 16 weeks from closed beta. The scope is locked. The tools are connected. The design system is documented. The first 10 prompts are ready.

**Go.**
