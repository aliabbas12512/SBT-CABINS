import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { company, coverage } from "@/data/company";
import { categories, getProduct, products, type CategoryId, type Product } from "@/data/products";
import { accommodationKeyFigures } from "@/data/accommodation";
import { isEdition, isLocale, type Edition, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { generalWhatsappLink, mailLink, telLink } from "@/lib/whatsapp";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryComparisonTable } from "@/components/home/CategoryComparisonTable";
import { SideElevation } from "@/components/drawings/AccommodationDrawings";
import { IconArrow, IconCheck, IconMail, IconPhone, IconPin, IconTruck, IconWhatsApp } from "@/components/ui/Icons";

type Params = Promise<{ edition: string; lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { edition, lang } = await params;
  if (!isEdition(edition) || !isLocale(lang)) return {};
  const d = getDictionary(lang);
  return { ...pageMetadata({ edition, locale: lang, path: "", title: d.meta.homeTitle, description: d.meta.homeDescription }), title: { absolute: d.meta.homeTitle } };
}

const FEATURED = ["a1", "a6", "a9", "ac1", "nc1", "at3", "n2", "nt4", "nt1"];

export default async function HomePage({ params }: { params: Params }) {
  const { edition: e, lang } = await params;
  const edition = e as Edition;
  const locale = lang as Locale;
  const d = getDictionary(locale);
  const base = { edition, locale };
  const minPrice = Math.min(...products.flatMap((p) => (p.price ? [p.price.amount] : [])));
  const featured = FEATURED.map((s) => getProduct(s)).filter((p): p is Product => Boolean(p));
  const acc = getProduct("accommodation-cabin")!;

  return (
    <>
      {/* HERO */}
      <section className="relative isolate -mt-[72px] overflow-hidden pt-[72px]">
        <div className="absolute inset-x-0 top-0 -z-10 h-[420px] md:inset-0 md:h-auto">
          <Image src="/images/exterior/hero-cabin.webp" alt="" fill priority sizes="100vw" className="animate-slow-zoom object-cover object-[62%_center] md:object-[70%_center]" />
          <div className="absolute inset-0 hidden md:block" style={{ background: "var(--hero-overlay)" }} />
          <div className="absolute inset-0 md:hidden" style={{ background: "var(--hero-overlay-mobile)" }} />
          <div className="atmosphere absolute inset-0" />
        </div>
        <div className="container flex flex-col justify-end pb-14 pt-[330px] md:min-h-[720px] md:justify-center md:pb-24 md:pt-24">
          <div className="max-w-2xl">
            <p className="eyebrow">{d.home.eyebrow}</p>
            <h1 className="mt-5 text-balance text-[2.6rem] font-extrabold leading-[1.05] sm:text-6xl lg:text-[4.2rem]">{d.home.title}</h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-ink-2 sm:text-lg">{d.home.lead}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={routes.catalog(base)} className="btn-primary !px-6 !py-3 text-[0.95rem]">
                {d.cta.explore}
                <IconArrow width={18} height={18} />
              </Link>
              <a href={generalWhatsappLink(locale)} target="_blank" rel="noopener noreferrer" className="btn-outline !px-6 !py-3 text-[0.95rem]">
                <IconWhatsApp width={18} height={18} className="text-wa" />
                {d.cta.quote}
              </a>
            </div>
          </div>
          <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line/60 sm:grid-cols-4">
            {[
              { v: String(products.length), l: d.home.statModels },
              { v: "2", l: d.home.statCategories },
              { v: locale === "ar" ? "2.5 م" : "2.5 m", l: d.home.statHeight },
              { v: `${formatPrice(minPrice)} ${d.common.sar}`, l: d.home.statFrom },
            ].map((s) => (
              <div key={s.l} className="glass px-5 py-4">
                <dt className="sr-only">{s.l}</dt>
                <dd className="num font-display text-2xl font-extrabold text-ink">{s.v}</dd>
                <dd className="mt-1 text-xs text-muted">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container py-24" aria-labelledby="cats">
        <SectionHeading eyebrow={d.home.categoriesEyebrow} title={d.home.categoriesTitle} lead={d.home.categoriesLead} />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {(["aramco-standard", "normal-standard"] as CategoryId[]).map((id, i) => {
            const c = categories[id];
            const codes = products.filter((p) => p.category === id && p.code !== "ACC").map((p) => p.code);
            const aramco = id === "aramco-standard";
            return (
              <Link
                key={id}
                href={routes.category(base, id)}
                className="group card relative isolate flex min-h-[460px] flex-col justify-end overflow-hidden p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-9"
                data-reveal
                style={{ ["--reveal-delay" as string]: `${i * 120}ms` }}
              >
                <Image src={c.hero} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="-z-20 object-cover transition duration-700 group-hover:scale-[1.04]" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/85 to-bg/10" />
                <span className={`absolute start-7 top-7 rounded-full px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider sm:start-9 sm:top-9 ${aramco ? "bg-accent text-accent-ink" : "bg-surface text-ink ring-1 ring-line"}`}>
                  {aramco ? d.category.eyebrowA : d.category.eyebrowB} · <span className="num">{codes[0]} – {codes[codes.length - 1]}</span>
                </span>
                <h3 className="text-3xl font-extrabold sm:text-4xl">{c.name[locale]}</h3>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-2 sm:text-base">{c.tagline[locale]}</p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {c.highlights[locale].map((h) => (
                    <li key={h} className="flex items-center gap-2 text-sm text-ink">
                      <IconCheck width={16} height={16} className="shrink-0 text-accent" />
                      {h}
                    </li>
                  ))}
                </ul>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                  {d.cta.viewCategory}
                  <IconArrow width={16} height={16} className="transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
        <div className="mt-10">
          <CategoryComparisonTable locale={locale} />
          <p className="mt-4 text-sm text-muted">{d.category.notMixed}</p>
        </div>
      </section>

      {/* FEATURED */}
      <section className="border-y border-line bg-surface-2/50 py-24" aria-labelledby="featured">
        <div className="container">
          <SectionHeading
            eyebrow={d.home.featuredEyebrow}
            title={d.home.featuredTitle}
            lead={d.home.featuredLead}
            action={
              <Link href={routes.catalog(base)} className="btn-outline">
                {d.cta.viewAll} <span className="num">({products.length})</span>
                <IconArrow width={16} height={16} />
              </Link>
            }
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {featured.map((p, i) => (
              <div key={p.slug} data-reveal style={{ ["--reveal-delay" as string]: `${(i % 3) * 90}ms` }}>
                <ProductCard product={p} edition={edition} locale={locale} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACCOMMODATION CABIN */}
      <section className="container py-24" aria-labelledby="acc">
        <div className="card relative overflow-hidden p-6 sm:p-10" data-reveal>
          <div className="atmosphere pointer-events-none absolute inset-0" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow">{d.home.accEyebrow}</p>
              <h2 id="acc" className="mt-3 text-3xl font-extrabold sm:text-4xl">{d.home.accTitle}</h2>
              <p className="mt-4 text-muted sm:text-lg">{d.home.accLead}</p>
              <dl className="mt-8 grid grid-cols-2 gap-4">
                {accommodationKeyFigures.map((k) => (
                  <div key={k.value} className="rounded-xl border border-line bg-surface-2/60 p-4">
                    <dd className="num font-display text-2xl font-extrabold text-accent">{k.value}</dd>
                    <dt className="mt-1 text-sm font-semibold text-ink">{k.label[locale]}</dt>
                    <dd className="mt-0.5 text-xs text-muted">{k.detail[locale]}</dd>
                  </div>
                ))}
              </dl>
              <Link href={routes.product(base, acc.slug)} className="btn-primary mt-8">
                {d.cta.viewDetails}
                <IconArrow width={16} height={16} />
              </Link>
            </div>
            <figure className="grid-paper rounded-2xl border border-line p-4 sm:p-6" style={{ backgroundColor: "var(--dw-paper)" }}>
              <SideElevation dict={d} locale={locale} className="w-full" />
              <figcaption className="mt-3 text-center text-xs text-muted">{d.drawing.sideElevation}</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* SUPPLY + INTERIOR */}
      <section className="container pb-24" aria-labelledby="supply">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow={d.home.supplyEyebrow} title={d.home.supplyTitle} />
            <ul className="mt-8 grid grid-cols-2 gap-3" data-reveal>
              {d.home.supply.map((s) => (
                <li key={s} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-ink">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-muted" data-reveal>{d.home.supplyNote}</p>
          </div>
          <div className="lg:col-span-7">
            <SectionHeading eyebrow={d.home.interiorEyebrow} title={d.home.interiorTitle} lead={d.home.interiorLead} />
            <div className="mt-8 grid grid-cols-3 grid-rows-2 gap-3" data-reveal>
              <figure className="relative col-span-2 row-span-2 aspect-[4/3] overflow-hidden rounded-2xl">
                <Image src="/images/interior/wash-area.webp" alt={locale === "ar" ? "منطقة الغسيل الداخلية" : "Internal wash area"} fill sizes="(min-width: 1024px) 38vw, 66vw" className="object-cover" />
              </figure>
              <figure className="relative overflow-hidden rounded-2xl">
                <Image src="/images/interior/vanity-unit.webp" alt={locale === "ar" ? "وحدة المغسلة" : "Vanity unit"} fill sizes="20vw" className="object-cover" />
              </figure>
              <figure className="relative overflow-hidden rounded-2xl">
                <Image src="/images/interior/internal-door.webp" alt={locale === "ar" ? "باب داخلي" : "Internal door"} fill sizes="20vw" className="object-cover" />
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* COVERAGE */}
      <section className="relative overflow-hidden border-y border-line bg-surface py-24" aria-labelledby="coverage">
        <div className="atmosphere pointer-events-none absolute inset-0" />
        <div className="container relative grid gap-12 lg:grid-cols-2 lg:items-center">
          <SectionHeading eyebrow={d.home.coverageEyebrow} title={d.home.coverageTitle} lead={d.home.coverageLead} />
          <ol className="relative space-y-3" data-reveal>
            <span className="absolute bottom-6 top-6 w-px bg-gradient-to-b from-accent via-accent/50 to-transparent ltr:left-[27px] rtl:right-[27px]" aria-hidden="true" />
            {coverage.map((c, i) => (
              <li key={c.id} className="relative flex items-center gap-4 rounded-2xl border border-line bg-bg/60 p-4 backdrop-blur">
                <span className={`relative z-10 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full ${i === 0 ? "bg-accent text-accent-ink" : "border border-line bg-surface text-accent"}`}>
                  {i < 3 ? <IconPin width={18} height={18} /> : <IconTruck width={18} height={18} />}
                </span>
                <div>
                  <p className="font-semibold text-ink">{c.name[locale]}</p>
                  <p className="text-sm text-muted">{c.detail[locale]}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="container pt-24" aria-labelledby="cta">
        <div className="cta-band relative overflow-hidden rounded-[2rem] px-6 py-14 sm:px-12" data-reveal>
          <div className="pointer-events-none absolute -end-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-mono text-xs font-medium uppercase tracking-label opacity-80">{d.contact.eyebrow}</p>
              <h2 id="cta" className="mt-3 text-3xl font-extrabold !text-white sm:text-4xl">{d.contact.title}</h2>
              <p className="mt-4 max-w-lg opacity-85">{d.contact.lead}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={generalWhatsappLink(locale)} target="_blank" rel="noopener noreferrer" className="btn bg-wa text-white hover:brightness-110">
                  <IconWhatsApp width={18} height={18} />
                  {d.cta.whatsappQuote}
                </a>
                <Link href={routes.contact(base)} className="btn border border-white/30 text-white hover:bg-white/10">
                  {d.contact.formTitle}
                </Link>
              </div>
            </div>
            <ul className="grid gap-3 text-sm">
              <li>
                <a href={telLink(company.phones.primary.international)} className="flex items-center gap-3 rounded-xl bg-white/10 px-5 py-4 hover:bg-white/15">
                  <IconPhone width={18} height={18} />
                  <span className="opacity-80">{d.contact.primary}</span>
                  <span className="num ms-auto font-semibold">{company.phones.primary.local}</span>
                </a>
              </li>
              <li>
                <a href={telLink(company.phones.secondary.international)} className="flex items-center gap-3 rounded-xl bg-white/10 px-5 py-4 hover:bg-white/15">
                  <IconPhone width={18} height={18} />
                  <span className="opacity-80">{d.contact.secondary}</span>
                  <span className="num ms-auto font-semibold">{company.phones.secondary.local}</span>
                </a>
              </li>
              <li>
                <a href={mailLink()} className="flex items-center gap-3 rounded-xl bg-white/10 px-5 py-4 hover:bg-white/15">
                  <IconMail width={18} height={18} />
                  <span className="opacity-80">{d.contact.email}</span>
                  <span className="ms-auto truncate font-semibold">{company.email}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
