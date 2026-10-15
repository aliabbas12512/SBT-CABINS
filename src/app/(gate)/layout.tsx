import "@fontsource/manrope/400.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-mono/500.css";
import "../globals.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getDictionary } from "@/i18n/dictionaries";
import { siteUrl } from "@/lib/seo";

const en = getDictionary("en");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: en.meta.gateTitle,
  description: en.meta.homeDescription,
  alternates: { canonical: "/light/en", languages: { en: "/light/en", ar: "/light/ar" } },
  openGraph: { title: en.meta.homeTitle, description: en.meta.homeDescription, images: ["/og-image.jpg"], type: "website" },
};

export const viewport: Viewport = { themeColor: "#040a18", width: "device-width", initialScale: 1 };

export default function GateLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" data-edition="dark">
      <body className="min-h-screen overflow-x-hidden">{children}</body>
    </html>
  );
}
