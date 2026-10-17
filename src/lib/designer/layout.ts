import type { Door, Fixture, FloorPlanData, RoomKey, RoomLabel, Seg } from "@/data/plans";
import { isWet, type Rules, type WetKind } from "./config";
import type { Design, Space } from "./design";

/**
 * Deterministic layout engine. Turns a design into measurable floor-plan
 * geometry (metres) using the layout rules — no AI and no image generation.
 *
 * Coordinates follow src/data/plans.ts: x along the length (left → right),
 * y across the width from the rear wall (0) to the front wall (W).
 * Spaces are laid out side by side along the length. Consecutive toilets /
 * bathrooms form a wet bay: units against the rear wall with a shared lobby
 * in front that has its own door to the outside and a door to the next room.
 */

export type Issue = { level: "error" | "warning"; key: string; params?: Record<string, string | number> };

export type Bay = {
  x0: number;
  x1: number;
  kind: "dry" | "wet";
  spaces: Space[];
  /** Wet bays: depth of the units from the rear wall. */
  depth?: number;
};

export type Layout = { plan: FloorPlanData | null; bays: Bay[]; issues: Issue[] };

const WALL = 0.14;
const r2 = (n: number) => Math.round(n * 100) / 100;

function minLength(s: Space, R: Rules): number {
  if (s.kind === "room") return s.use === "bedroom" && s.furnished !== false ? R.minBedroom : R.minRoom;
  if (s.kind === "kitchenette") return R.minKitchenette;
  if (s.kind === "storage") return R.minStorage;
  return R[s.kind as WetKind].length;
}

/** Vertical wall at x from y=0 to y=W, with openings (y-ranges) left out. */
function wall(x: number, W: number, gaps: [number, number][]): Seg[] {
  const out: Seg[] = [];
  let y = 0;
  for (const [g0, g1] of [...gaps].sort((a, b) => a[0] - b[0])) {
    if (g0 > y) out.push({ a: [x, y], b: [x, g0] });
    y = Math.max(y, g1);
  }
  if (y < W) out.push({ a: [x, y], b: [x, W] });
  return out;
}

