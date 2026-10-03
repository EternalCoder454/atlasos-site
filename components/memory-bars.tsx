"use client";

import { m, LazyMotion, domAnimation, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

/* Idle memory, stock Kinoite against AtlasOS, from the README's table. The
   bars grow once when they come into view, because the comparison is the
   point; with reduced motion they are simply there. They always animate to
   their full width: the server renders width 0, so skipping the animation
   would leave them empty. */
const rows = [
  { label: "Fedora Kinoite 44, stock", value: 2075, shown: "2,075 MiB", tone: "bg-line-strong" },
  { label: "AtlasOS", value: 990, shown: "about 990 MiB", tone: "bg-violet" },
];

export function MemoryBars() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();

  return (
    <LazyMotion features={domAnimation} strict>
      <div ref={ref} className="space-y-5">
        {rows.map((row, i) => (
          <div key={row.label}>
            <div className="mb-2 flex items-baseline justify-between gap-4 text-sm">
              <span className="text-text-2">{row.label}</span>
              <span className="font-mono text-text tabular-nums">{row.shown}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-ink-3">
              <m.div
                className={`h-full rounded-full ${row.tone}`}
                initial={{ width: "0%" }}
                animate={inView ? { width: `${(row.value / 2075) * 100}%` } : undefined}
                transition={{ duration: reduce ? 0 : 0.9, delay: reduce ? 0 : i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ))}
      </div>
    </LazyMotion>
  );
}
