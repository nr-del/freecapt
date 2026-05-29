# Country packs: United Kingdom + United States (v0.1)

**Version:** 0.1
**Date:** 2026-05-26
**Audience:** Nicolai + engineering
**Scope discipline:** SMB-calibrated. We ship what bootstrapped/family/small-SaaS founders actually use. Enterprise-only complexity (multiple preferred classes at incorporation, anti-dilution variants, ASC 718-grade accounting, warrant coverage at issuance) is deliberately *not* in these packs — those reappear when a real customer asks. Counsel-review markers used sparingly, only on items where the founder personally bears tax consequences if we're wrong.

---

## 1. Pack: United Kingdom (`uk-ltd`)

The UK SMB scene runs on one entity (private limited company) and one option scheme that founders genuinely care about (EMI). Get those two right and we cover ~90% of UK Tier-1 ICP need.

### 1.1 Identifiers and authorities

| | UK |
|---|---|
| Registry | **Companies House** |
| Registry portal | gov.uk/government/organisations/companies-house |
| Company identifier | **Company number** — 8 chars, e.g. `12345678` or `SC123456` (Scotland) |
| Identifier validation | 8-character alphanumeric; pattern depends on jurisdiction within UK (`SC` prefix for Scotland, `NI` for Northern Ireland, numeric for E&W) |
| Governing statute | **Companies Act 2006** |
| Tax authority | **HMRC** |
| Key tax scheme | **EMI** — Enterprise Management Incentives (Schedule 5, ITEPA 2003) |

### 1.2 Entity types in this pack

**Ltd (private limited company)** — the SMB default
- No minimum share capital (£0.01 nominal share value is legal and common)
- Single director permitted
- No mandatory audit below ~£10.2M turnover / 50 employees / £5.1M balance sheet (covers virtually all SMB)

**Out of v1:** PLC (public limited company — irrelevant for SMB), LLP (different beast, partnership taxation, would be its own pack), CIC (community interest company — niche).

### 1.3 Instrument catalog

The four instruments SMB founders actually use, in order of frequency:

| Local name | Category | Default? | Notes |
|---|---|---|---|
| **Ordinary shares** | equity-unit | ✓ default | Standard one-class-of-shares for founders + employees who exercise. Nominal value typically £0.01–£1.00. |
| **EMI options** | option-like | ✓ default for employee option grants | The HMRC-favored scheme. Strict eligibility (company size, employee status, valuation discipline) but enormous tax advantage — 10% CGT vs 47% income tax. See §1.4. |
| **Unapproved options** | option-like | Fallback when EMI doesn't fit | Used when company exceeds EMI limits, or for non-employees (advisors, contractors). Taxed as employment income on exercise. |
| **ASA (Advance Subscription Agreement)** | convertible | ✓ for pre-priced rounds | The UK equivalent of a SAFE. Money in now, shares converted at next priced round. SEIS/EIS-compliant variants exist; we ship the SEIS/EIS-eligible flavor as default since that's what angel investors expect. |

**Mentioned and deferred** (not in v1, model only when asked):
- **Preference shares** — show up when first VC priced round happens. Same pattern as our DK/US treatment.
- **Growth shares** — alphabet-share-style hurdle equity. UK-specific tool for founders who want to give employees "skin in the game" without diluting on day-one valuations. We support modelling them as a separate class when needed; not in v1 catalog.
- **CSOP (Company Share Option Plan)** — HMRC scheme similar to EMI but with smaller limits. Used by companies that age out of EMI. Pre-IPO/scaleup, not SMB.

### 1.4 Tax-favorable scheme: EMI

The unlock for every UK startup's employee compensation. If we don't handle EMI well, no UK founder will use us.

**What it does:** options taxed at **Business Asset Disposal Relief CGT rate (10%)** on sale instead of income tax on exercise (which would be 20–47% + NI). Materially shapes whether equity comp is worth doing.

**Eligibility (must all hold) — encode as validators:**

| Constraint | Limit |
|---|---|
| Company gross assets | < £30M |
| Company employees (FTE) | < 250 |
| Trading activity | "Qualifying trade" — most excluded list is finance, property, legal, accountancy, farming, hotels, nursing |
| Independent | Not majority-controlled by another company |
| Per-employee EMI grant value (lifetime) | £250,000 at grant valuation |
| Per-company EMI grant value (outstanding) | £3,000,000 at grant valuation |
| Employee work commitment | ≥ 25 hours/week OR ≥ 75% of working time |
| HMRC notification deadline | 92 days from grant date |
| Valuation requirement | Must agree fair market value with HMRC ("EMI valuation") before grant — typically valid 90 days |

