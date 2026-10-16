"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getProduct } from "@/data/products";
import type { Edition, Locale } from "@/i18n/config";
import { getAssistantDict } from "@/i18n/assistant";
import { useCompare } from "@/components/compare/CompareContext";
import { IconX } from "@/components/ui/Icons";
import {
  aiAnswer,
  chipsFor,
  initialState,
  loadState,
  resolve,
  respond,
  textFor,
  unknownAnswer,
  type Action,
  type Msg,
  type State,
} from "@/lib/assistant/engine";
import { ChatCompare, ChatProductCard, ChatQuote, ChatSizes, ChatStandards, ChatSummary, ChatWhatsapp } from "./AssistantParts";

const KEY = "sbt-assistant-v1";
const MAX_INPUT = 500;

function load(lang: Locale): State {
  if (typeof window === "undefined") return initialState(lang);
  try {
    return loadState(window.sessionStorage.getItem(KEY), lang) ?? initialState(lang);
  } catch {
    return initialState(lang);
  }
}

type AiMode = "unknown" | "on" | "off";

/** Conversation history (text only) sent to the optional AI endpoint. */
function historyFor(s: State) {
  const out: { role: "user" | "assistant"; text: string }[] = [];
  for (const m of s.msgs.slice(-10)) {
    if (m.from === "user") out.push({ role: "user", text: resolve(m.text, s.lang).slice(0, 1200) });
    else if (m.kind === "text") out.push({ role: "assistant", text: textFor(m.key, m.params, s.lang).slice(0, 1200) });
    else if (m.kind === "ai") out.push({ role: "assistant", text: m.text.slice(0, 1200) });
  }
  return out.slice(-8);
}

const ChatIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.5-5.2A8.5 8.5 0 1 1 21 12Z" />
    <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" strokeWidth="2.6" />
  </svg>
);

