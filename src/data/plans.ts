/**
 * Floor-plan geometry, re-drawn from the conceptual layouts in the supplied
 * catalogue (SBT Porta Cabin Catalogue). All values are in metres, measured
 * from the source drawings at their printed scale.
 *
 * Coordinate system: x runs along the length (left → right), y runs across the
 * width from the rear wall (y = 0) to the front wall (y = width). The FRONT
 * arrow is drawn below the front wall, exactly as in the source plans.
 *
 * The source marks every layout "Conceptual layout — subject to final
 * engineering / design confirmation"; the drawings repeat that note.
 */

export type Pt = [number, number];
export type Seg = { a: Pt; b: Pt };
export type Rect = { x: number; y: number; w: number; h: number };

export type Door = {
  /** Hinge point (on the wall line). */
  hinge: Pt;
  /** Unit vector along the wall, from the hinge across the opening. */
  closed: Pt;
  /** Unit vector of the open leaf. */
  open: Pt;
  /** Leaf width in metres. */
  width: number;
};

export type Fixture =
  | { kind: "bed"; r: Rect; pillow: "left" | "right" }
  | { kind: "wardrobe"; r: Rect }
  | { kind: "desk"; r: Rect }
  | { kind: "chair"; c: Pt; size: number }
  | { kind: "stool"; c: Pt; radius: number }
  | { kind: "wc"; tank: Rect; bowl: Pt }
  | { kind: "basin"; r: Rect }
  | { kind: "counter"; r: Rect; sink?: Rect }
  | { kind: "cabinet"; r: Rect; split: "h" | "v" }
  | { kind: "rack"; r: Rect }
  | { kind: "table"; c: Pt; radius: number };

export type RoomLabel = {
  key: RoomKey;
  index?: number;
  /** Approximate area in m²; omitted for small cubicle labels. */
  area?: number;
  at: Pt;
  size?: "lg" | "sm";
};

export type RoomKey = "office" | "room" | "toilet" | "kitchen" | "pantry" | "guardRoom" | "storage" | "washArea" | "wc";

export type FloorPlanData = {
  id: string;
  length: number;
  width: number;
  /** Internal partition centre-lines. */
  partitions: Seg[];
  /** Wet areas (toilet / kitchen / pantry) shaded differently. */
  wet: Rect[];
  doors: Door[];
  windows: Seg[];
  fixtures: Fixture[];
  rooms: RoomLabel[];
  /** Segment lengths shown on the lower dimension string (optional). */
  segments?: number[];
  /** Extra drawing margin on the right (for doors opening outward on the end wall). */
  padRight?: number;
  /**
   * "source" = re-drawn from the supplied catalogue; "indicative" = prepared for
   * presentation from the client's written description (no source drawing).
   */
  origin?: "source" | "indicative";
};

const W = 3.75;
const FRONT_INNER = W - 0.14;

const bedsLeft = (x: number): Fixture[] => [
  { kind: "bed", r: { x, y: 0.15, w: 2.0, h: 0.9 }, pillow: "left" },
  { kind: "bed", r: { x, y: 2.7, w: 2.0, h: 0.9 }, pillow: "left" },
];
const bedsRight = (xEnd: number): Fixture[] => [
  { kind: "bed", r: { x: xEnd - 2.0, y: 0.15, w: 2.0, h: 0.9 }, pillow: "right" },
  { kind: "bed", r: { x: xEnd - 2.0, y: 2.7, w: 2.0, h: 0.9 }, pillow: "right" },
];
const desk = (x: number, w = 1.6): Fixture[] => [
  { kind: "desk", r: { x, y: 0.14, w, h: 0.66 } },
  { kind: "chair", c: [x + w / 2, 1.05], size: 0.44 },
];
const frontDoor = (hingeX: number, dir: 1 | -1, width = 0.88): Door => ({
  hinge: [hingeX, FRONT_INNER],
  closed: [dir, 0],
  open: [0, -1],
  width,
});