**Product implications (the wedge):**
- Grant modal asks "EMI eligible?" up front. If yes, runs all company-level + employee-level checks before allowing the grant.
- If company-level check fails (e.g., crossed £30M assets), warning + automatic fallback to unapproved options with the tax difference clearly stated.
- 92-day HMRC notification surfaces as a calendar reminder on the company dashboard with **D-90 / D-30 / D-7** warnings.
- **EMI valuation** is the big one — HMRC requires agreeing a share value before grant. We don't do EMI valuations (different product). We accept the agreed value, store the HMRC reference, surface "valuation expires in X days" warnings. **[counsel review]** because mis-handling this is the founder's personal-money problem.

### 1.5 Validation rules

```
- Ltd: aksjekapital/share capital — no minimum (default to 100 ordinary shares × £0.01 = £1.00 issued capital, founders split as needed)
- Company number: /^([A-Z]{2})?\d{6,8}$/ + pattern validation
- Transaction.date ≤ today + 30d
- EMI-marked grant requires:
    company.gross_assets < 30_000_000 GBP
    company.fte < 250
    company.industry NOT IN emi_excluded_list
    company.parent_company IS NULL OR company.parent.holds_minority
    grant.value_at_grant ≤ (250_000 - sum_existing_emi_for_this_employee_lifetime)
    company.total_outstanding_emi_value ≤ 3_000_000 GBP
    employee.weekly_hours ≥ 25 OR employee.working_time_percent ≥ 75
    grant.hmrc_valuation_reference IS NOT NULL
    grant.hmrc_valuation_date ≥ grant.date - 90 days
- ASA conversion event triggers automatic share issuance per agreement terms
```

### 1.6 Document templates

| Template | When generated | Notes |
|---|---|---|
| **Register of Members** | On ownership change; on-demand | Statutory under Companies Act 2006 s.113. Our generated version is the source of truth. |
| **Register of Allotments** | On any share allotment | s.554 — must be filed within 1 month. |
| **EMI Option Agreement** | At EMI grant | Includes all required EMI scheme language. |
| **Unapproved Option Agreement** | At unapproved grant | Standard option agreement, no scheme reference. |
| **ASA (SEIS/EIS-compliant)** | At ASA issuance | We default to SEIS/EIS-friendly; toggle for non-compliant version. |
| **Board Minutes** | On board approvals (pool reservation, grants, allotments) | Companies Act 2006 s.248. |
| **Share Certificate** | On allotment | Customer-facing PDF the shareholder gets. |
| **Articles of Association — patch** | On articles changes | Model Articles default; patch tracks differences. |
| **SH01 (return of allotment)** | For Companies House filing | We generate; founder/accountant files. No API in v1. |

### 1.7 Defaults that just work

For a UK Ltd. chosen at onboarding:
- Share capital: 100 ordinary shares × £0.01 = £1.00 issued
- Default share class: Ordinary
- Currency: GBP
- Articles: Model Articles (Companies Act default, no customization)
- Option pool: 0 reserved (founder explicitly creates one — typical first set-up is 10% post-seed)
- Vesting default: 4 years / 12-month cliff (UK convention has caught up with US)
- Default option type for employees: EMI (with fallback validation)

### 1.8 Open items

- **EMI valuation flow** — do we partner with someone (Vestd, SeedLegals, RSM, etc.) for valuation referral, or just accept the founder-supplied number? Affects whether we earn affiliate revenue. **[counsel review]** for the disclaimer language we use when accepting.
- **HMRC SH01 / EMI 1 filing automation** — Companies House has an API; deferred to v2 country pack revision.
- **SEIS/EIS advance assurance flow** — adjacent but not core. Investors love it. Deferred unless customers ask.

---

## 2. Pack: United States (`us-de-ccorp` and `us-de-llc`)

Two distinct entity types in one pack because they share so much of the surrounding US infrastructure (Delaware specifically, federal tax overlay, common counsel ecosystem). Other states (CA, NY, TX) deferred — Delaware covers ~70% of US startup formations and ~95% of anyone who'll eventually take outside money.

### 2.1 Identifiers and authorities

| | US |
|---|---|
| Primary registry | **Delaware Division of Corporations** (state-level) |
| Federal identifier | **EIN** — Employer Identification Number, 9 digits formatted `XX-XXXXXXX` |
| State identifier | **Delaware File Number** — 7 digits |
| Governing law | **Delaware General Corporation Law (DGCL)** for C-Corps, **Delaware Limited Liability Company Act (DLLCA)** for LLCs |
| Federal tax authority | **IRS** |
| Key tax provisions | **IRC § 422** (ISOs), **IRC § 83(b)**, **IRC § 409A** (deferred comp / strike price valuation), **IRC § 1202** (QSBS — capital gains exclusion for qualifying C-Corp stock) |

