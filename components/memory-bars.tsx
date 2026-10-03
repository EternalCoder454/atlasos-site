/* Idle memory, stock Kinoite against AtlasOS, from the README's table.
   components/motion.tsx grows the bars and counts the numbers up once they
   come into view, because the comparison is the point. Rendered at their
   real widths and values, which is what they end on.

   Stock Kinoite is the reference, set back in grey. AtlasOS is the answer,
   so its row gets the light: its own mark, the brighter number, the
   gradient bar with a glow, and the README's own words for the gap. */
const stock = 2075;
const atlas = 990;

function count(value: number, prefix = "") {
  return {
    "data-count": value,
    "data-prefix": prefix,
    "data-suffix": " MiB",
    /* Counted up by motion.tsx, so not React's to reconcile. */
    dangerouslySetInnerHTML: { __html: `${prefix}${value.toLocaleString("en-US")} MiB` },
  };
}

export function MemoryBars() {
  return (
    <div data-bars className="space-y-6">
      <div className="px-1">
        <div className="mb-2 flex items-baseline justify-between gap-4 text-sm">
          <span className="text-text-3">Fedora Kinoite 44, stock</span>
          <span className="font-mono text-text-3 tabular-nums" {...count(stock)} />
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-ink-3">
          <div data-bar className="h-full w-full rounded-full bg-line-strong" />
        </div>
      </div>

      <div className="rounded-xl border border-violet/40 bg-violet-deep/10 p-4 shadow-[0_0_40px_-12px_rgba(138,122,244,0.45)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="flex items-center gap-2 font-semibold text-text">
            {/* eslint-disable-next-line @next/next/no-img-element -- a 3 KB SVG */}
            <img src="/brand/atlas-mark.svg" alt="" width={20} height={20} className="size-5" />
            AtlasOS
            <span className="rounded-full bg-violet/20 px-2 py-0.5 text-xs font-medium text-violet-hi">
              about half the memory
            </span>
          </span>
          <span className="font-mono text-lg font-semibold text-violet-hi tabular-nums" {...count(atlas, "about ")} />
        </div>
        <div className="h-3.5 overflow-hidden rounded-full bg-ink-3">
          <div
            data-bar
            className="h-full rounded-full bg-linear-to-r from-violet-deep via-violet to-sakura shadow-[0_0_16px_rgba(195,184,255,0.5)]"
            style={{ width: `${(atlas / stock) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
