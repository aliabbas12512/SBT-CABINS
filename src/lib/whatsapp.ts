import { company } from "@/data/company";
import { modelText, sizeText, type Product } from "@/data/products";
import type { Locale } from "@/i18n/config";
import { fill, getDictionary } from "@/i18n/dictionaries";

/** Builds a wa.me link that opens WhatsApp with a prefilled message. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function productMessage(product: Product, locale: Locale): string {
  const d = getDictionary(locale);
  return fill(d.whatsapp.product, {
    name: product.name[locale],
    code: product.code === "ACC" ? (locale === "ar" ? "وحدة سكن" : "Sleeper Unit") : modelText(product, locale),
    size: sizeText(product, locale),
  });
}

export function productWhatsappLink(product: Product, locale: Locale): string {
  return whatsappLink(productMessage(product, locale));
}

export function generalWhatsappLink(locale: Locale): string {
  return whatsappLink(getDictionary(locale).whatsapp.general);
}

export const telLink = (international: string) => `tel:${international}`;
export const mailLink = (subject?: string, body?: string) => {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const q = params.toString().replace(/\+/g, "%20");
  return `mailto:${company.email}${q ? `?${q}` : ""}`;
};