/** A1 / N1 — 12 × 3.75 m open-plan office. */
const office12: FloorPlanData = {
  id: "office-12",
  length: 12,
  width: W,
  partitions: [],
  wet: [],
  doors: [frontDoor(5.57, 1)],
  windows: [
    { a: [2.51, 0], b: [3.5, 0] },
    { a: [8.51, 0], b: [9.5, 0] },
    { a: [1.3, W], b: [2.29, W] },
    { a: [3.41, W], b: [4.4, W] },
    { a: [7.61, W], b: [8.6, W] },
    { a: [9.71, W], b: [10.7, W] },
  ],
  fixtures: [
    ...desk(0.6),
    ...desk(2.9),
    ...desk(7.5),
    ...desk(9.8),
    { kind: "cabinet", r: { x: 0.15, y: 2.25, w: 0.45, h: 1.2 }, split: "h" },
    { kind: "cabinet", r: { x: 11.4, y: 2.25, w: 0.45, h: 1.2 }, split: "h" },
  ],
  rooms: [{ key: "office", area: 45.0, at: [6.0, 1.9], size: "lg" }],
};

/** A2 / N2 — office with one internal toilet. */
const officeToilet12: FloorPlanData = {
  id: "office-toilet-12",
  length: 12,
  width: W,
  partitions: [
    { a: [10.21, 0.07], b: [10.21, 2.0] },
    { a: [10.21, 2.0], b: [11.93, 2.0] },
  ],
  wet: [{ x: 10.21, y: 0, w: 1.79, h: 2.0 }],
  doors: [
    frontDoor(5.57, 1),
    { hinge: [10.47, 2.0], closed: [1, 0], open: [0, -1], width: 0.7 },
  ],
  windows: [
    { a: [2.51, 0], b: [3.5, 0] },
    { a: [7.0, 0], b: [8.0, 0] },
    { a: [1.3, W], b: [2.29, W] },
    { a: [3.41, W], b: [4.4, W] },
    { a: [7.81, W], b: [8.8, W] },
    { a: [12, 0.55], b: [12, 1.14] },
  ],
  fixtures: [
    ...desk(0.6),
    ...desk(3.2),
    ...desk(6.4),
    { kind: "basin", r: { x: 10.36, y: 0.14, w: 0.5, h: 0.4 } },
    { kind: "wc", tank: { x: 11.36, y: 0.14, w: 0.4, h: 0.18 }, bowl: [11.56, 0.6] },
  ],
  rooms: [
    { key: "office", area: 41.4, at: [5.4, 2.04], size: "lg" },
    { key: "toilet", area: 3.6, at: [11.15, 1.45], size: "sm" },
  ],
};

/** A3 / N3 — 2 rooms + shared toilet + kitchen. */
const tworoomsToiletKitchen: FloorPlanData = {
  id: "2rooms-toilet-kitchen-12",
  length: 12,
  width: W,
  partitions: [
    { a: [4.5, 0.07], b: [4.5, 2.16] },
    { a: [4.5, 2.96], b: [4.5, 3.68] },
    { a: [7.5, 0.07], b: [7.5, 2.16] },
    { a: [7.5, 2.96], b: [7.5, 3.68] },
    { a: [4.5, 1.75], b: [6.65, 1.75] },
    { a: [7.35, 1.75], b: [7.5, 1.75] },
  ],
  wet: [{ x: 4.5, y: 0, w: 3.0, h: W }],
  doors: [
    frontDoor(5.57, 1),
    { hinge: [6.65, 1.75], closed: [1, 0], open: [0, -1], width: 0.7 },
    { hinge: [4.5, 2.96], closed: [0, -1], open: [-1, 0], width: 0.8 },
    { hinge: [7.5, 2.96], closed: [0, -1], open: [1, 0], width: 0.8 },
  ],
  windows: [
    { a: [1.76, 0], b: [2.75, 0] },
    { a: [5.11, 0], b: [5.69, 0] },
    { a: [9.27, 0], b: [10.25, 0] },
    { a: [1.76, W], b: [2.75, W] },
    { a: [6.72, W], b: [7.3, W] },
    { a: [9.27, W], b: [10.25, W] },
  ],
  fixtures: [
    ...bedsLeft(0.15),
    { kind: "wardrobe", r: { x: 3.75, y: 0.15, w: 0.6, h: 1.15 } },
    ...bedsRight(11.85),
    { kind: "wardrobe", r: { x: 7.66, y: 0.15, w: 0.6, h: 1.15 } },
    { kind: "basin", r: { x: 4.71, y: 0.14, w: 0.5, h: 0.4 } },
    { kind: "wc", tank: { x: 6.85, y: 0.14, w: 0.4, h: 0.18 }, bowl: [7.05, 0.6] },
    { kind: "counter", r: { x: 4.6, y: 1.8, w: 1.95, h: 0.6 }, sink: { x: 4.91, y: 1.9, w: 0.6, h: 0.4 } },
  ],
  rooms: [
    { key: "room", index: 1, area: 16.9, at: [2.61, 1.79], size: "lg" },
    { key: "toilet", area: 5.3, at: [5.65, 1.1], size: "sm" },
    { key: "kitchen", area: 6.0, at: [5.08, 2.9], size: "sm" },
    { key: "room", index: 2, area: 16.9, at: [9.4, 1.79], size: "lg" },
  ],
  segments: [4.5, 3.0, 4.5],
};

