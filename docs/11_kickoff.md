# FreeCapT — build kickoff plan

**Date:** 2026-05-27
**Audience:** Nicolai (solo founder, going from spec → code)
**Purpose:** Everything you need to do *yourself* (accounts, domains, API keys) and the order to do it in. Then how we move from planning mode (Cowork) to building mode (Claude Code) with the right MCP connections.

---

## 0. The honest framing: stop planning, start building

We've written ~50,000 words of specs across 10 documents. The product is fully scoped. Continuing to refine the scope without writing code is a procrastination shape that solo founders fall into. **The next 30 days should be ~95% building, ~5% spec adjustments based on real customer conversations.**

Two mode shifts to make:

1. **Cowork mode → Claude Code mode** for actual coding. Cowork is great for documents and decisions; Claude Code has direct file editing, shell execution, and tighter loops on the codebase. You install Claude Code locally, point it at a repo, and we pair-program from there.
2. **Spec-first → ship-first.** From here, scope changes only when (a) you hear the same signal from 3+ customers, or (b) you hit a real implementation blocker. Otherwise: build what's already speced.

---

## Phase 0 — Account setup (only you can do these, ~2–3 hours)

Before any code, these accounts and credentials exist. **Do these in order; don't skip ahead.**

### Owned by Bifrost Studios (the legal entity)

- [ ] **Domain:** purchase `freecapt.com` (already chosen — confirm purchased) via your existing registrar (or Cloudflare Registrar — cheapest).
- [ ] **Email:** set up `hello@freecapt.com`, `support@freecapt.com`, `security@freecapt.com`. Forward to your Bifrost inbox for v1.
- [ ] **Bifrost Studios as legal entity:** confirm Bifrost ApS (or whichever DK entity) is the operating company. ToS, DPA, billing are all under that entity. If Bifrost isn't structured for SaaS billing yet, this is the moment to add the right line items.

### Code & deployment

- [ ] **GitHub Organization:** create `freecapt` (or `bifroststudios` if you prefer the parent brand). Make it the home of all repos.
- [ ] **GitHub Repo:** create `freecapt/freecapt` — private. This is the monorepo.
- [ ] **Cloudflare account:** for DNS (point `freecapt.com` → Cloudflare nameservers), R2 buckets, CDN.
- [ ] **Fly.io account:** sign up, add billing. Create two apps (initially empty): `freecapt-eu` (region `fra`) and `freecapt-us` (region `iad`).
- [ ] **Neon account:** sign up, create two projects: `freecapt-eu` (Frankfurt region) and `freecapt-us` (US East). Note the connection strings.

### Vendors

- [ ] **Anthropic API:** create API key (`https://console.anthropic.com`). Set monthly spend limit to something safe like $200/mo to start. Add billing.
- [ ] **Stripe account:** complete Bifrost Studios verification (Danish CVR-nr, IBAN). Enable test mode + live mode. Create products in **test mode** matching the pricing — "FreeCapT Paid Plan" at $15/month.
- [ ] **Resend account:** add the `freecapt.com` domain, complete DNS verification (SPF, DKIM, DMARC records via Cloudflare). EU region.
- [ ] **Sentry account:** new project for FreeCapT. EU data residency. Get DSN.
- [ ] **PostHog account:** EU instance (eu.posthog.com). Get project API key.
- [ ] **Axiom account** (logs): new dataset. EU region.
- [ ] **Doppler account:** create projects for `freecapt-dev`, `freecapt-prod-eu`, `freecapt-prod-us`. This is where every credential above lives. **No `.env` files in repos, ever.**

### Personal (for development)

