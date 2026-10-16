# QA Report

## Update — 17 Oct 2026: Google Gemini support for the consultant

- `/api/assistant` now works with `GEMINI_API_KEY` (Gemini REST API, JSON-schema output) as well as `ANTHROPIC_API_KEY`.
- Tested against a local mock of the Gemini API (the real API is not reachable from the test environment): correct request (key header, system instruction with the catalogue, alternating user/model turns, JSON schema); good reply shown with "Smart answer" badge and product cards (unknown code dropped); reply with an unlisted price (21,500 SAR) or an "Aramco approved" claim replaced by the safe answer; blocked reply (SAFETY) → safe answer; API error → error status, chat falls back to the WhatsApp answer. No console errors.
- Regression with no key: assistant suite 71/71, site suite 41/41.
- Not tested: a real Gemini call (network access to generativelanguage.googleapis.com is blocked here).

---

## Update — 16 Oct 2026: cabin consultant (chat assistant) and quotations

Tested on a local production build (`next build` + `next start`, headless Chromium via Playwright) without an AI key — the default setup.

- `npm run build` (150 static pages + `/api/assistant`), `npm run typecheck`, `npm run lint`: 0 errors, 0 warnings. `npm run validate`: 29/29.
- Existing regression suite: 41/41 pass, no console errors.
- Assistant suite: **71/71** browser checks pass, no console errors. AI reply guard and engine: 13/13 unit checks pass.

| # | Scenario | Result |
|---|---|---|
| 1 | English, Aramco: Site office → Aramco (approval disclaimer shown) → size chips from the catalogue → only Aramco office models (A1, A2) → qty 2 → special requirement → Dammam → delivery + installation → name/company → summary → exact quote question → quotation | Pass |
| 2 | Arabic, normal standard (dark edition): RTL panel, Arabic greeting; Accommodation → Normal → only N3–N6; Arabic card labels. Language toggle re-renders history; typing Arabic in the English chat switches to Arabic | Pass |
| 3 | Custom size: "I need an office 10 x 3" → asks standard → "not a standard catalogue size" + closest models → custom item in quotation with design/price pending | Pass |
| 4 | Compare: "compare A1 and N1" → table; Compare on two toilet cards → "Compare selected (2)" → table + link to the compare page | Pass |
| 5 | Quote without price: custom unit → unit price and total "Pending Confirmation", no amount; "price of N7" → pending, no number | Pass |
| 6 | Quote with price: A1 × 2 → 19,000.00 × 2 = 38,000.00 SAR, VAT 15 % 5,700.00, indicative total 43,700.00; delivery/installation, delivery time, payment terms, validity pending; spec table, photo and floor plan; Aramco note | Pass |
| 7 | Download / print: print button and the "Download PDF / Print" link open the print dialog; print view hides site header, toolbar and floating buttons; A4 PDFs generated in English and Arabic (Arabic shaping and RTL checked by eye); language switch keeps the quotation | Pass |
| 8 | WhatsApp: number `966508202459`; exact EN/AR templates with quotation number, type, size, quantity and language; CTA texts exact; note that the customer sends the message | Pass |
| 9 | Missing / invalid info: name skipped → "Pending Confirmation"; quantity "abc" and size "huge" rejected; unknown question ("warranty?") → no invented answer, WhatsApp offered; empty message cannot be sent; broken quotation link → clear message; installation not requested shown as such | Pass |
| 10 | Mobile 390 px and desktop 1366 px, EN/light and AR/dark: full-screen sheet on mobile, 420 px panel on desktop; launcher does not overlap the WhatsApp button; no horizontal overflow in the chat | Pass |

Also checked: conversation survives a page reload (sessionStorage), and `GET /api/assistant` returns `{"enabled":false}` without a key; `POST` returns 503.

Not tested: real AI replies (no API key in this environment — the request code compiles against the official SDK, the reply guard was unit-tested with sample replies); the actual WhatsApp app and a phone's native print/PDF dialog; Safari/iOS.

---

## Update — 15 Oct 2026: containers and portable toilets

- 12 products added (AC1–AC2, NC1–NC2, AT1–AT4, NT1–NT4); 29 products in total.
- `npm run build`: 146 static pages. Typecheck, lint: 0 errors, 0 warnings. `npm run validate`: 29/29 match.
- 41 automated browser checks pass, no console errors, 151 URLs crawled with no broken links. New checks:
  - product-type filter (Containers → 4, Portable toilets → 8)
  - price sorting (lowest NT1 4,500 SAR, highest AT4 48,000 SAR)
  - WhatsApp links on all 58 product pages
  - no horizontal overflow at 390 px on the new product pages
- Reviewed by eye in light/dark and EN/AR: catalogue cards, AT4, NT3 (Arabic), NT1, AC1 (mobile). Fixed during review: septic-tank label overflowing its box; oversized drawings for the 1.5 m toilets.

---


