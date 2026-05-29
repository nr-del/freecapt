# Country packs: Denmark + Norway (v0.1)

**Version:** 0.1 — first structured spec, written for engineering + flagged for counsel review
**Date:** 2026-05-26
**Audience:** Nicolai + founding engineers + future local counsel reviewers
**Status:** Draft. Sections marked **[counsel review]** must be confirmed by a qualified DK / NO corporate lawyer before any template ships to a customer.

---

## 1. The country pack schema (applies to every pack we'll ever ship)

A country pack is a self-contained, versioned bundle. Adding a jurisdiction = shipping one pack. The schema, every pack must define:

| Field | What it specifies |
|---|---|
| `code` | Stable identifier, e.g. `dk-aps`, `no-as`, `us-de-ccorp`. Forms the join key between Company and pack. |
| `display_name` | Localized full name in UI and exports. |
| `entity_types` | One or more entity types this pack supports (e.g. DK pack = `aps` + `as`). |
| `currency` | Primary currency (ISO 4217). Influences money fields and exports. |
| `capital_minimum` | Minimum statutory capital, used for validation. |
| `registry_id_format` | Regex + label for the official identifier (CVR-nr / Organisasjonsnummer / Companies House number). |
| `registry_link_template` | URL template to deep-link the company to its public registry record. |
| `instrument_catalog` | The set of valid security subtypes for this entity (see §3, §4). |
| `default_values` | Sensible defaults (e.g. authorized capital, vesting, signing conventions). |
| `validation_rules` | Pack-specific validators run on transaction submit (e.g. "AS aksjekapital ≥ 30 000 NOK"). |
| `document_templates` | The set of templates available to generate (see Templates sections). |
| `legal_references` | Statute citations on each template footer (e.g. "Selskabsloven § 50") — both for credibility and for traceability when laws change. |
| `tax_scheme_metadata` | Optional eligibility metadata for favorable schemes (e.g. opsjonsskatteordningen, ligningsloven § 7P). |
| `localization_keys` | Translation files (any of EN/DA/NO/SV/DE we ship for this pack). |
| `version` | Semver. Bumped when statute changes; old grants keep their pack-version snapshot for audit. |

**Versioning rule:** when a country pack changes (new statute, new template), bump the version. Every Transaction stores the pack version it was created under, so a grant from 2026 doesn't get re-interpreted under 2028 rules. Audit-critical.

---

## 2. Pack: Denmark (`dk-aps` and `dk-as`)

### 2.1 Identifiers and authorities

| | DK |
|---|---|
| Registry | **Erhvervsstyrelsen** (Danish Business Authority) |
| Registry portal | virk.dk |
| Company identifier | **CVR-nummer** — 8 digits, e.g. `12345678` |
| Identifier validation | 8 numeric digits; modulus-11 check digit |
| Beneficial owner registry | **Ejerregistret** (Beneficial Owners Registry) — disclose owners >5% |
| Governing statute | **Selskabsloven** (Companies Act, 2009, consolidated 2014) |
| Tax authority | **Skattestyrelsen** (Danish Tax Agency) |
| Tax statute for options | **Ligningsloven § 7P** (favorable employee option scheme) |

### 2.2 Entity types in this pack

**ApS (Anpartsselskab — private limited company)** — the SMB/startup default
- Selskabskapital minimum: **40 000 DKK** (since 2014; was 80k before)
- Notary not required for incorporation; required for vedtægter (articles) amendments and capital changes
- Most common entity for our Tier-1 ICP

**A/S (Aktieselskab — public limited company)** — used by larger / VC-backed
- Selskabskapital minimum: **400 000 DKK**
- Permits share classes (typically A-aktier voting, B-aktier non-voting or limited)
- Stricter governance: board required, mandatory audit above thresholds

### 2.3 Instrument catalog [counsel review]

| Local name | English equivalent | Category | Allowed in | Notes |
|---|---|---|---|---|
| **Anparter** | Shares (private) | equity-unit | ApS | Single class default. Multiple classes legal since 2014 Selskabsloven revision but uncommon in SMB. |
| **Aktier** | Shares (public) | equity-unit | A/S | Multiple classes typical (A/B with voting differentiation). |
| **Tegningsoptioner** | Warrants / options | option-like | ApS, A/S | Statutory term per Selskabsloven §§ 52–66. Used for employee option grants. Strike + vesting + exercise period required. |
| **Konvertibelt gældsbrev** | Convertible debt note | convertible | ApS, A/S | Selskabsloven §§ 167–177. Debt with conversion option to anparter/aktier on trigger event. |
| **Differenceaktier** | Phantom shares / SARs | option-like (synthetic) | ApS, A/S | Synthetic equity — economic exposure without legal share issuance. Common for employee schemes to avoid the notary/registration overhead of real tegningsoptioner. Cash-settled. |
| **Warranter** | Warrants (loose) | option-like | A/S typical | Sometimes used interchangeably with tegningsoptioner; in practice often refers to investor-side warrants from a financing. |

