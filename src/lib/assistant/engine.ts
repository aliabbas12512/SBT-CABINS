import { getProduct, modelText, products, type SizeKey } from "@/data/products";
import type { Locale, Localized } from "@/i18n/config";
import { getAssistantDict, type AssistantDict } from "@/i18n/assistant";
import {
  detectDimensions,
  detectIntent,
  detectProducts,
  detectQuantity,
  detectStandard,
  detectUse,
  findProducts,
  hasArabic,
  hasLatinWords,
  nearestTo,
  sizeKeyFor,
  sizesFor,
  USE_CASES,
  type StandardChoice,
  type UseCase,
} from "./knowledge";
import { formatSar, newQuoteRef, type QuoteData, type QuoteItem, type Service } from "./quote";

/**
 * The cabin consultant's conversation engine. Pure functions only:
 * respond(state, action) → next state. Every answer is built from the
 * catalogue; nothing here holds product facts of its own.
 *
 * Bot messages are stored as dictionary keys + parameters (not as finished
 * text), so switching language re-renders the whole conversation.
 */

export type Text = string | Localized;

export type Msg =
  | { id: number; from: "user"; text: Text }
  | { id: number; from: "bot"; kind: "text"; key: string; params?: Record<string, Text> }
  | { id: number; from: "bot"; kind: "products"; slugs: string[] }
  | { id: number; from: "bot"; kind: "compare"; slugs: string[] }
  | { id: number; from: "bot"; kind: "standards" }
  | { id: number; from: "bot"; kind: "sizes"; sizes: SizeKey[]; use?: UseCase; standard?: StandardChoice }
  | { id: number; from: "bot"; kind: "summary"; draft: Draft }
  | { id: number; from: "bot"; kind: "quote"; quote: QuoteData }
  | { id: number; from: "bot"; kind: "whatsapp" }
  | { id: number; from: "bot"; kind: "ai"; text: string; lang: Locale; slugs: string[]; fallback: boolean };

type BotMsg = Extract<Msg, { from: "bot" }>;
type NewBotMsg = BotMsg extends infer M ? (M extends BotMsg ? Omit<M, "id" | "from"> : never) : never;

export type Step =
  | "use"
  | "standard"
  | "size"
  | "custom"
  | "model"
  | "qty"
  | "special"
  | "location"
  | "locationText"
  | "service"
  | "name"
  | "quote"
  | "done";

export type Draft = {
  use?: UseCase;
  standard?: StandardChoice;
  size?: SizeKey;
  custom?: { length: number; width: number };
  /** Product slug (or "custom") waiting for a quantity. */
  pending?: string;
  items: QuoteItem[];
  special?: string;
  location?: string;
  service?: Service;
  name?: string;
  company?: string;
  /** True once the details questions (special → name) have been answered. */
  detailsDone?: boolean;
};

export type State = { v: 1; lang: Locale; step: Step; seq: number; msgs: Msg[]; d: Draft };

export const CITIES = ["dammam", "khobar", "jubail", "riyadh", "jeddah"] as const;
export type City = (typeof CITIES)[number];

export type Action =
  | { t: "use"; use: UseCase }
  | { t: "standard"; v: StandardChoice }
  | { t: "standardsInfo" }
  | { t: "size"; size: SizeKey }
  | { t: "sizeHelp" }
  | { t: "custom" }
  | { t: "customAdd" }
  | { t: "select"; slug: string }
  | { t: "qty"; n: number }
  | { t: "noSpecial" }
  | { t: "city"; city: City }
  | { t: "otherCity" }
  | { t: "service"; v: Service }
  | { t: "skipName" }
  | { t: "quote" }
  | { t: "addAnother" }
  | { t: "edit" }
  | { t: "compareNow"; slugs: string[] }
  | { t: "changeSize" }
  | { t: "changeStandard" }
  | { t: "restart" }
  | { t: "text"; text: string };

export type Result = { state: State; /** Free text the catalogue rules could not answer (offered to the optional AI). */ ask?: string };

const both = <T>(f: (d: AssistantDict, l: Locale) => T): { en: T; ar: T } => ({ en: f(getAssistantDict("en"), "en"), ar: f(getAssistantDict("ar"), "ar") });

export function initialState(lang: Locale): State {
  return { v: 1, lang, step: "use", seq: 1, msgs: [{ id: 1, from: "bot", kind: "text", key: "greet" }], d: { items: [] } };
}

