import Link from "next/link";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { company } from "@/data/company";
import { plans } from "@/data/plans";
import { categories, getProduct, modelText, products, sizeText, type Product } from "@/data/products";
import {
  accommodationCompliance,
  accommodationConfigs,
  accommodationKeyFigures,
  accommodationOtherUnits,
  accommodationSections,
  prayerRoom,
} from "@/data/accommodation";
import { isEdition, isLocale, type Edition, type Locale } from "@/i18n/config";
import { getDictionary, includedLabels, type Dictionary } from "@/i18n/dictionaries";
import { formatArea, formatMetres } from "@/lib/format";
import { routes } from "@/lib/routes";
import { pageMetadata, siteUrl } from "@/lib/seo";
import { productWhatsappLink, telLink } from "@/lib/whatsapp";
import { FloorPlan } from "@/components/drawings/FloorPlan";
import { ProductIllustration } from "@/components/drawings/ProductIllustration";
import { ToiletSection } from "@/components/drawings/ToiletSection";
import { DimensionDiagram } from "@/components/drawings/DimensionDiagram";
import {
  BerthSchematic,
  FloorFraming,
  LiftingPointDetail,
  PanelSection,
  SideElevation,
  SkidPlan,
} from "@/components/drawings/AccommodationDrawings";
import { ProductGallery, type GalleryItem } from "@/components/product/ProductGallery";
import { PriceTag } from "@/components/product/PriceTag";
import { CompareButton } from "@/components/product/CompareButton";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IconCheck, IconPhone, IconShield, IconTruck, IconWhatsApp } from "@/components/ui/Icons";

type Params = Promise<{ edition: string; lang: string; slug: string }>;

export const dynamicParams = false;
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { edition, lang, slug } = await params;
  const p = getProduct(slug);
  if (!p || !isEdition(edition) || !isLocale(lang)) return {};
  const title = p.code === "ACC" ? `${p.name[lang]} — ${sizeText(p, lang)}` : `${modelText(p, lang)} — ${p.name[lang]} (${sizeText(p, lang)})`;
  return pageMetadata({ edition, locale: lang, path: `/products/${slug}`, title, description: p.summary[lang], image: p.gallery[0]?.src });
}

function drawingsFor(p: Product, d: Dictionary, locale: Locale): GalleryItem[] {
  if (p.code === "ACC") {
    const items: [string, string, ReactNode][] = [
      ["elev", d.drawing.sideElevation, <SideElevation key="e" dict={d} locale={locale} />],
      ["skid", d.drawing.skidPlan, <SkidPlan key="s" dict={d} locale={locale} />],
      ["frame", d.drawing.floorFraming, <FloorFraming key="f" dict={d} locale={locale} />],
      ["lift", d.drawing.liftingPoint, <LiftingPointDetail key="l" dict={d} locale={locale} />],
      ["panel", d.drawing.panelSection, <PanelSection key="p" dict={d} locale={locale} />],
    ];
    return items.map(([id, label, node]) => ({ kind: "drawing", id, label, node, caption: d.product.redrawn, tab: "drawings" }));
  }
  const out: GalleryItem[] = [];
  if (p.illustration) {
    out.push({
      kind: "drawing",
      id: "illustration",
      label: d.product.illustration,
      caption: d.product.illustrationNote,
      tab: "drawings",
      node: (
        <div className="rounded-xl" style={{ background: "var(--il-bg)" }}>
          <ProductIllustration
            kind={p.illustration.kind}
            length={p.dimensions.length}
            width={p.dimensions.width}
            endDoor={p.illustration.endDoor}
            tankRadius={p.illustration.tankRadius}
            title={`${modelText(p, locale)} — ${d.product.illustration}`}
          />
        </div>
      ),
    });
  }
  if (p.plan) {
    out.push({
      kind: "drawing",
      id: "plan",
      label: d.product.floorPlan,
      caption: plans[p.plan].origin === "indicative" ? d.product.indicativeLayout : d.product.conceptual,
      tab: "drawings",
      node: <FloorPlan plan={plans[p.plan]} locale={locale} dict={d} title={`${modelText(p, locale)} — ${d.product.floorPlan}`} />,
    });
  }
  if (p.dimensions.height !== null) {
    out.push({
      kind: "drawing",
      id: "dims",
      label: d.product.dimensionDiagram,
      caption: d.product.footprintNote,
      tab: "drawings",
      node: <DimensionDiagram length={p.dimensions.length} width={p.dimensions.width} height={p.dimensions.height} locale={locale} title={`${modelText(p, locale)} — ${d.product.dimensionDiagram}`} />,
    });
  }
  if (p.family === "toilet") {
    out.push({
      kind: "drawing",
      id: "tanks",
      label: d.product.tankSection,
      caption: d.drawing.notToScale,
      tab: "drawings",
      node: <ToiletSection length={p.dimensions.length} waterLitres={p.tanks?.water} septicLitres={p.tanks?.septic} dict={d} locale={locale} title={`${modelText(p, locale)} — ${d.product.tankSection}`} />,
    });
  }
  return out;
}

