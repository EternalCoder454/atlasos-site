import "server-only";
import { parse } from "yaml";
import { ogImage, site, siteUrl } from "@/lib/site";
import { renderCached, resolveLink, stripFrontmatter, type Rendered } from "@/lib/docs/render";
import { docsMarkdown, docsRepo, findLibrary, findPage, type DocsIndex, type DocsLibrary, type DocsPage } from "@/lib/docs/source";
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
  const out: PageLink[] = [{ href: "/docs", title: "Overview" }];
  for (const l of index.libraries) {
    out.push({ href: `/docs/${l.slug}`, title: l.title });
    for (const p of sectionOrder(l.pages)) out.push({ href: `/docs/${l.slug}/${p.slug}`, title: p.title });
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
  // Bounded, so a page of "](" with no ")" can't make this quadratic.
  const body = stripFrontmatter(md).replace(/(\]\()([^)\s\]]{1,1024})(\))/g, (all, open: string, href: string, close: string) => {
    if (/^[a-z][a-z0-9+.-]*:|^\/\/|^#/i.test(href)) return all;
    const to = resolveLink(href, { file });
    if (!to) return all;
    const hashAt = to.indexOf("#");
    const target = hashAt === -1 ? to : to.slice(0, hashAt);
    const hash = hashAt === -1 ? "" : to.slice(hashAt);
    const abs = target.includes("/images/") ? `${siteUrl}${target}` : `${siteUrl}${target}.md${hash}`;
    return `${open}${abs}${close}`;
  });
  return `# ${mdText(title)}\n\n> ${mdText(summary)}\n\n${body.trim()}\n`;
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
  title: "Atlas Framework",
  summary: "The shared base every Atlas app builds on: the Atlas.Ui controls, the icons and the Rust crates.",
};

/* The overview's title and summary: from the frontmatter of the docs' own
   index.md when it has them, the defaults above when not. */
export async function overview(index: DocsIndex): Promise<{ title: string; summary: string; md: string | null }> {
  const md = await docsMarkdown(index, "index.md").catch(() => null);
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

/* Per index commit, like the rendered pages. */
export function readerMarkdown(index: DocsIndex, parts: string[]): Promise<Reader> {
  const key = `${index.commit}:${parts.join("/")}`;
  let p = readerCache.get(key);
  if (!p) {
    p = buildReader(index, parts);
    p.catch(() => readerCache.delete(key));
    if (readerCache.size >= 600) readerCache.delete(readerCache.keys().next().value!);
    readerCache.set(key, p);
  }
  return p;
}

async function buildReader(index: DocsIndex, parts: string[]): Promise<Reader> {
  if (parts.length === 0) {
    const o = await overview(index);
    const list = index.libraries.map((l) => `- [${mdText(l.title)}](${siteUrl}/docs/${l.slug}.md): ${mdText(l.summary)}`).join("\n");
    const body = `${o.md ?? ""}\n\n## Libraries\n\n${list}\n`;
    return { md: markdownForReaders(body, "index.md", o.title, o.summary), href: "/docs" };
  }
  const lib = findLibrary(index, parts[0]);
  if (!lib || parts.length > 2) return null;
  if (parts.length === 1) {
    const md = (await docsMarkdown(index, `${lib.slug}/index.md`)) ?? "";
    const list = sectionOrder(lib.pages).map((p) => `- [${mdText(p.title)}](${p.slug}.md): ${mdText(p.summary)}`).join("\n");
    const body = lib.pages.length ? `${md}\n\n## Pages\n\n${list}\n` : md;
    return { md: markdownForReaders(body, `${lib.slug}/index.md`, lib.title, lib.summary), href: `/docs/${lib.slug}` };
  }
  const page = findPage(lib, parts[1]);
  if (!page) return null;
  const md = await docsMarkdown(index, page.path);
  if (md === null) return null;
  return { md: markdownForReaders(md, page.path, page.title, page.summary), href: `/docs/${lib.slug}/${page.slug}` };
}
