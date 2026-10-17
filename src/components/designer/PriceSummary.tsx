"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { fillText, getDesignerDict } from "@/i18n/designer";
import type { DesignerSettings } from "@/lib/designer/config";
import type { Design } from "@/lib/designer/design";
import { aramcoReview, type Estimate, type PriceLine } from "@/lib/designer/pricing";
import { lineLabel, reviewText, sar } from "@/lib/designer/present";
import { IconCheck } from "@/components/ui/Icons";

function Line({ line, locale, pending }: { line: PriceLine; locale: Locale; pending: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-xs" data-testid="price-line" data-key={line.key}>
      <span className="text-muted">
        {lineLabel(line, locale)}
        {line.qty !== undefined && line.unit !== null && line.unit !== undefined && line.key !== "catalogue" && (
          <span className="num block text-[0.68rem]">
            {line.qty} × {sar(line.unit, locale)}
          </span>
        )}
      </span>
      <span className={`num shrink-0 text-end font-semibold ${line.amount === null ? "text-accent" : "text-ink"}`}>{line.amount === null ? pending : sar(line.amount, locale)}</span>
    </div>
  );
}

export function PriceSummary({
  design,
  est,
  settings,
  locale,
  canQuote,
  onQuote,
}: {
  design: Design;
  est: Estimate;
  settings: DesignerSettings;
  locale: Locale;
  canQuote: boolean;
  onQuote: () => void;
}) {
  const t = getDesignerDict(locale);
  const [specsOpen, setSpecsOpen] = useState(false);
  const pending = t.price.pending;
  const review = design.category === "aramco" ? aramcoReview(design, settings) : [];
  const specs = settings.specs[design.category];

  return (
    <div className="space-y-4" data-testid="price-summary">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-sm font-bold text-ink">{t.price.title}</h2>
        <p className="mt-1 text-[0.7rem] text-muted">{t.price.perCabin}</p>

        <div className="mt-2 divide-y divide-line">
          <div>
            {est.cabinLines.map((l) => (
              <Line key={l.key} line={l} locale={locale} pending={pending} />
            ))}
          </div>
          {est.extraLines.length > 0 && (
            <div className="pt-1">
              <p className="pt-1 text-[0.68rem] font-semibold uppercase tracking-wider text-muted">{t.price.extras}</p>
              {est.extraLines.map((l) => (
                <Line key={l.key} line={l} locale={locale} pending={pending} />
              ))}
            </div>
          )}
          <div className="flex justify-between gap-3 py-2 text-sm font-bold">
            <span>{t.price.perCabin}</span>
            <span className={`num ${est.unitPrice === null ? "text-accent" : "text-ink"}`} data-testid="unit-price">
              {est.unitPrice === null ? pending : sar(est.unitPrice, locale)}
            </span>
          </div>
          {est.quantity > 1 && <p className="py-1 text-end text-xs text-muted">{fillText(t.price.quantity, { n: est.quantity })}</p>}
          <div className="pt-1">
            <p className="pt-1 text-[0.68rem] font-semibold uppercase tracking-wider text-muted">{t.price.services}</p>
            {est.serviceLines.map((l) => (
              <Line key={l.key} line={l} locale={locale} pending={pending} />
            ))}
          </div>
          <div className="space-y-1 pt-2 text-xs">
            <div className="flex justify-between gap-3">
              <span className="text-muted">{t.price.subtotal}</span>
              <span className="num font-semibold">{sar(est.pricedSubtotal, locale)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted">{fillText(t.price.vat, { pct: Math.round(est.vatRate * 100) })}</span>
              <span className="num font-semibold">{sar(est.vat, locale)}</span>
            </div>
          </div>
          <div className="mt-2 rounded-xl bg-surface-2 p-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-bold">{t.price.total}</span>
              <span className={`num text-lg font-extrabold ${est.total === null ? "text-accent" : "text-ink"}`} data-testid="total-price">
                {est.total === null ? pending : sar(est.total, locale)}
              </span>
            </div>
            {est.total === null && (
              <p className="mt-1 text-[0.7rem] text-muted">
                {t.price.totalPending}
                {est.pricedTotal > 0 && (
                  <>
                    {" "}
                    · {t.price.pricedTotal}: <span className="num font-semibold text-ink">{sar(est.pricedTotal, locale)}</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        <p className="mt-3 text-[0.7rem] leading-relaxed text-muted" data-testid="price-basis">
          {est.basis === "catalogue" && est.catalogue ? fillText(t.price.basisCatalogue, { code: est.catalogue.code }) + " " : ""}
          {est.pending.length > 0 ? t.price.basisIncomplete + " " : ""}
          {t.price.estimateNote}
        </p>
        <button type="button" onClick={onQuote} disabled={!canQuote} className="btn-primary mt-4 w-full disabled:opacity-50" data-testid="quote-button">
          {t.controls.quote}
        </button>
      </div>

      {review.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-4" data-testid="aramco-review">
          <h3 className="text-sm font-bold">{t.price.aramcoTitle}</h3>
          <p className="mt-1 text-[0.7rem] leading-relaxed text-muted">{t.price.aramcoIntro}</p>
          <ul className="mt-2 space-y-1.5 text-xs">
            {review.map((r) => (
              <li key={r.key} className="flex items-start justify-between gap-2" data-status={r.status}>
                <span>{reviewText(r.key, r.params, locale)}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-semibold ${r.status === "catalogue" ? "bg-accent/10 text-accent" : "bg-surface-2 text-ink ring-1 ring-line"}`}>
                  {r.status === "catalogue" ? (
                    <>
                      <IconCheck width={11} height={11} className="me-0.5 inline" />
                      {t.price.catalogue}
                    </>
                  ) : (
                    <>⚠ {t.price.approval}</>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface p-4">
        <button type="button" onClick={() => setSpecsOpen((v) => !v)} aria-expanded={specsOpen} className="flex w-full items-center justify-between text-sm font-bold">
          {t.price.specsTitle} — {design.category === "aramco" ? t.controls.aramco : t.controls.normal}
          <span className="text-accent">{specsOpen ? "−" : "+"}</span>
        </button>
        {specsOpen && (
          <dl className="mt-2 space-y-1 text-xs">
            {specs.map((r) => (
              <div key={r.label.en} className="grid grid-cols-[40%_1fr] gap-2 border-b border-line py-1 last:border-0">
                <dt className="text-muted">{r.label[locale]}</dt>
                <dd>{r.value[locale]}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
