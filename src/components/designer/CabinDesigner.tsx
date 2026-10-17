"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Edition, Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { fillText, getDesignerDict } from "@/i18n/designer";
import { routes } from "@/lib/routes";
import { DEFAULT_SETTINGS, normalizeSettings, type DesignerSettings } from "@/lib/designer/config";
import { applyActions, parseRequest, sanitizeActions, type DesignAction } from "@/lib/designer/actions";
import { decodeData, defaultDesign, encodeData, sanitizeDesign, type Design } from "@/lib/designer/design";
import { layoutDesign } from "@/lib/designer/layout";
import { estimate, type Service } from "@/lib/designer/pricing";
import { issueText, newLocalRef, sar, summary } from "@/lib/designer/present";
import { validateCustomer, type Customer, type CustomerErrors } from "@/lib/designer/customer";
import { FloorPlan } from "@/components/drawings/FloorPlan";
import { DesignerControls } from "./DesignerControls";
import { PriceSummary } from "./PriceSummary";
import { IconX } from "@/components/ui/Icons";

type Msg = { id: number; from: "user" | "bot"; text: string; chips?: "start" | "category" | "next" };

const STORE = "sbt-designer-v1";
const noop = () => () => {};

function loadStored(locale: Locale): { design: Design | null; confirmed: boolean; msgs: Msg[] | null } {
  try {
    const hash = new URLSearchParams(window.location.hash.slice(1)).get("d");
    const fromHash = hash ? sanitizeDesign(decodeData(hash), DEFAULT_SETTINGS) : null;
    const raw = JSON.parse(window.sessionStorage.getItem(STORE) ?? "null") as { design?: unknown; confirmed?: boolean } | null;
    const msgs = JSON.parse(window.sessionStorage.getItem(`${STORE}-chat-${locale}`) ?? "null") as Msg[] | null;
    return {
      design: fromHash ?? (raw?.design ? sanitizeDesign(raw.design, DEFAULT_SETTINGS) : null),
      confirmed: Boolean(fromHash) || Boolean(raw?.confirmed),
      msgs: Array.isArray(msgs) && !fromHash ? msgs.slice(-80) : null,
    };
  } catch {
    return { design: null, confirmed: false, msgs: null };
  }
}

export function CabinDesigner({ edition, locale }: { edition: Edition; locale: Locale }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const t = getDesignerDict(locale);
  if (!mounted) return <p className="py-24 text-center text-sm text-muted">{getDictionary(locale).common.loading}</p>;
  return <Designer edition={edition} locale={locale} t={t} />;
}

