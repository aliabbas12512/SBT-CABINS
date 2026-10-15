// Catalogue completeness & accuracy check.
// Compares src/data/products.ts against the price schedule and model list of the
// supplied "SBT Porta Cabin Catalogue" (p. 44) and checks that every referenced
// image and floor plan exists. Run with: npm run validate  (Node 22.18+).
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { products } from "../src/data/products.ts";
import { plans } from "../src/data/plans.ts";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** Source of truth transcribed from the catalogue price schedule (p. 44). */
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
  const expectedCat = code.startsWith("N") ? "normal-standard" : "aramco-standard";
  if (p.category !== expectedCat) errors.push(`${code}: category ${p.category} ≠ ${expectedCat}`);
  if (!p.name.ar || !p.summary.ar || p.configuration.ar.length !== p.configuration.en.length) errors.push(`${code}: incomplete Arabic content`);
  for (const g of p.gallery) if (!existsSync(path.join(root, "public", g.src))) errors.push(`${code}: image not found ${g.src}`);
  if (p.plan && !plans[p.plan]) errors.push(`${code}: plan ${p.plan} not defined`);
  if (code !== "ACC" && !p.plan) errors.push(`${code}: no floor plan`);
  if (code !== "ACC" && p.gallery.length === 0) errors.push(`${code}: no photograph`);
  rows.push(`${code.padEnd(4)} ${p.category.padEnd(16)} ${p.sizeLabel.padEnd(15)} ${String(price ?? "Request a Quote").padEnd(16)} photos:${p.gallery.length} plan:${p.plan ?? "spec drawings"}`);
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
