import "server-only";
import path from "node:path";
import type { Element, ElementContent, Root, RootContent, Text } from "hast";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { unified } from "unified";

/* Markdown from the framework's docs to HTML for the page. Everything the
   Markdown says goes through rehype-sanitize first (raw HTML never makes
   it: remark-rehype drops it). Only then come the site's own changes:
   callouts, link and image targets, heading anchors and highlighted code,
   which add markup the site writes itself. */

export type Heading = { depth: 2 | 3; id: string; text: string };
export type Rendered = { html: string; headings: Heading[] };

/* Where the Markdown came from, for resolving its relative links:
   "atlas-ui/primary-button.md", "atlas-ui/index.md" or "index.md". */
export type RenderContext = { file: string };

/* Leading YAML frontmatter. The site takes titles and summaries from
   index.json, so the block is only cut off here. */
export function stripFrontmatter(md: string): string {
  const m = /^﻿?---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/.exec(md);
  return m ? md.slice(m[0].length) : md;
}

const langLoaders = {
  qml: () => import("shiki/langs/qml.mjs"),
  rust: () => import("shiki/langs/rust.mjs"),
  toml: () => import("shiki/langs/toml.mjs"),
  shellscript: () => import("shiki/langs/shellscript.mjs"),
  cmake: () => import("shiki/langs/cmake.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  jsonc: () => import("shiki/langs/jsonc.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
  ini: () => import("shiki/langs/ini.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  cpp: () => import("shiki/langs/cpp.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
};
type Lang = keyof typeof langLoaders;

const aliases: Record<string, Lang> = {
  sh: "shellscript", bash: "shellscript", shell: "shellscript", console: "shellscript", zsh: "shellscript",
  rs: "rust", yml: "yaml", js: "javascript", ts: "typescript", py: "python", "c++": "cpp",
};

function resolveLang(name: string): Lang | null {
  const n = name.toLowerCase();
  if (n in langLoaders) return n as Lang;
  return aliases[n] ?? null;
}

const theme = "tokyo-night";
let highlighter: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighter) {
    highlighter = createHighlighterCore({
      themes: [import("shiki/themes/tokyo-night.mjs")],
      langs: Object.values(langLoaders).map((load) => load()),
      // The JavaScript engine: no WebAssembly to load, and fast enough for
      // a few code blocks a page.
      engine: createJavaScriptRegexEngine(),
    });
    highlighter.catch(() => {
      highlighter = null;
    });
  }
  return highlighter;
}

function textOf(node: ElementContent | RootContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(textOf).join("");
  return "";
}

function el(tagName: string, properties: Element["properties"], children: ElementContent[]): Element {
  return { type: "element", tagName, properties, children };
}

/* GitHub's heading anchors: lower case, punctuation dropped, spaces to
   hyphens, and -1, -2... for repeats, skipping any id already taken (so
   "a", "a", "a-1" gives a, a-1, a-1-1). The page's own ids are taken
   from the start. */
const pageIds = ["main"];

function slugger() {
  const taken = new Set(pageIds);
  return (text: string): string => {
    let base = text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .replace(/\s/g, "-");
    if (!base) base = "section";
    let id = base;
    for (let n = 1; taken.has(id); n++) id = `${base}-${n}`;
    taken.add(id);
    return id;
  };
}

/* Links inside a heading as plain words: the heading itself becomes the
   anchor link, and links don't nest. */
function unlink(nodes: ElementContent[]): ElementContent[] {
  return nodes.map((n) => {
    if (n.type !== "element") return n;
    if (n.tagName === "a") return el("span", {}, unlink(n.children));
    return { ...n, children: unlink(n.children) };
  });
}

const imageFile = /^[A-Za-z0-9][A-Za-z0-9._-]*\.(?:png|webp|svg|jpe?g|gif)$/;

/* A relative link in the Markdown to the site's URL for it, or null when
   it points nowhere the site serves. */
