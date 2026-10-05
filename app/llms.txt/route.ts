import { mdText, sectionOrder } from "@/lib/docs/pages";
import { docsIndex } from "@/lib/docs/source";
import { site, siteUrl } from "@/lib/site";

/* The llmstxt.org index: what the site is, then every docs page as a
   Markdown URL with its summary. */

export const dynamic = "force-dynamic";

export async function GET() {
  const index = await docsIndex();
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `- [AtlasOS on GitHub](${site.repo}): the source and the README`,
    "",
  ];
  if (index) {
    lines.push(
      "## Atlas Framework API",
      "",
      `Reference for atlas-framework ${mdText(index.version)}, the shared base the Atlas apps build on. Every page below is Markdown; ${siteUrl}/framework/llms-full.txt has them all in one file.`,
      "",
      `- [Overview](${siteUrl}/framework.md)`,
    );
    for (const l of index.libraries) {
      lines.push(`- [${mdText(l.title)}](${siteUrl}/framework/${l.slug}.md): ${mdText(l.summary)}`);
      for (const p of sectionOrder(l.pages)) lines.push(`  - [${mdText(p.title)}](${siteUrl}/framework/${l.slug}/${p.slug}.md): ${mdText(p.summary)}`);
    }
    lines.push("");
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
