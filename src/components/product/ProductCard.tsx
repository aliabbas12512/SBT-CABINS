import Image from "next/image";
import Link from "next/link";
import { categories, modelText, sizeText, type Product } from "@/data/products";
import { plans } from "@/data/plans";
import type { Edition, Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { routes } from "@/lib/routes";
import { productWhatsappLink } from "@/lib/whatsapp";
import { FloorPlan } from "@/components/drawings/FloorPlan";
import { SideElevation } from "@/components/drawings/AccommodationDrawings";
import { IconArrow, IconWhatsApp } from "@/components/ui/Icons";
import { PriceTag } from "./PriceTag";
import { CompareButton } from "./CompareButton";

export function ProductCard({
  product,
  edition,
  locale,
  priority = false,
}: {
  product: Product;
  edition: Edition;
  locale: Locale;
  priority?: boolean;
}) {
  const d = getDictionary(locale);
  const base = { edition, locale };
  const href = routes.product(base, product.slug);
  const cover = product.gallery[0];
  const cat = categories[product.category];
  const isAramco = product.category === "aramco-standard";

  return (
    <article className="group card relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link href={href} className="relative block aspect-[16/10] overflow-hidden bg-surface-2" tabIndex={-1} aria-hidden="true">
        {cover ? (
          <Image
            src={cover.src}
            alt=""
            fill
            sizes="(min-width: 1280px) 400px, (min-width: 768px) 45vw, 100vw"
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
            priority={priority}
          />
        ) : (
          <div className="grid-paper flex h-full items-center justify-center p-4" style={{ background: "var(--dw-paper)" }}>
            <SideElevation dict={d} locale={locale} className="w-full" />
          </div>
        )}
        <span
          className={`absolute start-3 top-3 rounded-full px-2.5 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-wider ${
            isAramco ? "bg-accent text-accent-ink" : "bg-surface/90 text-ink ring-1 ring-line"
          }`}
        >
          {cat.shortName[locale]}
        </span>
      </Link>

      {/* Floor-plan strip — distinguishes layouts that share an exterior photograph */}
      {product.plan && (
        <div className="grid-paper border-y border-line px-3 py-2" style={{ backgroundColor: "var(--dw-paper)" }} aria-hidden="true">
          <FloorPlan plan={plans[product.plan]} locale={locale} dict={d} title={`${product.code} ${d.product.floorPlan}`} className="mx-auto h-[86px] w-full" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="num font-mono text-xs font-medium tracking-wider text-accent">{modelText(product, locale)}</p>
            <h3 className="mt-1.5 text-lg font-bold leading-snug">
              <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
                {product.name[locale]}
              </Link>
            </h3>
          </div>
          <span className="num shrink-0 rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs font-semibold text-ink">{sizeText(product, locale)}</span>
        </div>

        <ul className="mt-4 space-y-1.5 text-sm text-muted">
          {product.configuration[locale].slice(0, 2).map((c) => (
            <li key={c} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <span>{c}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-5">
          <div className="hairline mb-4" />
          <div className="flex items-end justify-between gap-3">
            <PriceTag product={product} locale={locale} />
            <span className="relative z-10 inline-flex items-center gap-1 text-sm font-semibold text-accent">
              {d.cta.viewDetails}
              <IconArrow width={16} height={16} className="transition group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
            </span>
          </div>
          <div className="relative z-10 mt-4 flex flex-wrap gap-2">
            <a
              href={productWhatsappLink(product, locale)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-full bg-wa/10 px-3.5 text-xs font-semibold text-wa ring-1 ring-wa/30 transition hover:bg-wa hover:text-white"
              aria-label={`${d.cta.whatsappQuote}: ${product.name[locale]} (${product.code})`}
            >
              <IconWhatsApp width={16} height={16} />
              {d.product.requestQuote}
            </a>
            <CompareButton slug={product.slug} locale={locale} label={`${product.code} ${product.name[locale]}`} />
          </div>
        </div>
      </div>
    </article>
  );
}