/** A4 / N4 — 2 rooms with attached toilets. */
const tworoomsAttached: FloorPlanData = {
  id: "2rooms-attached-12",
  length: 12,
  width: W,
  partitions: [
    { a: [6.0, 0.07], b: [6.0, 3.68] },
    { a: [4.19, 0.07], b: [4.19, 1.75] },
    { a: [7.81, 0.07], b: [7.81, 1.75] },
    { a: [4.19, 1.75], b: [4.45, 1.75] },
    { a: [5.15, 1.75], b: [6.85, 1.75] },
    { a: [7.55, 1.75], b: [7.81, 1.75] },
  ],
  wet: [{ x: 4.19, y: 0, w: 3.62, h: 1.75 }],
  doors: [
    { hinge: [4.45, 1.75], closed: [1, 0], open: [0, 1], width: 0.7 },
    { hinge: [7.55, 1.75], closed: [-1, 0], open: [0, 1], width: 0.7 },
    frontDoor(4.71, 1),
    frontDoor(7.3, -1),
  ],
  windows: [
    { a: [1.3, 0], b: [2.29, 0] },
    { a: [4.82, 0], b: [5.4, 0] },
    { a: [6.62, 0], b: [7.2, 0] },
    { a: [9.71, 0], b: [10.7, 0] },
    { a: [1.5, W], b: [2.49, W] },
    { a: [9.51, W], b: [10.5, W] },
  ],
  fixtures: [
    ...bedsLeft(0.15),
    { kind: "wardrobe", r: { x: 2.56, y: 0.15, w: 1.2, h: 0.6 } },
    ...bedsRight(11.85),
    { kind: "wardrobe", r: { x: 8.25, y: 0.15, w: 1.2, h: 0.6 } },
    { kind: "basin", r: { x: 4.35, y: 0.14, w: 0.5, h: 0.4 } },
    { kind: "wc", tank: { x: 5.25, y: 0.14, w: 0.4, h: 0.18 }, bowl: [5.45, 0.6] },
    { kind: "wc", tank: { x: 6.35, y: 0.14, w: 0.4, h: 0.18 }, bowl: [6.55, 0.6] },
    { kind: "basin", r: { x: 7.16, y: 0.14, w: 0.5, h: 0.4 } },
  ],
  rooms: [
    { key: "room", index: 1, area: 19.4, at: [2.9, 1.79], size: "lg" },
    { key: "toilet", area: 3.2, at: [5.1, 1.17], size: "sm" },
    { key: "toilet", area: 3.2, at: [6.9, 1.17], size: "sm" },
    { key: "room", index: 2, area: 19.4, at: [9.1, 1.79], size: "lg" },
  ],
  segments: [6.0, 6.0],
};

/** A5 / N5 — 2 equal rooms. */
const tworooms: FloorPlanData = {
  id: "2rooms-12",
  length: 12,
  width: W,
  partitions: [{ a: [6.0, 0.07], b: [6.0, 3.68] }],
  wet: [],
  doors: [frontDoor(4.51, 1), frontDoor(7.5, -1)],
  windows: [
    { a: [2.51, 0], b: [3.5, 0] },
    { a: [8.51, 0], b: [9.5, 0] },
    { a: [1.5, W], b: [2.49, W] },
    { a: [9.51, W], b: [10.5, W] },
  ],
  fixtures: [
    ...bedsLeft(0.15),
    { kind: "wardrobe", r: { x: 5.25, y: 0.15, w: 0.6, h: 1.2 } },
    ...bedsRight(11.85),
    { kind: "wardrobe", r: { x: 6.15, y: 0.15, w: 0.6, h: 1.2 } },
  ],
  rooms: [
    { key: "room", index: 1, area: 22.5, at: [3.0, 1.79], size: "lg" },
    { key: "room", index: 2, area: 22.5, at: [9.0, 1.79], size: "lg" },
  ],
  segments: [6.0, 6.0],
};

