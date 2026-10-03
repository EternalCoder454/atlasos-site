import { isIP } from "node:net";
import type { NextRequest } from "next/server";
import { isImageId } from "@/lib/images";
import { takeToken } from "@/lib/rate-limit";
import { currentRelease } from "@/lib/releases";
import { signedPath } from "@/lib/signed-link";

/* /download/atlasos and /download/atlasos-nvidia: the page's download
   buttons. Each answers with a redirect to a signed link for the current
   ISO, made for the address that asked. The ISO itself is never linked
   directly, so a crawler, a hotlink or a script looping on the file has
   nothing to fetch, and someone who wants it has to come through here,
   where each address gets a few links an hour. */

const noStore = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

function page(status: number, title: string, body: string, extra: Record<string, string> = {}) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} · AtlasOS</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0e0c24;color:#eeecfa;font:16px/1.6 system-ui,sans-serif;padding:16px}main{max-width:32rem}h1{font-size:1.5rem;margin:0 0 .5rem}p{color:#b8b2da}a{color:#c3b8ff}</style></head><body><main><h1>${title}</h1><p>${body}</p><p><a href="/#download">Back to AtlasOS</a></p></main></body></html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", ...noStore, ...extra },
  });
}

export async function GET(request: NextRequest, ctx: RouteContext<"/download/[image]">) {
  const { image } = await ctx.params;
  if (!isImageId(image)) return page(404, "Not found", "There's no image by that name.");

  /* Caddy sets X-Real-IP to the address it accepted the connection from,
     replacing whatever the client sent, and nothing reaches this server
     except through Caddy. The download server sees the same value, which
     is what the signature is checked against. */
  const ip =
    request.headers.get("x-real-ip") ??
    (process.env.NODE_ENV === "development" ? "127.0.0.1" : "");
  if (!isIP(ip)) return page(400, "Can't tell where you are", "Try again from the download page.");

  const release = await currentRelease(image);
  if (!release) {
    return page(
      503,
      "Not up yet",
      "This ISO hasn't been published yet. It's built with each weekly stable release; check back soon.",
      { "Retry-After": "3600" },
    );
  }

  const token = takeToken(ip);
  if (!token.ok) {
    const minutes = Math.max(1, Math.ceil(token.retryAfter / 60));
    return page(
      429,
      "That's a lot of downloads",
      `Each address gets a few download links an hour, so the server stays quick for everyone. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      { "Retry-After": String(token.retryAfter) },
    );
  }

  return new Response(null, {
    status: 302,
    headers: { Location: signedPath(release.file, ip), ...noStore },
  });
}
