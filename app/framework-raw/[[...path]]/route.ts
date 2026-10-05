import { readerMarkdown } from "@/lib/docs/pages";
import { docsIndex } from "@/lib/docs/source";
import { siteUrl } from "@/lib/site";

/* Every docs page as Markdown, at its URL plus .md (next.config.ts rewrites
   those here): for tools and language models that read Markdown better
   than HTML, and for anyone who wants to save a page. */

export const dynamic = "force-dynamic";

const text = (body: string, status: number) =>
  new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

export async function GET(_req: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  const index = await docsIndex();
  if (!index) return text("The docs can't be loaded right now. Try again in a minute.\n", 503);
  let out: Awaited<ReturnType<typeof readerMarkdown>>;
  try {
    out = await readerMarkdown(index, path);
  } catch (e) {
    console.error(`docs: couldn't read ${path.join("/") || "the overview"}: ${(e as Error).message}`);
    return text("The docs can't be loaded right now. Try again in a minute.\n", 503);
  }
  if (!out) return text("No such page.\n", 404);
  return new Response(out.md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      Link: `<${siteUrl}${out.href}>; rel="canonical"`,
    },
  });
}