/** A6 / N6 — 3 equal rooms. */
const threerooms: FloorPlanData = {
  id: "3rooms-12",
  length: 12,
  width: W,
  partitions: [
    { a: [4.0, 0.07], b: [4.0, 3.68] },
    { a: [8.0, 0.07], b: [8.0, 3.68] },
  ],
  wet: [],
  doors: [frontDoor(3.59, -1), frontDoor(7.59, -1), frontDoor(11.6, -1)],
  windows: [
    { a: [1.5, 0], b: [2.49, 0] },
    { a: [5.51, 0], b: [6.5, 0] },
    { a: [9.51, 0], b: [10.5, 0] },
    { a: [0.71, W], b: [1.7, W] },
    { a: [4.71, W], b: [5.7, W] },
    { a: [8.71, W], b: [9.7, W] },
  ],
  fixtures: [
    ...bedsLeft(0.15),
    { kind: "wardrobe", r: { x: 3.31, y: 0.15, w: 0.6, h: 1.2 } },
    ...bedsLeft(4.15),
    { kind: "wardrobe", r: { x: 7.3, y: 0.15, w: 0.6, h: 1.2 } },
    ...bedsLeft(8.16),
    { kind: "wardrobe", r: { x: 11.26, y: 0.15, w: 0.6, h: 1.2 } },
  ],
  rooms: [
    { key: "room", index: 1, area: 15.0, at: [2.25, 1.79], size: "lg" },
    { key: "room", index: 2, area: 15.0, at: [6.26, 1.79], size: "lg" },
    { key: "room", index: 3, area: 15.0, at: [10.26, 1.79], size: "lg" },
  ],
  segments: [4.0, 4.0, 4.0],
};

/** A7 / N7 — 4.00 × 3.00 m guard house. */
const guard: FloorPlanData = {
  id: "guard-4x3",
  length: 4,
  width: 3,
  partitions: [],
  wet: [],
  doors: [{ hinge: [0.3, 2.86], closed: [1, 0], open: [0, -1], width: 0.88 }],
  windows: [
    { a: [1.26, 0], b: [2.74, 0] },
    { a: [0, 0.7], b: [0, 1.69] },
    { a: [4, 0.75], b: [4, 2.24] },
    { a: [2.11, 3], b: [3.6, 3] },
  ],
  fixtures: [
    { kind: "counter", r: { x: 1.6, y: 0.14, w: 2.25, h: 0.51 } },
    { kind: "stool", c: [2.7, 1.05], radius: 0.24 },
  ],
  rooms: [{ key: "guardRoom", area: 12.0, at: [2.3, 1.95], size: "lg" }],
};

/** A8 — 6.00 × 3.75 m office. */
const office6: FloorPlanData = {
  id: "office-6",
  length: 6,
  width: W,
  partitions: [],
  wet: [],
  doors: [frontDoor(0.62, 1, 0.85)],
  windows: [
    { a: [2.5, 0], b: [3.5, 0] },
    { a: [6, 1.38], b: [6, 2.36] },
    { a: [2.5, W], b: [3.5, W] },
    { a: [4.35, W], b: [5.35, W] },
  ],
  fixtures: [
    ...desk(0.49),
    ...desk(3.59),
    { kind: "cabinet", r: { x: 5.38, y: 2.5, w: 0.47, h: 1.0 }, split: "h" },
  ],
  rooms: [{ key: "office", area: 22.5, at: [3.09, 1.94], size: "lg" }],
};

