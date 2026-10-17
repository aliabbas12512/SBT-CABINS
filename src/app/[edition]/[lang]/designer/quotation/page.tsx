import type { Metadata } from "next";
import { isEdition, isLocale, type Edition, type Locale } from "@/i18n/config";
import { getDesignerDict } from "@/i18n/designer";
import { DesignQuotationPage } from "@/components/designer/DesignQuotation";

type Params = Promise<{ edition: string; lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: getDesignerDict(lang).quote.title, robots: { index: false, follow: false } };
}

/** Cabin design quotation: #r=REF&k=KEY (saved request) or #q=… (not yet sent). */
export default async function DesignQuotationRoute({ params }: { params: Params }) {
  const { edition, lang } = await params;
  if (!isEdition(edition) || !isLocale(lang)) return null;
  return <DesignQuotationPage edition={edition as Edition} locale={lang as Locale} />;
}
