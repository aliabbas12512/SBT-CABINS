# SBT CABINS — Portable Cabin Catalogue Website

A bilingual (English / العربية) product catalogue for **SBT CABINS**, built in two complete visual editions:

| Edition | URL prefix | Look |
| --- | --- | --- |
| Premium Light Edition | `/light/en`, `/light/ar` | White surfaces, deep-navy typography, navy-on-white technical drawings |
| Luxury Dark Edition | `/dark/en`, `/dark/ar` | Midnight-blue surfaces, white/silver type, blue-and-white technical drawings |

The root URL `/` is an edition selector. `/light` and `/dark` redirect to the English version of each edition. Every page has a language switch (EN | العربية) and an edition switch that keep you on the same page.

All product data is local TypeScript. Server code: the optional AI endpoints (switched off unless an API key is set) and the cabin designer's optional Supabase database (admin panel and saved quotation requests).

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
- **Cabin designer** (`/[edition]/[lang]/designer`): customers design their own cabin in three panels — AI/rule-based chat, a live measured floor plan, and a live price summary in SAR — then generate a quotation (PDF/print, WhatsApp/email to sales). Admin panel at `/[edition]/[lang]/admin`. See [Cabin designer](#cabin-designer).
- Technical drawings drawn as SVG and coloured by the active edition (see `src/components/drawings`). Containers and toilets have generated illustrations (clearly labelled), indicative floor plans and, for toilets, a water/septic tank section.
- SEO: per-page titles and descriptions in both languages, hreflang alternates, canonical URLs, `sitemap.xml`, `robots.txt`, Open Graph image, and Product / Organization JSON-LD.

Product inventory, image matching and open questions: [`docs/PRODUCT-INVENTORY.md`](docs/PRODUCT-INVENTORY.md).
Test results: [`docs/QA-REPORT.md`](docs/QA-REPORT.md).

---

## Cabin consultant (chat assistant)

Files: `src/components/assistant/` (chat UI, quotation page view), `src/lib/assistant/` (conversation engine, catalogue knowledge, quotation maths, AI reply guard), `src/i18n/assistant.ts` (all EN/AR text), `src/app/api/assistant/route.ts` (optional AI endpoint).

**How it answers.** The guided consultation runs in the browser from `src/data/products.ts`; it needs no server, no API key and no paid service. Prices, sizes and specifications always come from the catalogue data, so updating a product there updates the assistant and the quotations too. Anything the catalogue does not state (delivery charges and time, installation charges, payment terms, validity, missing heights, custom-unit prices) is shown as "Pending Confirmation".

**Quotations** are not stored anywhere. The quotation data travels in the link after `#` (browsers never send that part to a server), and prices are looked up from the catalogue each time the quotation opens. A quotation is always labelled *indicative — not approved*; SBT CABINS confirms the final offer. VAT is the KSA standard rate (15 %), applied to listed items only.

**Optional smart answers (AI).** For free-form questions the guided flow cannot answer (e.g. "which unit is best for 6 workers?"), the consultant can ask an AI model through `/api/assistant`. Two providers are supported; the key is used only on the server.

| Setting | Value |
| --- | --- |
| `GEMINI_API_KEY` | Google Gemini key from Google AI Studio (aistudio.google.com → API keys). Add it in Vercel → Project → Settings → Environment Variables, then redeploy. |
| `GEMINI_MODEL` | optional, default `gemini-flash-latest` |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | alternative provider: Anthropic Claude (default model `claude-opus-5-5`; cheaper `claude-haiku-5-5`) |
| `AI_PROVIDER` | optional, `gemini` or `anthropic` when both keys are set (default: Gemini) |
| Cost | Pay per use with the provider's own pricing (Gemini: ai.google.dev/pricing — a free tier with rate limits is offered; Claude: anthropic.com/pricing). Each question sends the catalogue (~8–10k tokens) plus a short reply. Set a spending limit in the provider console. |
| Alternative | No key: the consultant answers only from the guided flow and offers WhatsApp for anything else. Nothing breaks. |

Never put a key in a `NEXT_PUBLIC_` variable or commit it to the repository.

Safety: the model only receives catalogue facts; every reply is checked on the server before it is shown — model codes must exist, any amount must be a listed price or tank capacity, and any wording that claims Saudi Aramco approval is rejected. A rejected or failed reply is replaced with "pending confirmation — ask us on WhatsApp". Requests are size-limited and rate-limited per IP (best effort).

**WhatsApp.** The number comes from `company.phones.primary.local` (`0508202459`) and is validated as a Saudi mobile number before the `wa.me/966508202459` link is built. The site never sends a message itself.

---

## Cabin designer

**What customers can do** (`/light/en/designer`, `/light/ar/designer`, and the dark editions):

- Describe the cabin in English or Arabic — "12 × 3.75 m with one bedroom and one toilet", "add another room", "separate toilet and bathroom", "Aramco", "اريد كبينة 12 في 3.75 فيها غرفتين وحمام" — or use the buttons (Add/Remove Room, Add Toilet, Add Bathroom, Add Toilet + Bath, Add Kitchenette, Add Storage, Change Dimensions, Normal / Aramco, Reset Design, Generate Quotation), size presets, room use (bedroom/office/living), order of rooms, windows per room, furniture, extras and number of cabins.
- See the floor plan redraw immediately: rooms, toilets, bathrooms, kitchenette, lobby, doors, windows, fixtures, overall dimensions and the length of every room. If the rooms do not fit, the designer says exactly why and blocks the quotation.
- See the estimated price update with every change, and an Aramco specification check that separates options covered by the catalogue Aramco range from options that **require engineering approval** (never presented as a Saudi Aramco approval).
- Generate a quotation (number, date, customer, drawing, specification, itemised pricing, VAT, terms, exclusions), download it as PDF, and send it to sales on WhatsApp / e-mail. With the database connected, the request is also saved for the sales team, and the customer's link shows the approved quotation once SBT CABINS approves it.

**How it works.** Drawings come from a deterministic layout engine (`src/lib/designer/layout.ts`) using the layout rules (room minimums, toilet/bathroom module sizes, lobby depth, door and window widths) — not from AI. Prices come from the rate card (`src/lib/designer/pricing.ts`). The AI (Gemini or Claude, if a key is set) only turns free text into design actions such as "add room"; the same validated code then applies them. It never sees or produces prices.

**Prices — nothing is invented.** Every rate starts empty, shown as "Pending Confirmation". Until SBT CABINS enters its rates in the admin panel:
- a design that exactly matches a catalogue model (e.g. 12 × 3.75 m, 2 rooms + toilet + kitchen = N3 / A3) shows that model's listed price;
- any other design shows its price lines as "Pending Confirmation" and the total as pending.

Price formula once rates are set (per cabin): floor area × (structure rate + labour rate) + rooms/toilets/bathrooms/kitchenettes/storage × their rates + extra windows + extra height + margin %; then accessories; × number of cabins; + delivery and installation per cabin (if requested); + VAT (15 %).

### Turning on the admin panel (database)

The designer works without a database (bundled defaults, quotations sent by WhatsApp/e-mail). For the admin panel — managing prices, rules, specifications, templates, and reviewing / editing / approving customer quotations — connect a Supabase project:

1. Create a project at supabase.com (the free plan is enough to start; note that free projects pause after a period of inactivity).
2. In **SQL Editor**, run `supabase/migrations/20261017000000_cabin_designer.sql`.
3. In the SQL editor, set the admin password (10+ characters): `select public.admin_set_password('choose-a-strong-password');`
4. In Vercel → Project → Settings → Environment Variables add `SUPABASE_URL` (Project Settings → API → Project URL) and `SUPABASE_ANON_KEY` (the anon / publishable key), then redeploy.
5. Open `/light/en/admin`, log in, and enter your rates in **Prices**.

Security: all tables have Row Level Security with no direct access; the website calls checked database functions from the server only. Admin sessions use an http-only cookie, expire after 12 hours, and logins lock for 15 minutes after 8 wrong passwords. Customers can only open their own quotation (reference + random access key).

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
| Cabin designer text (EN + AR) | `src/i18n/designer.ts` |
| Designer defaults: layout rules, rate card, templates, Aramco flags (used when no database) | `src/lib/designer/config.ts` |
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
      designer/             cabin designer + design quotation
      admin/                admin panel (prices, rules, requests)
    api/assistant/          optional AI answers (server-side)
    api/designer/, api/admin/  designer settings, AI actions, quotation requests, admin
    sitemap.ts, robots.ts, icon.svg, globals.css
  components/
    drawings/               FloorPlan, DimensionDiagram, AccommodationDrawings (SVG)
    assistant/              cabin consultant chat + quotation document
    product/ catalog/ compare/ contact/ layout/ home/ ui/
  data/                     products, plans, accommodation, company
  i18n/                     locales, dictionaries
  lib/                      routes, WhatsApp links, SEO, formatting
  lib/assistant/            consultant engine, catalogue knowledge, quotation, AI guard
  lib/designer/             designer config, layout engine, pricing, text parser, database access
supabase/migrations/        database schema and functions for the designer
public/images/              optimised photographs (WebP)
scripts/validate-catalog.mjs
docs/                       product inventory and QA report
```

Stack: Next.js 16 (App Router, static generation), React 19, TypeScript, Tailwind CSS 3, self-hosted fonts (Manrope, IBM Plex Sans Arabic, IBM Plex Mono via Fontsource).
