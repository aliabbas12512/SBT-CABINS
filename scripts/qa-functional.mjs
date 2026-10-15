// End-to-end checks used for docs/QA-REPORT.md. Requires Playwright and a running
// production server on port 3100: npm run build && npx next start -p 3100
import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const results = [];
const ok = (name, cond, info = "") => results.push(`${cond ? "PASS" : "FAIL"}  ${name}${info ? "  — " + info : ""}`);
const consoleErrors = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && consoleErrors.push(`${page.url()} ${m.text()}`));
page.on("pageerror", (e) => consoleErrors.push(`${page.url()} pageerror ${e.message}`));

// 1. Catalogue search / filter / sort
await page.goto(`${BASE}/light/en/catalog`, { waitUntil: "networkidle" });
const count = async () => page.locator("article").count();
ok("catalog shows all 17 products", (await count()) === 17, `${await count()}`);
await page.fill('input[type="search"]', "A3");
await page.waitForTimeout(200);
ok("search 'A3' → 1 result", (await count()) === 1, `${await count()}`);
await page.fill('input[type="search"]', "guard");
await page.waitForTimeout(200);
ok("search 'guard' → A7 + N7", (await count()) === 2, `${await count()}`);
await page.fill('input[type="search"]', "zzzz");
await page.waitForTimeout(200);
ok("empty state shown", await page.getByText("No models match these filters").isVisible());
await page.getByRole("button", { name: "Reset filters" }).first().click();
await page.getByRole("button", { name: /^Normal Standard/ }).click();
await page.waitForTimeout(200);
ok("category filter Normal → 7", (await count()) === 7, `${await count()}`);
await page.getByRole("button", { name: /^All/ }).click();
await page.locator("summary").click();
await page.getByRole("button", { name: "Toilet", exact: true }).click();
await page.waitForTimeout(200);
const toiletCodes = await page.locator("article p.font-mono").allTextContents();
ok("feature filter Toilet → A2,A3,A4,A9,N2,N3,N4,ACC", toiletCodes.length === 8, toiletCodes.join(","));
await page.getByRole("button", { name: "Toilet", exact: true }).click();
await page.selectOption("select", "priceAsc");
await page.waitForTimeout(200);
const firstAsc = (await page.locator("article p.font-mono").first().textContent()) ?? "";
const lastAsc = (await page.locator("article p.font-mono").last().textContent()) ?? "";
ok("sort price asc: first is A7 (9,000)", firstAsc.includes("A7"), firstAsc);
ok("sort price asc: unpriced last", /N7|SLEEPER/.test(lastAsc), lastAsc);
await page.selectOption("select", "priceDesc");
await page.waitForTimeout(200);
const firstDesc = (await page.locator("article p.font-mono").first().textContent()) ?? "";
ok("sort price desc: first is 23,000 model", /A3|A4|A6/.test(firstDesc), firstDesc);

// 2. Compare
await page.selectOption("select", "model");
await page.getByRole("button", { name: /Compare: A1 / }).click();
await page.getByRole("button", { name: /Compare: N1 / }).click();
await page.waitForTimeout(200);
ok("compare tray appears", await page.getByRole("region", { name: "Selected for comparison" }).isVisible());
await page.getByRole("link", { name: "Compare now" }).click();
await page.waitForURL(/compare/);
await page.waitForTimeout(400);
const cols = await page.locator("table thead th").count();
ok("compare table has 2 models", cols === 3, `${cols - 1} models; url=${page.url()}`);
const priceRow = await page.locator("tr", { hasText: "Unit price" }).textContent();
ok("compare prices 19,000 & 16,500", /19,000/.test(priceRow) && /16,500/.test(priceRow), priceRow?.replace(/\s+/g, " "));
// shared URL
const p2 = await ctx.newPage();
await p2.goto(`${BASE}/dark/en/compare?models=a7,n7,accommodation-cabin`, { waitUntil: "networkidle" });
await p2.waitForTimeout(400);
ok("compare via URL ?models= (3 models)", (await p2.locator("table thead th").count()) === 4);
const n7price = await p2.locator("tr", { hasText: "Unit price" }).textContent();
ok("N7 shows Price on request", /Price on request/.test(n7price ?? ""), n7price?.replace(/\s+/g, " "));
await p2.close();

// 3. Product gallery + lightbox
await page.goto(`${BASE}/light/en/products/a4`, { waitUntil: "networkidle" });
await page.getByRole("tab", { name: "Floor plan / layout" }).click();
ok("gallery tab switches to floor plan", (await page.getByRole("tab", { name: "Floor plan / layout" }).getAttribute("aria-selected")) === "true");
await page.getByRole("button", { name: "Open full size" }).click();
ok("lightbox opens", await page.getByRole("dialog").isVisible());
await page.keyboard.press("ArrowRight");
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
ok("lightbox closes on Escape", (await page.getByRole("dialog").count()) === 0);
ok("A4 price 23,000 on page", (await page.locator("main").textContent())?.includes("23,000"));

// 4. Language + edition switch
await page.getByRole("link", { name: "العربية" }).first().click();
await page.waitForURL(/\/light\/ar\/products\/a4/);
ok("language switch → /ar, dir=rtl", (await page.getAttribute("html", "dir")) === "rtl" && (await page.getAttribute("html", "lang")) === "ar");
await page.getByRole("link", { name: "التبديل إلى النسخة الداكنة" }).click();
await page.waitForURL(/\/dark\/ar\/products\/a4/);
ok("edition switch → /dark, data-edition=dark", (await page.getAttribute("html", "data-edition")) === "dark");
const arText = await page.locator("main").textContent();
ok("Arabic page content in Arabic", /غرفتان مع دورات مياه ملحقة/.test(arText ?? ""));

