import Link from "next/link";

/** Shown for unknown product slugs inside a valid edition/language. */
export default function NotFound() {
  return (
    <section className="container flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-4xl font-extrabold">Page not found · الصفحة غير موجودة</h1>
      <p className="mt-4 max-w-md text-muted">The page you are looking for does not exist or has moved.</p>
      <p className="mt-1 max-w-md text-muted" lang="ar" dir="rtl">الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/light/en" className="btn-primary">Home</Link>
        <Link href="/light/ar" className="btn-outline" lang="ar">الرئيسية</Link>
      </div>
    </section>
  );
}
