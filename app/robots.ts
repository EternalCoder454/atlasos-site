import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/* The download links are for people. A crawler following them would only
   burn its rate limit and the server's bandwidth. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/download/", "/dl/", "/docs-raw/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
