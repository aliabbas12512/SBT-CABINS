import type { Localized, LocalizedList } from "@/i18n/config";
import type { PlanId } from "./plans";
import type { IllustrationKind } from "@/components/drawings/ProductIllustration";

/**
 * SBT CABINS product catalogue.
 *
 * Source documents (supplied by the client):
 *  - "SBT Porta Cabin Catalogue" (45 pages) — models A1–A9 and N1–N7, prices,
 *    dimensions, configurations, specifications and floor-plan layouts.
 *  - "Portable Accommodation Cabin — Technical Specification" (17 pages) — the
 *    12.00 × 3.60 m sleeper unit in 2-Men / 4-Men / 8-Men configurations.
 *
 *  - Client price list for containers and portable toilets (written message,
 *    15 Oct 2026) — models AC1–AC2, NC1–NC2, AT1–AT4, NT1–NT4.
 *
 * Rules: prices, dimensions and specifications are copied from those
 * sources only. A missing value is `null` and is shown as "Request a Quote" /
 * "On request".
 */

export type CategoryId = "aramco-standard" | "normal-standard";

export type IncludedItem =
  | "steelStructure"
  | "insulation"
  | "lightingPoints"
  | "lightingPoint"
  | "powerPoints"
  | "acPoint"
  | "acPoints"
  | "windows"
  | "observationWindows"
  | "entranceDoor"
  | "doors"
  | "entranceDoors2"
  | "entranceDoors3"
  | "floorFinish"
  | "fireAlarm"
  | "toiletBasin"
  | "toiletKitchen"
  | "attachedToilets2"
  | "pantryToilet"
  | "furniturePackage"
  | "fireRatedBuild"
  | "waterTank"
  | "septicTank"
  | "washBasin"
  | "washBasins"
  | "commode"
  | "commodes"
  | "storageSpace";

export type Feature =
  | "office"
  | "accommodation"
  | "guard"
  | "toilet"
  | "kitchen"
  | "pantry"
  | "multiRoom"
  | "fireAlarm"
  | "container"
  | "storage"
  | "furnished"
  | "fireRated"
  | "portableToilet";

export type Family = "cabin" | "accommodation" | "container" | "toilet";

export type SizeKey = "12x3.75" | "6x3.75" | "4x3" | "12x3.60" | "12x3.5" | "6x3.5" | "1.5x1.5" | "6x4" | "12x4";

export type GalleryImage = {
  src: string;
  width: number;
  height: number;
  alt: Localized;
  caption: Localized;
};

export type SpecRow = { label: Localized; value: Localized };

export type Product = {
  slug: string;
  /** Model code exactly as printed in the source (e.g. "A1"). */
  code: string;
  /** Model designation as shown in the catalogue header (e.g. "SBT MODEL A1"). */
  modelLabel: string;
  category: CategoryId;
  family: Family;
  name: Localized;
  /** Size label as printed in the catalogue. */
  sizeLabel: string;
  size: SizeKey;
  /** `height: null` = not stated in the source (shown as "On request"). */
  dimensions: { length: number; width: number; height: number | null; heightNote?: Localized };
  /** Nominal external footprint, m² (length × width). */
  footprint: number;
  price: { amount: number; currency: "SAR"; basis: "perUnit" } | null;
  summary: Localized;
  configuration: LocalizedList;
  construction: LocalizedList;
  included: IncludedItem[];
  features: Feature[];
  rooms: number;
  plan: PlanId | null;
  gallery: GalleryImage[];
  /** Generated illustration used when no photograph was supplied. */
  illustration?: { kind: IllustrationKind; endDoor?: boolean; tankRadius?: number };
  /** Product-specific specification (replaces the category base specification). */
  specRows?: SpecRow[];
  /** Water / septic tank capacities in litres, where stated (toilets). */
  tanks?: { water?: number; septic?: number };
  /** Source page reference for audit. */
  source: string;
};

/* ------------------------------------------------------------------ */
/* Shared images                                                       */
/* ------------------------------------------------------------------ */

const photo = (
  src: string,
  width: number,
  height: number,
  kind: "actual" | "elevation",
  subject: Localized,
): GalleryImage => ({
  src,
  width,
  height,
  alt: subject,
  caption:
    kind === "actual"
      ? { en: "Actual unit photograph (as supplied in the catalogue)", ar: "صورة فعلية للوحدة (كما وردت في الكتالوج)" }
      : {
          en: "Front elevation — door arrangement for this layout (composited from the same unit photograph, as stated in the catalogue)",
          ar: "الواجهة الأمامية — ترتيب الأبواب لهذا التصميم (مُركّبة من صورة الوحدة نفسها كما ورد في الكتالوج)",
        },
});

const ext = {
  single: (s: Localized) => photo("/images/exterior/cabin-12m-single-door.webp", 1600, 1000, "actual", s),
  two: (s: Localized) => photo("/images/exterior/cabin-12m-two-doors.webp", 1600, 1000, "elevation", s),
  three: (s: Localized) => photo("/images/exterior/cabin-12m-three-doors.webp", 1600, 1000, "elevation", s),
  guard: (s: Localized) => photo("/images/exterior/guard-house-4x3.webp", 820, 875, "actual", s),
  six: (s: Localized) => photo("/images/exterior/cabin-6m-office.webp", 1400, 876, "actual", s),
};

/**
 * Interior photographs. The catalogue states these show the
 * Normal-standard internal finish, so they are used for N-models only.
 */
const normalInteriors: GalleryImage[] = [
  {
    src: "/images/interior/wash-area.webp",
    width: 1200,
    height: 900,
    alt: { en: "Normal-standard interior: wash area with PVC wall panelling", ar: "تشطيب داخلي (القياسي العادي): منطقة الغسيل مع ألواح جدران PVC" },
    caption: {
      en: "Normal-standard internal finish — wall panelling, door, vanity unit and floor finish",
      ar: "التشطيب الداخلي القياسي العادي — ألواح الجدران والباب ووحدة المغسلة وتشطيب الأرضية",
    },
  },
  {
    src: "/images/interior/internal-door.webp",
    width: 734,
    height: 979,
    alt: { en: "White internal door and panel joint", ar: "باب داخلي أبيض ووصلة الألواح" },
    caption: { en: "Internal door and panel joint (Normal standard)", ar: "الباب الداخلي ووصلة الألواح (القياسي العادي)" },
  },
  {
    src: "/images/interior/vanity-unit.webp",
    width: 900,
    height: 900,
    alt: { en: "Vanity unit with counter top and mixer", ar: "وحدة مغسلة مع سطح وخلاط" },
    caption: { en: "Vanity unit with counter top and mixer (Normal standard)", ar: "وحدة مغسلة مع سطح وخلاط (القياسي العادي)" },
  },
  {
    src: "/images/interior/floor-skirting.webp",
    width: 968,
    height: 338,
    alt: { en: "Wood-effect floor finish and skirting", ar: "تشطيب أرضية بمظهر خشبي ووزرة" },
    caption: { en: "Floor finish and skirting detail (Normal standard)", ar: "تفصيل تشطيب الأرضية والوزرة (القياسي العادي)" },
  },
];

