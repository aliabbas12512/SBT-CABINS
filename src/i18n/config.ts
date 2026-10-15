export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const editions = ["light", "dark"] as const;
export type Edition = (typeof editions)[number];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function isEdition(value: string): value is Edition {
  return (editions as readonly string[]).includes(value);
}

export function dirOf(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Text available in both interface languages. */
export type Localized = { en: string; ar: string };
export type LocalizedList = { en: string[]; ar: string[] };

export function t(value: Localized, locale: Locale): string {
  return value[locale];
}
