import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsArticle } from "@/components/docs/article";
import { docsOpenGraph, editUrl, neighbours, rendered } from "@/lib/docs/pages";
import { docsIndex, findLibrary, findPage } from "@/lib/docs/source";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ library: string; page: string }> };

async function load(params: Props["params"]) {
  const { library, page } = await params;
  const index = await docsIndex();
  const lib = index ? findLibrary(index, library) : undefined;
  const pg = lib ? findPage(lib, page) : undefined;
  return index && lib && pg ? { index, lib, page: pg } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await load(params);
  if (!d) return {};
  const href = `/docs/${d.lib.slug}/${d.page.slug}`;
  return {
    title: `${d.page.title} · ${d.lib.title}`,
    description: d.page.summary,
    alternates: { canonical: href, types: { "text/markdown": `${href}.md` } },
    openGraph: docsOpenGraph(`${d.page.title} · ${d.lib.title}`, d.page.summary, href),
  };
}

export default async function DocPage({ params }: Props) {
  const d = await load(params);
  if (!d) notFound();
  const { index, lib, page } = d;
  const r = await rendered(index, page.path);
  // Listed in index.json, but the file isn't there (a publish in progress).
  if (!r) notFound();
  return (
    <DocsArticle
      title={page.title}
      summary={page.summary}
      html={r.html}
      headings={r.headings}
      since={page.since}
      deprecated={page.deprecated}
      editUrl={editUrl(page.source)}
      {...neighbours(index, `/docs/${lib.slug}/${page.slug}`)}
    />
  );
}