/* ------------------------------------------------------------------ */
/* Shared text                                                         */
/* ------------------------------------------------------------------ */

const aramcoConstruction: LocalizedList = {
  en: ["Gypsum board internal walls", "Cement board floor base", "2 mm vinyl sheet floor finish"],
  ar: ["جدران داخلية من ألواح الجبس", "قاعدة أرضية من الألواح الأسمنتية", "تشطيب أرضية بفينيل بسماكة 2 مم"],
};

const normalConstruction: LocalizedList = {
  en: ["PVC panel internal finish", "Hard plywood floor", "Standard finishing items"],
  ar: ["تشطيب داخلي بألواح PVC", "أرضية من الخشب الرقائقي الصلب", "بنود تشطيب قياسية"],
};

const cfg = {
  office12: {
    en: ["Single open-plan office space", "Main entrance door with steel step platform", "Windows to front and rear elevations"],
    ar: ["مساحة مكتبية مفتوحة واحدة", "باب دخول رئيسي مع منصة درج فولاذية", "نوافذ في الواجهتين الأمامية والخلفية"],
  },
  officeToilet: {
    en: ["Open-plan office area", "One internal toilet with wash basin", "Toilet ventilation and water/drain connection points"],
    ar: ["مساحة مكتبية مفتوحة", "دورة مياه داخلية واحدة مع مغسلة", "تهوية لدورة المياه ونقاط توصيل المياه والصرف"],
  },
  roomsToiletKitchen: {
    en: ["Two accommodation rooms", "One shared toilet with wash basin", "One kitchen with counter and sink"],
    ar: ["غرفتا سكن", "دورة مياه مشتركة واحدة مع مغسلة", "مطبخ واحد مع سطح عمل وحوض"],
  },
  roomsAttached: {
    en: ["Two independent rooms, each with its own entrance", "Attached toilet with wash basin in each room", "Separate ventilation to each toilet"],
    ar: ["غرفتان مستقلتان لكل منهما مدخل خاص", "دورة مياه ملحقة مع مغسلة في كل غرفة", "تهوية مستقلة لكل دورة مياه"],
  },
  tworooms: {
    en: ["Two equal rooms with independent entrance doors", "Full-height internal partition", "Windows to front and rear of each room"],
    ar: ["غرفتان متساويتان بأبواب دخول مستقلة", "قاطع داخلي بكامل الارتفاع", "نوافذ في الواجهتين الأمامية والخلفية لكل غرفة"],
  },
  threerooms: {
    en: ["Three equal rooms with independent entrance doors", "Two full-height internal partitions", "Window to front and rear of each room"],
    ar: ["ثلاث غرف متساوية بأبواب دخول مستقلة", "قاطعان داخليان بكامل الارتفاع", "نافذة في الواجهتين الأمامية والخلفية لكل غرفة"],
  },
  guard: {
    en: ["Single compact guard room", "Wide observation window to front and side", "Counter-height work surface"],
    ar: ["غرفة حراسة واحدة مدمجة", "نافذة مراقبة عريضة في الواجهة الأمامية والجانبية", "سطح عمل بارتفاع الكاونتر"],
  },
  office6: {
    en: ["Single office space", "Entrance door with steel step platform", "Windows to front, rear and side"],
    ar: ["مساحة مكتبية واحدة", "باب دخول مع منصة درج فولاذية", "نوافذ في الواجهات الأمامية والخلفية والجانبية"],
  },
  office6PantryToilet: {
    en: ["Office area", "Pantry with counter and sink", "Toilet with wash basin and ventilation"],
    ar: ["مساحة مكتبية", "بانتري (مطبخ صغير) مع سطح عمل وحوض", "دورة مياه مع مغسلة وتهوية"],
  },
} satisfies Record<string, LocalizedList>;

const names = {
  office12: { en: "Porta Cabin Office", ar: "مكتب بورتا كابين" },
  officeToilet: { en: "Porta Cabin Office with Toilet", ar: "مكتب بورتا كابين مع دورة مياه" },
  roomsToiletKitchen: { en: "2 Rooms + 1 Toilet + 1 Kitchen", ar: "غرفتان + دورة مياه + مطبخ" },
  roomsAttached: { en: "2 Rooms with Attached Toilets", ar: "غرفتان مع دورات مياه ملحقة" },
  tworooms: { en: "2 Rooms", ar: "غرفتان" },
  threerooms: { en: "3 Rooms", ar: "ثلاث غرف" },
  guard: { en: "Guard House", ar: "غرفة حراسة" },
  office6: { en: "Porta Cabin Office", ar: "مكتب بورتا كابين" },
  office6PantryToilet: { en: "Office with Pantry & Toilet", ar: "مكتب مع بانتري ودورة مياه" },
} satisfies Record<string, Localized>;

const summaries = {
  office12: {
    en: "A 12-metre open-plan site office with a central entrance, windows to both long elevations and space for multiple workstations.",
    ar: "مكتب موقع مفتوح بطول 12 متراً بمدخل في المنتصف ونوافذ في الواجهتين الطويلتين ومساحة لعدة محطات عمل.",
  },
  officeToilet: {
    en: "Open-plan site office with an internal toilet and wash basin, ventilated and provided with water and drain connection points.",
    ar: "مكتب موقع مفتوح مع دورة مياه داخلية ومغسلة، مزوّد بالتهوية ونقاط توصيل المياه والصرف.",
  },
  roomsToiletKitchen: {
    en: "Two accommodation rooms either side of a shared toilet and a kitchen with counter and sink.",
    ar: "غرفتا سكن على جانبي دورة مياه مشتركة ومطبخ مزوّد بسطح عمل وحوض.",
  },
  roomsAttached: {
    en: "Two independent rooms with their own entrances, each with an attached, separately ventilated toilet.",
    ar: "غرفتان مستقلتان بمداخل خاصة، لكل منهما دورة مياه ملحقة بتهوية مستقلة.",
  },
  tworooms: {
    en: "Two equal rooms separated by a full-height partition, each with its own entrance door.",
    ar: "غرفتان متساويتان يفصل بينهما قاطع بكامل الارتفاع، ولكل منهما باب دخول خاص.",
  },
  threerooms: {
    en: "Three equal rooms with independent entrance doors and windows to front and rear.",
    ar: "ثلاث غرف متساوية بأبواب دخول مستقلة ونوافذ في الواجهتين الأمامية والخلفية.",
  },
  guard: {
    en: "A compact 4.00 × 3.00 m guard room with wide observation windows and a counter-height work surface.",
    ar: "غرفة حراسة مدمجة بمقاس 4.00 × 3.00 م مع نوافذ مراقبة عريضة وسطح عمل بارتفاع الكاونتر.",
  },
  office6: {
    en: "A compact 6-metre office with windows to front, rear and side and an entrance door with steel step platform.",
    ar: "مكتب مدمج بطول 6 أمتار مع نوافذ في الواجهات الأمامية والخلفية والجانبية وباب دخول مع منصة درج فولاذية.",
  },
  office6PantryToilet: {
    en: "A 6-metre office with a pantry (counter and sink) and a ventilated toilet with wash basin.",
    ar: "مكتب بطول 6 أمتار مع بانتري (سطح عمل وحوض) ودورة مياه مزوّدة بمغسلة وتهوية.",
  },
} satisfies Record<string, Localized>;

