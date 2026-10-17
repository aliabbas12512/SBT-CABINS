import { EXTRA_IDS, SPACE_KINDS, type Category, type DesignerSettings, type ExtraId, type RoomUse, type SpaceKind } from "./config";
import { addSpace, counts, fromTemplate, removeSpace, sanitizeDesign, setCount, setExtra, setSize, type Design } from "./design";

/**
 * Design changes, shared by the buttons, the rule-based text parser and the
 * optional AI. The AI can only *propose* these actions; they are applied and
 * validated by the same deterministic code as a button click.
 */
export type DesignAction =
  | { op: "size"; length?: number; width?: number; height?: number }
  | { op: "category"; value: Category }
  | { op: "set"; kind: SpaceKind; count: number; use?: RoomUse }
  | { op: "add"; kind: SpaceKind; count?: number; use?: RoomUse }
  | { op: "remove"; kind: SpaceKind; count?: number }
  | { op: "extra"; id: ExtraId; qty: number }
  | { op: "windows"; perRoom: 1 | 2 }
  | { op: "quantity"; n: number }
  | { op: "furnished"; value: boolean }
  | { op: "template"; id: string }
  | { op: "reset" }
  | { op: "quote" };

export function applyActions(d: Design, actions: DesignAction[], settings: DesignerSettings): Design {
  let out = d;
  for (const a of actions.slice(0, 20)) {
    switch (a.op) {
      case "size":
        out = setSize(out, a);
        break;
      case "category":
        out = { ...out, category: a.value };
        break;
      case "set":
        out = setCount(out, a.kind, Math.max(0, Math.min(settings.rules.maxSpaces, a.count)), a.use);
        break;
      case "add":
        for (let i = 0; i < Math.min(8, a.count ?? 1); i++) out = addSpace(out, a.kind, a.use);
        break;
      case "remove":
        for (let i = 0; i < Math.min(8, a.count ?? 1); i++) out = removeSpace(out, a.kind);
        break;
      case "extra":
        out = setExtra(out, a.id, a.qty);
        break;
      case "windows":
        out = { ...out, windowsPerRoom: a.perRoom };
        break;
      case "quantity":
        out = { ...out, quantity: Math.max(1, Math.min(500, Math.floor(a.n))) };
        break;
      case "furnished":
        out = { ...out, spaces: out.spaces.map((s) => ({ ...s, furnished: a.value })) };
        break;
      case "template": {
        const t = settings.templates.find((x) => x.id === a.id);
        if (t) out = fromTemplate(t, out.category, settings);
        break;
      }
      case "reset":
        out = fromTemplate(settings.templates[0], "normal", settings);
        break;
    }
  }
  // Keep everything inside the configured limits.
  return sanitizeDesign(out, settings) ?? d;
}

