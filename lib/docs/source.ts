import "server-only";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* The atlas-framework documentation. The framework's CI checks the Markdown
   in its docs/reference/ and force-pushes the result to the docs-published
   branch: one index.json, and <library>/<page>.md with <library>/images/.
   The site reads that branch at runtime, so a docs change goes live within
   a few minutes without a deploy.

   DOCS_SOURCE points somewhere else: another https base, or a file: URL of
   a folder in the same shape (the fixture in tests/docs-fixture/). */

const source = process.env.DOCS_SOURCE ?? "https://raw.githubusercontent.com/EternalCoder454/atlas-framework/docs-published";

export const docsRepo = "https://github.com/EternalCoder454/atlas-framework";

/* How long a fetched index counts as current. A page's Markdown is cached
   by the commit the index names, so it follows the index. */
const indexTtl = 5 * 60_000;
/* After a failed refresh, how long before the next try. The last good
   index keeps being served meanwhile. */
const retryAfter = 30_000;
const timeoutMs = 8_000;

const maxIndexBytes = 1 << 20;
const maxPageBytes = 512 << 10;
export const maxImageBytes = 4 << 20;

export type DocsPage = {
  slug: string;
  title: string;
  summary: string;
  order: number;
  since?: string;
  section?: string;
  deprecated?: string;
  /* <library>/<page>.md on docs-published */
  path: string;
  /* docs/reference/<library>/<page>.md on main, for "Edit on GitHub" */
  source: string;
};

export type DocsLibrary = {
  slug: string;
  title: string;
  summary: string;
  order: number;
  pages: DocsPage[];
};

export type DocsIndex = {
  version: string;
  released: boolean;
  commit: string;
  generated: string;
  libraries: DocsLibrary[];
};

/* Slugs end up in URLs and in paths on the source, so they are exactly
   this shape. "images" and "index" are taken by the site's own routes. */
const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* More than the framework will ever have, and few enough that llms-full.txt
   and the sitemap stay small whatever index.json says. */
const maxLibraries = 50;
const maxPages = 500;
const reserved = new Set(["images", "index"]);

function str(v: unknown, max: number): string | null {
  return typeof v === "string" && v.length > 0 && v.length <= max && !/[\u0000-\u001f]/.test(v) ? v : null;
}

function optStr(v: unknown, max: number): string | undefined | null {
  return v === undefined || v === null ? undefined : str(v, max);
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function byOrder<T extends { order: number; title: string }>(a: T, b: T): number {
  return a.order - b.order || a.title.localeCompare(b.title);
}

/* Anything malformed is left out with a log line, rather than taking the
   whole documentation down. Exported for the tests. */
export function parseIndex(raw: unknown): DocsIndex | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const version = str(r.version, 32);
  const commit = typeof r.commit === "string" && /^[0-9a-f]{7,64}$/.test(r.commit) ? r.commit : null;
  if (!version || !commit || !Array.isArray(r.libraries)) return null;

  const libraries: DocsLibrary[] = [];
  const seenLib = new Set<string>();
  let pageCount = 0;
  for (const l of r.libraries as unknown[]) {
    if (libraries.length >= maxLibraries) {
      console.error(`docs: index.json lists more than ${maxLibraries} libraries; the rest are left out`);
      break;
    }
    if (typeof l !== "object" || l === null) continue;
    const lib = l as Record<string, unknown>;
    const slug = str(lib.slug, 64);
    const title = str(lib.title, 120);
    const summary = str(lib.summary, 400);
    if (!slug || !slugRe.test(slug) || reserved.has(slug) || seenLib.has(slug) || !title || !summary || !Array.isArray(lib.pages)) {
      console.error(`docs: skipping a malformed library in index.json (${String(lib.slug)})`);
      continue;
    }
    seenLib.add(slug);
    const pages: DocsPage[] = [];
    const seenPage = new Set<string>();
    for (const p of lib.pages as unknown[]) {
      if (pageCount >= maxPages) {
        console.error(`docs: index.json lists more than ${maxPages} pages; the rest are left out`);
        break;
      }
      if (typeof p !== "object" || p === null) continue;
      const pg = p as Record<string, unknown>;
      const pslug = str(pg.slug, 80);
      const ptitle = str(pg.title, 160);
      const psummary = str(pg.summary, 400);
      const since = optStr(pg.since, 32);
      const section = optStr(pg.section, 60);
      const deprecated = optStr(pg.deprecated, 300);
      // The library's own index.md is its overview page, not a page in the list.
      if (pslug === "index") continue;
      if (
        !pslug || !slugRe.test(pslug) || reserved.has(pslug) || seenPage.has(pslug) ||
        !ptitle || !psummary || since === null || section === null || deprecated === null ||
        pg.path !== `${slug}/${pslug}.md` ||
        pg.source !== `docs/reference/${slug}/${pslug}.md`
      ) {
        console.error(`docs: skipping a malformed page in index.json (${slug}/${String(pg.slug)})`);
        continue;
      }
      seenPage.add(pslug);
      pageCount++;
      pages.push({
        slug: pslug, title: ptitle, summary: psummary, order: num(pg.order),
        since, section, deprecated,
        path: pg.path as string, source: pg.source as string,
      });
    }
    pages.sort(byOrder);
    libraries.push({ slug, title, summary, order: num(lib.order), pages });
  }
  libraries.sort(byOrder);
  return {
    version,
    released: r.released === true,
    commit,
    generated: typeof r.generated === "string" ? r.generated.slice(0, 40) : "",
    libraries,
  };
}