/** A9 — 6.00 × 3.75 m office with pantry & toilet. */
const office6PantryToilet: FloorPlanData = {
  id: "office-pantry-toilet-6",
  length: 6,
  width: W,
  partitions: [
    { a: [4.0, 0.07], b: [4.0, 1.96] },
    { a: [4.0, 2.74], b: [4.0, 3.68] },
    { a: [4.0, 1.84], b: [5.15, 1.84] },
    { a: [5.83, 1.84], b: [5.93, 1.84] },
  ],
  wet: [{ x: 4.0, y: 0, w: 2.0, h: W }],
  doors: [
    frontDoor(0.62, 1, 0.85),
    { hinge: [4.0, 2.74], closed: [0, -1], open: [1, 0], width: 0.78 },
    { hinge: [5.15, 1.84], closed: [1, 0], open: [0, -1], width: 0.68 },
  ],
  windows: [
    { a: [1.5, 0], b: [2.5, 0] },
    { a: [6, 0.6], b: [6, 1.19] },
    { a: [2.25, W], b: [3.25, W] },
    { a: [4.95, W], b: [5.54, W] },
  ],
  fixtures: [
    ...desk(0.49),
    ...desk(2.25),
    { kind: "wc", tank: { x: 4.3, y: 0.14, w: 0.4, h: 0.18 }, bowl: [4.49, 0.6] },
    { kind: "basin", r: { x: 5.33, y: 0.14, w: 0.5, h: 0.4 } },
    { kind: "counter", r: { x: 4.8, y: 3.02, w: 1.05, h: 0.59 }, sink: { x: 5.12, y: 3.1, w: 0.42, h: 0.4 } },
  ],
  rooms: [
    { key: "office", area: 15.0, at: [2.0, 2.09], size: "lg" },
    { key: "toilet", area: 3.7, at: [4.75, 1.22], size: "sm" },
    { key: "pantry", area: 3.8, at: [5.42, 2.37], size: "sm" },
  ],
  segments: [4.0, 2.0],
};


/* ------------------------------------------------------------------ */
/* Containers and portable toilets                                     */
/* No drawings were supplied for these products. The layouts below are */
/* indicative, prepared from the client's written description (sizes,  */
/* number of toilets / wash basins). They are marked as such on site.   */
/* ------------------------------------------------------------------ */

const fd = (W: number, hingeX: number, dir: 1 | -1, width = 0.88): Door => ({
  hinge: [hingeX, W - 0.14],
  closed: [dir, 0],
  open: [0, -1],
  width,
});
const deskAt = (x: number, w = 1.6): Fixture[] => [
  { kind: "desk", r: { x, y: 0.14, w, h: 0.66 } },
  { kind: "chair", c: [x + w / 2, 1.05], size: 0.44 },
];

const W35 = 3.5;

/** AC1 — 12 × 3.5 m furnished container office (indicative). */
const containerOffice12: FloorPlanData = {
  id: "container-office-12",
  origin: "indicative",
  length: 12,
  width: W35,
  partitions: [],
  wet: [],
  doors: [fd(W35, 5.57, 1)],
  windows: [
    { a: [2.51, 0], b: [3.5, 0] },
    { a: [8.51, 0], b: [9.5, 0] },
    { a: [1.3, W35], b: [2.29, W35] },
    { a: [3.41, W35], b: [4.4, W35] },
    { a: [7.61, W35], b: [8.6, W35] },
    { a: [9.71, W35], b: [10.7, W35] },
  ],
  fixtures: [
    ...deskAt(0.6),
    ...deskAt(2.9),
    ...deskAt(7.5),
    ...deskAt(9.8),
    { kind: "table", c: [6.0, 1.35], radius: 0.45 },
    { kind: "chair", c: [5.25, 1.35], size: 0.4 },
    { kind: "chair", c: [6.75, 1.35], size: 0.4 },
    { kind: "cabinet", r: { x: 0.15, y: 2.05, w: 0.45, h: 1.2 }, split: "h" },
    { kind: "cabinet", r: { x: 11.4, y: 2.05, w: 0.45, h: 1.2 }, split: "h" },
  ],
  rooms: [{ key: "office", area: 42.0, at: [3.4, 2.35], size: "lg" }],
};

