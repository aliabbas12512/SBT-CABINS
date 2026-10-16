"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { categories, categoryComparison, getProduct, modelText, sizeText, type Product, type SizeKey } from "@/data/products";
import { plans } from "@/data/plans";
import type { Edition, Locale } from "@/i18n/config";
import { getAssistantDict, getQuoteDict } from "@/i18n/assistant";
import { getDictionary } from "@/i18n/dictionaries";
import { formatArea, formatMetres } from "@/lib/format";
import { routes } from "@/lib/routes";
import { findProducts, includedFor, specRowsFor, type StandardChoice, type UseCase } from "@/lib/assistant/knowledge";
import { encodeQuote, formatSar, itemLabel, priceQuote, quoteWhatsappMessage, whatsappUrl, type QuoteData } from "@/lib/assistant/quote";
import type { Draft } from "@/lib/assistant/engine";
import { generalWhatsappLink } from "@/lib/whatsapp";
import { FloorPlan } from "@/components/drawings/FloorPlan";
import { SideElevation } from "@/components/drawings/AccommodationDrawings";
import { ProductIllustration } from "@/components/drawings/ProductIllustration";
import { useCompare } from "@/components/compare/CompareContext";
import { IconArrow, IconCheck, IconCompare, IconWhatsApp } from "@/components/ui/Icons";

type Base = { edition: Edition; locale: Locale };

export const quotationHref = (edition: Edition, q: QuoteData, print = false) =>
  `${routes.home({ edition, locale: q.lang })}/quotation#q=${encodeQuote(q)}${print ? "&print=1" : ""}`;

