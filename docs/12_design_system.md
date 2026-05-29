# FreeCapT — Design System (v0.1)

**Date:** 2026-05-27
**Audience:** Nicolai (building solo) + Claude Code (consuming this as design context)
**Purpose:** Codified design tokens, components, and patterns. Copy-paste ready for `tailwind.config.ts`, `globals.css`, and shadcn/ui customization.

This is not a Figma library. It is a **code-first design system** — every decision below maps directly to a Tailwind class, a CSS variable, or a shadcn/ui component override. Claude Code reads this doc as it writes UI, so the brand stays consistent without a designer.

---

## 1. The aesthetic compass

Two reference points held in tension:

**Linear-ish precision:** crisp typography, tight vertical rhythm, restrained color, monochrome-dominant chrome, content respects keyboard nav, every pixel has a reason. Density without claustrophobia.

**Stripe-ish warmth:** approachable language in microcopy, generous whitespace around primary actions, occasional moments of softness (rounded cards, gentle shadows, friendly emoji in *specific* places like welcome moments), surfaces that don't feel like enterprise dashboards.

**Plus a third thing FreeCapT owns:** **financial seriousness.** Cap tables are legal records. The product should feel as trustworthy as a bank statement and as readable as a Notion page — not as flashy as a B2B SaaS pitch deck. No gradients. No glassmorphism. No 3D objects. No 12-color charts.

The rule when you're not sure: **subtract until it can't get any quieter without breaking.**

---

## 2. Design tokens

All tokens follow a `--token-name` CSS variable pattern with Tailwind utilities on top. Tokens defined once in `globals.css`, surfaced through `tailwind.config.ts`, used as Tailwind classes in components.

### 2.1 Color tokens

```css
/* globals.css */
:root {
  /* Neutrals — slate scale */
  --color-slate-50:  #F8FAFC;
  --color-slate-100: #F1F5F9;
  --color-slate-200: #E2E8F0;
  --color-slate-300: #CBD5E1;
  --color-slate-400: #94A3B8;
  --color-slate-500: #64748B;
  --color-slate-600: #475569;
  --color-slate-700: #334155;
  --color-slate-800: #1E293B;
  --color-slate-900: #0F172A;
  --color-slate-950: #020617;

  /* Brand — emerald scale */
  --color-brand-50:  #ECFDF5;
  --color-brand-100: #D1FAE5;
  --color-brand-200: #A7F3D0;
  --color-brand-300: #6EE7B7;
  --color-brand-400: #34D399;
  --color-brand-500: #10B981;
  --color-brand-600: #059669;  /* PRIMARY ACTION */
  --color-brand-700: #047857;  /* HOVER */
  --color-brand-800: #065F46;
  --color-brand-900: #064E3B;

  /* Warning / pending — amber */
  --color-amber-50:  #FFFBEB;
  --color-amber-100: #FEF3C7;
  --color-amber-500: #F59E0B;
  --color-amber-600: #D97706;
  --color-amber-700: #B45309;

  /* Danger — red, used sparingly (destructive actions only) */
  --color-red-50:   #FEF2F2;
  --color-red-500:  #EF4444;
  --color-red-600:  #DC2626;
  --color-red-700:  #B91C1C;

  /* Semantic surfaces */
  --bg-app:           var(--color-slate-50);
  --bg-surface:       #FFFFFF;
  --bg-surface-2:     var(--color-slate-50);
  --bg-surface-dark:  var(--color-slate-900);
  --bg-input:         #FFFFFF;
  --bg-input-focus:   #FFFFFF;
  --bg-row-hover:     var(--color-slate-50);
  --bg-row-selected:  var(--color-brand-50);

  /* Semantic text */
  --text-primary:    var(--color-slate-900);
  --text-secondary:  var(--color-slate-600);
  --text-tertiary:   var(--color-slate-500);
  --text-muted:      var(--color-slate-400);
  --text-inverse:    #FFFFFF;
  --text-brand:      var(--color-brand-700);
  --text-warning:    var(--color-amber-700);
  --text-danger:     var(--color-red-700);

  /* Semantic borders */
  --border-subtle:   var(--color-slate-200);
  --border-default:  var(--color-slate-300);
  --border-strong:   var(--color-slate-400);
  --border-focus:    var(--color-brand-500);
  --border-danger:   var(--color-red-500);

  /* Chart colors — for cap table donut, vesting projections, etc. */
  --chart-1: #047857;  /* Founders (deepest emerald) */
  --chart-2: #10B981;
  --chart-3: #34D399;
  --chart-4: #6EE7B7;
  --chart-5: #F59E0B;  /* Investors / SAFEs (amber pivot) */
  --chart-6: #FBBF24;
  --chart-7: #94A3B8;  /* Pool / unissued (neutral) */
  --chart-8: #CBD5E1;
}
```

