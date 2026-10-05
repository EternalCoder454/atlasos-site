import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";

/* Start closed, open what the page uses. script-src keeps 'unsafe-inline'
   because the App Router's inline bootstrap scripts change per build and a
   nonce would make every page dynamic, the wrong trade for a page with no
   user data. Fonts are self-hosted by next/font at build time. */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  `connect-src 'self'${dev ? " ws: wss:" : ""}`,
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  /* A self-contained server for the container: Next traces what the app
     imports and writes a few megabytes rather than all of node_modules. */
  output: "standalone",
  /* Every docs page as Markdown at its own URL plus .md, served by
     app/framework-raw. These run before the dynamic /framework routes,
     which would otherwise take "atlas-ui.md" for a library's name. */
  /* The docs were at /docs for their first day. */
  async redirects() {
    return [
      { source: "/docs.md", destination: "/framework.md", permanent: true },
      { source: "/docs", destination: "/framework", permanent: true },
      { source: "/docs/:path*", destination: "/framework/:path*", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/framework.md", destination: "/framework-raw" },
      { source: "/framework/index.md", destination: "/framework-raw" },
      { source: "/framework/:library([a-z0-9-]+)\\.md", destination: "/framework-raw/:library" },
      { source: "/framework/:library([a-z0-9-]+)/index\\.md", destination: "/framework-raw/:library" },
      { source: "/framework/:library([a-z0-9-]+)/:page([a-z0-9-]+)\\.md", destination: "/framework-raw/:library/:page" },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      /* The docs' images, SVGs among them. Opened on its own an SVG is a
         document, so it gets nothing at all: no script, no requests, no
         forms. A later rule's header replaces an earlier one's. */
      {
        source: "/framework/:library/images/:file",
        headers: [{ key: "Content-Security-Policy", value: "default-src 'none'; style-src 'unsafe-inline'; sandbox" }],
      },
      /* Screenshots and the mark change only with a deploy. */
      {
        source: "/:path(screens|brand)/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
