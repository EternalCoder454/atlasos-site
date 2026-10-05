import "server-only";
import { readerMarkdown, readingOrder } from "@/lib/docs/pages";
import type { DocsIndex } from "@/lib/docs/source";
import { siteUrl } from "@/lib/site";

/* llms-full.txt: every docs page's Markdown in reading order, built once
   per index commit. A handful of fetches at a time, not the whole lot. */

const maxChars = 8 << 20;

let cached: { commit: string; text: Promise<string> } | null = null;

async function build(index: DocsIndex): Promise<string> {
  const urls = readingOrder(index).map((p) => p.href);
  const parts: string[] = new Array(urls.length).fill("");
  let next = 0;
  const worker = async () => {
    while (next < urls.length) {
      const i = next++;
      const segs = urls[i].split("/").slice(2);
      try {
        const r = await readerMarkdown(index, segs);
        parts[i] = r ? `<!-- ${siteUrl}${r.href} -->\n\n${r.md}` : "";
      } catch (e) {
        // One unreadable page leaves a gap, not the whole file.
        console.error(`docs: llms-full.txt leaves out ${urls[i]}: ${(e as Error).message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  let out = "";
  for (const part of parts.filter(Boolean)) {
    if (out.length + part.length > maxChars) {
      console.error(`docs: llms-full.txt stops at ${maxChars} characters`);
      break;
    }
    out += `${out ? "\n\n---\n\n" : ""}${part}`;
  }
  return `${out}\n`;
}

export function llmsFull(index: DocsIndex): Promise<string> {
  if (cached?.commit !== index.commit) {
    const text = build(index);
    const entry = { commit: index.commit, text };
    text.catch(() => {
      if (cached === entry) cached = null;
    });
    cached = entry;
  }
  return cached.text;
}