**Decision flagged for counsel:** the distinction between *tegningsoptioner* and *differenceaktier* matters enormously for tax treatment under § 7P. We should default to tegningsoptioner (real options) when § 7P eligibility is intended; differenceaktier when it's not (or when company wants to avoid notary). UI should prompt clearly.

### 2.4 Tax-favorable scheme: Ligningsloven § 7P [counsel review]

Critical for any company granting employee equity. Founders who don't know about § 7P leave a lot of money on the table — the AI helper should surface it.

**What it does:** under § 7P, the employee is taxed only on capital gains at sale (≈42% top rate via aktieindkomst), not on income at grant/exercise (would be ~55%+ as employment income).

**Eligibility (must all hold) — encode as validators:**
- Employee or consultant (CEO eligible if also employee)
- Granted **tegningsoptioner** or **aktier** (not differenceaktier — synthetic doesn't qualify)
- Value of grant at the time of grant ≤ **10% of annual salary** per year (or up to **20% if open to >80% of employees** — broad-based scheme bonus)
- Specifically opted into in the grant agreement ("Optionerne er omfattet af ligningsloven § 7P")
- Holding period rules apply
- Employer must report to Skattestyrelsen

**UX implication:** when issuing tegningsoptioner via the grant flow, the modal should ask: "Should this grant fall under § 7P?" and validate eligibility live. If validation fails (e.g., 12% of salary), flash the warning *before* the founder signs. Saves a tax bill the founder didn't know was coming.

### 2.5 Validation rules

```
- ApS: selskabskapital ≥ 40 000 (currency=DKK)
- A/S: selskabskapital ≥ 400 000 (currency=DKK)
- CVR-nr: /^\d{8}$/ + mod-11 check
- Transaction.date ≤ today + 30d (no far-future-dated grants — common audit issue)
- Pool reservation requires bestyrelsesreferat (board minutes) document attached
- § 7P-marked grant requires: lønindkomst ≥ (grant_value × 10) at grant date
- A/S share class change requires notary signature flag = true
- Capital increase requires vedtægter version bump + notary flag
```

### 2.6 Document templates [counsel review — every template]

The templates we generate for a DK company. Each is shipped as a Jinja-style template with the pack; rendered against transaction + company + stakeholder data; exported as PDF/A (legal-grade) and .docx (lawyer-redlineable).

| Template | When generated | Legal reference | Notes |
|---|---|---|---|
| **Ejerbog** | On any change to ownership; on-demand export | Selskabsloven § 50 | The mandatory ownership register. Every ApS/A/S must keep this. Our generated version becomes the source of truth. |
| **Tegningsoptionsaftale** | At grant of tegningsoptioner | Selskabsloven §§ 52–66 + LL § 7P (if applicable) | Option agreement. Includes § 7P language when applicable. |
| **Anpartshaverfortegnelse / Aktiebog** | On-demand | Selskabsloven § 50 | Equivalent of ejerbog for ApS / A/S — terminology varies by entity type. |
| **Beslutningsprotokol — Kapitalforhøjelse** | On capital increase | Selskabsloven § 154 ff. | Resolution document for capital increase. |
| **Bestyrelsesreferat (board minutes)** | On board-approved actions (pool reservation, grant approval) | Selskabsloven § 130 | Minimal board minutes template. |
| **Konvertibelt gældsbrev (template)** | At issuance of convertible debt | Selskabsloven §§ 167–177 | Conversion terms (trigger events, discount, cap). |
| **Vedtægter (articles of association) — patch** | At any vedtægter change | Selskabsloven § 28 | We ship a *patch* generator (changed sections only), not full vedtægter (too varied per company). |
| **Erklæring til Erhvervsstyrelsen** | Capital changes that need registry filing | Various | Documentation founder gives to lawyer for the actual filing. We don't auto-file to Erhvervsstyrelsen in v1. |

**Filing automation NOT in v1.** Filing to Erhvervsstyrelsen via the structured API is a country-pack-v2 feature. v1 generates documents; founder/lawyer files them.

### 2.7 Defaults that just work (jurisdiction-aware) [counsel review]

For an ApS chosen at onboarding:
- Selskabskapital: 40 000 DKK
- Anparter issued: 40 000 (kr 1 nominal per anpart) — keeps math simple
- Currency: DKK
- Option pool: 0 reserved (founder explicitly creates one)
- Vesting default: 4 år / 12 mdr cliff (matches US convention, increasingly common in DK startups)
- Default tegningsoption tax flag: § 7P-eligible

### 2.8 Legal/research questions for counsel before launch [counsel review]

1. **§ 7P "value at grant" computation method** — fair market value approach for non-listed ApS shares. Common practice (board valuation) vs strict approach (independent valuation). Need to land on a defensible default.
2. **Differenceaktier and accounting treatment** — IFRS 2 vs Danish GAAP. Does our cap table view need to surface accounting cost?
3. **Notary requirement for grants** vs. capital changes — confirming we *don't* need notary for tegningsoptioner grants themselves (we don't think we do), only for the underlying capital authorization.
4. **Ejerregistret reporting trigger** — what threshold triggers a re-filing? 5% is the disclosure, but at what events?
5. **Template language requirements** — must templates be Danish, or can English-language templates between Danish parties be enforceable? (Affects how we handle bilingual companies.)

