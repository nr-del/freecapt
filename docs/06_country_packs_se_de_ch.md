# Country packs: Sweden + Germany + Switzerland (v0.1)

**Version:** 0.1
**Date:** 2026-05-27
**Audience:** Nicolai + engineering
**Scope discipline:** SMB-calibrated per [[feedback-smb-rigor]]. Light counsel-review markers, opinionated defaults, focused on what bootstrapped/family/small-SaaS founders actually need. Three packs in one doc because there's real cross-pack pattern overlap (Nordic shape, DACH legal heritage, German-language Switzerland).

---

## 1. Pack: Sweden (`se-ab`)

The most Nordic-shaped of the three — closer in feel to NO and DK than to DACH. One entity (AB) covers the SMB world; QESO is the equivalent of the Nordic favorable option scheme. If you've built the NO pack, the SE pack is ~75% mechanical translation.

### 1.1 Identifiers and authorities

| | SE |
|---|---|
| Registry | **Bolagsverket** (Swedish Companies Registration Office) |
| Registry portal | bolagsverket.se |
| Company identifier | **Organisationsnummer** — 10 digits formatted `XXXXXX-XXXX`, e.g. `556677-8899` |
| Identifier validation | 10 numeric digits + Luhn check on the last digit |
| Governing statute | **Aktiebolagslagen (ABL)** — 2005:551 |
| Tax authority | **Skatteverket** |
| Key tax scheme | **Kvalificerade personaloptioner (QESO)** — Inkomstskattelagen 11a kap. |

### 1.2 Entity types in this pack

**Aktiebolag (private AB)** — the SMB default
- Aktiekapital minimum: **25,000 SEK** (reduced from 50k in 2020)
- Single director permitted (suppleant required)
- No mandatory audit below thresholds (~3 MSEK turnover / 1.5 MSEK assets / 3 employees)

**Aktiebolag (publikt AB)** — for public/listed
- Aktiekapital minimum: **500,000 SEK**
- "Publ" suffix in name
- Different governance requirements; rare for SMB

### 1.3 Instrument catalog

| Local name | English | Category | Notes |
|---|---|---|---|
| **Aktier** | Shares | equity-unit | Default class is stamaktier (ordinary). A/B classes common in VC-backed AB (different voting rights). |
| **Kvalificerade personaloptioner (QESO)** | Qualified employee stock options | option-like | The Swedish favorable scheme. See §1.4. |
| **Personaloptioner (non-qualified)** | Employee options | option-like | Fallback when QESO eligibility fails. Taxed as employment income at exercise — significantly worse. |
| **Teckningsoptioner** | Warrants / subscription rights | option-like | Investor warrants typically; legally distinct from personaloptioner. |
| **Konvertibler / Konvertibelt skuldebrev** | Convertible debt | convertible | Standard convertible loan to shares. |

**Mentioned and deferred:** preferred shares (when first VC priced round happens — until then, A/B share class differentiation handles the common SMB case).

### 1.4 Tax-favorable scheme: Kvalificerade personaloptioner (QESO)

Sweden's equivalent of NO opsjonsskatteordningen and UK EMI. Critical for any AB granting employee equity.

