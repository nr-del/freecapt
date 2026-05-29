# MVP Scope — "Stripe for Cap Tables"

**Version:** v1.1 — Data room feature
**Date:** 2026-05-27
**Audience:** Nicolai + founding team

**Changelog v1.0 → v1.1:**
- Added: §5.26 **Data room** — folder-structured company document repository. Extends §5.6 Documents from a flat grid into a structured vault with canonical document slots per jurisdiction (Formation, Equity register, Share transactions, Options, Convertibles, Investor agreements, Governance, Notary). Each slot supports two paths: **generate from template** (Paid) or **upload existing** (Free). External read-only sharing for due diligence deferred to v2.
- Country pack template lists expanded — new documents per pack (Articles of Association / Vedtægter / Satzung, basic Shareholders Agreement, IP Assignment, Founder Employment Agreement template). Documented per-pack in the relevant country pack docs as a v0.2 update.

**Changelog v0.9 → v1.0:**
- **Product name locked: FreeCapT** (domain: freecapt.com). All references to "Capframe" placeholder replaced. Brand package at `07_brand_package.md`; landing page at `08_landing_page.html`.
- **Pricing locked** per v0.9 — feature-based two-tier model. No further pricing changes pending real customer data.
- Added: §5.25 **round modeling** (paid feature) — multi-investor allocation modeling. Inputs: round size, pre-money, list of investors with commitment amounts/ranges. Outputs: side-by-side cap table, per-stakeholder dilution, allocation table, term sheet draft.

**Changelog v0.8 → v0.9:**
- **Pricing model entirely reworked** (§5.10) — pivoted from count-based to **feature-based** gating. Two tiers: **Free** (cap table, simulator, basic CSV export, multi-currency, bulk-paste add, AI onboarding *one-time*, multi-Membership for cofounders, multi-company switcher, all country packs, 2FA, audit log) and **Paid at $15/mo** (rich exports, legal PDF/Word, ongoing AI chat + "explain this", document-extraction AI, stakeholder portal access). Stakeholder count is no longer a paywall. Removed: $5/$20 tiers.
- **Country packs expanded to seven at launch** (§5.11): added **SE (AB private + public)**, **DE (GmbH + AG)**, **CH (AG + GmbH)** alongside DK, NO, UK, US. Full deep-dive in new `06_country_packs_se_de_ch.md`. Notable: German GmbH has notary-requirement constraint that shapes UX; Swiss is tri-lingual which interacts with §5.16 i18n.
- **Stakeholder-account linking** (§5.24, new) — when a stakeholder claims their portal via magic link, we deduplicate by email against existing Accounts. Same email → link to existing Account, not new. Enables portfolio dashboard (§5.23) to work naturally. Manual merge flow for the "different emails per grant" case.

**Changelog v0.7 → v0.8:**
- Added: §5.21 **multi-currency handling** — every money value carries explicit currency; company has primary; transactions can be in any currency; FX rate snapshotted at transaction date for historical fidelity
- Added: §5.22 **user timezones** — Account-level TZ preference; UTC storage; localized display for dates, deadlines, vest events, email send times, calendar reminders
- Added: §5.23 **stakeholder dashboards** — enhanced single-company view (exit-value modeling, vesting projections, tax estimates) + new **multi-company portfolio dashboard** for stakeholders with grants across multiple companies (angel investors, advisors with multiple clients, employees holding past-employer equity)
- Updated: §5.10 **pricing** — new three-tier structure: **Free up to 10 stakeholders, $5/mo for 11–20, $20/mo for 21+**. Replaces previous $4/mo Pro and TBD Growth.

**Changelog v0.6 → v0.7:**
- Added: **Norway (NO AS)** to launch country packs alongside DK, UK, US — four packs at launch, not three
- Added: §5.18 **database & infrastructure requirements** — Postgres-first, row-level multi-tenancy, EU/US regions, append-only audit, money as decimal, big-number share counts, PITR backups
- Added: §5.19 **product tracking & observability** — PostHog (EU-hosted, GDPR-friendly) for product analytics; Sentry for errors; OpenTelemetry traces; structured logs; event taxonomy committed before launch
- Added: §5.20 **internal admin / back office** — separate staff app (admin.capframe.app), SSO-locked, impersonation with mandatory reason and audit, account management, refunds, feature flags, support actions

**Changelog v0.5 → v0.6:**
- Added: **bulk stakeholder add** (§5.15) — three modes (spreadsheet paste / AI prompt / document upload) become the primary path; "+ Add stakeholder" singular is secondary
- Added: **localization** (§5.16) — UI in Danish, Norwegian, English, German, Swedish. Language is independent of jurisdiction (a Dane can run a UK Ltd. in Danish UI). German UI ships even though Germany isn't a launch country pack — serves German-speaking users on US/UK/DK packs.
- Added: **security, trust, and compliance posture** (§5.17) — v1 baseline (TLS 1.3, AES-256, GDPR, 2FA, audit log, EU data residency option, bug bounty, public security page) + 6–12mo roadmap (SOC 2 Type I/II, SSO/SAML, ISO 27001, DORA alignment)
- Updated: §10 — undeferred 2FA (now in v1 baseline); SSO stays deferred but with a committed timeline
- Updated: §8 simplification moves — added bulk-add-by-default as a deliberate move
- Updated: §9 wedge table — added trust/compliance row
- Design note: color palette changed from indigo/purple to slate + emerald + amber (no functional impact)

**Changelog v0.4 → v0.5:**
- Added: Account/Company separation to data model (§3) — one Account can be a member of multiple Companies
- Added: company switcher (§4) — appears only when count > 1; invisible to single-company users
- Added: 4 roles (§5.12) — Admin, Editor, Viewer, Stakeholder. ("Super user" renamed to Editor.)
- Added: invitation flow (§5.13) — magic-link only, role-on-invite, no password ever
- Added: viral loop (§5.14) — referral bonus slots + stakeholder portal as demand-gen channel (restrained, one-time, opt-out)
- Added: multi-entity in v1 = **advisor pattern only** (switcher). Group consolidation (holdco → opco rollup) deferred to v2 — see §6
- Removed: "Multi-entity parent/subsidiary consolidation" from Never Build (§7) — group consolidation moved to Build Later
- Updated: §5.10 pricing to include bonus stakeholder slots from referrals (cap at +20 → 30 total free)

**Changelog v0.3 → v0.4:**
- Locked: pricing model flipped to "everything free under threshold, $4/mo above" (no more feature-gating; AI + exports are free up to the stakeholder cap)
- Locked: threshold recommendation = **10 stakeholders** (rationale in §5.10)
- Expanded: onboarding split into two distinct flows — Founder (§5.1, refined) and Stakeholder (§5.7, completely rewritten)
- Added: magic-link-only authentication (no passwords anywhere) — see §5.7 and §5.1
- Added: "Explain my grant" AI feature for stakeholders — same Claude magic that helps founders now helps the employees/investors they grant to

**Changelog v0.2 → v0.3:**
- Locked: simultaneous US + EU launch — all three packs (DK ApS+A/S, UK Ltd., US DE C-corp+LLC) ship together at v1
- Added: legal-grade PDF + Word exports per jurisdiction (PDF/A archival, lawyer-redlineable Word mirror, jurisdiction-specific layouts) — see §5.8
- Added: rich Excel exports (multi-sheet xlsx with formulas, formatting, embedded charts) — see §5.8
- Added: AI onboarding helper using Claude (extract cap table from uploaded documents; conversational setup) — see §5.1
- Added: pricing model with $4/mo Pro tier (see §5.10) — one pricing question still open re: whether AI onboarding sits in free or paid

**Changelog v0.1 → v0.2:**
- Locked: SAFEs in v1, free tier @ 25 stakeholders, AI as v1 primitive, self-serve only
- Locked: multi-jurisdiction from v1 (US + European entity types)
- Data model adjustment: jurisdiction + entity_type as company attributes driving instrument catalog and UI labels (see §3.1)
- "Country pack" pattern introduced for adding additional jurisdictions post-launch (see §5.11)

---

## 1. The thesis, restated tightly

Most private companies don't have a cap table problem. They have a **"who owns what"** problem. Carta turned a ledger into ERP. We turn it back into a ledger — opinionated, fast, free at the bottom, and understandable in one screen.

The v1 product is the smallest thing that lets a Tier-1 founder say: *"I finally see my cap table, I trust the number, and I didn't need a lawyer to get here."*

---

## 2. What a Tier-1 cap table actually looks like

Grounding before we scope features. The 95th-percentile Tier-1 company we're targeting has:

- 2–5 founders on common stock
- 0–3 angel investors (either common, or a SAFE)
- 0–2 advisors with small option/RSA grants
- A reserved option pool (a number, not a fund)
- 3–15 employee option grants
- One share class (common), maybe one SAFE outstanding
- Zero preferred rounds, zero warrants, zero convertible notes, zero anti-dilution math, zero waterfall

If we serve that company perfectly, we've covered the brief's 80–90% / 95% target. Every feature that exists only to model the *other* 5% has to fight for its life.

---

## 3. The data model (this is the entire product)

Six objects. Four ledger primitives + two access primitives.

**Ledger primitives** (the cap table itself):

1. **Stakeholder** — a person or entity that can hold equity in a Company. Name, email, type (founder / employee / investor / advisor / entity).
2. **Security** — a thing that confers ownership. The *category* of security is one of: **equity unit** (shares / anparter / Geschäftsanteile / aktier / membership units), **option-like** (options / warrants / tegningsoptioner / VSOPs / EMI), **convertible** (SAFE / ASA / Wandeldarlehen / convertible loan).
3. **Transaction** — an event that creates, transfers, or extinguishes a security. Issuance, exercise, cancellation, transfer, conversion.
4. **Document** — a PDF attached to a transaction, with a "signed Y/N" flag.

**Access primitives** (who can do what across how many cap tables):

5. **Account** — an authenticated human (or service). One email = one Account. An Account is *not* tied to any company — it can be a member of one or many.
6. **Membership** — the join between an Account and a Company, with a Role attached (Admin / Editor / Viewer / Stakeholder). One row per (Account, Company) pair.

This means: a founder running one company has one Account with one Membership; an accountant managing 30 companies has one Account with 30 Memberships. The product UI changes shape based on Membership count — single-company users never see the multi-entity machinery.

Vesting is an attribute of a grant, not a separate object. Pool is a single integer on the company, not a fund with sub-ledgers. Audit log is an append-only stream over transactions — free, not a feature.

If a question can't be answered by querying these six objects, the answer is probably out of scope.

### 3.1 Jurisdiction overlay

Each company has a **jurisdiction** and **entity_type** (e.g., `dk/aps`, `dk/as`, `uk/ltd`, `us-de/c-corp`, `us-de/llc`). This pair drives:

- **Instrument catalog** — the dropdown of valid security subtypes for that company. A US C-corp sees "Common Stock / Preferred Stock / ISO / NSO / RSA / SAFE / Warrant." A Danish ApS sees "Anparter / Tegningsoptioner / Warrants / Konvertibelt gældsbrev." Nothing else.
- **UI labels** — "shares" / "anparter" / "Geschäftsanteile" / "aktier" depending on entity.
- **Document template set** — the grant agreements, board consents, and shareholder resolutions available to attach to a transaction.
- **Validation rules** — e.g., a German GmbH transfer requires a notary flag; a UK EMI grant requires a valuation date within the last 90 days; a Danish warrant requires a vedtægter reference.

The *ledger math* doesn't care about any of this. Ownership %, dilution, vesting, fully-diluted: all jurisdiction-agnostic. Only the surfaces above are localized.

---

## 4. The screens (six + one conditional)

| # | Screen | The single question it answers |
|---|---|---|
| 1 | **Cap table** | Who owns this company today? |
| 2 | **Stakeholders** | Who are the people on the table? |
| 3 | **Grants & transactions** | What has been issued, when, to whom, on what terms? |
| 4 | **Simulate** | What does the table look like if I raise / grant / exit? |
| 5 | **Documents** | Where are the papers for each transaction? |
| 6 | **Stakeholder portal** | What do *I* own and when does it vest? *(separate login surface for non-admins)* |

**Plus one conditional element:**

| Element | When it appears | What it does |
|---|---|---|
| **Company switcher** | Top-left, only when the user has Memberships in 2+ companies | Search, switch between cap tables. Default: invisible. |

A founder with one company sees a 6-screen product. An accountant with 30 companies sees the same 6-screen product per company, plus a switcher. The multi-entity capability is *invisible by default*, *latent for everyone*, *activated automatically* the moment a second Membership appears.

Settings is a footer link. There is no dashboard with KPI tiles. There is no admin console. There is no "company profile" tab. The cap table *is* the dashboard.

---

## 5. Build Now (v1)

### 5.1 Founder onboarding (target: < 15 min to first cap table)

**Magic-link signup, no passwords.** Email in → magic link → in the product. Browser locale + email TLD pre-suggest the jurisdiction (`.dk` → ask "Denmark?"; `.co.uk` → ask "United Kingdom?"). Never a password field. Ever.

**AI helper opens as a side panel from the empty state.** Powered by Claude. The helper asks one question — "do you want to start from scratch, paste in details, or upload documents?" — and adapts the flow.

**Three setup paths** the helper guides the founder through:
- "Start from scratch" → conversational wizard (jurisdiction + entity type, incorporation date, founders, founder allocation, option pool size). The helper turns a 5-field form into a 2-minute chat.
- "Import from Carta / Pulley / spreadsheet" → CSV import with column auto-mapping. The helper resolves ambiguous columns by asking.
- "Upload formation docs + grants" → OCR + Claude extracts the cap table to a draft the founder reviews row by row. *This is the wow moment.*

**Defaults that just work** (jurisdiction-aware): e.g., US C-corp → 10M authorized shares, common stock, 4y/1y cliff monthly vest; DK ApS → 40,000 DKK selskabskapital, anparter, no vesting unless specified.

**Founder can override any default; never has to see it.**

**Activation moments (deliberate UX celebrations):**
- First cap table saved → confetti + "Here's your company in one screen." (One screen — the cap table view, not a dashboard.)
- First grant issued → "Want me to send Anna her welcome email? I'll explain her grant in plain English." (One click → triggers §5.7 stakeholder onboarding.)
- First scenario simulated → "Save this scenario? You can share it with your cofounder."

These aren't gratuitous — each one ends with a CTA toward the next high-value action.

