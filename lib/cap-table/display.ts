// Shared display constants + formatters for cap-table-derived views.
// Color canon (§6.1 / globals.css --chart-*): founders deepest emerald,
// employees/advisors mid emerald, investors amber, pool/unissued neutral gray.
export const TYPE_COLOR: Record<string, string> = {
  founder: "#047857",
  entity: "#10b981",
  employee: "#34d399",
  advisor: "#6ee7b7",
  investor: "#f59e0b",
  other: "#94a3b8",
};

export const POOL_COLOR = "#94a3b8";

export const TYPE_LABEL: Record<string, string> = {
  founder: "Founder",
  employee: "Employee",
  advisor: "Advisor",
  investor: "Investor",
  entity: "Entity",
  other: "Other",
};

export const SUBTYPE_LABEL: Record<string, string> = {
  common_stock: "Common stock",
  iso: "ISO options",
  nso: "NSO options",
  safe: "SAFE",
};

// Ordering for cap-table rows: founders first, investors last.
export const TYPE_RANK: Record<string, number> = {
  founder: 0,
  employee: 1,
  advisor: 2,
  entity: 3,
  other: 4,
  investor: 5,
};

export const intFmt = new Intl.NumberFormat("en-US");

export const moneyFmt = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

export const colorForType = (type: string) => TYPE_COLOR[type] ?? POOL_COLOR;
