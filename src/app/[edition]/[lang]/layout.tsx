import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "../../globals.css";

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { company } from "@/data/company";
import { dirOf, editions, isEdition, isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { siteUrl } from "@/lib/seo";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { CompareProvider } from "@/components/compare/CompareContext";
import { RevealObserver } from "@/components/ui/RevealObserver";

export const dynamicParams = false;

export function generateStaticParams() {
  return editions.flatMap((edition) => locales.map((lang) => ({ edition, lang })));
}

type Params = Promise<{ edition: string; lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  const d = getDictionary(isLocale(lang) ? lang : "en");
  return {
    metadataBase: new URL(siteUrl),
    title: { default: d.meta.homeTitle, template: `%s | ${d.meta.siteName}` },
    description: d.meta.homeDescription,
    applicationName: company.brand,
    authors: [{ name: company.brand }],
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export async function generateViewport({ params }: { params: Params }): Promise<Viewport> {
  const { edition } = await params;
  return {
    themeColor: edition === "dark" ? "#040a18" : "#f6f8fc",
    colorScheme: edition === "dark" ? "dark" : "light",
    width: "device-width",
    initialScale: 1,
  };
}

export default async function SiteLayout({ children, params }: { children: ReactNode; params: Params }) {
  const { edition, lang } = await params;
  if (!isEdition(edition) || !isLocale(lang)) notFound();
  const d = getDictionary(lang);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.brand,
    url: `${siteUrl}/light/${lang}`,
    email: company.email,
    telephone: company.phones.primary.international,
    areaServed: ["SA", "Dammam", "Riyadh", "Jeddah"],
    contactPoint: [
      { "@type": "ContactPoint", telephone: company.phones.primary.international, contactType: "sales", availableLanguage: ["en", "ar"] },
      { "@type": "ContactPoint", telephone: company.phones.secondary.international, contactType: "sales" },
    ],
  };

  return (
    <html lang={lang} dir={dirOf(lang)} data-edition={edition} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </head>
      <body className="min-h-screen overflow-x-hidden">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">
          {d.nav.skip}
        </a>
        <CompareProvider>
          <Header edition={edition} locale={lang} />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer edition={edition} locale={lang} />
          <FloatingActions edition={edition} locale={lang} />
        </CompareProvider>
        <RevealObserver />
      </body>
    </html>
  );
}
