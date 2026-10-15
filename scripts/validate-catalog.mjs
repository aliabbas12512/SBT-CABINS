// Catalogue completeness & accuracy check.
// Compares src/data/products.ts against the price schedule of the supplied
// "SBT Porta Cabin Catalogue" (p. 44) and the client's container / portable
// toilet price list, and checks that every referenced
// image and floor plan exists. Run with: npm run validate  (Node 22.18+).
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { products } from "../src/data/products.ts";
import { plans } from "../src/data/plans.ts";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** Source of truth: catalogue price schedule (p. 44) + client price list. */
const SOURCE = {
  A1: { size: "12 × 3.75 m", price: 19000, name: "Porta Cabin Office" },
  A2: { size: "12 × 3.75 m", price: 21000, name: "Porta Cabin Office with Toilet" },
  A3: { size: "12 × 3.75 m", price: 23000, name: "2 Rooms + 1 Toilet + 1 Kitchen" },
  A4: { size: "12 × 3.75 m", price: 23000, name: "2 Rooms with Attached Toilets" },
  A5: { size: "12 × 3.75 m", price: 22000, name: "2 Rooms" },
  A6: { size: "12 × 3.75 m", price: 23000, name: "3 Rooms" },
  A7: { size: "3 × 4 m", price: 9000, name: "Guard House" },
  A8: { size: "6 × 3.75 m", price: 12500, name: "Porta Cabin Office" },
  A9: { size: "6 × 3.75 m", price: 14500, name: "Office with Pantry & Toilet" },
  N1: { size: "12 × 3.75 m", price: 16500, name: "Porta Cabin Office" },
  N2: { size: "12 × 3.75 m", price: 18000, name: "Porta Cabin Office with Toilet" },
  N3: { size: "12 × 3.75 m", price: 19500, name: "2 Rooms + 1 Toilet + 1 Kitchen" },
  N4: { size: "12 × 3.75 m", price: 19500, name: "2 Rooms with Attached Toilets" },
  N5: { size: "12 × 3.75 m", price: 18500, name: "2 Rooms" },
  N6: { size: "12 × 3.75 m", price: 19500, name: "3 Rooms" },
  N7: { size: "3 × 4 m", price: null, name: "Guard House" }, // price blank in source
  ACC: { size: "12.00 × 3.60 m", price: null, name: "Portable Accommodation Cabin" }, // technical specification, no price
  // Client price list (written message, 15 Oct 2026)
  AC1: { size: "12 × 3.5 m", price: 28000, name: "Container Office — Fully Furnished", cat: "aramco-standard" },
  AC2: { size: "6 × 3.5 m", price: 20000, name: "Container Office — Fully Furnished", cat: "aramco-standard" },
  NC1: { size: "12 × 3.5 m", price: 15000, name: "Storage Container", cat: "normal-standard" },
  NC2: { size: "6 × 3.5 m", price: 10000, name: "Storage Container", cat: "normal-standard" },
  NT1: { size: "1.5 × 1.5 m", price: 4500, name: "Single Portable Toilet — Fibreglass", cat: "normal-standard" },
  AT1: { size: "1.5 × 1.5 m", price: 7000, name: "Single Portable Toilet — LGS", cat: "aramco-standard" },
  NT2: { size: "3 × 4 m", price: 13500, name: "Portable Toilet Block — 2 WC + 2 Wash Basins", cat: "normal-standard" },
  AT2: { size: "3 × 4 m", price: 18500, name: "Portable Toilet Block — 2 WC + 2 Wash Basins", cat: "aramco-standard" },
  NT3: { size: "6 × 4 m", price: 25000, name: "Portable Toilet Block — 5 WC + 6 Wash Basins", cat: "normal-standard", water: 2000, septic: 5000 },
  AT3: { size: "6 × 4 m", price: 35000, name: "Portable Toilet Block — 5 WC + 6 Wash Basins", cat: "aramco-standard", water: 2000, septic: 5000 },
  NT4: { size: "12 × 4 m", price: 38000, name: "Portable Toilet Block — 12 WC + 12 Wash Basins", cat: "normal-standard", water: 5000, septic: 10000 },
  AT4: { size: "12 × 4 m", price: 48000, name: "Portable Toilet Block — 12 WC + 12 Wash Basins", cat: "aramco-standard", water: 5000, septic: 10000 },
};

const errors = [];
const rows = [];
for (const [code, src] of Object.entries(SOURCE)) {
  const p = products.find((x) => x.code === code);
  if (!p) {
    errors.push(`${code}: missing from products.ts`);
    continue;
  }
  const price = p.price ? p.price.amount : null;
  if (price !== src.price) errors.push(`${code}: price ${price} ≠ source ${src.price}`);
  if (p.sizeLabel !== src.size) errors.push(`${code}: size "${p.sizeLabel}" ≠ source "${src.size}"`);
  if (p.name.en !== src.name) errors.push(`${code}: name "${p.name.en}" ≠ source "${src.name}"`);
  const expectedCat = src.cat ?? (code.startsWith("N") ? "normal-standard" : "aramco-standard");
  if (p.category !== expectedCat) errors.push(`${code}: category ${p.category} ≠ ${expectedCat}`);
  if (!p.name.ar || !p.summary.ar || p.configuration.ar.length !== p.configuration.en.length) errors.push(`${code}: incomplete Arabic content`);
  for (const g of p.gallery) if (!existsSync(path.join(root, "public", g.src))) errors.push(`${code}: image not found ${g.src}`);
  if (p.plan && !plans[p.plan]) errors.push(`${code}: plan ${p.plan} not defined`);
  if (code !== "ACC" && !p.plan) errors.push(`${code}: no floor plan`);
  if (code !== "ACC" && p.gallery.length === 0 && !p.illustration) errors.push(`${code}: no photograph or illustration`);
  if (src.water !== undefined && p.tanks?.water !== src.water) errors.push(`${code}: water tank ${p.tanks?.water} ≠ ${src.water}`);
  if (src.septic !== undefined && p.tanks?.septic !== src.septic) errors.push(`${code}: septic tank ${p.tanks?.septic} ≠ ${src.septic}`);
  rows.push(`${code.padEnd(4)} ${p.category.padEnd(16)} ${p.sizeLabel.padEnd(15)} ${String(price ?? "Request a Quote").padEnd(16)} photos:${p.gallery.length}${p.illustration ? " illustration" : ""} plan:${p.plan ?? "spec drawings"}`);
}
const extra = products.filter((p) => !(p.code in SOURCE));
for (const p of extra) errors.push(`${p.code}: not in source list`);

console.log("Product completeness checklist\n" + rows.join("\n"));
console.log(`\n${products.length} products checked against ${Object.keys(SOURCE).length} source entries.`);
if (errors.length) {
  console.error("\nFAILED:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("All products, prices, sizes, names, images and plans match the source.");
