"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Edition, Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { routes, swapSegments } from "@/lib/routes";
import { generalWhatsappLink } from "@/lib/whatsapp";
import { Logo } from "@/components/ui/Logo";
import { IconMenu, IconMoon, IconSun, IconWhatsApp, IconX } from "@/components/ui/Icons";

export function Header({ edition, locale }: { edition: Edition; locale: Locale }) {
  const d = getDictionary(locale);
  const pathname = usePathname() || routes.home({ edition, locale });
  const base = { edition, locale };
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu when the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { href: routes.home(base), label: d.nav.home, exact: true },
    { href: routes.catalog(base), label: d.nav.catalog },
    { href: routes.category(base, "aramco-standard"), label: d.nav.aramco },
    { href: routes.category(base, "normal-standard"), label: d.nav.normal },
    { href: routes.compare(base), label: d.nav.compare },
    { href: routes.designer(base), label: d.nav.designer },
    { href: routes.contact(base), label: d.nav.contact },
  ];
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  const otherEdition: Edition = edition === "light" ? "dark" : "light";

  const langSwitch = (className = "") => (
    <div className={`flex items-center rounded-full border border-line bg-surface/60 p-0.5 text-xs font-semibold ${className}`} role="group" aria-label={d.switcher.language}>
      {(["en", "ar"] as const).map((l) => (
        <Link
          key={l}
          href={swapSegments(pathname, { locale: l })}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "true" : undefined}
          className={`rounded-full px-3 py-1.5 transition ${l === locale ? "bg-accent text-accent-ink" : "text-ink-2 hover:text-accent"}`}
        >
          {l === "en" ? "EN" : "العربية"}
        </Link>
      ))}
    </div>
  );

  const editionSwitch = (className = "") => (
    <Link
      href={swapSegments(pathname, { edition: otherEdition })}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface/60 text-ink transition hover:border-accent/60 hover:text-accent ${className}`}
      aria-label={otherEdition === "dark" ? d.switcher.switchToDark : d.switcher.switchToLight}
      title={otherEdition === "dark" ? d.switcher.darkEdition : d.switcher.lightEdition}
    >
      {otherEdition === "dark" ? <IconMoon /> : <IconSun />}
    </Link>
  );

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "glass border-b border-line/70" : "border-b border-transparent"}`}>
      <div className="container flex h-[72px] items-center justify-between gap-4">
        <Link href={routes.home(base)} className="shrink-0" aria-label="SBT CABINS — home">
          <Logo />
        </Link>

        <nav aria-label={d.nav.primary} className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href, l.exact) ? "page" : undefined}
                  className={`relative whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition ${
                    isActive(l.href, l.exact) ? "text-accent" : "text-ink-2 hover:text-ink"
                  }`}
                >
                  {l.label}
                  {isActive(l.href, l.exact) && <span className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-accent" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {langSwitch("hidden sm:flex")}
          {editionSwitch()}
          <a href={generalWhatsappLink(locale)} target="_blank" rel="noopener noreferrer" className="btn-wa hidden !px-4 xl:inline-flex">
            <IconWhatsApp width={18} height={18} />
            {d.cta.quote}
          </a>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface/60 text-ink xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? d.nav.close : d.nav.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto border-t border-line bg-bg/98 backdrop-blur-xl xl:hidden"
      >
        <nav aria-label={d.nav.primary} className="container flex flex-col gap-1 py-6">
          {links.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href, l.exact) ? "page" : undefined}
              className={`flex items-center justify-between rounded-xl px-4 py-4 text-lg font-semibold transition ${
                isActive(l.href, l.exact) ? "bg-surface-2 text-accent" : "text-ink hover:bg-surface-2"
              }`}
              style={{ animation: open ? `page-in .4s ${i * 40}ms both` : undefined }}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-6 flex flex-wrap items-center gap-3 px-1">
            {langSwitch()}
            <span className="text-sm text-muted">
              {d.switcher.edition}: <Link className="font-semibold text-accent underline-offset-4 hover:underline" href={swapSegments(pathname, { edition: otherEdition })}>{otherEdition === "dark" ? d.switcher.darkEdition : d.switcher.lightEdition}</Link>
            </span>
          </div>
          <a href={generalWhatsappLink(locale)} target="_blank" rel="noopener noreferrer" className="btn-wa mt-6 w-full">
            <IconWhatsApp width={18} height={18} />
            {d.cta.whatsappQuote}
          </a>
        </nav>
      </div>
    </header>
  );
}