/* ------------------------------------------------------------------ */

function bot(s: State, m: NewBotMsg) {
  s.seq += 1;
  s.msgs.push({ ...m, id: s.seq, from: "bot" } as Msg);
}
function say(s: State, key: string, params?: Record<string, Text>) {
  bot(s, { kind: "text", key, params });
}
function user(s: State, text: Text) {
  s.seq += 1;
  s.msgs.push({ id: s.seq, from: "user", text });
}

const sizeParam = (l: number, w: number): Localized => ({ en: `${l} × ${w} m`, ar: `${l} × ${w} م` });
const modelParam = (slug: string): Localized => {
  const p = getProduct(slug)!;
  return { en: `${p.name.en} (${modelText(p, "en")})`, ar: `${p.name.ar} (${modelText(p, "ar")})` };
};

/** Label shown for a chip the customer tapped (echoed as their message). */
export function actionLabel(a: Action): Text | null {
  switch (a.t) {
    case "use":
      return both((d) => d.uses[a.use]);
    case "standard":
      return both((d) => d.standards[a.v]);
    case "standardsInfo":
      return both((d) => d.standards.compare);
    case "size": {
      const p = products.find((x) => x.size === a.size)!;
      return { en: p.sizeLabel, ar: p.sizeLabel.replace(/ m$/, " م") };
    }
    case "sizeHelp":
      return both((d) => d.sizeHelpChip);
    case "custom":
      return both((d) => d.customChip);
    case "customAdd":
      return both((d) => d.customAdd);
    case "select":
      return modelParam(a.slug);
    case "qty":
      return String(a.n);
    case "noSpecial":
      return both((d) => d.noSpecial);
    case "city":
      return both((d) => d.cities[a.city]);
    case "otherCity":
      return both((d) => d.otherCity);
    case "service":
      return both((d) => d.services[a.v]);
    case "skipName":
      return both((d) => d.skip);
    case "quote":
      return both((d) => d.yesQuote);
    case "addAnother":
      return both((d) => d.addAnother);
    case "edit":
      return both((d) => d.editReq);
    case "compareNow":
      return both((d) => d.compareNow.replace("{n}", String(a.slugs.length)));
    case "changeSize":
      return both((d) => d.changeSize);
    case "changeStandard":
      return both((d) => d.changeStandard);
    case "restart":
      return both((d) => d.restart);
    case "text":
      return a.text;
  }
}

/* ------------------------------------------------------------------ */
/* Flow helpers                                                        */
/* ------------------------------------------------------------------ */

function askUse(s: State, key = "askUse") {
  s.step = "use";
  say(s, key);
}

function afterUse(s: State) {
  const use = s.d.use!;
  if (use === "camp" || use === "kitchen" || use === "other") say(s, `useNotes.${use}`);
  if (s.d.standard) return afterStandard(s, s.d.standard, false);
  s.step = "standard";
  say(s, "askStandard");
}

function afterStandard(s: State, v: StandardChoice, disclaim = true) {
  if (v === "aramco" && disclaim) say(s, "aramcoDisclaimer");
  s.d.standard = v;
  let list = findProducts({ use: s.d.use, standard: v });
  if (!list.length && v !== "any") {
    const other: StandardChoice = v === "aramco" ? "normal" : "aramco";
    say(s, "noneForStandard", { std: both((d) => d.standards[v]), other: both((d) => d.standards[other]) });
    s.d.standard = other;
    list = findProducts({ use: s.d.use, standard: other });
    if (!list.length) {
      s.d.standard = "any";
      list = findProducts({ use: s.d.use });
    }
  }
  const sizes = sizesFor(list);
  if (s.d.size && sizes.includes(s.d.size)) return showProducts(s);
  if (sizes.length <= 1) {
    s.d.size = sizes[0];
    return showProducts(s);
  }
  s.d.size = undefined;
  s.step = "size";
  say(s, "askSize");
}

function showProducts(s: State) {
  const list = findProducts({ use: s.d.use, standard: s.d.standard, size: s.d.size });
  s.step = "model";
  if (!list.length) return say(s, "noMatch");
  say(s, "matches");
  bot(s, { kind: "products", slugs: list.map((p) => p.slug) });
}

