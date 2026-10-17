import { EXTRA_IDS, SPACE_KINDS, type Category, type DesignerSettings, type ExtraId, type RoomUse, type SpaceKind, type Template } from "./config";

/** A customer's cabin design. Pure data — geometry and prices are derived from it. */
export type Space = { id: string; kind: SpaceKind; use?: RoomUse; furnished?: boolean };

export type Design = {
  v: 1;
  category: Category;
  length: number;
  width: number;
  height: number;
  /** Spaces from left to right along the cabin length. */
  spaces: Space[];
  windowsPerRoom: 1 | 2;
  extras: Partial<Record<ExtraId, number>>;
  /** Number of identical cabins. */
  quantity: number;
};

let counter = 0;
export const newId = () => `s${Date.now().toString(36)}${(counter++).toString(36)}`;

export function defaultDesign(settings: DesignerSettings): Design {
  return fromTemplate(settings.templates[0] ?? { id: "x", name: { en: "", ar: "" }, length: 6, width: 3.75, spaces: [{ kind: "room" }] }, "normal", settings);
}

export function fromTemplate(t: Template, category: Category, settings: DesignerSettings): Design {
  return {
    v: 1,
    category,
    length: t.length,
    width: t.width,
    height: settings.rules.standardHeight,
    spaces: t.spaces.map((s) => ({ id: newId(), kind: s.kind, use: s.kind === "room" ? (s.use ?? "bedroom") : undefined, furnished: true })),
    windowsPerRoom: 1,
    extras: {},
    quantity: 1,
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ */
/* Mutations (all return a new design)                                 */
/* ------------------------------------------------------------------ */

export function setSize(d: Design, s: { length?: number; width?: number; height?: number }): Design {
  return {
    ...d,
    length: s.length !== undefined ? round2(s.length) : d.length,
    width: s.width !== undefined ? round2(s.width) : d.width,
    height: s.height !== undefined ? round2(s.height) : d.height,
  };
}

/** Adds a space next to its natural neighbours (wet units join the existing wet group). */
export function addSpace(d: Design, kind: SpaceKind, use?: RoomUse): Design {
  const space: Space = { id: newId(), kind, use: kind === "room" ? (use ?? "bedroom") : undefined, furnished: true };
  const spaces = [...d.spaces];
  if (kind === "room") {
    spaces.push(space);
  } else if (kind === "toilet" || kind === "bathroom" || kind === "toiletBath") {
    // Insert after the last wet unit, or after the first room.
    let at = -1;
    spaces.forEach((s, i) => {
      if (s.kind === "toilet" || s.kind === "bathroom" || s.kind === "toiletBath") at = i;
    });
    if (at === -1) at = spaces.findIndex((s) => s.kind === "room");
    spaces.splice(at + 1, 0, space);
  } else {
    spaces.push(space);
  }
  return { ...d, spaces };
}

/** Removes the last space of a kind (or a given id). */
export function removeSpace(d: Design, kindOrId: SpaceKind | { id: string }): Design {
  const spaces = [...d.spaces];
  const idx =
    typeof kindOrId === "object"
      ? spaces.findIndex((s) => s.id === kindOrId.id)
      : spaces.map((s) => s.kind).lastIndexOf(kindOrId);
  if (idx >= 0) spaces.splice(idx, 1);
  return { ...d, spaces };
}

/** Sets how many spaces of a kind the design has. */
export function setCount(d: Design, kind: SpaceKind, n: number, use?: RoomUse): Design {
  let out = d;
  const count = () => out.spaces.filter((s) => s.kind === kind).length;
  let guard = 0;
  while (count() < n && guard++ < 20) out = addSpace(out, kind, use);
  while (count() > n && guard++ < 40) out = removeSpace(out, kind);
  if (use && kind === "room") out = { ...out, spaces: out.spaces.map((s) => (s.kind === "room" ? { ...s, use } : s)) };
  return out;
}

export function moveSpace(d: Design, id: string, dir: -1 | 1): Design {
  const spaces = [...d.spaces];
  const i = spaces.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= spaces.length) return d;
  [spaces[i], spaces[j]] = [spaces[j], spaces[i]];
  return { ...d, spaces };
}

export function updateSpace(d: Design, id: string, patch: Partial<Omit<Space, "id" | "kind">>): Design {
  return { ...d, spaces: d.spaces.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
}

export function setExtra(d: Design, id: ExtraId, qty: number): Design {
  const extras = { ...d.extras };
  const q = Math.max(0, Math.min(99, Math.floor(qty)));
  if (q) extras[id] = q;
  else delete extras[id];
  return { ...d, extras };
}

export const counts = (d: Design) => {
  const c: Record<SpaceKind, number> = { room: 0, toilet: 0, bathroom: 0, toiletBath: 0, kitchenette: 0, storage: 0 };
  for (const s of d.spaces) c[s.kind] += 1;
  return c;
};

/* ------------------------------------------------------------------ */
/* Validation of untrusted designs (URL, API, database)                */
/* ------------------------------------------------------------------ */

export function sanitizeDesign(raw: unknown, settings: DesignerSettings): Design | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const R = settings.rules;
  const n = (v: unknown, min: number, max: number, d: number) => {
    const x = Number(v);
    return Number.isFinite(x) ? Math.min(max, Math.max(min, round2(x))) : d;
  };
  const spaces: Space[] = (Array.isArray(o.spaces) ? o.spaces : [])
    .slice(0, R.maxSpaces)
    .map((s) => s as Record<string, unknown>)
    .filter((s) => SPACE_KINDS.includes(s?.kind as SpaceKind))
    .map((s) => ({
      id: typeof s.id === "string" && /^[a-z0-9]{1,24}$/i.test(s.id) ? s.id : newId(),
      kind: s.kind as SpaceKind,
      use: s.kind === "room" ? ((["bedroom", "office", "living"] as const).find((u) => u === s.use) ?? "bedroom") : undefined,
      furnished: s.furnished !== false,
    }));
  const ex = (o.extras ?? {}) as Record<string, unknown>;
  const extras: Partial<Record<ExtraId, number>> = {};
  for (const id of EXTRA_IDS) {
    const q = Math.floor(Number(ex[id]));
    if (q > 0) extras[id] = Math.min(99, q);
  }
  return {
    v: 1,
    category: o.category === "aramco" ? "aramco" : "normal",
    length: n(o.length, R.minLength, R.maxLength, R.minLength),
    width: n(o.width, R.minWidth, R.maxWidth, R.minWidth),
    height: n(o.height, R.minHeight, R.maxHeight, R.standardHeight),
    spaces,
    windowsPerRoom: o.windowsPerRoom === 2 ? 2 : 1,
    extras,
    quantity: Math.min(500, Math.max(1, Math.floor(Number(o.quantity) || 1))),
  };
}

/* URL-safe encoding (base64url JSON) for sharing a design or a quotation. */
export function encodeData(v: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(v));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeData(s: string): unknown {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  } catch {
    return null;
  }
}