export function layoutDesign(d: Design, R: Rules): Layout {
  const L = d.length;
  const W = d.width;
  const issues: Issue[] = [];

  if (L < R.minLength || L > R.maxLength) issues.push({ level: "error", key: "lengthRange", params: { min: R.minLength, max: R.maxLength } });
  if (W < R.minWidth || W > R.maxWidth) issues.push({ level: "error", key: "widthRange", params: { min: R.minWidth, max: R.maxWidth } });
  if (d.height < R.minHeight || d.height > R.maxHeight) issues.push({ level: "error", key: "heightRange", params: { min: R.minHeight, max: R.maxHeight } });
  if (!d.spaces.length) issues.push({ level: "error", key: "noSpaces" });
  if (d.spaces.length > R.maxSpaces) issues.push({ level: "error", key: "tooManySpaces", params: { max: R.maxSpaces } });
  if (issues.some((i) => i.level === "error")) return { plan: null, bays: [], issues };

  /* 1. Group spaces into bays */
  const groups: { kind: "dry" | "wet"; spaces: Space[] }[] = [];
  for (const s of d.spaces) {
    const last = groups[groups.length - 1];
    if (isWet(s.kind) && last?.kind === "wet") last.spaces.push(s);
    else groups.push({ kind: isWet(s.kind) ? "wet" : "dry", spaces: [s] });
  }

  /* 2. Wet unit depth must leave room for the lobby */
  const depthAvail = r2(W - R.minLobby);
  for (const g of groups.filter((x) => x.kind === "wet")) {
    for (const s of g.spaces) {
      const need = R[s.kind as WetKind].depth;
      if (depthAvail < Math.min(need, 1.2)) {
        issues.push({ level: "error", key: "tooNarrowForWet", params: { width: W } });
        return { plan: null, bays: [], issues };
      }
    }
  }

  /* 3. Lengths: wet bays, kitchenettes and stores are fixed when there are rooms; rooms share the rest */
  const rooms = groups.filter((g) => g.kind === "dry" && g.spaces[0].kind === "room");
  const lengths = groups.map((g) => (g.kind === "wet" ? r2(g.spaces.reduce((a, s) => a + R[s.kind as WetKind].length, 0)) : 0));
  const flexible = groups.map((g) => {
    if (g.kind === "wet") return false;
    if (rooms.length) return g.spaces[0].kind === "room";
    return true; // no rooms: kitchenettes / stores share the length
  });
  groups.forEach((g, i) => {
    if (!flexible[i] && g.kind === "dry") lengths[i] = minLength(g.spaces[0], R);
  });
  const fixed = lengths.reduce((a, b) => a + b, 0);
  const flexIdx = flexible.flatMap((f, i) => (f ? [i] : []));
  const remaining = L - fixed;
  const needFlex = flexIdx.reduce((a, i) => a + minLength(groups[i].spaces[0], R), 0);

  if (remaining < needFlex - 1e-6) {
    issues.push({ level: "error", key: "doesNotFit", params: { need: r2(fixed + needFlex), have: L } });
    return { plan: null, bays: [], issues };
  }
  if (flexIdx.length) {
    const each = remaining / flexIdx.length;
    for (const i of flexIdx) lengths[i] = r2(each);
  } else if (remaining > 1e-6) {
    // Only wet bays: the last one absorbs the spare length as a larger lobby.
    lengths[lengths.length - 1] = r2(lengths[lengths.length - 1] + remaining);
  }
  // Make the lengths add up exactly to L after rounding.
  const drift = r2(L - lengths.reduce((a, b) => a + b, 0));
  lengths[flexIdx.length ? flexIdx[flexIdx.length - 1] : lengths.length - 1] = r2(lengths[flexIdx.length ? flexIdx[flexIdx.length - 1] : lengths.length - 1] + drift);

  /* 4. Geometry */
  const bays: Bay[] = [];
  let x = 0;
  groups.forEach((g, i) => {
    const bay: Bay = { x0: r2(x), x1: r2(x + lengths[i]), kind: g.kind, spaces: g.spaces };
    if (g.kind === "wet") bay.depth = r2(Math.min(depthAvail, Math.max(...g.spaces.map((s) => R[s.kind as WetKind].depth))));
    bays.push(bay);
    x += lengths[i];
  });

  const partitions: Seg[] = [];
  const wet: FloorPlanData["wet"] = [];
  const doors: Door[] = [];
  const windows: Seg[] = [];
  const fixtures: Fixture[] = [];
  const labels: RoomLabel[] = [];
  const gapsAt = new Map<number, [number, number][]>(); // openings in the wall at x
  const addGap = (wx: number, g: [number, number]) => gapsAt.set(wx, [...(gapsAt.get(wx) ?? []), g]);
  const counter: Partial<Record<RoomKey, number>> = {};
  const totals: Partial<Record<RoomKey, number>> = {};
  const keyOf = (s: Space): RoomKey =>
    s.kind === "room" ? (s.use === "office" ? "office" : s.use === "living" ? "room" : "bedroom") : s.kind === "kitchenette" ? "kitchenette" : (s.kind as RoomKey);
  for (const s of d.spaces) totals[keyOf(s)] = (totals[keyOf(s)] ?? 0) + 1;
  const label = (s: Space, at: [number, number], area?: number, size: "lg" | "sm" = "lg", len = 99) => {
    if (len < 2.6) size = "sm";
    const key = keyOf(s);
    counter[key] = (counter[key] ?? 0) + 1;
    labels.push({ key, index: (totals[key] ?? 0) > 1 ? counter[key] : undefined, area, at, size });
  };
  const frontDoor = (hx: number, width: number): Door => ({ hinge: [r2(hx), W - WALL], closed: [1, 0], open: [0, -1], width: r2(width) });
  const isRoomBay = (b?: Bay) => b?.kind === "dry" && b.spaces[0].kind === "room";

  bays.forEach((b, i) => {
    const len = r2(b.x1 - b.x0);
    const cx = (b.x0 + b.x1) / 2;
    if (i > 0) gapsAt.set(b.x0, gapsAt.get(b.x0) ?? []);

    if (b.kind === "wet") {
      const depth = b.depth!;
      // Units against the rear wall
      let ux = b.x0;
      b.spaces.forEach((s, k) => {
        const ul = R[s.kind as WetKind].length;
        const ux1 = ux + ul;
        const dw = Math.min(R.wetDoorWidth, ul - 0.3);
        const dx = ux + (ul - dw) / 2;
        // Front wall of the unit with the door opening
        partitions.push({ a: [r2(ux), depth], b: [r2(dx), depth] }, { a: [r2(dx + dw), depth], b: [r2(ux1), depth] });
        if (k > 0) partitions.push({ a: [r2(ux), 0], b: [r2(ux), depth] });
        doors.push({ hinge: [r2(dx), depth], closed: [1, 0], open: [0, 1], width: r2(dw) });
        wet.push({ x: r2(ux), y: 0, w: r2(ul), h: depth });
        windows.push({ a: [r2(ux + ul / 2 - 0.2), 0], b: [r2(ux + ul / 2 + 0.2), 0] });
        const ucx = ux + ul / 2;
        if (s.kind === "toilet") {
          fixtures.push({ kind: "wc", tank: { x: r2(ucx - 0.2), y: 0.17, w: 0.4, h: 0.18 }, bowl: [r2(ucx), 0.6] });
          if (depth >= 1.4) fixtures.push({ kind: "basin", r: { x: r2(ux + 0.08), y: r2(depth - 0.42), w: 0.38, h: 0.32 } });
        } else if (s.kind === "bathroom") {
          fixtures.push({ kind: "shower", r: { x: r2(ux + 0.1), y: 0.17, w: Math.min(0.9, r2(ul - 0.2)), h: 0.9 } });
          fixtures.push({ kind: "basin", r: { x: r2(ux1 - 0.48), y: r2(depth - 0.42), w: 0.38, h: 0.32 } });
        } else {
          fixtures.push({ kind: "shower", r: { x: r2(ux + 0.1), y: 0.17, w: 0.85, h: 0.85 } });
          fixtures.push({ kind: "wc", tank: { x: r2(ux1 - 0.6), y: 0.17, w: 0.4, h: 0.18 }, bowl: [r2(ux1 - 0.4), 0.6] });
          fixtures.push({ kind: "basin", r: { x: r2(ux1 - 0.5), y: r2(depth - 0.42), w: 0.38, h: 0.32 } });
        }
        label(s, [r2(ucx), r2(Math.min(depth - 0.15, depth / 2 + 0.55))], undefined, "sm");
        ux = ux1;
      });
      // Close the side of the last unit when the bay is longer than its units
      if (ux < b.x1 - 0.05) partitions.push({ a: [r2(ux), 0], b: [r2(ux), depth] });
      // Lobby: exterior door + door to the neighbouring room
      const lobbyDepth = W - depth;
      const ldw = Math.min(R.doorWidth, len - 0.3);
      doors.push(frontDoor(cx - ldw / 2, ldw));
      const iw = r2(Math.min(0.8, lobbyDepth - 0.3));
      const yh = r2(depth + 0.15);
      if (iw >= 0.6) {
        if (isRoomBay(bays[i - 1])) {
          doors.push({ hinge: [b.x0, yh], closed: [0, 1], open: [-1, 0], width: iw });
          addGap(b.x0, [yh, yh + iw]);
        } else if (isRoomBay(bays[i + 1])) {
          doors.push({ hinge: [b.x1, yh], closed: [0, 1], open: [1, 0], width: iw });
          addGap(b.x1, [yh, yh + iw]);
        }
      }
      if (lobbyDepth >= 1.2 && len >= 1.2) {
        labels.push({ key: "lobby", at: [r2(cx), r2(depth + lobbyDepth * 0.45)], size: "sm" });
      }
      return;
    }

    const s = b.spaces[0];
    const area = r2(len * W);
    if (s.kind === "kitchenette") {
      wet.push({ x: b.x0, y: 0, w: len, h: W });
      fixtures.push({ kind: "counter", r: { x: r2(b.x0 + 0.1), y: 0.17, w: r2(len - 0.2), h: 0.6 }, sink: { x: r2(b.x0 + 0.3), y: 0.25, w: 0.5, h: 0.42 } });
      windows.push({ a: [r2(cx - 0.4), 0], b: [r2(cx + 0.4), 0] });
      const nb = isRoomBay(bays[i - 1]) ? b.x0 : isRoomBay(bays[i + 1]) ? b.x1 : null;
      if (nb !== null) addGap(nb, [r2(W * 0.4), r2(Math.min(W * 0.4 + 1.0, W - 0.3))]);
      else doors.push(frontDoor(b.x0 + 0.3, Math.min(R.doorWidth, len - 0.5)));
      label(s, [r2(cx), r2(W * 0.62)], area, "lg", len);
      return;
    }
    if (s.kind === "storage") {
      fixtures.push({ kind: "rack", r: { x: r2(b.x0 + 0.15), y: 0.17, w: r2(len - 0.3), h: 0.5 } });
      doors.push(frontDoor(b.x0 + 0.3, Math.min(R.doorWidth, len - 0.5)));
      label(s, [r2(cx), r2(W * 0.55)], area, "lg", len);
      return;
    }
    // Room
    doors.push(frontDoor(b.x0 + 0.3, Math.min(R.doorWidth, len - 0.5)));
    const n = d.windowsPerRoom;
    const ww = r2(Math.max(0.5, Math.min(R.windowWidth, (len - 0.4) / n - 0.25)));
    for (let k = 0; k < n; k++) {
      const wc = b.x0 + (len * (k + 0.5)) / n;
      windows.push({ a: [r2(wc - ww / 2), 0], b: [r2(wc + ww / 2), 0] });
    }
    if (s.furnished !== false) {
      if (s.use === "bedroom" && len >= 2.2) {
        fixtures.push({ kind: "bed", r: { x: r2(b.x0 + 0.2), y: 0.2, w: r2(Math.min(2.0, len - 0.4)), h: 0.9 }, pillow: "left" });
        if (len >= 2.7 && W >= 2.8) fixtures.push({ kind: "wardrobe", r: { x: r2(b.x1 - 1.2), y: r2(W - WALL - 0.65), w: 1.0, h: 0.6 } });
      } else if (s.use === "office" && len >= 1.8) {
        fixtures.push({ kind: "desk", r: { x: r2(cx - 0.7), y: 0.2, w: 1.4, h: 0.7 } });
        fixtures.push({ kind: "chair", c: [r2(cx), 1.15], size: 0.44 });
      } else if (s.use === "living") {
        fixtures.push({ kind: "table", c: [r2(cx), r2(W / 2)], radius: 0.4 });
      }
    }
    label(s, [r2(cx), r2(W * (s.use === "living" ? 0.3 : 0.6))], area, "lg", len);
  });

  // Walls between bays (with door / kitchenette openings)
  for (const [wx, gaps] of gapsAt) {
    if (wx <= 0.01 || wx >= L - 0.01) continue;
    partitions.push(...wall(wx, W, gaps));
  }

  return {
    plan: {
      id: "custom-design",
      length: L,
      width: W,
      partitions,
      wet,
      doors,
      windows,
      fixtures,
      rooms: labels,
      segments: bays.map((b) => r2(b.x1 - b.x0)),
      origin: "indicative",
    },
    bays,
    issues,
  };
}
