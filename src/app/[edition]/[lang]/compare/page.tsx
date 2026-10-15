import type { Metadata } from "next";
import { Suspense } from "react";
import { isEdition, isLocale, type Edition, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/seo";
import { CompareView } from "@/components/compare/CompareView";
import { SectionHeading } from "@/components/ui/SectionHeading";

type Params = Promise<{ edition: string; lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { edition, lang } = await params;
  if (!isEdition(edition) || !isLocale(lang)) return {};
  const d = getDictionary(lang);
  return pageMetadata({ edition, locale: lang, path: "/compare", title: d.meta.compareTitle, description: d.meta.compareDescription });
}

export default async function ComparePage({ params }: { params: Params }) {
  const { edition, lang } = await params;
  const locale = lang as Locale;
  const d = getDictionary(locale);
  return (
    <div className="atmosphere">
      <section className="container pb-24 pt-14">
        <SectionHeading as="h1" eyebrow={d.compare.eyebrow} title={d.compare.title} lead={d.compare.lead} />
        <div className="mt-10">
          <Suspense fallback={<p className="text-sm text-muted">{d.common.loading}</p>}>
            <CompareView edition={edition as Edition} locale={locale} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
