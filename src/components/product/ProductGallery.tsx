"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/i18n/config";
import { fill, getDictionary } from "@/i18n/dictionaries";
import { IconChevron, IconChevronLeft, IconExpand, IconX } from "@/components/ui/Icons";

export type GalleryItem =
  | { kind: "image"; id: string; src: string; width: number; height: number; alt: string; caption: string; tab: "photos" }
  | { kind: "drawing"; id: string; label: string; caption: string; node: ReactNode; tab: "drawings" };

/**
 * Image + drawing gallery with a keyboard-accessible full-screen viewer.
 * Drawings are rendered SVG, so they stay sharp at any zoom.
 */
export function ProductGallery({ items, locale, title }: { items: GalleryItem[]; locale: Locale; title: string }) {
  const d = getDictionary(locale);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const item = items[index];
  const rtl = locale === "ar";

  const n = items.length;
  const go = (delta: number) => setIndex((i) => (i + delta + n) % n);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      const step = e.key === "ArrowRight" ? (rtl ? -1 : 1) : e.key === "ArrowLeft" ? (rtl ? 1 : -1) : 0;
      if (step) setIndex((i) => (i + step + n) % n);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const trigger = triggerRef.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      trigger?.focus();
    };
  }, [open, rtl, n]);

  if (!item) return null;

  const renderItem = (it: GalleryItem, large: boolean) =>
    it.kind === "image" ? (
      <Image
        src={it.src}
        alt={it.alt}
        width={it.width}
        height={it.height}
        sizes={large ? "100vw" : "(min-width: 1024px) 58vw, 100vw"}
        className={`h-full w-full ${large ? "object-contain" : "object-cover"}`}
        priority={!large && index === 0}
      />
    ) : (
      <div className={`grid-paper flex h-full w-full items-center justify-center ${large ? "p-4 sm:p-10" : "p-4 sm:p-8"}`} style={{ backgroundColor: "var(--dw-paper)" }}>
        <div className="w-full max-w-full [&>svg]:mx-auto [&>svg]:max-h-full [&>svg]:w-full">{it.node}</div>
      </div>
    );

  const counter = fill(d.common.imageOf, { n: index + 1, total: items.length });

  return (
    <div>
      <div className="card relative overflow-hidden">
        <div className="relative aspect-[16/10] bg-surface-2" aria-live="polite">
          <div key={item.id} className="absolute inset-0 animate-fade-in">
            {renderItem(item, false)}
          </div>
          {items.length > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label={d.common.previous} className="glass absolute start-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line text-ink transition hover:text-accent">
                <IconChevronLeft />
              </button>
              <button type="button" onClick={() => go(1)} aria-label={d.common.next} className="glass absolute end-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line text-ink transition hover:text-accent">
                <IconChevron />
              </button>
            </>
          )}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(true)}
            className="glass absolute end-3 top-3 z-10 inline-flex h-10 items-center gap-2 rounded-full border border-line px-3.5 text-xs font-semibold text-ink transition hover:text-accent"
          >
            <IconExpand width={16} height={16} />
            {d.product.zoom}
          </button>
          <span className="glass num absolute bottom-3 start-3 z-10 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink">
            {index + 1} / {items.length}
          </span>
        </div>
        <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-ink">{item.kind === "drawing" ? item.label : d.product.photos}</span> — {item.caption}
        </p>
      </div>

      {items.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={title}>
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={it.kind === "drawing" ? it.label : `${d.product.photos} ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-[72px] sm:w-28 ${i === index ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              {it.kind === "image" ? (
                <Image src={it.src} alt="" fill sizes="112px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center px-1.5 text-center text-[0.65rem] font-semibold leading-tight text-ink" style={{ backgroundColor: "var(--dw-paper)" }}>
                  {it.label}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} — ${counter}`}
            dir={rtl ? "rtl" : "ltr"}
            className="fixed inset-0 z-[60] flex flex-col bg-bg/95 backdrop-blur-xl animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <p className="truncate text-sm font-semibold text-ink">
                {item.kind === "drawing" ? item.label : title} <span className="num ms-2 text-muted">{index + 1} / {items.length}</span>
              </p>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label={d.nav.close} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink hover:text-accent">
                <IconX />
              </button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-16" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
              <div key={item.id} className="h-full max-h-full w-full max-w-6xl animate-fade-in overflow-auto rounded-2xl">
                {renderItem(item, true)}
              </div>
              {items.length > 1 && (
                <>
                  <button type="button" onClick={() => go(-1)} aria-label={d.common.previous} className="absolute start-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink hover:text-accent sm:start-4">
                    <IconChevronLeft />
                  </button>
                  <button type="button" onClick={() => go(1)} aria-label={d.common.next} className="absolute end-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink hover:text-accent sm:end-4">
                    <IconChevron />
                  </button>
                </>
              )}
            </div>
            <p className="px-6 pb-5 text-center text-xs text-muted">{item.caption}</p>
          </div>,
          document.body,
        )}
    </div>
  );
}
