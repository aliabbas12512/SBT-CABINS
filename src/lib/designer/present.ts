import type { Locale } from "@/i18n/config";
import { fillText, getDesignerDict } from "@/i18n/designer";
import { formatSar } from "@/lib/assistant/quote";
import { EXTRA_LABELS, SPACE_KINDS, type ExtraId } from "./config";
import { counts, type Design } from "./design";
import type { Issue } from "./layout";
import type { PriceLine } from "./pricing";

/** Text helpers shared by the designer, the quotation and the admin panel. */

export const sar = (n: number, l: Locale) => formatSar(n, l);

export function summary(d: Design, l: Locale): string {
  const t = getDesignerDict(l);
  const c = counts(d);
  const m = l === "ar" ? "م" : "m";
  const plural = (k: (typeof SPACE_KINDS)[number]) => (l === "en" && c[k] > 1 && k !== "storage" ? "s" : "");
  const parts = SPACE_KINDS.filter((k) => c[k]).map((k) => `${c[k]} ${t.controls.kindsShort[k]}${plural(k)}`);
  return `${d.length} × ${d.width} ${m}, ${d.category === "aramco" ? t.controls.aramco : t.controls.normal}${parts.length ? ` — ${parts.join(", ")}` : ""}`;
}

export function lineLabel(line: PriceLine, l: Locale): string {
  const t = getDesignerDict(l);
  if (line.key.startsWith("extra.")) return EXTRA_LABELS[line.key.slice(6) as ExtraId]?.[l] ?? line.key;
  const s = (t.price.lines as Record<string, string>)[line.key];
  return s ? fillText(s, line.params) : line.key;
}

export function issueText(i: Issue, l: Locale): string {
  const t = getDesignerDict(l);
  return fillText((t.issues as Record<string, string>)[i.key] ?? i.key, i.params);
}

export function reviewText(key: string, params: Record<string, string | number> | undefined, l: Locale): string {
  const t = getDesignerDict(l);
  if (key.startsWith("extra.")) return `${EXTRA_LABELS[key.slice(6) as ExtraId]?.[l] ?? key}${params?.n ? ` × ${params.n}` : ""}`;
  return fillText((t.price.review as Record<string, string>)[key] ?? key, params);
}

export function newLocalRef(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const a = new Uint8Array(3);
  crypto.getRandomValues(a);
  return `SBT-D-${y}${m}${d}-${Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}
