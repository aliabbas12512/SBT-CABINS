import type { Edition, Locale } from "@/i18n/config";
import type { CategoryId } from "@/data/products";

export type Base = { edition: Edition; locale: Locale };

const root = ({ edition, locale }: Base) => `/${edition}/${locale}`;

export const routes = {
  home: (b: Base) => root(b),
  catalog: (b: Base) => `${root(b)}/catalog`,
  category: (b: Base, id: CategoryId) => `${root(b)}/category/${id}`,
  product: (b: Base, slug: string) => `${root(b)}/products/${slug}`,
  compare: (b: Base, slugs: string[] = []) => `${root(b)}/compare${slugs.length ? `?models=${slugs.join(",")}` : ""}`,
  contact: (b: Base, model?: string) => `${root(b)}/contact${model ? `?model=${model}` : ""}`,
};

/** Replace the edition and/or locale segments of a pathname. */
export function swapSegments(pathname: string, next: Partial<Base>): string {
  const parts = pathname.split("/");
  // ["", edition, locale, ...rest]
  if (next.edition) parts[1] = next.edition;
  if (next.locale) parts[2] = next.locale;
  return parts.join("/") || "/";
}
