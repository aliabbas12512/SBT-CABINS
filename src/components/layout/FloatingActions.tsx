"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getProduct } from "@/data/products";
import type { Edition, Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { routes } from "@/lib/routes";
import { generalWhatsappLink, productWhatsappLink } from "@/lib/whatsapp";
import { useCompare } from "@/components/compare/CompareContext";
import { IconCompare, IconWhatsApp, IconX } from "@/components/ui/Icons";

/** Floating WhatsApp button + compare tray. */
export function FloatingActions({ edition, locale }: { edition: Edition; locale: Locale }) {
  const d = getDictionary(locale);
  const pathname = usePathname() || "";
  const { selected, clear } = useCompare();
  const base = { edition, locale };

  // On a product page, the floating button carries that product's message.
  const slug = pathname.match(/\/products\/([^/]+)/)?.[1];
  const product = slug ? getProduct(slug) : undefined;
  const waHref = product ? productWhatsappLink(product, locale) : generalWhatsappLink(locale);
  const onCompare = pathname.endsWith("/compare");
  const showTray = selected.length > 0 && !onCompare;

  return (
    <>
      {showTray && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 animate-page-in" role="region" aria-label={d.compare.tray}>
          <div className="glass flex max-w-full items-center gap-2 rounded-full border border-line py-2 pe-2 ps-4 shadow-lift sm:gap-3">
            <IconCompare width={18} height={18} className="shrink-0 text-accent" />
            <span className="hidden text-sm font-medium text-ink sm:inline">{d.compare.tray}:</span>
            <span className="num truncate text-sm font-semibold text-ink">
              {selected.map((s) => getProduct(s)?.code ?? s).join(" · ")}
            </span>
            <Link href={routes.compare(base, selected)} className="btn-primary !min-h-[38px] !px-4 !py-1.5 text-xs">
              {d.cta.openCompare}
            </Link>
            <button type="button" onClick={clear} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink" aria-label={d.cta.clear}>
              <IconX width={16} height={16} />
            </button>
          </div>
        </div>
      )}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={d.cta.whatsappChat}
        className={`group fixed end-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-wa text-white shadow-lift transition hover:scale-105 sm:end-6 ${
          showTray ? "bottom-20" : "bottom-5 sm:bottom-6"
        }`}
      >
        <IconWhatsApp width={28} height={28} className="relative" />
      </a>
    </>
  );
}