// 5. WhatsApp links on every product page (EN + AR)
const products = ["a1","a2","a3","a4","a5","a6","a7","a8","a9","n1","n2","n3","n4","n5","n6","n7","accommodation-cabin"];
let waOk = 0; const waIssues = [];
for (const lang of ["en", "ar"]) {
  for (const slug of products) {
    await page.goto(`${BASE}/light/${lang}/products/${slug}`, { waitUntil: "domcontentloaded" });
    const hrefs = await page.locator('a[href^="https://wa.me/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    const bad = hrefs.filter((h) => !h.startsWith("https://wa.me/966508202459?text="));
    const code = slug === "accommodation-cabin" ? (lang === "ar" ? "وحدة سكن" : "Sleeper Unit") : slug.toUpperCase();
    const msgs = hrefs.map((h) => decodeURIComponent(h.split("text=")[1]));
    const productMsgs = msgs.filter((m) => m.includes(code));
    if (!bad.length && productMsgs.length >= 3 && productMsgs.every((m) => (lang === "en" ? m.startsWith("Hello SBT CABINS") : m.startsWith("مرحباً")))) waOk++;
    else waIssues.push(`${lang}/${slug}: bad=${bad.length} productMsgs=${productMsgs.length}`);
  }
}
ok("WhatsApp product links (34 pages): number + prefilled message", waOk === 34, waIssues.join(" | "));
await page.goto(`${BASE}/light/en/products/n3`);
const sample = decodeURIComponent((await page.locator('main a[href^="https://wa.me/"]').first().getAttribute("href")).split("text=")[1]);
results.push(`INFO  sample EN message: ${sample}`);
await page.goto(`${BASE}/light/ar/products/n3`);
const sampleAr = decodeURIComponent((await page.locator('main a[href^="https://wa.me/"]').first().getAttribute("href")).split("text=")[1]);
results.push(`INFO  sample AR message: ${sampleAr}`);

// 6. Quote form → window.open with message
await page.goto(`${BASE}/light/en/contact?model=a9`, { waitUntil: "networkidle" });
await page.evaluate(() => { window.__opened = null; window.open = (u) => { window.__opened = u; return null; }; });
await page.getByRole("button", { name: "Continue in WhatsApp" }).click();
ok("quote form validation blocks empty submit", (await page.evaluate(() => window.__opened)) === null && (await page.getByText("* Required").isVisible()));
await page.getByLabel("Delivery location *").fill("Riyadh");
await page.getByLabel("Your name *").fill("Test Buyer");
await page.getByLabel("Quantity *").fill("3");
await page.getByRole("button", { name: "Continue in WhatsApp" }).click();
const opened = await page.evaluate(() => window.__opened);
const qmsg = opened ? decodeURIComponent(opened.split("text=")[1]) : "";
ok("quote form opens WhatsApp with model/qty/city", /A9/.test(qmsg) && /Quantity: 3/.test(qmsg) && /Riyadh/.test(qmsg), qmsg.replace(/\n/g, " / "));

// 7. Mobile menu
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mp = await m.newPage();
mp.on("pageerror", (e) => consoleErrors.push(`mobile pageerror ${e.message}`));
await mp.goto(`${BASE}/dark/ar`, { waitUntil: "networkidle" });
await mp.getByRole("button", { name: "القائمة" }).click();
ok("mobile menu opens", await mp.locator("#mobile-menu").isVisible());
await mp.locator("#mobile-menu").getByRole("link", { name: "الكتالوج" }).click();
await mp.waitForURL(/\/dark\/ar\/catalog/);
await mp.waitForTimeout(300);
ok("mobile menu closes after navigation", !(await mp.locator("#mobile-menu").isVisible()));
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok("no horizontal overflow on mobile catalog (AR)", overflow <= 0, `overflow=${overflow}`);
for (const path of ["/light/en", "/dark/ar", "/light/ar/products/a3", "/dark/en/products/accommodation-cabin", "/light/en/compare?models=a1,n1,a7", "/dark/ar/contact", "/light/en/category/aramco-standard", "/"]) {
  await mp.goto(BASE + path, { waitUntil: "networkidle" });
  const of = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(`no horizontal overflow (390px) ${path}`, of <= 0, `overflow=${of}`);
}
await m.close();

// 8. Crawl all internal links from all pages for broken links + images
const seen = new Set(); const queue = ["/", "/light/en", "/light/ar", "/dark/en", "/dark/ar"]; const broken = [];
const req = ctx.request;
while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);
  const res = await req.get(BASE + path, { maxRedirects: 5 });
  if (res.status() >= 400) { broken.push(`${path} → ${res.status()}`); continue; }
  const ct = res.headers()["content-type"] ?? "";
  if (!ct.includes("text/html")) continue;
  const html = await res.text();
  for (const mt of html.matchAll(/(?:href|src)="(\/[^"#]*)"/g)) {
    const u = mt[1].replace(/&amp;/g, "&");
    if (u.startsWith("/_next/") && !u.startsWith("/_next/image")) continue;
    if (!seen.has(u) && (u.startsWith("/light") || u.startsWith("/dark") || u.startsWith("/images") || u.startsWith("/_next/image") || u === "/")) queue.push(u);
  }
}
ok(`crawl: ${seen.size} URLs, no broken links/images`, broken.length === 0, broken.join(", "));

await browser.close();
console.log(results.join("\n"));
console.log(consoleErrors.length ? "CONSOLE ERRORS:\n" + consoleErrors.join("\n") : "NO CONSOLE ERRORS");
