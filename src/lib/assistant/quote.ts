import { company } from "@/data/company";
import { getProduct, modelText, sizeText, type Product } from "@/data/products";
import type { Locale } from "@/i18n/config";

/**
 * Indicative quotation model. Prices are never stored in the quotation —
 * they are looked up from the catalogue every time the quotation is
 * rendered, so a quotation can only ever show a listed price.
 */

/** Saudi Arabia standard VAT rate (15 %, in force since 1 July 2020). */
export const VAT_RATE = 0.15;

export type Service = "delivery" | "installation" | "both" | "none";

export type QuoteItem =
  | { kind: "product"; slug: string; qty: number }
  | { kind: "custom"; length: number; width: number; basis?: string; use?: string; qty: number };

export type QuoteData = {
  v: 1;
  ref: string;
  date: string; // ISO date (YYYY-MM-DD)
  lang: Locale;
  name?: string;
  company?: string;
  location?: string;
  service?: Service;
  notes?: string;
  items: QuoteItem[];
};

export function newQuoteRef(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  let rand = "";
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    rand = a[0].toString(36).toUpperCase().padStart(6, "0").slice(-6);
  } catch {
    rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  }
  return `SBT-Q-${y}${m}${d}-${rand}`;
}

export type PricedLine = {
  item: QuoteItem;
  product?: Product;
  unitPrice: number | null;
  lineTotal: number | null;
};

export type Totals = {
  lines: PricedLine[];
  /** Sum of lines with a listed price. */
  pricedSubtotal: number;
  /** True when every line has a listed price. */
  complete: boolean;
  vat: number;
  /** Subtotal + VAT of listed items; delivery/installation are never included (pending). */
  indicativeTotal: number;
};

export function priceQuote(items: QuoteItem[]): Totals {
  const lines: PricedLine[] = items.map((item) => {
    if (item.kind === "custom") return { item, unitPrice: null, lineTotal: null };
    const product = getProduct(item.slug);
    const unit = product?.price?.amount ?? null;
    return { item, product, unitPrice: unit, lineTotal: unit === null ? null : unit * item.qty };
  });
  const pricedSubtotal = lines.reduce((s, l) => s + (l.lineTotal ?? 0), 0);
  const vat = Math.round(pricedSubtotal * VAT_RATE * 100) / 100;
  return {
    lines,
    pricedSubtotal,
    complete: lines.length > 0 && lines.every((l) => l.lineTotal !== null),
    vat,
    indicativeTotal: Math.round((pricedSubtotal + vat) * 100) / 100,
  };
}

export function formatSar(amount: number, locale: Locale): string {
  const n = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  return locale === "ar" ? `${n} ر.س` : `${n} SAR`;
}

export function formatDate(iso: string, locale: Locale): string {
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

/* ------------------------------------------------------------------ */
/* Sharing: the quotation travels in the URL fragment (never sent to a */
/* server), so the quotation page needs no backend or database.        */
/* ------------------------------------------------------------------ */

export function encodeQuote(q: QuoteData): string {
  const json = JSON.stringify(q);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeQuote(s: string): QuoteData | null {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const q = JSON.parse(new TextDecoder().decode(bytes)) as QuoteData;
    return validateQuote(q);
  } catch {
    return null;
  }
}

const clip = (s: unknown, n: number) => (typeof s === "string" ? s.slice(0, n) : undefined);

/** Accept only well-formed data; unknown products are dropped. */
export function validateQuote(q: QuoteData): QuoteData | null {
  if (!q || q.v !== 1 || typeof q.ref !== "string" || !/^SBT-Q-\d{8}-[A-Z0-9]{4,8}$/.test(q.ref)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(q.date)) return null;
  const items: QuoteItem[] = [];
  for (const it of Array.isArray(q.items) ? q.items.slice(0, 20) : []) {
    const qty = Math.min(500, Math.max(1, Math.floor(Number(it.qty) || 1)));
    if (it.kind === "product" && getProduct(it.slug)) items.push({ kind: "product", slug: it.slug, qty });
    if (it.kind === "custom") {
      const length = Number(it.length);
      const width = Number(it.width);
      if (length > 0 && length <= 60 && width > 0 && width <= 20) items.push({ kind: "custom", length, width, basis: clip(it.basis, 40), use: clip(it.use, 40), qty });
    }
  }
  if (!items.length) return null;
  return {
    v: 1,
    ref: q.ref,
    date: q.date,
    lang: q.lang === "ar" ? "ar" : "en",
    name: clip(q.name, 80),
    company: clip(q.company, 80),
    location: clip(q.location, 80),
    service: (["delivery", "installation", "both", "none"] as const).includes(q.service as Service) ? q.service : undefined,
    notes: clip(q.notes, 600),
    items,
  };
}

/* ------------------------------------------------------------------ */
/* WhatsApp                                                            */
/* ------------------------------------------------------------------ */

/**
 * Converts a Saudi mobile number in local format (05XXXXXXXX) to the
 * international digits wa.me expects (9665XXXXXXXX). Throws on anything else
 * so a wrong number can never be used silently.
 */
export function saudiWhatsappDigits(local: string): string {
  const digits = local.replace(/\D/g, "");
  if (/^05\d{8}$/.test(digits)) return `966${digits.slice(1)}`;
  if (/^9665\d{8}$/.test(digits)) return digits;
  throw new Error(`Not a valid Saudi mobile number: ${local}`);
}

export const WHATSAPP_DIGITS = saudiWhatsappDigits(company.phones.primary.local);

export function itemLabel(item: QuoteItem, locale: Locale): { type: string; size: string } {
  if (item.kind === "custom") {
    const m = locale === "ar" ? "م" : "m";
    return {
      type: locale === "ar" ? `كبينة بمقاس خاص${item.basis ? ` (على أساس ${item.basis})` : ""}` : `Custom-size cabin${item.basis ? ` (based on ${item.basis})` : ""}`,
      size: `${item.length} × ${item.width} ${m}`,
    };
  }
  const p = getProduct(item.slug)!;
  return { type: `${p.name[locale]} — ${modelText(p, locale)}`, size: sizeText(p, locale) };
}

export function quoteWhatsappMessage(q: QuoteData, locale: Locale): string {
  const labels = q.items.map((it) => itemLabel(it, locale));
  const types = labels.map((l) => l.type).join(" / ");
  const sizes = labels.map((l) => l.size).join(" / ");
  const qty = q.items.map((it) => it.qty).join(" / ");
  if (locale === "ar") {
    return `مرحباً SBT CABINS، أرغب في استكمال إجراءات عرض سعر الكابينة المتنقلة. رقم العرض: ${q.ref}. نوع الكابينة: ${types}. المقاس: ${sizes}. الكمية: ${qty}. اللغة: العربية. يرجى تأكيد السعر النهائي والمواصفات.`;
  }
  return `Hello SBT CABINS, I would like to finalize my portable cabin quotation. Quotation Reference: ${q.ref}. Cabin Type: ${types}. Size: ${sizes}. Quantity: ${qty}. Language: English. Please confirm the final price and specifications.`;
}

export function whatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_DIGITS}?text=${encodeURIComponent(message)}`;
}
