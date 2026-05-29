# FreeCapT — tech stack decision (v1.0)

**Date:** 2026-05-27
**Audience:** Nicolai (solo founder, building this himself), future engineers
**Status:** Decision, not exploration. Every layer below is a pick, not an option. Where alternatives matter, they're documented. Where they don't, they aren't.

The driving constraint: **a solo founder ships software the same way they ship deals — by reducing the number of decisions, the number of moving parts, and the number of failure modes.** Every choice below optimizes for that.

---

## 1. The headline stack

| Layer | Pick | Why in one line |
|---|---|---|
| Language | **TypeScript** (strict) | One language across stack, biggest hiring pool when team grows |
| Framework | **Next.js 15 (App Router)** | Marketing + product + admin in one codebase; mature server actions |
| Runtime | **Node.js 22 LTS** | Boring, stable, well-supported on every host |
| Database | **Postgres 16+** | Locked in `05_data_model.md`. Row-level security, JSONB, mature. |
| ORM / query layer | **Drizzle ORM** | Type-safe, closer to SQL than Prisma, better RLS support |
| Database host | **Neon** (EU + US regions) | Serverless Postgres, branching for dev, native EU/Frankfurt + US-East |
| Auth | **Lucia v3** + custom magic-link flow | Server-side sessions, no opaque vendor, perfect for magic-link only |
| Email | **Resend** | React Email templates, EU-residency option, low cost |
| AI | **Anthropic SDK** + **Vercel AI SDK** | Native Claude support; AI SDK for streaming UX |
| Background jobs | **Inngest** | Type-safe, durable, no Redis to babysit, free tier covers v1 |
| File storage | **Cloudflare R2** | S3-compatible, no egress fees, cheap, EU region |
| PDF generation | **react-pdf** + **Puppeteer** fallback | Deterministic for legal docs; Puppeteer when we need HTML→PDF |
| Word generation | **`docx`** npm package | Standard, well-maintained |
| Excel generation | **`exceljs`** | Multi-sheet, formulas, embedded charts |
| i18n | **next-intl** | Best Next.js integration; ICU MessageFormat for plurals/genders |
| Validation | **Zod** | Universal — form schemas, API contracts, DB-output parsing |
| Forms | **react-hook-form** + Zod | Standard combo, low-overhead |
| UI components | **shadcn/ui** + **Tailwind CSS** | Already in wireframes; copy-paste components, no vendor lock |
| Icons | **Lucide React** | Already chosen in brand package |
| Charts | **Recharts** | Mature React-native; cap table donut + simulator visualizations |
| Hosting | **Fly.io** (EU + US regions) | Per-region deploys, Postgres-proximity, predictable pricing |
| Payments | **Stripe** | Universal; subscriptions, EU + US tax compliance |
| Observability | **Sentry** + **PostHog** + **Axiom** logs | Per `5.19` spec; EU-hosted |
| Domain DNS + CDN | **Cloudflare** | Free tier covers v1; same provider as R2 |
| Secrets | **Doppler** | One-place secret management; encrypted, audited |

That's the whole list. Roughly **18 services and libraries.** Every one is either free or under $50/mo at v1 scale.

---

## 2. The big judgment calls (and why)

### 2.1 Next.js vs alternatives

The alternatives considered, ranked:

- **Next.js 15 (App Router)** ✓ — picked. Marketing + product + admin all in one. Server components keep complexity manageable. Server actions remove the need for a separate API layer in v1. Vendor risk: real (Vercel pushes you toward their platform), but Next.js itself is open-source and runs anywhere.
- **Phoenix LiveView (Elixir)** — *strong* solo-founder option. Real-time built in, single-runtime, minimal JS. Rejected because: (1) Elixir hiring is thin when you're ready to expand; (2) PDF/Word generation in Elixir is rougher than in JS; (3) AI SDK ecosystem is TS-first.
- **Rails 8** — historically great for solo founders, ships with auth/queues/storage. Rejected because: (1) the modern frontend story is Hotwire-or-React-with-Vite, both compromises; (2) hiring talent is shrinking; (3) react-pdf and the AI SDK story are TS-native.
- **Remix / React Router 7** — same React stack but more "web-standards" oriented. Rejected because: smaller ecosystem, fewer hosting options that aren't Vercel-equivalent.
- **SvelteKit** — beautifully simple. Rejected because: small ecosystem, smaller hiring pool, less mature for complex SaaS auth + payments + i18n.

**The decision:** TypeScript across the stack lets you context-switch fast as a solo dev. When you hire, the hiring funnel is largest. The Next.js complexity tax is real but containable if you don't reach for every feature on every page.

### 2.2 Drizzle vs Prisma