export function SalesAssistant({ edition, locale }: { edition: Edition; locale: Locale }) {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>(() => load(locale));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<AiMode>("unknown");
  const { selected: compareSlugs } = useCompare();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const lang = state.lang;
  const a = getAssistantDict(lang);
  const base = { edition, locale: lang };
  const onQuotation = pathname.endsWith("/quotation");
  // Sit above the WhatsApp button, which itself moves up when the compare tray shows.
  const trayShown = compareSlugs.length > 0 && !pathname.endsWith("/compare");

  // Persist the conversation for this browser tab.
  useEffect(() => {
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — the conversation still works in memory */
    }
  }, [state]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [state.msgs.length, busy, open]);

  // Escape closes; lock page scroll behind the full-screen sheet on phones.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    const prev = document.body.style.overflow;
    if (mobile) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function openPanel() {
    setOpen(true);
    if (ai === "unknown") {
      fetch("/api/assistant", { method: "GET", cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { enabled: false }))
        .then((j: { enabled?: boolean }) => setAi(j.enabled ? "on" : "off"))
        .catch(() => setAi("off"));
    }
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
  }

  async function askAi(s: State, text: string) {
    if (ai === "off") {
      setState(unknownAnswer(s));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, lang: s.lang, history: historyFor(s).slice(0, -1) }),
      });
      if (res.status === 503) setAi("off");
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as { reply?: string; products?: string[]; fallback?: boolean };
      if (!j.reply) throw new Error("empty");
      setState((cur) => aiAnswer(cur, { text: j.reply!, slugs: j.products ?? [], fallback: Boolean(j.fallback) }));
    } catch {
      setState((cur) => unknownAnswer(cur));
    } finally {
      setBusy(false);
    }
  }

  function dispatch(action: Action) {
    if (busy) return;
    const r = respond(state, action);
    setState(r.state);
    if (r.ask) void askAi(r.state, r.ask);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim().slice(0, MAX_INPUT);
    if (!text || busy) return;
    setInput("");
    dispatch({ t: "text", text });
  }

  function closeOnPhone() {
    if (window.matchMedia("(max-width: 639px)").matches) setOpen(false);
  }

  const chips = chipsFor(state, compareSlugs);
  const pendingSlug = state.step === "qty" ? state.d.pending : undefined;
  const chosen = new Set(state.d.items.flatMap((i) => (i.kind === "product" ? [i.slug] : [])));

  function renderMsg(m: Msg) {
    if (m.from === "user") {
      return (
        <div className="flex justify-end" key={m.id}>
          <p className="max-w-[85%] whitespace-pre-line break-words rounded-2xl rounded-ee-md bg-accent px-3.5 py-2 text-sm text-accent-ink" data-testid="msg-user">
            {resolve(m.text, lang)}
          </p>
        </div>
      );
    }
    const bubble = (text: string, extra?: ReactNode) => (
      <div key={m.id} className="flex justify-start">
        <div className="max-w-[92%] whitespace-pre-line rounded-2xl rounded-es-md border border-line bg-surface-2 px-3.5 py-2 text-sm leading-relaxed text-ink" data-testid="msg-bot">
          {text}
          {extra}
        </div>
      </div>
    );
    switch (m.kind) {
      case "text":
        return bubble(textFor(m.key, m.params, lang));
      case "ai":
        return (
          <div key={m.id} className="space-y-2">
            {bubble(m.text, <span className="mt-1 block text-[0.65rem] font-medium text-muted">{a.aiBadge}</span>)}
            {m.slugs.map((slug) => {
              const p = getProduct(slug);
              return p ? <ChatProductCard key={slug} product={p} base={base} selected={chosen.has(slug) || pendingSlug === slug} onSelect={(s) => dispatch({ t: "select", slug: s })} onView={closeOnPhone} /> : null;
            })}
          </div>
        );
      case "products":
        return (
          <div key={m.id} className="space-y-2">
            {m.slugs.map((slug) => {
              const p = getProduct(slug);
              return p ? <ChatProductCard key={slug} product={p} base={base} selected={chosen.has(slug) || pendingSlug === slug} onSelect={(s) => dispatch({ t: "select", slug: s })} onView={closeOnPhone} /> : null;
            })}
          </div>
        );
      case "compare":
        return <ChatCompare key={m.id} slugs={m.slugs} base={base} />;
      case "standards":
        return <ChatStandards key={m.id} locale={lang} />;
      case "sizes":
        return <ChatSizes key={m.id} sizes={m.sizes} use={m.use} standard={m.standard} locale={lang} />;
      case "summary":
        return <ChatSummary key={m.id} draft={m.draft} locale={lang} />;
      case "quote":
        return <ChatQuote key={m.id} quote={m.quote} edition={edition} locale={lang} onNavigate={() => setOpen(false)} />;
      case "whatsapp":
        return (
          <div key={m.id}>
            <ChatWhatsapp locale={lang} />
          </div>
        );
    }
  }

  return (
    <>
      {!open && !onQuotation && (
        <button
          ref={launcherRef}
          type="button"
          onClick={openPanel}
          aria-label={a.open}
          aria-expanded={false}
          className={`group fixed end-4 z-30 inline-flex h-14 items-center gap-2 rounded-full bg-accent pe-3 ps-3 text-accent-ink shadow-lift transition hover:scale-[1.03] sm:end-6 sm:pe-5 print:hidden ${trayShown ? "bottom-[9rem]" : "bottom-[5.5rem] sm:bottom-[6.25rem]"}`}
          data-testid="assistant-launcher"
        >
          <ChatIcon />
          <span className="hidden text-sm font-semibold sm:inline">{getAssistantDict(locale).launcherShort}</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={a.title}
          lang={lang}
          dir={lang === "ar" ? "rtl" : "ltr"}
          className="fixed inset-0 z-50 flex flex-col bg-bg sm:inset-auto sm:bottom-6 sm:end-6 sm:h-[min(680px,calc(100vh-3rem))] sm:w-[420px] sm:overflow-hidden sm:rounded-3xl sm:border sm:border-line sm:shadow-lift print:hidden"
          data-testid="assistant-panel"
        >
          <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
              <ChatIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{a.title}</p>
              <p className="truncate text-xs text-muted">{a.subtitle}</p>
            </div>
            <div className="flex items-center rounded-full border border-line p-0.5 text-xs font-semibold" role="group" aria-label="Language / اللغة">
              {(["en", "ar"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  lang={l}
                  onClick={() => setState((s) => ({ ...s, lang: l }))}
                  aria-pressed={lang === l}
                  className={`min-h-[30px] min-w-[34px] rounded-full px-2 ${lang === l ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"}`}
                  data-testid={`assistant-lang-${l}`}
                >
                  {l === "en" ? "EN" : "ع"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTimeout(() => launcherRef.current?.focus(), 0);
              }}
              aria-label={a.close}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
              data-testid="assistant-close"
            >
              <IconX width={18} height={18} />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4" aria-live="polite" data-testid="assistant-messages">
            {state.msgs.map(renderMsg)}
            {busy && (
              <div className="flex justify-start" role="status">
                <p className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface-2 px-3.5 py-2 text-sm text-muted">
                  <span className="flex gap-1" aria-hidden="true">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent [animation-delay:300ms]" />
                  </span>
                  {a.aiThinking}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-line bg-surface px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5">
            {chips.length > 0 && (
              <div className="mb-2.5 flex max-h-[7.5rem] flex-wrap gap-1.5 overflow-y-auto" data-testid="assistant-chips">
                {chips.map((c, i) => (
                  <button
                    key={`${c.action.t}-${i}`}
                    type="button"
                    disabled={busy}
                    onClick={() => dispatch(c.action)}
                    className={`min-h-[34px] rounded-full px-3 text-xs font-semibold transition disabled:opacity-50 ${
                      c.primary ? "bg-accent text-accent-ink hover:brightness-110" : "border border-line bg-bg text-ink hover:border-accent hover:text-accent"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={submit} className="flex items-center gap-2">
              <label htmlFor="assistant-input" className="sr-only">
                {a.placeholder}
              </label>
              <input
                id="assistant-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
                maxLength={MAX_INPUT}
                autoComplete="off"
                placeholder={a.placeholder}
                className="min-h-[44px] min-w-0 flex-1 rounded-full border border-line bg-bg px-4 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none sm:text-sm"
                data-testid="assistant-input"
              />
              <button type="submit" disabled={!input.trim() || busy} className="btn-primary !min-h-[44px] !px-4 text-sm disabled:opacity-50" data-testid="assistant-send">
                {a.send}
              </button>
            </form>
            <div className="mt-1.5 flex justify-between gap-2">
              <button type="button" onClick={() => dispatch({ t: "restart" })} className="min-h-[28px] text-xs font-semibold text-muted hover:text-ink" data-testid="assistant-restart">
                {a.restart}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