/** Validates actions proposed by the AI (untrusted JSON). */
export function sanitizeActions(raw: unknown): DesignAction[] {
  if (!Array.isArray(raw)) return [];
  const out: DesignAction[] = [];
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  const kind = (v: unknown) => (SPACE_KINDS.includes(v as SpaceKind) ? (v as SpaceKind) : undefined);
  const roomUse = (v: unknown) => (["bedroom", "office", "living"] as const).find((u) => u === v);
  for (const r of raw.slice(0, 12)) {
    const a = (r ?? {}) as Record<string, unknown>;
    switch (a.op) {
      case "size": {
        const s = { op: "size" as const, length: num(a.length), width: num(a.width), height: num(a.height) };
        if (s.length !== undefined || s.width !== undefined || s.height !== undefined) out.push(s);
        break;
      }
      case "category":
        if (a.value === "aramco" || a.value === "normal") out.push({ op: "category", value: a.value });
        break;
      case "set":
      case "add":
      case "remove": {
        const k = kind(a.kind);
        const c = num(a.count);
        if (!k) break;
        if (a.op === "set" && c !== undefined) out.push({ op: "set", kind: k, count: Math.round(c), use: roomUse(a.use) });
        if (a.op === "add") out.push({ op: "add", kind: k, count: c ? Math.round(c) : 1, use: roomUse(a.use) });
        if (a.op === "remove") out.push({ op: "remove", kind: k, count: c ? Math.round(c) : 1 });
        break;
      }
      case "extra":
        if (EXTRA_IDS.includes(a.id as ExtraId) && num(a.qty) !== undefined) out.push({ op: "extra", id: a.id as ExtraId, qty: num(a.qty)! });
        break;
      case "windows":
        if (a.perRoom === 1 || a.perRoom === 2) out.push({ op: "windows", perRoom: a.perRoom });
        break;
      case "quantity":
        if (num(a.n)) out.push({ op: "quantity", n: num(a.n)! });
        break;
      case "furnished":
        if (typeof a.value === "boolean") out.push({ op: "furnished", value: a.value });
        else if (a.value === "true" || a.value === "false") out.push({ op: "furnished", value: a.value === "true" });
        break;
      case "reset":
      case "quote":
        out.push({ op: a.op });
        break;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Rule-based understanding of customer text (English + Arabic)        */
/* ------------------------------------------------------------------ */

const norm = (s: string) =>
  ` ${s
    .toLowerCase()
    .replace(/[ً-ٟ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[×*]/g, "x")
    .replace(/[,،]/g, " , ")} `;

const NUMBER_WORDS: [RegExp, number][] = [
  [/^(one|a|an|single|واحد|واحده)$/, 1],
  [/^(two|double|اثنين|اثنان|اثنتين|اثنتان)$/, 2],
  [/^(three|ثلاث|ثلاثه)$/, 3],
  [/^(four|اربع|اربعه)$/, 4],
  [/^(five|خمس|خمسه)$/, 5],
  [/^(six|ست|سته)$/, 6],
];
const NUM = String.raw`(?<![a-z0-9\u0621-\u064a.])(\d{1,2}|one|a|an|single|two|double|three|four|five|six|واحد|واحده|اثنين|اثنان|اثنتين|اثنتان|ثلاث|ثلاثه|اربع|اربعه|خمس|خمسه|ست|سته)`;
const NUM_AR = String.raw`(واحد|واحده|اثنين|اثنان|اثنتين|اثنتان|ثلاث|ثلاثه|اربع|اربعه|خمس|خمسه|ست|سته)`;
const toNum = (w: string) => {
  if (/^\d+$/.test(w)) return parseInt(w, 10);
  for (const [re, n] of NUMBER_WORDS) if (re.test(w)) return n;
  return 1;
};

type KindWords = { kind: SpaceKind; words: string; dual?: string; use?: RoomUse };
const KINDS: KindWords[] = [
  { kind: "toiletBath", words: String.raw`(?:combined|attached)\s+(?:toilet|wc)\s*(?:and|&|\+)\s*(?:bath|bathroom|shower)s?|(?:toilet|wc)\s*(?:and|&|\+|with)\s*(?:shower)|bathrooms?\s+with\s+(?:toilet|wc)|حمام\s+مع\s+مرحاض|حمام\s+كامل` },
  { kind: "bathroom", words: String.raw`shower\s*rooms?|showers?|دش|دوش` },
  { kind: "toiletBath", words: String.raw`bath\s*rooms?|baths` },
  { kind: "toilet", words: String.raw`toilets?|wcs?|washrooms?|restrooms?|دوره\s+مياه|دورات\s+مياه|مرحاض|مراحيض|حمام|حمامات`, dual: "حمامين|دورتين|دورتي\s+مياه|مرحاضين" },
  { kind: "kitchenette", words: String.raw`kitchenettes?|kitchens?|pantr(?:y|ies)|مطبخ|مطابخ|بانتري`, dual: "مطبخين" },
  { kind: "storage", words: String.raw`stor(?:e|age)(?:\s+rooms?)?|stores|مخزن|مستودع`, dual: "مخزنين" },
  { kind: "room", use: "office", words: String.raw`offices?|مكتب|مكاتب`, dual: "مكتبين" },
  { kind: "room", use: "bedroom", words: String.raw`bed\s*rooms?|غرف(?:ه|ة)?\s+نوم`, dual: "غرفتين\s+نوم|غرفتي\s+نوم" },
  { kind: "room", words: String.raw`rooms?|غرفه|غرف`, dual: "غرفتين|غرفتان" },
];

export type ParseResult = { actions: DesignAction[]; understood: boolean };

export function parseRequest(text: string, current: Design): ParseResult {
  const t = norm(text);
  const actions: DesignAction[] = [];

  if (/\b(reset|start over|start again)\b|من جديد|ابدا من البدايه|اعاده تعيين/.test(t)) return { actions: [{ op: "reset" }], understood: true };
  if (/\b(quot\w*|generate quote)\b|عرض سعر|عرض السعر|تسعير/.test(t) && !/\b(add|remove)\b/.test(t)) actions.push({ op: "quote" });

  // Dimensions
  const dm = t.match(/(\d+(?:\.\d+)?)\s*(?:m|meter|metre|meters|metres|م|متر)?\s*(?:x|by|في|على)\s*(\d+(?:\.\d+)?)/);
  if (dm) {
    const a = parseFloat(dm[1]);
    const b = parseFloat(dm[2]);
    actions.push({ op: "size", length: Math.max(a, b), width: Math.min(a, b) });
  }
  const hm = t.match(/(?:height|high|ارتفاع)\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:m|meter|metre|متر|م)?\s*(?:high|height)\b/);
  if (hm) actions.push({ op: "size", height: parseFloat(hm[1] ?? hm[2]) });

  // Category
  if (/aramco|ارامكو/.test(t)) actions.push({ op: "category", value: "aramco" });
  else if (/\bnormal\b|\bstandard cabin\b|\bregular\b|عادي|عاديه/.test(t)) actions.push({ op: "category", value: "normal" });

  // Number of cabins
  const qm = t.match(new RegExp(String.raw`${NUM}\s+(?:cabins|units|pcs|pieces|كبائن|وحدات)\b`));
  if (qm) actions.push({ op: "quantity", n: toNum(qm[1]) });

  // Rooms, toilets, …
  // A description ("12 x 3 with an office and a toilet") means one of each unnumbered item.
  const describing = Boolean(dm) || /\b(need|want|with|cabin|design|make|build)\b|اريد|احتاج|فيها|فيه|مع|كبينه/.test(t);
  const adding = /\b(add|another|one more|extra|plus|more)\b|اضف|اضافه|زياده|زود/.test(t);
  const removing = /\b(remove|delete|without|no more|less|drop)\b|احذف|ازل|بدون|الغ|شيل/.test(t);
  let rest = t;
  const c = counts(current);
  const mentioned = new Set<SpaceKind>();
  // "separate toilet and bathroom" → one WC + one shower room
  const sep = /separate\s+(?:toilet|wc)s?\s*(?:and|&|\+)\s*(?:bath(?:room)?|shower)s?|دوره\s+مياه\s+وحمام\s+منفصل(?:ين)?|مرحاض\s+وحمام\s+منفصل(?:ين)?/;
  if (sep.test(rest)) {
    actions.push({ op: "set", kind: "toilet", count: Math.max(1, c.toilet) }, { op: "set", kind: "bathroom", count: Math.max(1, c.bathroom) });
    mentioned.add("toilet").add("bathroom");
    rest = rest.replace(sep, " ");
  }
  for (const k of KINDS) {
    const reNum = new RegExp(String.raw`${NUM}[\s-]*(?:${k.words})`, "g");
    const reArNum = new RegExp(String.raw`(?:^|\s)و?(?:${k.words})\s+${NUM_AR}(?=[\s,.!?]|$)`, "g");
    const reDual = k.dual ? new RegExp(String.raw`(?:^|\s)و?(?:${k.dual})`, "g") : null;
    const reWord = new RegExp(String.raw`(?:^|[\s(])و?(?:${k.words})(?=[\s,.!?)]|$)`, "g");
    let n: number | undefined;
    let hit = false;
    const take = (re: RegExp, f: (m: RegExpMatchArray) => number) => {
      for (const m of rest.matchAll(re)) {
        n = (n ?? 0) + f(m);
        hit = true;
      }
      rest = rest.replace(re, " ");
    };
    if (reDual) take(reDual, () => 2);
    take(reNum, (m) => toNum(m[1]));
    take(reArNum, (m) => toNum(m[1]));
    if (!hit) {
      if (reWord.test(rest)) {
        hit = true;
        rest = rest.replace(reWord, " ");
      }
    }
    if (!hit) continue;
    mentioned.add(k.kind);
    if (removing) actions.push({ op: "remove", kind: k.kind, count: n ?? 1 });
    else if (adding) actions.push({ op: "add", kind: k.kind, count: n ?? 1, use: k.use });
    else if (n !== undefined) actions.push({ op: "set", kind: k.kind, count: n, use: k.use });
    else if (describing) actions.push({ op: "set", kind: k.kind, count: 1, use: k.use });
    else if (c[k.kind] === 0) actions.push({ op: "add", kind: k.kind, use: k.use });
  }
  // A full description with a size replaces the previous layout: unmentioned spaces are removed.
  if (dm && !adding && !removing && mentioned.size) {
    for (const k of SPACE_KINDS) if (!mentioned.has(k) && c[k]) actions.push({ op: "set", kind: k, count: 0 });
  }
  // "2-room cabin" → handled above; merge duplicate room "set"s (bedroom + office = total rooms)
  const roomSets = actions.filter((a): a is Extract<DesignAction, { op: "set" }> => a.op === "set" && a.kind === "room");
  if (roomSets.length > 1) {
    const total = roomSets.reduce((s, a) => s + a.count, 0);
    const firstUse = roomSets[0].use;
    for (const a of roomSets) actions.splice(actions.indexOf(a), 1);
    actions.push({ op: "set", kind: "room", count: total, use: firstUse });
  }

  // Extras
  const ac = t.match(new RegExp(String.raw`${NUM}?\s*(?:extra\s+|additional\s+)?(?:ac|a/c|air\s*condition\w*)\s*(?:points?)?|تكييف`));
  if (ac && /\b(ac|a\/c|air\s*condition)|تكييف/.test(t)) actions.push({ op: "extra", id: "acPoint", qty: ac[1] ? toNum(ac[1]) : 1 });
  if (/water heater|سخان/.test(t)) actions.push({ op: "extra", id: "waterHeater", qty: removing ? 0 : 1 });
  if (/\b(two|2)\s+windows?\b|نافذتين|شباكين/.test(t)) actions.push({ op: "windows", perRoom: 2 });
  if (/\bunfurnished\b|without furniture|بدون اثاث/.test(t)) actions.push({ op: "furnished", value: false });
  else if (/\bfurnished\b|with furniture|مفروش|مع اثاث/.test(t)) actions.push({ op: "furnished", value: true });

  return { actions, understood: actions.length > 0 };
}