export default async function ProductPage({ params }: { params: Params }) {
  const { edition: e, lang, slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const edition = e as Edition;
  const locale = lang as Locale;
  const d = getDictionary(locale);
  const base = { edition, locale };
  const cat = categories[product.category];
  const isAcc = product.code === "ACC";

  const photoItems: GalleryItem[] = product.gallery.map((g, i) => ({
    kind: "image",
    id: `img-${i}`,
    src: g.src,
    width: g.width,
    height: g.height,
    alt: g.alt[locale],
    caption: g.caption[locale],
    tab: "photos",
  }));
  const drawingItems = drawingsFor(product, d, locale);
  const galleryItems = [...photoItems.slice(0, 1), ...drawingItems, ...photoItems.slice(1)];

  const related = products.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 3);
  const waHref = productWhatsappLink(product, locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.modelLabel} — ${product.name.en}`,
    sku: product.code,
    category: cat.name.en,
    description: product.summary.en,
    brand: { "@type": "Brand", name: company.brand },
    image: product.gallery.map((g) => `${siteUrl}${g.src}`),
    ...(product.price
      ? {
          offers: {
            "@type": "Offer",
            price: product.price.amount,
            priceCurrency: product.price.currency,
            url: `${siteUrl}/light/${locale}/products/${product.slug}`,
            seller: { "@type": "Organization", name: company.brand },
          },
        }
      : {}),
  };

  const dims = [
    { l: d.product.length, v: formatMetres(product.dimensions.length, locale) },
    { l: d.product.width, v: formatMetres(product.dimensions.width, locale) },
    { l: d.product.height, v: product.dimensions.height === null ? d.product.onRequest : formatMetres(product.dimensions.height, locale) },
    { l: d.product.footprint, v: formatArea(product.footprint, locale) },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="container pt-6">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href={routes.home(base)} className="hover:text-accent">{d.nav.home}</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href={routes.category(base, product.category)} className="hover:text-accent">{cat.shortName[locale]}</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="num text-ink">{isAcc ? product.name[locale] : product.code}</li>
          </ol>
        </nav>
      </div>

      {/* Overview */}
      <section className="container grid gap-10 pb-16 pt-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProductGallery items={galleryItems} locale={locale} title={`${modelText(product, locale)} — ${product.name[locale]}`} />
          {product.gallery.length === 0 && (
            <p className="mt-3 rounded-xl border border-dashed border-line px-4 py-3 text-xs text-muted">{product.illustration ? d.product.illustrationNote : d.product.photoMissing}</p>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={routes.category(base, product.category)}
                className={`rounded-full px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-wider ${product.category === "aramco-standard" ? "bg-accent text-accent-ink" : "border border-line bg-surface-2 text-ink"}`}
              >
                {cat.shortName[locale]}
              </Link>
              <span className="num font-mono text-xs font-medium tracking-wider text-accent">{modelText(product, locale)}</span>
            </div>
            <h1 className="mt-4 text-balance text-3xl font-extrabold leading-tight sm:text-4xl">{product.name[locale]}</h1>
            <p className="num mt-2 text-lg font-semibold text-accent">{sizeText(product, locale)}</p>
            <p className="mt-4 leading-relaxed text-muted">{product.summary[locale]}</p>

            <dl className="mt-6 grid grid-cols-4 overflow-hidden rounded-2xl border border-line bg-surface">
              {dims.map((x) => (
                <div key={x.l} className="border-e border-line px-2 py-4 text-center last:border-e-0">
                  <dt className="text-[0.66rem] font-semibold uppercase tracking-wider text-muted">{x.l}</dt>
                  <dd className="num mt-1 text-sm font-bold text-ink sm:text-base">{x.v}</dd>
                </div>
              ))}
            </dl>
            {product.dimensions.heightNote && <p className="mt-2 text-xs text-muted">{d.product.height}: {product.dimensions.heightNote[locale]}</p>}
            <p className="mt-2 text-xs text-muted">{d.product.footprintNote}</p>

            <div className="card mt-6 p-5">
              <PriceTag product={product} locale={locale} size="lg" />
              <p className="mt-3 text-xs leading-relaxed text-muted">{product.price ? d.product.priceNote : d.product.priceBlank}</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn-wa sm:col-span-2">
                  <IconWhatsApp width={18} height={18} />
                  {d.cta.whatsappQuote}
                </a>
                <a href={telLink(company.phones.primary.international)} className="btn-outline">
                  <IconPhone width={16} height={16} />
                  <span className="num">{company.phones.primary.local}</span>
                </a>
                <CompareButton slug={product.slug} locale={locale} label={`${product.code} ${product.name[locale]}`} className="!min-h-[44px] justify-center !text-sm" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {isAcc ? <AccommodationDetail d={d} locale={locale} /> : <ModelDetail product={product} d={d} locale={locale} />}

      {/* Options + delivery */}
      <section className="container py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-6 sm:p-8" data-reveal>
            <h2 className="text-xl font-bold">{d.product.options}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{d.product.optionsText}</p>
            {isAcc && <p className="mt-3 text-sm leading-relaxed text-muted">{accommodationOtherUnits[locale]}</p>}
          </div>
          <div className="card p-6 sm:p-8" data-reveal>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <IconTruck width={20} height={20} className="text-accent" />
              {d.product.delivery}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{d.product.deliveryText}</p>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn-wa mt-5">
              <IconWhatsApp width={18} height={18} />
              {d.cta.whatsappQuote}
            </a>
          </div>
        </div>
        <p className="mt-6 text-xs text-muted">
          {d.product.source}: {product.source}
        </p>
      </section>

      {related.length > 0 && (
        <section className="border-t border-line bg-surface-2/50 py-20">
          <div className="container">
            <SectionHeading eyebrow={cat.shortName[locale]} title={d.product.related} lead={d.product.relatedLead} />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} edition={edition} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function ModelDetail({ product, d, locale }: { product: Product; d: Dictionary; locale: Locale }) {
  const cat = categories[product.category];
  return (
    <>
      {/* Floor plan, full width */}
      {product.plan && (
        <section className="border-y border-line bg-surface py-16">
          <div className="container">
            <SectionHeading eyebrow={modelText(product, locale)} title={d.product.floorPlan} />
            <figure className="mt-8 overflow-hidden rounded-2xl border border-line" data-reveal>
              <div className="grid-paper p-3 sm:p-8" style={{ backgroundColor: "var(--dw-paper)" }}>
                <FloorPlan
                  plan={plans[product.plan]}
                  locale={locale}
                  dict={d}
                  title={`${modelText(product, locale)} — ${d.product.floorPlan}`}
                  className={`mx-auto w-full ${product.dimensions.length <= 2 ? "max-w-sm" : product.dimensions.length <= 4 ? "max-w-xl" : product.dimensions.length <= 6 ? "max-w-3xl" : "max-w-5xl"}`}
                />
              </div>
              <figcaption className="border-t border-line px-5 py-3 text-center font-mono text-[0.68rem] uppercase tracking-wider text-muted">{plans[product.plan].origin === "indicative" ? d.product.indicativeLayout : d.product.conceptual}</figcaption>
            </figure>
            {product.family === "toilet" && (
              <figure className="mt-6 overflow-hidden rounded-2xl border border-line" data-reveal>
                <div className="grid-paper p-3 sm:p-8" style={{ backgroundColor: "var(--dw-paper)" }}>
                  <ToiletSection
                    length={product.dimensions.length}
                    waterLitres={product.tanks?.water}
                    septicLitres={product.tanks?.septic}
                    dict={d}
                    locale={locale}
                    title={`${modelText(product, locale)} — ${d.product.tankSection}`}
                    className={`mx-auto w-full ${product.dimensions.length <= 2 ? "max-w-md" : "max-w-3xl"}`}
                  />
                </div>
                <figcaption className="border-t border-line px-5 py-3 text-center font-mono text-[0.68rem] uppercase tracking-wider text-muted">
                  {d.product.tankSection} — {d.drawing.notToScale}
                </figcaption>
              </figure>
            )}
          </div>
        </section>
      )}

      <section className="container py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card p-6" data-reveal>
            <h2 className="text-lg font-bold">{d.product.configuration}</h2>
            <ul className="mt-4 space-y-3">
              {product.configuration[locale].map((c) => (
                <li key={c} className="flex gap-3 text-sm leading-relaxed text-ink-2">
                  <IconCheck width={18} height={18} className="mt-0.5 shrink-0 text-accent" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6" data-reveal>
            <h2 className="text-lg font-bold">{d.product.construction}</h2>
            <ul className="mt-4 space-y-3">
              {product.construction[locale].map((c) => (
                <li key={c} className="flex gap-3 text-sm leading-relaxed text-ink-2">
                  <IconCheck width={18} height={18} className="mt-0.5 shrink-0 text-accent" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6" data-reveal>
            <h2 className="text-lg font-bold">{d.product.included}</h2>
            <ul className="mt-4 grid grid-cols-2 gap-2">
              {product.included.map((k) => (
                <li key={k} className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-xs font-medium text-ink">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  {includedLabels[k][locale]}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card mt-6 overflow-hidden" data-reveal>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-6 py-4">
            <h2 className="text-lg font-bold">{d.product.fullSpec}</h2>
            <span className="chip">{cat.shortName[locale]}</span>
          </div>
          <dl className="divide-y divide-line">
            {(product.specRows ?? cat.baseSpec).map((r) => (
              <div key={r.label.en} className="grid gap-1 px-6 py-3.5 sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-semibold text-muted">{r.label[locale]}</dt>
                <dd className="text-sm text-ink sm:col-span-2">{r.value[locale]}</dd>
              </div>
            ))}
          </dl>
        </div>
        {product.category === "aramco-standard" && (
          <p className="mt-4 flex gap-2 text-xs leading-relaxed text-muted">
            <IconShield width={16} height={16} className="mt-0.5 shrink-0 text-accent" />
            {d.footer.disclaimer}
          </p>
        )}
      </section>
    </>
  );
}

function AccommodationDetail({ d, locale }: { d: Dictionary; locale: Locale }) {
  const drawingFor = (id?: string) => {
    switch (id) {
      case "skid":
        return <SkidPlan dict={d} locale={locale} className="w-full" />;
      case "lifting":
        return <LiftingPointDetail dict={d} locale={locale} className="mx-auto w-full max-w-md" />;
      case "framing":
        return <FloorFraming dict={d} locale={locale} className="w-full" />;
      case "panel":
        return <PanelSection dict={d} locale={locale} className="mx-auto w-full max-w-md" />;
      default:
        return null;
    }
  };

  return (
    <>
      <section className="border-y border-line bg-surface py-16">
        <div className="container">
          <SectionHeading eyebrow={d.product.keyFigures} title={d.home.accTitle} />
          <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4" data-reveal>
            {accommodationKeyFigures.map((k) => (
              <div key={k.value} className="rounded-2xl border border-line bg-bg p-5">
                <dd className="num font-display text-3xl font-extrabold text-accent">{k.value}</dd>
                <dt className="mt-2 font-semibold text-ink">{k.label[locale]}</dt>
                <dd className="mt-1 text-xs text-muted">{k.detail[locale]}</dd>
              </div>
            ))}
          </dl>
          <div className="card mt-6 p-6" data-reveal>
            <h2 className="text-lg font-bold">{d.product.compliance}</h2>
            <dl className="mt-4 divide-y divide-line">
              {accommodationCompliance.map((r) => (
                <div key={r.label.en} className="grid gap-1 py-3 sm:grid-cols-4 sm:gap-4">
                  <dt className="text-sm font-semibold text-muted">{r.label[locale]}</dt>
                  <dd className="text-sm text-ink sm:col-span-3">{r.value[locale]}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 flex gap-2 text-xs leading-relaxed text-muted">
              <IconShield width={16} height={16} className="mt-0.5 shrink-0 text-accent" />
              {locale === "ar"
                ? "تنص المواصفات الفنية على أن الوحدة «تُصنّع وتُفحص بما يتوافق مع متطلبات مواقع أرامكو السعودية». ولا يُعد ذلك اعتماداً أو شهادة من أرامكو السعودية للمنتج."
                : "The specification states the unit is “fabricated and inspected to suit Saudi Aramco site requirements”. This is not a product approval or certification by Saudi Aramco."}
            </p>
          </div>
        </div>
      </section>

      {/* Configurations */}
      <section className="container py-16">
        <SectionHeading eyebrow={d.drawing.configurations} title={d.product.configurations} lead={d.product.floorPlanNotSupplied} />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {accommodationConfigs.map((c) => (
            <article key={c.id} className="card flex flex-col overflow-hidden" data-reveal>
              <div className="grid-paper border-b border-line p-4" style={{ backgroundColor: "var(--dw-paper)" }}>
                <BerthSchematic beds={c.berths} bunk={c.bunk} title={`${c.name[locale]} — ${c.bedsLabel[locale]}`} className="mx-auto h-28 w-full" />
              </div>
              <div className="p-6">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-2xl font-extrabold text-accent">{c.name[locale]}</h3>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">{c.bedsLabel[locale]}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{c.audience[locale]}</p>
                <dl className="mt-4 space-y-2.5">
                  {c.furniture.map((f) => (
                    <div key={f.label.en} className="text-sm">
                      <dt className="inline font-semibold text-ink">{f.label[locale]}: </dt>
                      <dd className="inline text-ink-2">{f.value[locale]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </article>
          ))}
        </div>
        <div className="card mt-6 p-6" data-reveal>
          <h3 className="text-lg font-bold">{d.product.prayerRoom}</h3>
          <dl className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {prayerRoom.map((f) => (
              <div key={f.label.en} className="text-sm">
                <dt className="inline font-semibold text-ink">{f.label[locale]}: </dt>
                <dd className="inline text-ink-2">{f.value[locale]}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Detailed specification */}
      <section className="border-t border-line bg-surface-2/40 py-16">
        <div className="container">
          <SectionHeading eyebrow={d.product.specSections} title={d.product.fullSpec} />
          <div className="mt-10 space-y-6">
            {accommodationSections.map((s) => {
              const drawing = drawingFor(s.drawing);
              return (
                <article key={s.id} id={s.id} className="card overflow-hidden" data-reveal>
                  <header className="flex items-start gap-4 border-b border-line p-6">
                    <span className="num flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent font-mono text-sm font-bold text-accent-ink">{s.number}</span>
                    <div>
                      <h3 className="text-xl font-bold">{s.title[locale]}</h3>
                      {s.intro && <p className="mt-1 text-sm text-muted">{s.intro[locale]}</p>}
                    </div>
                  </header>
                  <div className={`grid gap-6 p-6 ${drawing ? "lg:grid-cols-2" : ""}`}>
                    {drawing && (
                      <figure className="grid-paper flex flex-col justify-center rounded-xl border border-line p-4" style={{ backgroundColor: "var(--dw-paper)" }}>
                        {drawing}
                        <figcaption className="mt-3 text-center text-[0.7rem] text-muted">{d.product.indicative}</figcaption>
                      </figure>
                    )}
                    <div className={`grid gap-6 ${!drawing && s.blocks.length > 1 ? "md:grid-cols-2" : ""}`}>
                      {s.blocks.map((b) => (
                        <div key={b.title.en}>
                          <h4 className="eyebrow">{b.title[locale]}</h4>
                          <dl className="mt-3 divide-y divide-line/70">
                            {b.lines.map((l) => (
                              <div key={l.label.en} className="grid gap-1 py-2.5 sm:grid-cols-3 sm:gap-3">
                                <dt className="text-sm font-semibold text-muted">{l.label[locale]}</dt>
                                <dd className="text-sm text-ink sm:col-span-2">{l.value[locale]}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      ))}
                    </div>
                  </div>
                  {s.note && <p className="border-t border-line bg-accent/5 px-6 py-3 text-sm text-ink-2">{s.note[locale]}</p>}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