/** AC2 — 6 × 3.5 m furnished container office (indicative). */
const containerOffice6: FloorPlanData = {
  id: "container-office-6",
  origin: "indicative",
  length: 6,
  width: W35,
  partitions: [],
  wet: [],
  doors: [fd(W35, 0.62, 1, 0.85)],
  windows: [
    { a: [2.5, 0], b: [3.5, 0] },
    { a: [6, 1.2], b: [6, 2.2] },
    { a: [2.5, W35], b: [3.5, W35] },
    { a: [4.35, W35], b: [5.35, W35] },
  ],
  fixtures: [
    ...deskAt(0.49),
    ...deskAt(3.59),
    { kind: "cabinet", r: { x: 5.38, y: 2.25, w: 0.47, h: 1.0 }, split: "h" },
  ],
  rooms: [{ key: "office", area: 21.0, at: [3.0, 1.95], size: "lg" }],
};

const endDoors = (L: number, W: number): Door[] => [
  { hinge: [L, 0.3], closed: [0, 1], open: [1, 0], width: W / 2 - 0.3 },
  { hinge: [L, W - 0.3], closed: [0, -1], open: [1, 0], width: W / 2 - 0.3 },
];
const racks = (from: number, to: number, W: number): Fixture[] => {
  const out: Fixture[] = [];
  for (let x = from; x + 1.8 <= to + 0.01; x += 2.0) {
    out.push({ kind: "rack", r: { x, y: 0.16, w: 1.8, h: 0.6 } });
    out.push({ kind: "rack", r: { x, y: W - 0.76, w: 1.8, h: 0.6 } });
  }
  return out;
};

/** NC1 — 12 × 3.5 m storage container (indicative). */
const storage12: FloorPlanData = {
  id: "storage-12",
  origin: "indicative",
  length: 12,
  width: W35,
  partitions: [],
  wet: [],
  doors: endDoors(12, W35),
  windows: [],
  fixtures: racks(0.3, 10.2, W35),
  rooms: [{ key: "storage", area: 42.0, at: [5.6, 1.85], size: "lg" }],
  padRight: 1.75,
};

/** NC2 — 6 × 3.5 m storage container (indicative). */
const storage6: FloorPlanData = {
  id: "storage-6",
  origin: "indicative",
  length: 6,
  width: W35,
  partitions: [],
  wet: [],
  doors: endDoors(6, W35),
  windows: [],
  fixtures: racks(0.3, 4.2, W35),
  rooms: [{ key: "storage", area: 21.0, at: [2.6, 1.85], size: "lg" }],
  padRight: 1.75,
};

/** NT1 / AT1 — 1.5 × 1.5 m single portable toilet (indicative). */
const toiletSingle: FloorPlanData = {
  id: "toilet-single",
  origin: "indicative",
  length: 1.5,
  width: 1.5,
  partitions: [],
  wet: [{ x: 0, y: 0, w: 1.5, h: 1.5 }],
  doors: [{ hinge: [0.3, 1.36], closed: [1, 0], open: [0, -1], width: 0.7 }],
  windows: [{ a: [0.55, 0], b: [0.95, 0] }],
  fixtures: [
    { kind: "wc", tank: { x: 0.85, y: 0.14, w: 0.4, h: 0.18 }, bowl: [1.05, 0.58] },
    { kind: "basin", r: { x: 0.16, y: 0.16, w: 0.42, h: 0.36 } },
  ],
  rooms: [],
};

/** NT1 variant without a basin is not used; AT1 uses a WC-only layout. */
const toiletSingleWc: FloorPlanData = {
  ...toiletSingle,
  id: "toilet-single-wc",
  fixtures: [{ kind: "wc", tank: { x: 0.55, y: 0.14, w: 0.4, h: 0.18 }, bowl: [0.75, 0.58] }],
};

/** Row of WC cubicles along the rear wall, doors opening into the wash area. */
function cubicles(count: number, width: number, depth: number, startX: number, L: number) {
  const partitions: Seg[] = [];
  const doors: Door[] = [];
  const fixtures: Fixture[] = [];
  const windows: Seg[] = [];
  const rooms: RoomLabel[] = [];
  const doorW = Math.min(0.7, width - 0.3);
  for (let i = 0; i < count; i++) {
    const x0 = startX + i * width;
    const x1 = x0 + width;
    if (i > 0 || x0 > 0.2) partitions.push({ a: [x0, 0.07], b: [x0, depth] });
    const gapStart = x0 + 0.12;
    partitions.push({ a: [Math.max(x0, 0.07), depth], b: [gapStart, depth] });
    partitions.push({ a: [gapStart + doorW, depth], b: [Math.min(x1, L - 0.07), depth] });
    doors.push({ hinge: [gapStart, depth], closed: [1, 0], open: [0, 1], width: doorW });
    const cx = x0 + width / 2;
    fixtures.push({ kind: "wc", tank: { x: cx - 0.2, y: 0.14, w: 0.4, h: 0.18 }, bowl: [cx, 0.58] });
    windows.push({ a: [cx - 0.2, 0], b: [cx + 0.2, 0] });
    rooms.push({ key: "wc", at: [cx, depth - 0.22], size: "sm" });
  }
  return { partitions, doors, fixtures, windows, rooms };
}