---

## 3. Pack: Norway (`no-as` and `no-asa`)

### 3.1 Identifiers and authorities

| | NO |
|---|---|
| Registry | **Brønnøysundregistrene** (Brønnøysund Register Centre) — specifically **Foretaksregisteret** for companies |
| Registry portal | brreg.no |
| Company identifier | **Organisasjonsnummer** — 9 digits, e.g. `123 456 789` |
| Identifier validation | 9 numeric digits; mod-11 check digit |
| Beneficial owner registry | **Aksjeeierregisteret** (Shareholder Registry) — partially public via Brønnøysund |
| Governing statutes | **Aksjeloven** (Companies Act 1997, for AS); **Allmennaksjeloven** (for ASA) |
| Tax authority | **Skatteetaten** |
| Tax statute for options | **Skatteloven § 5-14** (default option taxation) + **Opsjonsskatteordningen for små selskaper** (favorable scheme since 2022, reformed 2022-01-01) |

### 3.2 Entity types in this pack

**AS (Aksjeselskap — private limited company)** — the SMB/startup default
- Aksjekapital minimum: **30 000 NOK** (since 2012 reform; was 100k before)
- Mandatory styre (board) — single director allowed
- Most common Tier-1 ICP entity

**ASA (Allmennaksjeselskap — public limited company)** — for public/listed
- Aksjekapital minimum: **1 000 000 NOK**
- Multiple share classes, public-trading-ready governance
- Rare for our ICP but included for completeness and for companies preparing IPO

### 3.3 Instrument catalog [counsel review]

| Local name | English equivalent | Category | Allowed in | Notes |
|---|---|---|---|---|
| **Aksjer** | Shares | equity-unit | AS, ASA | Multiple classes (A/B) permitted; common in VC-backed companies. |
| **Opsjoner** | Options | option-like | AS, ASA | Employee options. Tax treatment depends on whether eligible for opsjonsskatteordningen (see §3.4). |
| **Tegningsretter** | Subscription rights / warrants | option-like | AS, ASA | Investor warrants typically; legally distinct from employee opsjoner but mechanically similar. |
| **Konvertibelt lån** | Convertible loan | convertible | AS, ASA | Debt convertible to aksjer on trigger event. |
| **Tildelte aksjer (RSU-like)** | Restricted stock units | option-like (synthetic) | AS, ASA | Less common than US but used by some scaleups; treated as employment income on vest by default. |

### 3.4 Tax-favorable scheme: Opsjonsskatteordningen for små selskaper [counsel review]

The Norwegian equivalent of UK EMI or DK § 7P — a favorable tax regime for options in small companies. Implemented 2022, reformed and significantly expanded since.

