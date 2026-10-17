"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { company } from "@/data/company";
import type { Edition, Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { fillText, getDesignerDict } from "@/i18n/designer";
import { routes } from "@/lib/routes";
import { whatsappUrl } from "@/lib/assistant/quote";
import { formatDate } from "@/lib/assistant/quote";
import { DEFAULT_SETTINGS, EXTRA_LABELS, normalizeSettings, SPACE_KINDS, type DesignerSettings, type ExtraId } from "@/lib/designer/config";
import { counts, decodeData, encodeData, sanitizeDesign, type Design } from "@/lib/designer/design";
import { layoutDesign } from "@/lib/designer/layout";
import { aramcoReview, estimate, type Estimate, type Service } from "@/lib/designer/pricing";
import { lineLabel, reviewText, sar, summary } from "@/lib/designer/present";
import { validateCustomer, isService, type Customer } from "@/lib/designer/customer";
import { FloorPlan } from "@/components/drawings/FloorPlan";
import { Logo } from "@/components/ui/Logo";
import { IconBack, IconMail, IconPhone, IconPin, IconWhatsApp } from "@/components/ui/Icons";

export type Approved = {
  lines: { label: string; qty: number; unit: number; amount: number }[];
  subtotal: number;
  vatRate: number;
  vat: number;
  total: number;
  deliveryTime?: string;
  paymentTerms?: string;
  validityDays?: number;
  notes?: string;
};

export type QuoteView = {
  ref: string;
  date: string;
  lang: Locale;
  customer: Customer;
  service?: Service;
  design: Design;
  status: string;
  estimate: Estimate;
  approved?: Approved | null;
  approvedAt?: string | null;
  submitted: boolean;
};

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export function DesignQuotationPage({ edition, locale }: { edition: Edition; locale: Locale }) {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => "#ssr");
  const t = getDesignerDict(locale);
  const [settings, setSettings] = useState<DesignerSettings>(DEFAULT_SETTINGS);
  const [remote, setRemote] = useState<{ key: string; data: QuoteView | null } | null>(null);

  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const ref = params.get("r");
  const key = params.get("k");
  const q = params.get("q");
  const remoteKey = ref && key ? `${ref}:${key}` : null;

  useEffect(() => {
    let alive = true;
    fetch("/api/designer/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => alive && j && setSettings(normalizeSettings(j.settings)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!remoteKey || !ref || !key) return;
    let alive = true;
    fetch(`/api/designer/requests?ref=${encodeURIComponent(ref)}&key=${encodeURIComponent(key)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Record<string, unknown> | null) => {
        if (!alive) return;
        if (!j) return setRemote({ key: remoteKey, data: null });
        const design = sanitizeDesign(j.design, DEFAULT_SETTINGS);
        if (!design) return setRemote({ key: remoteKey, data: null });
        setRemote({
          key: remoteKey,
          data: {
            ref: String(j.ref),
            date: String(j.createdAt ?? "").slice(0, 10),
            lang: j.lang === "ar" ? "ar" : "en",
            customer: validateCustomer(j.customer).customer,
            service: isService(j.service) ? j.service : undefined,
            design,
            status: String(j.status ?? "new"),
            estimate: j.estimate as Estimate,
            approved: (j.approved as Approved | null) ?? null,
            approvedAt: (j.approvedAt as string | null) ?? null,
            submitted: true,
          },
        });
      })
      .catch(() => alive && setRemote({ key: remoteKey, data: null }));
    return () => {
      alive = false;
    };
  }, [remoteKey, ref, key]);

  if (hash === "#ssr" || (remoteKey && remote?.key !== remoteKey)) return <p className="container py-24 text-sm text-muted">{t.quote.loading}</p>;

  let view: QuoteView | null = null;
  if (remoteKey) view = remote?.data ?? null;
  else if (q) {
    const raw = decodeData(q) as Record<string, unknown> | null;
    const design = raw ? sanitizeDesign(raw.design, settings) : null;
    if (raw && design && typeof raw.ref === "string" && /^SBT-D-\d{8}-[A-F0-9]{6}$/.test(raw.ref)) {
      const service = isService(raw.service) ? raw.service : undefined;
      view = {
        ref: raw.ref,
        date: typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : new Date().toISOString().slice(0, 10),
        lang: raw.lang === "ar" ? "ar" : "en",
        customer: validateCustomer(raw.customer).customer,
        service,
        design,
        status: "local",
        estimate: estimate(design, settings, service),
        submitted: false,
      };
    }
  }

  if (!view) {
    return (
      <div className="container py-24">
        <p className="text-base" data-testid="dquote-invalid">
          {t.quote.invalid}
        </p>
        <Link href={routes.designer({ edition, locale })} className="btn-primary mt-6 inline-flex">
          {t.quote.back}
        </Link>
      </div>
    );
  }

  const link = typeof window !== "undefined" ? window.location.href : "";
  const totalText = view.approved ? sar(view.approved.total, locale) : view.estimate?.total != null ? sar(view.estimate.total, locale) : t.quote.pending;
  const waText = fillText(t.quote.waMessage, { ref: view.ref, summary: summary(view.design, locale), qty: view.design.quantity, total: totalText, link });
  const editHref = `${routes.designer({ edition, locale })}#d=${encodeData(view.design)}`;

  return (
    <div className="quote-root pb-24 pt-8 print:p-0">
      <div className="container mb-6 space-y-3 print:hidden" data-testid="dquote-toolbar">
        <p className={`rounded-xl border px-4 py-3 text-sm ${view.submitted ? "border-accent/40 bg-accent/5" : "border-line bg-surface"}`} data-testid="dquote-banner">
          {view.submitted ? fillText(t.quote.sent, { ref: view.ref }) : t.quote.notSent}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={editHref} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold hover:border-accent">
            <IconBack width={16} height={16} />
            {t.quote.edit}
          </Link>
          <button type="button" onClick={() => window.print()} className="btn-primary !min-h-[40px] text-sm" data-testid="dquote-print">
            {t.quote.print}
          </button>
          <a href={whatsappUrl(waText)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-wa px-4 text-sm font-bold text-white" data-testid="dquote-whatsapp">
            <IconWhatsApp width={18} height={18} />
            {t.quote.whatsapp}
          </a>
          <a
            href={`mailto:${company.email}?subject=${encodeURIComponent(fillText(t.quote.emailSubject, { ref: view.ref }))}&body=${encodeURIComponent(waText)}`}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold hover:border-accent"
            data-testid="dquote-email"
          >
            <IconMail width={16} height={16} />
            {t.quote.emailSales}
          </a>
        </div>
        <p className="text-xs text-muted">
          {t.quote.printHint} {t.quote.waNote}
        </p>
      </div>
      <div className="container print:max-w-none print:px-0">
        <DesignQuoteDocument view={view} settings={settings} locale={locale} />
      </div>
    </div>
  );
}

function Row({ label, value, pending }: { label: string; value?: string | null; pending: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-1.5 last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-end font-semibold ${value ? "text-ink" : "text-accent"}`}>{value || pending}</dd>
    </div>
  );
}

export function DesignQuoteDocument({ view, settings, locale }: { view: QuoteView; settings: DesignerSettings; locale: Locale }) {
  const t = getDesignerDict(locale);
  const q = t.quote;
  const dict = getDictionary(locale);
  const d = view.design;
  const lay = layoutDesign(d, settings.rules);
  const est = view.estimate;
  const ap = view.approved ?? null;
  const c = counts(d);
  const m = locale === "ar" ? "م" : "m";
  const review = d.category === "aramco" ? aramcoReview(d, settings) : [];
  const rates = settings.rates;
  const statusText = (q.statuses as Record<string, string>)[view.status] ?? view.status;

  return (
    <article
      data-edition="light"
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="quote-doc mx-auto max-w-[900px] rounded-2xl border border-line bg-surface p-5 text-sm text-ink shadow-card sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
      data-testid="dquote-document"
    >
      <header className="flex flex-col gap-5 border-b-2 border-accent pb-5 sm:flex-row sm:items-start sm:justify-between print:flex-row">
        <div>
          <Logo />
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
          <h1 className="text-xl font-extrabold tracking-wide sm:text-2xl">{q.title}</h1>
          <p className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${ap ? "bg-accent text-accent-ink" : "bg-surface-2 text-accent ring-1 ring-accent/40"}`} data-testid="dquote-badge">
            {ap ? q.approvedBadge : q.estimateBadge}
          </p>
          <dl className="mt-3 space-y-1 text-xs">
            <div className="flex gap-2 sm:justify-end print:justify-end">
              <dt className="text-muted">{q.ref}:</dt>
              <dd className="num font-bold" dir="ltr" data-testid="dquote-ref">
                {view.ref}
              </dd>
            </div>
            <div className="flex gap-2 sm:justify-end print:justify-end">
              <dt className="text-muted">{q.date}:</dt>
              <dd className="num font-semibold">{view.date ? formatDate(view.date, locale) : "—"}</dd>
            </div>
            <div className="flex gap-2 sm:justify-end print:justify-end">
              <dt className="text-muted">{q.status}:</dt>
              <dd className="font-semibold text-accent" data-testid="dquote-status">
                {statusText}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="mt-6 grid gap-x-8 sm:grid-cols-2 print:grid-cols-2">
        <dl className="text-xs">
          <Row label={q.customer} value={view.customer.name} pending={q.pending} />
          <Row label={q.company} value={view.customer.company} pending="—" />
          <Row label={q.phone} value={view.customer.phone} pending={q.pending} />
        </dl>
        <dl className="text-xs">
          <Row label={q.email} value={view.customer.email} pending="—" />
          <Row label={q.location} value={view.customer.location} pending={q.pending} />
          <Row label={q.services} value={view.service ? t.form.services[view.service] : undefined} pending={q.pending} />
        </dl>
      </section>

      <section className="mt-6 break-inside-avoid">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-accent">{q.design}</h2>
        <dl className="grid gap-x-8 text-xs sm:grid-cols-2 print:grid-cols-2">
          <Row label={q.category} value={d.category === "aramco" ? q.aramco : q.normal} pending="" />
          <Row label={q.dims} value={`${d.length} × ${d.width} × ${d.height} ${m}`} pending="" />
          <Row label={q.spaces} value={SPACE_KINDS.filter((k) => c[k]).map((k) => `${c[k]} × ${t.controls.kinds[k]}`).join(" · ")} pending="" />
          <Row label={q.quantity} value={String(d.quantity)} pending="" />
        </dl>
        {lay.plan && (
          <div className="grid-paper mt-3 rounded-xl border border-line p-2" style={{ backgroundColor: "var(--dw-paper)" }}>
            <FloorPlan plan={lay.plan} locale={locale} dict={dict} title={`${q.drawingTitle} — ${view.ref}`} className="h-auto w-full" />
          </div>
        )}
        <p className="mt-1 text-[0.65rem] text-muted">{t.drawing.note}</p>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-accent">{q.pricing}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-xs" data-testid="dquote-pricing">
            <thead>
              <tr className="bg-accent text-accent-ink">
                <th className="p-2 text-start font-semibold">{q.item}</th>
                <th className="p-2 text-end font-semibold">{q.qty}</th>
                <th className="p-2 text-end font-semibold">{q.unit}</th>
                <th className="p-2 text-end font-semibold">{q.amount}</th>
              </tr>
            </thead>
            <tbody>
              {ap
                ? ap.lines.map((l, i) => (
                    <tr key={i} className="border-b border-line">
                      <td className="p-2">{l.label}</td>
                      <td className="num p-2 text-end">{l.qty}</td>
                      <td className="num p-2 text-end">{sar(l.unit, locale)}</td>
                      <td className="num p-2 text-end font-semibold">{sar(l.amount, locale)}</td>
                    </tr>
                  ))
                : [
                    ...est.cabinLines.map((l) => ({ l, per: true })),
                    ...est.extraLines.map((l) => ({ l, per: true })),
                    ...est.serviceLines.map((l) => ({ l, per: false })),
                  ].map(({ l, per }, i) => (
                    <tr key={i} className="border-b border-line">
                      <td className="p-2">
                        {lineLabel(l, locale)}
                        {per && d.quantity > 1 && <span className="text-muted"> ({t.price.perCabin})</span>}
                      </td>
                      <td className="num p-2 text-end">{l.qty ?? 1}</td>
                      <td className={`num p-2 text-end ${l.unit === null ? "text-accent" : ""}`}>{l.unit === null || l.unit === undefined ? q.pending : sar(l.unit, locale)}</td>
                      <td className={`num p-2 text-end font-semibold ${l.amount === null ? "text-accent" : ""}`}>{l.amount === null ? q.pending : sar(l.amount, locale)}</td>
                    </tr>
                  ))}
              {!ap && d.quantity > 1 && (
                <tr className="border-b border-line bg-surface-2">
                  <td className="p-2 font-semibold">
                    {t.price.perCabin} × {d.quantity}
                  </td>
                  <td className="num p-2 text-end">{d.quantity}</td>
                  <td className="num p-2 text-end">{est.unitPrice === null ? q.pending : sar(est.unitPrice, locale)}</td>
                  <td className={`num p-2 text-end font-semibold ${est.unitPrice === null ? "text-accent" : ""}`}>{est.unitPrice === null ? q.pending : sar(est.unitPrice * d.quantity, locale)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex justify-end">
          <dl className="num w-full max-w-sm text-xs" data-testid="dquote-totals">
            <Row label={ap ? q.subtotal : t.price.subtotal} value={sar(ap ? ap.subtotal : est.pricedSubtotal, locale)} pending={q.pending} />
            <Row label={fillText(q.vat, { pct: Math.round((ap ? ap.vatRate : est.vatRate) * 100) })} value={sar(ap ? ap.vat : est.vat, locale)} pending={q.pending} />
            <div className="mt-1 flex justify-between gap-4 rounded-lg bg-surface-2 px-2 py-2">
              <dt className="font-bold">{q.total}</dt>
              <dd className={`font-extrabold ${ap || est.total !== null ? "text-ink" : "text-accent"}`} data-testid="dquote-total">
                {ap ? sar(ap.total, locale) : est.total !== null ? sar(est.total, locale) : q.pending}
              </dd>
            </div>
            {!ap && est.total === null && <p className="mt-1 text-[0.68rem] text-muted">{t.price.totalPending}</p>}
          </dl>
        </div>
      </section>

      <section className="mt-6 grid gap-x-8 sm:grid-cols-2 print:grid-cols-2">
        <div>
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">{q.terms}</h2>
          <dl className="text-xs">
            <Row label={q.deliveryTime} value={ap?.deliveryTime || rates.deliveryTime?.[locale]} pending={q.pending} />
            <Row label={q.paymentTerms} value={ap?.paymentTerms || rates.paymentTerms?.[locale]} pending={q.pending} />
            <Row
              label={q.validity}
              value={ap?.validityDays ? fillText(q.days, { n: ap.validityDays }) : rates.validityDays ? fillText(q.days, { n: rates.validityDays }) : null}
              pending={q.pending}
            />
          </dl>
        </div>
        {(view.customer.notes || ap?.notes) && (
          <div>
            <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">{q.notes}</h2>
            {view.customer.notes && <p className="whitespace-pre-line text-xs">{view.customer.notes}</p>}
            {ap?.notes && <p className="mt-1 whitespace-pre-line text-xs font-medium">{ap.notes}</p>}
          </div>
        )}
      </section>

      {Object.keys(d.extras).length > 0 && (
        <section className="mt-6 break-inside-avoid">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">{q.extras}</h2>
          <p className="text-xs">
            {Object.entries(d.extras)
              .map(([id, n]) => `${EXTRA_LABELS[id as ExtraId][locale]} × ${n}`)
              .join(" · ")}
          </p>
        </section>
      )}

      {review.length > 0 && (
        <section className="mt-6 break-inside-avoid">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">{q.aramcoCheck}</h2>
          <p className="text-[0.7rem] text-muted">{t.price.aramcoIntro}</p>
          <ul className="mt-1 space-y-0.5 text-xs">
            {review.map((r) => (
              <li key={r.key}>
                {reviewText(r.key, r.params, locale)} — <span className="font-semibold">{r.status === "catalogue" ? t.price.catalogue : `⚠ ${t.price.approval}`}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 break-inside-avoid">
        <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">{q.specs}</h2>
        <dl className="text-xs">
          {settings.specs[d.category].map((r) => (
            <div key={r.label.en} className="grid grid-cols-[38%_1fr] gap-2 border-b border-line py-1">
              <dt className="text-muted">{r.label[locale]}</dt>
              <dd>{r.value[locale]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-6 break-inside-avoid">
        <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">{q.exclusions}</h2>
        <ul className="list-disc space-y-0.5 ps-5 text-xs">
          {q.exclusionList.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>

      <footer className="mt-8 border-t border-line pt-4 text-[0.68rem] leading-relaxed text-muted">
        <p>{ap ? fillText(q.disclaimerApproved, { date: view.approvedAt ? formatDate(view.approvedAt.slice(0, 10), locale) : "" }) : q.disclaimerEstimate}</p>
        <p className="num mt-2 font-semibold">
          {q.generated} · {view.ref} · WhatsApp {company.phones.primary.display}
        </p>
      </footer>
    </article>
  );
}
