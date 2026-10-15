import type { Metadata } from "next";
import { isEdition, isLocale, type Edition, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/seo";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { SectionHeading } from "@/components/ui/SectionHeading";

type Params = Promise<{ edition: string; lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { edition, lang } = await params;
  if (!isEdition(edition) || !isLocale(lang)) return {};
  const d = getDictionary(lang);
  return pageMetadata({ edition, locale: lang, path: "/catalog", title: d.meta.catalogTitle, description: d.meta.catalogDescription });
}

export default async function CatalogPage({ params }: { params: Params }) {
  const { edition, lang } = await params;
  const locale = lang as Locale;
  const d = getDictionary(locale);
  return (
    <div className="atmosphere">
      <section className="container pb-24 pt-14">
        <SectionHeading as="h1" eyebrow={d.catalog.eyebrow} title={d.catalog.title} lead={d.catalog.lead} />
        <div className="mt-10">
          <CatalogBrowser edition={edition as Edition} locale={locale} />
        </div>
        <p className="mt-10 text-xs leading-relaxed text-muted">{d.product.priceNote}</p>
      </section>
    </div>
  );
}