Both are TS ORMs. The decision split:

- **Drizzle** ✓ — SQL-first, type-safe, lightweight. RLS works because you're writing SQL the way Postgres wants it. Migrations are explicit. Faster runtime.
- **Prisma** — more abstraction, slick UX. RLS support has improved but still feels foreign — you end up writing raw SQL anyway for the policies. Migration model is opinionated.

For a Postgres + RLS-heavy app, Drizzle wins. The data model spec (`05_data_model.md`) maps almost 1:1 to Drizzle schema definitions.

### 2.3 Neon vs alternatives for DB hosting

- **Neon** ✓ — picked. Serverless Postgres with branching (you can branch the DB for every PR, restore-from-snapshot is free, autoscaling). EU region (Frankfurt) + US region (US East). Pricing predictable.
- **Supabase** — bundles auth + storage + Postgres. Rejected because: you'd lock yourself into their auth (which conflicts with the Lucia + magic-link choice); RLS works but the platform has a lot of vendor pull.
- **AWS RDS / Aurora** — most mature but operationally heavy for solo. Picked when you've moved past one-person team.
- **Render Postgres** — fine, but Neon's branching is the killer feature for solo dev.

### 2.4 Lucia vs Clerk vs Auth.js for auth

You're shipping **magic-link only, no passwords** (per scope §5.17). The auth story is simpler than most SaaS.

- **Lucia v3** ✓ — picked. A library, not a service. You own your auth code. Magic-link flow is ~80 lines you understand. Server-side sessions stored in Postgres.
- **Clerk** — slick UX, vendor lock, expensive at scale. Worse: their default flows assume passwords; magic-link as the *only* path is fighting the platform.
- **Auth.js / NextAuth** — venerable but the codebase is genuinely messy. Magic-link works but the abstractions get in the way.
- **Roll your own** — tempting; don't. Lucia is "rolled your own" with the boilerplate hidden.

Magic-link itself: a one-time token, hashed in DB, 15-minute expiry, single-use, optional TOTP layer on top for 2FA users. ~150 lines of code total.

### 2.5 Inngest vs BullMQ vs CRON

Background jobs needed for: scheduled email sends (vest milestones at 08:00 recipient TZ), document generation, AI extraction, ECB FX rate updates, audit-log replication to cold storage.

- **Inngest** ✓ — picked. Type-safe, durable, no Redis to operate, free tier covers v1. The "function as workflow step" model maps cleanly to "send vest email at 8am local time" without writing your own scheduler.
- **BullMQ + Redis** — battle-tested but you operate Redis. For solo, the operational tax isn't worth it.
- **Postgres-based** (pg-boss, river) — fine and self-hosted but you reinvent some of what Inngest gives you free.
- **Vendor cron** — works for simple things; doesn't handle retries, observability, or scheduled-per-user-TZ work.

### 2.6 Fly.io vs Vercel vs Render

For hosting the Next.js app:

- **Fly.io** ✓ — picked. Multi-region (EU + US), predictable per-machine pricing, Postgres-proximity matters for tail latency. Deploys are explicit (not magic). You can run the same image in multiple regions.
- **Vercel** — would be the obvious Next.js choice but: (a) regional Postgres affinity is murkier, (b) pricing scales unpredictably, (c) function-time-limits hit you on PDF generation and AI streams.
- **Render** — good middle ground but no per-region story as clean as Fly.
- **Railway** — fine but smaller ecosystem.
- **AWS / GCP** — solo-founder kryptonite. Wait until you have ops capacity.

### 2.7 PDF generation — react-pdf vs Puppeteer

You're generating legal-grade documents (PDF/A archival, multi-jurisdiction layouts). Two camps:

- **react-pdf** ✓ — picked as primary. Deterministic, no browser, server-renderable, well-suited to template-driven legal docs (ejerbog, Register of Members, capitalization table). You write components.
- **Puppeteer (HTML → PDF)** — fallback for cases where react-pdf's layout primitives aren't enough (complex tables, headers/footers, deep typography). Heavier (full Chromium) but more flexible.

Most templates ship with react-pdf; Puppeteer is a backup for the 10% that need it.

### 2.8 Same codebase for marketing + product + admin

The scope (`5.20`) speced `admin.freecapt.com` as a separate app. **For a solo founder, ignore that.** Put admin under `/admin` in the same Next.js codebase with strict auth/IP guards. Same for marketing pages (`/`, `/pricing`, `/dk`) — they live in the same repo.

**When to split:** when the team is > 5 engineers and the admin app's deploy cadence diverges from the product. Until then, one repo, one deploy.

The architectural cost of merging is near-zero; the operational savings as a solo are real.

