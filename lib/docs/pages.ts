import "server-only";
import { parse } from "yaml";
import { ogImage, site, siteUrl } from "@/lib/site";
import { renderCached, resolveLink, stripFrontmatter, type Rendered } from "@/lib/docs/render";
import { docsMarkdown, docsRepo, findLibrary, findPage, onNewCommit, type DocsIndex, type DocsLibrary, type DocsPage } from "@/lib/docs/source";
import type { NavLibrary } from "@/components/docs/nav";
import type { PageLink } from "@/components/docs/article";

/* What the routes share: the sidebar's data, every page in reading order
   (for previous and next), and a page's Markdown rendered. */

export function navData(index: DocsIndex): NavLibrary[] {
  return index.libraries.map((l) => ({
    slug: l.slug,
    title: l.title,
    pages: l.pages.map((p) => ({ slug: p.slug, title: p.title, summary: p.summary, section: p.section })),
  }));
}

/* The order the sidebar shows them in: the overview, then each library's
   overview and its pages. */
export function readingOrder(index: DocsIndex): PageLink[] {
  const out: PageLink[] = [{ href: "/framework", title: "Overview" }];
  for (const l of index.libraries) {
    out.push({ href: `/framework/${l.slug}`, title: l.title });
    for (const p of sectionOrder(l.pages)) out.push({ href: `/framework/${l.slug}/${p.slug}`, title: p.title });
  }
  return out;
}

/* Pages grouped by section in the order sections first appear, as the
   sidebar groups them. */
export function sectionOrder(pages: DocsPage[]): DocsPage[] {
  const groups = new Map<string, DocsPage[]>();
  for (const p of pages) groups.set(p.section ?? "", [...(groups.get(p.section ?? "") ?? []), p]);
  return [...groups.values()].flat();
}

export function neighbours(index: DocsIndex, href: string): { prev?: PageLink; next?: PageLink } {
  const order = readingOrder(index);
  const i = order.findIndex((p) => p.href === href);
  if (i === -1) return {};
  return { prev: order[i - 1], next: order[i + 1] };
}

export function editUrl(sourcePath: string): string {
  return `${docsRepo}/edit/main/${sourcePath}`;
}

/* A page's Markdown file on docs-published: the docs overview, a library's
   overview or one page. */
export function markdownPath(lib?: DocsLibrary, page?: DocsPage): string {
  if (!lib) return "index.md";
  if (!page) return `${lib.slug}/index.md`;
  return page.path;
}

export async function rendered(index: DocsIndex, file: string): Promise<Rendered | null> {
  const md = await docsMarkdown(index, file);
  if (md === null) return null;
  return renderCached(index.commit, md, { file });
}

/* The Markdown for readers that want it as Markdown (the .md URLs and
   llms-full.txt): the frontmatter replaced by the title and summary, and
   relative links made absolute .md URLs, so they work wherever the text
   ends up. */
export function markdownForReaders(md: string, file: string, title: string, summary: string): string {
  const absolute = (href: string): string | null => {
    if (/^[a-z][a-z0-9+.-]*:|^\/\/|^#/i.test(href)) return null;
    const to = resolveLink(href, { file });
    if (!to) return null;
    const hashAt = to.indexOf("#");
    const target = hashAt === -1 ? to : to.slice(0, hashAt);
    const hash = hashAt === -1 ? "" : to.slice(hashAt);
    return target.includes("/images/") ? `${siteUrl}${target}` : `${siteUrl}${target}.md${hash}`;
  };
  // Links outside fenced code: inline ones (bounded, so a page of "](" with
  // no ")" can't make this quadratic), with or without a title, and
  // reference definitions. Code samples stay as written.
  let fence: string | null = null;
  const lines = stripFrontmatter(md).split("\n").map((line) => {
    const f = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (f && f[1][0] === fence[0] && f[1].length >= fence.length && line.trim() === f[1]) fence = null;
      return line;
    }
    if (f) {
      fence = f[1];
      return line;
    }
    const def = /^( {0,3}\[[^\]\n]{1,200}\]:[ \t]*)<?([^\s>]{1,1024})>?(.*)$/.exec(line);
    if (def) {
      const abs = absolute(def[2]);
      return abs ? `${def[1]}${abs}${def[3]}` : line;
    }
    return line.replace(/(\]\(<?)([^)\s\]>]{1,1024})(>?(?:\s+"[^"\n]{0,200}")?\))/g, (all, open: string, href: string, close: string) => {
      const abs = absolute(href);
      return abs ? `${open}${abs}${close}` : all;
    });
  });
  return `# ${mdText(title)}\n\n> ${mdText(summary)}\n\n${lines.join("\n").trim()}\n`;
}

