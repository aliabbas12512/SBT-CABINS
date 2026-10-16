"use client";

import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { categories, modelText, sizeText, type Product } from "@/data/products";
import { plans } from "@/data/plans";
import { company } from "@/data/company";
import type { Edition, Locale } from "@/i18n/config";
import { getQuoteDict } from "@/i18n/assistant";
import { getDictionary } from "@/i18n/dictionaries";
import { routes } from "@/lib/routes";
import { includedFor, specRowsFor, type UseCase } from "@/lib/assistant/knowledge";
import { decodeQuote, formatDate, formatSar, itemLabel, priceQuote, quoteWhatsappMessage, whatsappUrl, type QuoteData } from "@/lib/assistant/quote";
import { FloorPlan } from "@/components/drawings/FloorPlan";
import { Logo } from "@/components/ui/Logo";
import { IconBack, IconMail, IconPhone, IconPin, IconWhatsApp } from "@/components/ui/Icons";
import { ProductVisual } from "./AssistantParts";

const LAST = "sbt-last-quote";

function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
const getHash = () => window.location.hash;

/** Encoded quotation from the URL fragment, or the last one opened in this tab. */
function readEncoded(hash: string): { encoded: string | null; print: boolean } {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  let encoded = params.get("q");
  if (!encoded) {
    try {
      encoded = window.sessionStorage.getItem(LAST);
    } catch {
      encoded = null;
    }
  }
  return { encoded, print: params.get("print") === "1" };
}

export function QuotationView({ edition, locale }: { edition: Edition; locale: Locale }) {
  const hash = useSyncExternalStore(subscribe, getHash, () => "#ssr");
  const t = getQuoteDict(locale);
  const printed = useRef(false);

  const ssr = hash === "#ssr";
  const { encoded, print } = ssr ? { encoded: null, print: false } : readEncoded(hash);
  const quote = encoded ? decodeQuote(encoded) : null;

  useEffect(() => {
    if (!quote || !encoded) return;
    try {
      window.sessionStorage.setItem(LAST, encoded);
    } catch {
      /* ignore */
    }
    if (print && !printed.current) {
      printed.current = true;
      history.replaceState(null, "", `#q=${encoded}`);
      const id = window.setTimeout(() => window.print(), 700);
      return () => window.clearTimeout(id);
    }
  }, [quote, encoded, print]);

  if (ssr) return <p className="container py-24 text-sm text-muted">{getDictionary(locale).common.loading}</p>;

  if (!quote) {
    return (
      <div className="container py-24">
        <p className="max-w-xl text-base text-ink" data-testid="quote-invalid">
          {t.invalid}
        </p>
        <Link href={routes.home({ edition, locale })} className="btn-primary mt-6 inline-flex">
          {t.back}
        </Link>
      </div>
    );
  }

  const otherLocale: Locale = locale === "ar" ? "en" : "ar";
  const waHref = whatsappUrl(quoteWhatsappMessage(quote, locale));

  return (
    <div className="quote-root pb-24 pt-8 print:p-0">
      <div className="container mb-6 flex flex-wrap items-center gap-2 print:hidden" data-testid="quote-toolbar">
        <Link href={routes.home({ edition, locale })} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold text-ink hover:border-accent">
          <IconBack width={16} height={16} />
          {t.back}
        </Link>
        <a href={`/${edition}/${otherLocale}/quotation#q=${encoded}`} lang={otherLocale} className="inline-flex min-h-[40px] items-center rounded-full border border-line px-4 text-sm font-semibold text-ink hover:border-accent" data-testid="quote-lang">
          {otherLocale === "ar" ? "العربية" : "English"}
        </a>
        <button type="button" onClick={() => window.print()} className="btn-primary !min-h-[40px] text-sm" data-testid="quote-print">
          {t.print}
        </button>
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-wa px-4 text-sm font-bold text-white hover:brightness-110" data-testid="quote-whatsapp">
          <IconWhatsApp width={18} height={18} />
          {t.whatsappCta}
        </a>
        <p className="w-full text-xs text-muted">
          {t.printHint} {t.waNote}
        </p>
      </div>

      <div className="container print:max-w-none print:px-0">
        <QuoteDocument quote={quote} locale={locale} />
      </div>
    </div>
  );
}