### 5.2 Cap table view (the home screen)
- Donut + table side by side.
- One toggle: **Outstanding** / **Fully diluted**. (No "as-converted" — irrelevant when there's no preferred.)
- Columns: stakeholder · security type · quantity · ownership %.
- **"You have X% left to grant"** banner at the top — the answer to *"how much equity do I have left?"* should be visible without clicking. Breaks down as: unissued authorized + unallocated option pool.
- One-click: "Cap table as of date" with a date picker.
- Export: PDF and CSV.

### 5.3 Issue / grant flow
- One "New transaction" button. Modal asks:
  1. What kind? (Shares / Options / SAFE)
  2. To whom? (autocomplete stakeholders, "add new" inline)
  3. How much? (quantity *or* % — we do the math)
  4. When? (date picker, defaults to today)
  5. Vesting? (preset dropdown: standard 4y/1y, custom, none)
- For options: strike price field with a "use latest 409A" link (which is just a number the founder enters — we don't compute 409A).
- For SAFEs: cap, discount, MFN toggles. Use YC's post-money SAFE template *only*. Don't expose pre-money SAFE in the UI.
- One screen. No tabs. No "advanced" pane. Anything not in this modal is Build Later.

### 5.4 Vesting tracker
- Per-grant vesting bar (vested / unvested / forfeited).
- Company-wide calendar: next 12 months of vest events.
- Automatic — no recurring inputs needed after grant.
- Termination flow: enter date, system shows what's vested, generates a stop-vest entry and a cancellation for unvested. One click.

### 5.5 Simulator
- **One scenario only in v1: priced round.** Inputs: round size, pre-money, optional pool top-up to %.
- Output: side-by-side current vs. post-round cap table, with per-stakeholder dilution column.
- "Save scenario" → shareable read-only link.
- *No* exit waterfall, *no* multi-round chaining, *no* convertible-note conversion modeling in v1. (Exception: SAFE conversion math is automatic at the priced round, because that's literally the SAFE's purpose.)

### 5.6 Documents
- Upload PDF, attach to a transaction (or to a stakeholder, or standalone).
- "Mark as signed" toggle + countersigner field. **No native e-sign in v1** — see §8.
- Templates available at grant time are scoped by the company's jurisdiction (see §3.1 and §5.11). For the launch jurisdictions, we ship the 3–5 most-used templates per entity type — not a comprehensive library.

### 5.7 Stakeholder onboarding + portal

The stakeholder experience is the second product surface and the most under-loved feature in every cap table tool. Carta and Pulley treat the stakeholder portal as an afterthought; we treat it as a *demand-generation channel*. Every employee, advisor, and angel who receives a polished "here's what you own" experience is a future founder, advocate, or customer.

**Design principles for stakeholders:**
- **Never a password.** Magic link only. Reduces friction to near-zero.
- **Never the founder's interface.** Stakeholders see only their own slice. They never accidentally see another employee's grant or the company-wide cap table.
- **Plain English first.** "You own 0.4% of Acme. Your stake vests over 4 years." Not "1,000 ISOs vesting monthly over 48 months with a 12-month cliff."
- **Educate without patronizing.** "Explain my grant" is an AI button the stakeholder can press for a tailored, plain-language breakdown. The founder doesn't have to write it; Claude does.

**The flow, step by step:**

1. **Grant issued by founder.** System fires an email to the stakeholder. Subject: *"Anna, you've been granted equity at Acme."* Body is warm and human:
   - One-line summary: "You've been granted 1,000 stock options at Acme. They vest over 4 years."
   - PDF of the signed grant agreement attached.
   - Optional founder note (free-text field on the grant form; AI offers a draft if the founder leaves it blank).
   - Single CTA button: "View your stake →" (magic link, no signup needed).

2. **Stakeholder clicks magic link.** Lands on a personalized welcome page, NOT an empty product:
   - Hero block: "Welcome, Anna. Here's what you own at Acme."
   - Their grant: type, quantity, vesting schedule, today's vested amount, projected fully-vested date.
   - "Explain my grant" AI button — Claude generates a 4-sentence explanation in their language, tailored to their specific grant terms.
   - Inline FAQ: "What are stock options?", "What does vesting mean?", "What happens if I leave?" — answered in plain English, jurisdiction-aware.
   - One-line CTA: "Save your access" (email + name confirmation, magic link going forward — still no password).

3. **Ongoing engagement.** Lightweight, opt-in by default:
   - Monthly vest update email: *"Anna, you vested another 41 options this month. You're now 8% of the way to fully vested."*
   - Milestone emails at cliff (12 months), 50% vest, fully vested.
   - Any new grant or change → email + portal update.

4. **Sensitive transitions handled gracefully** (no silent UX):
   - Termination → stakeholder sees a clear "Your grant stopped vesting on [date]. You vested X; the remaining Y were cancelled." with the option to download a final statement PDF.
   - Acceleration, repricing, or other founder-initiated changes → always notified, never surprised.

**Founder-side controls** (kept minimal):
- Toggle: "Send welcome email automatically when I issue a grant?" (default ON)
- Per-stakeholder: pause emails, re-send welcome, revoke portal access.
- Bulk: "Send a portfolio statement to all stakeholders" (quarterly nice-to-have, useful at year-end).

### 5.8 Reports and exports

Three export tiers, deliberately differentiated by use case:

**Basic (free tier):** CSV download of cap table, transactions, vesting schedule. No formatting, no charts.

**Rich Excel (.xlsx):** multi-sheet workbook designed to be poked at, not just read.
- Sheet 1: Cap Table — frozen header row, conditional formatting on ownership %, live formulas (founder can change a cell and see the math update).
- Sheet 2: Transactions — full ledger, filterable.
- Sheet 3: Vesting Schedule — month-by-month vest projection per grant.
- Sheet 4: Summary — KPIs and an embedded donut chart of ownership.
- Per-jurisdiction labels and currency formatting (DKK / GBP / USD).

**Legal-grade documents (PDF + Word):**
- **PDF/A archival format**, with proper letterhead, version stamp, generation date, signature/witness section, and tamper-evident metadata. Suitable for board books, due diligence rooms, audit files, fundraise data rooms.
- **Per-jurisdiction document layouts:**
  - DK: ejerbog (statutory ownership register per Selskabsloven § 50)
  - UK: Register of Members (per Companies Act 2006), Register of Allotments
  - US: Capitalization Table (board-resolution style), suitable for 409A and due diligence
- **Word (.docx) mirror** of each legal PDF — same content, lawyer-redlineable. Use case: founder generates the PDF for the record, sends the Word to outside counsel for markup before signing.

**Out of scope for v1:** direct API submission to authorities (Companies House SH01s, Erhvervsstyrelsen, Handelsregister). The PDFs are the source-of-truth; filing automation is a country-pack v2 add.

**No custom report builder.** The three above are the list.

### 5.9 Audit log
- Append-only feed of every state change. Visible to admins. Exportable.
- Free; falls out of the data model.

### 5.10 Pricing model — feature-based, two tiers

**The pivot:** stakeholder count is no longer a paywall. Pricing is **feature-based**: the free plan has a complete personal ledger you can build, view, and model with; the paid plan has the high-cost and high-willingness-to-pay features (AI, polished exports, stakeholder portal access).

**Two tiers, one price point:**

| Tier | Price | What's included |
|---|---|---|
| **Free** | $0 | The complete personal cap table. Build it, see it, model it, export the raw data. Unlimited stakeholders. No credit card. |
| **Paid** | **$15 / month** | Everything plus the value moments — share with stakeholders, generate legal documents, use AI tooling. |

#### Feature breakdown

| Capability | Free | Paid |
|---|---|---|
| Cap table view (donut + table, jurisdiction-aware, multi-currency) | ✓ | ✓ |
| Add stakeholders — **no count limit** | ✓ | ✓ |
| Bulk add via **spreadsheet paste** (no AI cost) | ✓ | ✓ |
| Bulk add via **AI prompt / document upload** (Claude cost) | — | ✓ |
| AI **onboarding helper** — first-time setup (one-time, ~$0.10–0.50 per account) | ✓ one-time | ✓ |
| AI **ongoing chat** ("ask your cap table") | — | ✓ |
| AI **"explain this"** buttons on numbers / screens | — | ✓ |
| Transactions, vesting tracker, simulator | ✓ | ✓ |
| Documents — upload, attach, mark signed | ✓ | ✓ |
| Document templates — generate from jurisdiction templates | — | ✓ |
| **Basic CSV export** (raw ledger, no formatting) | ✓ | ✓ |
| **Rich Excel export** (multi-sheet, live formulas, embedded chart) | — | ✓ |
| **Legal-grade PDF + Word exports** (per-jurisdiction layouts: ejerbog / aksjeeierbok / Register of Members / etc.) | — | ✓ |
| **Stakeholder portal access** — employees/advisors/investors log in to see their grants | — | ✓ |
| Multi-Membership (cofounders as Admin / Editor / Viewer) | ✓ | ✓ |
| Multi-company switcher (advisors / accountants managing many) | ✓ | ✓ |
| **Multi-company portfolio dashboard** (the stakeholder's cross-company view) | ✓ | ✓ |
| All country packs (DK / NO / SE / DE / CH / UK / US) | ✓ | ✓ |
| Multi-currency, multi-language, multi-timezone | ✓ | ✓ |
| 2FA, audit log, GDPR data export | ✓ | ✓ |
| Magic-link auth | ✓ | ✓ |

#### Design principles behind these splits

A paid feature should be either (a) **high marginal cost to us** (Claude API calls add up) or (b) a **high willingness-to-pay moment for the customer** (the moment they need a legal-grade document, the moment they want stakeholders to log in, the moment they're doing something real). Free has everything else.

Specific calls worth being explicit about:

- **AI onboarding stays free, one-time.** It's the conversion wedge — putting the wow moment behind a paywall kills the funnel. ~$0.10–0.50 per account in Claude cost is worth the activation lift. `accounts.has_used_ai_onboarding` boolean enforces the one-time rule.
- **Basic CSV export is free.** "Your data is yours" is a trust signal. Founders need raw data to plug into spreadsheets / accountants / counsel. We sell *polish*, not data access.
- **Cofounders are free Memberships.** A founder can't add their cofounder for free? That breaks the first 30 seconds of using the product. Notion gates *external* collaboration, not internal team — same principle here.
- **Multi-company is free.** An accountant managing 30 client cap tables shouldn't pay 30× for the switcher (which costs us nothing per extra company). They convert because individual clients want paid features — buying paid per company, not per advisor.
- **Stakeholder portfolio dashboard is free.** Even though it's the highest-value view for angels and serial founders, this is the *acquisition layer*, not the revenue layer. The angel becomes a customer when they start their own company; gating the portfolio view starves the loop.
- **Country packs, multi-currency, multi-timezone, multi-language all free.** No marginal cost per use, and these are the wedge that beats Carta and Ledgy on coverage.

#### Pricing strategy notes

- **$15/month = $180/year.** Carta starts at ~$2,400/yr for a tiny company. We're ~13× cheaper for a full-featured product.
- **One price point is dramatically easier to communicate** than three tiers. "Paid is $15/month, that's it."
- **No usage cliffs.** A founder going from 10 → 11 → 100 → 1,000 stakeholders pays the same. Removes Carta-style "this grant costs more" friction completely.
- **Margin profile:** Claude costs for an active Paid user run ~$1–4/mo (ongoing chat, explain, occasional document extraction). Stripe + infra ~$1. Net ~$10/mo contribution before fixed costs. Reasonable.
- **No credit card on Free.** Card collected at upgrade. Upgrade prompts surface at natural moments — first time clicking "Export rich PDF," first time inviting a stakeholder to the portal, first time clicking "ask your cap table."

#### Why this changed from the previous count-based model

Earlier revs (v0.4–v0.8) explored count-based pricing — free up to N stakeholders, paid above. That model serves a *Stripe-like* philosophy: free until you scale. The new feature-based model serves a *Notion-like* philosophy: free for personal use, paid for "real" use. Both are defensible. The shift was Nicolai's strategic call after the count-based ladder felt arbitrary in practice.

**Metrics to watch closely:**
- Free → Paid conversion rate (and time-to-conversion)
- Which paid feature triggered the upgrade — tells us what to lead with in marketing
- "Stakeholder portal access" upgrade reason vs "exports" upgrade reason — the relative weight informs which paid feature anchors the messaging

### 5.11 Country packs (the pattern, not a feature)
A **country pack** is a self-contained bundle of: jurisdiction code + entity types + instrument catalog + UI label translations + document template set + validation rules. Adding a new jurisdiction = shipping one new country pack. No core code changes.

Launch packs (v1) — **seven packs covering nine entity types:**

- **DK / ApS + A/S** — anparter, tegningsoptioner, warrants, konvertibelt gældsbrev. § 7P favorable option scheme. Templates in Danish (English toggle).
- **NO / AS + ASA** — aksjer, opsjoner, tegningsretter, konvertibelt lån. Opsjonsskatteordningen for små selskaper. Templates in Norwegian (bokmål default).
- **SE / AB privat + AB publikt** — aktier, kvalificerade personaloptioner (QESO), teckningsoptioner, konvertibler. QESO favorable scheme (Swedish equivalent of NO opsjonsskatteordningen — eligibility tests on company size, age, industry). Templates in Swedish.
- **DE / GmbH + AG** — Geschäftsanteile (GmbH), Aktien (AG), VSOPs (virtuelle Anteile — the German workaround for the notary-heavy real-option world), Wandeldarlehen. **Notary requirement** on real share transfers shapes UX. § 19a EStG favorable scheme for real employee shares (limited; VSOPs are the SMB default). Templates in German.
- **CH / AG + GmbH** — Aktien (AG, multiple classes common), Stammanteile (GmbH), Mitarbeiteraktien, Mitarbeiteroptionen. OR (Obligationenrecht) governs. **Tri-lingual** Swiss reality (DE/FR/IT) — German default at launch; French and Italian deferred to post-launch. Cantonal variation simplified at the pack level.
- **UK / Ltd.** — ordinary shares, EMI options (HMRC-favored), unapproved options, ASA. EMI valuation discipline as live validator.
- **US / Delaware C-corp + LLC** — common stock, options (ISO/NSO), RSAs, SAFEs (post-money YC) for C-corp; membership units, profits interests, options on units for LLC. § 1202 QSBS, § 83(b) reminder cascades.

The country pack pattern is the *operational* enabler for going broader over time — France SA/SARL/SAS, Netherlands BV, Spain SL, Finland Oy, Canada CCPC each become a sprint-sized addition rather than a refactor. Friendly counsel relationships in each country can co-author templates for credibility.

**Why this set at launch:** the Nordics (DK + NO + SE) are the beachhead — same cultural assumptions about equity, overlapping founder community, all underserved by US-centric incumbents and over-served by Ledgy's complexity. Adding DACH (DE + CH) covers German-speaking Europe — the largest European economy + Switzerland's high concentration of well-funded founders. UK and US are the gateways anyone expanding internationally will need eventually. Seven launch packs is ambitious, but the abstraction in §3.1 + i18n machinery from §5.16 mean each pack is largely template + label work on shared rails.

**Full pack specs:**
- DK + NO → `03_country_packs_dk_no.md`
- UK + US → `04_country_packs_uk_us.md`
- SE + DE + CH → `06_country_packs_se_de_ch.md`

### 5.12 Roles and access (RBAC, kept deliberately small)

Four roles. No custom role builder, no per-screen permission matrix, no role inheritance.

| Role | Can do | Cannot do | Typical user |
|---|---|---|---|
| **Admin** | Everything: billing, settings, invite/remove anyone, issue grants, edit/delete data, export, change company info, delete company | — | Founder, CFO, company secretary |
| **Editor** | Edit cap table, issue grants, run scenarios, invite Stakeholders, attach documents | Manage billing, invite Admins/Editors/Viewers, delete company | Cofounder, head of ops, fractional CFO, in-house lawyer |
| **Viewer** | Read-only company-wide view, run scenarios, export everything | Make any change | Outside lawyer, board member, prospective investor in DD, accountant in audit mode |
| **Stakeholder** | See only their own holdings (§5.7) | See anything beyond their own slice | Every grantee — employees, advisors, angel investors |

**Role rules:**
- Roles are **per-company** (you might be Admin of your own company and Viewer of a portfolio company).
- Every company must have at least one Admin at all times. The last Admin can't downgrade themselves; they must first promote someone else.
- Stakeholders are created automatically when a grant is issued; the other three roles require explicit invitation (§5.13).
- A single Account can hold different roles in different Companies — an accountant might be Editor in one, Viewer in another, Admin in their own.

**Deliberately not in v1:**
- Custom roles or per-screen permission editing — if the four roles don't fit, we change the four roles, not add a builder.
- Group-level inheritance ("Admin of holdco = Admin of opcos") — defer with group consolidation to v2.
- Time-bound access ("Viewer access expires in 30 days") — defer until customers ask.

### 5.13 Invitations (magic-link, role-on-invite, no passwords ever)

The invitation flow is the single entry point for adding non-stakeholder users to a company.

**Founder/Admin flow:**
1. Settings → Members → "+ Invite member"
2. Enter email, select role (Admin / Editor / Viewer), optional personal message
3. Click Invite. Done.

**Recipient experience:**
1. Email arrives: *"[Inviter] invited you to [Company] on [Product] as [Role]."* Includes one-line plain-English explanation of what that role can do.
2. Single CTA button: "Accept invitation →" (magic link).
3. Click → land in the product immediately, in the role they were invited as, with full Membership active. No password setup, no email verification, no inbox-confirmation step. The magic link is the verification.
4. If they don't have an Account yet, one is created on the spot from the invite email. If they do, the new Membership is added.

**Bulk invite:** paste a CSV of `email, role` pairs and invite up to 50 at a time. Useful for accountants bringing existing clients onto the platform.

**Stakeholder invitations** happen automatically when a grant is issued (§5.7) — they share the same magic-link machinery but the flow is initiated by the grant, not by a separate invite action.

**Out of v1:** SSO/SAML (defer to enterprise tier), 2FA enforcement (defer; magic-link is already low-attack-surface), role expiration, time-bound access.

### 5.14 Viral loop (referrals + stakeholder portal as demand-gen)

The structural advantage we have over Carta: every stakeholder we onboard is in our product, sees our polish, and is a candidate to become a founder customer or a referrer. We design for this deliberately but restrainedly — spam destroys the trust the portal builds.

**Two mechanisms:**

**A. Referral bonus slots** — for active Admins/Editors who want to extend their Free tier:
- Every Account gets a unique referral link, surfaced in Settings → "Get more free stakeholders."
- A referral is credited when someone signs up via the link AND creates a Company (not just signs up).
- Each successful referral = **+5 stakeholder slots** on the referrer's free tier.
- Cap: **+20 bonus slots = 30 total free stakeholders.** Beyond that, they're on Pro regardless.
- Surfaced naturally at upgrade moments: when a founder hits the 10-stakeholder cap, the upgrade prompt offers "or invite 1 founder friend = +5 slots."

**B. Stakeholder portal as latent demand-gen** — the bigger lever:
- **One-time** P.S. line in the stakeholder welcome email: *"P.S. — if you ever start your own company, [Product] is free up to 10 stakeholders. Here's your link."*
- Permanent unobtrusive line in the stakeholder portal footer: *"Manage your own cap table for free →"*
- Stakeholders who refer get the same +5 bonus slots, even if they're not paying customers themselves.
- **Hard rules to protect trust:** no marketing emails to stakeholders beyond the one-time P.S. Never promote in vest-update or milestone emails. Never push portal upgrades. Stakeholders can opt out of the P.S. with one click.

**Attribution:** every signup carries a `referrer_account_id` if signed up via link. Visible in the referrer's Settings → "Your referrals" with count and bonus slot tally.

**Out of v1:** cash referral bonuses, multi-tier referrals (referee-of-referee), referral leaderboards, affiliate program for accountants. These are growth experiments to run post-launch with real data.

### 5.15 Bulk stakeholder add (the primary path, not the exception)

One-by-one stakeholder add is the wrong default. Real founders setting up Acme don't add 7 people one at a time — they have a list, a spreadsheet, or a head full of names. The product should *meet them where they are*.

**Three modes, all available from the same entry point:**

**A. Paste from spreadsheet** (default tab — fastest for migration)
- An editable Excel-like grid. User pastes rows; columns auto-detect.
- Expected columns: name, email, type, security, quantity (or %), date, vesting, strike, notes. Missing columns are fine — set as defaults or left blank.
- Inline validation: red borders on invalid cells, hover for explanation.
- Add/remove rows with one click. Drag to reorder.
- Bottom action: "Create 7 stakeholders & issue 9 transactions" (live count of what will be created).

**B. Type it out (AI prompt)** — for founders who don't have a spreadsheet
- Big textarea: *"Just type it out. I'll figure out the structure."*
- Example placeholder text: *"Anna and Ben are cofounders with 30% each, Chris at 18%, then Dana has 200k options vested over 4y, Erik 75k, Frank put in $250k on a SAFE with $5M cap."*
- Claude parses to a draft table in the same grid as mode A.
- Founder reviews, edits inline, confirms. Same "Create N stakeholders" submit.

**C. Upload documents** — same flow as §5.1 onboarding, accessible here too
- OCR + Claude extraction of formation docs, cap table PDFs, grant agreements.
- Draft table → review → confirm.

**Where this is surfaced:**
- **Stakeholders screen empty state:** all three modes shown as equal first-class CTAs. Singular "+ Add stakeholder" is below the fold.
- **Stakeholders screen populated state:** primary button is "+ Bulk add"; secondary is "+ Add stakeholder."
- **Cap table empty state** (new accounts with no transactions yet): the bulk-add modal opens automatically as the first action.
- **AI onboarding helper:** the spreadsheet-paste and AI-prompt modes are surfaced as one-question shortcuts.

**Why this matters strategically:** Carta and Pulley both *technically* support bulk import — buried 3 clicks deep behind a "data import" page. Surfacing it as the *default* changes who can self-serve. A founder with a 15-row spreadsheet currently has to do a sales call with Carta; with us, they paste, click, done.

### 5.16 Localization

UI available in five languages at launch: **Danish, Norwegian, English, German, Swedish.**

**Language is independent of jurisdiction.** A Danish founder running a US Delaware C-Corp can pick Danish UI; a German expat with a UK Ltd. can pick German. The Account has a `language` preference; the Company has a `jurisdiction` and `entity_type`. They don't have to match.

**What gets translated:**
- All UI strings (nav, buttons, labels, help text, tooltips)
- Email templates (welcome, vest milestones, invitations)
- Plain-English explanations (the "explain my grant" output is localized)
- Error messages and validation copy
- AI helper responses (Claude prompted in user's language)

**What stays in jurisdiction language:**
- Legal-grade exports (an ejerbog is in Danish even if the user's UI is in English; the US Capitalization Table is in English even if the user's UI is in Danish). Legal documents follow the jurisdiction's regulatory language convention, not the user's UI preference.
- Instrument names appear in *both* the user's language and the legal/jurisdictional original (e.g., DK UI shows "Tegningsoptioner (Warrants)").

**Why German now, even though Germany isn't a launch country pack:** to serve German-speaking users on the existing packs — Swiss founders, Austrian founders, German expats running US/UK companies. When Germany joins as country pack #4, the UI translation is already done; only the templates and instrument catalog need to be added.

**Out of v1:** RTL languages (Arabic, Hebrew), CJK languages, French, Spanish, Dutch. Easy to add later as translation files; the i18n machinery is in place from day one.

**Default detection:** browser locale on first visit. Override per Account in Settings.

### 5.17 Security, trust, and compliance

Two things have to be true: (a) the actual security controls have to be enterprise-grade, because we hold the most sensitive document a private company owns; (b) the *visible trust posture* has to convince a founder, a lawyer, and eventually a CISO that we know what we're doing. Both matter.

**v1 baseline (real, shipped from day one):**

| Layer | What we ship |
|---|---|
| **In transit** | TLS 1.3, HSTS, modern cipher suites only |
| **At rest** | AES-256 encryption on all stored data; per-tenant key derivation |
| **Authentication** | Magic-link as the primary mechanism (more secure than passwords for our threat model — no credential stuffing, no reuse). Optional TOTP 2FA for the paranoid / regulated users. Device-trust prompts on new device sign-in. |
| **Authorization** | RBAC enforced server-side (§5.12); per-Membership access checks on every query |
| **Data residency** | EU customers' data hosted in EU region (Frankfurt or Dublin); US customers in US region. Customer chooses at company setup. |
| **Audit log** | Append-only, surfaced in Settings → Security with filter + export. Logs every state change with actor, IP, timestamp, before/after. |
| **GDPR compliance** | Lawful basis documented per data category; DPA template available to download; data subject access requests handled within 30 days; one-click data export and account deletion |
| **Data export** | "Your data is yours" — one-click export of full company state as a ZIP (CSV ledger + PDFs + audit log) at any time, by any Admin. Stays available for 30 days after account deletion. |
| **Bug bounty** | Public program on HackerOne or equivalent from launch. Small payouts ($100–$5,000 range) but credible scope. |
| **Trust page** | Public `/security` page documenting current posture, certifications in progress, and incident history. Linked from product footer. |
| **Status page** | `status.product.com` with real uptime, incident history, planned maintenance. Linked from product footer. |

**6–12 month roadmap (committed publicly on the security page, not promised for v1):**

| Milestone | Target | Why it matters |
|---|---|---|
| **SOC 2 Type I attestation** | ~6 months post-launch | Table stakes for selling to anyone serious; cheap-ish to achieve with a clean v1 architecture |
| **SOC 2 Type II report** | ~12 months post-launch | What real enterprise procurement teams ask for |
| **SSO / SAML** (Okta, Google, Azure AD) | ~9 months, gated to Pro/Growth tiers | Required for any 50+ employee customer |
| **ISO 27001 certification** | ~18 months | Important for German / Nordic enterprise buyers |
| **DORA alignment** | as required, 2025+ | EU financial-services regulation; relevant if we serve regulated entities |
| **Penetration test (annual)** | Year 1, then annually | Public summary published on security page |

**Trust signals that ship in v1 (cheap, high-impact):**
- Footer of every page: GDPR badge, "EU & US data residency," "SOC 2 in progress," "Read our security posture →"
- Transparent pricing (no "contact sales") — itself a trust signal in this category
- Founder identities on `/about` (people behind the company, not a faceless brand)
- Public changelog (every release documented, including security patches)
- Privacy policy in plain English, not legalese
- One-click data export and one-click account deletion — both immediately discoverable in Settings

**Why this matters strategically:** the enterprise security narrative is *the* unlock for moving up-market when we're ready. But equally important: the *trust posture* makes us look serious to *bootstrap* founders too. Founders may not read SOC 2 reports, but they notice the footer badge, the status page, the founder photos, the security page. The same investment serves both audiences.

### 5.18 Database & infrastructure requirements

The cap table is a *legal record*. Data integrity is the single most important property of the system. Anything that compromises correctness, auditability, or recoverability is a P0 bug.

**Database:**
- **PostgreSQL 16+ as the primary store.** Relational fits the model (Companies, Stakeholders, Securities, Transactions, Documents, Accounts, Memberships are all naturally relational). Strong ACID guarantees. JSONB for flexible per-jurisdiction instrument attributes without losing query power.
- **Multi-tenancy via row-level isolation** with `company_id` (or `account_id` where appropriate) on every tenanted table, enforced by Postgres Row-Level Security policies. Not schema-per-tenant (operationally heavier, harder migrations) and not separate DBs (won't scale beyond a few hundred customers).
- **Two regional clusters at launch: EU (Frankfurt) and US (us-east-1).** Customer's region is set at company creation and immutable thereafter. No cross-region data movement.
- **Read replicas** for analytics queries and exports, kept out of the write path.
- **Connection pooling** via PgBouncer (transaction mode) — required given the per-request Postgres connection model.

**Schema conventions (must be enforced in the migration framework):**
- UUIDs (v7, time-ordered) for all primary keys, not serial. No leaking record counts via URLs.
- **Money as `numeric(20, 4)`**, never floats. Currency code (ISO 4217) on every money column.
- **Share/option counts as `numeric(20, 0)`** — supports up to 10^20 units (some pre-IPO cap tables go to billions of shares; integer overflow is unacceptable).
- All tables: `created_at`, `updated_at`, `created_by_account_id`, `updated_by_account_id` (UTC `timestamptz`).
- **Soft deletes only** for tenanted data (`deleted_at` column; never `DELETE FROM` in production code). Hard-delete via GDPR data-deletion workflow only, with separate audit trail.
- Foreign keys ENFORCED in DB (no application-layer-only relationships).
- All timestamps stored UTC; user TZ is a display preference on the Account.

**Audit log:**
- Append-only `audit_events` table — INSERT-only access pattern, enforced by RLS. No UPDATE, no DELETE except by retention job.
- Logical-replication stream of audit events to immutable cold storage (S3 + object lock) for tamper-evidence. Useful for compliance evidence later.
- Every state change writes: `actor_account_id`, `action`, `entity_type`, `entity_id`, `before_json`, `after_json`, `ip`, `user_agent`, `timestamp`. Visible to Admins in Settings → Security.

**Backups:**
- **Point-in-time recovery (PITR)** with 7-day window minimum, 30-day for Pro/Growth.
- Cross-region snapshot replication daily.
- **Quarterly restore drill** — actually restore to a sandbox, confirm integrity. Documented in runbook. If we don't drill, our backups don't exist.

**Migrations:**
- Forward-only migrations, versioned, reviewed in PR. No DROP COLUMN without a 2-phase deploy (deprecated → unused → dropped).
- All migrations tested on a production-data copy in staging before prod.

**Other infra:**
- Object storage (S3-compatible, region-matched) for documents. Encrypted with per-tenant KEKs.
- Background job queue (Sidekiq/Oban/equivalent) for AI extraction, export generation, email sends.
- CDN for static assets only; no app HTML served from CDN (privacy, freshness).
- Secrets in HashiCorp Vault or equivalent — never in env vars committed to git.

**Capacity targets for v1:** 10k companies × ~25 stakeholders × ~50 transactions = ~12.5M ledger rows. Trivial for Postgres on a modest instance. We won't hit scale limits in v1; we *will* hit correctness limits if we cut corners here.

### 5.19 Product tracking, analytics & observability

The product is operationally invisible without instrumentation. We need to know, every day: how many founders signed up, how many hit the cap table view, how many added a second stakeholder, how many upgraded, how many bounced. Without this we are building blind.

**Product analytics: PostHog (self-hosted, EU region) or PostHog Cloud (EU instance).**
- Why PostHog: open source (we can self-host for full data control if needed), GDPR-friendly, replaces both Mixpanel (events) and Heap (autocapture) and FullStory (session replay) in one tool. Avoids the dystopian-feeling US-hosted analytics that European founders will reject on sight.
- Hosted in the same EU region as customer data. No event data leaves region.
- **All tracking is server-side by default** (more reliable, ad-blocker-immune, no PII leakage in client).

**Event taxonomy — committed before launch, not invented after:**

| Layer | Events to track |
|---|---|
| **Acquisition** | `signup_started`, `signup_completed`, `referral_attributed` |
| **Activation** | `company_created`, `bulk_add_opened`, `bulk_add_completed`, `first_stakeholder_added`, `first_grant_issued`, `cap_table_first_viewed`, `ai_onboarding_helper_used` |
| **Engagement** | `cap_table_viewed`, `transaction_created`, `scenario_simulated`, `export_generated{type=csv|excel|pdf|word}`, `ai_chat_question_asked`, `member_invited` |
| **Stakeholder portal** | `portal_email_sent`, `portal_first_opened`, `portal_explain_grant_clicked`, `portal_faq_expanded`, `portal_referral_link_clicked` |
| **Conversion** | `upgrade_prompt_shown`, `upgrade_card_added`, `upgrade_completed`, `referral_bonus_credited`, `growth_tier_entered` |
| **Retention** | `weekly_active_company`, `monthly_active_admin`, `subscription_renewed`, `subscription_cancelled` |
| **Trust signals** | `security_page_viewed`, `audit_log_exported`, `data_export_triggered`, `2fa_enabled` |

**Properties on every event:** `account_id` (hashed for stakeholder events), `company_id`, `jurisdiction`, `entity_type`, `language`, `plan`, `stakeholder_count`, `referrer_source`. Avoid PII in event payloads.

**Error monitoring: Sentry** (EU region). Errors tagged with company_id and route; alerts to Slack with severity routing. SLO: P0 errors paged within 5 minutes.

**Tracing / APM:** OpenTelemetry instrumentation in the app, sent to Sentry Performance or Honeycomb. Spans on every Postgres query, AI call, export generation. Target P95 page load < 800ms on the cap table view.

**Logs:** structured JSON, shipped to Logflare or equivalent EU-resident log store. Retention: 30 days hot, 1 year cold (for compliance). Never log secrets, never log full request bodies.

**Internal dashboards (built before launch, looked at daily):**
- Daily/weekly/monthly active companies
- Activation funnel: signup → company_created → bulk_add → first_grant → cap_table_viewed (per day, per jurisdiction)
- Conversion funnel: free → upgrade_prompt → upgrade_completed
- Stakeholder portal engagement (open rate, referral CTR)
- Top errors (last 24h), P95 latencies on key routes
- Cohort retention curves by signup month

**Stakeholder analytics caveat — GDPR-critical:**
- Stakeholders never tracked individually beyond aggregate counts. No `account_id` resolution in event payload, no behavioral profiling.
- Vest milestone emails not tracked beyond "sent" (no open/click tracking — feels surveillance-y given the relationship).
- Portal usage tracked anonymously (just counts, no user-level funnel).

**Hard rules:**
- No third-party trackers in the product (no Google Analytics, no Hotjar, no Intercom messenger that ships to US). All client-side scripts whitelisted.
- DPA covers PostHog and Sentry.
- Tracking is disabled for any user who opts out in Settings → Privacy.

### 5.20 Internal admin / back office

We can't run the company without an internal tool. Customer support, refunds, account recovery, feature flag changes, debugging weird states — all of this needs a real admin app, separate from the customer-facing product.

**Surface:** standalone app at `admin.capframe.app` (subdomain isolation, separate session, separate auth).

**Authentication:**
- Staff-only. Locked behind Google Workspace SSO (bifroststudios.com domain) — no email/password ever.
- 2FA mandatory and enforced at the SSO layer.
- IP allowlist for admin app (office IPs + staff VPN; we are not BeyondCorp at this size).
- Session timeout: 1 hour idle, 8 hours absolute. No "remember me."

**Capabilities — v1 list:**

| Area | What staff can do |
|---|---|
| **Account management** | Search any Account by email or ID; view profile, memberships, login history, security state (2FA on/off, devices). |
| **Company management** | Search any Company by name, ID, jurisdiction; view full cap table; view all memberships; view subscription state; transfer admin if a customer is locked out. |
| **Impersonation** | "View as this Account" mode — opens a read-only window into the customer's product UI. **Reason required (free text), logged to audit, expires in 30 minutes, banner visible to staff that they're impersonating.** Never write actions while impersonating; if a write is needed, exit impersonation and do it as staff with a documented support reason. |
| **Subscription / billing** | View Stripe (or equivalent) state for any account. Issue refunds, comp/extend trials, apply discount codes, change plan, cancel/reinstate subscriptions. All billing actions logged with reason. |
| **Support actions** | Resend invite, reset 2FA (with verification protocol), restore soft-deleted data, force-end stuck sessions, regenerate API keys. |
| **Data fixes** | Manual edit interface for cap table data, with mandatory reason + auditable diff. Only for incidents — not a routine tool. |
| **Feature flags** | Per-account, per-jurisdiction, or global on/off for any feature behind a flag. Useful for staged rollouts and customer-specific exceptions. |
| **Country pack management** | Toggle availability of each pack; manage instrument catalogs and template versions. |
| **Email / template management** | View all transactional email templates; preview, edit, version. |
| **Support tickets** | View tickets surfaced via the customer's in-app help widget. (Integration with Plain/Front/Intercom — TBD which.) |
| **Metrics** | Embedded dashboards mirroring §5.19 — but with the ability to drill into individual account behavior (privacy-respectful, but more detail than the public dashboards). |

**Hard rules:**
- **Every action in admin app is logged.** Actor, action, target, reason, timestamp, IP. Logs retained 7 years (compliance baseline) in immutable storage.
- **No raw DB access in production** for any staff. Everything goes through the admin app. If something can't be done in the admin app, we ship a feature for it, we don't open psql.
- **No data export from admin app** without ticket reference. Bulk exports trigger SOC 2 alarms later.
- **Impersonation read-only.** The temptation to "just fix it while you're in there" is exactly what destroys customer trust when the audit is reviewed. Hard guardrail.
- Admin app inherits the same security/privacy commitments as the customer app — EU residency for EU customers' data, no PII in logs, etc.

**Out of v1:** customer-facing API for staff features (we don't expose admin functions externally), Zendesk/Salesforce integration (use a simple ticket tool like Plain or Front; integrate when we have volume), role tiers within staff (everyone is "admin" in admin app at our size — add scoped roles when team > 10).

### 5.21 Multi-currency handling

A Norwegian VC investing in a UK Ltd. via ASA. A Danish founder paying a US contractor in USD-denominated options. A Swedish angel writing SEK into a DK ApS SAFE. These are normal — the product has to handle them as a first-class case, not an edge case.

**Core principle:** every monetary value carries its currency. There is no "implicit USD" anywhere in the model.

**Currency levels:**

| Level | What's set |
|---|---|
| **Company** | A `primary_currency` (ISO 4217). The currency the company reports in. Defaults from jurisdiction (DK → DKK, NO → NOK, UK → GBP, US → USD) but is overridable at setup. |
| **Transaction** | A `transaction_currency`, defaulting to the company's primary. Overridable per transaction — a UK Ltd. accepting NOK from a Norwegian investor records the SAFE in NOK. |
| **Display** | User can toggle the cap table view between native (each row in its own currency) and **normalized** (everything converted to company primary, or to user-chosen display currency). |

**Exchange rates:**
- **Snapshotted at transaction date.** The rate used to convert NOK 250,000 to GBP at the moment of the SAFE issuance is stored on the transaction. Never re-fetched. Means historical reports stay correct even if rates change.
- **Source:** ECB reference rates for fiat (free, authoritative, EU-friendly). Daily snapshot stored in our own table — we don't depend on a live external API per page load.
- **Crypto:** not supported in v1. No tokens, no stablecoins. (Some cap table tools support this; we don't.)

**Where currency shows up in UX:**
- Cap table view: optional toggle "Show in [company primary] / [native currencies]." Default: company primary.
- Stakeholder portal: stakeholder sees grant in *grant's currency* by default, with a toggle to *their preferred display currency* (set in their account).
- Exports: Excel and PDF show both — the original currency and the company-normalized value side by side, with rate date footnoted.
- Simulator: round size, valuation, etc. all entered in company primary currency. (No cross-currency round modeling in v1 — out of scope.)

**Validation rules:**
- Per-jurisdiction minimum capital is enforced in the *required statutory currency* (ApS in DKK, AS in NOK, etc.), regardless of whatever transaction currencies appear later.
- Tax scheme thresholds (EMI £30M assets, opsjonsskatteordningen 80M NOK, etc.) are checked in their native currency using the snapshotted rate at the check date.

**Out of v1:**
- Real-time FX rates (we snapshot at transaction date only).
- Multi-currency consolidated reporting across multiple companies (would need a chosen reporting currency at the Account level — defer until group consolidation v2).
- Cross-currency simulator (modeling a round where the new investor uses a different currency).

### 5.22 User timezones

Timezones matter more here than in most SaaS because we're surfacing legally-significant dates: vesting cliffs, 83(b) deadlines, EMI notification windows, opsjonsskatteordningen filing requirements. "Your 83(b) is due Tuesday" needs to be true *in your timezone*, not in UTC.

**Storage:** everything is `timestamptz` stored in UTC. No exceptions, no local-time strings.

**Display:** every user-facing date is rendered in the viewer's preferred timezone.

**Timezone resolution order (first match wins):**
1. Account-level `display_timezone` preference (set in Settings, IANA name like `Europe/Copenhagen`).
2. Browser-detected timezone (used to pre-fill the Account preference at signup; can be overridden).
3. Fallback to company's home jurisdiction timezone (DK → `Europe/Copenhagen`, NO → `Europe/Oslo`, UK → `Europe/London`, US → `America/New_York`).
4. UTC.

**Date-only fields** (vesting start date, grant effective date, incorporation date) are stored as `date` not `timestamptz`. They are timezone-agnostic by design — a grant dated 2026-04-12 is *the same date* whether you're in Copenhagen or San Francisco. Displaying them never shifts based on TZ.

**Datetime fields with TZ implications:**
- Audit log entries (UTC stored, displayed in viewer TZ with TZ abbreviation).
- Last-active timestamps (displayed as relative "2 hours ago" or absolute in viewer TZ).
- Scheduled email sends — vesting milestone emails, reminder cascades, etc. — sent at **8:00 AM in the recipient's timezone**, not in UTC. A Norwegian employee gets their vest update at 08:00 Oslo time; a US employee gets it at 08:00 ET.
- 83(b) / EMI notification / Skatteetaten deadline countdowns — calculated in the *company's statutory timezone* (the jurisdiction's relevant filing TZ), displayed in the viewer's TZ with both shown when they differ. "Due in 3 days (2026-05-12 23:59 Europe/London)."

**Daylight savings:** handled correctly by using IANA timezone identifiers throughout, never UTC offsets. A meeting scheduled for "10am Europe/Copenhagen" stays at 10am Copenhagen time across DST transitions.

**Out of v1:**
- Per-company default timezone override (companies use their jurisdiction TZ; staff override only via support ticket).
- Per-stakeholder TZ on the portal (uses their Account TZ).

### 5.23 Stakeholder dashboards

The stakeholder portal (§5.7) covers the single-grant-in-one-company case well. Two extensions matter:

**A. Enhanced single-company dashboard** — more value within the existing portal.

For a stakeholder with one or more grants in a single company, the dashboard expands beyond "here's what you own" to:
- **Vesting projection chart** — a monthly bar showing what they've vested so far and what's projected, with cliff/milestone markers.
- **Exit-value modeling** — interactive sliders: "If Acme exits at $50M, my stake is worth X. At $100M, Y. At $500M, Z." Plain English, jurisdiction-aware tax estimate (post-tax value with the relevant favorable scheme applied, with caveats).
- **Tax estimate** — *educational, not advice*, with a clear disclaimer. Shows the rough tax bill under the company's home jurisdiction at current rates. "If you exercise today at 1,000 shares × $0.50 strike with $5 FMV, you'd owe approximately $X under ISO treatment, $Y under NSO." Same disclaimer everywhere: *"This is an estimate. Talk to your tax advisor."*
- **Multi-grant view** — if a stakeholder has multiple grants from the same company (e.g., a refresh grant), they all show in one dashboard with combined totals.
- **Document library** — every signed document related to their stake, downloadable.

**B. Portfolio dashboard — the multi-company case (new)**

Many real stakeholders hold equity in multiple companies:
- Angel investors with 10+ portfolio companies
- Advisors with multiple client grants
- Employees who hold past-employer equity alongside current grants
- Serial founders with stakes in companies they no longer run

If a single Account has Stakeholder rows across multiple Companies, they see a **portfolio dashboard** as their landing page after sign-in:

| Element | What it shows |
|---|---|
| **Headline summary** | "You have stakes in **7 companies** worth approximately **$X** at the latest known valuations." Single line, plain English. Currency: user's preferred display currency. |
| **Portfolio grid** | One card per company: company name, your role (founder / employee / investor / advisor), your stake (shares/units/options), today's vested amount (if applicable), latest known value of your stake in user's display currency. |
| **Cross-portfolio insights** | Soft analytics: "3 of your grants reach a vesting milestone this quarter." "Acme's latest 409A was Q1 2026." Not pushy — just useful at-a-glance. |
| **Click-through** | Each card opens the per-company dashboard (the single-company view from §A above). |
| **Sort/filter** | By value, by vesting progress, by recency of last update. |

**Why this is a real lever:**
- Angels and advisors are *exactly* the demographic that becomes founders of new companies and brings their network. A polished portfolio dashboard is the daily-use surface that builds brand affinity over years.
- It's the structural insight that incumbents miss: Carta treats each engagement as siloed because their business model is per-company. We don't have that constraint — every stakeholder is the same Account, regardless of how many companies they have grants in. The portfolio view falls out of the data model for free.
- It's also a competitive moat. An angel with 15 companies on us has 15× the switching cost compared to a single-company portal.

**Design constraints:**
- **Privacy across companies is absolute.** A stakeholder in Company A and Company B sees their own slice of each — never sees other stakeholders of either company. The portfolio is *their* view, not a network graph.
- **Companies do not see each other through stakeholders.** Acme's admin doesn't know Anna also has equity in Beta. (The Stakeholder rows in Acme and Beta share an Account but Acme can't query Beta's existence.)
- Same magic-link auth as everywhere; no passwords.

**Where it lives in nav:** for any Account with stakeholder rows across 2+ companies, the post-sign-in landing is the portfolio dashboard. Single-company stakeholders skip it and land on the company-specific portal directly. Same invisibility rule as the company switcher for admins.

**Out of v1:**
- Aggregate "your net worth from equity" computation across all holdings (requires per-company valuations we may not have).
- Inter-stakeholder comparison or benchmarking.
- Portfolio-level export (would conflict with the per-company privacy rule — defer).

### 5.24 Stakeholder-account linking (one person, many cap tables, one Account)

The portfolio dashboard in §5.23 only works if the *same person across multiple cap tables* maps to a single Account. This requires explicit dedup logic in the stakeholder-claim flow — by default, magic-link signup might create a new Account every time, which would silently fragment a person's identity across grants.

**The link-or-create flow when a stakeholder claims their portal:**

1. Founder issues a grant to `anna@example.com` → system creates a Stakeholder row in Company X with `account_id = NULL`.
2. System fires the welcome email with a magic link to `anna@example.com`.
3. Anna clicks the magic link. System checks: **does an Account with this email already exist?**
4. **If yes** (Anna is already in another Company's cap table, or she's a founder of her own company, or she's signed in elsewhere before): we **link the new Stakeholder row to the existing Account**. Set `stakeholders.account_id = existing_account.id`. Anna signs in to her one Account and immediately sees both her existing portfolio AND the new company.
5. **If no:** create a new Account from this email, link the Stakeholder row to it. Standard case.

This is invisible to the founder issuing the grant and invisible to Anna at signup — it just *works*. Anna doesn't have to know that FreeCapT also serves the company she invested in last year; her portal experience is unified automatically.

**Edge case: different emails per grant.**

A stakeholder might end up on different cap tables under different email addresses (e.g., `anna@oldcompany.com` for a 2024 angel investment, then `anna@newjob.com` for a 2026 employee grant). Both create separate Accounts because we have no way to know they're the same person from the email alone.

Solution: **manual merge from Settings → Account → "Merge with another account I own."** Flow:
1. Anna enters the email of the other Account she wants to merge in.
2. System sends magic links to *both* emails — Anna must click both within 30 minutes.
3. On confirmation, all Stakeholder rows from the secondary Account are re-linked to the primary; the secondary Account is soft-deleted; audit log records the merge.

This is opt-in only — we never silently merge based on heuristics (name match, etc.) because the false-positive risk is too high.

**Adding a stakeholder by email that's already linked to an existing Account.**

When an admin enters `anna@example.com` in the new-grant flow:
- If a Stakeholder already exists with this email in *this* company → "Anna is already a stakeholder. Add another grant to her?"
- If an Account exists with this email but no Stakeholder in *this* company → silent — create the new Stakeholder, link to existing Account.
- If neither exists → create both on grant issuance.

**Privacy guarantee (re-stated for emphasis):**

The link-by-email machinery never leaks cross-company information. Acme's admin entering `anna@example.com` doesn't learn that Anna has equity in Beta. The Account record is a globally unique identity, but the Stakeholder row visibility is gated by company membership. RLS policies in the data model (§3 of `05_data_model.md`) enforce this.

**Data model implication (already in v0.5):**
- `accounts.email` is unique globally.
- `stakeholders.account_id` is nullable; populated when the stakeholder claims the portal.
- `stakeholders.email` is per-row (the email the admin used to create the grant — may differ from `account.email` if Anna later changed her primary email).

**Out of v1:**
- Auto-suggested merges based on similar names / phone numbers (privacy / false-positive risk).
- Stakeholder-initiated "I'm being granted to wrong email — please reroute to this other email I already use" flow without admin involvement (mild support flow; can be handled via admin email change for now).

### 5.25 Round modeling (paid feature — extends the simulator)

The simulator from §5.5 handles "what if I raise $X at $Y pre-money?" — a single hypothetical new investor. Round modeling extends that to the real-world workflow: **a list of specific investors, each with their own commitment, allocated against a target round size.**

**The workflow this serves:** founder is preparing a priced round (e.g. *2 MDKK at 8 MDKK pre-money*). They've talked to 10 potential investors, each interested in different amounts:

- Investor A wants 500k
- Investors B and C want 250k each (firm)
- Investors D, E, F say "100–200k, your call"
- Investors G–J want 50–100k each
- Existing SAFE investors may have pro-rata rights to exercise

Founder needs to know: how do I allocate to add up to 2M and satisfy as many investors as possible? Which investors fit, which get scaled back, who gets cut?

This is the moment of need where Carta is unhelpful (you build it in Excel and pray) and where we earn the $15/mo.

**Inputs:**

| Round terms (same as simulator) | Investor list (new) |
|---|---|
| Round size + currency | Per investor: name (existing stakeholder or new), email, commitment shape: `fixed`, `range(min, max)`, or `up_to(max)` |
| Pre-money valuation + currency | Optional priority: `must_include`, `target`, `optional`, `fill_the_gap` |
| Pool top-up to % post (optional) | Optional minimum check size |
| Trigger SAFE conversions toggle | Optional pro-rata: % of round entitled (auto-computed for existing investors with pro-rata rights) |

**Three modeling modes:**

1. **Manual allocation (v1):** founder enters specific amounts per investor; tool validates against constraints (sum ≤ round size, each within investor's range, etc.) and shows the resulting cap table.
2. **Constraint solver (v1 stretch):** founder enters min/max + priority hints; tool suggests an allocation that satisfies all constraints. Linear program: maximize satisfied target ranges subject to total = round size, each amount in its range. Surface multiple solutions when they exist.
3. **Scenario comparison (v2):** model "Investor A in, B out vs B in, A out" side-by-side. Out of v1.

**Outputs:**

- **Allocation table** — each investor's commitment, % of round, % of post-money, pre-money price per share/anpart/aktie. Shows oversubscription/undersubscription clearly.
- **Side-by-side cap table** — current vs post-round, leveraging the existing simulator output format.
- **Per-stakeholder dilution table** — existing simulator output, extended to show the impact of the multi-investor allocation.
- **Validation banner** — green when all constraints satisfied; amber/red when over- or under-subscribed.
- **Term sheet draft** (PDF + Word, paid) — jurisdiction-aware, summarizing: round size, pre/post-money, share/anpart/aktie price, allocation table per investor, pool top-up, key terms. Founder reviews; outside counsel finalizes.

**Pro-rata math (auto-computed for existing investors with rights):**

When an existing stakeholder has pro-rata rights from a prior SAFE or share issuance, their entitled amount = `(their_pre_round_ownership_pct × round_size)`. UI surfaces this automatically as their "exercised pro-rata" amount, which they can accept, partially accept, or waive.

**SAFE conversion during round modeling:**

Outstanding SAFEs (per §5.3) auto-convert at this round per their terms (cap, discount, MFN). The conversion is visible in the cap table preview — SAFE investors appear as new shareholders at their converted amounts before the new money comes in. This is the same SAFE conversion math from the basic simulator (§5.5), reused.

**Where in the UI:**
- Simulate screen (§5.5) gets a third toggle alongside basic round mode: **"Round modeling (Pro)"** — opens the multi-investor workflow.
- Free users see the option but get an upgrade prompt: *"Round modeling with multiple investors is a Paid feature."*
- Pro users get the full workflow.

**Saved rounds:**
- Each modeled round can be saved as a scenario (reuses `scenarios` table from data model).
- Shareable read-only link for sending to investors / cofounders / advisors during fundraise.

**Out of v1:**
- **Optimizer for "which investors to accept" given soft constraints** — could be done in v1.5 if customer demand justifies. The math is straightforward (LP / MILP) but the UX is non-trivial.
- **Tranche modeling** (first close / second close, escrow conditions, milestone-based investing) — defer to a real customer ask.
- **Direct integration with cap table data rooms or signing platforms** — defer.
- **Term-sheet negotiation tracking** ("Investor A counters at 12M pre") — would extend round modeling into a CRM-light surface; out of scope for now.

### 5.26 Data room — structured company document repository

A founder's cap table is not the only thing they need to manage. They also need a coherent home for every legally-relevant document the company has ever produced — formation docs, Articles of Association, shareholder agreements, option grant agreements, share purchase agreements, board minutes, notary deeds. Today these live in scattered Dropbox folders, email attachments, and the founder's lawyer's drives.

The Data room replaces §5.6 Documents (a flat grid) with a **structured folder repository** that knows what documents a company *should* have, given its jurisdiction. For each canonical slot it offers two paths: **generate from template** (Paid) or **upload existing** (Free, always).

#### Folder structure (jurisdiction-aware)

The default layout, with example documents for an SMB-stage company. Each pack ships with the canonical document slots for its jurisdiction; folder names are localized.

```
📁 Data room
├── 📁 1. Formation
│   ├── Certificate of Incorporation / Stiftelsesdokument / Gesellschaftsvertrag
│   ├── Articles of Association / Vedtægter / Satzung / Bylaws
│   └── Initial registry filing confirmation
│
├── 📁 2. Equity register
│   ├── Shareholder register / Ejerbog / Aksjeeierbok / Aktiebok / Register of Members
│   │   (auto-generated from cap table — always current)
│   ├── Share certificates (per stakeholder, if issued)
│   └── Authorized capital documentation
│
├── 📁 3. Share issuances & transfers
│   ├── Share Purchase Agreements (per founder, per investor)
│   ├── Transfer agreements
│   └── Notary deeds (DE/CH only — for GmbH transfers)
│
├── 📁 4. Options & employee equity
│   ├── Option pool board consent
│   ├── Option grant agreements (per grant) — ISO / NSO / EMI / Tegningsoption / QESO / VSOP
│   ├── 83(b) elections (US RSAs / profits interests)
│   └── Option plan / scheme document
│
├── 📁 5. Convertibles
│   ├── SAFEs / ASAs / Wandeldarlehen / Konvertibelt gældsbrev (per instrument)
│   └── Convertible notes
│
├── 📁 6. Investor agreements
│   ├── Shareholders Agreement (SHA / Anpartshaveraftale / Aksjeeieravtale)
│   ├── Voting Agreement (when used)
│   └── Investment Agreement (priced rounds)
│
├── 📁 7. Governance
│   ├── Board minutes / Bestyrelsesreferat / Styreprotokoll
│   ├── Shareholder resolutions / Generalforsamlingsprotokoller
│   ├── Written consents in lieu of meetings
│   └── Pool reservation board consent
│
├── 📁 8. Founder & key employee agreements
│   ├── Founder employment agreements (with vesting + IP assignment + non-compete)
│   ├── IP assignment agreements
│   └── Restrictive covenants
│
└── 📁 9. Other corporate documents
    └── (Free-form uploads that don't fit a canonical slot)
```

For German GmbH companies, an additional folder **"10. Notary documents"** holds notarized deeds (notarisierte Urkunden) per §15 GmbHG.

#### The slot model

Each canonical document slot has:

- **Name** (localized per UI language; original-jurisdiction title shown alongside)
- **Status:** `present` / `missing` / `outdated` (e.g., a Shareholders Agreement that predates the last share issuance is flagged outdated)
- **Source:** `auto-generated`, `template`, `upload`, or `external link`
- **Linked entity:** which transaction / stakeholder / round this document belongs to (when applicable)
- **Signed status:** `unsigned` / `awaiting countersigner` / `fully signed` (with countersigner name + date)
- **Generated version:** if produced from a template, the template version + render date

Missing slots show with a dashed border + "**+ Add**" affordance. Clicking opens a modal with the two paths:

```
┌─────────────────────────────────────────────┐
│ Add: Shareholders Agreement                 │
│                                             │
│  ○ Generate from template (Paid)            │
│    A jurisdiction-appropriate SHA for       │
│    SMB-stage companies. Word format,        │
│    ready for your lawyer to review.         │
│                                             │
│  ○ Upload existing                          │
│    PDF or Word. We'll attach it to the      │
│    Shareholders Agreement slot.             │
│                                             │
│                            [Cancel] [Next →]│
└─────────────────────────────────────────────┘
```

#### Generate-from-template (Paid)

Templates are part of the country pack — extending §5.11. Each pack ships:

- A **basic Shareholders Agreement** template (SMB-calibrated — single share class, common stock or local equivalent, no preferred-stock provisions). Output: Word (.docx) for lawyer redlining + PDF/A for the record.
- A **Founder Employment Agreement** template (with standard vesting + IP assignment + non-compete language for the jurisdiction).
- A **basic IP Assignment Agreement** template.
- The transaction-driven templates already in §5.8 (option grants, SPAs, board consents, etc.) all surface here.

For each generated document, the template configurator collects the per-company variables (company name, party names, dates, key terms) and renders to .docx. Founder reviews; outside counsel finalizes; signed PDF gets uploaded back to the same slot. The founder note: *"This template is a sensible starting point for an SMB. Have it reviewed by counsel before signing."*

**Articles of Association / Vedtægter / Satzung:** template available but typically the founder's lawyer / formation provider has already produced these at incorporation. The UX accepts either path naturally — upload what exists or generate.

#### Upload existing (Free)

Drag-and-drop or browse. PDF or Word. The file gets attached to the canonical slot. If a document doesn't fit any slot (an old advisor agreement, a customer NDA), it lives in *Other corporate documents*.

#### Data room readiness score

A small UI surface in the corner: **"Your data room is 7 / 14 documents complete."** Clicking shows which canonical slots are still missing. Useful for fundraise prep — investors doing DD want everything in place.

#### External sharing (deferred to v2)

A natural extension: share the data room (or a subset) as a read-only link with a prospective investor, lawyer, or accountant during DD. With watermarking, view-tracking, and per-recipient access logs. This is meaningful work — link tokens, expiry, watermark rendering, access audits. Deferred until a customer specifically asks for it during a real fundraise.

Until then, a Paid user can export individual documents to share via email; a future v2 turns this into a proper investor data room.

#### Where the data room sits in the nav

- New top-level nav item: **Data room** (icon: folder).
- Replaces the existing **Documents** entry from §5.6 — the flat grid view becomes the contents of folders 9 + "All documents" filter.
- Stakeholder portal sees their own slice — only documents linked to *their* grants (no access to corporate governance, no access to other stakeholders' agreements).

#### Build sequencing implication

This belongs around **week 7–8** of the build plan in `11_kickoff.md` — after country packs are wired (so the template lists exist) and exports are working (so .docx generation is in place). Reuses existing infrastructure; doesn't require new data model fields beyond a `document_slot` text column on `documents` and a `data_room_slots` static catalog per pack.

**Out of v1:**
- External sharing / link tokens / watermarking (deferred to v2 — real customer pull required)
- E-signature on generated documents (already deferred in §5.6)
- Version control / diff between revisions of the same document (defer; mark-as-superseded works)
- AI-assisted template configuration ("explain to Claude what kind of SHA you want") — defer; v0.1 ships with form-based configurators

---

## 6. Build Later (v2 and beyond, only when pulled by customer demand)

| Feature | Trigger to build |
|---|---|
| Preferred share classes (Series Seed / A) | First 10 customers asking "I'm raising a priced round, can you handle it?" |
| **Group consolidation** (true holdco → opco rollup with consolidated cap table) | When 5+ customers ask for "show me ownership across my whole group." Different from multi-entity (already in v1) — this is *consolidating* across entities, not switching between them. |
| Native e-sign | Customers complaining about the DocuSign handoff |
| 409A valuations | When we can broker it via a partner and earn margin, not before |
| Convertible notes | After SAFEs aren't enough — likely never for our ICP |
| Board approval workflows | When customers ask, not before; today they email |
| Accountant portal / multi-company view | When accountants start signing up clients |
| ASC 718 stock-comp reporting | When customers' bookkeepers ask |
| Form 3921, 83(b) reminders | Cheap to add once we have grants flowing |
| API | After 100 paying customers, not before |
| Additional country packs (DE GmbH, SE AB, NO AS, NL BV, FR SARL/SAS, ES SL, CA CCPC, etc.) | One per sprint, prioritized by inbound demand from launch markets |
| Custom vesting beyond presets | When > 20% of grants hit "custom" |
| Mobile-native app | **Moved to Never Build (§7).** Cap table management is admin work, not on-the-go work; the web is mobile-responsive enough. |

---

## 7. Never Build (for this product)

These are not "later" — they are an active scope refusal. If we build these, we have become Carta.

- Fund administration, LP reporting, capital calls
- SPV formation or administration
- Secondary market / liquidity programs
- Full liquidation waterfall with participating preferred, caps, anti-dilution variants
- Warrant coverage modeling
- Tax optimization workflows
- Configurable workflow engine ("Zapier for cap tables")
- Custom field builder
- Custom report builder
- In-product messaging between stakeholders
- Equity trading
- **Mobile-native apps (iOS, Android)** — cap table management is admin work; the web is mobile-responsive enough; native apps multiply maintenance with no proportional value

---

## 8. The opinionated simplification moves

The calls that make us *not* a cheaper Carta. Each is a deliberate refusal of complexity.

1. **One share class by default.** Preferred only appears when you raise a priced round, and even then it's a *template*, not a configuration screen.
2. **Pool is a number, not a fund.** "Options reserved: 1,500,000." No allocation tracking, no sub-pools, no pool-by-grant-type. When you grant from it, the number goes down.
3. **YC post-money SAFE is the only SAFE.** Pre-money SAFE exists in the world; in our UI it does not.
4. **No 409A.** We don't compute it, sell it, or pretend to. We accept a number. (Partnership later for margin.)
5. **No native e-sign in v1.** Use the customer's existing DocuSign / Dropbox Sign, or upload signed PDF. Native sign is a 6-month compliance project disguised as a checkbox.
6. **No legal review workflow.** Founders email their lawyer like they already do. We export a clean PDF.
7. **No board approval object.** Upload the consent, link it to the grant. Done.
8. **Defaults are not "recommended" — they are the choice.** The UI doesn't show alternatives unless you click "Advanced." Most users will never click it.
9. **Plain English everywhere.** "Shares" not "common stock units." "Money raised" not "round proceeds." "How much of the company" not "post-money ownership." A glossary tooltip exists for the legal term, not the other way around.
10. **AI as a first-class primitive, not a feature.** Three places it earns its keep on day one:
    - **Document → cap table extraction** at onboarding (the wow moment).
    - **"Ask your cap table"** chat: "What % do I own fully diluted?" "What if I raise $2M at $10M post?" "When does Anna's grant fully vest?"
    - **"Explain this"** button on any number or screen — translates the legal/finance into one sentence.
11. **Bulk-add by default.** Every incumbent makes you add stakeholders one at a time and hides the import 3 clicks deep. We invert it: the primary CTA is "bulk add" (spreadsheet paste, AI prompt, or document upload); singular add is secondary. A founder with a 15-row list pastes once and is done.
12. **Magic-link auth over passwords.** Lower attack surface than password databases (no credential stuffing, no reuse, no leaked-hash risk). 2FA available for paranoid/regulated users. Both more secure *and* lower friction than the alternative.

These aren't a "v2 AI strategy." They're the wedge — the thing incumbents can't ship in 18 months because their data models won't let them.

---

## 9. Wedge summary — why a founder switches to us

| Lever | Carta / Pulley | Ledgy | Us |
|---|---|---|---|
| Time to first cap table | 1–3 days | hours, sales-assisted | < 15 min, self-serve, AI extracts from your docs |
| Bulk stakeholder add | Hidden, 3 clicks deep | Hidden | Primary CTA on the empty state |
| Price for a 10-stakeholder company | $2k–$3k/yr | €€€ enterprise pricing | **Free, full features** |
| Price for a 25-stakeholder company | $2k–$3k/yr | €€€ enterprise | $48/yr |
| Screens to learn | ~30 | ~25 | 6 |
| Lawyer required? | Implicit yes | Implicit yes | Explicit no |
| AI integration | Bolted on | Bolted on | Native (free for everyone) |
| Stakeholder portal | Functional, generic | Functional | Magic-link, plain-English, AI "explain my grant" |
| Onboarding requires sales call | Yes | Often | No |
| European entity coverage | Weak (US-first) | Strong but complex | Strong + simple (country packs) |
| UI languages | English (+ partial others) | EN/DE/FR | EN / DA / NO / SV / DE at launch |
| Legal-grade jurisdiction-specific exports | Generic US PDF | Yes, complex | Yes, opinionated per pack (PDF/A + Word) |
| Password required | Yes | Yes | Never (magic links only) |
| Trust posture visible | Buried | Buried | Footer badges + public security page + status page + public changelog |
| SOC 2 / GDPR / data residency | Yes (enterprise tier) | Yes (enterprise tier) | GDPR & EU residency in v1; SOC 2 Type I ~6mo; II ~12mo |

The single sentence pitch: **"It's the cap table tool you can set up on a Tuesday afternoon, free, and your cofounder will actually understand."**

---

## 10. What I deliberately did NOT include from your brief, and why

Three things from your prompt I scoped *out* of v1. Flagging explicitly so you can overrule:

1. **Native e-signature in the Compliance Layer.** Moved to Build Later. E-sign is regulated (ESIGN Act, UETA, eIDAS for EU later), needs identity verification, audit trails on signatures specifically, and tamper-evident sealing. It's a 4–6 month build that adds zero differentiation vs. embedding DocuSign. We ship faster without it.

2. **Exit modeling in the Scenario Layer.** Moved to Build Later. With one share class and maybe one SAFE, exit modeling is `proceeds × ownership %`. The simulator handles it implicitly. The moment we add preferred classes (v2), we add a proper waterfall — not before.

3. **Multi-round dilution modeling.** Simulator handles *one* round in v1. Chained scenarios ("Seed then A then B") is a Build Later thing that 95% of Tier-1 founders never touch.

---

## 11. Status — v1 scope is fully locked

All major v1 product decisions are now locked:

- ✓ **Data model:** 6 objects (Stakeholder, Security, Transaction, Document, Account, Membership) with jurisdiction overlay (§3)
- ✓ **Screens:** 6 + conditional company switcher when Memberships > 1 (§4)
- ✓ **Launch packs (seven, simultaneous):** DK (ApS+A/S), NO (AS+ASA), **SE (AB privat+publikt)**, **DE (GmbH+AG)**, **CH (AG+GmbH)**, UK (Ltd.), US (DE C-corp+LLC) (§5.11)
- ✓ **Ledger features:** SAFEs in v1; self-serve only; AI as v1 primitive (§5)
- ✓ **Exports:** Rich Excel + legal-grade PDF + Word per jurisdiction (§5.8)
- ✓ **AI onboarding:** Claude-powered, free for everyone (§5.1)
- ✓ **Brand:** FreeCapT (domain: freecapt.com). See `07_brand_package.md` and `08_landing_page.html`.
- ✓ **Pricing (feature-based, two tiers, locked):** Free has full personal cap table + bulk paste + AI onboarding (one-time) + basic CSV + multi-Membership + multi-company + all country packs. **Paid at $15/mo** unlocks ongoing AI, rich/legal exports, stakeholder portal access, AI-driven bulk add, **round modeling**. No stakeholder count limits. (§5.10)
- ✓ **Round modeling (Paid):** multi-investor allocation modeling extending the simulator. Inputs: round terms + per-investor commitment shapes (fixed / range / up_to / pro-rata). Outputs: allocation table, side-by-side cap table, dilution view, jurisdiction-aware term sheet draft. (§5.25)
- ✓ **Data room (§5.26):** folder-structured company document repository with 8–10 canonical slots per jurisdiction (Formation, Equity register, Share transactions, Options, Convertibles, Investor agreements, Governance, Founder agreements, Notary for DE/CH). Each slot: generate-from-template (Paid) or upload existing (Free). Replaces flat Documents grid. External sharing deferred to v2.
- ✓ **Dual onboarding:** Founder (§5.1) + Stakeholder (§5.7)
- ✓ **Multi-entity:** advisor pattern (switcher) in v1; group consolidation deferred to v2
- ✓ **RBAC:** 4 roles — Admin, Editor, Viewer, Stakeholder (§5.12)
- ✓ **Invitations:** magic-link only, role-on-invite, no passwords (§5.13)
- ✓ **Viral loop:** referral bonus slots + stakeholder portal as demand-gen channel (§5.14)
- ✓ **Bulk add:** 3 modes (paste / AI prompt / upload), primary CTA on empty state (§5.15)
- ✓ **Localization:** 5 languages at launch — EN / DA / NO / SV / DE (§5.16)
- ✓ **Security & trust:** v1 baseline (TLS 1.3, AES-256, GDPR, 2FA, audit log, EU residency, bug bounty, public security/status pages) + 6–12mo roadmap (SOC 2 Type I/II, SSO, ISO 27001) (§5.17)
- ✓ **Database & infra:** Postgres 16+ with RLS multi-tenancy, EU + US regions, decimal money, big-number share counts, append-only audit, PITR backups, quarterly restore drills (§5.18)
- ✓ **Product analytics & observability:** PostHog (EU) + Sentry + OpenTelemetry. Server-side events. Stakeholder analytics anonymized. Committed event taxonomy before launch. (§5.19)
- ✓ **Internal admin / back office:** standalone `admin.capframe.app`, Google Workspace SSO, impersonation read-only with mandatory reason + audit, no raw DB access in prod (§5.20)
- ✓ **Multi-currency:** every money value carries currency; FX rates snapshotted at transaction date; ECB reference rates; per-stakeholder display currency preference (§5.21)
- ✓ **User timezones:** UTC stored, viewer-TZ displayed, IANA names throughout; scheduled emails at 08:00 local recipient time; deadlines computed in statutory TZ with viewer-TZ shown alongside (§5.22)
- ✓ **Stakeholder dashboards:** enhanced single-company view (vesting projection, exit-value modeling, educational tax estimate) + **multi-company portfolio dashboard** for angels/advisors/serial founders (§5.23)
- ✓ **Stakeholder-Account linking:** email-based dedup at portal claim; same email → link to existing Account, not create new. Manual merge flow for "different email per grant" cases. Enables portfolio dashboard naturally. (§5.24)
- ✓ **Auth:** magic-link primary, optional TOTP 2FA, across all surfaces
- ✓ **Design direction:** slate + emerald + amber palette (clean, financial trust, distinctive from competitors)

**Open items deferred to v0.7+ (not blocking v1 build):**

1. **Growth tier pricing structure** — flat tier vs. per-stakeholder pricing for 51+ stakeholders. Defer until we see signal from early Pro customers.
2. **Country pack rollout order** — which jurisdiction ships as country pack #4? Likely Germany (now that German UI is in v1 — natural pull). Decide post-launch based on inbound demand.
3. **Founder note AI templates** — exact prompts for the "AI drafts a personal note to your new employee about their grant" feature (§5.7 step 1).
4. **Quarterly portfolio statement email** — nice-to-have in §5.7. Build only if early stakeholders ask.
5. **Bonus slot referral cap** — set at +20 (= 30 total free) in v0.5. Tune up or down based on early viral coefficient data.
6. **Accountant affiliate program** — different product surface (revenue share, white-label hints). Defer until accountant signups show real volume.
7. **SSO/SAML** — committed publicly with ~9 month target on security page. Gated to Pro/Growth.
8. **SOC 2 Type I / Type II audits** — engaged with auditor before public launch; Type I at ~6mo, Type II at ~12mo.
9. **Additional UI languages** — French, Spanish, Dutch, Finnish next. i18n machinery in v1 makes each new language a translation-file PR.

---
