# Product Inventory & Asset-Matching Plan

Sources inspected (every page):

1. **SBT Porta Cabin Catalogue** — 45 pages. Cover, company profile, model index, category comparison, interior photographs, Category A (A1–A9) and Category B (N1–N7) model pages (exterior + layout/specification page for each), price schedule (p. 44), catalogue notes (p. 45), quotation page.
2. **Portable Accommodation Cabin — Technical Specification** — 17 pages. 12.00 × 3.60 m sleeper unit, 2-Men / 4-Men / 8-Men, sections 01–13, contact page.

No separate replacement photographs were supplied with the request. The website uses the photographs embedded in the catalogue PDF (extracted at their original resolution and converted to WebP).

## 1. Product inventory

| # | Code | Category | Name | Size (L × W × H) | Unit price (SAR) | Source pages |
|---|---|---|---|---|---|---|
| 1 | A1 | Aramco Standard | Porta Cabin Office | 12.00 × 3.75 × 2.50 m | 19,000 | 10–11, 44 |
| 2 | A2 | Aramco Standard | Porta Cabin Office with Toilet | 12.00 × 3.75 × 2.50 m | 21,000 | 12–13, 44 |
| 3 | A3 | Aramco Standard | 2 Rooms + 1 Toilet + 1 Kitchen | 12.00 × 3.75 × 2.50 m | 23,000 | 14–15, 44 |
| 4 | A4 | Aramco Standard | 2 Rooms with Attached Toilets | 12.00 × 3.75 × 2.50 m | 23,000 | 16–17, 44 |
| 5 | A5 | Aramco Standard | 2 Rooms | 12.00 × 3.75 × 2.50 m | 22,000 | 18–19, 44 |
| 6 | A6 | Aramco Standard | 3 Rooms | 12.00 × 3.75 × 2.50 m | 23,000 | 20–21, 44 |
| 7 | A7 | Aramco Standard | Guard House | 4.00 × 3.00 × 2.50 m (listed "3 × 4 M") | 9,000 | 22–23, 44 |
| 8 | A8 | Aramco Standard | Porta Cabin Office | 6.00 × 3.75 × 2.50 m | 12,500 | 24–25, 44 |
| 9 | A9 | Aramco Standard | Office with Pantry & Toilet | 6.00 × 3.75 × 2.50 m | 14,500 | 26–27, 44 |
| 10 | N1 | Normal Standard | Porta Cabin Office | 12.00 × 3.75 × 2.50 m | 16,500 | 30–31, 44 |
| 11 | N2 | Normal Standard | Porta Cabin Office with Toilet | 12.00 × 3.75 × 2.50 m | 18,000 | 32–33, 44 |
| 12 | N3 | Normal Standard | 2 Rooms + 1 Toilet + 1 Kitchen | 12.00 × 3.75 × 2.50 m | 19,500 | 34–35, 44 |
| 13 | N4 | Normal Standard | 2 Rooms with Attached Toilets | 12.00 × 3.75 × 2.50 m | 19,500 | 36–37, 44 |
| 14 | N5 | Normal Standard | 2 Rooms | 12.00 × 3.75 × 2.50 m | 18,500 | 38–39, 44 |
| 15 | N6 | Normal Standard | 3 Rooms | 12.00 × 3.75 × 2.50 m | 19,500 | 40–41, 44 |
| 16 | N7 | Normal Standard | Guard House | 4.00 × 3.00 × 2.50 m (listed "3 × 4 M") | **blank in source → "Request a Quote"** | 42–43, 44 |
| 17 | — | Aramco Standard section (see §4) | Portable Accommodation Cabin, 2/4/8-Men | 12.00 × 3.60 m, height 2.75 m indicative | **not given → "Request a Quote"** | spec pp. 1–17 |

Pricing basis (catalogue p. 44 / 45): *per unit, in SAR, for the specification listed. VAT, delivery, offloading, installation, foundations, external power/water connections and civil works are confirmed separately in the quotation.* The website shows this note next to every price. No discounts, VAT or delivery charges are assumed.

## 2. Asset matching

| Asset (website file) | Extracted from | Used for | Caption on site |
|---|---|---|---|
| `exterior/cabin-12m-single-door.webp` | catalogue pp. 10, 12, 14, 30, 32, 34 (identical image) | A1, A2, A3, N1, N2, N3 | Actual unit photograph (as supplied in the catalogue) |
| `exterior/cabin-12m-two-doors.webp` | pp. 16, 18, 36, 38 (identical image) | A4, A5, N4, N5 | Front elevation — door arrangement for this layout (composited, as stated in the catalogue) |
| `exterior/cabin-12m-three-doors.webp` | pp. 20, 40 | A6, N6 | Same as above |
| `exterior/guard-house-4x3.webp` | pp. 22, 42 (blurred side margins cropped off) | A7, N7 | Actual unit photograph |
| `exterior/cabin-6m-office.webp` | pp. 24, 26 (identical image) | A8, A9 | Actual unit photograph |
| `exterior/hero-cabin.webp` | p. 03 | Home hero, edition selector | — |
| `interior/*.webp` (4 photos) | p. 06 | N-models only, home page | The catalogue states these show the **Normal-standard** finish, so they are not shown on Aramco-standard models |
| Floor plans (SVG) | layout pages 11–43 | 9 layouts shared by A/N pairs | "Conceptual layout — subject to final engineering / design confirmation" (as in source) |
| Accommodation drawings (SVG) | spec pp. 2, 4, 5, 6, 7, 16 | Accommodation Cabin | "Indicative" (as in source) |

Notes on accuracy:

