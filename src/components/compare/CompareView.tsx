"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { categories, getProduct, modelText, products, shortRef, sizeText, type Product } from "@/data/products";
import type { Edition, Locale, Localized } from "@/i18n/config";
import { fill, getDictionary, includedLabels } from "@/i18n/dictionaries";
import { formatArea, formatMetres, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { whatsappLink } from "@/lib/whatsapp";
import { MAX_COMPARE, useCompare } from "./CompareContext";
import { IconCheck, IconWhatsApp, IconX } from "@/components/ui/Icons";

/** Construction values per product, taken from the category base spec or the accommodation specification. */
function construction(p: Product): Record<"structure" | "insulation" | "walls" | "floor" | "fire", Localized> {
  if (p.code === "ACC") {
    return {
      structure: { en: "Heavy-duty steel skid (IPE 250) + angle-iron frame", ar: "قاعدة انزلاقية فولاذية (IPE 250) + إطار من حديد الزاوية" },
      insulation: { en: "50 mm PU sandwich panels, 35 kg/m³", ar: "ألواح ساندويتش بولي يوريثان 50 مم، 35 كجم/م³" },
      walls: { en: "0.5 mm pre-painted GI internal skin", ar: "قشرة داخلية من الحديد المجلفن المطلي مسبقاً 0.5 مم" },
      floor: { en: "18 mm cement fibre board + 2 mm Gerflor vinyl", ar: "لوح ألياف أسمنتية 18 مم + فينيل Gerflor بسماكة 2 مم" },
      fire: { en: "Smoke detector in every room, CO₂ and ABC extinguishers", ar: "كاشف دخان في كل غرفة وطفايات ثاني أكسيد الكربون وABC" },
    };
  }
  const dash = { en: "—", ar: "—" };
  if (p.specRows) {
    const find = (...labels: string[]) => p.specRows!.find((r) => labels.includes(r.label.en))?.value ?? dash;
    return { structure: find("Construction", "Type"), insulation: dash, walls: dash, floor: dash, fire: find("Fire safety") };
  }
  const spec = categories[p.category].baseSpec;
  const get = (label: string) => spec.find((r) => r.label.en === label)?.value ?? dash;
  const floor =
    p.category === "aramco-standard"
      ? { en: "Cement board + 2 mm vinyl sheet", ar: "ألواح أسمنتية + فينيل 2 مم" }
      : get("Floor");
  return { structure: get("Structure"), insulation: get("Insulation"), walls: get("Internal Walls"), floor, fire: get("Fire Safety") };
}

export function CompareView({ edition, locale }: { edition: Edition; locale: Locale }) {
  const d = getDictionary(locale);
  const base = { edition, locale };
  const search = useSearchParams();
  const { selected, set, toggle } = useCompare();
  const synced = useRef(false);

  // Seed the selection from ?models= once (shareable comparison links).
  useEffect(() => {
    if (synced.current) return;
    synced.current = true;
    const fromUrl = (search.get("models") ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (fromUrl.length) set(fromUrl);
  }, [search, set]);

  // Keep the URL in sync so the comparison can be shared.
  useEffect(() => {
    if (!synced.current) return;
    const url = new URL(window.location.href);
    if (selected.length) url.searchParams.set("models", selected.join(","));
    else url.searchParams.delete("models");
    window.history.replaceState(null, "", url.toString());
  }, [selected]);

  const list = selected.map((s) => getProduct(s)).filter((p): p is Product => Boolean(p));
  const available = products.filter((p) => !selected.includes(p.slug));

  const yes = (
    <span className="inline-flex items-center gap-1 text-accent">
      <IconCheck width={16} height={16} />
      {d.compare.yes}
    </span>
  );
  const no = <span className="text-muted">{d.compare.no}</span>;

  const rows: { label: string; render: (p: Product) => ReactNode }[] = [
    { label: d.product.category, render: (p) => categories[p.category].shortName[locale] },
    { label: d.product.model, render: (p) => <span className="num">{modelText(p, locale)}</span> },
    { label: d.catalog.size, render: (p) => <span className="num">{sizeText(p, locale)}</span> },
    { label: d.product.length, render: (p) => <span className="num">{formatMetres(p.dimensions.length, locale)}</span> },
    { label: d.product.width, render: (p) => <span className="num">{formatMetres(p.dimensions.width, locale)}</span> },
    {
      label: d.product.height,
      render: (p) => (
        <span>
          <span className="num">{p.dimensions.height === null ? d.product.onRequest : formatMetres(p.dimensions.height, locale)}</span>
          {p.dimensions.heightNote && <span className="block text-xs text-muted">{d.product.indicative}</span>}
        </span>
      ),
    },
    { label: d.product.footprint, render: (p) => <span className="num">{formatArea(p.footprint, locale)}</span> },
    {
      label: d.product.unitPrice,
      render: (p) =>
        p.price ? (
          <span className="num font-bold text-ink">
            {formatPrice(p.price.amount)} <span className="text-xs font-semibold text-accent">{d.common.sar}</span>
          </span>
        ) : (
          <span className="font-semibold text-accent">{d.product.priceOnRequest}</span>
        ),
    },
    { label: d.product.rooms, render: (p) => p.configuration[locale][0] },
    { label: d.feature.toilet, render: (p) => (p.features.includes("toilet") ? yes : no) },
    { label: `${d.feature.kitchen} / ${d.feature.pantry}`, render: (p) => (p.features.includes("kitchen") || p.features.includes("pantry") ? yes : no) },
    { label: locale === "ar" ? "الهيكل" : "Structure", render: (p) => construction(p).structure[locale] },
    { label: locale === "ar" ? "العزل" : "Insulation", render: (p) => construction(p).insulation[locale] },
    { label: locale === "ar" ? "الجدران الداخلية" : "Internal walls", render: (p) => construction(p).walls[locale] },
    { label: locale === "ar" ? "الأرضية" : "Floor", render: (p) => construction(p).floor[locale] },
    { label: locale === "ar" ? "السلامة من الحريق" : "Fire safety", render: (p) => construction(p).fire[locale] },
    {
      label: d.product.included,
      render: (p) =>
        p.included.length ? (
          <ul className="space-y-1">
            {p.included.map((k) => (
              <li key={k} className="text-xs">{includedLabels[k][locale]}</li>
            ))}
          </ul>
        ) : (
          <span className="text-xs text-muted">{locale === "ar" ? "انظر المواصفات التفصيلية" : "See detailed specification"}</span>
        ),
    },
  ];

  const codes = list.map((p) => shortRef(p, locale)).join(", ");

  return (
    <div>
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
        <label className="flex flex-1 items-center gap-3 text-sm">
          <span className="shrink-0 font-semibold text-ink">{d.compare.pick}</span>
          <select
            value=""
            disabled={selected.length >= MAX_COMPARE}
            onChange={(e) => e.target.value && toggle(e.target.value)}
            className="h-12 w-full rounded-full border border-line bg-bg px-4 text-sm font-medium text-ink focus:border-accent focus:outline-none disabled:opacity-50"
          >
            <option value="">{selected.length >= MAX_COMPARE ? d.compare.max : d.compare.choose}</option>
            {(["aramco-standard", "normal-standard"] as const).map((c) => (
              <optgroup key={c} label={categories[c].shortName[locale]}>
                {available
                  .filter((p) => p.category === c)
                  .map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {shortRef(p, locale)} — {p.name[locale]} ({sizeText(p, locale)})
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
        <span className="text-xs text-muted">{d.compare.max}</span>
      </div>

      {list.length < 2 && (
        <p className="mt-6 rounded-2xl border border-dashed border-line px-5 py-6 text-center text-sm text-muted" role="status">
          {d.compare.empty}
        </p>
      )}

      {list.length > 0 && (
        <div className="card mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: `${180 + list.length * 220}px` }}>
              <caption className="sr-only">{d.compare.title}</caption>
              <thead>
                <tr className="border-b border-line align-top">
                  <th scope="col" className="sticky start-0 z-10 w-[180px] bg-surface px-4 py-4 text-start text-xs font-semibold uppercase tracking-wider text-muted">
                    {d.compare.attribute}
                  </th>
                  {list.map((p) => (
                    <th key={p.slug} scope="col" className="min-w-[220px] px-4 py-4 text-start font-normal">
                      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-surface-2">
                        {p.gallery[0] ? (
                          <Image src={p.gallery[0].src} alt="" fill sizes="240px" className="object-cover" />
                        ) : (
                          <span className="flex h-full items-center justify-center px-3 text-center text-xs text-muted">{d.product.photoMissing.split(".")[0]}.</span>
                        )}
                        <button
                          type="button"
                          onClick={() => toggle(p.slug)}
                          aria-label={`${d.compare.remove}: ${p.code}`}
                          className="glass absolute end-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink hover:text-accent"
                        >
                          <IconX width={16} height={16} />
                        </button>
                      </div>
                      <Link href={routes.product(base, p.slug)} className="mt-3 block font-bold text-ink hover:text-accent">
                        <span className="num block font-mono text-xs font-medium text-accent">{modelText(p, locale)}</span>
                        {p.name[locale]}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-b border-line/70 align-top last:border-0 odd:bg-surface-2/40">
                    <th scope="row" className="sticky start-0 z-10 bg-surface px-4 py-3 text-start text-xs font-semibold text-muted">
                      {r.label}
                    </th>
                    {list.map((p) => (
                      <td key={p.slug} className="px-4 py-3 text-ink-2">
                        {r.render(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {list.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a href={whatsappLink(fill(d.whatsapp.compare, { codes }))} target="_blank" rel="noopener noreferrer" className="btn-wa">
            <IconWhatsApp width={18} height={18} />
            {d.cta.whatsappQuote}
          </a>
          <p className="text-xs text-muted">{d.product.priceNote}</p>
        </div>
      )}
    </div>
  );
}