Date: 2026-10-15. Tested against a local production build (`next build` + `next start`) with headless Chromium (Playwright).

## Build and code checks

| Check | Result |
|---|---|
| `npm run build` (Next.js 16.4.2) | Pass — 98 static pages generated (2 editions × 2 languages × home, catalogue, compare, contact, 2 categories, 17 products) plus `/`, sitemap, robots, icon |
| `npm run typecheck` | Pass, 0 errors |
| `npm run lint` | Pass, 0 errors, 0 warnings |
| `npm run validate` | Pass — 17/17 products; prices, sizes, names, categories, images and floor plans match the catalogue price schedule (p. 44) |

## Functional tests (automated, all passed)

- Catalogue shows all 17 products.
- Search: "A3" → 1 result; "guard" → A7 + N7; nonsense query → empty state with reset button.
- Category filter Normal → 7 models. Specification filter "Toilet" → A2, A3, A4, A9, N2, N3, N4 and the Accommodation Cabin.
- Sorting: price low→high starts with A7 (9,000 SAR) and puts unpriced items last; price high→low starts with a 23,000 SAR model.
- Compare: adding A1 and N1 from cards shows the compare tray; the compare page shows both with 19,000 / 16,500 SAR. A shared link `?models=a7,n7,accommodation-cabin` opens with 3 models; N7 and the Accommodation Cabin show "Price on request".
- Product gallery: tabs switch between photo, floor plan and dimension diagram; full-size viewer opens, arrow keys move, Escape closes.
- Language switch keeps the page (`/light/en/products/a4` → `/light/ar/products/a4`), sets `lang="ar"` and `dir="rtl"`; Arabic content is shown.
- Edition switch keeps the page (`/light/ar/...` → `/dark/ar/...`) and sets `data-edition="dark"`.
- WhatsApp: on all 34 product pages (17 × EN/AR) every `wa.me` link uses `966508202459`, and at least three product-specific links carry a pre-filled message naming that model, in the page language. Example messages:
  - EN: *Hello SBT CABINS, I am interested in 2 Rooms + 1 Toilet + 1 Kitchen (SBT MODEL N3, 12 × 3.75 m). Please share the available specifications, price, and delivery details.*
  - AR: *مرحباً SBT CABINS، أنا مهتم بـ غرفتان + دورة مياه + مطبخ (طراز SBT N3، 12 × 3.75 م). يُرجى تزويدي بالمواصفات المتاحة والسعر وتفاصيل التوصيل.*
- Quotation form: an empty submit is blocked with a "Required" message; a complete form opens WhatsApp with model, quantity, delivery location and name.
- Mobile menu (390 px, Arabic): opens, navigates, closes after navigation.
- No horizontal page overflow at 390 px on: home (EN/AR, light/dark), product pages, accommodation cabin, compare with 3 models, contact, category, edition selector.
- Link crawl: 103 internal URLs and images reached from every page, no 4xx/5xx.
- Browser console: no errors or warnings on any tested page.

## Visual review (screenshots checked by eye)

Desktop 1440 px and mobile 390 px, in both editions and both languages: edition selector, home, catalogue, both category pages, product pages (A3, A4, A6, A9), Accommodation Cabin, compare and contact. Issues found and fixed during review:

- Dark-edition floor plans rendered with a light fill inside the walls → fixed (rooms now drawn on the dark paper colour).
- Arabic text inside monospace/letter-spaced labels broke the joined letterforms → letter-spacing and monospace removed for Arabic.
- In Arabic the hero overlay faded the wrong side (text sat on the photo) → overlay now follows reading direction.
- Mobile hero cropped the photo to a blank wall → photo now shows as a full block above the text on phones.
- Units in Arabic ("m" → "م") and model labels ("SBT MODEL A3" → "طراز SBT A3") localised; model codes and numbers unchanged.

## Not tested — please check before launch

- Real devices (Android, iPhone/Safari, tablets). Only Chromium was used, with phone-sized viewports.
- An actual Vercel deployment. No Vercel account is connected to this environment, so the site was built and served locally only. The build has no backend, secrets or paid services, so it should deploy as described in the README.
- Opening WhatsApp on a phone. The link format (`https://wa.me/966508202459?text=…`) and message text were verified; the WhatsApp app itself was not opened.
- Whether 0572065269 has WhatsApp (it is shown for calls only).
- Lighthouse / Core Web Vitals scores were not measured. Images are WebP (largest ~70 KB) and served through Next.js image optimisation; pages are statically generated.
- Screen-reader testing. Semantic HTML, labels, `aria-*` attributes, a skip link and keyboard support for menus and the image viewer are in place, but no screen reader was run.

## Open content questions

See section 4 of [`PRODUCT-INVENTORY.md`](PRODUCT-INVENTORY.md) (N7 price, Accommodation Cabin price/category, brand vs. legal name, logo, second WhatsApp number, replacement photos).
