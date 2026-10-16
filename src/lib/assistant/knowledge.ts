import { categories, products, sizeText, type CategoryId, type Product, type SizeKey, type SpecRow } from "@/data/products";
import type { Locale, Localized } from "@/i18n/config";
import { includedLabels } from "@/i18n/dictionaries";

/**
 * Catalogue knowledge for the sales assistant. Everything here is derived
 * from src/data/products.ts — the assistant never holds its own product data.
 */

export type UseCase = "office" | "accommodation" | "camp" | "guard" | "toilet" | "kitchen" | "storage" | "other";
export type StandardChoice = "aramco" | "normal" | "any";

export const USE_CASES: UseCase[] = ["office", "accommodation", "camp", "guard", "toilet", "kitchen", "storage", "other"];

/** Which catalogue products fit each intended use (by the product's own features/family). */
export function matchesUse(p: Product, use: UseCase): boolean {
  const f = p.features;
  switch (use) {
    case "office":
      return f.includes("office");
    case "accommodation":
      return f.includes("accommodation");
    case "camp":
      return f.includes("accommodation") || p.family === "toilet";
    case "guard":
      return f.includes("guard");
    case "toilet":
      return p.family === "toilet" || (f.includes("toilet") && !f.includes("accommodation") && !f.includes("office"));
    case "kitchen":
      return f.includes("kitchen") || f.includes("pantry");
    case "storage":
      return f.includes("storage");
    default:
      return true;
  }
}

export function categoryOf(choice: StandardChoice): CategoryId | null {
  return choice === "aramco" ? "aramco-standard" : choice === "normal" ? "normal-standard" : null;
}

export function findProducts(opts: { use?: UseCase; standard?: StandardChoice; size?: SizeKey }): Product[] {
  const cat = opts.standard ? categoryOf(opts.standard) : null;
  return products.filter(
    (p) => (!opts.use || matchesUse(p, opts.use)) && (!cat || p.category === cat) && (!opts.size || p.size === opts.size),
  );
}

export function sizesFor(list: Product[]): SizeKey[] {
  const seen: SizeKey[] = [];
  for (const p of list) if (!seen.includes(p.size)) seen.push(p.size);
  return seen;
}

export function sizeLabelFor(size: SizeKey, locale: Locale): string {
  const p = products.find((x) => x.size === size)!;
  return sizeText(p, locale);
}

/** Closest catalogue products to a custom footprint, preferring the same use / standard. */
export function nearestTo(length: number, width: number, opts: { use?: UseCase; standard?: StandardChoice }, limit = 3): Product[] {
  let pool = findProducts(opts);
  if (!pool.length) pool = findProducts({ use: opts.use });
  if (!pool.length) pool = products;
  const area = length * width;
  return [...pool]
    .sort((a, b) => Math.abs(a.footprint - area) + Math.abs(a.dimensions.length - length) * 0.5 - (Math.abs(b.footprint - area) + Math.abs(b.dimensions.length - length) * 0.5))
    .slice(0, limit);
}

/** Specification rows for a product: its own rows, or the category base specification. */
export function specRowsFor(p: Product): SpecRow[] {
  return p.specRows ?? categories[p.category].baseSpec;
}

export function includedFor(p: Product, locale: Locale): string[] {
  return p.included.map((k) => includedLabels[k][locale]);
}

/* ------------------------------------------------------------------ */
/* Text understanding (rule-based, EN + AR)                            */
/* ------------------------------------------------------------------ */

export const hasArabic = (s: string) => /[؀-ۿ]/.test(s);
export const hasLatinWords = (s: string) => /[a-z]{3,}/i.test(s.replace(/\b[an][ct]?\d\b/gi, ""));

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ً-ٟ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[×*]/g, "x");

const USE_WORDS: [UseCase, RegExp][] = [
  ["camp", /labou?r camp|camp|workforce|معسكر|سكن عمال|سكن العمال/],
  ["guard", /guard|security|gate ?house|حراسه|حارس|امن/],
  ["toilet", /toilet|bathroom|wc|washroom|restroom|حمام|دوره مياه|دورات مياه|مرحاض/],
  ["kitchen", /kitchen|dining|mess|pantry|مطبخ|طعام|بانتري/],
  ["storage", /storage|store|warehouse|مستودع|تخزين|مخزن/],
  ["office", /office|site office|مكتب|مكاتب/],
  ["accommodation", /accommodation|sleep|bedroom|room|living|staff house|سكن|غرف|غرفه|نوم/],
];

