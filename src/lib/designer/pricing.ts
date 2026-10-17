import { getProduct, products, type Product } from "@/data/products";
import { plans } from "@/data/plans";
import { EXTRA_IDS, type AramcoStatus, type DesignerSettings, type ExtraId, type SpaceKind } from "./config";
import { counts, type Design } from "./design";

/**
 * Price estimate from the admin rate card. A line whose rate is not set is
 * "pending" (amount null) — it is never guessed. When the design matches a
 * catalogue model exactly, that model's listed price is used for the cabin.
 */

export type Service = "delivery" | "installation" | "both" | "none";

export type PriceLine = {
  key: string;
  params?: Record<string, string | number>;
  qty?: number;
  unit?: number | null;
  amount: number | null;
};

export type Estimate = {
  basis: "rates" | "catalogue" | "incomplete";
  catalogue?: { slug: string; code: string; price: number | null };
  /** Per cabin. */
  cabinLines: PriceLine[];
  extraLines: PriceLine[];
  /** Per-cabin price (cabin + extras), null if anything is pending. */
  unitPrice: number | null;
  quantity: number;
  serviceLines: PriceLine[];
  /** Sum of everything that has a price. */
  pricedSubtotal: number;
  vatRate: number;
  vat: number;
  /** Complete total incl. VAT, or null while any line is pending. */
  total: number | null;
  /** Subtotal + VAT of the priced lines only. */
  pricedTotal: number;
  complete: boolean;
  pending: string[];
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const MODULES: SpaceKind[] = ["room", "toilet", "bathroom", "toiletBath", "kitchenette", "storage"];

/** Catalogue cabin with exactly this size, category and room mix (if any). */
export function catalogueMatch(d: Design): Product | undefined {
  const c = counts(d);
  if (c.bathroom || c.toiletBath || c.storage) return undefined;
  return products.find((p) => {
    if (p.family !== "cabin" || !p.plan) return false;
    if ((p.category === "aramco-standard") !== (d.category === "aramco")) return false;
    if (Math.abs(p.dimensions.length - d.length) > 0.01 || Math.abs(p.dimensions.width - d.width) > 0.01) return false;
    const keys = plans[p.plan].rooms.map((r) => r.key);
    const rooms = keys.filter((k) => k === "office" || k === "room" || k === "guardRoom").length;
    const toilets = keys.filter((k) => k === "toilet").length;
    const kitchens = keys.filter((k) => k === "kitchen" || k === "pantry").length;
    return rooms === c.room && toilets === c.toilet && kitchens === c.kitchenette;
  });
}

export function estimate(d: Design, settings: DesignerSettings, service: Service | undefined = undefined): Estimate {
  const R = settings.rules;
  const rates = settings.rates[d.category];
  const c = counts(d);
  const area = r2(d.length * d.width);
  const pending: string[] = [];

  /* Cabin */
  const lines: PriceLine[] = [];
  const line = (key: string, qty: number, unit: number | null, params?: PriceLine["params"]) => {
    lines.push({ key, qty, unit, amount: unit === null ? null : r2(qty * unit), params });
    if (unit === null) pending.push(key);
  };
  line("structure", area, rates.perSqm, { area });
  line("labour", area, rates.laborPerSqm, { area });
  for (const k of MODULES) if (c[k]) line(`module.${k}`, c[k], rates[k]);
  const extraWindows = d.windowsPerRoom === 2 ? c.room : 0;
  if (extraWindows) line("extraWindow", extraWindows, rates.extraWindow);
  const over = r2(d.height - R.standardHeight);
  if (over > 0.001) line("height", Math.ceil(over / 0.1 - 1e-9), rates.heightPer10cm, { height: d.height });
  const cost = lines.reduce((a, l) => a + (l.amount ?? 0), 0);
  const margin = settings.rates.marginPct;
  lines.push({ key: "margin", params: { pct: margin ?? "—" }, amount: margin === null ? null : r2((cost * margin) / 100) });
  if (margin === null) pending.push("margin");

  let basis: Estimate["basis"] = pending.length ? "incomplete" : "rates";
  let cabinLines = lines;
  const match = catalogueMatch(d);
  const standardShape = Math.abs(d.height - R.standardHeight) < 0.001 && d.windowsPerRoom === 1;
  if (basis === "incomplete" && match?.price && standardShape) {
    basis = "catalogue";
    cabinLines = [{ key: "catalogue", params: { code: match.code }, qty: 1, unit: match.price.amount, amount: match.price.amount }];
    pending.length = 0;
  }

  /* Extras (per cabin) */
  const extraLines: PriceLine[] = [];
  for (const id of EXTRA_IDS) {
    const q = d.extras[id] ?? 0;
    if (!q) continue;
    const unit = settings.rates.extras[id];
    extraLines.push({ key: `extra.${id}`, qty: q, unit, amount: unit === null ? null : r2(q * unit) });
    if (unit === null) pending.push(`extra.${id}`);
  }

  const all = [...cabinLines, ...extraLines];
  const unitPrice = all.every((l) => l.amount !== null) ? r2(all.reduce((a, l) => a + (l.amount ?? 0), 0)) : null;
  const unitKnown = r2(all.reduce((a, l) => a + (l.amount ?? 0), 0));
  const qty = d.quantity;

  /* Services (per cabin × quantity) */
  const serviceLines: PriceLine[] = [];
  const wantsDelivery = service === "delivery" || service === "both";
  const wantsInstall = service === "installation" || service === "both";
  if (wantsDelivery || !service) {
    const u = settings.rates.delivery;
    serviceLines.push({ key: "delivery", qty, unit: u, amount: u === null ? null : r2(u * qty) });
    if (u === null) pending.push("delivery");
  }
  if (wantsInstall || !service) {
    const u = settings.rates.installation;
    serviceLines.push({ key: "installation", qty, unit: u, amount: u === null ? null : r2(u * qty) });
    if (u === null) pending.push("installation");
  }

  const pricedSubtotal = r2(unitKnown * qty + serviceLines.reduce((a, l) => a + (l.amount ?? 0), 0));
  const vatRate = settings.rates.vatRate;
  const vat = r2(pricedSubtotal * vatRate);
  const complete = unitPrice !== null && serviceLines.every((l) => l.amount !== null);
  return {
    basis,
    catalogue: match ? { slug: match.slug, code: match.code, price: match.price?.amount ?? null } : undefined,
    cabinLines,
    extraLines,
    unitPrice,
    quantity: qty,
    serviceLines,
    pricedSubtotal,
    vatRate,
    vat,
    total: complete ? r2(pricedSubtotal + vat) : null,
    pricedTotal: r2(pricedSubtotal + vat),
    complete,
    pending: Array.from(new Set(pending)),
  };
}

/* ------------------------------------------------------------------ */
/* Aramco review: catalogue-covered options vs engineering approval    */
/* ------------------------------------------------------------------ */

export type ReviewItem = { key: string; params?: Record<string, string | number>; status: AramcoStatus };

export function aramcoReview(d: Design, settings: DesignerSettings): ReviewItem[] {
  const out: ReviewItem[] = [];
  const sizes = products.filter((p) => p.family === "cabin" && p.category === "aramco-standard").map((p) => `${p.dimensions.length}x${p.dimensions.width}`);
  out.push({ key: "size", params: { size: `${d.length} × ${d.width}` }, status: sizes.includes(`${d.length}x${d.width}`) ? "catalogue" : "approval" });
  out.push({ key: "height", params: { height: d.height }, status: Math.abs(d.height - settings.rules.standardHeight) < 0.001 ? "catalogue" : "approval" });
  const c = counts(d);
  for (const k of MODULES) if (c[k]) out.push({ key: `module.${k}`, params: { n: c[k] }, status: settings.specs.aramcoModules[k] });
  if (d.windowsPerRoom === 2) out.push({ key: "extraWindow", status: "approval" });
  for (const id of EXTRA_IDS) if (d.extras[id]) out.push({ key: `extra.${id}`, params: { n: d.extras[id]! }, status: settings.specs.aramcoExtras[id as ExtraId] });
  const match = catalogueMatch(d);
  if (match) out.unshift({ key: "catalogueModel", params: { code: match.code }, status: "catalogue" });
  return out;
}

export const productFor = (slug?: string) => (slug ? getProduct(slug) : undefined);
