import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/*/*/admin", "/*/*/quotation", "/*/*/designer/quotation"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
