import type { MetadataRoute } from "next";
import { categories, products } from "@/data/products";
import { locales } from "@/i18n/config";
import { siteUrl } from "@/lib/seo";

/** Canonical (light-edition) URLs in both languages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/catalog",
    "/compare",
    "/designer",
    "/contact",
    ...Object.keys(categories).map((c) => `/category/${c}`),
    ...products.map((p) => `/products/${p.slug}`),
  ];
  return paths.flatMap((path) =>
    locales.map((l) => ({
      url: `${siteUrl}/light/${l}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : path.startsWith("/products") ? 0.8 : 0.6,
      alternates: { languages: { en: `${siteUrl}/light/en${path}`, ar: `${siteUrl}/light/ar${path}` } },
    })),
  );
}