- [ ] **Local dev environment:** Node 22 LTS, pnpm, Docker Desktop (for local Postgres), Cursor or VS Code with the relevant extensions.
- [ ] **Claude Code installed:** install via Anthropic's docs. Configure it with your Anthropic API key.
- [ ] **GitHub CLI:** `brew install gh` (if you're on Mac) for fast repo interactions.
- [ ] **Fly CLI:** `flyctl` installed and authenticated.

### Total setup time: realistically 2–3 hours

Don't try to do this in 20 minutes. Each vendor verification has its own wait time (Stripe verification can take 24 hours; Resend DNS verification 5–60 minutes; Neon is instant).

---

## Phase 1 — Switch to Claude Code mode (today, after Phase 0)

This is the mode change that unlocks actually building. Claude Code is a CLI tool that runs locally, has direct file access, can run commands, and can use MCPs.

**How to start:**

1. `cd ~/projects && git clone git@github.com:freecapt/freecapt.git && cd freecapt`
2. Run Claude Code in that directory: `claude` (or however your install names it).
3. Point it at the spec docs as context: copy `01_mvp_scope.md`, `05_data_model.md`, `09_tech_stack.md` into the repo (e.g., a `docs/` folder) so Claude Code can read them as it works.
4. From there: prompt Claude Code through the build. *"Scaffold Next.js 15 with App Router, TypeScript strict, Tailwind, shadcn/ui, Drizzle ORM. Set up the database schema from `docs/05_data_model.md`."* And iterate.

**Why this is materially different from Cowork:**

| Cowork | Claude Code |
|---|---|
| Generates spec files, mockups, decisions | Writes actual code in your repo |
| You copy-paste into your IDE | Directly edits files |
| Can't run `pnpm install` | Can run shell commands |
| Can't test code | Can run tests, iterate on failures |
| One-shot deliverables | Multi-step build loops |

I (the Cowork agent) am still here for: spec adjustments, brand iterations, customer-interview synthesis, anything document-shaped. But for code? Switch over.

---

## Phase 2 — MCP connections (priority order)

MCPs (Model Context Protocols) are how Claude Code (or Cowork) connects to external services. These get you from "Claude can write code" to "Claude can also create GitHub issues, deploy to Fly, set up Stripe products, query the Neon database."

**Tier 1 — connect first (Day 1 of building):**

| MCP | What it does | Where used |
|---|---|---|
| **GitHub MCP** | Read/write your repo, create issues, manage branches and PRs | Daily; the most important by far |
| **Filesystem access** | Read/write files locally (built into Claude Code) | Daily |
| **Shell access** | Run `pnpm`, `flyctl`, `gh`, migrations (built into Claude Code) | Daily |

**Tier 2 — connect within first 2 weeks:**

| MCP | What it does | Where used |
|---|---|---|
| **Neon MCP** | Query the database, run migrations, branch for dev | Database iteration |
| **Stripe MCP** | Create products, prices, test customers, verify webhooks | Pricing/billing implementation |
| **Anthropic API** (already have key from Phase 0) | Test Claude prompts directly | AI feature development |

**Tier 3 — connect when you're shipping to users:**

| MCP | What it does | Where used |
|---|---|---|
| **Resend MCP** (if available; else API) | Send test emails, manage templates | Email development |
| **Sentry MCP** | Triage errors, view incidents | Production debugging |
| **PostHog MCP** | Query analytics, view funnels | Activation/conversion tracking |
| **Cloudflare MCP** | Manage DNS records, R2 buckets | When you need to change DNS |
| **Linear MCP** *(optional)* | Track work as tickets | If you want ticket-tracking; GitHub Issues is fine too |

**Tier 4 — defer:**

- **Fly.io MCP** — there isn't a mature one yet (last I checked). Use `flyctl` directly via Claude Code's shell access.
- **Customer support tools** (Plain, Front, Intercom) — defer until you have customer support volume.
- **Notion / Slack** — you already have these connected in Cowork; not needed for the build itself.

**How to actually connect them:**

In Cowork (this mode): search the connector registry — that's the `mcp__mcp-registry__search_mcp_registry` tool. Each MCP has its own auth flow (typically OAuth). I can help you find and connect specific ones when you ask.

In Claude Code: each MCP has its own setup in `~/.config/claude-code/mcp.json` or equivalent. Anthropic's docs cover this.

---

## Phase 3 — The first 4 weeks of building (high-level)

You have 16 weeks of work in `09_tech_stack.md` (§11) to closed beta. The first month is the riskiest because if the foundation is wrong, you re-do it. Here's the priority order for week 1–4:

### Week 1: Scaffolding + auth + first screen

- [ ] Next.js 15 app scaffold (TypeScript strict, Tailwind, shadcn/ui, App Router)
- [ ] Connect to Neon (EU project) via Drizzle
- [ ] Schema migration: `accounts`, `companies`, `memberships`, `stakeholders` (just these four, from `05_data_model.md`)
- [ ] Magic-link auth via Lucia + Resend (send the magic link email, accept the token, set the session)
- [ ] Empty Cap Table screen (just the layout from the wireframes)
- [ ] Deploy to `freecapt-eu` on Fly.io behind a "coming soon" page on `freecapt.com`

**Done state:** you can sign in with your own email, see an empty cap table, and the page is on production.

### Week 2: Cap table data + bulk add

- [ ] Schema migrations: `securities`, `transactions`, `documents`
- [ ] Bulk-add modal (paste mode only, no AI yet) — the §5.15 spec
- [ ] Cap table view with donut + table — real data from the DB
- [ ] Stakeholder list screen
- [ ] First country pack (DK) loaded as a static config object

**Done state:** you can paste in your own startup's cap table and see it rendered.

### Week 3: Country packs + simulator

- [ ] Country packs for NO, UK, US (DK done) loaded
- [ ] Jurisdiction-aware labels (basic i18n setup with next-intl)
- [ ] Simulator screen — single round modeling (the simpler v1 simulator, not the paid round modeling yet)
- [ ] Grant flow (new transaction modal)

**Done state:** you can switch jurisdictions, see anparter ↔ shares ↔ aktier labels swap, and run a basic "what if I raise $X at $Y" scenario.

### Week 4: AI onboarding + stakeholder portal stub

- [ ] AI onboarding helper (the side panel from wireframes) — connect to Anthropic API
- [ ] Document upload + Claude extraction for the bulk-add "upload" mode
- [ ] Stakeholder portal layout (separate route group, no real auth flow yet — just the view)
- [ ] First seven country packs done (SE, DE, CH added)

**Done state:** you can upload your own formation docs and watch the AI parse them into a draft cap table. This is the wow-moment demo you'll show on calls.

After week 4: you have a demo-able product. Show it to the customers you're already talking to. **Their feedback shapes weeks 5–8.**

---

## Phase 4 — When to add what later

Things you'll be tempted to build in the first 4 weeks that should wait:

| Feature | When to build |
|---|---|
| Stakeholder magic-link claim flow | Week 5–6 (after you have a paying customer who needs to invite a stakeholder) |
| Legal-grade PDF / Word exports | Week 7–8 (paid feature, second priority after AI) |
| Round modeling (multi-investor) | Week 9–10 (after a customer has actually asked) |
| Internal admin app at /admin | Week 11–12 (when you need it for real support work) |
| Stripe paywall enforcement | Week 10 (when first paying customer is signing up) |
| Audit log surface in UI | Week 12 (data is being logged from day 1; UI is later) |
| SOC 2 prep | Month 4+ (after you have at least 10 paying customers) |
| SSO/SAML | Month 6+ (when first enterprise-ish customer asks) |
| French + Italian UI | Month 4+ (post-launch when CH customers ask) |
| Multi-currency display toggling (cap table in foreign currency) | Month 3+ (data model supports it; UI lags) |

Anything in the spec that doesn't appear on the week 1–4 list is *deferrable.* If you find yourself building it early, you're procrastinating on the harder thing.

---

## Phase 5 — How to keep me useful as you build

Even after switching to Claude Code, Cowork mode (this chat) stays useful for:

1. **Customer interview synthesis** — after a batch of calls, dump notes to me and I'll update the scope where needed.
2. **Document iteration** — landing page copy revisions, FAQ additions, country pack template drafts.
3. **High-level design decisions** — when you hit a "should I build A or B?" moment that touches multiple subsystems, dump it here for a thinking-partner pass.
4. **Strategy and positioning** — when you're stuck on a marketing/sales question, this is the right place.

What to *not* use Cowork for once you're building:

- Day-to-day code questions (Claude Code is faster)
- "Help me debug this stack trace" (Claude Code can run the code)
- Long codebases analysis (Claude Code has live file access)

---

## Phase 0 checklist — what to do TODAY

After your customer calls, the highest-leverage 30 minutes you can spend:

1. Buy `freecapt.com` (if not already).
2. Create the GitHub org + repo.
3. Sign up for Neon and create the EU project (skip US for now).
4. Sign up for Fly.io and create the EU app.
5. Generate an Anthropic API key.

That's it for today. Stripe verification can wait until you actually need to test payment flows (probably week 8+). Resend domain verification has a wait time; start it now so it's ready by week 1.

Once those 5 things exist, you can start Claude Code on the repo tomorrow morning. The 15-minute "scaffold this with Next.js 15 + the data model in `05_data_model.md`" prompt will get you to first commit.

---

## One concrete recommendation to make today easier

I notice you have several MCP connectors already wired up in Cowork (Notion, Slack, Google Drive, Calendar, Gmail, BigQuery). For the build phase, those are mostly irrelevant — you don't need Notion to write code. **The single MCP that would materially help right now is GitHub.** If you connect that to Cowork (and to Claude Code when you start), I can:

- Create the FreeCapT repo for you with the right structure
- Open issues for each of the week-1 tasks
- Review PRs as you push them
- Suggest commit messages and branch names

When you're back from calls, say the word and I'll walk you through connecting it.

---