**Color usage rules** (canon — Claude Code enforces these):

- **Emerald is for action and brand only.** Primary buttons, active states, selected rows, success status, brand accents. Never decorative.
- **Amber is for "needs attention."** Pending signatures, SAFE rows, missing data room slots, EMI deadline warnings. Never decorative either.
- **Red is for destructive only.** "Delete company." "Cancel subscription." "Remove member." Never for "this number went down" — use slate for that.
- **Slate carries everything else.** Body text, borders, chrome, hover states, disabled states, table rows, navigation.
- **No indigo. No purple. No blue.** Deliberate competitive differentiation per `07_brand_package.md`.

### 2.2 Typography tokens

```css
:root {
  /* Font families */
  --font-sans:    'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-display: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, 'Cascadia Mono', 'Roboto Mono', monospace;

  /* Type scale */
  --text-2xs:  10px;   /* 10/14 — chip labels, kbd hints */
  --text-xs:   11px;   /* 11/16 — micro-labels, kbd, helper text */
  --text-sm:   13px;   /* 13/18 — UI labels, secondary body */
  --text-base: 14px;   /* 14/20 — DEFAULT body text */
  --text-md:   15px;   /* 15/22 — slightly larger body */
  --text-lg:   16px;   /* 16/24 — emphasized body */
  --text-xl:   18px;   /* 18/26 — small headlines */
  --text-2xl:  20px;   /* 20/28 — h3 */
  --text-3xl:  24px;   /* 24/30 — h2, page titles */
  --text-4xl:  30px;   /* 30/36 — section heros */
  --text-5xl:  36px;   /* 36/40 — landing sub-heros */
  --text-6xl:  48px;   /* 48/52 — landing display */
  --text-7xl:  64px;   /* 64/68 — landing mega */

  /* Font weights */
  --weight-normal:   400;
  --weight-medium:   500;  /* UI labels, buttons, nav items */
  --weight-semibold: 600;  /* page titles, card headers */
  --weight-bold:     700;  /* display headlines on landing only */

  /* Line heights (matched to type scale above) */
  --leading-tight:   1.1;
  --leading-snug:    1.25;
  --leading-normal:  1.5;  /* DEFAULT for body */
  --leading-loose:   1.75;

  /* Letter spacing */
  --tracking-tighter: -0.025em;
  --tracking-tight:   -0.01em;
  --tracking-normal:  0;
  --tracking-wide:    0.025em;
  --tracking-wider:   0.05em;  /* UPPERCASE labels */
}
```

**Typography rules:**

- **Body default: 14px / 1.5 / weight 400** in slate-700 (`text-secondary`) on white. Headings up from there.
- **Numbers use `tabular-nums`** anywhere they're aligned in tables, cap tables, financial values. Never proportional.
- **Tabular monospace** (JetBrains Mono) only for: code, timestamps, ledger IDs, UUIDs, raw transaction data. Not for amounts (those use Inter tabular-nums).
- **UPPERCASE labels** (e.g., "STAKEHOLDER", "TYPE" in table headers) are 11px / weight 600 / `tracking-wider`, slate-500. Never longer than 16 characters.
- **No italics in product UI** except for placeholder text and inline scientific/foreign terms (the latter rare).
- **No underlines** except on hyperlinks; underlined-on-hover for links inside body text.

### 2.3 Spacing scale

Tailwind defaults are perfect. Use the standard 4-px scale: `0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32`.

**Compound spacing rules** (what these look like in practice):