export function resolveLink(href: string, ctx: RenderContext): string | null {
  const hashAt = href.indexOf("#");
  const target = hashAt === -1 ? href : href.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : href.slice(hashAt);
  if (target === "") return hash || null;
  let rel: string;
  try {
    rel = path.posix.normalize(path.posix.join(path.posix.dirname(ctx.file), decodeURIComponent(target)));
  } catch {
    return null;
  }
  if (rel.startsWith("../") || rel.startsWith("/")) return null;
  if (rel === "index.md") return `/docs${hash}`;
  let m = /^([a-z0-9-]+)\/index\.md$/.exec(rel);
  if (m) return `/docs/${m[1]}${hash}`;
  m = /^([a-z0-9-]+)\/([a-z0-9-]+)\.md$/.exec(rel);
  if (m) return `/docs/${m[1]}/${m[2]}${hash}`;
  m = /^([a-z0-9-]+)\/images\/([^/]+)$/.exec(rel);
  if (m && imageFile.test(m[2])) return `/docs/${m[1]}/images/${m[2]}`;
  return null;
}

const alertKinds: Record<string, string> = {
  NOTE: "Note",
  TIP: "Tip",
  IMPORTANT: "Important",
  WARNING: "Warning",
  CAUTION: "Caution",
};

/* > [!NOTE] ... as a callout. The marker is the first text of the
   blockquote's first paragraph. */
function callout(node: Element): Element | null {
  const first = node.children.find((c) => c.type === "element") as Element | undefined;
  if (!first || first.tagName !== "p") return null;
  const t = first.children[0];
  if (!t || t.type !== "text") return null;
  const m = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\r?\n|$)/.exec(t.value);
  if (!m) return null;
  const kind = m[1];
  (t as Text).value = t.value.slice(m[0].length);
  if (first.children.length === 1 && (t as Text).value === "") {
    node.children.splice(node.children.indexOf(first), 1);
  }
  return el("div", { className: ["callout", `callout-${kind.toLowerCase()}`], role: "note" }, [
    el("p", { className: ["callout-title"] }, [{ type: "text", value: alertKinds[kind] }]),
    ...node.children,
  ]);
}

function siteTransforms(ctx: RenderContext, headings: Heading[], code: Element[]) {
  return () => (tree: Root) => {
    const slug = slugger();
    const walk = (parent: Root | Element) => {
      for (let i = 0; i < parent.children.length; i++) {
        const node = parent.children[i];
        if (node.type !== "element") continue;

        if (node.tagName === "blockquote") {
          const c = callout(node);
          if (c) parent.children[i] = c;
        } else if (/^h[1-6]$/.test(node.tagName) && node.properties.id === undefined) {
          // The page title is the only h1: the Markdown's start at h2. (A
          // heading with an id already is the footnotes' hidden one.)
          const depth = Math.min(6, Math.max(2, Number(node.tagName[1])));
          node.tagName = `h${depth}`;
          // Its links and images get the same treatment as anywhere else.
          walk(node);
          const text = textOf(node).trim();
          const id = slug(text);
          node.properties = { ...node.properties, id };
          if (depth <= 3) {
            headings.push({ depth: depth as 2 | 3, id, text });
            node.children = [el("a", { href: `#${id}`, className: ["anchor"] }, unlink(node.children))];
          }
          continue;
        } else if (node.tagName === "a") {
          const href = String(node.properties.href ?? "");
          if (/^(?:https?:|mailto:)/i.test(href)) {
            if (!/^mailto:/i.test(href)) node.properties.rel = ["noopener", "noreferrer"];
          } else if (href.startsWith("#")) {
            // an anchor on this page: as written
          } else {
            const to = resolveLink(href, ctx);
            if (to) {
              node.properties.href = to;
            } else {
              // Points nowhere the site serves: the words without the link.
              node.tagName = "span";
              node.properties = {};
            }
          }
        } else if (node.tagName === "img") {
          const src = String(node.properties.src ?? "");
          const to = /^[a-z][a-z0-9+.-]*:|^\/\//i.test(src) ? null : resolveLink(src, ctx);
          if (to && to.includes("/images/")) {
            node.properties = { src: to, alt: node.properties.alt ?? "", loading: "lazy", decoding: "async" };
          } else {
            // Not one of the docs' own images (the policy allows no others):
            // its alt text instead.
            parent.children[i] = { type: "text", value: String(node.properties.alt ?? "") };
          }
          continue;
        } else if (node.tagName === "table") {
          walk(node);
          parent.children[i] = el("div", { className: ["table-wrap"], tabIndex: 0, role: "region", ariaLabel: "Table" }, [node]);
          continue;
        } else if (node.tagName === "pre") {
          // In a box of its own, so the copy button stays put while the
          // code scrolls sideways.
          parent.children[i] = el("div", { className: ["code-block"] }, [node]);
          code.push(node);
          continue;
        }
        walk(node);
      }
    };
    walk(tree);
  };
}