function Designer({ edition, locale, t }: { edition: Edition; locale: Locale; t: ReturnType<typeof getDesignerDict> }) {
  const d = getDictionary(locale);
  const router = useRouter();
  const [stored] = useState(() => loadStored(locale));
  const [settings, setSettings] = useState<DesignerSettings>(DEFAULT_SETTINGS);
  const [flags, setFlags] = useState({ db: false, ai: false });
  const [design, setDesign] = useState<Design>(() => stored.design ?? defaultDesign(DEFAULT_SETTINGS));
  const [confirmed, setConfirmed] = useState(stored.confirmed);
  const [msgs, setMsgs] = useState<Msg[]>(() => stored.msgs ?? [{ id: 1, from: "bot", text: t.chat.greet, chips: "start" }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"chat" | "drawing" | "price">("chat");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/designer/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { settings?: unknown; db?: boolean; ai?: boolean } | null) => {
        if (!alive || !j) return;
        setSettings(normalizeSettings(j.settings));
        setFlags({ db: Boolean(j.db), ai: Boolean(j.ai) });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORE, JSON.stringify({ design, confirmed }));
      window.sessionStorage.setItem(`${STORE}-chat-${locale}`, JSON.stringify(msgs.slice(-80)));
    } catch {
      /* storage unavailable */
    }
  }, [design, confirmed, msgs, locale]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length, busy]);

  const lay = useMemo(() => layoutDesign(design, settings.rules), [design, settings]);
  const est = useMemo(() => estimate(design, settings), [design, settings]);
  const errors = lay.issues.filter((i) => i.level === "error");
  const canQuote = errors.length === 0;

  const push = (from: Msg["from"], text: string, chips?: Msg["chips"]) =>
    setMsgs((m) => [...m.map((x) => ({ ...x, chips: undefined })), { id: (m[m.length - 1]?.id ?? 0) + 1, from, text, chips }]);

  /** Bot reply describing the design after a change. */
  function describe(next: Design, isConfirmed: boolean, prefix?: string) {
    const l = layoutDesign(next, settings.rules);
    const err = l.issues.find((i) => i.level === "error");
    const lines = [prefix, err ? fillText(t.chat.fixFirst, { problem: issueText(err, locale) }) : fillText(t.chat.updated, { summary: summary(next, locale) })];
    if (!isConfirmed) lines.push(t.chat.askCategory);
    else if (!err) lines.push(t.chat.next);
    push("bot", lines.filter(Boolean).join("\n"), isConfirmed ? "next" : "category");
  }

  function apply(actions: DesignAction[], { say = false, prefix }: { say?: boolean; prefix?: string } = {}) {
    const quote = actions.some((a) => a.op === "quote");
    const changes = actions.filter((a) => a.op !== "quote");
    let next = design;
    let isConfirmed = confirmed;
    if (changes.length) {
      next = applyActions(design, changes, settings);
      setDesign(next);
      if (changes.some((a) => a.op === "category" || a.op === "template")) {
        isConfirmed = true;
        setConfirmed(true);
      }
      if (changes.some((a) => a.op === "category" && a.value === "aramco") && design.category !== "aramco") prefix = [prefix, t.chat.aramcoNote].filter(Boolean).join("\n");
    }
    if (say && changes.length) describe(next, isConfirmed, prefix);
    else if (say && prefix) push("bot", prefix, isConfirmed ? "next" : "category");
    if (quote) openQuote(next);
  }

  function openQuote(next = design) {
    const err = layoutDesign(next, settings.rules).issues.find((i) => i.level === "error");
    if (err) {
      push("bot", fillText(t.form.fixDesign, { problem: issueText(err, locale) }));
      setTab("chat");
      return;
    }
    setQuoteOpen(true);
  }

  async function onText(e: FormEvent) {
    e.preventDefault();
    const text = input.trim().slice(0, 500);
    if (!text || busy) return;
    setInput("");
    push("user", text);
    const r = parseRequest(text, design);
    if (r.understood) return apply(r.actions, { say: true });
    if (/\b(price|cost|how much|total)\b|سعر|كم|تكلف/i.test(text)) {
      push("bot", est.total !== null ? fillText(t.chat.priceAnswer, { price: sar(est.total, locale) }) : t.chat.priceAnswerPending, confirmed ? "next" : "category");
      return;
    }
    if (!flags.ai) {
      push("bot", t.chat.notUnderstood, confirmed ? "next" : "category");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/designer/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: text, lang: locale, design }) });
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as { reply?: string | null; actions?: unknown };
      const actions = sanitizeActions(j.actions);
      if (actions.length) apply(actions, { say: true, prefix: j.reply ?? undefined });
      else push("bot", j.reply || t.chat.notUnderstood, confirmed ? "next" : "category");
    } catch {
      push("bot", t.chat.aiFailed, confirmed ? "next" : "category");
    } finally {
      setBusy(false);
    }
  }

  const chipBtn = "min-h-[34px] rounded-full border border-line bg-bg px-3 text-xs font-semibold text-ink hover:border-accent hover:text-accent";
  const lastChips = msgs[msgs.length - 1]?.chips;
  const userSays = (text: string, actions: DesignAction[]) => {
    push("user", text);
    apply(actions, { say: true });
  };

  const drawing = (cls: string, testid?: string) =>
    lay.plan ? (
      <div className="grid-paper rounded-2xl border border-line p-2 sm:p-4" style={{ backgroundColor: "var(--dw-paper)" }} data-testid={testid}>
        <FloorPlan plan={lay.plan} locale={locale} dict={d} title={`${t.drawing.title} — ${summary(design, locale)}`} className={cls} />
      </div>
    ) : (
      <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted" data-testid={testid ? `${testid}-invalid` : undefined}>
        {t.drawing.invalid}
      </div>
    );

  return (
    <div className="pb-24 lg:pb-0">
      {/* Mobile tabs */}
      <div className="sticky top-[64px] z-20 -mx-4 mb-4 flex gap-1 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur lg:hidden" role="tablist">
        {(["chat", "drawing", "price"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`min-h-[38px] flex-1 rounded-full text-xs font-semibold ${tab === k ? "bg-accent text-accent-ink" : "text-muted"}`}
            data-testid={`tab-${k}`}
          >
            {t.tabs[k]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(300px,340px)_minmax(0,1fr)_minmax(290px,330px)] lg:items-start">
        {/* 1. Chat */}
        <section className={`${tab === "chat" ? "block" : "hidden"} min-w-0 lg:sticky lg:top-24 lg:block`} aria-label={t.chat.title} data-testid="designer-chat">
          <div className="flex h-[min(640px,calc(100vh-11rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-bold">{t.chat.title}</p>
              <div className="mt-2 lg:hidden">{drawing("h-auto max-h-[150px] w-full", "mini-drawing")}</div>
            </div>
            <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3" aria-live="polite" data-testid="designer-messages">
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                  <p
                    className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm ${m.from === "user" ? "rounded-ee-md bg-accent text-accent-ink" : "rounded-es-md border border-line bg-surface-2 text-ink"}`}
                    data-testid={m.from === "user" ? "dmsg-user" : "dmsg-bot"}
                  >
                    {m.text}
                  </p>
                </div>
              ))}
              {busy && <p className="text-xs text-muted">{t.chat.thinking}</p>}
            </div>
            <div className="border-t border-line p-3">
              {lastChips && (
                <div className="mb-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto" data-testid="designer-chips">
                  {(lastChips === "category" || lastChips === "start") && (
                    <>
                      <button type="button" className={chipBtn} onClick={() => userSays(t.controls.normal, [{ op: "category", value: "normal" }])}>
                        {t.controls.normal}
                      </button>
                      <button type="button" className={chipBtn} onClick={() => userSays(t.controls.aramco, [{ op: "category", value: "aramco" }])}>
                        {t.controls.aramco}
                      </button>
                    </>
                  )}
                  {(lastChips === "start" || lastChips === "next") &&
                    settings.templates.slice(0, lastChips === "start" ? 9 : 0).map((tp) => (
                      <button key={tp.id} type="button" className={chipBtn} onClick={() => userSays(tp.name[locale], [{ op: "template", id: tp.id }])}>
                        {tp.name[locale]}
                      </button>
                    ))}
                  {lastChips === "next" && (
                    <>
                      <button type="button" className={chipBtn} onClick={() => userSays(t.controls.addRoom, [{ op: "add", kind: "room" }])}>
                        + {t.controls.addRoom}
                      </button>
                      <button type="button" className={chipBtn} onClick={() => userSays(t.controls.addToilet, [{ op: "add", kind: "toilet" }])}>
                        + {t.controls.addToilet}
                      </button>
                      <button type="button" className={chipBtn} onClick={() => userSays(t.controls.addKitchenette, [{ op: "add", kind: "kitchenette" }])}>
                        + {t.controls.addKitchenette}
                      </button>
                      <button type="button" className="min-h-[34px] rounded-full bg-accent px-3 text-xs font-semibold text-accent-ink" onClick={() => openQuote()}>
                        {t.controls.quote}
                      </button>
                    </>
                  )}
                </div>
              )}
              <form onSubmit={onText} className="flex gap-2">
                <label htmlFor="designer-input" className="sr-only">
                  {t.chat.placeholder}
                </label>
                <input
                  id="designer-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, 500))}
                  placeholder={t.chat.placeholder}
                  autoComplete="off"
                  className="min-h-[44px] min-w-0 flex-1 rounded-full border border-line bg-bg px-4 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none sm:text-sm"
                  data-testid="designer-input"
                />
                <button type="submit" disabled={!input.trim() || busy} className="btn-primary !min-h-[44px] !px-4 text-sm disabled:opacity-50" data-testid="designer-send">
                  {t.chat.send}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* 2. Drawing + controls */}
        <section className={`${tab === "drawing" ? "block" : "hidden"} min-w-0 space-y-4 lg:block`} aria-label={t.drawing.title}>
          <div className="rounded-2xl border border-line bg-surface p-3 sm:p-4">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold">{t.drawing.title}</h2>
              <p className="num text-xs text-muted" data-testid="design-summary">
                {summary(design, locale)} · {t.drawing.area} {(design.length * design.width).toFixed(1)} {locale === "ar" ? "م²" : "m²"}
              </p>
            </div>
            {drawing("h-auto w-full", "live-drawing")}
            {errors.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs font-medium text-accent" role="alert" data-testid="design-errors">
                {errors.map((e) => (
                  <li key={e.key}>⚠ {issueText(e, locale)}</li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[0.68rem] leading-relaxed text-muted">{t.drawing.note}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-3 sm:p-4">
            <DesignerControls
              design={design}
              settings={settings}
              locale={locale}
              onChange={setDesign}
              onAction={(a) => apply(a)}
              onQuote={() => openQuote()}
              canQuote={canQuote}
            />
          </div>
        </section>

        {/* 3. Price */}
        <section className={`${tab === "price" ? "block" : "hidden"} min-w-0 lg:sticky lg:top-24 lg:block`} aria-label={t.price.title}>
          <PriceSummary design={design} est={est} settings={settings} locale={locale} canQuote={canQuote} onQuote={() => openQuote()} />
        </section>
      </div>

      {/* Mobile price bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-line bg-surface/95 px-4 py-2.5 backdrop-blur lg:hidden" data-testid="mobile-bar">
        <button type="button" onClick={() => setTab("price")} className="min-w-0 text-start">
          <span className="block text-[0.65rem] text-muted">{t.price.total}</span>
          <span className={`num block truncate text-sm font-extrabold ${est.total === null ? "text-accent" : "text-ink"}`}>{est.total === null ? t.price.pending : sar(est.total, locale)}</span>
        </button>
        <button type="button" onClick={() => openQuote()} disabled={!canQuote} className="btn-primary !min-h-[42px] shrink-0 !px-4 text-xs disabled:opacity-50">
          {t.controls.quote}
        </button>
      </div>

      {quoteOpen && (
        <QuoteForm
          locale={locale}
          onClose={() => setQuoteOpen(false)}
          onSubmit={async (customer, service) => {
            const quotePath = `${routes.designer({ edition, locale })}/quotation`;
            if (flags.db) {
              try {
                const res = await fetch("/api/designer/requests", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ lang: locale, design, customer, service }),
                });
                if (res.ok) {
                  const j = (await res.json()) as { ref: string; key: string };
                  router.push(`${quotePath}#r=${j.ref}&k=${j.key}`);
                  return null;
                }
              } catch {
                /* fall back to a local quotation */
              }
            }
            const local = { ref: newLocalRef(), date: new Date().toISOString().slice(0, 10), lang: locale, customer, service, design };
            router.push(`${quotePath}#q=${encodeData(local)}`);
            return flags.db ? t.form.error : null;
          }}
        />
      )}
    </div>
  );
}

