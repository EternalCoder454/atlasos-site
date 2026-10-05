"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useMemo, useState } from "react";

/* The docs' sidebar: a search over every page's title and summary, then
   each library with its pages grouped by section. On narrow screens it
   folds into a "Browse the docs" disclosure above the page. */

export type NavPage = { slug: string; title: string; summary: string; section?: string };
export type NavLibrary = { slug: string; title: string; pages: NavPage[] };

function groups(pages: NavPage[]): [string, NavPage[]][] {
  const out = new Map<string, NavPage[]>();
  for (const p of pages) {
    const k = p.section ?? "";
    out.set(k, [...(out.get(k) ?? []), p]);
  }
  return [...out];
}

function Search({ libraries }: { libraries: NavLibrary[] }) {
  const [q, setQ] = useState("");
  const listId = useId();
  const all = useMemo(
    () =>
      libraries.flatMap((l) =>
        [{ href: `/framework/${l.slug}`, title: l.title, lib: "", text: l.title.toLowerCase() }].concat(
          l.pages.map((p) => ({
            href: `/framework/${l.slug}/${p.slug}`,
            title: p.title,
            lib: l.title,
            text: `${p.title} ${p.summary} ${l.title}`.toLowerCase(),
          })),
        ),
      ),
    [libraries],
  );
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = words.length ? all.filter((e) => words.every((w) => e.text.includes(w))).slice(0, 12) : [];

  return (
    <div className="relative">
      <label htmlFor={`${listId}-q`} className="sr-only">
        Search the docs
      </label>
      <input
        id={`${listId}-q`}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setQ("")}
        placeholder="Search the docs"
        autoComplete="off"
        spellCheck={false}
        aria-controls={words.length > 0 ? listId : undefined}
        className="w-full rounded-lg border border-line bg-ink-1 px-3 py-2 text-sm text-text placeholder:text-text-3 focus:border-violet focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />
      {words.length > 0 && (
        <ul id={listId} aria-live="polite" className="mt-2 space-y-0.5 text-sm">
          {hits.length === 0 && <li className="px-3 py-1.5 text-text-3">Nothing matches.</li>}
          {hits.map((h) => (
            <li key={h.href}>
              <Link href={h.href} onClick={() => setQ("")} className="block rounded-md px-3 py-1.5 text-text-2 hover:bg-ink-2 hover:text-text">
                {h.title}
                {h.lib && <span className="ml-2 text-xs text-text-3">{h.lib}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tree({ libraries }: { libraries: NavLibrary[] }) {
  const path = usePathname();
  const item = (href: string, label: string, strong = false) => {
    const here = path === href;
    return (
      <Link
        href={href}
        aria-current={here ? "page" : undefined}
        className={`block rounded-md px-3 py-1.5 transition-colors pointer-coarse:py-2.5 ${
          here ? "bg-violet-deep/25 text-text" : strong ? "text-text hover:bg-ink-2" : "text-text-2 hover:bg-ink-2 hover:text-text"
        } ${strong ? "font-semibold" : ""}`}
      >
        {label}
      </Link>
    );
  };
  return (
    <nav aria-label="Documentation" className="space-y-6 text-sm">
      <div>{item("/framework", "Overview", true)}</div>
      {libraries.map((l) => (
        <div key={l.slug}>
          {item(`/framework/${l.slug}`, l.title, true)}
          {groups(l.pages).map(([section, pages]) => (
            <div key={section} className="mt-1">
              {section && <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-text-3">{section}</p>}
              <ul className="space-y-0.5">
                {pages.map((p) => (
                  <li key={p.slug}>{item(`/framework/${l.slug}/${p.slug}`, p.title)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </nav>
  );
}

export function DocsNav({ libraries }: { libraries: NavLibrary[] }) {
  // Keyed by the page, so the narrow-screen disclosure closes on navigation.
  const path = usePathname();
  return (
    <>
      <details key={path} className="group mb-6 rounded-xl border border-line bg-ink-1 lg:hidden">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-text-2 group-open:border-b group-open:border-line">
          Browse the docs
        </summary>
        <div className="space-y-5 p-3">
          <Search libraries={libraries} />
          <Tree libraries={libraries} />
        </div>
      </details>
      <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] space-y-5 overflow-y-auto pb-8 pr-2 lg:block">
        <Search libraries={libraries} />
        <Tree libraries={libraries} />
      </aside>
    </>
  );
}
