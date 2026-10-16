import { products } from "@/data/products";
import { listedPrices } from "./knowledge";

/** Server-side checks applied to every AI reply before it reaches the customer. */

/** Numbers the reply is allowed to contain when they look like money or capacities. */
const allowedNumbers = new Set<number>([
  ...listedPrices(),
  ...products.flatMap((p) => [p.tanks?.water ?? 0, p.tanks?.septic ?? 0]).filter(Boolean),
]);

/** Returns a reason when the reply breaks a rule, otherwise null. */
export function checkReply(text: string): string | null {
  const normalized = text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  for (const m of normalized.matchAll(/\d{1,3}(?:[,٬]\d{3})+(?:\.\d+)?|\d{4,}(?:\.\d+)?/g)) {
    const n = Number(m[0].replace(/[,٬]/g, ""));
    if (n >= 1000 && n !== 2026 && !allowedNumbers.has(n)) return `unlisted number ${n}`;
  }
  const lower = normalized.toLowerCase();
  const approval = /(aramco[- ]?(approved|certified|registered)|(approved|certified|registered) by (saudi )?aramco|معتمد(ة)? من (شركة )?أرامكو|اعتماد أرامكو)/g;
  for (const m of lower.matchAll(approval)) {
    const before = lower.slice(Math.max(0, m.index - 40), m.index);
    if (!/\b(not|no|never|isn't|without)\b|ليس|ليست|لا |غير|دون/.test(before)) return "approval claim";
  }
  return null;
}