/* Text from index.json in Markdown: as words, never as links or tags. */
export function mdText(s: string): string {
  return s.replace(/[\\[\]()<>*_`]/g, "\\$&");
}

/* The social card for a docs page: the site's picture, the page's words. */
export function docsOpenGraph(title: string, description: string, href: string) {
  return { type: "article" as const, siteName: site.name, title, description, url: href, locale: "en_US", images: [ogImage] };
}

const overviewFallback = {
  title: "Telamon Framework",
  summary: "The shared base every Telamon app builds on: the Telamon.Ui controls, the icons and the Rust crates.",
};

/* The overview's title and summary: from the frontmatter of the docs' own
   index.md when it has them, the defaults above when not. */
export async function overview(
  index: DocsIndex,
  { strict = false } = {},
): Promise<{ title: string; summary: string; md: string | null }> {
  // The HTML page shows the defaults when index.md can't be read; the
  // readers' copy is cached, so it fails rather than keep a gap.
  const md = strict ? await docsMarkdown(index, "index.md") : await docsMarkdown(index, "index.md").catch(() => null);
  let { title, summary } = overviewFallback;
  const m = md ? /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/.exec(md) : null;
  if (m) {
    try {
      const fm = parse(m[1]) as Record<string, unknown> | null;
      if (typeof fm?.title === "string" && fm.title.length > 0 && fm.title.length <= 120) title = fm.title;
      if (typeof fm?.summary === "string" && fm.summary.length > 0 && fm.summary.length <= 400) summary = fm.summary;
    } catch {
      // Unreadable frontmatter: the defaults.
    }
  }
  return { title, summary, md };
}

/* One docs URL as a reader's Markdown: [] the overview, [lib] a library's
   overview, [lib, page] a page. null when there is no such page. */
type Reader = { md: string; href: string } | null;
const readerCache = new Map<string, Promise<Reader>>();
onNewCommit(() => readerCache.clear());

/* Per index commit, like the rendered pages. */
export function readerMarkdown(index: DocsIndex, parts: string[]): Promise<Reader> {
  // Only real pages get a cache entry: made-up paths can't push them out.
  const lib = parts.length > 0 ? findLibrary(index, parts[0]) : undefined;
  if (parts.length > 2 || (parts.length > 0 && !lib) || (parts.length === 2 && !findPage(lib!, parts[1]))) {
    return Promise.resolve(null);
  }
  const key = `${index.commit}:${parts.join("/")}`;
  let p = readerCache.get(key);
  if (!p) {
    const mine = buildReader(index, parts);
    p = mine;
    mine.catch(() => {
      if (readerCache.get(key) === mine) readerCache.delete(key);
    });
    if (readerCache.size >= 600) readerCache.delete(readerCache.keys().next().value!);
    readerCache.set(key, p);
  }
  return p;
}

async function buildReader(index: DocsIndex, parts: string[]): Promise<Reader> {
  if (parts.length === 0) {
    const o = await overview(index, { strict: true });
    const list = index.libraries.map((l) => `- [${mdText(l.title)}](${siteUrl}/framework/${l.slug}.md): ${mdText(l.summary)}`).join("\n");
    const body = `${o.md ?? ""}\n\n## Libraries\n\n${list}\n`;
    return { md: markdownForReaders(body, "index.md", o.title, o.summary), href: "/framework" };
  }
  const lib = findLibrary(index, parts[0]);
  if (!lib || parts.length > 2) return null;
  if (parts.length === 1) {
    const md = (await docsMarkdown(index, `${lib.slug}/index.md`)) ?? "";
    const list = sectionOrder(lib.pages).map((p) => `- [${mdText(p.title)}](${p.slug}.md): ${mdText(p.summary)}`).join("\n");
    const body = lib.pages.length ? `${md}\n\n## Pages\n\n${list}\n` : md;
    return { md: markdownForReaders(body, `${lib.slug}/index.md`, lib.title, lib.summary), href: `/framework/${lib.slug}` };
  }
  const page = findPage(lib, parts[1]);
  if (!page) return null;
  const md = await docsMarkdown(index, page.path);
  if (md === null) return null;
  return { md: markdownForReaders(md, page.path, page.title, page.summary), href: `/framework/${lib.slug}/${page.slug}` };
}
