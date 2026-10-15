"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { products } from "@/data/products";

const KEY = "sbt-cabins-compare";
const EVENT = "sbt-compare-change";
export const MAX_COMPARE = 4;
const valid = new Set(products.map((p) => p.slug));

/* A tiny localStorage-backed store, read through useSyncExternalStore. */
let memory = "[]"; // fallback when storage is unavailable (private mode etc.)

function read(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "[]";
  } catch {
    return memory;
  }
}

function write(next: string[]) {
  const raw = JSON.stringify(next);
  memory = raw;
  try {
    window.localStorage.setItem(KEY, raw);
  } catch {
    /* ignore — the in-memory value is used instead */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function parse(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string" && valid.has(s)).slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

type Ctx = {
  selected: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  set: (slugs: string[]) => void;
  clear: () => void;
};

const CompareCtx = createContext<Ctx | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");

  const value = useMemo<Ctx>(() => {
    const selected = parse(raw);
    return {
      selected,
      has: (slug) => selected.includes(slug),
      toggle: (slug) => {
        const current = parse(read());
        if (current.includes(slug)) write(current.filter((s) => s !== slug));
        else if (current.length < MAX_COMPARE) write([...current, slug]);
        else write([...current.slice(1), slug]);
      },
      set: (slugs) => write(Array.from(new Set(slugs.filter((s) => valid.has(s)))).slice(0, MAX_COMPARE)),
      clear: () => write([]),
    };
  }, [raw]);

  return <CompareCtx.Provider value={value}>{children}</CompareCtx.Provider>;
}

export function useCompare(): Ctx {
  const ctx = useContext(CompareCtx);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
}
