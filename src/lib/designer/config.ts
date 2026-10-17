import { categories, type SpecRow } from "@/data/products";
import type { Localized } from "@/i18n/config";

/**
 * Cabin designer configuration: layout rules, rate card, specifications and
 * templates. These are the defaults bundled with the website; when the
 * database is connected, the admin panel's saved settings replace them.
 *
 * PRICES: every rate defaults to null ("Pending Confirmation"). SBT CABINS
 * enters its real rates in the admin panel; nothing is estimated until then
 * (except designs that exactly match a catalogue model, which use that
 * model's listed price).
 */

export type Category = "normal" | "aramco";
export type SpaceKind = "room" | "toilet" | "bathroom" | "toiletBath" | "kitchenette" | "storage";
export type RoomUse = "bedroom" | "office" | "living";
export type WetKind = "toilet" | "bathroom" | "toiletBath";

export const SPACE_KINDS: SpaceKind[] = ["room", "toilet", "bathroom", "toiletBath", "kitchenette", "storage"];
export const WET_KINDS: WetKind[] = ["toilet", "bathroom", "toiletBath"];
export const isWet = (k: SpaceKind): k is WetKind => (WET_KINDS as string[]).includes(k);

export const EXTRA_IDS = [
  "acPoint",
  "powerSocket",
  "lightPoint",
  "waterHeater",
  "exhaustFan",
  "extraDoor",
  "bed",
  "bunkBed",
  "wardrobe",
  "desk",
  "officeChair",
  "fireExtinguisher",
] as const;
export type ExtraId = (typeof EXTRA_IDS)[number];

export const EXTRA_LABELS: Record<ExtraId, Localized> = {
  acPoint: { en: "Additional AC point", ar: "نقطة تكييف إضافية" },
  powerSocket: { en: "Additional power socket", ar: "مقبس كهرباء إضافي" },
  lightPoint: { en: "Additional light point", ar: "نقطة إنارة إضافية" },
  waterHeater: { en: "Water heater", ar: "سخان مياه" },
  exhaustFan: { en: "Exhaust fan", ar: "مروحة شفط" },
  extraDoor: { en: "Additional external door", ar: "باب خارجي إضافي" },
  bed: { en: "Single bed", ar: "سرير مفرد" },
  bunkBed: { en: "Bunk bed", ar: "سرير بطابقين" },
  wardrobe: { en: "Wardrobe", ar: "خزانة ملابس" },
  desk: { en: "Office desk", ar: "مكتب" },
  officeChair: { en: "Office chair", ar: "كرسي مكتب" },
  fireExtinguisher: { en: "Fire extinguisher", ar: "طفاية حريق" },
};

export const EXTRA_GROUPS: { title: Localized; ids: ExtraId[] }[] = [
  { title: { en: "Electrical", ar: "الكهرباء" }, ids: ["acPoint", "powerSocket", "lightPoint"] },
  { title: { en: "Plumbing & ventilation", ar: "السباكة والتهوية" }, ids: ["waterHeater", "exhaustFan"] },
  { title: { en: "Doors & safety", ar: "الأبواب والسلامة" }, ids: ["extraDoor", "fireExtinguisher"] },
  { title: { en: "Furniture", ar: "الأثاث" }, ids: ["bed", "bunkBed", "wardrobe", "desk", "officeChair"] },
];

/* ------------------------------------------------------------------ */
/* Layout rules (metres)                                               */
/* ------------------------------------------------------------------ */

export type Rules = {
  minLength: number;
  maxLength: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  /** Standard internal height (catalogue: 2.5 m). Heights above it carry a surcharge. */
  standardHeight: number;
  maxSpaces: number;
  minRoom: number;
  minBedroom: number;
  minKitchenette: number;
  minStorage: number;
  /** Wet units: length along the cabin × depth from the rear wall. */
  toilet: { length: number; depth: number };
  bathroom: { length: number; depth: number };
  toiletBath: { length: number; depth: number };
  /** Minimum clear depth of the lobby in front of wet units. */
  minLobby: number;
  doorWidth: number;
  wetDoorWidth: number;
  windowWidth: number;
  /** Catalogue sizes offered as presets (length × width). */
  presets: { length: number; width: number }[];
};

export const DEFAULT_RULES: Rules = {
  minLength: 3,
  maxLength: 12,
  minWidth: 2.4,
  maxWidth: 4,
  minHeight: 2.4,
  maxHeight: 3.2,
  standardHeight: 2.5,
  maxSpaces: 8,
  minRoom: 2.0,
  minBedroom: 2.4,
  minKitchenette: 1.8,
  minStorage: 1.5,
  toilet: { length: 1.2, depth: 1.5 },
  bathroom: { length: 1.5, depth: 1.8 },
  toiletBath: { length: 1.8, depth: 2.0 },
  minLobby: 1.0,
  doorWidth: 0.9,
  wetDoorWidth: 0.7,
  windowWidth: 1.0,
  presets: [
    { length: 12, width: 3.75 },
    { length: 6, width: 3.75 },
    { length: 4, width: 3 },
    { length: 12, width: 3.5 },
    { length: 6, width: 3.5 },
  ],
};