function Row({ label, value, pending }: { label: string; value?: string; pending: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-1.5 last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-end font-semibold ${value ? "text-ink" : "text-accent"}`}>{value || pending}</dd>
    </div>
  );
}

export function QuoteDocument({ quote, locale }: { quote: QuoteData; locale: Locale }) {
  const t = getQuoteDict(locale);
  const d = getDictionary(locale);
  const totals = priceQuote(quote.items);
  const svc = quote.service;
  const wantsDelivery = svc === "delivery" || svc === "both";
  const wantsInstall = svc === "installation" || svc === "both";
  const products = totals.lines.flatMap((l) => (l.product ? [l.product] : []));
  const hasAramco = products.some((p) => p.category === "aramco-standard");
  const hasCustom = quote.items.some((i) => i.kind === "custom");

  const pending: string[] = [];
  for (const l of totals.lines) {
    const label = itemLabel(l.item, locale);
    if (l.unitPrice === null) pending.push(t.pendingItems.price.replace("{item}", l.product ? modelText(l.product, locale) : label.size));
    if (l.product && l.product.dimensions.height === null) pending.push(t.pendingItems.height.replace("{item}", modelText(l.product, locale)));
  }
  if (wantsDelivery || !svc) pending.push(t.pendingItems.delivery);
  if (wantsInstall || !svc) pending.push(t.pendingItems.installation);
  pending.push(t.pendingItems.payment, t.pendingItems.validity);
  if (hasAramco) pending.push(t.pendingItems.aramco);
  if (hasCustom) pending.push(t.pendingItems.custom);
  pending.push(t.pendingItems.specs);

  const m = locale === "ar" ? "م" : "m";

  return (
    <article
      data-edition="light"
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="quote-doc mx-auto max-w-[900px] rounded-2xl border border-line bg-surface p-5 text-sm text-ink shadow-card sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
      data-testid="quote-document"
    >
      {/* Letterhead */}
      <header className="flex flex-col gap-5 border-b-2 border-accent pb-5 sm:flex-row sm:items-start sm:justify-between print:flex-row">
        <div>
          <Logo />
          <p className="mt-2 text-xs text-muted">{t.docSubtitle}</p>
          <ul className="mt-3 space-y-1 text-xs text-muted">
            <li className="flex items-center gap-1.5">
              <IconPhone width={13} height={13} />
              <span dir="ltr" className="num">{company.phones.primary.display}</span> · <span dir="ltr" className="num">{company.phones.secondary.display}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <IconMail width={13} height={13} />
              <span dir="ltr">{company.email}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <IconPin width={13} height={13} />
              {company.base[locale]}
            </li>
          </ul>
        </div>
        <div className="sm:text-end print:text-end">
          <h1 className="text-xl font-extrabold tracking-wide text-ink sm:text-2xl">{t.docTitle}</h1>
          <dl className="mt-3 space-y-1 text-xs">
            <div className="flex gap-2 sm:justify-end print:justify-end">
              <dt className="text-muted">{t.refLabel}:</dt>
              <dd className="num font-bold" dir="ltr" data-testid="quote-ref">
                {quote.ref}
              </dd>
            </div>
            <div className="flex gap-2 sm:justify-end print:justify-end">
              <dt className="text-muted">{t.dateLabel}:</dt>
              <dd className="num font-semibold">{formatDate(quote.date, locale)}</dd>
            </div>
            <div className="flex gap-2 sm:justify-end print:justify-end">
              <dt className="text-muted">{t.status}:</dt>
              <dd className="font-semibold text-accent">{t.statusValue}</dd>
            </div>
          </dl>
        </div>
      </header>

      {/* Customer */}
      <section className="mt-6 grid gap-x-8 sm:grid-cols-2 print:grid-cols-2">
        <dl className="text-xs">
          <Row label={t.customer} value={quote.name} pending={t.pending} />
          <Row label={t.company} value={quote.company} pending={t.pending} />
        </dl>
        <dl className="text-xs">
          <Row label={t.location} value={quote.location} pending={t.pending} />
          <Row label={t.services} value={svc ? t.services_[svc] : undefined} pending={t.pending} />
        </dl>
      </section>

      {/* Items */}
      <section className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-xs" data-testid="quote-items">
          <thead>
            <tr className="bg-accent text-accent-ink">
              <th className="p-2 text-start font-semibold">{t.item}</th>
              <th className="p-2 text-start font-semibold">{t.description}</th>
              <th className="p-2 text-start font-semibold">{t.size}</th>
              <th className="p-2 text-end font-semibold">{t.qty}</th>
              <th className="p-2 text-end font-semibold">{t.unitPrice}</th>
              <th className="p-2 text-end font-semibold">{t.amount}</th>
            </tr>
          </thead>
          <tbody>
            {totals.lines.map((l, i) => {
              const p = l.product;
              const label = itemLabel(l.item, locale);
              return (
                <tr key={i} className="border-b border-line align-top">
                  <td className="num p-2">{i + 1}</td>
                  <td className="p-2">
                    {p ? (
                      <>
                        <span className="font-semibold">{p.name[locale]}</span>
                        <span className="num block text-muted">{modelText(p, locale)}</span>
                        <span className="block text-muted">{p.category === "aramco-standard" ? t.standardAramco : categories[p.category].shortName[locale]}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold">{label.type}</span>
                        {l.item.kind === "custom" && l.item.use && t.uses[l.item.use as UseCase] && (
                          <span className="block text-muted">{t.customUse.replace("{use}", t.uses[l.item.use as UseCase])}</span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="num p-2">
                    {p ? sizeText(p, locale) : label.size}
                    {p && <span className="block text-muted">{locale === "ar" ? "ار" : "H"} {p.dimensions.height === null ? t.pending : `${p.dimensions.height.toFixed(2)} ${m}`}</span>}
                  </td>
                  <td className="num p-2 text-end">{l.item.qty}</td>
                  <td className={`num p-2 text-end ${l.unitPrice === null ? "font-semibold text-accent" : ""}`}>{l.unitPrice === null ? t.pending : formatSar(l.unitPrice, locale)}</td>
                  <td className={`num p-2 text-end ${l.lineTotal === null ? "font-semibold text-accent" : "font-semibold"}`}>{l.lineTotal === null ? t.pending : formatSar(l.lineTotal, locale)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Totals */}
      <section className="mt-4 flex justify-end">
        <dl className="num w-full max-w-sm text-xs" data-testid="quote-totals">
          <Row label={t.subtotal} value={totals.pricedSubtotal ? formatSar(totals.pricedSubtotal, locale) : undefined} pending={t.pending} />
          <Row label={t.delivery} value={wantsDelivery || !svc ? undefined : t.notRequested} pending={t.pending} />
          <Row label={t.installation} value={wantsInstall || !svc ? undefined : t.notRequested} pending={t.pending} />
          <Row label={t.vat} value={totals.pricedSubtotal ? formatSar(totals.vat, locale) : undefined} pending={t.pending} />
          <div className="mt-1 flex justify-between gap-4 rounded-lg bg-surface-2 px-2 py-2">
            <dt className="font-bold">{t.grand}</dt>
            <dd className={`font-extrabold ${totals.pricedSubtotal ? "text-ink" : "text-accent"}`} data-testid="quote-grand">
              {totals.pricedSubtotal ? formatSar(totals.indicativeTotal, locale) : t.pending}
            </dd>
          </div>
          <p className="mt-1.5 text-[0.68rem] text-muted">{t.grandNote}</p>
        </dl>
      </section>

      {/* Terms */}
      <section className="mt-6 grid gap-x-8 sm:grid-cols-2 print:grid-cols-2">
        <div>
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">{t.termsTitle}</h2>
          <dl className="text-xs">
            <Row label={t.deliveryTime} pending={t.pending} />
            <Row label={t.paymentTerms} pending={t.pending} />
            <Row label={t.validity} pending={t.pending} />
          </dl>
        </div>
        {quote.notes && (
          <div>
            <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">{t.notes}</h2>
            <p className="whitespace-pre-line text-xs" data-testid="quote-notes">
              {quote.notes}
            </p>
          </div>
        )}
      </section>

      {/* Specifications */}
      <section className="mt-8 print:break-before-page">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-accent">{t.specsTitle}</h2>
        <div className="space-y-5">
          {totals.lines.map((l, i) =>
            l.product ? (
              <ProductSpec key={i} index={i + 1} product={l.product} locale={locale} />
            ) : l.item.kind === "custom" ? (
              <div key={i} className="break-inside-avoid rounded-xl border border-line p-4 text-xs">
                <p className="font-bold">
                  {i + 1}. {itemLabel(l.item, locale).type}
                </p>
                <p className="num mt-1">
                  {t.dims}: {l.item.length} × {l.item.width} {m} × <span className="text-accent">{t.pending}</span>
                </p>
                <p className="mt-1 text-accent">{t.pendingItems.custom}</p>
              </div>
            ) : null,
          )}
        </div>
      </section>

      {/* Pending */}
      <section className="mt-8 break-inside-avoid rounded-xl border border-accent/40 bg-accent/5 p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-accent">{t.pendingTitle}</h2>
        <ul className="mt-2 list-disc space-y-1 ps-5 text-xs" data-testid="quote-pending">
          {pending.map((p) => (
            <li key={p}>
              {p} — <span className="font-semibold text-accent">{t.pending}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Contact */}
      <section className="mt-6 break-inside-avoid">
        <h2 className="text-xs font-bold uppercase tracking-wider text-accent">{t.contactTitle}</h2>
        <p className="mt-1 text-xs">{t.contactText}</p>
        <p className="num mt-1 text-xs font-semibold" dir="ltr">
          WhatsApp {company.phones.primary.display} · {company.email}
        </p>
      </section>

      <footer className="mt-8 border-t border-line pt-4 text-[0.68rem] leading-relaxed text-muted">
        <p>{t.disclaimer}</p>
        <p className="mt-1">{t.priceNote}</p>
        <p className="num mt-2 font-semibold">
          {t.generated} · {quote.ref} · {d.meta.siteName}
        </p>
      </footer>
    </article>
  );
}

function ProductSpec({ index, product: p, locale }: { index: number; product: Product; locale: Locale }) {
  const t = getQuoteDict(locale);
  const d = getDictionary(locale);
  const m = locale === "ar" ? "م" : "m";
  return (
    <div className="break-inside-avoid rounded-xl border border-line p-4">
      <p className="text-sm font-bold">
        {index}. {p.name[locale]} — <span className="num">{modelText(p, locale)}</span>
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-[200px_1fr] print:grid-cols-[200px_1fr]">
        <div className="space-y-2">
          <ProductVisual product={p} locale={locale} className="aspect-[4/3] w-full rounded-lg" />
          {!p.gallery.length && p.illustration && <p className="text-[0.62rem] text-muted">{t.illustration}</p>}
          {p.plan && (
            <div className="grid-paper rounded-lg border border-line p-1.5" style={{ backgroundColor: "var(--dw-paper)" }}>
              <FloorPlan plan={plans[p.plan]} locale={locale} dict={d} title={`${p.code} ${t.drawing}`} className="h-auto w-full" />
            </div>
          )}
        </div>
        <dl className="text-xs">
          <div className="grid grid-cols-[38%_1fr] gap-2 border-b border-line py-1.5">
            <dt className="text-muted">{t.dims}</dt>
            <dd className="num font-semibold">
              {p.dimensions.length} × {p.dimensions.width} × {p.dimensions.height === null ? <span className="text-accent">{t.pending}</span> : p.dimensions.height.toFixed(2)} {m}
            </dd>
          </div>
          <div className="grid grid-cols-[38%_1fr] gap-2 border-b border-line py-1.5">
            <dt className="text-muted">{t.category}</dt>
            <dd className="font-semibold">{p.category === "aramco-standard" ? t.standardAramco : categories[p.category].shortName[locale]}</dd>
          </div>
          <div className="grid grid-cols-[38%_1fr] gap-2 border-b border-line py-1.5">
            <dt className="text-muted">{t.configuration}</dt>
            <dd>{p.configuration[locale].join(" · ")}</dd>
          </div>
          {specRowsFor(p).map((r) => (
            <div key={r.label.en} className="grid grid-cols-[38%_1fr] gap-2 border-b border-line py-1.5">
              <dt className="text-muted">{r.label[locale]}</dt>
              <dd>{r.value[locale]}</dd>
            </div>
          ))}
          {p.tanks && (p.tanks.water || p.tanks.septic) && (
            <div className="grid grid-cols-[38%_1fr] gap-2 border-b border-line py-1.5">
              <dt className="text-muted">{t.tanks}</dt>
              <dd className="num">
                {[p.tanks.water && t.water.replace("{n}", p.tanks.water.toLocaleString("en-US")), p.tanks.septic && t.septic.replace("{n}", p.tanks.septic.toLocaleString("en-US"))].filter(Boolean).join(" · ")}
              </dd>
            </div>
          )}
          <div className="grid grid-cols-[38%_1fr] gap-2 py-1.5">
            <dt className="text-muted">{t.included}</dt>
            <dd>{includedFor(p, locale).join(" · ")}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