export function detectUse(text: string): UseCase | undefined {
  const t = norm(text);
  for (const [u, re] of USE_WORDS) if (re.test(t)) return u;
  return undefined;
}

export function detectStandard(text: string): StandardChoice | undefined {
  const t = norm(text);
  if (/aramco|ارامكو/.test(t)) return "aramco";
  if (/\bnormal\b|standard cabin|regular|economy|عادي|اقتصادي/.test(t)) return "normal";
  return undefined;
}

/** "12x3.75", "12 by 3.5", "12 × 4 m", "١٢ في ٣" → { length, width } */
export function detectDimensions(text: string): { length: number; width: number } | undefined {
  const t = norm(text);
  const m = t.match(/(\d+(?:[.,]\d+)?)\s*(?:m|م)?\s*(?:x|by|في|على)\s*(\d+(?:[.,]\d+)?)/);
  if (!m) return undefined;
  const a = parseFloat(m[1].replace(",", "."));
  const b = parseFloat(m[2].replace(",", "."));
  if (!isFinite(a) || !isFinite(b)) return undefined;
  return { length: Math.max(a, b), width: Math.min(a, b) };
}

export function sizeKeyFor(dim: { length: number; width: number }): SizeKey | undefined {
  const p = products.find((x) => Math.abs(x.dimensions.length - dim.length) < 0.01 && Math.abs(x.dimensions.width - dim.width) < 0.01);
  return p?.size;
}

/** Model codes mentioned in text, e.g. "A3", "nt4", "AC1". */
export function detectProducts(text: string): Product[] {
  const t = text.toUpperCase();
  const found: Product[] = [];
  for (const m of t.matchAll(/\b(A[CT]?\d|N[CT]?\d)\b/g)) {
    const p = products.find((x) => x.code === m[1]);
    if (p && !found.includes(p)) found.push(p);
  }
  if (/accommodation cabin|sleeper|كبينه سكن|وحده سكن/.test(norm(text))) {
    const acc = products.find((x) => x.code === "ACC");
    if (acc && !found.includes(acc)) found.push(acc);
  }
  return found;
}

export function detectQuantity(text: string): number | undefined {
  const t = norm(text);
  const m = t.match(/^\D*(\d{1,4})\D*$/);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= 500 ? n : undefined;
}

export type Intent = "quote" | "compare" | "price" | "whatsapp" | "restart" | "standards" | "help" | undefined;

export function detectIntent(text: string): Intent {
  const t = norm(text);
  if (/restart|start over|new chat|ابدا من جديد|من البدايه/.test(t)) return "restart";
  if (/quot|عرض سعر|تسعير/.test(t)) return "quote";
  if (/compar|difference|vs|مقارن|الفرق/.test(t)) return "compare";
  if (/whatsapp|واتساب|contact|call|تواصل|اتصال/.test(t)) return "whatsapp";
  if (/price|cost|how much|سعر|كم|تكلفه/.test(t)) return "price";
  if (/aramco.*(approv|certif|complian)|(approv|certif|complian).*aramco|اعتماد ارامكو|معتمد/.test(t)) return "standards";
  if (/help|مساعده/.test(t)) return "help";
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Facts for the optional AI layer (server-side only)                  */
/* ------------------------------------------------------------------ */

const L = (v: Localized) => v.en;

/** A compact, factual text description of the whole catalogue. */
export function catalogFacts(): string {
  const lines: string[] = [];
  for (const p of products) {
    const d = p.dimensions;
    const spec = specRowsFor(p)
      .map((r) => `${L(r.label)}: ${L(r.value)}`)
      .join("; ");
    lines.push(
      [
        `CODE ${p.code}`,
        `name: ${p.name.en}`,
        `category: ${categories[p.category].shortName.en}`,
        `family: ${p.family}`,
        `size: ${p.sizeLabel} (L ${d.length} m, W ${d.width} m, H ${d.height === null ? "not stated" : `${d.height} m`})`,
        `listed unit price: ${p.price ? `${p.price.amount} SAR per unit (excl. VAT, delivery, installation)` : "NOT LISTED — request a quote"}`,
        `configuration: ${p.configuration.en.join("; ")}`,
        `construction: ${p.construction.en.join("; ")}`,
        `specification: ${spec}`,
        p.tanks && (p.tanks.water || p.tanks.septic) ? `tanks: water ${p.tanks.water ?? "n/a"} L, septic ${p.tanks.septic ?? "n/a"} L` : "",
      ]
        .filter(Boolean)
        .join(" | "),
    );
  }
  return lines.join("\n");
}

export const listedPrices = (): number[] => products.flatMap((p) => (p.price ? [p.price.amount] : []));