/** Photo, generated illustration or elevation drawing for a product. */
export function ProductVisual({ product, locale, className = "" }: { product: Product; locale: Locale; className?: string }) {
  const d = getDictionary(locale);
  const cover = product.gallery[0];
  if (cover) {
    return (
      <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
        <Image src={cover.src} alt={`${product.name[locale]} — ${modelText(product, locale)}`} fill sizes="160px" className="object-cover" />
      </div>
    );
  }
  if (product.illustration) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden p-1.5 ${className}`} style={{ background: "var(--il-bg)" }}>
        <ProductIllustration
          kind={product.illustration.kind}
          length={product.dimensions.length}
          width={product.dimensions.width}
          endDoor={product.illustration.endDoor}
          tankRadius={product.illustration.tankRadius}
          title={`${product.name[locale]} — ${d.product.illustration}`}
          className="h-full w-full"
        />
      </div>
    );
  }
  return (
    <div className={`grid-paper flex items-center justify-center overflow-hidden p-2 ${className}`} style={{ background: "var(--dw-paper)" }}>
      <SideElevation dict={d} locale={locale} className="w-full" />
    </div>
  );
}

function priceText(p: Product, locale: Locale) {
  return p.price ? formatSar(p.price.amount, locale) : getAssistantDict(locale).noPrice;
}

/** Size and height as two isolated runs, so numbers keep their order in Arabic. */
function Dims({ p, locale }: { p: Product; locale: Locale }) {
  const a = getAssistantDict(locale);
  const m = locale === "ar" ? "م" : "m";
  const h = p.dimensions.height === null ? a.heightPending : formatMetres(p.dimensions.height, locale);
  return (
    <>
      <bdi className="inline-block">
        {p.dimensions.length} × {p.dimensions.width} {m}
      </bdi>
      {" · "}
      <bdi className="inline-block">
        {a.table.height}: {h}
      </bdi>
    </>
  );
}

export function ChatProductCard({ product, base, onSelect, onView, selected }: { product: Product; base: Base; onSelect: (slug: string) => void; onView: () => void; selected: boolean }) {
  const { locale } = base;
  const a = getAssistantDict(locale);
  const d = getDictionary(locale);
  const { has, toggle } = useCompare();
  const [open, setOpen] = useState(false);
  const inCompare = has(product.slug);
  const isAramco = product.category === "aramco-standard";

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card" data-testid="chat-product" data-code={product.code}>
      <div className="flex gap-3 p-3">
        <ProductVisual product={product} locale={locale} className="h-[76px] w-[104px] shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="num font-mono text-[0.7rem] font-semibold text-accent">{modelText(product, locale)}</span>
            <span className={`rounded-full px-1.5 py-px text-[0.62rem] font-semibold ${isAramco ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink ring-1 ring-line"}`}>
              {categories[product.category].shortName[locale]}
            </span>
          </div>
          <h4 className="mt-0.5 text-sm font-bold leading-snug text-ink">{product.name[locale]}</h4>
          <p className="num mt-0.5 text-xs text-muted">
            <Dims p={product} locale={locale} />
          </p>
          <p className="mt-1 text-sm">
            <span className="num font-extrabold text-ink">{priceText(product, locale)}</span>
            {product.price && <span className="text-[0.68rem] text-muted"> / {d.product.perUnit}</span>}
          </p>
        </div>
      </div>
      {product.plan && (
        <div className="grid-paper border-y border-line px-2 py-1.5" style={{ backgroundColor: "var(--dw-paper)" }}>
          <FloorPlan plan={plans[product.plan]} locale={locale} dict={d} title={`${product.code} ${d.product.floorPlan}`} className="mx-auto h-[72px] w-full" />
        </div>
      )}
      <ul className="space-y-0.5 px-3 pt-2 text-xs text-muted">
        {product.configuration[locale].slice(0, 2).map((c) => (
          <li key={c} className="flex gap-1.5">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            {c}
          </li>
        ))}
      </ul>
      {open && (
        <div className="mx-3 mt-2 rounded-xl border border-line bg-surface-2 p-2.5 text-xs">
          <dl className="space-y-1">
            {specRowsFor(product).map((r) => (
              <div key={r.label.en} className="grid grid-cols-[42%_1fr] gap-2">
                <dt className="text-muted">{r.label[locale]}</dt>
                <dd className="font-medium text-ink">{r.value[locale]}</dd>
              </div>
            ))}
            {product.tanks && (product.tanks.water || product.tanks.septic) && (
              <div className="grid grid-cols-[42%_1fr] gap-2">
                <dt className="text-muted">{a.table.tanks}</dt>
                <dd className="num font-medium text-ink">
                  {[product.tanks.water && getQuoteDict(locale).water.replace("{n}", product.tanks.water.toLocaleString("en-US")), product.tanks.septic && getQuoteDict(locale).septic.replace("{n}", product.tanks.septic.toLocaleString("en-US"))].filter(Boolean).join(" · ")}
                </dd>
              </div>
            )}
          </dl>
          <p className="mt-2 text-muted">{includedFor(product, locale).join(" · ")}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 p-3">
        <button type="button" onClick={() => onSelect(product.slug)} className={`btn-primary !min-h-[36px] !px-3 !py-1 text-xs ${selected ? "opacity-70" : ""}`} data-testid="chat-select">
          {selected && <IconCheck width={14} height={14} />}
          {selected ? a.selected : a.select}
        </button>
        <Link href={routes.product(base, product.slug)} onClick={onView} className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-line px-3 text-xs font-semibold text-ink hover:border-accent hover:text-accent">
          {a.view}
          <IconArrow width={13} height={13} />
        </Link>
        <button
          type="button"
          onClick={() => toggle(product.slug)}
          aria-pressed={inCompare}
          className={`inline-flex min-h-[36px] items-center gap-1 rounded-full px-3 text-xs font-semibold ring-1 ${inCompare ? "bg-accent/10 text-accent ring-accent/40" : "text-muted ring-line hover:text-ink"}`}
          data-testid="chat-compare"
        >
          <IconCompare width={13} height={13} />
          {inCompare ? a.comparing : a.compare}
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="inline-flex min-h-[36px] items-center px-2 text-xs font-semibold text-accent underline-offset-2 hover:underline">
          {open ? a.hideSpecs : a.specs}
        </button>
      </div>
    </article>
  );
}

export function ChatCompare({ slugs, base }: { slugs: string[]; base: Base }) {
  const { locale } = base;
  const a = getAssistantDict(locale);
  const list = slugs.map((s) => getProduct(s)).filter((p): p is Product => Boolean(p));
  const rows: { label: string; cell: (p: Product) => string }[] = [
    { label: a.table.category, cell: (p) => categories[p.category].shortName[locale] },
    { label: a.table.size, cell: (p) => sizeText(p, locale) },
    { label: a.table.height, cell: (p) => (p.dimensions.height === null ? a.heightPending : formatMetres(p.dimensions.height, locale)) },
    { label: a.table.area, cell: (p) => formatArea(p.footprint, locale) },
    { label: a.table.price, cell: (p) => priceText(p, locale) },
    { label: a.table.layout, cell: (p) => p.configuration[locale].join(" · ") },
  ];
  if (list.some((p) => p.tanks?.water || p.tanks?.septic)) {
    rows.push({ label: a.table.tanks, cell: (p) => (p.tanks?.water || p.tanks?.septic ? [p.tanks.water && `${p.tanks.water} L`, p.tanks.septic && `${p.tanks.septic} L`].filter(Boolean).join(" / ") : "—") });
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface" data-testid="chat-compare-table">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-xs">
          <thead>
            <tr className="bg-surface-2">
              <th className="p-2 text-start font-semibold text-muted" />
              {list.map((p) => (
                <th key={p.slug} className="num p-2 text-start font-bold text-accent">
                  {p.code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-line align-top">
                <th scope="row" className="p-2 text-start font-medium text-muted">
                  {r.label}
                </th>
                {list.map((p) => (
                  <td key={p.slug} className="num p-2 text-ink">
                    {r.cell(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-line p-2.5">
        <Link href={routes.compare(base, slugs)} className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
          {a.openCompare}
          <IconArrow width={13} height={13} />
        </Link>
      </div>
    </div>
  );
}

export function ChatStandards({ locale }: { locale: Locale }) {
  const a = getAssistantDict(locale);
  const yes = <IconCheck width={14} height={14} className="text-accent" />;
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface" data-testid="chat-standards">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface-2 text-start">
            <th className="p-2 text-start font-semibold text-muted" />
            <th className="p-2 text-start font-bold text-accent">{categories["aramco-standard"].shortName[locale]}</th>
            <th className="p-2 text-start font-bold text-ink">{categories["normal-standard"].shortName[locale]}</th>
          </tr>
        </thead>
        <tbody>
          {categoryComparison.map((r) => (
            <tr key={r.label.en} className="border-t border-line">
              <th scope="row" className="p-2 text-start font-medium text-muted">
                {r.label[locale]}
              </th>
              <td className="p-2 text-ink">{r.aramco === true ? yes : r.aramco[locale]}</td>
              <td className="p-2 text-ink">{r.normal === true ? yes : r.normal[locale]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line p-2.5 text-[0.7rem] text-muted">{a.standardsScope}</p>
    </div>
  );
}

export function ChatSizes({ sizes, use, standard, locale }: { sizes: SizeKey[]; use?: UseCase; standard?: StandardChoice; locale: Locale }) {
  const a = getAssistantDict(locale);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface" data-testid="chat-sizes">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface-2">
            <th className="p-2 text-start font-semibold text-muted">{a.table.size}</th>
            <th className="p-2 text-start font-semibold text-muted">{a.table.area}</th>
            <th className="p-2 text-start font-semibold text-muted">{a.table.models}</th>
            <th className="p-2 text-start font-semibold text-muted">{a.table.price}</th>
          </tr>
        </thead>
        <tbody>
          {sizes.map((size) => {
            const list = findProducts({ use, standard, size });
            const priced = list.flatMap((p) => (p.price ? [p.price.amount] : []));
            const lo = Math.min(...priced);
            const hi = Math.max(...priced);
            const price = !priced.length ? a.noPrice : lo === hi ? formatSar(lo, locale) : a.priceRange.replace("{from}", formatSar(lo, locale)).replace("{to}", formatSar(hi, locale));
            return (
              <tr key={size} className="border-t border-line align-top">
                <td className="num p-2 font-semibold text-ink">{sizeText(list[0], locale)}</td>
                <td className="num p-2 text-ink">{formatArea(list[0].footprint, locale)}</td>
                <td className="num p-2 text-ink">{list.map((p) => p.code).join(", ")}</td>
                <td className="num p-2 text-ink">{price}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-line p-2.5 text-[0.7rem] text-muted">{a.unitsNote}</p>
    </div>
  );
}

export function ChatSummary({ draft, locale }: { draft: Draft; locale: Locale }) {
  const a = getAssistantDict(locale);
  const q = getQuoteDict(locale);
  const rows: [string, string][] = [];
  if (draft.items.length)
    rows.push([
      a.lines.items,
      draft.items
        .map((it) => {
          const l = itemLabel(it, locale);
          return `${it.qty} × ${l.type} (${l.size})`;
        })
        .join("\n"),
    ]);
  rows.push([a.lines.special, draft.special || a.none]);
  rows.push([a.lines.location, draft.location || q.pending]);
  rows.push([a.lines.service, draft.service ? a.services[draft.service] : q.pending]);
  rows.push([a.lines.customer, [draft.name, draft.company].filter(Boolean).join(" — ") || q.pending]);
  return (
    <dl className="space-y-1.5 rounded-2xl border border-line bg-surface p-3 text-xs" data-testid="chat-summary">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[36%_1fr] gap-2">
          <dt className="text-muted">{k}</dt>
          <dd className="num whitespace-pre-line font-medium text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ChatQuote({ quote, edition, locale, onNavigate }: { quote: QuoteData; edition: Edition; locale: Locale; onNavigate: () => void }) {
  const a = getAssistantDict(locale);
  const q = getQuoteDict(locale);
  const t = priceQuote(quote.items);
  const view = { ...quote, lang: locale };
  return (
    <div className="space-y-2.5 rounded-2xl border border-accent/40 bg-surface p-3" data-testid="chat-quote" data-ref={quote.ref}>
      <p className="text-sm font-semibold text-ink">{a.quoteReady.replace("{ref}", quote.ref)}</p>
      <dl className="num space-y-1 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{q.subtotal}</dt>
          <dd className="font-semibold text-ink">{t.pricedSubtotal ? formatSar(t.pricedSubtotal, locale) : q.pending}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{q.vat}</dt>
          <dd className="font-semibold text-ink">{t.pricedSubtotal ? formatSar(t.vat, locale) : q.pending}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-line pt-1">
          <dt className="font-semibold text-ink">{q.grand}</dt>
          <dd className="font-extrabold text-ink">{t.pricedSubtotal ? formatSar(t.indicativeTotal, locale) : q.pending}</dd>
        </div>
      </dl>
      {!t.complete && (
        <p className="text-[0.7rem] font-medium text-accent">
          {q.unitPrice}: {q.pending} —{" "}
          {t.lines
            .filter((l) => l.unitPrice === null)
            .map((l) => (l.product ? l.product.code : itemLabel(l.item, locale).size))
            .join(", ")}
        </p>
      )}
      <p className="text-[0.7rem] leading-relaxed text-muted">{a.quoteNote}</p>
      <div className="flex flex-wrap gap-1.5">
        <a href={quotationHref(edition, view)} onClick={onNavigate} className="btn-primary !min-h-[38px] !px-3.5 !py-1 text-xs" data-testid="chat-open-quote">
          {a.openQuote}
        </a>
        <a href={quotationHref(edition, view, true)} onClick={onNavigate} className="inline-flex min-h-[38px] items-center rounded-full border border-line px-3.5 text-xs font-semibold text-ink hover:border-accent hover:text-accent" data-testid="chat-print-quote">
          {a.printQuote}
        </a>
      </div>
      <a
        href={whatsappUrl(quoteWhatsappMessage(quote, locale))}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-wa px-4 text-center text-xs font-bold text-white hover:brightness-110"
        data-testid="chat-quote-whatsapp"
      >
        <IconWhatsApp width={18} height={18} />
        {a.whatsappCta}
      </a>
      <p className="text-[0.68rem] text-muted">{a.waNote}</p>
    </div>
  );
}

export function ChatWhatsapp({ locale }: { locale: Locale }) {
  const a = getAssistantDict(locale);
  return (
    <a href={generalWhatsappLink(locale)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-wa/10 px-3.5 text-xs font-semibold text-wa ring-1 ring-wa/30 hover:bg-wa hover:text-white">
      <IconWhatsApp width={16} height={16} />
      {a.whatsappGeneral}
    </a>
  );
}