---

## 3. Repo and project structure

One monorepo (it's a monolith really, but the term is fashionable):

```
freecapt/
├── app/                          # Next.js app router
│   ├── (marketing)/              # Landing, pricing, /dk, /de — same codebase
│   ├── (app)/                    # Authed product
│   │   ├── cap-table/
│   │   ├── stakeholders/
│   │   ├── transactions/
│   │   ├── simulate/
│   │   ├── documents/
│   │   ├── settings/
│   │   └── layout.tsx            # Auth wall + nav
│   ├── (stakeholder-portal)/     # Different layout, same domain
│   ├── (admin)/                  # /admin — staff only, IP allowlist
│   ├── api/                      # Webhooks (Stripe, Inngest) + small REST
│   └── layout.tsx
├── lib/
│   ├── db/                       # Drizzle schema + migrations
│   ├── auth/                     # Lucia + magic-link
│   ├── packs/                    # Country pack definitions (dk, no, se, de, ch, uk, us)
│   ├── ai/                       # Claude clients, prompts
│   ├── exports/                  # PDF (react-pdf), Excel (exceljs), Word (docx)
│   ├── i18n/                     # next-intl messages
│   └── fx/                       # ECB rate fetcher
├── emails/                       # React Email templates
├── inngest/                      # Background functions
├── public/
└── packages/                     # If/when shared code is needed; not in v1
```

One package.json. One `npm install`. One Fly deploy. One Neon DB (with EU/US replicas).

---

## 4. Country packs as code

The packs deserve a small architectural note since they touch nearly every layer:

```
lib/packs/
├── _shared/
│   ├── types.ts                  # CountryPack type
│   ├── loader.ts                 # Looks up pack by company.entity_type
│   └── validators/               # Shared validators (date, currency, etc.)
├── dk/
│   ├── pack.ts                   # The CountryPack object — entity types, catalog, etc.
│   ├── instruments/              # anparter, tegningsoptioner, ...
│   ├── templates/                # ejerbog.tsx (react-pdf), tegningsoptionsaftale.tsx, ...
│   └── validators/               # § 7P validator, etc.
├── no/                           # Same structure
├── se/
├── de/                           # PLUS: notary workflow handlers
├── ch/
├── uk/
└── us/
```

Adding a new country = adding one folder + a registration line. The pack version is stored on every Transaction (per data model spec) so old grants stay interpreted under their original rules.

---

## 5. Multi-region (EU + US) — the architectural shape

The spec requires EU + US data residency. With this stack:

- **Two Neon projects:** `freecapt-eu` (Frankfurt) and `freecapt-us` (US East). Independent.
- **Two Fly app regions:** `fra` and `iad`. Routing by company's `data_region` column at the *edge* — when a user is signed in, their JWT/session encodes the region; Fly routes to the right machine.
- **Two R2 buckets:** EU and US, with company's documents in the matching region.
- **One shared service:** marketing pages, signup, sign-in form (pre-region-selection). These can run in either region.

**No active-active.** If EU goes down, EU customers can't use the product until EU is back. Acceptable for v1.

**One thing to plan now:** when a user signs up, ask which region. Default to EU for EU-detected IPs, US for US. Make it immutable at company-create. (Already in spec, just flagging for implementation.)

---

## 6. What NOT to do (the bright lines)

These will all be tempting at some point. Don't.

1. **Don't add Redis.** Postgres + Inngest cover every async pattern you need at v1.
2. **Don't add a separate frontend / backend split.** Next.js server actions + server components are enough.
3. **Don't write your own queue.** Inngest handles it.
4. **Don't roll your own email provider.** Resend is fine.
5. **Don't add Kubernetes.** Fly machines are servers, that's enough.
6. **Don't add a service mesh, sidecars, or anything in the YAML-engineering family.** Solo founders die in `helm install` hell.
7. **Don't ship a public API in v1.** API design is a multi-month project. Defer until paying customers ask.
8. **Don't write a CRM.** Plain or Front or even a `support@freecapt.com` inbox handles support volume at v1.
9. **Don't ship mobile apps.** The web is fine on mobile; the cap table is admin work, not on-the-go work.
10. **Don't switch stacks at month 4** when you find a shiny new framework. Stay disciplined.
11. **Don't optimize prematurely.** 10k companies × 50M audit events fits on a single Postgres machine. Profile before you shard.
12. **Don't add GraphQL.** REST + RPC-shaped server actions is enough; GraphQL's overhead doesn't help one developer.
13. **Don't add a feature flag service** in v1. Environment variables + a `feature_flags` table cover it.

---

## 7. Local dev story

Solo-founder ergonomics matter daily:

- **Docker Compose** for local Postgres (mirror of Neon schema) + Inngest dev server + Resend dev mode.
- **`pnpm dev`** runs Next.js with HMR.
- **Neon branching** for "DB sandbox per PR" — branch the prod DB, work on it, throw it away. Saves you from migration mistakes.
- **Cursor / VS Code** with Tailwind IntelliSense, Drizzle Kit for migrations, Prettier + ESLint.
- **No staging environment in v1.** Neon branching + Fly preview deploys are enough. Ship via PR + merge to main.

---

## 8. CI/CD

- **GitHub Actions** — only CI you need. Runs typecheck, lint, tests on PR.
- **No tests in v1 except critical paths.** This is solo-founder pragmatism. Cover: ledger math (issuance, vesting, dilution), pack validators (especially tax-scheme eligibility), and round-modeling allocation logic. Skip UI tests until they're paying off.
- **Deploy on merge to `main`** via Fly's GitHub integration. Two regions update sequentially with health checks.

---

## 9. Compliance / security posture (extends `5.17`)

A few stack-specific notes:

- **All vendors must support EU data residency** for any data touching EU customers. Confirmed: Neon (Frankfurt), R2 (EU), Resend (EU), Sentry (EU), PostHog (EU). Stripe handles EU tax compliance.
- **Anthropic API region** — Anthropic offers EU region inference; use it for EU-companies' AI calls. Same for OpenAI if ever needed.
- **No PII in third-party tools you don't control.** Logs go to Axiom (EU); error context to Sentry (EU) with PII scrubbing; product analytics to PostHog (EU) with hashed account IDs.
- **Secrets management** via Doppler from day one — never `.env` files in repos.

---

## 10. Cost estimate at launch (rough)

For 100 active companies (mix of free + paid), monthly:

| Service | Cost |
|---|---|
| Fly.io (2 machines × 2 regions) | $40 |
| Neon (EU + US, ~10GB each) | $30 |
| R2 (~100GB documents) | $5 |
| Resend (~50k emails) | $20 |
| Inngest | $0 (free tier) |
| Sentry | $25 (developer tier) |
| PostHog | $0 (free tier <1M events) |
| Cloudflare | $0 (free tier) |
| Doppler | $0 (free tier) |
| Anthropic (Claude API, ~50 active AI users) | $50–150 |
| Domain + SSL | ~$2 |
| **Total** | **~$170–270/mo** |

At 1,000 active companies: scale roughly linearly with AI usage being the dominant cost driver. Still well under $2k/mo.

**Comparison check:** Carta probably spends $300–500/mo just on the AWS bill per cluster they run. We're an order of magnitude cheaper before we even ship a feature — that's structural.

---

## 11. What this stack lets you ship in v1

| Week | What's possible |
|---|---|
| 1 | Project scaffold, auth (magic link), basic layout, marketing pages |
| 2 | Core schema (Drizzle migrations), companies + accounts + memberships + stakeholders |
| 3 | Cap table view, manual stakeholder add, transaction creation |
| 4 | Bulk-add (paste mode), simulator (basic) |
| 5–6 | First country pack (DK), then NO + UK (shared structure) |
| 7 | AI onboarding helper, "explain this" buttons, ask-your-cap-table chat |
| 8 | Stakeholder portal + magic-link claim flow |
| 9 | Exports (CSV free, Excel + react-pdf + docx for paid) |
| 10 | Stripe integration, paywall enforcement, upgrade flow |
| 11 | Remaining packs (SE, DE with notary, CH, US C-Corp + LLC) |
| 12 | Round modeling, audit log surface, security/settings page |
| 13–14 | Polish, internal admin app at `/admin`, error handling, observability |
| 15–16 | Closed beta with 10–20 friendly founders, fix what breaks |

That's a 4-month solo build to closed beta. Aggressive but doable if you don't stack-hop.

---

## 12. Decisions deferred (small, post-launch)

1. **Server-side feature flags service** — env vars + a DB table are fine in v1; pull in LaunchDarkly or PostHog flags later if needed.
2. **Search** — Postgres full-text search is enough until customers have huge stakeholder lists.
3. **Multi-language at the Claude prompt level** — start with English prompts that produce localized output; later, full prompt localization per language.
4. **Public REST/GraphQL API** — defer to v2.
5. **Mobile apps** — defer indefinitely.

---

## 13. One sanity check

Read through this list. If anything feels like it'd take you longer than a week to learn from scratch, replace it with something you already know. The stack above is the most leveraged choice for someone who's comfortable in modern TypeScript + React. If you're more comfortable in Rails or Python, the answer is different — *use what lets you ship*. Tech stack is a means; shipping the product is the end.

---