| Context | Padding | Gap |
|---|---|---|
| Table cell (compact, density-first) | `px-4 py-2.5` | — |
| Table cell (comfortable) | `px-4 py-3` | — |
| Card | `p-6` | `gap-4` between sections |
| Modal | `p-5` body, `p-4` header/footer | `gap-3` between fields |
| Sidebar nav item | `px-3 py-2` | `gap-2.5` to icon |
| Form field group | — | `gap-4` between fields |
| Page section | `py-12` to `py-24` (landing) | `gap-6` to `gap-12` |

### 2.4 Border radius

```css
:root {
  --radius-none: 0;
  --radius-sm:   4px;   /* tags, swatches, small chips */
  --radius-md:   6px;   /* buttons, inputs, hover states */
  --radius-lg:   8px;   /* cards, modals (sides) */
  --radius-xl:   12px;  /* larger cards, hero-style surfaces */
  --radius-2xl:  16px;  /* landing-page hero cards only */
  --radius-full: 9999px;
}
```

Default for cards: `rounded-lg` (8px). Default for buttons/inputs: `rounded-md` (6px). Avatars and pills: `rounded-full`.

### 2.5 Shadows

```css
:root {
  --shadow-none:    0 0 #0000;
  --shadow-xs:      0 1px 2px 0 rgba(15, 23, 42, 0.04);
  --shadow-sm:      0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04);
  --shadow-md:      0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06);
  --shadow-lg:      0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.05);
  --shadow-xl:      0 20px 25px -5px rgba(15, 23, 42, 0.10), 0 8px 10px -6px rgba(15, 23, 42, 0.05);
  --shadow-2xl:     0 25px 50px -12px rgba(15, 23, 42, 0.18);

  /* Focus ring — emerald, accessibility-grade */
  --shadow-focus:   0 0 0 3px rgba(16, 185, 129, 0.35);
}
```

**Shadow usage:**

- **Default cards: no shadow.** Border only. `border border-slate-200 rounded-lg`. Shadows are decorative tax.
- **Floating elements** (popovers, dropdowns, toasts): `shadow-md`.
- **Modals:** `shadow-xl` on top of backdrop blur.
- **Landing hero cards:** `shadow-xl` for emphasis.
- **No drop shadows on small components** (buttons, chips, swatches).

### 2.6 Motion tokens

```css
:root {
  /* Durations */
  --duration-instant: 80ms;
  --duration-fast:    150ms;   /* DEFAULT for most interactions */
  --duration-base:    200ms;
  --duration-slow:    300ms;
  --duration-slower:  450ms;

  /* Easings */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);     /* DEFAULT */
  --ease-in:      cubic-bezier(0.4, 0, 1, 1);
  --ease-out:     cubic-bezier(0, 0, 0.2, 1);       /* enter animations */
  --ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Motion rules:**

- **Default duration: 150ms.** Hover, focus, button press, color change. Anything longer feels sluggish.
- **Enter animations: 200ms `ease-out`.** Modals opening, drawers sliding in.
- **Exit animations: 150ms `ease-in`.** Quick out.
- **No motion on data** (table rows, cap table donut). Real-time updates appear; they don't animate.
- **Respect `prefers-reduced-motion`.** Wrap all non-essential motion in `@media (prefers-reduced-motion: no-preference)`.

---

## 3. Tailwind config (drop-in ready)

Paste this into `tailwind.config.ts`. Extends Tailwind defaults rather than replacing them, so all standard utilities still work.

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          300: 'var(--color-brand-300)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
          800: 'var(--color-brand-800)',
          900: 'var(--color-brand-900)',
        },
        // Slate stays as Tailwind native (already perfect).
        // Amber stays as Tailwind native.
        // Red stays as Tailwind native (sparing use).
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs:    ['11px', { lineHeight: '16px' }],
        sm:    ['13px', { lineHeight: '18px' }],
        base:  ['14px', { lineHeight: '20px' }],
        md:    ['15px', { lineHeight: '22px' }],
        lg:    ['16px', { lineHeight: '24px' }],
        xl:    ['18px', { lineHeight: '26px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
        '3xl': ['24px', { lineHeight: '30px' }],
        '4xl': ['30px', { lineHeight: '36px' }],
        '5xl': ['36px', { lineHeight: '40px' }],
        '6xl': ['48px', { lineHeight: '52px' }],
        '7xl': ['64px', { lineHeight: '68px' }],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        sm: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        md: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
        lg: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.05)',
        xl: '0 20px 25px -5px rgba(15, 23, 42, 0.10), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
        '2xl': '0 25px 50px -12px rgba(15, 23, 42, 0.18)',
        focus: '0 0 0 3px rgba(16, 185, 129, 0.35)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
        instant: '80ms',
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),  // for AI-generated content like "explain my grant"
    require('@tailwindcss/forms'),       // baseline form reset
  ],
} satisfies Config;
```

