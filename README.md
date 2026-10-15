# SBT CABINS — Portable Cabin Catalogue Website

A bilingual (English / العربية) product catalogue for **SBT CABINS**, built in two complete visual editions:

| Edition | URL prefix | Look |
| --- | --- | --- |
| Premium Light Edition | `/light/en`, `/light/ar` | White surfaces, deep-navy typography, navy-on-white technical drawings |
| Luxury Dark Edition | `/dark/en`, `/dark/ar` | Midnight-blue surfaces, white/silver type, blue-and-white technical drawings |

The root URL `/` is an edition selector. `/light` and `/dark` redirect to the English version of each edition. Every page has a language switch (EN | العربية) and an edition switch that keep you on the same page.

Frontend only: no database, no login, no backend. All product data is local TypeScript.

---

## What is included

- **29 products** — 17 from the two supplied PDFs, plus 12 containers and portable toilets from the client's price list:
  - Aramco Standard catalogue models **A1–A9**
  - Normal Standard catalogue models **N1–N7**
  - **Portable Accommodation Cabin** (12.00 × 3.60 m sleeper unit, 2/4/8-Men), from the technical specification
  - Containers **AC1–AC2** (furnished offices) and **NC1–NC2** (storage); portable toilets **AT1–AT4** and **NT1–NT4**
- A product page for every product: gallery, re-drawn floor plan, dimension diagram, full specification, included items, listed price (or "Request a Quote"), WhatsApp enquiry with the model pre-filled, and related models.
- Category pages for **Aramco Standard** and **Normal / Standard**, each with its base specification and a side-by-side comparison of the two standards.
- A catalogue page with search (model code, English or Arabic name), category / size / specification filters and sorting.
- A compare page for up to 4 models. The comparison can be shared as a link (`/light/en/compare?models=a1,n1`).
- A contact page with a quotation form. The form opens WhatsApp with the message filled in; it does not send anything by itself.
- Technical drawings drawn as SVG and coloured by the active edition (see `src/components/drawings`). Containers and toilets have generated illustrations (clearly labelled), indicative floor plans and, for toilets, a water/septic tank section.
- SEO: per-page titles and descriptions in both languages, hreflang alternates, canonical URLs, `sitemap.xml`, `robots.txt`, Open Graph image, and Product / Organization JSON-LD.

Product inventory, image matching and open questions: [`docs/PRODUCT-INVENTORY.md`](docs/PRODUCT-INVENTORY.md).
Test results: [`docs/QA-REPORT.md`](docs/QA-REPORT.md).

---

## Run it locally

Requirements: **Node.js 20.9 or newer** (Node 22 recommended — see `.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build
npm start            # http://localhost:3000
```

Checks:

```bash
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm run validate     # catalogue vs. source PDF: products, prices, sizes, images, plans (Node 22.18+)
```

---

## Upload to GitHub

If you are starting from this folder (not from the existing repository):

```bash
git init
git add .
git commit -m "SBT CABINS website"
git branch -M main
git remote add origin https://github.com/<your-account>/sbt-cabins.git
git push -u origin main
```

`node_modules/` and `.next/` are excluded by `.gitignore`.

## Deploy on Vercel

1. Sign in at [vercel.com](https://vercel.com) with your GitHub account.
2. **Add New → Project**, then import the GitHub repository.
3. Vercel detects **Next.js** automatically. Keep the defaults:
   - Build command: `next build`
   - Output: handled by Vercel
   - Node.js version: 20.x or 22.x (Project Settings → General)
4. Optional but recommended: add an environment variable
   `NEXT_PUBLIC_SITE_URL` = your final domain (for example `https://www.sbtcabins.com`).
   It is used for canonical URLs, the sitemap and social-sharing previews. Without it, the Vercel production URL is used.
5. Click **Deploy**. Every push to `main` deploys again.

No paid service, API key or database is required. The site works on Vercel's free (Hobby) plan.

To add a custom domain: Vercel project → **Settings → Domains**.

---

## Editing content

| What | Where |
| --- | --- |
| Prices, names, configurations, specifications (EN + AR) | `src/data/products.ts` |
| Accommodation cabin specification | `src/data/accommodation.ts` |
| Floor-plan geometry (metres) | `src/data/plans.ts` |
| Phone numbers, e-mail, WhatsApp number, locations | `src/data/company.ts` |
| Interface text (EN + AR) and WhatsApp message templates | `src/i18n/dictionaries.ts` |
| Colours for each edition, including drawing colours (`--dw-*`) | `src/app/globals.css` |
| Photographs | `public/images/exterior`, `public/images/interior` |

To set the N7 price once it is confirmed, change `null` to the amount in the `N7` line of `src/data/products.ts` and in `SOURCE` in `scripts/validate-catalog.mjs`.

To replace a photograph, put the new file in `public/images/...` and update the `src`, `width` and `height` in `src/data/products.ts`.

---

## Project structure

```
src/
  app/
    (gate)/                 edition selector at "/"
    [edition]/[lang]/       all site pages (light|dark × en|ar)
      page.tsx              home
      catalog/              search, filters, sorting
      category/[category]/  aramco-standard, normal-standard
      products/[slug]/      product detail
      compare/              comparison
      contact/              contact + quotation form
    sitemap.ts, robots.ts, icon.svg, globals.css
  components/
    drawings/               FloorPlan, DimensionDiagram, AccommodationDrawings (SVG)
    product/ catalog/ compare/ contact/ layout/ home/ ui/
  data/                     products, plans, accommodation, company
  i18n/                     locales, dictionaries
  lib/                      routes, WhatsApp links, SEO, formatting
public/images/              optimised photographs (WebP)
scripts/validate-catalog.mjs
docs/                       product inventory and QA report
```

Stack: Next.js 16 (App Router, static generation), React 19, TypeScript, Tailwind CSS 3, self-hosted fonts (Manrope, IBM Plex Sans Arabic, IBM Plex Mono via Fontsource).
