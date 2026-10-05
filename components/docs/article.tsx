import Link from "next/link";
import { CopyCode } from "@/components/docs/copy-code";
import type { Heading } from "@/lib/docs/render";

/* One docs page: its title and summary, the rendered Markdown, then the
   way on. "On this page" sits beside it on wide screens. */

export type PageLink = { href: string; title: string };

export function DocsArticle({
  title,
  summary,
  html,
  headings,
  since,
  deprecated,
  editUrl,
  prev,
  next,
  children,
}: {
  title: string;
  summary: string;
  html: string;
  headings: Heading[];
  since?: string;
  deprecated?: string;
  editUrl?: string;
  prev?: PageLink;
  next?: PageLink;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-10 xl:grid-cols-[minmax(0,1fr)_13rem]">
      <article data-docs-article className="min-w-0">
        <header className="border-b border-line pb-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 text-lg text-text-2">{summary}</p>
          {(since || deprecated) && (
            <p className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
              {since && <span className="rounded-full border border-line px-2.5 py-1 text-text-2">Since {since}</span>}
              {deprecated && <span className="rounded-full bg-sakura/15 px-2.5 py-1 text-sakura">Deprecated</span>}
            </p>
          )}
          {deprecated && (
            <div className="callout callout-caution mt-5" role="note">
              <p className="callout-title">Deprecated</p>
              <p>{deprecated}</p>
            </div>
          )}
        </header>
        <div className="docs-prose mt-8" dangerouslySetInnerHTML={{ __html: html }} />
        {children}
        <footer className="mt-14 border-t border-line pt-6 text-sm">
          {(prev || next) && (
            <nav aria-label="Pages" className="grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link href={prev.href} className="rounded-xl border border-line p-4 hover:border-line-strong">
                  <span className="block text-xs text-text-3">Previous</span>
                  <span className="mt-1 block font-medium">{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link href={next.href} className="rounded-xl border border-line p-4 text-right hover:border-line-strong">
                  <span className="block text-xs text-text-3">Next</span>
                  <span className="mt-1 block font-medium">{next.title}</span>
                </Link>
              )}
            </nav>
          )}
          {editUrl && (
            <p className="mt-6">
              <a href={editUrl} className="text-text-2 underline decoration-line-strong underline-offset-4 hover:text-text">
                Edit this page on GitHub
              </a>
            </p>
          )}
        </footer>
        <CopyCode />
      </article>
      {headings.length > 1 && (
        <aside className="hidden xl:block">
          <nav aria-label="On this page" className="sticky top-20 text-sm">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-3">On this page</p>
            <ul className="space-y-1.5 border-l border-line">
              {headings.map((h) => (
                <li key={h.id} className={h.depth === 3 ? "pl-6" : "pl-3"}>
                  <a href={`#${h.id}`} className="-ml-px block border-l border-transparent pl-0 text-text-2 hover:text-text">
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      )}
    </div>
  );
}

export function DocsUnavailable() {
  return (
    <div className="max-w-xl py-10">
      <h1 className="text-3xl font-semibold tracking-tight">The docs can&apos;t be loaded right now</h1>
      <p className="mt-3 text-text-2">
        They come from the atlas-framework repository on GitHub, which didn&apos;t answer. Try again in a minute, or read them
        there:{" "}
        <a className="text-violet-hi underline underline-offset-4" href="https://github.com/EternalCoder454/atlas-framework/tree/main/docs/reference">
          docs/reference
        </a>
        .
      </p>
    </div>
  );
}
