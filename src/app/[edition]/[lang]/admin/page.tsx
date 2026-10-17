import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { AdminPanel } from "@/components/designer/AdminPanel";

type Params = Promise<{ edition: string; lang: string }>;

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage({ params }: { params: Params }) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "en";
  return (
    <section className="container pb-24 pt-10">
      <h1 className="mb-6 text-2xl font-extrabold">{locale === "ar" ? "لوحة الإدارة — مصمم الكبائن" : "Admin — Cabin designer"}</h1>
      <AdminPanel locale={locale} />
    </section>
  );
}
