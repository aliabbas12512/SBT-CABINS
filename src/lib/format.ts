import type { Locale } from "@/i18n/config";

/**
 * Numbers are shown with Western digits in both languages so that prices,
 * dimensions and model numbers stay identical to the source catalogue.
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
}

export function formatMetres(value: number, locale: Locale, digits = 2): string {
  return `${value.toFixed(digits)} ${locale === "ar" ? "م" : "m"}`;
}

export function formatArea(value: number, locale: Locale): string {
  return `${value.toFixed(1)} ${locale === "ar" ? "م²" : "m²"}`;
}
