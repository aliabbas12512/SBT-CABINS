import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/i18n/dictionaries";
import { products } from "@/data/products";
import { Logo } from "@/components/ui/Logo";
import { IconArrow } from "@/components/ui/Icons";

/**
 * Edition selector at "/". Each preview card is rendered in its own edition's
 * tokens (data-edition), so visitors see the real palette of each version.
 */
function Preview({ edition }: { edition: "light" | "dark" }) {
  const en = getDictionary("en");
  const ar = getDictionary("ar");
  const isLight = edition === "light";
  return (
    <div data-edition={edition} className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-line bg-bg text-ink-2 shadow-lift transition duration-500 hover:-translate-y-1">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image src="/images/exterior/hero-cabin.webp" alt="" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" priority />
        <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
        <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <Logo />
            <span className="rounded-full bg-accent px-3 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-accent-ink">{isLight ? en.switcher.light : en.switcher.dark}</span>
          </div>
          <div className="max-w-[70%]">
            <p className="eyebrow">{en.home.eyebrow.split(" · ")[0]}</p>
            <p className="mt-2 font-display text-xl font-extrabold leading-tight text-ink sm:text-2xl">{en.home.title}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-5 border-t border-line bg-surface p-6 sm:p-7">
        <div>
          <h2 className="text-xl font-bold">{isLight ? en.switcher.lightEdition : en.switcher.darkEdition}</h2>
          <p className="mt-1 text-sm text-muted">{isLight ? en.gate.lightDesc : en.gate.darkDesc}</p>
          <p className="mt-3 text-sm text-muted" dir="rtl" lang="ar">
            <span className="font-semibold text-ink">{isLight ? ar.switcher.lightEdition : ar.switcher.darkEdition}</span> — {isLight ? ar.gate.lightDesc : ar.gate.darkDesc}
          </p>
        </div>
        <div className="mt-auto flex flex-wrap gap-3">
          <Link href={`/${edition}/en`} className="btn-primary flex-1">
            {isLight ? en.gate.openLight : en.gate.openDark} · EN
            <IconArrow width={16} height={16} />
          </Link>
          <Link href={`/${edition}/ar`} lang="ar" className="btn-outline flex-1">
            {isLight ? ar.gate.openLight : ar.gate.openDark} · العربية
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function GatePage() {
  const en = getDictionary("en");
  const ar = getDictionary("ar");

  return (
    <main className="atmosphere relative min-h-screen bg-bg">
      <div className="container py-12 sm:py-16">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="num text-xs text-muted">{products.length} products · EN | العربية</span>
        </div>
        <div className="mx-auto mt-14 max-w-3xl text-center">
          <p className="eyebrow">{en.gate.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">{en.gate.title}</h1>
          <p className="mt-2 text-2xl font-bold text-ink" lang="ar" dir="rtl">{ar.gate.title}</p>
          <p className="mt-5 text-muted">{en.gate.lead}</p>
          <p className="mt-2 text-muted" lang="ar" dir="rtl">{ar.gate.lead}</p>
        </div>
        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <Preview edition="light" />
          <Preview edition="dark" />
        </div>
      </div>
    </main>
  );
}