- The catalogue itself uses the same exterior photograph for models with the same front elevation (e.g. A1/A2/A3). The website does the same and does not invent different exteriors. To make models easy to tell apart, every product card also shows its floor plan.
- Floor plans were re-drawn as vector SVG from the source layouts at their printed scale (all room areas, overall dimensions and segment dimensions copied from the source). The light edition draws navy linework on white; the dark edition draws blue-and-white linework on midnight blue, with its own colour tokens (`--dw-*` in `globals.css`).
- The dimension diagram shows only overall length, width and height (no doors or windows), so it cannot misrepresent the layout.
- No front/side/rear elevations were drawn for catalogue models, because the source does not supply them and the conceptual plans and photographs do not agree on window positions. The accommodation cabin side elevation is drawn because the specification supplies it.
- No photograph of the Portable Accommodation Cabin was supplied. Its page uses drawings only and says so.

## 3. Completeness checklist

Run `npm run validate` to re-check against the source price schedule. Current result: **17 / 17 products present; all prices, sizes, names, categories, images and plans match.**

- [x] A1–A9 present, each with photo, floor plan, dimension diagram, specification, included items, price
- [x] N1–N7 present, each with photo, interior photos, floor plan, dimension diagram, specification, included items, price (N7: Request a Quote)
- [x] Portable Accommodation Cabin present with all 13 specification sections, 3 configurations, prayer room, 5 drawings
- [x] Category comparison table (catalogue p. 05)
- [x] Category base specifications (catalogue pp. 09, 29)
- [x] Catalogue notes (dimensions, layouts, photography, category naming, scope, variations)

## 4. Items that need your confirmation

1. **N7 Guard House price** — blank in the catalogue (pp. 42 and 44). Shown as "Request a Quote".
2. **Accommodation Cabin category and price** — the specification says it is "fabricated and inspected to suit Saudi Aramco site requirements". It is listed in the Aramco section as a separate "technical-specification unit" with that exact wording and a note that this is not an Aramco approval. It does **not** use the Category A material specification (LGS + gypsum), so it is kept apart from A1–A9. No price was supplied.
3. **Brand name** — both PDFs say "SBT Services" (spec: "Shama Al Bayan Trading Est., CR 2050047651"). The website uses **SBT CABINS** as requested. The legal entity name and CR number are not shown; confirm whether they should be.
4. **Logo** — the eagle logo in the PDFs reads "SBT SERVICES", so a simple SBT CABINS wordmark was designed instead. Supply a final logo if you have one.
5. **WhatsApp** — only 0508202459 (+966 50 820 2459) is used for WhatsApp. 0572065269 is shown for calls only until you confirm it has WhatsApp.
6. **Address** — only "Dammam — Second Industrial Area" (as printed in the catalogue) is shown. No street address was invented.
7. **"CEO" title** — taken from your brief; the PDFs say "Eng. Ali Abbas".
8. **Replacement photographs** — the brief mentions additional photos; none were attached. When you send them, they can be dropped into `public/images` and mapped in `src/data/products.ts`.

## 5. Containers and portable toilets (added 15 Oct 2026)

Source: the client's written price list (chat message, 15 Oct 2026). No PDF, photograph or drawing was supplied for these products.

| Code | Category | Product | Size | Unit price (SAR) | Stated details |
|---|---|---|---|---|---|
| AC1 | Aramco Standard | Container Office — Fully Furnished | 12 × 3.5 m | 28,000 | Fully furnished, Aramco standard, fire-rated |
| AC2 | Aramco Standard | Container Office — Fully Furnished | 6 × 3.5 m | 20,000 | Fully furnished, Aramco standard, fire-rated |
| NC1 | Normal Standard | Storage Container | 12 × 3.5 m | 15,000 | For storage |
| NC2 | Normal Standard | Storage Container | 6 × 3.5 m | 10,000 | For store |
| NT1 | Normal Standard | Single Portable Toilet — Fibreglass | 1.5 × 1.5 m | 4,500 | Water tank, septic tank, wash basin, commode |
| AT1 | Aramco Standard | Single Portable Toilet — LGS | 1.5 × 1.5 m | 7,000 | LGS, water tank and septic tank |
| NT2 / AT2 | Normal / Aramco | Toilet Block — 2 WC + 2 Wash Basins | 3 × 4 m | 13,500 / 18,500 | Water tank and septic tank |
| NT3 / AT3 | Normal / Aramco | Toilet Block — 5 WC + 6 Wash Basins | 6 × 4 m | 25,000 / 35,000 | 5,000 L septic tank (below), 2,000 L water tank (upper side) |
| NT4 / AT4 | Normal / Aramco | Toilet Block — 12 WC + 12 Wash Basins | 12 × 4 m | 38,000 / 48,000 | 10,000 L septic tank, 5,000 L water tank |

Category placement follows the price list: items marked "Aramco standard" are in the Aramco Standard category; the rest are in Normal Standard. The storage containers did not state a standard and are listed under Normal Standard.

How these products are presented:

- **Illustrations instead of photos.** Each product has an illustration generated from its length and width (`src/components/drawings/ProductIllustration.tsx`), labelled "Illustration — not a photograph". Images were not copied from Google, because those photos are copyrighted and would show other companies' units. Replace them with real SBT photos when available.
- **Indicative floor plans.** These layouts were prepared from the description (number of WCs and wash basins, product size) and are labelled as indicative. Desk, rack, door and cubicle positions are suggestions for presentation only.
- **Water / septic tank section** for every toilet. A capacity is printed only where the price list stated one (6 × 4 and 12 × 4 m).
- **Details left "confirmed at quotation"** (not stated in the price list): height, fire rating value, furniture schedule, door arrangement of storage containers, tank capacities for the single toilets and the 3 × 4 m blocks, and whether the LGS single toilet has a wash basin.

`npm run validate` checks all 29 products (prices, sizes, names, categories and tank capacities) against the catalogue and this price list.
