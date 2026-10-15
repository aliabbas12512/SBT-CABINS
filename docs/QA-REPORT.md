# QA Report

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