function QuoteForm({ locale, onClose, onSubmit }: { locale: Locale; onClose: () => void; onSubmit: (c: Customer, s: Service) => Promise<string | null> }) {
  const t = getDesignerDict(locale);
  const [values, setValues] = useState<Record<string, string>>({ service: "both" });
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const { customer, errors: errs } = validateCustomer(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSending(true);
    const msg = await onSubmit(customer, (values.service as Service) || "both");
    setNote(msg);
    setSending(false);
  }

  const field = (name: keyof Customer, label: string, type = "text", required = false) => (
    <label className="block text-xs" htmlFor={`qf-${name}`}>
      <span className="font-semibold text-ink">
        {label}
        {required && " *"}
      </span>
      <input
        id={`qf-${name}`}
        type={type}
        value={values[name] ?? ""}
        onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
        aria-invalid={Boolean(errors[name])}
        className="mt-1 block min-h-[44px] w-full rounded-xl border border-line bg-bg px-3 text-base text-ink focus:border-accent focus:outline-none sm:text-sm"
        data-testid={`qf-${name}`}
      />
      {errors[name] && <span className="mt-0.5 block text-[0.7rem] font-semibold text-accent">{errors[name] === "required" ? t.form.required : t.form.invalid}</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" role="dialog" aria-modal="true" aria-label={t.form.title}>
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-lift sm:rounded-3xl" data-testid="quote-form" noValidate>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-bold">{t.form.title}</h2>
          <button type="button" onClick={onClose} aria-label={t.form.cancel} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2">
            <IconX width={18} height={18} />
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {field("name", t.form.name, "text", true)}
          {field("company", t.form.company)}
          {field("phone", t.form.phone, "tel", true)}
          {field("email", t.form.email, "email")}
          <div className="sm:col-span-2">{field("location", t.form.location)}</div>
          <label className="block text-xs sm:col-span-2">
            <span className="font-semibold text-ink">{t.form.service}</span>
            <select
              value={values.service}
              onChange={(e) => setValues((v) => ({ ...v, service: e.target.value }))}
              className="mt-1 block min-h-[44px] w-full rounded-xl border border-line bg-bg px-3 text-sm text-ink"
              data-testid="qf-service"
            >
              {(["both", "delivery", "installation", "none"] as const).map((s) => (
                <option key={s} value={s}>
                  {t.form.services[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs sm:col-span-2">
            <span className="font-semibold text-ink">{t.form.notes}</span>
            <textarea
              value={values.notes ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value.slice(0, 1000) }))}
              rows={3}
              className="mt-1 block w-full rounded-xl border border-line bg-bg px-3 py-2 text-base text-ink sm:text-sm"
              data-testid="qf-notes"
            />
          </label>
        </div>
        <p className="mt-3 text-[0.7rem] text-muted">{t.form.privacy}</p>
        {note && <p className="mt-2 text-xs font-semibold text-accent">{note}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="min-h-[44px] rounded-full border border-line px-4 text-sm font-semibold">
            {t.form.cancel}
          </button>
          <button type="submit" disabled={sending} className="btn-primary !min-h-[44px] text-sm disabled:opacity-60" data-testid="qf-submit">
            {sending ? t.form.sending : t.form.submit}
          </button>
        </div>
      </form>
    </div>
  );
}