### 2.2 Entity types in this pack

**Delaware C-Corp** — the default for any company that will raise outside money
- No minimum capital
- Standard authorized: 10,000,000 shares of common stock at $0.00001 par value
- Required: Certificate of Incorporation, Bylaws, Board of Directors
- Used by ~95% of US startups taking VC money

**Delaware LLC** — the default for bootstrapped / family / holding cos that won't raise VC
- No minimum capital
- Structure: Membership interests instead of shares; managed via Operating Agreement
- Pass-through taxation by default (members taxed on company income directly)
- Used by SMB owners, real estate holdcos, family offices, agencies — **directly hits Nicolai's Tier-1 ICP**

These are fundamentally different products from a tax/legal standpoint, but they share the same Capframe ledger surface (people own units of something; transactions move those units around).

### 2.3 Instrument catalog — C-Corp

| Local name | Category | Default? | Notes |
|---|---|---|---|
| **Common stock** | equity-unit | ✓ default | The founder/employee class. |
| **ISO (Incentive Stock Option)** | option-like | ✓ default for employees | IRC § 422 — favorable tax IF exercise + holding rules met. Employees only, $100k annual vest limit. |
| **NSO (Non-qualified Stock Option)** | option-like | Default for non-employees | Used for advisors, contractors, board members, employees over the ISO limit. Taxed as income at exercise on spread. |
| **RSA (Restricted Stock Award)** | equity-unit (with vesting) | For early-stage founders | Actual shares issued upfront with reverse vesting (buyback). Common founder structure to lock in clock for capital gains. **83(b) election** required within 30 days — we surface this as a hard deadline. |
| **SAFE (post-money YC standard)** | convertible | ✓ default for pre-priced | Y Combinator post-money SAFE only. No pre-money SAFE in v1. Convertible into preferred at next priced round (which is out of v1 anyway). |

**Mentioned and deferred:**
- **Preferred stock (Series Seed / A / B)** — appears when the customer raises a priced round. v1 doesn't model preferred at incorporation. When customers reach the point of needing it, pack revs.
- **Warrants** — investor-side, rare in SMB.
- **Phantom stock** — synthetic, not commonly used in C-corps.
- **Restricted Stock Units (RSUs)** — typically late-stage / public-track, not SMB-relevant.

### 2.4 Instrument catalog — LLC

LLCs have their own equity vocabulary and tax treatment that doesn't map cleanly to C-Corp instruments. Founders coming from a C-Corp background often confuse the terminology.

