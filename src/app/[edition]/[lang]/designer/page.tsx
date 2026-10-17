import type { Metadata } from "next";
import { isEdition, isLocale, type Edition, type Locale } from "@/i18n/config";
import { getDesignerDict } from "@/i18n/designer";
import { pageMetadata } from "@/lib/seo";
import { CabinDesigner } from "@/components/designer/CabinDesigner";

type Params = Promise<{ edition: string; lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { edition, lang } = await params;
  if (!isEdition(edition) || !isLocale(lang)) return {};
  const t = getDesignerDict(lang);
  return pageMetadata({ edition, locale: lang, path: "/designer", title: t.metaTitle, description: t.metaDescription });
}

export default async function DesignerPage({ params }: { params: Params }) {
  const { edition, lang } = await params;
  const locale = lang as Locale;
  const t = getDesignerDict(locale);
  return (
    <div className="atmosphere">
      <section className="container pb-16 pt-10 lg:pt-12">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t.lead}</p>
        <div className="mt-6">
          <CabinDesigner edition={edition as Edition} locale={locale} />
        </div>
      </section>
    </div>
  );
}
