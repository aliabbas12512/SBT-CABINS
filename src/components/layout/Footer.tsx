import Link from "next/link";
import { company, coverage } from "@/data/company";
import { categories } from "@/data/products";
import type { Edition, Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { routes } from "@/lib/routes";
import { generalWhatsappLink, mailLink, telLink } from "@/lib/whatsapp";
import { Logo } from "@/components/ui/Logo";
import { IconMail, IconPhone, IconPin, IconWhatsApp } from "@/components/ui/Icons";

export function Footer({ edition, locale }: { edition: Edition; locale: Locale }) {
  const d = getDictionary(locale);
  const base = { edition, locale };
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-line bg-surface">
      <div className="container grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">{d.footer.tagline}</p>
          <a href={generalWhatsappLink(locale)} target="_blank" rel="noopener noreferrer" className="btn-wa mt-6">
            <IconWhatsApp width={18} height={18} />
            {d.cta.whatsappQuote}
          </a>
        </div>

        <div className="lg:col-span-2">
          <h2 className="eyebrow">{d.footer.categories}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {(["aramco-standard", "normal-standard"] as const).map((id) => (
              <li key={id}>
                <Link href={routes.category(base, id)} className="text-ink-2 transition hover:text-accent">
                  {categories[id].name[locale]}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="eyebrow mt-8">{d.footer.explore}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link href={routes.catalog(base)} className="text-ink-2 transition hover:text-accent">{d.nav.catalog}</Link></li>
            <li><Link href={routes.compare(base)} className="text-ink-2 transition hover:text-accent">{d.nav.compare}</Link></li>
            <li><Link href={routes.product(base, "accommodation-cabin")} className="text-ink-2 transition hover:text-accent">{d.home.accTitle}</Link></li>
            <li><Link href={routes.contact(base)} className="text-ink-2 transition hover:text-accent">{d.nav.contact}</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h2 className="eyebrow">{d.footer.contact}</h2>
          <ul className="mt-4 space-y-4 text-sm">
            <li className="font-semibold text-ink">{company.contactPerson[locale]}</li>
            <li>
              <a href={telLink(company.phones.primary.international)} className="flex items-center gap-3 text-ink-2 hover:text-accent">
                <IconPhone width={16} height={16} className="text-accent" />
                <span className="num">{company.phones.primary.local}</span>
                <span className="text-xs text-muted">· WhatsApp</span>
              </a>
            </li>
            <li>
              <a href={telLink(company.phones.secondary.international)} className="flex items-center gap-3 text-ink-2 hover:text-accent">
                <IconPhone width={16} height={16} className="text-accent" />
                <span className="num">{company.phones.secondary.local}</span>
              </a>
            </li>
            <li>
              <a href={mailLink()} className="flex items-center gap-3 break-all text-ink-2 hover:text-accent">
                <IconMail width={16} height={16} className="shrink-0 text-accent" />
                {company.email}
              </a>
            </li>
            <li className="flex items-center gap-3 text-ink-2">
              <IconPin width={16} height={16} className="shrink-0 text-accent" />
              {company.base[locale]}
            </li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h2 className="eyebrow">{d.footer.coverage}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {coverage.map((c) => (
              <li key={c.id} className="chip">{c.name[locale]}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container space-y-3 py-8 text-xs leading-relaxed text-muted">
          <p>{d.footer.disclaimer}</p>
          <p>{d.footer.notes}</p>
          <p className="pt-2">
            © <span className="num">{year}</span> {company.brand}. {d.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