---

## 4. shadcn/ui component inventory

Install all of these on day 1 with `pnpm dlx shadcn@latest add <component>`. The rest of the FreeCapT UI sits on top.

**Install order (roughly the order you'll need them in the build plan):**

| Component | Where used | Customization notes |
|---|---|---|
| `button` | Everywhere | Variant: `default` = emerald, `outline` = slate border, `ghost` = no border, `destructive` = red. See §6.2 customization |
| `input` | Forms, search, grant flow | Focus ring uses `--shadow-focus` |
| `label` | All form fields | 13px / weight 500 / slate-700 |
| `textarea` | Founder personal note, AI prompt, bulk add | Min height 80px, max 240px before scroll |
| `select` | Jurisdiction, currency, language, role pickers | Use Radix-based to support keyboard nav |
| `checkbox` | Settings toggles | Emerald checked state |
| `switch` | Settings toggles (preferred over checkbox for binary settings) | Emerald active state |
| `dialog` | Modals — grant, invite, bulk add, upgrade, add-doc | Backdrop with blur, `shadow-xl` |
| `dropdown-menu` | Export ▾, Settings menu, row actions (⋯) | Use for context menus |
| `popover` | Date picker, info tooltips | Avoid for navigation |
| `tooltip` | Help icons, field hints, status badges | Delay 500ms |
| `table` | Cap table, Stakeholders, Transactions, audit log | Customize per density rules in §7 |
| `tabs` | Simulate sub-tabs, Bulk add modes | Underline-style, emerald underline on active |
| `card` | Hero cards, dashboard panels | `rounded-lg` default |
| `badge` | Stakeholder type tags, status, PAID labels | See §6.3 customization |
| `alert` | Form errors, system status banners | Variants: info / warning / danger |
| `toast` (`sonner`) | Save confirmations, copy-to-clipboard | Top-right, 4s default duration |
| `command` (cmdk) | Search / quick switcher for company / stakeholder | Keyboard-first |
| `sheet` | Stakeholder details drawer, transaction drawer | Right-side slide |
| `accordion` | FAQ, document slot expand | Single open by default on FAQ; multi-open on data room |
| `progress` | Vesting progress, data room readiness | Use the FreeCapT-specific variant in §6.5 |
| `skeleton` | Loading states for tables, donuts | Use slate-200 base, animate-pulse |
| `separator` | Footer dividers, between settings groups | 1px slate-200 |
| `avatar` | User initials | Always show initials, never fallback emoji |

**Do NOT install:** `calendar` (Radix is too heavy — write a simple date input instead), `breadcrumb` (we use clear page titles and nav highlight; breadcrumbs add no value at our IA depth), `pagination` (cap tables don't paginate; we filter and scroll).

---

## 5. Customized core components

The shadcn/ui defaults are good; these are the FreeCapT-specific overrides.

### 5.1 Button

```typescript
// components/ui/button.tsx — variant additions
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-brand-600 text-white hover:bg-brand-700',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        outline: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
        ghost: 'text-slate-700 hover:bg-slate-100',
        link: 'text-brand-700 underline-offset-4 hover:underline',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs',
        default: 'h-9 px-4 text-sm',
        lg: 'h-10 px-5 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);
```

### 5.2 Input

```typescript
// Default state: slate-300 border, white bg
// Focus state: emerald-500 border, focus ring
// Error state: red-500 border, red focus ring
// Disabled: slate-50 bg, slate-400 text

className: `
  flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm
  placeholder:text-slate-400
  focus:outline-none focus:border-brand-500 focus:shadow-focus
  disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
  aria-invalid:border-red-500 aria-invalid:focus:border-red-500
`
```

### 5.3 Badge — variants we use

| Variant | Style | When |
|---|---|---|
| `founder` | `bg-brand-50 text-brand-700` | Founder stakeholder type |
| `employee` | `bg-slate-100 text-slate-700` | Employee / advisor |
| `investor` | `bg-amber-50 text-amber-700` | Investor (SAFE, convertible) |
| `paid` | `bg-slate-900 text-white text-2xs uppercase tracking-wider` | "PAID" feature labels |
| `auto` | `bg-brand-600 text-white text-2xs uppercase tracking-wider` | "AUTO" — auto-generated (shareholder register) |
| `pending` | `text-amber-600` with leading `●` | Awaiting signature, missing docs |
| `success` | `text-brand-700` with leading `●` | Signed, active |
| `danger` | `text-red-600` with leading `●` | Cancelled, errored |

Render as a small inline-flex span:

```typescript
<span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
  {variant === 'success' && <span className="text-brand-600">●</span>}
  {children}
</span>
```

### 5.4 Table

Default to **compact density** in the product (table cells: `px-4 py-2.5`). Comfortable density (`py-3`) only on the stakeholder portal and landing-page comparisons where the user is reading more than scanning.

```typescript
// All product tables follow this shape
<div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
  <table className="w-full text-sm">
    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
      <tr>
        <th className="text-left px-4 py-2.5 font-semibold">…</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      <tr className="hover:bg-slate-50 cursor-pointer">
        <td className="px-4 py-2.5">…</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Table conventions:**
- Numeric columns: `text-right tabular-nums`
- Foreign currencies: show with original below the converted, e.g., `<strong>$250,000</strong>` over `<small>NOK 1,750,000 @ 0.143</small>`
- Status column always last (before any action column)
- Action column: `text-right` with overflow menu (`⋯`) or inline links separated by ` · `
- Empty table: skeleton rows during load, then empty-state CTA when truly empty

### 5.5 Dialog (modal)

```typescript
// Standard layout:
<DialogContent className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
  <DialogHeader className="p-5 border-b border-slate-100 flex items-center justify-between">
    <div>
      <DialogTitle className="text-lg font-semibold">Title</DialogTitle>
      <DialogDescription className="text-xs text-slate-500 mt-0.5">Optional subtitle</DialogDescription>
    </div>
    <DialogClose>×</DialogClose>
  </DialogHeader>
  <div className="p-5 space-y-5">{/* body */}</div>
  <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Confirm action →</Button>
  </DialogFooter>
</DialogContent>
```

Backdrop: `bg-slate-900/55 backdrop-blur-sm`. Always.

---

## 6. FreeCapT-specific patterns

The patterns that don't come from shadcn/ui and are specific to the product.

### 6.1 Cap table donut

A pure-CSS conic-gradient (no Recharts needed for this one — keeps load light). Renders the same in PDF exports.

```typescript
// components/freecapt/cap-table-donut.tsx
type Slice = { label: string; pct: number; color: string };

export function CapTableDonut({ slices, size = 220 }: { slices: Slice[]; size?: number }) {
  let cumulative = 0;
  const gradient = slices.map(({ color, pct }) => {
    const start = cumulative;
    cumulative += pct;
    return `${color} ${start}% ${cumulative}%`;
  }).join(', ');

  return (
    <div
      role="img"
      aria-label="Ownership distribution"
      className="rounded-full relative"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${gradient})`,
      }}
    >
      <div className="absolute inset-[22%] bg-white rounded-full" />
    </div>
  );
}
```

Use the chart colors from `--chart-1` through `--chart-8`. Order: founders first (deepest emerald), employees mid, investors amber, pool/unissued neutral gray. Always.

### 6.2 Stakeholder swatch

The small color square next to a stakeholder name in the cap table:

```typescript
<span
  className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle"
  style={{ backgroundColor: color }}
/>
```

Same colors as the donut slice. Consistent across views.

### 6.3 Vesting progress bar

A linear-gradient bar that shows vested vs. unvested:

```typescript
// At percentage p (e.g., 7.6 for 7.6%):
<div
  className="h-2 rounded-full"
  style={{
    background: `linear-gradient(to right,
      var(--color-brand-600) ${p}%,
      var(--color-slate-200) ${p}%
    )`,
  }}
/>
```

Always paired with: vested / total counts above, dates below (cliff date + fully-vested date).

### 6.4 Country pack badge

```typescript
<div className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-slate-200 bg-white text-xs">
  <span>{flag}</span>
  <span className="font-medium">{label}</span>
</div>
```

Flag is the country emoji (🇩🇰, 🇳🇴, etc.). Label is the entity short form (`ApS`, `Ltd.`, `C-Corp`). Used in: company switcher, jurisdiction picker, landing page.

### 6.5 Data room slot states

The visual difference between a present and missing slot:

```typescript
// Present
<div className="flex items-center gap-3 px-4 py-3 border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
  <FileTextIcon className="w-5 h-5 text-slate-400" />
  <div className="flex-1">
    <div className="text-sm font-medium">{slotName}</div>
    <div className="text-xs text-slate-500">{source} · {date} · {filename}</div>
  </div>
  <span className="text-xs text-brand-700">● Present</span>
</div>

// Missing
<div className="flex items-center gap-3 px-4 py-3 border-t-2 border-dashed border-amber-200 bg-amber-50/30 hover:bg-amber-50/60 cursor-pointer">
  <FileTextIcon className="w-5 h-5 text-slate-300" />
  <div className="flex-1">
    <div className="text-sm font-medium text-slate-700">{slotName}</div>
    <div className="text-xs text-slate-500">{guidance}</div>
  </div>
  <Button size="sm">+ Add</Button>
</div>

// Auto-generated (shareholder register)
<div className="flex items-center gap-3 px-4 py-3 border-t border-slate-100 bg-brand-50/30 hover:bg-brand-50/60 cursor-pointer">
  <FileTextIcon className="w-5 h-5 text-brand-600" />
  <div className="flex-1">
    <div className="text-sm font-medium flex items-center gap-2">
      {slotName}
      <Badge variant="auto">AUTO</Badge>
    </div>
    <div className="text-xs text-slate-500">Live · regenerated on every cap table change</div>
  </div>
  <span className="text-xs text-brand-700">● Live</span>
</div>
```

### 6.6 Paywall prompt (upgrade modal)

The single, consistent surface for "this is a Paid feature." Don't fragment into multiple variants.

```typescript
<Dialog>
  <DialogContent className="max-w-lg p-6 text-center">
    <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl mx-auto mb-4">
      ✦
    </div>
    <h2 className="text-2xl font-bold mb-2">Upgrade to Paid · $15/mo</h2>
    <p className="text-sm text-slate-600 mb-6">
      You're trying to use a Paid feature — {triggeringFeature}.
    </p>
    <div className="text-left bg-slate-50 rounded-lg p-4 mb-6 text-sm">
      <div className="font-semibold mb-2">All Paid features:</div>
      <ul className="space-y-1 text-slate-600">
        {/* features list */}
      </ul>
    </div>
    <Button size="lg" className="w-full mb-2">Upgrade — $15/month →</Button>
    <Button variant="ghost" size="sm" className="w-full">Not now</Button>
    <p className="text-xs text-slate-400 mt-3">Cancel anytime. Your data stays yours.</p>
  </DialogContent>
</Dialog>
```

**Rules:**
- Always show all Paid features in the modal, regardless of which one triggered it. (Helps founder see full value.)
- Always include the cancellation reassurance line.
- Always offer "Not now" as a clear opt-out — never make it the only path to dismiss.
- Never show price differently per feature; one price always.

### 6.7 AI side panel

The right-side drawer for the AI assistant (onboarding + ongoing chat).

```typescript
<div className="fixed top-0 right-0 bottom-0 w-[420px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col">
  <header className="p-4 border-b border-slate-100 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">✦</div>
      <div>
        <div className="text-sm font-semibold">FreeCapT AI</div>
        <div className="text-xs text-slate-500">Powered by Claude · EU region</div>
      </div>
    </div>
    <button aria-label="Close">×</button>
  </header>
  <div className="flex-1 overflow-y-auto p-4 space-y-4">
    {/* messages */}
  </div>
  <footer className="p-4 border-t border-slate-100">
    <input className="..." placeholder="Type a message…" />
    <p className="text-2xs text-slate-400 mt-2 text-center">
      Capframe AI uses Claude. Processed in EU region. Never used to train models.
    </p>
  </footer>
</div>
```

Width 420px on desktop. Full-width slide-up sheet on mobile.

### 6.8 Magic-link auth card

The single card used on the sign-in page, the invite-accept page, and the stakeholder portal claim:

```typescript
<Card className="max-w-md mx-auto p-8">
  <div className="text-center mb-6">
    <div className="font-bold text-2xl tracking-tight mb-2">
      Free<span className="text-brand-600">C</span>apT
    </div>
    <p className="text-sm text-slate-500">{contextMessage}</p>
  </div>
  <form className="space-y-4">
    <Input type="email" placeholder="you@yourcompany.com" />
    <Button type="submit" size="lg" className="w-full">Send magic link →</Button>
  </form>
  <p className="text-xs text-slate-400 mt-6 text-center">
    No password required. We'll email you a one-time sign-in link.
  </p>
</Card>
```

### 6.9 Empty states

Three sizes:

| Size | When | Pattern |
|---|---|---|
| **Micro** (inline) | Empty list inside a populated screen | One line of text + a small CTA link |
| **Card** (medium) | A panel that's empty in an otherwise busy view | Icon + headline + 1 CTA |
| **Full** (large) | Full screen empty state — e.g., first time on Stakeholders or Data room | Big icon + headline + 1-paragraph description + 3 CTA cards |

The full version (as used on Stakeholders empty state):

```typescript
<div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
  <div className="text-5xl mb-4">◯</div>
  <h2 className="text-xl font-semibold mb-2">Let's get Acme's cap table set up.</h2>
  <p className="text-sm text-slate-600 mb-8 max-w-md mx-auto">
    Pick the fastest way to add everyone. You can edit and add more later.
  </p>
  <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
    {/* 3 CTAs as cards */}
  </div>
</div>
```

### 6.10 Plan badge (sidebar)

Always visible in the sidebar footer. Two states:

```typescript
// Free plan
<div className="bg-slate-100 rounded-lg p-3">
  <div className="text-xs text-slate-500 mb-1">Current plan</div>
  <div className="text-sm font-semibold text-slate-900">Free</div>
  <div className="text-xs text-slate-500 mt-1">Personal cap table</div>
  <Button size="sm" className="mt-2 w-full text-xs">Upgrade to Paid →</Button>
</div>

// Paid plan
<div className="bg-brand-50 border border-brand-100 rounded-lg p-3">
  <div className="text-xs text-brand-700 mb-1">Current plan</div>
  <div className="text-sm font-semibold text-brand-900">Paid · $15/mo</div>
  <div className="text-xs text-brand-700 mt-1">All features</div>
</div>
```

---

## 7. UI density rules

When to use what.

| Surface | Density | Reason |
|---|---|---|
| **Cap table table** | Compact (`py-2.5`) | Information-dense, frequent scanning |
| **Stakeholders list** | Compact | Same |
| **Transactions list** | Compact, monospace dates | Scan-first |
| **Audit log** | Ultra-compact (`py-2`), monospace throughout | Reference, not browsing |
| **Settings / Members** | Comfortable (`py-3`) | Lower frequency, more contemplative |
| **Stakeholder portal** | Comfortable to spacious | Audience is non-financial, reading more than scanning |
| **Landing page** | Spacious | Marketing; let the eye breathe |
| **Modals** | Comfortable, generous gaps | Single-task focus |

**Card vs. table:**
- **Table** when items are comparable and rank-ordered.
- **Card** when items are independent (portfolio companies, country packs grid, data room folders).

**Within tables — when to use rows vs. expanded drawers:**
- **Inline row** for read-only data.
- **Click → drawer (sheet)** for detail editing. Don't expand inline; it ruins the rest of the table layout.

---

## 8. Motion & feedback

**Standard interactions:**

| Interaction | Animation |
|---|---|
| Button hover | `transition-colors duration-150` |
| Row hover | `transition-colors duration-150` |
| Modal open | `duration-200 ease-out` opacity + scale 0.96→1 |
| Modal close | `duration-150 ease-in` opacity + scale 1→0.98 |
| Sheet open/close | `duration-200 ease-out` slide-in from right |
| Toast appear | `duration-150 ease-out` slide-down + fade-in, top-right |
| Donut on data change | NONE — instant update |
| Number on data change | NONE — instant update |
| Skeleton during load | `animate-pulse` slate-200 base |

**Feedback after user action:**
- Toast on success ("Grant created", "Email sent").
- Inline error on form validation failure (don't toast errors — too easily missed).
- Optimistic UI for low-risk edits (renaming a stakeholder, toggling 2FA). Roll back on server error with a toast.
- For high-risk edits (cancelling subscription, deleting a stakeholder): require confirmation in a destructive-styled dialog.

---

## 9. Accessibility (baseline, non-negotiable)

- **WCAG AA contrast** everywhere. Slate-500 on white (`#64748B` on `#FFFFFF`) is 5.2:1 — passes. Slate-400 on white is 3.5:1 — fails for body text; use only for decorative or placeholders.
- **Focus rings** are emerald (`--shadow-focus`) on all interactive elements. Never hide them.
- **Keyboard nav** through every interaction. `Tab` order matches visual order. `Esc` closes modals. `Cmd+K` opens command palette.
- **Screen reader labels** on all icon-only buttons (`aria-label="Close"`).
- **`prefers-reduced-motion`** respected — all non-essential animation suppressed.
- **Color-blind safety** — the cap table donut chart palette (emerald → amber → gray) is distinguishable in deuteranopia and protanopia. Tested.
- **Forms** — always pair `<label>` with `<input>`. Required fields marked with `*` AND with `aria-required`.
- **Tables** — use `<th scope="col">` for headers, `<caption>` for table titles (visually-hidden if not needed in design).

---

## 10. Do this / not that

Canonical rules. Hand-wavy stuff turned into specific calls.

| Do | Not |
|---|---|
| Use emerald-600 for primary actions | Use indigo, purple, or blue for buttons |
| Use slate-700 for body text | Use pure black (#000) anywhere |
| Use 1px slate-200 borders on cards | Use shadows for card separation |
| Use rounded-lg (8px) on cards | Use rounded-2xl on small UI |
| Show numbers right-aligned with `tabular-nums` | Show numbers center-aligned |
| Use `●` (filled circle) for status dots, color-coded | Use checkmarks/x's for active/inactive |
| Use amber for "needs attention" only | Use amber decoratively |
| Use red for destructive actions only | Use red to flag "this number went down" |
| Use one consistent paywall modal | Have feature-specific upgrade prompts |
| Use country flag emojis (🇩🇰) as jurisdiction signifiers | Use country name text in badges |
| Use `+` icons for "add new" affordances | Use "Click here to add" text |
| Use empty-state CTAs that explain the path | Use empty-state with just "No data" |
| Stack form fields vertically with `gap-4` | Use multi-column forms unless space-constrained |
| Use uppercase labels (`STAKEHOLDER`) at 11px / weight 600 / tracking-wider | Use title-case labels in table headers |
| Use `shadow-md` for popovers, `shadow-xl` for modals | Use the same shadow for everything |

---

## 11. How Claude Code uses this

Drop this doc into `docs/12_design_system.md` in the repo. When prompting Claude Code to build any UI:

```
Read docs/12_design_system.md before any UI work.
Follow the tokens, component inventory, and patterns exactly.
Where a pattern isn't covered, ask before improvising.
```

Specifically:
- Every Tailwind class used should be derivable from §2 (tokens) and §3 (config).
- Every shadcn/ui component used should be listed in §4. If not, ask first.
- Every FreeCapT-specific pattern should reference §6 by section number in code comments.

Claude Code's job is **not** to design — it's to apply this system. Visual decisions happen here, in this doc. The codebase enforces them.

---

## 12. What's not yet in this doc (deliberate omissions)

These are real things you'll need eventually; they aren't here because they're either premature or context-dependent.

- **Dark mode.** Cap tables are professional documents — dark mode is a v2 nice-to-have. Not building token aliases for it now.
- **Mobile-specific patterns** beyond responsive baseline. The product is desktop-first; we don't ship native and the spec moved mobile to Never Build.
- **Marketing-page-only typography variations.** The landing page (`08_landing_page.html`) has the slightly bolder display weights; those don't need separate tokens.
- **Data visualization beyond the donut and vest bar.** When we add cohort retention charts, vest projections beyond a bar, or scenario diff charts, we add them here. Not before.
- **Email templates.** Different medium, different constraints (table-based layouts, web-safe fonts). Separate design doc when we build the welcome email + vest milestone emails.
- **Brand illustrations.** Currently none. If we add hero illustrations later, they'll get their own guidelines doc.

---
