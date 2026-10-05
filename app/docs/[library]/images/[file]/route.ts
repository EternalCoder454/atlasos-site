import { docsImage, docsIndex, findLibrary } from "@/lib/docs/source";

/* The docs' own images, from <library>/images/ on docs-published. Served
   from this site so the CSP can stay at img-src 'self'. */

export const dynamic = "force-dynamic";

const types: Record<string, string> = {
  png: "image/png",
  webp: "image/webp",
  svg: "image/svg+xml",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
};

const fileRe = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(png|webp|svg|jpe?g|gif)$/;

const notFound = () => new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });

export async function GET(_req: Request, { params }: { params: Promise<{ library: string; file: string }> }) {
  const { library, file } = await params;
  const m = fileRe.exec(file);
  if (!m || file.includes("..")) return notFound();
  const index = await docsIndex();
  if (!index) return new Response("Unavailable\n", { status: 503 });
  const lib = findLibrary(index, library);
  if (!lib) return notFound();
  let body: Uint8Array | null;
  try {
    body = await docsImage(index, `${lib.slug}/images/${file}`);
  } catch (e) {
    console.error(`docs: couldn't fetch ${lib.slug}/images/${file}: ${(e as Error).message}`);
    return new Response("Unavailable\n", { status: 503 });
  }
  if (!body) return notFound();
  const headers = {
    "Content-Type": types[m[1].toLowerCase()],
    "Cache-Control": "public, max-age=300",
  };
  // The CSP for these (sandboxed, nothing allowed) is set in next.config.ts.
  return new Response(body as BodyInit, { headers });
}
