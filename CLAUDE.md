# AtlasOS Site

The AtlasOS website and ISO downloads, at telamon.eterneon.net. See
README.md for how downloads are protected and how to deploy.

## Rules

- Every claim on the page comes from the AtlasOS README
  (`~/Documents/AtlasOS/README.md`). Don't add numbers or features it doesn't state.
- Adding a dependency needs the user's approval.
- Animation is vanilla Motion, all in `components/motion.tsx`: `animate` from
  `motion/mini`, plus `inView`, `scroll` and `stagger` from `motion`. No
  `motion/react`. The page marks what moves with data attributes.
- The space decoration (stars, shooting stars, the horizon, the orbits) is
  `components/space.tsx`, animated in CSS in `globals.css`. Ambient loops
  (caret, hero words, glow, stars, orbits) run for as long as they're on
  screen; the user wants them to keep going. Reduced motion stills them all.
- The server renders every element where it ends up. Starting points go in
  `globals.css` under `html.motion`, which the head script in
  `app/layout.tsx` sets only when motion is allowed, so reduced motion and
  no-script visitors see the finished page. Always animate to the rendered
  state.
- The hero's entrance is CSS (`.hero-in`), so it never waits for a script.
- The download limits live in `deploy/compose.yaml` (nginx) and
  `lib/rate-limit.ts` (links per hour); README.md describes them. Change
  all three together.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
