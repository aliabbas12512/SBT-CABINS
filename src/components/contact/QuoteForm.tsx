"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { categories, getProduct, products, shortRef, sizeText } from "@/data/products";
import type { Locale } from "@/i18n/config";
import { fill, getDictionary } from "@/i18n/dictionaries";
import { mailLink, whatsappLink } from "@/lib/whatsapp";
import { IconMail, IconWhatsApp } from "@/components/ui/Icons";

/**
 * Builds a quotation message and opens it in WhatsApp (or the e-mail client).
 * Nothing is submitted to a server and nothing is sent automatically.
 */
export function QuoteForm({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  const search = useSearchParams();
  const initial = getProduct((search.get("model") ?? "").toLowerCase())?.slug ?? "";
  const [model, setModel] = useState(initial);
  const [qty, setQty] = useState("1");
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  const p = getProduct(model);
  const modelLine = p ? `${shortRef(p, locale)} — ${p.name[locale]} (${sizeText(p, locale)})` : d.contact.formModelAny;
  const message = fill(d.whatsapp.quote, {
    model: modelLine,
    qty: qty || "1",
    city: city.trim(),
    name: name.trim(),
    company: company.trim() ? fill(d.whatsapp.companyLine, { company: company.trim() }) : "",
    notes: notes.trim() ? fill(d.whatsapp.notesLine, { notes: notes.trim() }) : "",
  });
  const valid = city.trim().length > 1 && name.trim().length > 1 && Number(qty) >= 1;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
  };

  const field = "mt-1.5 h-12 w-full rounded-xl border border-line bg-bg px-4 text-[0.95rem] text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
  const err = (bad: boolean) => (touched && bad ? "!border-red-500" : "");

  return (
    <form onSubmit={onSubmit} noValidate className="card p-6 sm:p-8">
      <h2 className="text-2xl font-bold">{d.contact.formTitle}</h2>
      <p className="mt-2 text-sm text-muted">{d.contact.formLead}</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="text-sm font-semibold text-ink">{d.contact.formModel}</span>
          <select value={model} onChange={(e) => setModel(e.target.value)} className={field}>
            <option value="">{d.contact.formModelAny}</option>
            {(["aramco-standard", "normal-standard"] as const).map((c) => (
              <optgroup key={c} label={categories[c].shortName[locale]}>
                {products
                  .filter((x) => x.category === c)
                  .map((x) => (
                    <option key={x.slug} value={x.slug}>
                      {shortRef(x, locale)} — {x.name[locale]} ({sizeText(x, locale)})
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm font-semibold text-ink">{d.contact.formQuantity} *</span>
          <input type="number" inputMode="numeric" min={1} value={qty} onChange={(e) => setQty(e.target.value)} className={`${field} num ${err(!(Number(qty) >= 1))}`} required />
        </label>
        <label>
          <span className="text-sm font-semibold text-ink">{d.contact.formCity} *</span>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={`${field} ${err(city.trim().length <= 1)}`}
            placeholder={locale === "ar" ? "الدمام، الرياض، جدة…" : "Dammam, Riyadh, Jeddah…"}
            autoComplete="address-level2"
            required
            aria-invalid={touched && city.trim().length <= 1}
          />
        </label>
        <label>
          <span className="text-sm font-semibold text-ink">{d.contact.formName} *</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={`${field} ${err(name.trim().length <= 1)}`} autoComplete="name" required aria-invalid={touched && name.trim().length <= 1} />
        </label>
        <label>
          <span className="text-sm font-semibold text-ink">{d.contact.formCompany}</span>
          <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className={field} autoComplete="organization" />
        </label>
        <label className="sm:col-span-2">
          <span className="text-sm font-semibold text-ink">{d.contact.formNotes}</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${field} h-auto py-3`} />
        </label>
      </div>

      {touched && !valid && (
        <p className="mt-4 text-sm font-medium text-red-500" role="alert">
          * {d.contact.required}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="submit" className="btn-wa flex-1">
          <IconWhatsApp width={18} height={18} />
          {d.contact.formSubmit}
        </button>
        <a
          href={mailLink(`${d.contact.formTitle} — ${modelLine}`, message)}
          className="btn-outline"
          onClick={(e) => {
            setTouched(true);
            if (!valid) e.preventDefault();
          }}
        >
          <IconMail width={16} height={16} />
          {d.contact.formEmail}
        </a>
      </div>
      <p className="mt-4 text-xs text-muted">{d.contact.whatsappNote}</p>
    </form>
  );
}