/* ------------------------------------------------------------------ */
/* Rate card (SAR) — all null until SBT CABINS enters real rates       */
/* ------------------------------------------------------------------ */

export type CategoryRates = {
  /** Structure, panels and standard finish, per m² of floor area. */
  perSqm: number | null;
  /** Fabrication labour per m² of floor area. */
  laborPerSqm: number | null;
  /** Per partitioned room (partition wall, door, standard electrical). */
  room: number | null;
  toilet: number | null;
  bathroom: number | null;
  toiletBath: number | null;
  kitchenette: number | null;
  storage: number | null;
  /** Per window beyond the first in each room. */
  extraWindow: number | null;
  /** Per 10 cm of height above the standard height. */
  heightPer10cm: number | null;
};

export type RateCard = {
  normal: CategoryRates;
  aramco: CategoryRates;
  extras: Record<ExtraId, number | null>;
  /** Per cabin. */
  delivery: number | null;
  /** Per cabin. */
  installation: number | null;
  /** Profit margin in percent, applied to the cabin cost (not to delivery/installation). */
  marginPct: number | null;
  vatRate: number;
  validityDays: number | null;
  deliveryTime: Localized | null;
  paymentTerms: Localized | null;
};

const emptyRates = (): CategoryRates => ({
  perSqm: null,
  laborPerSqm: null,
  room: null,
  toilet: null,
  bathroom: null,
  toiletBath: null,
  kitchenette: null,
  storage: null,
  extraWindow: null,
  heightPer10cm: null,
});

export const DEFAULT_RATES: RateCard = {
  normal: emptyRates(),
  aramco: emptyRates(),
  extras: Object.fromEntries(EXTRA_IDS.map((id) => [id, null])) as Record<ExtraId, null>,
  delivery: null,
  installation: null,
  marginPct: null,
  vatRate: 0.15,
  validityDays: null,
  deliveryTime: null,
  paymentTerms: null,
};

/* ------------------------------------------------------------------ */
/* Specifications and Aramco validation                                */
/* ------------------------------------------------------------------ */

/** Whether an option is covered by the published SBT Aramco Standard catalogue range. */
export type AramcoStatus = "catalogue" | "approval";

export type Specs = {
  normal: SpecRow[];
  aramco: SpecRow[];
  /** Per module / option: covered by the catalogue Aramco range, or needs engineering approval. */
  aramcoModules: Record<SpaceKind, AramcoStatus>;
  aramcoExtras: Record<ExtraId, AramcoStatus>;
};

export const DEFAULT_SPECS: Specs = {
  normal: categories["normal-standard"].baseSpec,
  aramco: categories["aramco-standard"].baseSpec,
  // Catalogue Aramco cabins (A1–A9) contain rooms/offices, toilets and kitchen/pantry.
  aramcoModules: { room: "catalogue", toilet: "catalogue", kitchenette: "catalogue", bathroom: "approval", toiletBath: "approval", storage: "approval" },
  aramcoExtras: Object.fromEntries(EXTRA_IDS.map((id) => [id, "approval"])) as Record<ExtraId, AramcoStatus>,
};

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export type Template = {
  id: string;
  name: Localized;
  length: number;
  width: number;
  spaces: { kind: SpaceKind; use?: RoomUse }[];
};