function handleDimensions(s: State, dim: { length: number; width: number }) {
  if (!(dim.length > 0 && dim.length <= 60 && dim.width > 0 && dim.width <= 20)) {
    s.step = "custom";
    return say(s, "customBad");
  }
  const key = sizeKeyFor(dim);
  if (key && findProducts({ use: s.d.use, standard: s.d.standard, size: key }).length) {
    s.d.size = key;
    s.d.custom = undefined;
    return showProducts(s);
  }
  s.d.custom = dim;
  s.d.size = undefined;
  s.step = "model";
  say(s, "customResult", { size: sizeParam(dim.length, dim.width) });
  bot(s, { kind: "products", slugs: nearestTo(dim.length, dim.width, { use: s.d.use, standard: s.d.standard }).map((p) => p.slug) });
}

function askQty(s: State, model: Text) {
  s.step = "qty";
  say(s, "askQty", { model });
}

function addItem(s: State, qty: number) {
  const pending = s.d.pending;
  if (pending === "custom" && s.d.custom) {
    s.d.items.push({ kind: "custom", length: s.d.custom.length, width: s.d.custom.width, use: s.d.use, qty });
  } else if (pending && getProduct(pending)) {
    const existing = s.d.items.find((i) => i.kind === "product" && i.slug === pending);
    if (existing) existing.qty = Math.min(500, existing.qty + qty);
    else s.d.items.push({ kind: "product", slug: pending, qty });
  }
  s.d.pending = undefined;
  if (s.d.items.length > 20) s.d.items = s.d.items.slice(-20);
  if (s.d.detailsDone) return summary(s);
  s.step = "special";
  say(s, "askSpecial");
}

function summary(s: State) {
  s.d.detailsDone = true;
  bot(s, { kind: "summary", draft: structuredClone(s.d) });
  s.step = "quote";
  say(s, "askQuote");
}