**What it does:** under QESO, employee taxation triggers only at sale of underlying shares, taxed as capital gains (≈30%) rather than employment income at exercise (≈55%+ marginal + employer's social fees of ~31.42%). Material.

**Eligibility (must all hold):**

| Constraint | Limit |
|---|---|
| Company average employees + group | < 150 |
| Company net turnover + group | < 280 MSEK |
| Company total balance sheet + group | < 280 MSEK |
| Company age (since registration) | < 10 years |
| Excluded industries | Banking, financial services, insurance, real estate, mining/oil/gas, legal/accounting/consulting (with carve-outs), some service-only businesses |
| Per-employee QESO grant value (lifetime) | 3,000,000 SEK at grant valuation |
| Per-company QESO scheme cap | 75,000,000 SEK in total outstanding |
| Employee work commitment | ≥ 30 hours/week for ≥ 3 years before exercise |
| Holding period before exercise | 3 years from grant |
| Holding period after exercise | None required, but capital gains rates apply |

**Product implications:** same pattern as NO opsjonsskatteordningen — eligibility validators run live on grant, mismatch surfaces *before* signing. The 3-year exercise rule means the UI surface needs to clearly show "earliest exercise: 2029-04-12" for a 2026 grant.

### 1.5 Validation rules

```
- AB privat: aktiekapital ≥ 25_000 SEK
- AB publikt: aktiekapital ≥ 500_000 SEK
- Organisationsnummer: /^\d{6}-\d{4}$/ + Luhn check
- Transaction.date ≤ today + 30d
- QESO-marked grant requires:
    company.employees + group_employees < 150
    company.turnover < 280_000_000 SEK
    company.balance_sheet < 280_000_000 SEK
    company.age_years < 10
    company.industry NOT IN qeso_excluded_list
    grant.value_at_grant ≤ (3_000_000 - sum_existing_qeso_for_employee)
    company.total_qeso_outstanding ≤ 75_000_000 SEK
    employee.hours_per_week ≥ 30
    exercise.date ≥ grant.date + 3 years
```

### 1.6 Document templates

| Template | When generated | Legal reference |
|---|---|---|
| **Aktiebok** | On ownership change; on-demand | ABL 5 kap. — mandatory shareholder register |
| **Personaloptionsavtal (QESO)** | At QESO grant | Includes scheme-specific language and 3-year holding clause |
| **Personaloptionsavtal (non-qualified)** | At non-QESO grant | Standard option agreement |
| **Teckningsoptionsavtal** | At warrant issuance | |
| **Konvertibelt skuldebrev** | At convertible issuance | |
| **Bolagsstämmoprotokoll** | On shareholder resolutions | |
| **Styrelseprotokoll** | On board approvals | |
| **Bolagsordning — patch** | On articles changes | |

### 1.7 Defaults

For a private AB:
- Aktiekapital: 25,000 SEK
- Aktier issued: 25,000 × 1 SEK kvotvärde = 25,000 SEK total
- Currency: SEK
- Default option type for employees: QESO (subject to company-level validation)
- Vesting default: 4 år / 12 månaders cliff (Nordic norm)
- Template language: Swedish

---

## 2. Pack: Germany (`de-gmbh` and `de-ag`)

Germany is the structurally hardest pack we ship at launch. Two reasons:

1. **The notary requirement.** Any transfer of *Geschäftsanteile* (GmbH shares) requires a Notar (notary) — by law. This is not a checkbox in our UI; it's a real-world physical process. A founder issuing a grant of *real* shares can't just click "issue" — they need a notary appointment. Our product surface has to acknowledge this reality.
2. **The VSOP workaround.** Because real share transfers are notary-heavy and expensive, the German startup ecosystem has converged on **Virtual Stock Option Plans (VSOPs)** — virtual, cash-settled options that don't trigger notary involvement. They are tax-disadvantaged (taxed as ordinary employment income on payout), but operationally workable. Most SMB equity comp in Germany is VSOP, not real options.

Get these two right and the rest is mechanical.

### 2.1 Identifiers and authorities

| | DE |
|---|---|
| Registry | **Handelsregister** (commercial register, at local Amtsgericht) — GmbH in HRB, AG also in HRB |
| Registry portal | handelsregister.de |
| Company identifier | **HRB-Nummer** — Format varies by Amtsgericht; typically "HRB XXXXXX" e.g. "HRB 12345 B" (the "B" indicates Berlin court) |
| Identifier validation | Pattern: `HRB\s+\d+(\s+[A-Z])?` — loose; verification via Handelsregister API where available |
| Governing statutes | **GmbHG** (GmbH-Gesetz) for GmbH; **AktG** (Aktiengesetz) for AG |
| Tax authority | **Finanzamt** (regional) + Bundesfinanzhof rulings |
| Key tax provisions | **§ 19a EStG** (Mitarbeiterkapitalbeteiligung — reformed 2024, limited utility); **§ 3 Nr. 39 EStG** (general employee equity exemption — 2,000 EUR/year) |
| Notary requirement | **§ 15 GmbHG** — share transfers must be notarized (Beurkundung) |

### 2.2 Entity types in this pack

**GmbH (Gesellschaft mit beschränkter Haftung)** — the SMB default by far
- Stammkapital minimum: **25,000 EUR** (with 12,500 EUR paid in at registration)
- Founder shares = Geschäftsanteile (quotas, not "shares" in the Anglo sense)
- **UG (Unternehmergesellschaft)** is a sub-variant — 1 EUR minimum stammkapital, must accumulate retained earnings until it reaches 25k EUR to convert to GmbH. We treat UG as a flag on GmbH at v1.

**AG (Aktiengesellschaft)** — for VC-backed scaleups and IPO-track companies
- Grundkapital minimum: **50,000 EUR**
- True shares (Aktien) with classes, optional bearer/registered, transferable without notary (one of the big advantages over GmbH)
- Rare for our Tier-1 ICP but included because once a German startup is VC-funded, AG conversion is common
- More governance overhead (Vorstand + Aufsichtsrat required)

### 2.3 Instrument catalog

| Local name | English | Category | Notes |
|---|---|---|---|
| **Geschäftsanteile (GmbH)** | GmbH quotas | equity-unit | Default class. Transfer requires notary (§ 15 GmbHG). UI surfaces a "notary appointment required" workflow on any transfer. |
| **Aktien (AG)** | Shares (AG) | equity-unit | Standard registered/bearer shares. No notary on transfer. Less common in SMB. |
| **VSOPs / Virtuelle Anteile** | Virtual stock options (phantom equity) | option-like (synthetic) | **The SMB default for employee equity.** Cash-settled, no notary, no real shares. Taxed as employment income at payout. Workable but tax-disadvantaged. |
| **Echte Optionen / Reale Optionen** | Real options (on Geschäftsanteile or Aktien) | option-like | Rare for GmbH (notary chain too cumbersome); occasionally used in AG. § 19a EStG eligibility possible if structured correctly. |
| **Wandeldarlehen** | Convertible loan | convertible | Standard convertible debt. Conversion event itself may require notary for GmbH. |
| **Mitarbeiterbeteiligung (§ 3 Nr. 39 EStG)** | Tax-free employee equity (≤ 2,000 EUR/yr) | equity-unit | Niche; small annual tax-free allowance for direct employee shareholding. |

**Mentioned and deferred:** stille Beteiligung (silent partnership), Genussrechte (participation rights) — alternative German equity instruments occasionally used but not common for SMB tech startups.

### 2.4 Notary workflow (the product reality)

Whenever a transaction involves real Geschäftsanteile transfer (issuance, transfer, conversion of Wandeldarlehen into shares):

- Grant modal flags: **"⚠ This action requires notary (Notar) involvement."**
- Founder generates the **Beurkundungsentwurf (notarization draft)** from the Capframe template.
- Founder takes draft + parties to a Notar appointment (we don't book the appointment; that's their workflow).
- After notarization, founder uploads the **notarisierte Urkunde** (notarized deed) and marks the transaction as `notary_completed: true`.
- The cap table doesn't reflect the transfer as legally effective until notary completion is recorded.

**This is a real product feature**, not just a flag. The UI distinguishes between:
- "Recorded" (the founder told us they did it)
- "Notarized" (we have the notarized deed on file)
- "Pending notary" (the draft has been generated but no notarized deed uploaded)

For VSOPs, none of this applies — they're contractual, not corporate-law transfers. This is why VSOPs are the SMB default.

### 2.5 Tax-favorable scheme: § 19a EStG (Mitarbeiterkapitalbeteiligung)

The 2024 reform expanded what was a tiny niche into something modestly useful. Still not as friendly as EMI or QESO, but worth knowing.

**What it does:** for *real* employee shares in eligible startups, taxation can be **deferred until sale, change of employer, or 15 years** (whichever first) — instead of being taxed at grant/exercise. Plus a one-time tax-free amount.

**Eligibility (must all hold):**

| Constraint | Limit |
|---|---|
| Company employees | < 1,000 |
| Company annual turnover OR balance sheet | < 100M EUR (turnover) OR < 86M EUR (balance sheet) |
| Company age | < 20 years from incorporation |
| Grant must be of **real** equity (shares or quotas) | — |
| Employee status | Standard employment relationship |

**Product implications:** this matters mostly for founders who specifically want to grant real shares (likely AG, given GmbH notary friction). The validator runs the company-size and age checks; if eligible, the grant agreement includes § 19a election language. **We treat § 19a as opt-in per grant** (founder chooses; default off because most SMB will use VSOPs anyway).

### 2.6 Validation rules

```
- GmbH: stammkapital ≥ 25_000 EUR; if UG: stammkapital ≥ 1 EUR
- AG: grundkapital ≥ 50_000 EUR
- HRB-Nummer: /^HRB\s+\d+(\s+[A-Z])?$/i
- Transaction.date ≤ today + 30d
- Geschäftsanteile transfer requires `notary_required = true` and on completion `notary_completed = true` with notarized_doc_id link
- VSOP grant has no notary requirement; vesting and strike modeled like any option
- § 19a election requires:
    company.employees < 1_000
    company.turnover < 100_000_000 EUR OR company.balance_sheet < 86_000_000 EUR
    company.age_years < 20
    grant.security_type = 'real_shares' (not VSOP)
```

### 2.7 Document templates

**GmbH:**
| Template | When | Notes |
|---|---|---|
| **Gesellschafterliste** | On any change to ownership; mandatory submission to Handelsregister after each change | The mandatory shareholder list — § 40 GmbHG. Filed with Handelsregister. |
| **Beurkundungsentwurf (notary draft) — Anteilsabtretung** | When transferring Geschäftsanteile | Draft for the notary appointment; final notarized deed gets uploaded separately. |
| **VSOP-Vereinbarung** | At VSOP grant | The default employee-equity document for SMB. Contractual, no notary. |
| **Wandeldarlehensvertrag** | At convertible loan issuance | Convertible loan contract. |
| **Gesellschafterbeschluss** | On shareholder resolutions | |
| **Gesellschaftsvertrag — patch** | On articles changes | Articles change generally requires notary. |

**AG:**
| Template | When | Notes |
|---|---|---|
| **Aktienregister** | On ownership change | Mandatory register for AG. |
| **Aktienoptionsvertrag (real)** | At real option grant | Less common; for AGs that opt into real options. |
| **VSOP-Vereinbarung** | At VSOP grant | Most common even in AGs. |
| **Hauptversammlungsprotokoll** | On shareholder meeting resolutions | |
| **Vorstandsbeschluss / Aufsichtsratbeschluss** | On board approvals | |
| **Satzung — patch** | On bylaws changes | |

### 2.8 Defaults

**GmbH:**
- Stammkapital: 25,000 EUR (12,500 EUR paid in at registration)
- One Geschäftsanteil per founder by default — we issue at 1 EUR nominal per Anteil for cleanest math
- Currency: EUR
- Default employee equity instrument: **VSOP** (with explicit "real shares" option for founders who specifically want them and accept the notary overhead)
- Vesting default: 4 Jahre / 1-Jahr Cliff (US-style is now mainstream in DE startup ecosystem)
- Template language: German

**AG:**
- Grundkapital: 50,000 EUR
- Default share class: Stammaktien
- Currency: EUR
- Default employee equity: Real Mitarbeiteroptionen with § 19a where eligible; VSOP otherwise

---

## 3. Pack: Switzerland (`ch-ag` and `ch-gmbh`)

Switzerland shares legal heritage with Germany (both rooted in civil law, similar entity names) but has its own quirks: cantonal variation, tri-lingual official languages (German + French + Italian), favorable tax treatment in many cantons, and a high concentration of well-funded founders.

For v1, we treat Switzerland as a single jurisdiction at the pack level (no per-canton differentiation in instrument catalog or document templates) and ship German as the launch UI language. French and Italian come post-launch.

### 3.1 Identifiers and authorities

| | CH |
|---|---|
| Registry | **Handelsregisteramt** (cantonal — each canton has its own; Zentraler Firmenindex (Zefix) provides federated search) |
| Registry portal | zefix.ch |
| Company identifier | **UID (Unternehmens-Identifikationsnummer)** — Format `CHE-XXX.XXX.XXX` |
| Identifier validation | UID with mod-11 check on the numeric part |
| Governing statute | **Obligationenrecht (OR)** — Title 26 governs corporations |
| Tax authority | Federal (ESTV) + Cantonal Steuerverwaltung (varies materially) |
| Key tax provisions | Cantonal income tax + federal direct tax; specific treatment for Mitarbeiteraktien per Art. 17b DBG and Mitarbeiteroptionen per Art. 17c DBG |

### 3.2 Entity types in this pack

**AG (Aktiengesellschaft)** — common for Swiss startups
- Aktienkapital minimum: **100,000 CHF**, of which **at least 20% paid in** (so 50,000 CHF effective minimum)
- Share classes (A/B with voting differentiation) common, especially post-VC
- Standard governance: Verwaltungsrat (board) required

**GmbH (Gesellschaft mit beschränkter Haftung)** — Swiss SMB default
- Stammkapital minimum: **20,000 CHF** — fully paid in
- Stammanteile (quotas), similar to German Geschäftsanteile
- **Notary requirement on transfer is LIGHTER than German GmbH** — transfer requires written form and notarized public deed only for transfers in certain configurations. Less of a product constraint than the German case, but still: any transfer requires more formality than US shares.

### 3.3 Instrument catalog

| Local name | English | Category | Notes |
|---|---|---|---|
| **Aktien (AG)** | Shares | equity-unit | Default for AG. A/B classes (Stimmrechtsaktien, Vorzugsaktien) common in funded companies. |
| **Stammanteile (GmbH)** | GmbH quotas | equity-unit | Default for GmbH. Public deed required for transfer. |
| **Mitarbeiteraktien** | Employee shares | equity-unit | Real shares granted to employees, often with vesting via shareholder agreement (not standard option contract). |
| **Mitarbeiteroptionen** | Employee options (real) | option-like | Right to buy shares at strike. Taxed at exercise if Sperrfrist conditions met. Common in AG. |
| **Wandeldarlehen** | Convertible loan | convertible | Standard convertible debt. |
| **Phantom Shares / Cash-settled options** | Synthetic equity (VSOP-equivalent) | option-like (synthetic) | Less common than in Germany — Swiss tax treatment of real Mitarbeiteroptionen is reasonable enough that synthetic instruments are less popular. |

### 3.4 Tax treatment (no single "favorable scheme" — cantonal patchwork)

Switzerland does not have a single named favorable employee-equity scheme like UK EMI or SE QESO. Instead, the tax treatment of Mitarbeiteraktien and Mitarbeiteroptionen is governed by federal law (Art. 17b–17d DBG) with cantonal practice variation.

Key principles for v1:

- **Mitarbeiteraktien with Sperrfrist (lock-up):** discount on taxable value at grant, scaled by years of lock-up (e.g., 5-year lock-up → ~25% discount on taxable value). The lock-up period is the levers — longer Sperrfrist = more favorable tax. **Our UI surfaces Sperrfrist period as a first-class field on share grants.**
- **Mitarbeiteroptionen (real):** generally taxed at exercise on spread (FMV at exercise minus strike), treated as employment income. Cantonal variation on whether taxed at grant vs. exercise (most cantons: exercise).
- **Phantom shares / VSOPs:** taxed as employment income at payout. Simple.

No single validator captures Swiss tax favorability the way EMI eligibility does for UK. Instead, we surface **educational tooltips** on the grant flow: "Sperrfrist of 5 years → estimated 25% discount on taxable grant value (cantonal practice varies)." Always with the caveat that the founder should consult their Treuhänder (tax advisor).

### 3.5 Validation rules

```
- AG: aktienkapital ≥ 100_000 CHF AND paid_in ≥ 20% (≥ 20_000 CHF)
- GmbH: stammkapital ≥ 20_000 CHF AND paid_in = stammkapital (full paid-in)
- UID: /^CHE-\d{3}\.\d{3}\.\d{3}$/ + mod-11 check on numeric portion
- Transaction.date ≤ today + 30d
- Stammanteile transfer requires `public_deed_required = true` with public_deed_doc_id on completion
- AG share transfer: no notary; just register in Aktienregister
- Mitarbeiteraktien grant: surface Sperrfrist field (years); compute estimated tax discount for educational purposes only
```

### 3.6 Document templates

| Template | When | Notes |
|---|---|---|
| **Aktienregister / Anteilsregister** | On ownership change | Mandatory share/quota register per OR. |
| **Mitarbeiteraktien-Vertrag** | At employee share grant | Includes Sperrfrist language. |
| **Mitarbeiteroptionsvertrag** | At option grant | Includes Sperrfrist and strike conditions. |
| **Öffentliche Urkunde — Anteilsabtretung (GmbH)** | At Stammanteile transfer | Public deed draft for notary. |
| **Wandeldarlehensvertrag** | At convertible loan | |
| **Statuten — patch** | On articles changes | Articles change requires public deed (notary). |
| **Generalversammlungsprotokoll** | On shareholder meeting | |
| **Verwaltungsratsbeschluss** | On board approval | |

### 3.7 Defaults

**AG:**
- Aktienkapital: 100,000 CHF, 100% paid in (founder choice; 20% allowed but 100% is conventional)
- Default share class: Stammaktien at 1 CHF nominal
- Currency: CHF
- Default employee equity: Mitarbeiteroptionen (real options on Stammaktien)
- Default Sperrfrist: 0 years (founder explicitly chooses lock-up if they want the tax discount)
- Vesting default: 4 Jahre / 1-Jahr Cliff
- Template language: German (DE-CH variant; French and Italian post-launch)

**GmbH:**
- Stammkapital: 20,000 CHF, fully paid in
- Default Stammanteile structure: one per founder
- Currency: CHF
- Default employee equity: Mitarbeiteraktien with optional Sperrfrist
- Template language: German

---

## 4. SE vs DE vs CH comparison (engineering reference)

| Dimension | SE | DE | CH |
|---|---|---|---|
| Default SMB entity | AB privat | GmbH | GmbH (smaller) or AG (funded) |
| Min capital (default entity) | 25,000 SEK | 25,000 EUR (12.5k paid in) | 20,000 CHF (full) or 100,000 CHF AG |
| Identifier | Organisationsnummer (XXXXXX-XXXX) | HRB-Nummer (HRB XXXXX) | UID (CHE-XXX.XXX.XXX) |
| Registry | Bolagsverket | Handelsregister (Amtsgericht) | Handelsregisteramt (cantonal) + Zefix federated |
| Mandatory ownership register | Aktiebok | Gesellschafterliste (GmbH) / Aktienregister (AG) | Aktienregister (AG) / Anteilsregister (GmbH) |
| Favorable employee option scheme | QESO (Kvalificerade personaloptioner) | § 19a EStG (limited utility) | None named — Sperrfrist discount mechanism |
| Notary required for share transfer | No | **YES for GmbH Geschäftsanteile**; No for AG Aktien | Public deed for GmbH Stammanteile; No for AG Aktien |
| SMB default employee equity | QESO real options | **VSOP (virtual, cash-settled)** — the workaround | Mitarbeiteroptionen (real options) — Sperrfrist for tax discount |
| Currency | SEK | EUR | CHF |
| Language(s) | Swedish | German | German default; French and Italian post-launch |
| Cantonal / federal variation | N/A | Federal | **Cantonal tax variation** — simplified at pack level in v1 |

**Engineering implications:**
- **SE pack is the easiest of the three** — Nordic-shaped, single favorable scheme to encode, no notary, no language complexity. Should ship first among the three.
- **DE pack is the hardest at launch** — notary workflow needs real product treatment (notary_required / notary_completed states on transactions), VSOP must be modeled as a distinct instrument type (not just "option" + flag), Handelsregister filing context.
- **CH pack is moderate** — language complexity (German launch; French/Italian later), Sperrfrist as a first-class field on share grants, but no single favorable scheme to encode.

---

## 5. Master open-questions list (light, per SMB calibration)

### SE
1. QESO 3-year exercise lock — confirm UI shows "earliest exercise" date clearly enough that founders don't accidentally promise unenforceable terms.
2. Group-level employee/turnover calculations for QESO eligibility when a Swedish AB has subsidiaries — simplified to "company-only" in v1; flag if it causes issues.

### DE
1. **Notary workflow operational reality** — do we partner with notary platforms (e.g., NotarDirekt, Online-Notarbüro) to streamline the founder's path, or just generate the draft and let them book on their own? Partner integration is a v2 monetization angle.
2. **VSOP vs. real option default** — confirm SMB founders will indeed default to VSOP. If a meaningful percentage want real options + § 19a for tax reasons, we may need to elevate the real-option workflow in the UI.
3. **UG (Unternehmergesellschaft) handling** — treat as flag on GmbH or as separate entity type? Choosing flag for v1; revisit if confusing.
4. **Gesellschafterliste filing** — generate the file format Handelsregister accepts (XML schema) or just PDF? PDF for v1; XML when there's customer demand.

### CH
1. **Cantonal tax variation surfacing** — for v1 we say "estimated tax outcome varies by canton" and don't model per-canton. Customer feedback will tell us whether this is enough.
2. **French and Italian UI** — committed for post-launch. Templates remain in German for v1; users can choose CH-DE / CH-FR / CH-IT in v1.1.
3. **Sperrfrist optimization guidance** — do we offer educational content on optimal Sperrfrist length, or just let founders pick? Educational tooltips suffice for v1.

### Cross-pack
1. **DACH-wide AG harmonization** — German AG and Swiss AG are similar enough that some founders will assume they're the same. Make sure jurisdiction selection is unambiguous in the onboarding flow.
2. **Multilingual notary draft generation (CH)** — when CH ships French/Italian templates, do notary drafts need to be in the cantonal language? Most likely yes; flag for later.

---

## 6. What ships when

**Pack v0.1 (this doc):** spec ready for engineering planning. Templates can be drafted in-house per SMB calibration.

**Pack v0.2 (post-soft-launch):** template refinements based on customer usage; add real instruments that get pulled (e.g., CH French/Italian UI; DE notary partner integration).

**Pack v0.3 (when revenue justifies):** filing automation (Bolagsverket, Handelsregister, Zefix); cantonal tax-rate database for CH; VSOP-to-real-option conversion modeling for DE startups that fundraise.

---

## 7. Summary of all seven launch packs (now complete)

| Pack | Entity types | Headline scheme | Notary? | SMB default equity instrument | Currency | Languages |
|---|---|---|---|---|---|---|
| `dk` | ApS, A/S | § 7P | No | Tegningsoptioner | DKK | DA / EN |
| `no` | AS, ASA | Opsjonsskatteordningen | No | Opsjoner | NOK | NO / EN |
| **`se`** | AB privat, AB publikt | QESO | No | QESO real options | SEK | SV / EN |
| **`de`** | GmbH, AG | § 19a EStG (limited) | **Yes (GmbH)** | **VSOP (virtuelle Anteile)** | EUR | DE / EN |
| **`ch`** | AG, GmbH | None (Sperrfrist discount) | Partial (GmbH) | Mitarbeiteroptionen | CHF | DE / EN (FR/IT later) |
| `uk` | Ltd. | EMI | No | EMI options | GBP | EN |
| `us` | DE C-Corp, DE LLC | ISO + § 1202 / Profits interests | No | ISO/NSO + Profits interests | USD | EN |

**v1 total scope:** 7 packs, 12 entity types, ~6 favorable-tax schemes (EMI, ISO, § 7P, QESO, opsjonsskatteordningen, profits interests Rev. Proc. 93-27; plus § 19a and Sperrfrist as semi-favorable mechanisms), ~55 document templates. Ambitious but bounded — the abstraction is clean.

---
