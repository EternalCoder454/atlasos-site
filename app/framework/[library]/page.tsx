import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsArticle } from "@/components/docs/article";
import { docsOpenGraph, editUrl, neighbours, rendered, sectionOrder } from "@/lib/docs/pages";
import { docsIndex, findLibrary } from "@/lib/docs/source";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ library: string }> };

async function load(params: Props["params"]) {
  const { library } = await params;
  const index = await docsIndex();
  const lib = index ? findLibrary(index, library) : undefined;
  return index && lib ? { index, lib } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await load(params);
  if (!d) return {};
  return {
    title: d.lib.title,
    description: d.lib.summary,
    alternates: { canonical: `/framework/${d.lib.slug}`, types: { "text/markdown": `/framework/${d.lib.slug}.md` } },
    openGraph: docsOpenGraph(d.lib.title, d.lib.summary, `/framework/${d.lib.slug}`),
  };
}

export default async function LibraryPage({ params }: Props) {
  const d = await load(params);
  if (!d) notFound();
  const { index, lib } = d;
  // A library without an index.md still gets its page: the list below.
  const r = await rendered(index, `${lib.slug}/index.md`);
  const pages = sectionOrder(lib.pages);
  return (
    <DocsArticle
      title={lib.title}
      summary={lib.summary}
      html={r?.html ?? ""}
      headings={r?.headings ?? []}
      editUrl={r ? editUrl(`docs/reference/${lib.slug}/index.md`) : undefined}
      {...neighbours(index, `/framework/${lib.slug}`)}
    >
      {lib.pages.length > 0 && (
        <>
          <h2 className="mt-12 text-xl font-semibold tracking-tight">Pages</h2>
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
            {pages.map((p, i) => {
              // A section's name above its first page.
              const heading = p.section && p.section !== pages[i - 1]?.section ? p.section : null;
              return (
                <li key={p.slug}>
                  {heading && <p className="bg-ink-1 px-5 pb-2 pt-4 text-xs font-medium uppercase tracking-wider text-text-3">{heading}</p>}
                  <Link href={`/framework/${lib.slug}/${p.slug}`} className="block px-5 py-4 hover:bg-ink-1">
                    <span className="font-medium">{p.title}</span>
                    {p.deprecated && <span className="ml-2 text-xs text-sakura">Deprecated</span>}
                    <span className="mt-1 block text-sm text-text-2">{p.summary}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </DocsArticle>
  );
}