const subj = (name: Localized, code: string): Localized => ({
  en: `SBT Model ${code} — ${name.en} exterior`,
  ar: `الواجهة الخارجية للطراز ${code} — ${name.ar}`,
});

type Base = {
  key: keyof typeof names;
  plan: PlanId;
  size: SizeKey;
  sizeLabel: string;
  dims: [number, number];
  img: keyof typeof ext;
  features: Feature[];
  rooms: number;
  included: (cat: CategoryId) => IncludedItem[];
};

const withAlarm = (cat: CategoryId, items: IncludedItem[]): IncludedItem[] =>
  cat === "aramco-standard" ? [...items, "fireAlarm"] : items;

const layouts: Record<string, Base> = {
  office12: {
    key: "office12", plan: "office12", size: "12x3.75", sizeLabel: "12 × 3.75 m", dims: [12, 3.75], img: "single",
    features: ["office"], rooms: 1,
    included: (c) => withAlarm(c, ["steelStructure", "insulation", "lightingPoints", "powerPoints", "acPoint", "windows", "entranceDoor", "floorFinish"]),
  },
  officeToilet: {
    key: "officeToilet", plan: "officeToilet12", size: "12x3.75", sizeLabel: "12 × 3.75 m", dims: [12, 3.75], img: "single",
    features: ["office", "toilet"], rooms: 1,
    included: (c) => withAlarm(c, ["steelStructure", "insulation", "lightingPoints", "powerPoints", "acPoint", "windows", "entranceDoor", "toiletBasin"]),
  },
  roomsToiletKitchen: {
    key: "roomsToiletKitchen", plan: "tworoomsToiletKitchen", size: "12x3.75", sizeLabel: "12 × 3.75 m", dims: [12, 3.75], img: "single",
    features: ["accommodation", "toilet", "kitchen", "multiRoom"], rooms: 2,
    included: (c) => withAlarm(c, ["steelStructure", "insulation", "lightingPoints", "powerPoints", "acPoints", "windows", "doors", "toiletKitchen"]),
  },
  roomsAttached: {
    key: "roomsAttached", plan: "tworoomsAttached", size: "12x3.75", sizeLabel: "12 × 3.75 m", dims: [12, 3.75], img: "two",
    features: ["accommodation", "toilet", "multiRoom"], rooms: 2,
    included: (c) => withAlarm(c, ["steelStructure", "insulation", "lightingPoints", "powerPoints", "acPoints", "windows", "entranceDoors2", "attachedToilets2"]),
  },
  tworooms: {
    key: "tworooms", plan: "tworooms", size: "12x3.75", sizeLabel: "12 × 3.75 m", dims: [12, 3.75], img: "two",
    features: ["accommodation", "multiRoom"], rooms: 2,
    included: (c) => withAlarm(c, ["steelStructure", "insulation", "lightingPoints", "powerPoints", "acPoints", "windows", "entranceDoors2", "floorFinish"]),
  },
  threerooms: {
    key: "threerooms", plan: "threerooms", size: "12x3.75", sizeLabel: "12 × 3.75 m", dims: [12, 3.75], img: "three",
    features: ["accommodation", "multiRoom"], rooms: 3,
    included: (c) => withAlarm(c, ["steelStructure", "insulation", "lightingPoints", "powerPoints", "acPoints", "windows", "entranceDoors3", "floorFinish"]),
  },
  guard: {
    key: "guard", plan: "guard", size: "4x3", sizeLabel: "3 × 4 m", dims: [4, 3], img: "guard",
    features: ["guard"], rooms: 1,
    included: (c) => withAlarm(c, ["steelStructure", "insulation", "lightingPoint", "powerPoints", "acPoint", "observationWindows", "entranceDoor", "floorFinish"]),
  },
  office6: {
    key: "office6", plan: "office6", size: "6x3.75", sizeLabel: "6 × 3.75 m", dims: [6, 3.75], img: "six",
    features: ["office"], rooms: 1,
    included: (c) => withAlarm(c, ["steelStructure", "insulation", "lightingPoints", "powerPoints", "acPoint", "windows", "entranceDoor", "floorFinish"]),
  },
  office6PantryToilet: {
    key: "office6PantryToilet", plan: "office6PantryToilet", size: "6x3.75", sizeLabel: "6 × 3.75 m", dims: [6, 3.75], img: "six",
    features: ["office", "pantry", "toilet"], rooms: 1,
    included: (c) => withAlarm(c, ["steelStructure", "insulation", "lightingPoints", "powerPoints", "acPoint", "windows", "entranceDoor", "pantryToilet"]),
  },
};

function catalogueModel(
  code: string,
  category: CategoryId,
  layoutKey: keyof typeof layouts,
  price: number | null,
  source: string,
): Product {
  const l = layouts[layoutKey];
  const name = names[l.key];
  const [length, width] = l.dims;
  const gallery: GalleryImage[] = [ext[l.img](subj(name, code))];
  if (category === "normal-standard") gallery.push(...normalInteriors);
  const features = category === "aramco-standard" ? [...l.features, "fireAlarm" as const] : l.features;
  return {
    slug: code.toLowerCase(),
    code,
    modelLabel: `SBT MODEL ${code}`,
    category,
    family: "cabin",
    name,
    sizeLabel: l.sizeLabel,
    size: l.size,
    dimensions: { length, width, height: 2.5 },
    footprint: Math.round(length * width * 100) / 100,
    price: price === null ? null : { amount: price, currency: "SAR", basis: "perUnit" },
    summary: summaries[l.key],
    configuration: cfg[l.key],
    construction: category === "aramco-standard" ? aramcoConstruction : normalConstruction,
    included: l.included(category),
    features,
    rooms: l.rooms,
    plan: l.plan,
    gallery,
    source,
  };
}

