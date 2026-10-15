import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories, productsIn, type CategoryId } from "@/data/products";
import { isEdition, isLocale, type Edition, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryComparisonTable } from "@/components/home/CategoryComparisonTable";
import { IconArrow, IconCheck, IconShield } from "@/components/ui/Icons";

type Params = Promise<{ edition: string; lang: string; category: string }>;

export const dynamicParams = false;
export function generateStaticParams() {
  return (Object.keys(categories) as CategoryId[]).map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { edition, lang, category } = await params;
  if (!isEdition(edition) || !isLocale(lang) || !(category in categories)) return {};
  const c = categories[category as CategoryId];
  return pageMetadata({
    edition,
    locale: lang,
    path: `/category/${category}`,
    title: c.name[lang],
    description: c.tagline[lang],
  });
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { edition: e, lang, category } = await params;
  if (!(category in categories)) notFound();
  const edition = e as Edition;
  const locale = lang as Locale;
  const d = getDictionary(locale);
  const base = { edition, locale };
  const c = categories[category as CategoryId];
  const isA = c.id === "aramco-standard";
  const list = productsIn(c.id);
  const catalogue = list.filter((p) => p.code !== "ACC");
  const specUnit = list.find((p) => p.code === "ACC");
  const other = isA ? categories["normal-standard"] : categories["aramco-standard"];
  const codes = catalogue.map((p) => p.code);
  const range = `${codes[0]} – ${codes[codes.length - 1]}`;

  return (
    <>
      <section className="relative isolate -mt-[72px] overflow-hidden pt-[72px]">
        <div className="absolute inset-x-0 top-0 -z-10 h-[380px] md:inset-0 md:h-auto">
          <Image src={c.hero} alt="" fill priority sizes="100vw" className="object-cover object-center opacity-90" />
          <div className="absolute inset-0 hidden md:block" style={{ background: "var(--hero-overlay)" }} />
          <div className="absolute inset-0 md:hidden" style={{ background: "var(--hero-overlay-mobile)" }} />
        </div>
        <div className="container flex flex-col justify-end pb-14 pt-[300px] md:min-h-[520px] md:justify-center md:pb-16 md:pt-40">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href={routes.home(base)} className="hover:text-accent">{d.nav.home}</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href={routes.catalog(base)} className="hover:text-accent">{d.nav.catalog}</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink">{c.shortName[locale]}</li>
            </ol>
          </nav>
          <p className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-accent-ink">
            {isA ? d.category.eyebrowA : d.category.eyebrowB} · <span className="num">{range}</span>
          </p>
          <h1 className="mt-5 max-w-3xl text-balance text-4xl font-extrabold sm:text-6xl">{c.name[locale]}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-2 sm:text-lg">{c.tagline[locale]}</p>
          <ul className="mt-7 flex flex-wrap gap-2">
            {c.highlights[locale].map((h) => (
              <li key={h} className="chip !bg-surface/80 backdrop-blur">
                <IconCheck width={14} height={14} className="text-accent" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {isA && (
        <div className="container mt-8">
          <div className="flex gap-3 rounded-2xl border border-accent/25 bg-accent/5 p-4 text-sm leading-relaxed text-ink-2">
            <IconShield width={20} height={20} className="mt-0.5 shrink-0 text-accent" />
            <p>{d.footer.disclaimer}</p>
          </div>
        </div>
      )}

      {/* Base specification */}
      <section className="container py-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionHeading eyebrow={`${d.category.appliesTo} ${range}`} title={d.category.baseSpec} />
            <dl className="mt-8 grid gap-3 sm:grid-cols-2" data-reveal>
              {c.baseSpec.map((r) => (
                <div key={r.label.en} className="rounded-xl border border-line bg-surface p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{r.label[locale]}</dt>
                  <dd className="mt-1.5 font-medium text-ink">{r.value[locale]}</dd>
                </div>
              ))}
            </dl>
          </div>
          <aside className="lg:col-span-5" data-reveal>
            <div className="card sticky top-24 overflow-hidden">
              <div className="bg-accent px-6 py-5 text-accent-ink">
                <h2 className="text-lg font-bold !text-accent-ink">{isA ? d.category.whyTitleA : d.category.whyTitleB}</h2>
              </div>
              <ul className="space-y-4 p-6">
                {c.whereUsed[locale].map((w) => (
                  <li key={w} className="flex gap-3 text-sm leading-relaxed text-ink-2">
                    <IconCheck width={18} height={18} className="mt-0.5 shrink-0 text-accent" />
                    {w}
                  </li>
                ))}
              </ul>
              <p className="border-t border-line px-6 py-4 text-xs text-muted">{d.category.notMixed}</p>
            </div>
          </aside>
        </div>
      </section>

      {/* Models */}
      <section className="border-y border-line bg-surface-2/50 py-20">
        <div className="container">
          <SectionHeading eyebrow={c.shortName[locale]} title={d.category.catalogueModels} lead={d.product.priceNote} />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {catalogue.map((p, i) => (
              <div key={p.slug} data-reveal style={{ ["--reveal-delay" as string]: `${(i % 3) * 80}ms` }}>
                <ProductCard product={p} edition={edition} locale={locale} priority={i < 3} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {specUnit && (
        <section className="container py-20">
          <SectionHeading eyebrow={d.category.specUnit} title={specUnit.name[locale]} lead={specUnit.summary[locale]} />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <div data-reveal>
              <ProductCard product={specUnit} edition={edition} locale={locale} />
            </div>
          </div>
        </section>
      )}

      <section className="container py-20">
        <SectionHeading eyebrow={d.category.otherCategory} title={d.category.compareTitle} />
        <div className="mt-8">
          <CategoryComparisonTable locale={locale} />
        </div>
        <Link href={routes.category(base, other.id)} className="btn-outline mt-8">
          {other.name[locale]}
          <IconArrow width={16} height={16} />
        </Link>
      </section>
    </>
  );
}
