# SBT CABINS — Portable Cabin Catalogue Website

A bilingual (English / العربية) product catalogue for **SBT CABINS**, built in two complete visual editions:

| Edition | URL prefix | Look |
| --- | --- | --- |
| Premium Light Edition | `/light/en`, `/light/ar` | White surfaces, deep-navy typography, navy-on-white technical drawings |
| Luxury Dark Edition | `/dark/en`, `/dark/ar` | Midnight-blue surfaces, white/silver type, blue-and-white technical drawings |

The root URL `/` is an edition selector. `/light` and `/dark` redirect to the English version of each edition. Every page has a language switch (EN | العربية) and an edition switch that keep you on the same page.

No database and no login. All product data is local TypeScript. The only server code is the optional smart-answer endpoint of the cabin consultant (`/api/assistant`), which stays switched off unless an API key is configured.

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
- **Cabin consultant (chat assistant)** on every page, in English and Arabic (RTL), with a language switch and automatic language detection. It asks one or two questions at a time (use → Aramco or normal standard → size, or a custom size, with a "help me choose" table → model → quantity → special requirements → location → delivery/installation → name/company). It shows real catalogue products as cards (image, drawing, dimensions, specification, listed price or "On request", View product / Compare) and compares models side by side. See [Cabin consultant](#cabin-consultant-chat-assistant).
- **Indicative quotation** (`/[edition]/[lang]/quotation`): unique number (`SBT-Q-YYYYMMDD-XXXXXX`), date, customer, items, listed unit prices only, subtotal, VAT 15 %, indicative total, specifications with photo/illustration and floor plan, and "Pending Confirmation" / "بانتظار التأكيد" for everything not confirmed. Print or **Download PDF** (browser "Save as PDF"), English/Arabic switch, and a WhatsApp button that opens a pre-filled message to 0508202459 — the customer reviews and sends it.
- Technical drawings drawn as SVG and coloured by the active edition (see `src/components/drawings`). Containers and toilets have generated illustrations (clearly labelled), indicative floor plans and, for toilets, a water/septic tank section.
- SEO: per-page titles and descriptions in both languages, hreflang alternates, canonical URLs, `sitemap.xml`, `robots.txt`, Open Graph image, and Product / Organization JSON-LD.

Product inventory, image matching and open questions: [`docs/PRODUCT-INVENTORY.md`](docs/PRODUCT-INVENTORY.md).
Test results: [`docs/QA-REPORT.md`](docs/QA-REPORT.md).

---

## Cabin consultant (chat assistant)

Files: `src/components/assistant/` (chat UI, quotation page view), `src/lib/assistant/` (conversation engine, catalogue knowledge, quotation maths, AI reply guard), `src/i18n/assistant.ts` (all EN/AR text), `src/app/api/assistant/route.ts` (optional AI endpoint).

**How it answers.** The guided consultation runs in the browser from `src/data/products.ts`; it needs no server, no API key and no paid service. Prices, sizes and specifications always come from the catalogue data, so updating a product there updates the assistant and the quotations too. Anything the catalogue does not state (delivery charges and time, installation charges, payment terms, validity, missing heights, custom-unit prices) is shown as "Pending Confirmation".

**Quotations** are not stored anywhere. The quotation data travels in the link after `#` (browsers never send that part to a server), and prices are looked up from the catalogue each time the quotation opens. A quotation is always labelled *indicative — not approved*; SBT CABINS confirms the final offer. VAT is the KSA standard rate (15 %), applied to listed items only.

**Optional smart answers (AI).** For free-form questions the guided flow cannot answer (e.g. "which unit is best for 6 workers?"), the consultant can ask Claude through `/api/assistant`:

| Setting | Value |
| --- | --- |
| Provider | Anthropic (Claude API), called server-side only |
| `ANTHROPIC_API_KEY` | required to switch it on (Vercel → Project → Settings → Environment Variables). Never add a `NEXT_PUBLIC_` prefix. |
| `ANTHROPIC_MODEL` | optional, default `claude-opus-5-5` |
| Cost (pay per use) | Opus 5.5: $4 / $20 per million input / output tokens. Haiku 5.5 (`ANTHROPIC_MODEL=claude-haiku-5-5`): $0.10 / $0.50. Each question sends the catalogue (~8–10k tokens, cached) plus a short reply. Check current prices at anthropic.com/pricing. |
| Alternative | Leave the key unset: the consultant answers only from the guided flow and offers WhatsApp for anything else. Nothing breaks. |

Safety: the model only receives catalogue facts; every reply is checked on the server before it is shown — model codes must exist, any amount must be a listed price or tank capacity, and any wording that claims Saudi Aramco approval is rejected. A rejected or failed reply is replaced with "pending confirmation — ask us on WhatsApp". Requests are size-limited and rate-limited per IP (best effort).

**WhatsApp.** The number comes from `company.phones.primary.local` (`0508202459`) and is validated as a Saudi mobile number before the `wa.me/966508202459` link is built. The site never sends a message itself.

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

No paid service, API key or database is required. The site works on Vercel's free (Hobby) plan. To switch on the consultant's optional AI answers, also add `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`) — see [Cabin consultant](#cabin-consultant-chat-assistant).

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
| Cabin consultant and quotation text (EN + AR) | `src/i18n/assistant.ts` |
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
      quotation/            indicative quotation (print / PDF)
    api/assistant/          optional AI answers (server-side)
    sitemap.ts, robots.ts, icon.svg, globals.css
  components/
    drawings/               FloorPlan, DimensionDiagram, AccommodationDrawings (SVG)
    assistant/              cabin consultant chat + quotation document
    product/ catalog/ compare/ contact/ layout/ home/ ui/
  data/                     products, plans, accommodation, company
  i18n/                     locales, dictionaries
  lib/                      routes, WhatsApp links, SEO, formatting
  lib/assistant/            consultant engine, catalogue knowledge, quotation, AI guard
public/images/              optimised photographs (WebP)
scripts/validate-catalog.mjs
docs/                       product inventory and QA report
```

Stack: Next.js 16 (App Router, static generation), React 19, TypeScript, Tailwind CSS 3, self-hosted fonts (Manrope, IBM Plex Sans Arabic, IBM Plex Mono via Fontsource).