async function readCapped(res: Response, max: number): Promise<Uint8Array> {
  const len = Number(res.headers.get("content-length"));
  if (len > max) throw new Error(`larger than ${max} bytes`);
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      throw new Error(`larger than ${max} bytes`);
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.byteLength;
  }
  return out;
}

/* One file from the source. null when it isn't there (404, or no such
   file); an error for anything else, so a GitHub outage isn't mistaken
   for a page that was deleted. */
export async function fetchSource(rel: string, max: number): Promise<Uint8Array | null> {
  if (source.startsWith("file:")) {
    const root = fileURLToPath(source.endsWith("/") ? source : `${source}/`);
    const file = path.resolve(root, rel);
    if (!file.startsWith(root)) throw new Error(`outside the docs folder: ${rel}`);
    try {
      if ((await stat(file)).size > max) throw new Error(`larger than ${max} bytes`);
      const buf = await readFile(file);
      if (buf.byteLength > max) throw new Error(`larger than ${max} bytes`);
      return new Uint8Array(buf);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }
  const res = await fetch(`${source}/${rel}`, {
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
    redirect: "error",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return readCapped(res, max);
}

const decoder = new TextDecoder("utf-8", { fatal: true });

/* What else caches by commit (rendered pages, the readers' Markdown)
   empties itself here when a new commit is published. */
const commitListeners: (() => void)[] = [];
export function onNewCommit(fn: () => void): void {
  commitListeners.push(fn);
}

let current: { at: number; index: DocsIndex | null; failedAt: number } = { at: 0, index: null, failedAt: 0 };
let inflight: Promise<DocsIndex | null> | null = null;

async function loadIndex(): Promise<DocsIndex | null> {
  try {
    const buf = await fetchSource("index.json", maxIndexBytes);
    if (!buf) throw new Error("index.json is missing");
    const index = parseIndex(JSON.parse(decoder.decode(buf)));
    if (!index) throw new Error("index.json isn't in the expected shape");
    if (index.commit !== current.index?.commit) {
      pageCache.clear();
      for (const fn of commitListeners) fn();
    }
    current = { at: Date.now(), index, failedAt: 0 };
  } catch (e) {
    console.error(`docs: couldn't refresh index.json from ${source}: ${(e as Error).message}`);
    current = { ...current, failedAt: Date.now() };
  }
  return current.index;
}

/* The current index, or the last good one while the source can't be
   reached; null only if it never could be. Refreshes in the background
   once stale, so a request never waits on GitHub when there is something
   to show. */
export async function docsIndex(): Promise<DocsIndex | null> {
  const now = Date.now();
  const stale = now - current.at > indexTtl && now - current.failedAt > retryAfter;
  if (stale && !inflight) {
    inflight = loadIndex().finally(() => {
      inflight = null;
    });
  }
  if (current.index) return current.index;
  return inflight ?? current.index;
}

export function findLibrary(index: DocsIndex, slug: string): DocsLibrary | undefined {
  return index.libraries.find((l) => l.slug === slug);
}

export function findPage(lib: DocsLibrary, slug: string): DocsPage | undefined {
  return lib.pages.find((p) => p.slug === slug);
}

/* Markdown by path, kept per index commit. Bounded: the whole framework's
   docs are a few hundred pages at most. */
const pageCache = new Map<string, Promise<string | null>>();
/* Every page, each library's overview and the docs' own: all fit. */
const maxCachedPages = 600;

export function docsMarkdown(index: DocsIndex, rel: string): Promise<string | null> {
  const key = `${index.commit}:${rel}`;
  let p = pageCache.get(key);
  if (!p) {
    const mine = fetchSource(rel, maxPageBytes).then((buf) => (buf ? decoder.decode(buf) : null));
    p = mine;
    // A failure isn't remembered: the next request tries again.
    mine.catch(() => {
      if (pageCache.get(key) === mine) pageCache.delete(key);
    });
    if (pageCache.size >= maxCachedPages) pageCache.delete(pageCache.keys().next().value!);
    pageCache.set(key, p);
  }
  return p;
}

/* The docs' images, per index commit, 404s included, so a run of requests
   for made-up names costs GitHub one fetch per name per commit at most and
   a popular image is fetched once. Least recently used goes first, bounded
   in bytes and in entries. */
const imageCache = new Map<string, Promise<Uint8Array | null>>();
const imageSizes = new Map<string, number>();
const maxCachedImageBytes = 64 << 20;
const maxCachedImages = 2000;
let cachedImageBytes = 0;

function evictImage(key: string) {
  imageCache.delete(key);
  cachedImageBytes -= imageSizes.get(key) ?? 0;
  imageSizes.delete(key);
}

export function docsImage(index: DocsIndex, rel: string): Promise<Uint8Array | null> {
  const key = `${index.commit}:${rel}`;
  const hit = imageCache.get(key);
  if (hit) {
    imageCache.delete(key);
    imageCache.set(key, hit);
    return hit;
  }
  const p = fetchSource(rel, maxImageBytes);
  imageCache.set(key, p);
  p.then(
    (buf) => {
      if (imageCache.get(key) !== p) return;
      imageSizes.set(key, buf?.byteLength ?? 0);
      cachedImageBytes += buf?.byteLength ?? 0;
      while ((cachedImageBytes > maxCachedImageBytes || imageCache.size > maxCachedImages) && imageCache.size > 1) {
        evictImage(imageCache.keys().next().value!);
      }
    },
    // A failure isn't remembered: the next request tries again.
    () => {
      if (imageCache.get(key) === p) evictImage(key);
    },
  );
  return p;
}