/** Starting layouts. Most mirror catalogue models, so their listed price applies. */
export const DEFAULT_TEMPLATES: Template[] = [
  { id: "one-room-6", name: { en: "1 room — 6 m", ar: "غرفة واحدة — 6 م" }, length: 6, width: 3.75, spaces: [{ kind: "room", use: "office" }] },
  { id: "office-wc-pantry-6", name: { en: "Office + toilet + pantry — 6 m", ar: "مكتب + دورة مياه + بانتري — 6 م" }, length: 6, width: 3.75, spaces: [{ kind: "room", use: "office" }, { kind: "toilet" }, { kind: "kitchenette" }] },
  { id: "office-12", name: { en: "Open office — 12 m", ar: "مكتب مفتوح — 12 م" }, length: 12, width: 3.75, spaces: [{ kind: "room", use: "office" }] },
  { id: "office-wc-12", name: { en: "Office + toilet — 12 m", ar: "مكتب + دورة مياه — 12 م" }, length: 12, width: 3.75, spaces: [{ kind: "room", use: "office" }, { kind: "toilet" }] },
  { id: "two-rooms", name: { en: "2 rooms", ar: "غرفتان" }, length: 12, width: 3.75, spaces: [{ kind: "room", use: "bedroom" }, { kind: "room", use: "bedroom" }] },
  {
    id: "two-rooms-wc-kitchen",
    name: { en: "2 rooms + toilet + kitchen", ar: "غرفتان + دورة مياه + مطبخ" },
    length: 12,
    width: 3.75,
    spaces: [{ kind: "room", use: "bedroom" }, { kind: "toilet" }, { kind: "kitchenette" }, { kind: "room", use: "bedroom" }],
  },
  {
    id: "two-rooms-two-wc",
    name: { en: "2 rooms + 2 toilets", ar: "غرفتان + دورتا مياه" },
    length: 12,
    width: 3.75,
    spaces: [{ kind: "room", use: "bedroom" }, { kind: "toilet" }, { kind: "toilet" }, { kind: "room", use: "bedroom" }],
  },
  {
    id: "three-rooms",
    name: { en: "3 rooms", ar: "3 غرف" },
    length: 12,
    width: 3.75,
    spaces: [{ kind: "room", use: "bedroom" }, { kind: "room", use: "bedroom" }, { kind: "room", use: "bedroom" }],
  },
  {
    id: "two-rooms-bath",
    name: { en: "2 rooms + toilet + separate bath", ar: "غرفتان + دورة مياه + حمّام منفصل" },
    length: 12,
    width: 3.75,
    spaces: [{ kind: "room", use: "bedroom" }, { kind: "toilet" }, { kind: "bathroom" }, { kind: "room", use: "bedroom" }],
  },
];

export type DesignerSettings = {
  rules: Rules;
  rates: RateCard;
  specs: Specs;
  templates: Template[];
  /** ISO timestamp of the last admin save, or null for bundled defaults. */
  updatedAt: string | null;
};

export const DEFAULT_SETTINGS: DesignerSettings = {
  rules: DEFAULT_RULES,
  rates: DEFAULT_RATES,
  specs: DEFAULT_SPECS,
  templates: DEFAULT_TEMPLATES,
  updatedAt: null,
};

/* ------------------------------------------------------------------ */
/* Validation of settings coming from the database / admin             */
/* ------------------------------------------------------------------ */

const num = (v: unknown, fallback: number, min = 0, max = 1e9) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
};
const price = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 10_000_000 ? Math.round(n * 100) / 100 : null;
};
const text = (v: unknown, n = 300): string => (typeof v === "string" ? v.slice(0, n) : "");
const loc = (v: unknown): Localized | null => {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const en = text(o.en).trim();
  const ar = text(o.ar).trim();
  return en || ar ? { en: en || ar, ar: ar || en } : null;
};
const dims = (v: unknown, d: { length: number; depth: number }) => {
  const o = (v ?? {}) as Record<string, unknown>;
  return { length: num(o.length, d.length, 0.8, 4), depth: num(o.depth, d.depth, 0.8, 4) };
};