function todayIso(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

function makeQuote(s: State) {
  if (!s.d.items.length) return askUse(s, "quoteNeedsCabin");
  const q: QuoteData = {
    v: 1,
    ref: newQuoteRef(),
    date: todayIso(),
    lang: s.lang,
    name: s.d.name,
    company: s.d.company,
    location: s.d.location,
    service: s.d.service,
    notes: s.d.special,
    items: structuredClone(s.d.items),
  };
  bot(s, { kind: "quote", quote: q });
  s.step = "done";
}

function resetSelection(s: State) {
  s.d.use = undefined;
  s.d.standard = undefined;
  s.d.size = undefined;
  s.d.custom = undefined;
  s.d.pending = undefined;
}

const clean = (t: string, n: number) => t.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

function parseName(text: string): { name?: string; company?: string } {
  const parts = clean(text, 160)
    .split(/\s*(?:,|،|\||\s-\s|\s–\s|\bfrom\b|\bat\b|\sمن\s)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
  return { name: parts[0]?.slice(0, 80), company: parts.slice(1).join(" ").slice(0, 80) || undefined };
}

/* ------------------------------------------------------------------ */
/* Free text                                                           */
/* ------------------------------------------------------------------ */

function handleText(s: State, raw: string): Result {
  const text = clean(raw, 600);
  if (!text) return { state: s };

  // Answer in the language the customer writes in (not while they type a name, place or note).
  if (!["special", "locationText", "name", "custom", "qty"].includes(s.step)) {
    if (s.lang === "en" && hasArabic(text)) {
      s.lang = "ar";
      say(s, "langSwitched");
    } else if (s.lang === "ar" && !hasArabic(text) && hasLatinWords(text)) {
      s.lang = "en";
      say(s, "langSwitched");
    }
  }

  const intent = detectIntent(text);
  if (intent === "restart") return { state: restart(s) };

  // Step-specific answers first.
  switch (s.step) {
    case "qty": {
      const n = detectQuantity(text);
      if (n) {
        addItem(s, n);
        return { state: s };
      }
      if (!intent && !detectProducts(text).length && !detectUse(text)) {
        say(s, "qtyBad");
        return { state: s };
      }
      break;
    }
    case "custom": {
      const dim = detectDimensions(text);
      if (dim) {
        handleDimensions(s, dim);
        return { state: s };
      }
      if (!intent) {
        say(s, "customBad");
        return { state: s };
      }
      break;
    }
    case "special":
      s.d.special = text.slice(0, 600);
      s.step = "location";
      say(s, "askLocation");
      return { state: s };
    case "location":
    case "locationText":
      s.d.location = text.slice(0, 80);
      s.step = "service";
      say(s, "askService");
      return { state: s };
    case "name": {
      const { name, company } = parseName(text);
      s.d.name = name;
      s.d.company = company;
      summary(s);
      return { state: s };
    }
    case "service": {
      const t = text.toLowerCase();
      const both_ = /both|كلاهما|كليهما|الاثنين/.test(t) || (/deliver|توصيل/.test(t) && /install|تركيب/.test(t));
      const v: Service | undefined = both_ ? "both" : /deliver|توصيل/.test(t) ? "delivery" : /install|تركيب/.test(t) ? "installation" : /no|none|collect|لا|استلام/.test(t) ? "none" : undefined;
      if (v) return { state: respondInner(s, { t: "service", v }) };
      break;
    }
  }

  const found = detectProducts(text);
  if (intent === "compare" && found.length >= 2) {
    say(s, "compareIntro");
    bot(s, { kind: "compare", slugs: found.slice(0, 4).map((p) => p.slug) });
    return { state: s };
  }
  if (intent === "standards") {
    say(s, "standardsInfo");
    bot(s, { kind: "standards" });
    say(s, "aramcoDisclaimer");
    return { state: s };
  }
  if (found.length) {
    if (intent === "price") {
      for (const p of found.slice(0, 4)) {
        if (p.price) say(s, "priceListed", { model: modelParam(p.slug), price: { en: formatSar(p.price.amount, "en"), ar: formatSar(p.price.amount, "ar") } });
        else say(s, "priceMissing", { model: modelParam(p.slug) });
      }
    } else say(s, "matches");
    bot(s, { kind: "products", slugs: found.slice(0, 4).map((p) => p.slug) });
    s.step = "model";
    return { state: s };
  }

  const use = detectUse(text);
  const std = detectStandard(text);
  const dim = detectDimensions(text);
  if (use || std || dim) {
    if (use) {
      s.d.use = use;
      s.d.size = undefined;
      s.d.custom = undefined;
    }
    if (std) s.d.standard = std;
    if (!s.d.use) {
      // Keep what we understood; ask for the use first.
      if (dim) s.d.custom = dim;
      askUse(s);
      return { state: s };
    }
    if (use && (use === "camp" || use === "kitchen" || use === "other")) say(s, `useNotes.${use}`);
    if (!s.d.standard) {
      if (dim) s.d.custom = dim;
      s.step = "standard";
      say(s, "askStandard");
      return { state: s };
    }
    if (std === "aramco") say(s, "aramcoDisclaimer");
    const d = dim ?? s.d.custom;
    if (d) handleDimensions(s, d);
    else afterStandard(s, s.d.standard, false);
    return { state: s };
  }

  if (intent === "quote") {
    if (s.d.items.length) {
      if (s.d.detailsDone) makeQuote(s);
      else summary(s);
    } else askUse(s, "quoteNeedsCabin");
    return { state: s };
  }
  if (intent === "price") {
    say(s, "askWhichPrice");
    return { state: s };
  }
  if (intent === "whatsapp") {
    bot(s, { kind: "whatsapp" });
    return { state: s };
  }
  if (intent === "help") {
    say(s, "greet");
    s.step = s.step === "done" ? "use" : s.step;
    return { state: s };
  }
  return { state: s, ask: text };
}

/** Fallback when no AI answer is available for a free-text question. */
export function unknownAnswer(state: State): State {
  const s = structuredClone(state);
  say(s, "unknown");
  bot(s, { kind: "whatsapp" });
  return s;
}

export function aiAnswer(state: State, reply: { text: string; slugs: string[]; fallback: boolean }): State {
  const s = structuredClone(state);
  const slugs = reply.slugs.filter((x) => getProduct(x)).slice(0, 4);
  bot(s, { kind: "ai", text: reply.text, lang: s.lang, slugs, fallback: reply.fallback });
  if (reply.fallback) bot(s, { kind: "whatsapp" });
  if (slugs.length && ["use", "standard", "size", "model", "done"].includes(s.step)) s.step = "model";
  return s;
}

function restart(s: State): State {
  const fresh = initialState(s.lang);
  fresh.seq = s.seq + 1;
  fresh.msgs[0].id = fresh.seq;
  return fresh;
}

/* ------------------------------------------------------------------ */

function respondInner(s: State, a: Action): State {
  switch (a.t) {
    case "use":
      s.d.use = a.use;
      s.d.size = undefined;
      s.d.custom = undefined;
      s.d.standard = undefined;
      afterUse(s);
      break;
    case "standard":
      if (!s.d.use) {
        s.d.standard = a.v;
        askUse(s);
        break;
      }
      s.d.size = undefined;
      if (s.d.custom) {
        // A size given earlier in free text ("office 10 x 3") is used now.
        if (a.v === "aramco") say(s, "aramcoDisclaimer");
        s.d.standard = a.v;
        handleDimensions(s, s.d.custom);
      } else afterStandard(s, a.v);
      break;
    case "standardsInfo":
      say(s, "standardsInfo");
      bot(s, { kind: "standards" });
      say(s, "aramcoDisclaimer");
      if (s.step === "standard") say(s, "askStandard");
      break;
    case "size":
      s.d.size = a.size;
      s.d.custom = undefined;
      showProducts(s);
      break;
    case "sizeHelp": {
      const list = findProducts({ use: s.d.use, standard: s.d.standard });
      say(s, "sizeHelp");
      bot(s, { kind: "sizes", sizes: sizesFor(list), use: s.d.use, standard: s.d.standard });
      s.step = "size";
      break;
    }
    case "custom":
      s.step = "custom";
      say(s, "askCustom");
      break;
    case "customAdd": {
      if (!s.d.custom) break;
      s.d.pending = "custom";
      const size = sizeParam(s.d.custom.length, s.d.custom.width);
      askQty(s, both((d, l) => d.customLabel.replace("{size}", size[l])));
      break;
    }
    case "select":
      if (!getProduct(a.slug)) break;
      s.d.pending = a.slug;
      askQty(s, modelParam(a.slug));
      break;
    case "qty":
      if (s.step !== "qty" || !s.d.pending) break;
      addItem(s, Math.min(500, Math.max(1, Math.floor(a.n))));
      break;
    case "noSpecial":
      s.d.special = undefined;
      s.step = "location";
      say(s, "askLocation");
      break;
    case "city":
      s.d.location = getAssistantDict(s.lang).cities[a.city];
      s.step = "service";
      say(s, "askService");
      break;
    case "otherCity":
      s.step = "locationText";
      say(s, "typeLocation");
      break;
    case "service":
      s.d.service = a.v;
      s.step = "name";
      say(s, "askName");
      break;
    case "skipName":
      s.d.name = undefined;
      s.d.company = undefined;
      summary(s);
      break;
    case "quote":
      makeQuote(s);
      break;
    case "addAnother":
      resetSelection(s);
      askUse(s, "askUseAgain");
      break;
    case "edit":
      resetSelection(s);
      s.d = { items: [], name: s.d.name, company: s.d.company };
      askUse(s);
      break;
    case "compareNow": {
      const slugs = a.slugs.filter((x) => getProduct(x)).slice(0, 4);
      if (slugs.length < 2) say(s, "compareNeed");
      else {
        say(s, "compareIntro");
        bot(s, { kind: "compare", slugs });
      }
      break;
    }
    case "changeSize": {
      const sizes = sizesFor(findProducts({ use: s.d.use, standard: s.d.standard }));
      s.d.size = undefined;
      s.d.custom = undefined;
      if (sizes.length > 1) {
        s.step = "size";
        say(s, "askSize");
      } else {
        s.step = "custom";
        say(s, "askCustom");
      }
      break;
    }
    case "changeStandard":
      s.d.size = undefined;
      s.step = "standard";
      say(s, "askStandard");
      break;
    case "restart":
      return restart(s);
    case "text":
      return handleText(s, a.text).state;
  }
  return s;
}

/** Apply one customer action. Never mutates the given state. */
export function respond(state: State, a: Action): Result {
  const s = structuredClone(state);
  if (a.t !== "restart") {
    const label = actionLabel(a);
    if (label) user(s, label);
  }
  if (a.t === "text") return handleText(s, a.text);
  return { state: respondInner(s, a) };
}

/* ------------------------------------------------------------------ */
/* Chips for the current step                                          */
/* ------------------------------------------------------------------ */

export type ChipDef = { action: Action; label: string; primary?: boolean };

export function chipsFor(s: State, compareSlugs: string[]): ChipDef[] {
  const d = getAssistantDict(s.lang);
  const out: ChipDef[] = [];
  switch (s.step) {
    case "use":
      for (const u of USE_CASES) out.push({ action: { t: "use", use: u }, label: d.uses[u] });
      break;
    case "standard":
      out.push({ action: { t: "standard", v: "aramco" }, label: d.standards.aramco });
      out.push({ action: { t: "standard", v: "normal" }, label: d.standards.normal });
      out.push({ action: { t: "standardsInfo" }, label: d.standards.compare });
      out.push({ action: { t: "standard", v: "any" }, label: d.standards.any });
      break;
    case "size": {
      for (const size of sizesFor(findProducts({ use: s.d.use, standard: s.d.standard }))) {
        out.push({ action: { t: "size", size }, label: resolve(actionLabel({ t: "size", size })!, s.lang) });
      }
      out.push({ action: { t: "sizeHelp" }, label: d.sizeHelpChip });
      out.push({ action: { t: "custom" }, label: d.customChip });
      break;
    }
    case "model": {
      if (s.d.custom) out.push({ action: { t: "customAdd" }, label: d.customAdd, primary: true });
      if (sizesFor(findProducts({ use: s.d.use, standard: s.d.standard })).length > 1) out.push({ action: { t: "changeSize" }, label: d.changeSize });
      if (s.d.use) out.push({ action: { t: "changeStandard" }, label: d.changeStandard });
      if (!s.d.custom) out.push({ action: { t: "custom" }, label: d.customChip });
      break;
    }
    case "qty":
      for (const n of [1, 2, 3, 5, 10]) out.push({ action: { t: "qty", n }, label: String(n) });
      break;
    case "special":
      out.push({ action: { t: "noSpecial" }, label: d.noSpecial });
      break;
    case "location":
      for (const c of CITIES) out.push({ action: { t: "city", city: c }, label: d.cities[c] });
      out.push({ action: { t: "otherCity" }, label: d.otherCity });
      break;
    case "service":
      for (const v of ["both", "delivery", "installation", "none"] as const) out.push({ action: { t: "service", v }, label: d.services[v] });
      break;
    case "name":
      out.push({ action: { t: "skipName" }, label: d.skip });
      break;
    case "quote":
      out.push({ action: { t: "quote" }, label: d.yesQuote, primary: true });
      out.push({ action: { t: "addAnother" }, label: d.addAnother });
      out.push({ action: { t: "edit" }, label: d.editReq });
      break;
    case "done":
      out.push({ action: { t: "addAnother" }, label: d.addAnother });
      out.push({ action: { t: "restart" }, label: d.restart });
      break;
  }
  if (compareSlugs.length >= 2 && ["model", "size", "done"].includes(s.step)) {
    out.push({ action: { t: "compareNow", slugs: compareSlugs }, label: d.compareNow.replace("{n}", String(compareSlugs.length)) });
  }
  if (s.d.items.length && ["use", "standard", "size", "model"].includes(s.step) && s.d.detailsDone) {
    out.push({ action: { t: "quote" }, label: d.yesQuote, primary: true });
  }
  return out;
}

/** Resolve a dotted dictionary key ("useNotes.camp") with {param} substitution. */
export function textFor(key: string, params: Record<string, Text> | undefined, lang: Locale): string {
  let v: unknown = getAssistantDict(lang);
  for (const k of key.split(".")) v = (v as Record<string, unknown>)?.[k];
  let out = typeof v === "string" ? v : key;
  for (const [k, p] of Object.entries(params ?? {})) out = out.replaceAll(`{${k}}`, typeof p === "string" ? p : p[lang]);
  return out;
}

export const resolve = (t: Text, lang: Locale) => (typeof t === "string" ? t : t[lang]);

/** Validates state loaded from sessionStorage. */
export function loadState(raw: string | null, lang: Locale): State | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as State;
    if (s?.v !== 1 || !Array.isArray(s.msgs) || typeof s.step !== "string" || !s.d || !Array.isArray(s.d.items)) return null;
    if (s.msgs.length > 300) s.msgs = s.msgs.slice(-300);
    return { ...s, lang: s.lang === "ar" ? "ar" : s.lang === "en" ? s.lang : lang };
  } catch {
    return null;
  }
}
