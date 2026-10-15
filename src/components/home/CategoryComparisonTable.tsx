import { categories, categoryComparison } from "@/data/products";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { IconCheck } from "@/components/ui/Icons";

export function CategoryComparisonTable({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  const cell = (v: true | { en: string; ar: string }) =>
    v === true ? (
      <span className="inline-flex items-center gap-1.5 font-semibold text-accent">
        <IconCheck width={18} height={18} />
        <span className="sr-only">{d.category.included}</span>
      </span>
    ) : (
      <span className="text-ink-2">{v[locale]}</span>
    );

  return (
    <div className="card overflow-hidden" data-reveal>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <caption className="sr-only">{d.category.compareTitle}</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="w-[40%] px-5 py-4 text-start font-semibold text-muted">{d.compare.attribute}</th>
              <th scope="col" className="px-5 py-4 text-center">
                <span className="inline-block rounded-full bg-accent px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-accent-ink">{categories["aramco-standard"].shortName[locale]}</span>
              </th>
              <th scope="col" className="px-5 py-4 text-center">
                <span className="inline-block rounded-full border border-line bg-surface-2 px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink">{categories["normal-standard"].shortName[locale]}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {categoryComparison.map((r) => (
              <tr key={r.label.en} className="border-b border-line/70 last:border-0 odd:bg-surface-2/40">
                <th scope="row" className="px-5 py-3.5 text-start font-medium text-ink">{r.label[locale]}</th>
                <td className="px-5 py-3.5 text-center">{cell(r.aramco)}</td>
                <td className="px-5 py-3.5 text-center">{cell(r.normal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
