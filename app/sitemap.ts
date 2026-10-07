import type { MetadataRoute } from "next";
import { readingOrder } from "@/lib/docs/pages";
import { docsIndex } from "@/lib/docs/source";
import { siteUrl } from "@/lib/site";

/* The docs come from the Telamon framework repo at runtime, so the list is too. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const index = await docsIndex();
  const docs = index ? readingOrder(index) : [];
  return [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    ...docs.map((p) => ({ url: `${siteUrl}${p.href}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
