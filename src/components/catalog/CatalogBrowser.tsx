"use client";

import { useMemo, useState } from "react";
import { products, categories, type CategoryId, type Feature, type SizeKey } from "@/data/products";
import type { Edition, Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { ProductCard } from "@/components/product/ProductCard";
import { IconSearch, IconX } from "@/components/ui/Icons";

type Sort = "model" | "priceAsc" | "priceDesc" | "size";
const SIZES: { key: SizeKey; label: string }[] = [
  { key: "12x3.75", label: "12 × 3.75 m" },
  { key: "6x3.75", label: "6 × 3.75 m" },
  { key: "4x3", label: "3 × 4 m" },
  { key: "12x3.60", label: "12.00 × 3.60 m" },
];
const FEATURES: Feature[] = ["office", "accommodation", "guard", "toilet", "kitchen", "pantry", "multiRoom", "fireAlarm"];

/** Normalise Arabic/Latin text for forgiving search. */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[ً-ٟ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[×x*]/g, "x")
    .replace(/\s+/g, " ")
    .trim();

export function CatalogBrowser({ edition, locale, initialCategory }: { edition: Edition; locale: Locale; initialCategory?: CategoryId | "all" }) {
  const d = getDictionary(locale);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryId | "all">(initialCategory ?? "all");
  const [sizes, setSizes] = useState<SizeKey[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [priced, setPriced] = useState(false);
  const [sort, setSort] = useState<Sort>("model");

  const index = useMemo(
    () =>
      new Map(
        products.map((p) => [
          p.slug,
          norm([p.code, p.modelLabel, p.name.en, p.name.ar, p.sizeLabel, categories[p.category].shortName.en, categories[p.category].shortName.ar].join(" ")),
        ]),
      ),
    [],
  );

  const results = useMemo(() => {
    const terms = norm(q).split(" ").filter(Boolean);
    const list = products.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (sizes.length && !sizes.includes(p.size)) return false;
      if (features.length && !features.every((f) => p.features.includes(f))) return false;
      if (priced && !p.price) return false;
      const hay = index.get(p.slug) ?? "";
      return terms.every((t) => hay.includes(t));
    });
    const order = (a: (typeof products)[number]) => products.indexOf(a);
    const price = (p: (typeof products)[number], fallback: number) => p.price?.amount ?? fallback;
    return [...list].sort((a, b) => {
      switch (sort) {
        case "priceAsc":
          return price(a, Infinity) - price(b, Infinity) || order(a) - order(b);
        case "priceDesc":
          return price(b, -Infinity) - price(a, -Infinity) || order(a) - order(b);
        case "size":
          return b.footprint - a.footprint || order(a) - order(b);
        default:
          return order(a) - order(b);
      }
    });
  }, [q, cat, sizes, features, priced, sort, index]);

  const active = q || cat !== "all" || sizes.length || features.length || priced;
  const reset = () => {
    setQ("");
    setCat("all");
    setSizes([]);
    setFeatures([]);
    setPriced(false);
    setSort("model");
  };
  const toggle = <T,>(list: T[], v: T, set: (x: T[]) => void) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const pill = (on: boolean) =>
    `inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition ${
      on ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-ink-2 hover:border-accent/50 hover:text-accent"
    }`;

  return (
    <div>
      <div className="card z-20 p-4 sm:p-5 md:sticky md:top-[80px]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <span className="sr-only">{d.catalog.search}</span>
            <IconSearch className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={d.catalog.searchPlaceholder}
              className="h-12 w-full rounded-full border border-line bg-bg pe-4 ps-12 text-[0.95rem] text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="shrink-0 text-muted">{d.catalog.sort}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-12 flex-1 rounded-full border border-line bg-bg px-4 text-sm font-medium text-ink focus:border-accent focus:outline-none md:flex-none"
            >
              <option value="model">{d.catalog.sortModel}</option>
              <option value="priceAsc">{d.catalog.sortPriceAsc}</option>
              <option value="priceDesc">{d.catalog.sortPriceDesc}</option>
              <option value="size">{d.catalog.sortSize}</option>
            </select>
          </label>
        </div>

        <div className="mt-4 space-y-3">
          <fieldset className="flex items-center gap-2">
            <legend className="sr-only">{d.catalog.category}</legend>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
              {(["all", "aramco-standard", "normal-standard"] as const).map((c) => (
                <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className={pill(cat === c)}>
                  {c === "all" ? d.catalog.all : categories[c].shortName[locale]}
                  <span className="num text-xs opacity-70">{c === "all" ? products.length : products.filter((p) => p.category === c).length}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <details className="group">
            <summary className="flex min-h-[38px] cursor-pointer list-none items-center gap-2 text-sm font-semibold text-accent">
              <span className="inline-block transition group-open:rotate-90 rtl:group-open:-rotate-90" aria-hidden="true">›</span>
              {d.catalog.filters}
              {(sizes.length || features.length || priced) ? <span className="num rounded-full bg-accent px-2 text-xs text-accent-ink">{sizes.length + features.length + (priced ? 1 : 0)}</span> : null}
            </summary>
            <div className="mt-3 grid gap-4 md:grid-cols-[auto_1fr]">
              <fieldset>
                <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{d.catalog.size}</legend>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((s) => (
                    <button key={s.key} type="button" aria-pressed={sizes.includes(s.key)} onClick={() => toggle(sizes, s.key, setSizes)} className={pill(sizes.includes(s.key))}>
                      <span className="num">{locale === "ar" ? s.label.replace(/ m$/, " م") : s.label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{d.catalog.features}</legend>
                <div className="flex flex-wrap gap-2">
                  {FEATURES.map((f) => (
                    <button key={f} type="button" aria-pressed={features.includes(f)} onClick={() => toggle(features, f, setFeatures)} className={pill(features.includes(f))}>
                      {d.feature[f]}
                    </button>
                  ))}
                  <button type="button" aria-pressed={priced} onClick={() => setPriced((v) => !v)} className={pill(priced)}>
                    {d.catalog.priceListed}
                  </button>
                </div>
              </fieldset>
            </div>
          </details>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4" aria-live="polite">
        <p className="text-sm text-muted">
          <span className="num font-semibold text-ink">{results.length}</span> {results.length === 1 ? d.catalog.result : d.catalog.results}
        </p>
        {active ? (
          <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
            <IconX width={14} height={14} />
            {d.catalog.reset}
          </button>
        ) : null}
      </div>

      {results.length ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((p, i) => (
            <div key={p.slug} className="animate-fade-in">
              <ProductCard product={p} edition={edition} locale={locale} priority={i < 3} />
            </div>
          ))}
        </div>
      ) : (
        <div className="card mt-6 flex flex-col items-center px-6 py-16 text-center">
          <IconSearch width={36} height={36} className="text-muted" />
          <h2 className="mt-4 text-xl font-bold">{d.catalog.emptyTitle}</h2>
          <p className="mt-2 max-w-md text-sm text-muted">{d.catalog.emptyText}</p>
          <button type="button" onClick={reset} className="btn-primary mt-6">
            {d.catalog.reset}
          </button>
        </div>
      )}
    </div>
  );
}