/** Normalises settings from any source, filling gaps with defaults. Never throws. */
export function normalizeSettings(raw: unknown): DesignerSettings {
  const r = (raw ?? {}) as Record<string, unknown>;
  const ru = (r.rules ?? {}) as Record<string, unknown>;
  const D = DEFAULT_RULES;
  const rules: Rules = {
    minLength: num(ru.minLength, D.minLength, 1, 30),
    maxLength: num(ru.maxLength, D.maxLength, 1, 30),
    minWidth: num(ru.minWidth, D.minWidth, 1, 10),
    maxWidth: num(ru.maxWidth, D.maxWidth, 1, 10),
    minHeight: num(ru.minHeight, D.minHeight, 2, 5),
    maxHeight: num(ru.maxHeight, D.maxHeight, 2, 5),
    standardHeight: num(ru.standardHeight, D.standardHeight, 2, 5),
    maxSpaces: Math.round(num(ru.maxSpaces, D.maxSpaces, 1, 20)),
    minRoom: num(ru.minRoom, D.minRoom, 0.8, 10),
    minBedroom: num(ru.minBedroom, D.minBedroom, 0.8, 10),
    minKitchenette: num(ru.minKitchenette, D.minKitchenette, 0.8, 10),
    minStorage: num(ru.minStorage, D.minStorage, 0.8, 10),
    toilet: dims(ru.toilet, D.toilet),
    bathroom: dims(ru.bathroom, D.bathroom),
    toiletBath: dims(ru.toiletBath, D.toiletBath),
    minLobby: num(ru.minLobby, D.minLobby, 0.6, 3),
    doorWidth: num(ru.doorWidth, D.doorWidth, 0.6, 2),
    wetDoorWidth: num(ru.wetDoorWidth, D.wetDoorWidth, 0.5, 1.5),
    windowWidth: num(ru.windowWidth, D.windowWidth, 0.3, 3),
    presets: Array.isArray(ru.presets)
      ? ru.presets
          .slice(0, 12)
          .map((p) => ({ length: num((p as Record<string, unknown>)?.length, 0, 1, 30), width: num((p as Record<string, unknown>)?.width, 0, 1, 10) }))
          .filter((p) => p.length > 0 && p.width > 0)
      : D.presets,
  };
  if (rules.maxLength < rules.minLength) rules.maxLength = rules.minLength;
  if (rules.maxWidth < rules.minWidth) rules.maxWidth = rules.minWidth;
  if (rules.maxHeight < rules.minHeight) rules.maxHeight = rules.minHeight;

  const ra = (r.rates ?? {}) as Record<string, unknown>;
  const cat = (v: unknown): CategoryRates => {
    const o = (v ?? {}) as Record<string, unknown>;
    return Object.fromEntries(Object.keys(emptyRates()).map((k) => [k, price(o[k])])) as CategoryRates;
  };
  const ex = (ra.extras ?? {}) as Record<string, unknown>;
  const rates: RateCard = {
    normal: cat(ra.normal),
    aramco: cat(ra.aramco),
    extras: Object.fromEntries(EXTRA_IDS.map((id) => [id, price(ex[id])])) as Record<ExtraId, number | null>,
    delivery: price(ra.delivery),
    installation: price(ra.installation),
    marginPct: ra.marginPct === null || ra.marginPct === undefined || ra.marginPct === "" ? null : num(ra.marginPct, 0, 0, 200),
    vatRate: num(ra.vatRate, 0.15, 0, 1),
    validityDays: ra.validityDays === null || ra.validityDays === undefined || ra.validityDays === "" ? null : Math.round(num(ra.validityDays, 30, 1, 365)),
    deliveryTime: loc(ra.deliveryTime),
    paymentTerms: loc(ra.paymentTerms),
  };

  const sp = (r.specs ?? {}) as Record<string, unknown>;
  const rows = (v: unknown, d: SpecRow[]): SpecRow[] => {
    if (!Array.isArray(v)) return d;
    const out = v
      .slice(0, 40)
      .map((x) => ({ label: loc((x as SpecRow)?.label), value: loc((x as SpecRow)?.value) }))
      .filter((x): x is SpecRow => Boolean(x.label && x.value));
    return out.length ? out : d;
  };
  const status = (v: unknown, d: AramcoStatus): AramcoStatus => (v === "catalogue" || v === "approval" ? v : d);
  const am = (sp.aramcoModules ?? {}) as Record<string, unknown>;
  const ae = (sp.aramcoExtras ?? {}) as Record<string, unknown>;
  const specs: Specs = {
    normal: rows(sp.normal, DEFAULT_SPECS.normal),
    aramco: rows(sp.aramco, DEFAULT_SPECS.aramco),
    aramcoModules: Object.fromEntries(SPACE_KINDS.map((k) => [k, status(am[k], DEFAULT_SPECS.aramcoModules[k])])) as Record<SpaceKind, AramcoStatus>,
    aramcoExtras: Object.fromEntries(EXTRA_IDS.map((k) => [k, status(ae[k], DEFAULT_SPECS.aramcoExtras[k])])) as Record<ExtraId, AramcoStatus>,
  };

  const templates: Template[] = Array.isArray(r.templates)
    ? r.templates
        .slice(0, 24)
        .map((t, i): Template | null => {
          const o = (t ?? {}) as Record<string, unknown>;
          const name = loc(o.name);
          const spaces = Array.isArray(o.spaces)
            ? o.spaces
                .slice(0, rules.maxSpaces)
                .map((s) => s as Record<string, unknown>)
                .filter((s) => SPACE_KINDS.includes(s.kind as SpaceKind))
                .map((s): Template["spaces"][number] => ({ kind: s.kind as SpaceKind, use: (["bedroom", "office", "living"] as const).find((u) => u === s.use) }))
            : [];
          return name && spaces.length
            ? { id: text(o.id, 40) || `t${i}`, name, length: num(o.length, 6, 1, 30), width: num(o.width, 3.75, 1, 10), spaces }
            : null;
        })
        .filter((t): t is Template => t !== null)
    : DEFAULT_TEMPLATES;

  return { rules, rates, specs, templates: templates.length ? templates : DEFAULT_TEMPLATES, updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : null };
}