| Local name | Category | Default? | Notes |
|---|---|---|---|
| **Membership units (capital interest)** | equity-unit | ✓ default | Equivalent to "shares" of an LLC. Default class is "Common Units" or "Class A Units." |
| **Profits interests (Class B / Carry units)** | equity-unit (with hurdle) | ✓ default for employee equity | The LLC-equivalent of options-as-incentive. Granted with a hurdle value = company's current value, so the grantee only shares in future appreciation. Tax-free at grant if structured per Rev. Proc. 93-27. Big advantage over options for LLCs. |
| **Options on units** | option-like | Rare | Used occasionally when company specifically wants exercise mechanics. Less common than profits interests for SMB LLCs. |
| **Convertible note** | convertible | ✓ for early money | LLCs rarely take SAFEs (SAFE structure assumes preferred stock conversion, which LLCs don't have natively). Convertible notes are the usual instrument. |

### 2.5 Tax-favorable schemes (US)

Two big ones for SMB founders to know about — surface them in the grant modal where applicable:

**§ 83(b) election (RSAs and profits interests)**
- Election to recognize ordinary income on grant date instead of on each vesting event
- **Strict 30-day deadline from grant** — if missed, founders pay income tax at fair market value as it vests, instead of $0 at grant
- We surface a hard D-25 / D-10 / D-5 / D-2 reminder cascade for every RSA grant and profits interest grant
- Generate the 83(b) election letter as a downloadable template ready to mail to IRS

**§ 1202 QSBS (Qualified Small Business Stock)**
- C-Corp only, gross assets < $50M at issuance, qualifying trade, etc.
- **100% capital gains exclusion on up to $10M of gain** (or 10× basis) if held 5+ years
- Founders who don't know about QSBS leave staggering amounts of money on the table
- Surface in the cap table view: per-stakeholder QSBS-eligible badge with "you've held this for X years; Y until QSBS-eligible" — small UI touch, huge value

**409A (strike price valuation)**
- Required for any option grant — strike price must be ≥ fair market value
- Common practice: pay $1k–$2k for a 409A valuation annually
- We **don't compute 409A** (different product entirely). We accept a number, store the valuation reference + date, and surface a "valuation expires in 90 days" warning so the founder knows to refresh before granting again
- Partner referral angle for valuation services (Carta, Pulley, AngelList all monetize this — we don't yet)

### 2.6 Validation rules

```
# C-Corp
- DE C-Corp: no minimum capital; default 10M authorized common at $0.00001 par
- EIN: /^\d{2}-\d{7}$/
- ISO grant requires:
    grantee.employee_status = true
    grant.strike_price ≥ company.fmv_at_grant_date
    company.current_year_iso_vest_value + grant.first_year_vest ≤ 100_000 USD per grantee
- NSO grant: no eligibility constraints beyond strike ≥ FMV
- RSA grant triggers 83(b) reminder cascade
- SAFE: cap, discount, MFN flags; YC post-money only

# LLC
- DE LLC: no minimum capital; default 1,000,000 Class A units at $0.01 each
- Profits interests grant requires:
    grant.hurdle_value = company.fmv_at_grant_date (Rev. Proc. 93-27 compliance)
    grant.tax_election_filed = true (within 30 days, OR safe-harbor per Rev. Proc. 2001-43)
```

### 2.7 Document templates

**C-Corp:**
| Template | When generated | Notes |
|---|---|---|
| **Capitalization Table (board-resolution format)** | On-demand export | Legal-grade PDF; standard format for board books and DD. |
| **Stock Purchase Agreement (Founders)** | At founder common stock issuance | RSA-style with reverse vesting. |
| **Stock Option Grant Agreement (ISO)** | At ISO grant | Includes ISO-specific language. |
| **Stock Option Grant Agreement (NSO)** | At NSO grant | |
| **RSA Award Agreement** | At RSA grant | Vesting + 83(b) prompt. |
| **83(b) Election Letter** | At RSA / profits interest grant | Pre-filled, ready to mail. |
| **YC Post-Money SAFE** | At SAFE issuance | YC's standard template, parameters populated. |
| **Board Consent (Action by Unanimous Written Consent)** | On board approvals | Standard format. |
| **Stockholder Consent** | On stockholder actions | |
| **Bylaws — patch** | On bylaws changes | |
| **Certificate of Incorporation — reference** | At company creation | We don't generate this (filed at incorporation); we link to it. |

**LLC:**
| Template | When generated | Notes |
|---|---|---|
| **Operating Agreement — patch** | On membership changes | Tracks changes to operating agreement; we don't generate full OA. |
| **Membership Interest Grant** | At unit issuance | |
| **Profits Interest Grant Agreement** | At profits interest grant | Includes Rev. Proc. 93-27 / 2001-43 language. |
| **83(b) Election Letter (profits interests)** | At profits interest grant | |
| **Member Consent (in lieu of meeting)** | On member approvals | |
| **Unit Certificate** | Optional | Many LLCs don't issue physical certificates. |

### 2.8 Defaults that just work

**C-Corp at onboarding:**
- Authorized: 10,000,000 common shares × $0.00001 par
- Founders allocated as specified, balance reserved for pool + future issuance
- Default option pool: 0 reserved (founder explicitly creates; typical first reserve is 10% post-seed)
- Vesting default: 4 years / 12-month cliff / monthly thereafter
- Default option type for employees: ISO with NSO fallback when $100k annual limit exceeded
- 409A valuation: founder enters; we don't compute

**LLC at onboarding:**
- 1,000,000 Class A (Common) units × $0.01 capital contribution per unit
- Founders allocated as capital interests
- Default for employee equity: Profits interests with hurdle = company FMV at grant
- Vesting default: 4 years / 12-month cliff
- No 409A (LLCs are pass-through; valuation matters only for profits interest hurdle)

### 2.9 Open items

- **409A partner referral** — Carta and Pulley make material revenue here ($1.5k–$3k per valuation). Long-term opportunity; not in v1, not even in v2 unless customer pulls.
- **State-level entities beyond Delaware** — California (entity-formation popular for in-state companies), Nevada, Wyoming. Deferred. Most companies that will ever raise money convert to Delaware anyway.
- **Federal blue-sky / state securities filings** — Form D, state notices. Out of v1; founder/lawyer handles.
- **EIN application flow** — IRS SS-4 process. Out of v1.

---

## 3. UK vs US comparison (engineering reference)

| Dimension | UK Ltd. | US DE C-Corp | US DE LLC |
|---|---|---|---|
| Min capital | £0 (typically £1) | $0 | $0 |
| Default issued at setup | 100 × £0.01 ordinary | 10M auth, 0 issued until grants | 1M Class A units |
| Identifier | Co. number 8 chars | EIN 9 digits + DE file # | EIN 9 digits + DE file # |
| Mandatory ownership register | Register of Members (CA 2006 s.113) | Capitalization Table (board record) | Membership ledger (per OA) |
| Favorable employee equity scheme | EMI (HMRC) | ISO (IRC § 422) | Profits interests (Rev. Proc. 93-27) |
| Scheme eligibility complexity | High (multi-dim company test + valuation discipline) | Moderate (employee status + $100k limit + FMV) | Low (Rev. Proc. structure compliance) |
| Tax election deadline | EMI notification: 92 days | 83(b): 30 days from grant | 83(b): 30 days from grant |
| FMV valuation required | EMI valuation (HMRC-agreed, ~90d shelf life) | 409A (~12 month shelf life) | None for tax; needed for hurdle compliance |
| Currency | GBP | USD | USD |
| Notary required? | No | No | No |
| Filing automation in v1 | No (founder/accountant) | No (founder/lawyer) | No |
| Common SMB confusion source | EMI vs unapproved (eligibility) | ISO vs NSO (when does each apply) | Profits interests vs capital interests (when does each apply) |

**Engineering implication:** UK Ltd. + US C-Corp share ~60% pack structure (option-with-strike model, time-based vesting, similar transaction event shapes). US LLC is the structural outlier — profits interests with hurdle values, pass-through taxation context, different ledger event shapes. Worth building the LLC pack second so the abstraction we land on has handled the easy case (C-Corp) before tackling the asymmetric one (LLC).

---

## 4. Master open-questions list

### UK
1. **EMI valuation partner referral** — partner with someone (Vestd / SeedLegals / RSM) for affiliate revenue, or just accept the founder-supplied number with a clear "this is your number" disclaimer?
2. **CSOP support** — known-and-deferred; trigger to build is post-launch customer ask.
3. **Growth shares** — known-and-deferred; some UK founders care a lot, most don't.

### US
1. **409A partner referral** — same question as EMI. Big revenue opportunity for incumbents.
2. **QSBS surfacing in UI** — should the cap table view show per-stakeholder QSBS-eligible status and countdown to 5-year holding period? Adds founder-value but feels enterprise-y.
3. **State expansion** — when do we add CA / NY / TX / WY entity types? Trigger to build is customer ask.
4. **Operating Agreement template for LLCs** — generate full OA or just patch? Full OA is high-stakes; patches are lower-risk and match our v1 approach for UK articles + DK vedtægter.

### Cross-pack
1. **Multi-jurisdiction founder** — a founder personally based in UK who owns a US C-Corp. How does account language + corporate jurisdiction interact? (Already handled by §5.16 in the main scope doc — language ≠ jurisdiction. Confirming the implementation matches.)
2. **Currency display in mixed contexts** — if a Norwegian VC invests in a UK Ltd. via ASA, does the cap table show NOK or GBP for that contribution? Default: company-currency for the ledger, original-currency in a sub-field for record.

---

## 5. What ships when

**Pack v0.1 (this doc):** spec ready for engineering planning. Templates can be drafted in-house at SMB-quality (Nicolai's call — he has the domain expertise to validate them himself or with a friendly counsel touchpoint, not a 40-hour external review per pack).

**Pack v0.2 (post-soft-launch):** revisions based on actual customer usage and any edge cases that come up. Add CSOP / growth shares to UK if pulled; add Preferred stock to US C-Corp pack when first customer raises.

**Pack v0.3 (when revenue justifies):** Companies House SH01 / EMI 1 filing automation for UK; QSBS clock-tracking dashboard for US; 409A / EMI valuation partner integration.

---

## 6. Summary: four packs at launch

| Pack | Entity types | Headline favorable scheme | SMB readiness |
|---|---|---|---|
| `dk` | ApS, A/S | Ligningsloven § 7P | High — Nicolai's home market expertise |
| `no` | AS, ASA | Opsjonsskatteordningen | High — ~70% reuse from DK pack |
| `uk` | Ltd. | EMI | High — one entity, one scheme to nail |
| `us` | DE C-Corp, DE LLC | ISO + § 1202 (C-Corp), Profits interests + Rev. Proc. 93-27 (LLC) | Medium — two distinct entity types to ship in one pack |

Total v1 scope: **four packs, six entity types, four favorable-tax schemes, ~38 document templates.** Substantial but bounded.

---