**What it does:** under the scheme, the employee is taxed only on **capital gains at sale** (≈ 37.84% effective rate for shares in 2026), not on income at exercise (which would otherwise be ~47% as employment income + employer's social security).

**Eligibility (must all hold) — encode as validators:**

| Constraint | Limit |
|---|---|
| Company average employees (prior year) | < 50 |
| Company total balance sheet (prior year) | < 80 000 000 NOK |
| Company annual revenue (prior year) | < 80 000 000 NOK |
| Company age | < 10 years from incorporation |
| Excluded industries | Financial activities, insurance, real estate, mining, oil/gas extraction, legal/accounting services, consulting (some carve-outs) |
| Per-employee grant value cap (lifetime) | 3 000 000 NOK at grant valuation |
| Per-company grant cap | 60 000 000 NOK total outstanding under the scheme |
| Employee work requirement | ≥ 25 hours/week, ≥ 12 months in company |
| Notification to Skatteetaten | Required within 1 month of grant |

**UX implication (mirror of DK):** the grant modal asks "Should this grant fall under opsjonsskatteordningen?" and validates company-level eligibility live. If company fails (e.g. balance sheet over 80M NOK), flag *before* signing. Surface the Skatteetaten notification deadline as a calendar reminder.

**Note:** the scheme rules changed in 2022 and have been refined; rules I'm working from are as of my knowledge cutoff and need counsel confirmation against current Skatteetaten guidance.

### 3.5 Validation rules

```
- AS: aksjekapital ≥ 30 000 (currency=NOK)
- ASA: aksjekapital ≥ 1 000 000 (currency=NOK)
- Organisasjonsnummer: /^\d{9}$/ + mod-11 check
- Transaction.date ≤ today + 30d
- Pool reservation requires styreprotokoll (board minutes) attached
- Opsjonsskatteordningen-marked grant requires:
    company.avg_employees_prior_year < 50
    company.balance_sheet_prior_year < 80_000_000 NOK
    company.revenue_prior_year < 80_000_000 NOK
    company.age_years < 10
    company.industry NOT IN excluded_list
    grant.value_at_grant ≤ (3_000_000 - sum_existing_scheme_grants_for_this_employee)
    company.total_outstanding_scheme_value ≤ 60_000_000 NOK
- ASA share class issuance requires generalforsamling resolution document
- Capital increase requires vedtekter version bump
```

### 3.6 Document templates [counsel review — every template]

| Template | When generated | Legal reference | Notes |
|---|---|---|---|
| **Aksjeeierbok** | On any change to ownership; on-demand export | Aksjeloven § 4-5 | Mandatory shareholder register, equivalent of DK ejerbog. |
| **Opsjonsavtale** | At grant of opsjoner | Aksjeloven § 11-12 + Skatteloven § 5-14 (or opsjonsskatteordningen if applicable) | Includes scheme-specific clauses when eligible. |
| **Styreprotokoll (board minutes)** | On board-approved actions | Aksjeloven § 6-29 | Minimal board minutes template. |
| **Generalforsamlingsprotokoll** | On shareholder resolution (capital increase, class change) | Aksjeloven §§ 5-15 ff. | Shareholder meeting minutes. |
| **Beslutning om kapitalforhøyelse** | On capital increase | Aksjeloven §§ 10-1 ff. | Capital increase resolution. |
| **Konvertibelt låneavtale** | At issuance of convertible loan | Aksjeloven §§ 11-1 ff. | Loan + conversion terms. |
| **Vedtekter (articles) — patch** | At any vedtekter change | Aksjeloven § 2-2 | Diff against existing vedtekter. |
| **Melding til Skatteetaten — opsjonsskatteordningen** | At grant under the scheme | Skatteforvaltningsloven | The mandatory notification document. We generate; founder files (no API in v1). |
| **Melding til Foretaksregisteret** | On registrable events | Foretaksregisterloven | Documentation founder gives to lawyer for actual filing. |

### 3.7 Defaults that just work [counsel review]

For an AS chosen at onboarding:
- Aksjekapital: 30 000 NOK
- Aksjer issued: 30 000 (1 NOK pålydende per aksje) — keeps math simple
- Currency: NOK
- Option pool: 0 reserved
- Vesting default: 4 år / 12 mnd cliff
- Default opsjon tax flag: opsjonsskatteordningen-eligible (subject to company-level validation)

### 3.8 Legal/research questions for counsel before launch [counsel review]

1. **Opsjonsskatteordningen "grant value" computation** — fair market valuation for non-listed AS. Default to board valuation or require independent? Affects defensibility.
2. **Currently-effective scheme parameters** — limits change frequently (50 employees, 80M balance sheet, 3M per-employee). Need a confirmed-as-of-2026 set of numbers.
3. **Industry exclusion list interpretation** — "consulting" and "legal/accounting" are partially excluded with carve-outs; need precise list.
4. **Tildelte aksjer (RSUs) tax treatment** — confirm default treatment as employment income on vest, and whether scheme covers them.
5. **Template language requirements** — bokmål vs nynorsk; what's required vs. what's customary. Our default bokmål — confirm acceptable.
6. **ASA inclusion in v1** — confirming demand. If zero/near-zero Tier-1 ICP demand, we could ship AS only and add ASA in pack v0.2.

---

## 4. DK vs NO comparison (for engineering reference)

| Dimension | DK | NO |
|---|---|---|
| Default SMB entity | ApS | AS |
| Min capital (default entity) | 40 000 DKK | 30 000 NOK |
| Identifier | CVR-nr (8 digits) | Organisasjonsnummer (9 digits) |
| Registry | Erhvervsstyrelsen | Foretaksregisteret (Brønnøysund) |
| Mandatory ownership register | Ejerbog (§ 50) | Aksjeeierbok (§ 4-5) |
| Beneficial owner threshold | 5% (Ejerregistret) | 25% (Aksjeeierregisteret, refined rules) |
| Favorable employee option scheme | Ligningsloven § 7P | Opsjonsskatteordningen for små selskaper |
| Scheme eligibility complexity | Moderate (salary ratio test) | High (multi-dimensional company test) |
| Notary required for grants? | No (only for capital changes) | No (only for capital changes) |
| Multiple share classes common? | Rare in ApS, common in A/S | Common in AS once VC-backed |
| Currency | DKK | NOK |
| Template language (default) | Danish | Norwegian bokmål |
| Filing automation in v1 | No (founder/lawyer files) | No (founder/lawyer files) |

**Engineering implication:** the packs share ~70% of their structure (instrument categories, document template shapes, validation framework). The differences are concentrated in: tax scheme validation, instrument naming/labels, statute references on templates, registry integration shape, currency. A clean abstraction in the pack loader means adding country pack #5/#6/#7 becomes mechanical.

---

## 5. Master open-questions list (must be resolved before any pack ships)

Consolidated from §2.8 and §3.8 so a counsel can work through them in one pass:

### DK counsel questions
1. § 7P "value at grant" — board valuation acceptable as default? What evidence threshold?
2. Differenceaktier accounting treatment (IFRS 2 vs Danish GAAP) — do we surface accounting cost?
3. Notary boundary — confirm tegningsoptioner grants don't require notary
4. Ejerregistret re-filing trigger events
5. Template language enforceability (Danish vs English)
6. Default vesting (4y/1y) defensibility under DK norms

### NO counsel questions
1. Opsjonsskatteordningen "grant value" — board valuation defensible?
2. Currently-effective scheme parameters (50/80M/3M as of 2026)
3. Industry exclusion list — precise interpretation
4. Tildelte aksjer (RSU) default tax treatment
5. Bokmål vs nynorsk requirements
6. ASA inclusion in v1 — demand evidence
7. Notification-to-Skatteetaten format — what we generate vs what founder must produce

### Cross-pack questions
1. Template versioning and grandfathering: when DK § 7P rules change in 2027, what happens to a 2026 grant? (Already in §1 — confirm approach.)
2. Bilingual templates (DA/NO + EN) — which language is the "binding" version for enforceability?
3. Counsel review cadence: do we re-audit packs annually, or trigger-based on statute change?

---

## 6. What ships when

**Pack v0.1 (this doc):** the spec, ready for counsel review and engineering planning.

**Pack v0.2 (post-counsel review):** templates rewritten in production Danish/Norwegian by qualified counsel, scheme validators confirmed against current statute, edge cases (multi-class A/S, ASA, bilingual companies) clarified.

**Pack v0.3 (post-launch, demand-driven):** filing automation (Erhvervsstyrelsen + Brønnøysund APIs), advanced scenarios (multi-class share recapitalization templates), accounting-grade exports if customers ask.

---

## 7. Cost & timeline estimate (rough)

For each of DK and NO:
- **Counsel review of this v0.1 spec + template drafting:** ~40–80 hours of senior corporate lawyer time per pack. At Nordic senior partner rates (~2 000 EUR/hour outside firms, ~1 000 EUR for boutique), that's roughly **80–160 k DKK per pack** if outsourced. Cheaper via an in-house counsel or a friendly firm interested in the partnership angle.
- **Engineering:** ~2 weeks per pack to wire up instrument catalog, validators, templates, localization. Maybe less if the pack abstraction is clean from day one.
- **Calendar time before pack-ready-to-ship:** 6–10 weeks per pack, parallelizable.

For US and UK (out of scope for this doc but flagged for planning): US is the most spec-heavy due to ISO/NSO/RSA/SAFE diversity and 409A requirements; UK is dominated by EMI scheme rigor. Both likely heavier than DK or NO individually.

---
