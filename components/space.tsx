/* The space around AtlasOS: stars, the odd shooting star, a planet's
   horizon and an orbit. All of it decoration (aria-hidden), all of it CSS
   or a few Motion lines in components/motion.tsx, and all of it still when
   motion is reduced (globals.css).

   The stars are box-shadows on three one-pixel dots, one layer per size,
   placed by a seeded generator so the server and every visit draw the same
   sky. Hundreds of stars, three elements. */

function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* White, the logo's light violet, and now and then the wallpaper's pink. */
const tints = ["255,255,255", "255,255,255", "212,204,255", "247,168,210"];

function stars(seed: number, count: number, width: number, height: number, alpha: [number, number]) {
  const next = random(seed);
  return Array.from({ length: count }, () => {
    const x = Math.round(next() * width);
    const y = Math.round(next() * height);
    const tint = tints[Math.floor(next() * tints.length)];
    const a = (alpha[0] + next() * (alpha[1] - alpha[0])).toFixed(2);
    return `${x}px ${y}px rgba(${tint},${a})`;
  }).join(",");
}

/* Wide enough for a 4K screen at 1.5x (2560 CSS px) with room to spare,
   and started above the section by the farthest any layer drifts, so the
   parallax never shows an edge. */
const W = 3200;
const H = 1800;
const LIFT = 180;
const layers = [
  { size: 1, sky: stars(7, 290, W, H, [0.2, 0.55]), speed: 0.08, twinkle: "" },
  { size: 1.5, sky: stars(19, 90, W, H, [0.35, 0.8]), speed: 0.16, twinkle: "twinkle-a" },
  { size: 2, sky: stars(41, 32, W, H, [0.6, 1]), speed: 0.26, twinkle: "twinkle-b" },
];

/* Fills its nearest positioned ancestor. Scrolling moves the layers at
   different speeds, so the nearer stars drift past the farther ones. */
export function Starfield({ meteors = false }: { meteors?: boolean }) {
  return (
    <div data-ambient aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
      <div className="absolute left-1/2 -translate-x-1/2" style={{ width: W, height: H, top: -LIFT }}>
        {layers.map((l) => (
          <div key={l.size} data-parallax={l.speed} className="absolute inset-0">
            <div
              className={`absolute left-0 top-0 rounded-full ${l.twinkle}`}
              style={{ width: l.size, height: l.size, boxShadow: l.sky }}
            />
          </div>
        ))}
      </div>
      {meteors && (
        <>
          <span className="meteor left-[62%] top-[6%]" style={{ ["--delay" as string]: "3s" }} />
          <span className="meteor left-[28%] top-[2%]" style={{ ["--delay" as string]: "11s", ["--period" as string]: "17s" }} />
        </>
      )}
    </div>
  );
}

/* A planet's edge, lit from behind, that the desktop screenshot rises
   over. Sits inside the hero's figure, so it lands at the same place on
   the screenshot at every width. The figure is its own stacking context
   (its entrance animates transform), so the planet is drawn over the
   hero's glow, as the ground would hide the light behind it. */
export function Horizon() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-[-60%] top-[38%] -z-10 aspect-[3/1] sm:inset-x-[-40%]">
      <div className="horizon size-full rounded-[50%]" />
    </div>
  );
}

/* AtlasOS's mark with three tilted orbits turning slowly around it, each
   carrying a small light. The orbits are real circles laid back in 3D
   (globals.css), and each light turns back to face you as it goes, so it
   stays round. */
export function Orbits() {
  const rings = [
    { inset: "19%", period: "38s", dot: "bg-violet-hi text-violet-hi", dir: "normal" },
    { inset: "9%", period: "56s", dot: "bg-sakura text-sakura", dir: "reverse" },
    { inset: "0%", period: "80s", dot: "bg-violet text-violet", dir: "normal" },
  ];
  return (
    <div data-ambient aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[26rem]">
      <div className="absolute inset-0 bg-[radial-gradient(closest-side,rgba(104,88,226,0.3),rgba(104,88,226,0.08)_55%,transparent)]" />
      <div className="orbit-plane absolute inset-0">
        {rings.map((r) => (
          <div
            key={r.inset}
            className="orbit absolute rounded-full border border-violet/30"
            style={{ inset: r.inset, ["--period" as string]: r.period, ["--dir" as string]: r.dir }}
          >
            <span className={`orbit-dot absolute left-1/2 top-0 size-2.5 rounded-full shadow-[0_0_12px_currentColor] ${r.dot}`} />
          </div>
        ))}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- a 3 KB SVG */}
      <img
        src="/brand/atlas-mark.svg"
        alt=""
        width={96}
        height={96}
        className="absolute left-1/2 top-1/2 size-[22%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_24px_rgba(138,122,244,0.6)]"
      />
    </div>
  );
}