const CAT = "SBT Porta Cabin Catalogue";


/* ------------------------------------------------------------------ */
/* Containers and portable toilets (client price list, 15 Oct 2026)    */
/* Only what the client stated is listed. Heights, materials beyond    */
/* those named and furniture schedules are "confirmed at quotation".   */
/* ------------------------------------------------------------------ */

const PRICE_LIST = "Client price list (written message, 15 Oct 2026)";
const L2 = (en: string, ar: string): Localized => ({ en, ar });
const R = (le: string, la: string, ve: string, va: string): SpecRow => ({ label: L2(le, la), value: L2(ve, va) });
const ARAMCO_ROW = R("Standard", "المعيار", "Aramco standard (as specified by SBT CABINS)", "معيار أرامكو (وفق مواصفات SBT CABINS)");
const NORMAL_ROW = R("Standard", "المعيار", "Normal standard", "القياسي العادي");
const HEIGHT_ROW = R("Height", "الارتفاع", "Confirmed at quotation", "يُؤكَّد عند عرض السعر");

type NewSpec = {
  code: string;
  category: CategoryId;
  family: "container" | "toilet";
  name: Localized;
  size: SizeKey;
  sizeLabel: string;
  dims: [number, number];
  price: number;
  summary: Localized;
  configuration: LocalizedList;
  construction: LocalizedList;
  included: IncludedItem[];
  features: Feature[];
  rooms: number;
  plan: PlanId;
  illustration: NonNullable<Product["illustration"]>;
  specRows: SpecRow[];
  tanks?: Product["tanks"];
};

function newProduct(n: NewSpec): Product {
  const [length, width] = n.dims;
  return {
    slug: n.code.toLowerCase(),
    code: n.code,
    modelLabel: `SBT MODEL ${n.code}`,
    category: n.category,
    family: n.family,
    name: n.name,
    sizeLabel: n.sizeLabel,
    size: n.size,
    dimensions: { length, width, height: null },
    footprint: Math.round(length * width * 100) / 100,
    price: { amount: n.price, currency: "SAR", basis: "perUnit" },
    summary: n.summary,
    configuration: n.configuration,
    construction: n.construction,
    included: n.included,
    features: n.features,
    rooms: n.rooms,
    plan: n.plan,
    gallery: [],
    illustration: n.illustration,
    specRows: n.specRows,
    tanks: n.tanks,
    source: PRICE_LIST,
  };
}

/** Toilet block in both standards (3 × 4, 6 × 4 and 12 × 4 m). */
function toiletBlock(o: {
  codeA: string;
  codeN: string;
  size: SizeKey;
  sizeLabel: string;
  dims: [number, number];
  wcs: number;
  basins: number;
  priceN: number;
  priceA: number;
  plan: PlanId;
  water?: number;
  septic?: number;
  tankRadius: number;
  endDoor?: boolean;
}): Product[] {
  const name = L2(
    `Portable Toilet Block — ${o.wcs} WC + ${o.basins} Wash Basins`,
    `وحدة دورات مياه متنقلة — ${o.wcs} مراحيض + ${o.basins} مغاسل`,
  );
  const tankLines: LocalizedList = {
    en: [
      `Water tank${o.water ? ` ${o.water.toLocaleString("en-US")} L` : ""}${o.water ? " (upper side)" : ""}`,
      `Septic tank${o.septic ? ` ${o.septic.toLocaleString("en-US")} L` : ""}${o.septic ? " (below)" : ""}`,
    ],
    ar: [
      `خزان مياه${o.water ? ` سعة ${o.water.toLocaleString("en-US")} لتر` : ""}${o.water ? " (في الأعلى)" : ""}`,
      `خزان صرف صحي${o.septic ? ` سعة ${o.septic.toLocaleString("en-US")} لتر` : ""}${o.septic ? " (في الأسفل)" : ""}`,
    ],
  };
  const make = (aramco: boolean): Product =>
    newProduct({
      code: aramco ? o.codeA : o.codeN,
      category: aramco ? "aramco-standard" : "normal-standard",
      family: "toilet",
      name,
      size: o.size,
      sizeLabel: o.sizeLabel,
      dims: o.dims,
      price: aramco ? o.priceA : o.priceN,
      summary: L2(
        `A ${o.sizeLabel} portable toilet block with ${o.wcs} WCs and ${o.basins} wash basins, supplied with a water tank and a septic tank${aramco ? ", built to Aramco standard" : ""}.`,
        `وحدة دورات مياه متنقلة بمقاس ${o.sizeLabel.replace(/ m$/, " م")} تضم ${o.wcs} مراحيض و${o.basins} مغاسل، مع خزان مياه وخزان صرف صحي${aramco ? "، مصنّعة بمعيار أرامكو" : ""}.`,
      ),
      configuration: {
        en: [`${o.wcs} WC cubicles with western commodes`, `${o.basins} wash basins`, ...tankLines.en],
        ar: [`${o.wcs} حجرات مراحيض بمراحيض إفرنجية`, `${o.basins} مغاسل`, ...tankLines.ar],
      },
      construction: aramco
        ? { en: ["Aramco standard construction", "Water and septic tank connections"], ar: ["إنشاء بمعيار أرامكو", "توصيلات خزان المياه وخزان الصرف"] }
        : { en: ["Normal standard construction", "Water and septic tank connections"], ar: ["إنشاء قياسي عادي", "توصيلات خزان المياه وخزان الصرف"] },
      included: ["commodes", "washBasins", "waterTank", "septicTank", "entranceDoor"],
      features: ["toilet", "portableToilet", "multiRoom"],
      rooms: o.wcs,
      plan: o.plan,
      illustration: { kind: "toiletBlock", tankRadius: o.tankRadius, endDoor: o.endDoor },
      specRows: [
        aramco ? ARAMCO_ROW : NORMAL_ROW,
        R("Size", "المقاس", o.sizeLabel, o.sizeLabel.replace(/ m$/, " م")),
        R("WCs", "المراحيض", `${o.wcs} western commodes`, `${o.wcs} مراحيض إفرنجية`),
        R("Wash basins", "المغاسل", `${o.basins}`, `${o.basins}`),
        R("Water tank", "خزان المياه", o.water ? `${o.water.toLocaleString("en-US")} L, upper side` : "Included — capacity confirmed at quotation", o.water ? `${o.water.toLocaleString("en-US")} لتر، في الأعلى` : "مشمول — تُؤكَّد السعة عند عرض السعر"),
        R("Septic tank", "خزان الصرف الصحي", o.septic ? `${o.septic.toLocaleString("en-US")} L, below` : "Included — capacity confirmed at quotation", o.septic ? `${o.septic.toLocaleString("en-US")} لتر، في الأسفل` : "مشمول — تُؤكَّد السعة عند عرض السعر"),
        HEIGHT_ROW,
      ],
      tanks: { water: o.water, septic: o.septic },
    });
  return [make(true), make(false)];
}

