/* Idle memory, stock Kinoite against AtlasOS, from the README's table.
   components/motion.tsx grows the bars and counts the numbers up once they
   come into view, because the comparison is the point. Rendered at their
   real widths and values, which is what they end on. */
const rows = [
  { label: "Fedora Kinoite 44, stock", value: 2075, prefix: "", tone: "bg-line-strong" },
  { label: "AtlasOS", value: 990, prefix: "about ", tone: "bg-violet" },
];

export function MemoryBars() {
  return (
    <div data-bars className="space-y-5">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-2 flex items-baseline justify-between gap-4 text-sm">
            <span className="text-text-2">{row.label}</span>
            <span
              data-count={row.value}
              data-prefix={row.prefix}
              data-suffix=" MiB"
              className="font-mono text-text tabular-nums"
              /* Counted up by motion.tsx, so not React's to reconcile. */
              dangerouslySetInnerHTML={{ __html: `${row.prefix}${row.value.toLocaleString("en-US")} MiB` }}
            />
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-ink-3">
            <div
              data-bar
              className={`h-full rounded-full ${row.tone}`}
              style={{ width: `${(row.value / 2075) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