async function highlight(pre: Element): Promise<void> {
  const codeEl = pre.children.find((c) => c.type === "element" && c.tagName === "code") as Element | undefined;
  if (!codeEl) return;
  const classes = (codeEl.properties.className as string[] | undefined) ?? [];
  const named = classes.find((c) => c.startsWith("language-"))?.slice("language-".length) ?? "";
  const source = textOf(codeEl).replace(/\n$/, "");
  const lang = resolveLang(named);
  pre.properties = { className: ["code"], dataLang: named || "text" };
  if (!lang) {
    pre.children = [el("code", {}, [{ type: "text", value: source }])];
    return;
  }
  const hl = await getHighlighter();
  const out = hl.codeToHast(source, { lang, theme });
  const shikiPre = out.children.find((c) => c.type === "element" && c.tagName === "pre") as Element | undefined;
  // Shiki's own <pre> carries the theme's background; the site's CSS does that.
  pre.children = shikiPre ? shikiPre.children : [el("code", {}, [{ type: "text", value: source }])];
}

/* The Markdown parser is quadratic in runs of unmatched emphasis and link
   delimiters: 60,000 "*a" take 23 s, and the render runs on the server's
   one thread. Measured on the worst patterns, 8,000 of them outside code
   blocks take under half a second, once per page per publish (renders are
   cached). Real pages have a few hundred. */
export const maxDelimiters = 8000;

export function delimiterCount(md: string): number {
  let n = 0;
  let fence: string | null = null;
  for (const line of md.split("\n")) {
    const f = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (f && f[1][0] === fence[0] && f[1].length >= fence.length && line.trim() === f[1]) fence = null;
      continue;
    }
    if (f) {
      fence = f[1];
      continue;
    }
    for (let i = 0; i < line.length; i++) {
      const c = line.charCodeAt(i);
      // * _ ~ [ ]
      if (c === 42 || c === 95 || c === 126 || c === 91 || c === 93) n++;
    }
  }
  return n;
}

const tooComplex: Rendered = {
  html:
    '<div class="callout callout-warning" role="note"><p class="callout-title">Warning</p>' +
    "<p>This page has more formatting than the site renders. Read it on GitHub with the link below.</p></div>",
  headings: [],
};

export async function renderMarkdown(md: string, ctx: RenderContext): Promise<Rendered> {
  const delimiters = delimiterCount(md);
  if (delimiters > maxDelimiters) {
    console.error(`docs: ${ctx.file} has ${delimiters} emphasis and link marks, over ${maxDelimiters}; not rendered`);
    return tooComplex;
  }
  const headings: Heading[] = [];
  const code: Element[] = [];
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    /* remark-rehype already prefixes the ids it makes (footnotes) with
       "user-content-", and the Markdown can't make any others, so the
       sanitiser mustn't prefix them a second time. */
    .use(rehypeSanitize, { ...defaultSchema, clobberPrefix: "" })
    .use(siteTransforms(ctx, headings, code));
  const tree = (await processor.run(processor.parse(stripFrontmatter(md)))) as Root;
  await Promise.all(code.map(highlight));
  const html = unified().use(rehypeStringify).stringify(tree);
  return { html, headings };
}

/* Rendered pages, per index commit, like the Markdown they come from. */
const cache = new Map<string, Promise<Rendered>>();

export function renderCached(commit: string, md: string, ctx: RenderContext): Promise<Rendered> {
  const key = `${commit}:${ctx.file}`;
  let p = cache.get(key);
  if (!p) {
    p = renderMarkdown(md, ctx);
    p.catch(() => cache.delete(key));
    if (cache.size >= 600) cache.delete(cache.keys().next().value!);
    cache.set(key, p);
  }
  return p;
}