function containersAndToilets(): Product[] {
  const officeSpec = (size: string, sizeAr: string): SpecRow[] => [
    ARAMCO_ROW,
    R("Type", "النوع", "Container office", "مكتب حاوية"),
    R("Size", "المقاس", size, sizeAr),
    R("Fire safety", "السلامة من الحريق", "Fire-rated construction — rating confirmed at quotation", "إنشاء مقاوم للحريق — تُؤكَّد درجة المقاومة عند عرض السعر"),
    R("Furniture", "الأثاث", "Fully furnished — furniture schedule confirmed at quotation", "مفروش بالكامل — يُؤكَّد جدول الأثاث عند عرض السعر"),
    HEIGHT_ROW,
  ];
  const storeSpec = (size: string, sizeAr: string): SpecRow[] => [
    NORMAL_ROW,
    R("Type", "النوع", "Storage container", "حاوية تخزين"),
    R("Size", "المقاس", size, sizeAr),
    R("Doors", "الأبواب", "Door arrangement confirmed at quotation", "يُؤكَّد ترتيب الأبواب عند عرض السعر"),
    HEIGHT_ROW,
  ];
  const officeCfg: LocalizedList = {
    en: ["Container office, fully furnished", "Aramco standard", "Fire-rated"],
    ar: ["مكتب حاوية مفروش بالكامل", "بمعيار أرامكو", "مقاوم للحريق"],
  };
  const storeCfg: LocalizedList = {
    en: ["Storage container", "Open interior for materials and equipment"],
    ar: ["حاوية تخزين", "مساحة داخلية مفتوحة للمواد والمعدات"],
  };

  return [
    newProduct({
      code: "AC1",
      category: "aramco-standard",
      family: "container",
      name: L2("Container Office — Fully Furnished", "مكتب حاوية — مفروش بالكامل"),
      size: "12x3.5",
      sizeLabel: "12 × 3.5 m",
      dims: [12, 3.5],
      price: 28000,
      summary: L2(
        "A 12 × 3.5 m container office to Aramco standard, fire-rated and supplied fully furnished.",
        "مكتب حاوية بمقاس 12 × 3.5 م بمعيار أرامكو، مقاوم للحريق ومفروش بالكامل.",
      ),
      configuration: officeCfg,
      construction: { en: ["Aramco standard", "Fire-rated construction", "Full furniture package"], ar: ["معيار أرامكو", "إنشاء مقاوم للحريق", "حزمة أثاث كاملة"] },
      included: ["furniturePackage", "fireRatedBuild", "entranceDoor", "windows"],
      features: ["office", "container", "furnished", "fireRated"],
      rooms: 1,
      plan: "containerOffice12",
      illustration: { kind: "containerOffice" },
      specRows: officeSpec("12 × 3.5 m", "12 × 3.5 م"),
    }),
    newProduct({
      code: "AC2",
      category: "aramco-standard",
      family: "container",
      name: L2("Container Office — Fully Furnished", "مكتب حاوية — مفروش بالكامل"),
      size: "6x3.5",
      sizeLabel: "6 × 3.5 m",
      dims: [6, 3.5],
      price: 20000,
      summary: L2(
        "A compact 6 × 3.5 m container office to Aramco standard, fire-rated and supplied fully furnished.",
        "مكتب حاوية مدمج بمقاس 6 × 3.5 م بمعيار أرامكو، مقاوم للحريق ومفروش بالكامل.",
      ),
      configuration: officeCfg,
      construction: { en: ["Aramco standard", "Fire-rated construction", "Full furniture package"], ar: ["معيار أرامكو", "إنشاء مقاوم للحريق", "حزمة أثاث كاملة"] },
      included: ["furniturePackage", "fireRatedBuild", "entranceDoor", "windows"],
      features: ["office", "container", "furnished", "fireRated"],
      rooms: 1,
      plan: "containerOffice6",
      illustration: { kind: "containerOffice" },
      specRows: officeSpec("6 × 3.5 m", "6 × 3.5 م"),
    }),
    newProduct({
      code: "NC1",
      category: "normal-standard",
      family: "container",
      name: L2("Storage Container", "حاوية تخزين"),
      size: "12x3.5",
      sizeLabel: "12 × 3.5 m",
      dims: [12, 3.5],
      price: 15000,
      summary: L2("A 12 × 3.5 m container for site storage of materials and equipment.", "حاوية بمقاس 12 × 3.5 م لتخزين المواد والمعدات في الموقع."),
      configuration: storeCfg,
      construction: { en: ["Storage container", "Lockable doors"], ar: ["حاوية تخزين", "أبواب قابلة للقفل"] },
      included: ["storageSpace"],
      features: ["container", "storage"],
      rooms: 1,
      plan: "storage12",
      illustration: { kind: "containerStorage" },
      specRows: storeSpec("12 × 3.5 m", "12 × 3.5 م"),
    }),
    newProduct({
      code: "NC2",
      category: "normal-standard",
      family: "container",
      name: L2("Storage Container", "حاوية تخزين"),
      size: "6x3.5",
      sizeLabel: "6 × 3.5 m",
      dims: [6, 3.5],
      price: 10000,
      summary: L2("A 6 × 3.5 m container for site storage of materials and equipment.", "حاوية بمقاس 6 × 3.5 م لتخزين المواد والمعدات في الموقع."),
      configuration: storeCfg,
      construction: { en: ["Storage container", "Lockable doors"], ar: ["حاوية تخزين", "أبواب قابلة للقفل"] },
      included: ["storageSpace"],
      features: ["container", "storage"],
      rooms: 1,
      plan: "storage6",
      illustration: { kind: "containerStorage" },
      specRows: storeSpec("6 × 3.5 m", "6 × 3.5 م"),
    }),
    newProduct({
      code: "AT1",
      category: "aramco-standard",
      family: "toilet",
      name: L2("Single Portable Toilet — LGS", "دورة مياه متنقلة فردية — LGS"),
      size: "1.5x1.5",
      sizeLabel: "1.5 × 1.5 m",
      dims: [1.5, 1.5],
      price: 7000,
      summary: L2(
        "A single 1.5 × 1.5 m portable toilet in LGS construction to Aramco standard, with water tank and septic tank.",
        "دورة مياه متنقلة فردية بمقاس 1.5 × 1.5 م بإطار فولاذي خفيف (LGS) وبمعيار أرامكو، مع خزان مياه وخزان صرف صحي.",
      ),
      configuration: {
        en: ["Single toilet cubicle", "Water tank", "Septic tank"],
        ar: ["حجرة دورة مياه فردية", "خزان مياه", "خزان صرف صحي"],
      },
      construction: { en: ["LGS (light gauge steel) construction", "Aramco standard"], ar: ["إنشاء بإطار فولاذي خفيف (LGS)", "معيار أرامكو"] },
      included: ["commode", "waterTank", "septicTank", "entranceDoor"],
      features: ["toilet", "portableToilet"],
      rooms: 1,
      plan: "toiletSingleWc",
      illustration: { kind: "toiletLgs", tankRadius: 0.4 },
      specRows: [
        ARAMCO_ROW,
        R("Construction", "الإنشاء", "LGS (light gauge steel)", "إطار فولاذي خفيف (LGS)"),
        R("Size", "المقاس", "1.5 × 1.5 m", "1.5 × 1.5 م"),
        R("Water tank", "خزان المياه", "Included — capacity confirmed at quotation", "مشمول — تُؤكَّد السعة عند عرض السعر"),
        R("Septic tank", "خزان الصرف الصحي", "Included — capacity confirmed at quotation", "مشمول — تُؤكَّد السعة عند عرض السعر"),
        R("Wash basin", "المغسلة", "Confirm at quotation", "يُؤكَّد عند عرض السعر"),
        HEIGHT_ROW,
      ],
      tanks: {},
    }),
    newProduct({
      code: "NT1",
      category: "normal-standard",
      family: "toilet",
      name: L2("Single Portable Toilet — Fibreglass", "دورة مياه متنقلة فردية — فايبر جلاس"),
      size: "1.5x1.5",
      sizeLabel: "1.5 × 1.5 m",
      dims: [1.5, 1.5],
      price: 4500,
      summary: L2(
        "A single 1.5 × 1.5 m fibreglass portable toilet with western commode, wash basin, water tank and septic tank.",
        "دورة مياه متنقلة فردية من الفايبر جلاس بمقاس 1.5 × 1.5 م، مع مرحاض إفرنجي ومغسلة وخزان مياه وخزان صرف صحي.",
      ),
      configuration: {
        en: ["Single toilet cubicle", "Western commode and wash basin", "Water tank and septic tank"],
        ar: ["حجرة دورة مياه فردية", "مرحاض إفرنجي ومغسلة", "خزان مياه وخزان صرف صحي"],
      },
      construction: { en: ["Fibreglass construction", "Normal standard"], ar: ["إنشاء من الفايبر جلاس", "القياسي العادي"] },
      included: ["commode", "washBasin", "waterTank", "septicTank", "entranceDoor"],
      features: ["toilet", "portableToilet"],
      rooms: 1,
      plan: "toiletSingle",
      illustration: { kind: "toiletFibre", tankRadius: 0.4 },
      specRows: [
        NORMAL_ROW,
        R("Construction", "الإنشاء", "Fibreglass", "فايبر جلاس"),
        R("Size", "المقاس", "1.5 × 1.5 m", "1.5 × 1.5 م"),
        R("Fixtures", "التجهيزات", "Western commode and wash basin", "مرحاض إفرنجي ومغسلة"),
        R("Water tank", "خزان المياه", "Included — capacity confirmed at quotation", "مشمول — تُؤكَّد السعة عند عرض السعر"),
        R("Septic tank", "خزان الصرف الصحي", "Included — capacity confirmed at quotation", "مشمول — تُؤكَّد السعة عند عرض السعر"),
        HEIGHT_ROW,
      ],
      tanks: {},
    }),
    ...toiletBlock({ codeA: "AT2", codeN: "NT2", size: "4x3", sizeLabel: "3 × 4 m", dims: [4, 3], wcs: 2, basins: 2, priceN: 13500, priceA: 18500, plan: "toilet4x3", tankRadius: 0.5 }),
    ...toiletBlock({ codeA: "AT3", codeN: "NT3", size: "6x4", sizeLabel: "6 × 4 m", dims: [6, 4], wcs: 5, basins: 6, priceN: 25000, priceA: 35000, plan: "toilet6x4", water: 2000, septic: 5000, tankRadius: 0.65 }),
    ...toiletBlock({ codeA: "AT4", codeN: "NT4", size: "12x4", sizeLabel: "12 × 4 m", dims: [12, 4], wcs: 12, basins: 12, priceN: 38000, priceA: 48000, plan: "toilet12x4", water: 5000, septic: 10000, tankRadius: 0.9, endDoor: true }),
  ];
}

