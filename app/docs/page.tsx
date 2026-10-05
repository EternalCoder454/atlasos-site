import type { Metadata } from "next";
import Link from "next/link";
import { DocsArticle, DocsUnavailable } from "@/components/docs/article";
import { docsOpenGraph, editUrl, neighbours, overview, rendered } from "@/lib/docs/pages";
import { docsIndex } from "@/lib/docs/source";

export const dynamic = "force-dynamic";

async function intro() {
  const index = await docsIndex();
  if (!index) return null;
  return { index, ...(await overview(index)) };
}

export async function generateMetadata(): Promise<Metadata> {
  const i = await intro();
  return {
    title: { absolute: "Atlas Framework docs" },
    description: i?.summary,
    alternates: { canonical: "/docs", types: { "text/markdown": "/docs.md" } },
    openGraph: docsOpenGraph(i?.title ?? "Atlas Framework docs", i?.summary ?? "", "/docs"),
  };
}

export default async function DocsHome() {
  const i = await intro();
  if (!i) return <DocsUnavailable />;
  const r = i.md !== null ? await rendered(i.index, "index.md").catch(() => null) : null;
  return (
    <DocsArticle
      title={i.title}
      summary={i.summary}
      html={r?.html ?? ""}
      headings={r?.headings ?? []}
      editUrl={i.md !== null ? editUrl("docs/reference/index.md") : undefined}
      {...neighbours(i.index, "/docs")}
    >
      <h2 className="mt-12 text-xl font-semibold tracking-tight">Libraries</h2>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {i.index.libraries.map((l) => (
          <li key={l.slug}>
            <Link href={`/docs/${l.slug}`} className="block h-full rounded-xl border border-line bg-ink-1 p-5 transition-colors hover:border-line-strong">
              <span className="font-semibold">{l.title}</span>
              <span className="mt-2 block text-sm text-text-2">{l.summary}</span>
              <span className="mt-3 block text-xs text-text-3">
                {l.pages.length} {l.pages.length === 1 ? "page" : "pages"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </DocsArticle>
  );
}
