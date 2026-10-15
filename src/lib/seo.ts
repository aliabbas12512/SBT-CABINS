import type { Metadata } from "next";
import type { Edition, Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "http://localhost:3000"
).replace(/\/$/, "");

/**
 * Builds page metadata. Both editions carry identical content, so the light
 * edition is used as the canonical URL; hreflang alternates point to the
 * English and Arabic versions.
 */
export function pageMetadata({
  edition,
  locale,
  path,
  title,
  description,
  image,
}: {
  edition: Edition;
  locale: Locale;
  path: string; // path after /{edition}/{locale}, e.g. "/catalog" or ""
  title: string;
  description: string;
  image?: string;
}): Metadata {
  const d = getDictionary(locale);
  const canonical = `/light/${locale}${path}`;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { en: `/light/en${path}`, ar: `/light/ar${path}`, "x-default": `/light/en${path}` },
    },
    openGraph: {
      type: "website",
      siteName: d.meta.siteName,
      title,
      description,
      url: `/${edition}/${locale}${path}`,
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: locale === "ar" ? ["en_US"] : ["ar_SA"],
      images: [{ url: image ?? "/og-image.jpg", width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image ?? "/og-image.jpg"] },
  };
}