export const products: Product[] = [
  catalogueModel("A1", "aramco-standard", "office12", 19000, `${CAT}, pp. 10–11 & 44`),
  catalogueModel("A2", "aramco-standard", "officeToilet", 21000, `${CAT}, pp. 12–13 & 44`),
  catalogueModel("A3", "aramco-standard", "roomsToiletKitchen", 23000, `${CAT}, pp. 14–15 & 44`),
  catalogueModel("A4", "aramco-standard", "roomsAttached", 23000, `${CAT}, pp. 16–17 & 44`),
  catalogueModel("A5", "aramco-standard", "tworooms", 22000, `${CAT}, pp. 18–19 & 44`),
  catalogueModel("A6", "aramco-standard", "threerooms", 23000, `${CAT}, pp. 20–21 & 44`),
  catalogueModel("A7", "aramco-standard", "guard", 9000, `${CAT}, pp. 22–23 & 44`),
  catalogueModel("A8", "aramco-standard", "office6", 12500, `${CAT}, pp. 24–25 & 44`),
  catalogueModel("A9", "aramco-standard", "office6PantryToilet", 14500, `${CAT}, pp. 26–27 & 44`),
  catalogueModel("N1", "normal-standard", "office12", 16500, `${CAT}, pp. 30–31 & 44`),
  catalogueModel("N2", "normal-standard", "officeToilet", 18000, `${CAT}, pp. 32–33 & 44`),
  catalogueModel("N3", "normal-standard", "roomsToiletKitchen", 19500, `${CAT}, pp. 34–35 & 44`),
  catalogueModel("N4", "normal-standard", "roomsAttached", 19500, `${CAT}, pp. 36–37 & 44`),
  catalogueModel("N5", "normal-standard", "tworooms", 18500, `${CAT}, pp. 38–39 & 44`),
  catalogueModel("N6", "normal-standard", "threerooms", 19500, `${CAT}, pp. 40–41 & 44`),
  // N7: the price field is blank in the source catalogue (pp. 42 & 44).
  catalogueModel("N7", "normal-standard", "guard", null, `${CAT}, pp. 42–43 & 44 (price left blank in source)`),
  {
    slug: "accommodation-cabin",
    code: "ACC",
    modelLabel: "12.00 × 3.60 m SLEEPER UNIT",
    category: "aramco-standard",
    family: "accommodation",
    name: { en: "Portable Accommodation Cabin", ar: "كبينة سكن متنقلة" },
    sizeLabel: "12.00 × 3.60 m",
    size: "12x3.60",
    dimensions: {
      length: 12,
      width: 3.6,
      height: 2.75,
      heightNote: { en: "Indicative — from the side elevation in the specification", ar: "إرشادي — وفق المسقط الجانبي في المواصفات الفنية" },
    },
    footprint: 43.2,
    price: null,
    summary: {
      en: "Factory-built, skid-mounted sleeper unit for site camps, plant shutdowns and remote project accommodation — available in 2-Men, 4-Men and 8-Men configurations, each with an attached bathroom.",
      ar: "وحدة سكن مصنّعة بالكامل في المصنع ومثبتة على قاعدة انزلاقية فولاذية، مخصصة لمعسكرات المواقع وفترات إيقاف المصانع وسكن المشاريع النائية — متوفرة بتكوينات لشخصين و4 أشخاص و8 أشخاص، ولكل منها حمّام ملحق.",
    },
    configuration: {
      en: [
        "2-Men, 4-Men and 8-Men layouts, each with attached bathroom",
        "Bedroom area, bathroom / lavatory and furniture package",
        "Fully installed electrical, plumbing, HVAC and fire & safety systems",
        "Main external door plus emergency exit door",
      ],
      ar: [
        "تكوينات لشخصين و4 أشخاص و8 أشخاص، ولكل منها حمّام ملحق",
        "منطقة نوم وحمّام / دورة مياه وحزمة أثاث",
        "أنظمة كهرباء وسباكة وتكييف وسلامة من الحريق مركّبة بالكامل",
        "باب خارجي رئيسي بالإضافة إلى باب خروج للطوارئ",
      ],
    },
    construction: {
      en: [
        "Heavy-duty steel skid — 250 × 125 × 9.80 mm IPE (BS EN 10025)",
        "50 mm PU sandwich panel walls & roof (0.5 mm pre-painted GI skins)",
        "18 mm cement fibre board + Gerflor 2 mm vinyl floor",
      ],
      ar: [
        "قاعدة انزلاقية فولاذية للخدمة الشاقة — كمرة IPE مقاس 250 × 125 × 9.80 مم (BS EN 10025)",
        "جدران وسقف من ألواح ساندويتش بولي يوريثان 50 مم (قشرتان من الحديد المجلفن المطلي مسبقاً 0.5 مم)",
        "ألواح ألياف أسمنتية 18 مم مع أرضية فينيل Gerflor بسماكة 2 مم",
      ],
    },
    included: [],
    features: ["accommodation", "toilet", "fireAlarm"],
    rooms: 1,
    plan: null,
    gallery: [],
    source: "Portable Accommodation Cabin — Technical Specification, pp. 1–17",
  },
  ...containersAndToilets(),
];

