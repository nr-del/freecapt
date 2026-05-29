// Pure-CSS conic-gradient ownership donut (§6.1). No charting lib — renders
// identically in PDF exports. Slice order is the caller's responsibility:
// founders (deepest emerald) → employees → investors (amber) → pool/unissued (gray).
export type Slice = { label: string; pct: number; color: string };

export function CapTableDonut({ slices, size = 220 }: { slices: Slice[]; size?: number }) {
  let cumulative = 0;
  const gradient = slices
    .map(({ color, pct }) => {
      const start = cumulative;
      cumulative += pct;
      return `${color} ${start}% ${cumulative}%`;
    })
    .join(", ");

  return (
    <div
      role="img"
      aria-label="Ownership distribution"
      className="relative rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${gradient})`,
      }}
    >
      <div className="absolute inset-[22%] rounded-full bg-white" />
    </div>
  );
}

// §6.2 — small color square shown next to a stakeholder/legend label.
export function Swatch({ color }: { color: string }) {
  return (
    <span
      className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle"
      style={{ backgroundColor: color }}
    />
  );
}
