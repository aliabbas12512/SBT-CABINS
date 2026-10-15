import type { Metadata } from "next";
import { Suspense } from "react";
import { company, coverage } from "@/data/company";
import { isEdition, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/seo";
import { generalWhatsappLink, mailLink, telLink } from "@/lib/whatsapp";
import { QuoteForm } from "@/components/contact/QuoteForm";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IconMail, IconPhone, IconPin, IconTruck, IconWhatsApp } from "@/components/ui/Icons";

type Params = Promise<{ edition: string; lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { edition, lang } = await params;
  if (!isEdition(edition) || !isLocale(lang)) return {};
  const d = getDictionary(lang);
  return pageMetadata({ edition, locale: lang, path: "/contact", title: d.meta.contactTitle, description: d.meta.contactDescription });
}

export default async function ContactPage({ params }: { params: Params }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const d = getDictionary(locale);

  const items = [
    { icon: <IconWhatsApp width={20} height={20} />, label: d.contact.primary, value: company.phones.primary.local, sub: company.phones.primary.display, href: generalWhatsappLink(locale), external: true, wa: true },
    { icon: <IconPhone width={20} height={20} />, label: d.contact.primary, value: company.phones.primary.local, sub: d.cta.call, href: telLink(company.phones.primary.international) },
    { icon: <IconPhone width={20} height={20} />, label: d.contact.secondary, value: company.phones.secondary.local, sub: company.phones.secondary.display, href: telLink(company.phones.secondary.international) },
    { icon: <IconMail width={20} height={20} />, label: d.contact.email, value: company.email, href: mailLink() },
    { icon: <IconPin width={20} height={20} />, label: d.contact.location, value: company.base[locale] },
    { icon: <IconTruck width={20} height={20} />, label: d.contact.coverage, value: d.contact.coverageValue },
  ];

  return (
    <div className="atmosphere">
      <section className="container pb-12 pt-14">
        <SectionHeading as="h1" eyebrow={d.contact.eyebrow} title={d.contact.title} lead={d.contact.lead} />
      </section>
      <section className="container grid gap-8 pb-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{d.contact.person}</p>
            <p className="mt-1 text-xl font-bold text-ink">{company.contactPerson[locale]}</p>
            <p className="text-sm text-muted">{company.contactRole[locale]} · {company.brand}</p>
            <ul className="mt-6 space-y-2">
              {items.map((it, i) => {
                const inner = (
                  <>
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${it.wa ? "bg-wa text-white" : "bg-surface-2 text-accent"}`}>{it.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-xs text-muted">{it.label}</span>
                      <span className={`block break-words font-semibold text-ink ${/\d{6}/.test(it.value) ? "num" : ""}`}>{it.value}</span>
                      {it.sub && <span className="num block text-xs text-muted">{it.sub}</span>}
                    </span>
                  </>
                );
                return (
                  <li key={i}>
                    {it.href ? (
                      <a
                        href={it.href}
                        {...(it.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="flex items-center gap-4 rounded-xl p-2 transition hover:bg-surface-2"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex items-center gap-4 p-2">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-muted">{d.contact.whatsappNote}</p>
          </div>
          <div className="card mt-6 p-6">
            <h2 className="text-lg font-bold">{d.footer.coverage}</h2>
            <ul className="mt-4 space-y-3">
              {coverage.map((c) => (
                <li key={c.id} className="flex items-start gap-3 text-sm">
                  <IconPin width={16} height={16} className="mt-0.5 shrink-0 text-accent" />
                  <span>
                    <span className="font-semibold text-ink">{c.name[locale]}</span>
                    <span className="block text-muted">{c.detail[locale]}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="lg:col-span-7">
          <Suspense fallback={<div className="card p-8 text-sm text-muted">{d.common.loading}</div>}>
            <QuoteForm locale={locale} />
          </Suspense>
          <p className="mt-6 text-xs leading-relaxed text-muted">{d.product.priceNote}</p>
        </div>
      </section>
    </div>
  );
}
