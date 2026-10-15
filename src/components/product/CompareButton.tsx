"use client";

import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { useCompare } from "@/components/compare/CompareContext";
import { IconCheck, IconCompare } from "@/components/ui/Icons";

export function CompareButton({ slug, locale, label, className = "" }: { slug: string; locale: Locale; label: string; className?: string }) {
  const d = getDictionary(locale);
  const { has, toggle } = useCompare();
  const active = has(slug);
  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={active}
      aria-label={`${active ? d.cta.removeCompare : d.cta.addCompare}: ${label}`}
      className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition ${
        active ? "border-accent bg-accent/10 text-accent" : "border-line text-ink-2 hover:border-accent/50 hover:text-accent"
      } ${className}`}
    >
      {active ? <IconCheck width={15} height={15} /> : <IconCompare width={15} height={15} />}
      {active ? d.cta.added : d.cta.addCompare}
    </button>
  );
}
