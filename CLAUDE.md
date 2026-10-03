# AtlasOS Site

The AtlasOS website and ISO downloads, at atlasos.eterneon.net. See
README.md for how downloads are protected and how to deploy.

## Rules

- Every claim on the page comes from the AtlasOS README
  (`~/Documents/AtlasOS/README.md`). Don't add numbers or features it doesn't state.
- Adding a dependency needs the user's approval.
- Reduced motion makes an animation instant; it never skips it. The server
  renders the `initial` state, so always animate to the shown state.
- Use `m.*` inside `LazyMotion strict`, never `motion.*`.
- The download limits live in `deploy/compose.yaml` (nginx) and
  `lib/rate-limit.ts` (links per hour); README.md describes them. Change
  all three together.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
