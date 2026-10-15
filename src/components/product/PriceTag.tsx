import type { Product } from "@/data/products";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatPrice } from "@/lib/format";

export function PriceTag({ product, locale, size = "md" }: { product: Product; locale: Locale; size?: "md" | "lg" }) {
  const d = getDictionary(locale);
  if (!product.price) {
    return (
      <div>
        <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">{d.product.unitPrice}</div>
        <div className={`font-display font-bold text-accent ${size === "lg" ? "text-2xl" : "text-base"}`}>{d.product.priceOnRequest}</div>
      </div>
    );
  }
  return (
    <div>
      <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">{d.product.unitPrice}</div>
      <div className="flex items-baseline gap-1.5">
        <span className={`num font-display font-extrabold text-ink ${size === "lg" ? "text-4xl" : "text-xl"}`}>{formatPrice(product.price.amount)}</span>
        <span className="text-xs font-semibold text-accent">{d.common.sar}</span>
        <span className="text-xs text-muted">/ {d.product.perUnit}</span>
      </div>
    </div>
  );
}