function basinsAlongFront(count: number, from: number, to: number, W: number): Fixture[] {
  const slot = (to - from) / count;
  return Array.from({ length: count }, (_, i) => ({
    kind: "basin" as const,
    r: { x: from + i * slot + (slot - Math.min(0.55, slot - 0.1)) / 2, y: W - 0.54, w: Math.min(0.55, slot - 0.1), h: 0.4 },
  }));
}

/** NT2 / AT2 — 3 × 4 m: 2 WCs + 2 wash basins (indicative). */
const toilet4x3 = (() => {
  const L = 4;
  const W = 3;
  const c = cubicles(2, 1.2, 1.5, 1.6, L);
  return {
    id: "toilet-4x3",
    origin: "indicative",
    length: L,
    width: W,
    partitions: c.partitions,
    wet: [{ x: 0, y: 0, w: L, h: W }],
    doors: [...c.doors, fd(W, 0.35, 1)],
    windows: c.windows,
    fixtures: [...c.fixtures, ...basinsAlongFront(2, 2.2, 3.86, W)],
    rooms: [...c.rooms, { key: "washArea", at: [2.75, 2.05], size: "sm" }],
  } satisfies FloorPlanData;
})();

/** NT3 / AT3 — 6 × 4 m: 5 WCs + 6 wash basins (indicative). */
const toilet6x4 = (() => {
  const L = 6;
  const W = 4;
  const c = cubicles(5, 1.2, 1.55, 0, L);
  return {
    id: "toilet-6x4",
    origin: "indicative",
    length: L,
    width: W,
    partitions: c.partitions,
    wet: [{ x: 0, y: 0, w: L, h: W }],
    doors: [...c.doors, fd(W, 0.3, 1)],
    windows: c.windows,
    fixtures: [...c.fixtures, ...basinsAlongFront(6, 1.45, 5.86, W)],
    rooms: [...c.rooms, { key: "washArea", at: [3.4, 2.55], size: "sm" }],
    segments: [1.2, 1.2, 1.2, 1.2, 1.2],
  } satisfies FloorPlanData;
})();

/** NT4 / AT4 — 12 × 4 m: 12 WCs + 12 wash basins (indicative). */
const toilet12x4 = (() => {
  const L = 12;
  const W = 4;
  const c = cubicles(12, 1.0, 1.55, 0, L);
  return {
    id: "toilet-12x4",
    origin: "indicative",
    length: L,
    width: W,
    partitions: c.partitions,
    wet: [{ x: 0, y: 0, w: L, h: W }],
    doors: [
      ...c.doors,
      { hinge: [0, 1.95], closed: [0, 1], open: [1, 0], width: 0.9 },
      { hinge: [L, 1.95], closed: [0, 1], open: [-1, 0], width: 0.9 },
    ],
    windows: c.windows,
    fixtures: [...c.fixtures, ...basinsAlongFront(12, 0.9, 11.1, W)],
    rooms: [...c.rooms, { key: "washArea", at: [6.0, 2.55], size: "sm" }],
  } satisfies FloorPlanData;
})();

export const plans = {
  office12,
  officeToilet12,
  tworoomsToiletKitchen,
  tworoomsAttached,
  tworooms,
  threerooms,
  guard,
  office6,
  office6PantryToilet,
  containerOffice12,
  containerOffice6,
  storage12,
  storage6,
  toiletSingle,
  toiletSingleWc,
  toilet4x3,
  toilet6x4,
  toilet12x4,
} satisfies Record<string, FloorPlanData>;

export type PlanId = keyof typeof plans;