/** Size label with the unit in the interface language ("m" / "م"). Numbers are unchanged. */
export function sizeText(p: Product, locale: "en" | "ar"): string {
  return locale === "ar" ? p.sizeLabel.replace(/ m$/, " م") : p.sizeLabel;
}

/** Model designation in the interface language; the model code itself is never translated. */
export function modelText(p: Product, locale: "en" | "ar"): string {
  if (p.code === "ACC") return locale === "ar" ? `وحدة سكن ${sizeText(p, "ar")}` : p.modelLabel;
  return locale === "ar" ? `طراز SBT ${p.code}` : p.modelLabel;
}

/** Short reference used in lists and messages: the model code, or the size for the accommodation unit. */
export function shortRef(p: Product, locale: "en" | "ar"): string {
  return p.code === "ACC" ? sizeText(p, locale) : p.code;
}

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function productsIn(category: CategoryId): Product[] {
  return products.filter((p) => p.category === category);
}

/* ------------------------------------------------------------------ */
/* Category definitions                                                */
/* ------------------------------------------------------------------ */

export type Category = {
  id: CategoryId;
  letter: "A" | "B";
  name: Localized;
  shortName: Localized;
  tagline: Localized;
  highlights: LocalizedList;
  whereUsed: LocalizedList;
  baseSpec: SpecRow[];
  hero: string;
};

const row = (en: string, ar: string, ven: string, var_: string): SpecRow => ({
  label: { en, ar },
  value: { en: ven, ar: var_ },
});

export const categories: Record<CategoryId, Category> = {
  "aramco-standard": {
    id: "aramco-standard",
    letter: "A",
    name: { en: "Aramco Standard Cabins", ar: "كبائن بمعيار أرامكو" },
    shortName: { en: "Aramco Standard", ar: "معيار أرامكو" },
    tagline: {
      en: "Steel + LGS structure, gypsum board walls, cement board floor with 2 mm vinyl, fire alarm included.",
      ar: "هيكل فولاذي مع إطار فولاذي خفيف (LGS)، جدران من ألواح الجبس، أرضية من الألواح الأسمنتية مع فينيل 2 مم، ونظام إنذار حريق ضمن التجهيز.",
    },
    highlights: {
      en: ["Steel + LGS structure", "Gypsum board internal walls", "Cement board + 2 mm vinyl floor", "Fire alarm included"],
      ar: ["هيكل فولاذي + إطار فولاذي خفيف (LGS)", "جدران داخلية من ألواح الجبس", "ألواح أسمنتية + أرضية فينيل 2 مم", "إنذار الحريق ضمن التجهيز"],
    },
    whereUsed: {
      en: [
        "LGS framing in addition to the steel structure",
        "Gypsum board walls instead of PVC panelling",
        "Cement board floor base with vinyl sheet finish",
        "Fire alarm included as standard",
        "Suited to oil & gas, industrial and contractor site requirements where a higher finishing standard is specified",
      ],
      ar: [
        "إطار فولاذي خفيف (LGS) إضافةً إلى الهيكل الفولاذي",
        "جدران من ألواح الجبس بدلاً من ألواح PVC",
        "قاعدة أرضية من الألواح الأسمنتية مع تشطيب بألواح الفينيل",
        "إنذار الحريق ضمن التجهيز القياسي",
        "مناسبة لمتطلبات مواقع النفط والغاز والمواقع الصناعية ومواقع المقاولين التي تشترط مستوى تشطيب أعلى",
      ],
    },
    baseSpec: [
      row("Structure", "الهيكل", "Steel structure + LGS (Light Gauge Steel) framing", "هيكل فولاذي + إطار فولاذي خفيف (LGS)"),
      row("Insulation", "العزل", "Shinko insulated panel system to walls and roof", "نظام ألواح شينكو المعزولة للجدران والسقف"),
      row("Roof / Ceiling", "السقف", "External roof and ceiling finishing", "تشطيب السقف الخارجي والسقف الداخلي"),
      row("Internal Walls", "الجدران الداخلية", "Gypsum board", "ألواح الجبس"),
      row("Floor Base", "قاعدة الأرضية", "Cement board", "ألواح أسمنتية"),
      row("Floor Finish", "تشطيب الأرضية", "2 mm vinyl sheet", "ألواح فينيل بسماكة 2 مم"),
      row("Electrical", "الكهرباء", "Lighting points and power points", "نقاط إنارة ونقاط كهرباء"),
      row("Air Conditioning", "التكييف", "AC points provided", "نقاط تكييف متوفرة"),
      row("Openings", "الفتحات", "Windows and door(s) as per model layout", "نوافذ وأبواب حسب تصميم الطراز"),
      row("Fire Safety", "السلامة من الحريق", "Fire alarm", "إنذار حريق"),
      row("Internal Height", "الارتفاع الداخلي", "2.5 m standard", "2.5 م (قياسي)"),
    ],
    hero: "/images/exterior/cabin-12m-three-doors.webp",
  },
  "normal-standard": {
    id: "normal-standard",
    letter: "B",
    name: { en: "Normal / Standard Cabins", ar: "الكبائن القياسية العادية" },
    shortName: { en: "Normal Standard", ar: "القياسي العادي" },
    tagline: {
      en: "Steel structure, PVC panel internal finish, hard plywood floor and standard electrical & finishing.",
      ar: "هيكل فولاذي، تشطيب داخلي بألواح PVC، أرضية من الخشب الرقائقي الصلب، وتجهيزات كهربائية وتشطيبات قياسية.",
    },
    highlights: {
      en: ["Steel structure", "PVC panel internal finish", "Hard plywood floor", "Standard electrical & finishing"],
      ar: ["هيكل فولاذي", "تشطيب داخلي بألواح PVC", "أرضية من الخشب الرقائقي الصلب", "تجهيزات كهربائية وتشطيبات قياسية"],
    },
    whereUsed: {
      en: [
        "Economical construction for general site use",
        "PVC panel walls — easy to clean and quick to install",
        "Hard plywood floor with standard finish",
        "Fire alarm supplied where required by the client",
        "Suited to temporary site offices, stores, labour rooms and short-duration projects",
      ],
      ar: [
        "إنشاء اقتصادي للاستخدام العام في المواقع",
        "جدران من ألواح PVC سهلة التنظيف وسريعة التركيب",
        "أرضية من الخشب الرقائقي الصلب بتشطيب قياسي",
        "يُوفَّر إنذار الحريق عند طلب العميل",
        "مناسبة لمكاتب المواقع المؤقتة والمستودعات وغرف العمال والمشاريع قصيرة المدة",
      ],
    },
    baseSpec: [
      row("Structure", "الهيكل", "Steel structure", "هيكل فولاذي"),
      row("Insulation", "العزل", "Shinko insulation to walls", "عزل شينكو للجدران"),
      row("Internal Walls", "الجدران الداخلية", "PVC panel / PVC wall decoration", "ألواح PVC / ديكور جداري PVC"),
      row("Floor", "الأرضية", "Hard plywood floor", "أرضية من الخشب الرقائقي الصلب"),
      row("Electrical", "الكهرباء", "Electrical sockets and lighting points", "مقابس كهربائية ونقاط إنارة"),
      row("Air Conditioning", "التكييف", "AC points provided", "نقاط تكييف متوفرة"),
      row("Openings", "الفتحات", "Windows and door(s) as per model layout", "نوافذ وأبواب حسب تصميم الطراز"),
      row("Finishing", "التشطيبات", "Standard electrical and finishing items as applicable", "بنود كهربائية وتشطيبات قياسية حسب الحاجة"),
      row("Fire Safety", "السلامة من الحريق", "Fire alarm — as applicable / on request", "إنذار حريق — حسب الحاجة / عند الطلب"),
      row("Internal Height", "الارتفاع الداخلي", "2.5 m standard", "2.5 م (قياسي)"),
    ],
    hero: "/images/exterior/cabin-12m-two-doors.webp",
  },
};

/** Category comparison table (catalogue p. 05). `true` = included. */
export const categoryComparison: { label: Localized; aramco: Localized | true; normal: Localized | true }[] = [
  { label: { en: "Steel Structure", ar: "الهيكل الفولاذي" }, aramco: true, normal: true },
  { label: { en: "LGS (Light Gauge Steel)", ar: "إطار فولاذي خفيف (LGS)" }, aramco: true, normal: { en: "Not included", ar: "غير مشمول" } },
  { label: { en: "Shinko Insulation", ar: "عزل شينكو" }, aramco: true, normal: true },
  { label: { en: "Internal Wall Finish", ar: "تشطيب الجدران الداخلية" }, aramco: { en: "Gypsum board", ar: "ألواح الجبس" }, normal: { en: "PVC panel", ar: "ألواح PVC" } },
  { label: { en: "Floor Base", ar: "قاعدة الأرضية" }, aramco: { en: "Cement board", ar: "ألواح أسمنتية" }, normal: { en: "Hard plywood", ar: "خشب رقائقي صلب" } },
  { label: { en: "Floor Finish", ar: "تشطيب الأرضية" }, aramco: { en: "2 mm vinyl sheet", ar: "فينيل 2 مم" }, normal: { en: "Standard finish", ar: "تشطيب قياسي" } },
  { label: { en: "Electrical Points", ar: "نقاط الكهرباء" }, aramco: true, normal: true },
  { label: { en: "Lighting Points", ar: "نقاط الإنارة" }, aramco: true, normal: true },
  { label: { en: "AC Points", ar: "نقاط التكييف" }, aramco: true, normal: true },
  { label: { en: "Windows & Doors", ar: "النوافذ والأبواب" }, aramco: true, normal: true },
  { label: { en: "Fire Alarm", ar: "إنذار الحريق" }, aramco: true, normal: { en: "As applicable", ar: "حسب الحاجة" } },
];
