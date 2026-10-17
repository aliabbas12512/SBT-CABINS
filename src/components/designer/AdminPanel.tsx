"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getDesignerDict } from "@/i18n/designer";
import {
  DEFAULT_SETTINGS,
  EXTRA_IDS,
  EXTRA_LABELS,
  normalizeSettings,
  SPACE_KINDS,
  type CategoryRates,
  type DesignerSettings,
} from "@/lib/designer/config";
import { sanitizeDesign } from "@/lib/designer/design";
import { layoutDesign } from "@/lib/designer/layout";
import { lineLabel, sar, summary } from "@/lib/designer/present";
import type { Estimate } from "@/lib/designer/pricing";
import { FloorPlan } from "@/components/drawings/FloorPlan";
import type { Approved } from "./DesignQuotation";

type Req = {
  ref: string;
  key: string;
  createdAt: string;
  lang: Locale;
  customer: Record<string, string>;
  design: unknown;
  estimate: Estimate;
  service: string | null;
  status: string;
  adminNotes: string | null;
  approved: Approved | null;
  approvedAt: string | null;
};

const STATUSES = ["new", "reviewing", "quoted", "approved", "rejected", "closed"] as const;
const RATE_KEYS: (keyof CategoryRates)[] = ["perSqm", "laborPerSqm", "room", "toilet", "bathroom", "toiletBath", "kitchenette", "storage", "extraWindow", "heightPer10cm"];
const input = "min-h-[38px] w-full rounded-lg border border-line bg-bg px-2.5 text-sm text-ink focus:border-accent focus:outline-none";

export function AdminPanel({ locale }: { locale: Locale }) {
  const L = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const [state, setState] = useState<{ db: boolean; loggedIn: boolean } | null>(null);
  const [tab, setTab] = useState<"requests" | "prices" | "rules" | "templates" | "password">("requests");
  const [settings, setSettings] = useState<DesignerSettings>(DEFAULT_SETTINGS);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(() => {
    fetch("/api/admin/login", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setState({ db: Boolean(j.db), loggedIn: Boolean(j.loggedIn) }))
      .catch(() => setState({ db: false, loggedIn: false }));
    fetch("/api/designer/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setSettings(normalizeSettings(j.settings)))
      .catch(() => {});
  }, []);
  useEffect(refresh, [refresh]);

  const onUnauthorized = () => setState((s) => (s ? { ...s, loggedIn: false } : s));

  async function save(next: DesignerSettings) {
    setMsg(null);
    const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(next) });
    if (res.status === 401) return onUnauthorized();
    if (!res.ok) return setMsg(L("Could not save. Please try again.", "تعذّر الحفظ. حاول مرة أخرى."));
    const j = (await res.json()) as { settings: unknown };
    setSettings(normalizeSettings(j.settings));
    setMsg(L("Saved. The designer uses the new settings within 30 seconds.", "تم الحفظ. يستخدم المصمم الإعدادات الجديدة خلال 30 ثانية."));
  }

  if (!state) return <p className="text-sm text-muted">{getDictionary(locale).common.loading}</p>;

  if (!state.db) {
    return (
      <div className="max-w-2xl rounded-2xl border border-line bg-surface p-6 text-sm" data-testid="admin-setup">
        <h2 className="text-lg font-bold">{L("Database not connected", "قاعدة البيانات غير متصلة")}</h2>
        <p className="mt-2 text-muted">
          {L(
            "The cabin designer works with the bundled default settings (all rates “Pending Confirmation”). To manage prices and quotation requests here, connect the Supabase database:",
            "يعمل مصمم الكبائن بالإعدادات الافتراضية (جميع الأسعار «بانتظار التأكيد»). لإدارة الأسعار وطلبات عروض الأسعار من هنا، اربط قاعدة بيانات Supabase:",
          )}
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 ps-5">
          <li>{L("Create a Supabase project and run supabase/migrations/20261017000000_cabin_designer.sql in its SQL editor.", "أنشئ مشروع Supabase وشغّل الملف supabase/migrations/20261017000000_cabin_designer.sql في محرر SQL.")}</li>
          <li>
            {L("Set the admin password in the SQL editor:", "عيّن كلمة مرور المسؤول في محرر SQL:")} <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">select public.admin_set_password(&apos;…&apos;);</code>
          </li>
          <li>{L("Add SUPABASE_URL and SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables, then redeploy.", "أضف SUPABASE_URL و SUPABASE_ANON_KEY في Vercel ← Settings ← Environment Variables ثم أعد النشر.")}</li>
        </ol>
      </div>
    );
  }

  if (!state.loggedIn) return <Login locale={locale} onDone={refresh} />;

  const tabs: [typeof tab, string][] = [
    ["requests", L("Quotation requests", "طلبات عروض الأسعار")],
    ["prices", L("Prices", "الأسعار")],
    ["rules", L("Rules & specifications", "القواعد والمواصفات")],
    ["templates", L("Templates", "التصاميم الجاهزة")],
    ["password", L("Password", "كلمة المرور")],
  ];

  return (
    <div data-testid="admin-panel">
      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        {tabs.map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setTab(k);
              setMsg(null);
            }}
            className={`min-h-[38px] rounded-full px-4 text-xs font-semibold ${tab === k ? "bg-accent text-accent-ink" : "border border-line text-ink hover:border-accent"}`}
            data-testid={`admin-tab-${k}`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            refresh();
          }}
          className="ms-auto min-h-[38px] rounded-full px-3 text-xs font-semibold text-muted hover:text-ink"
        >
          {L("Log out", "تسجيل الخروج")}
        </button>
      </div>
      {msg && (
        <p className="mb-4 rounded-xl border border-accent/40 bg-accent/5 px-4 py-2 text-sm" role="status" data-testid="admin-msg">
          {msg}
        </p>
      )}
      {tab === "requests" && <Requests locale={locale} settings={settings} onUnauthorized={onUnauthorized} />}
      {tab === "prices" && <Prices locale={locale} settings={settings} onSave={save} />}
      {tab === "rules" && <Rules locale={locale} settings={settings} onSave={save} />}
      {tab === "templates" && <Templates locale={locale} settings={settings} onSave={save} />}
      {tab === "password" && <Password locale={locale} onDone={refresh} />}
    </div>
  );
}

function Login({ locale, onDone }: { locale: Locale; onDone: () => void }) {
  const L = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (res.ok) return onDone();
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setErr(
      j.error === "locked"
        ? L("Too many attempts. Try again in 15 minutes.", "محاولات كثيرة. حاول بعد 15 دقيقة.")
        : j.error === "not_configured"
          ? L("Admin password not set yet (see README).", "لم تُعيَّن كلمة مرور المسؤول بعد (انظر README).")
          : L("Wrong password.", "كلمة مرور غير صحيحة."),
    );
  }
  return (
    <form onSubmit={submit} className="max-w-sm rounded-2xl border border-line bg-surface p-6" data-testid="admin-login">
      <label className="block text-sm font-semibold" htmlFor="admin-pw">
        {L("Admin password", "كلمة مرور المسؤول")}
      </label>
      <input id="admin-pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className={`${input} mt-2`} />
      {err && <p className="mt-2 text-xs font-semibold text-accent">{err}</p>}
      <button type="submit" className="btn-primary mt-4 w-full">
        {L("Log in", "تسجيل الدخول")}
      </button>
    </form>
  );
}

const numOrNull = (v: string): number | null => (v.trim() === "" ? null : Number(v));

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <h3 className="mb-3 text-sm font-bold">{title}</h3>
      {children}
    </section>
  );
}

function Prices({ locale, settings, onSave }: { locale: Locale; settings: DesignerSettings; onSave: (s: DesignerSettings) => void }) {
  const L = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const t = getDesignerDict(locale);
  const [r, setR] = useState(settings.rates);
  const labels: Record<keyof CategoryRates, string> = {
    perSqm: L("Structure & standard finish — per m²", "الهيكل والتشطيب القياسي — لكل م²"),
    laborPerSqm: L("Labour — per m²", "الأجور — لكل م²"),
    room: L("Per room / partition", "لكل غرفة / قاطع"),
    toilet: L("Per toilet (WC + basin)", "لكل دورة مياه"),
    bathroom: L("Per bathroom (shower + basin)", "لكل حمّام"),
    toiletBath: L("Per toilet + bath unit", "لكل حمّام + مرحاض"),
    kitchenette: L("Per kitchenette", "لكل مطبخ صغير"),
    storage: L("Per storage room", "لكل مخزن"),
    extraWindow: L("Per additional window", "لكل نافذة إضافية"),
    heightPer10cm: L("Extra height — per 10 cm", "ارتفاع إضافي — لكل 10 سم"),
  };
  const cell = (cat: "normal" | "aramco", k: keyof CategoryRates) => (
    <input
      type="number"
      min={0}
      step="any"
      value={r[cat][k] ?? ""}
      placeholder={t.price.pending}
      onChange={(e) => setR({ ...r, [cat]: { ...r[cat], [k]: numOrNull(e.target.value) } })}
      className={`${input} num`}
      aria-label={`${labels[k]} — ${cat}`}
      data-testid={`rate-${cat}-${k}`}
    />
  );
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        {L(
          "All amounts in SAR, excluding VAT. Leave a field empty to show “Pending Confirmation” to customers. Designs that exactly match a catalogue model use the catalogue price until all cabin rates are set.",
          "جميع المبالغ بالريال بدون الضريبة. اترك الحقل فارغاً ليظهر للعميل «بانتظار التأكيد». التصاميم المطابقة لطراز في الكتالوج تستخدم سعره حتى تُحدَّد جميع أسعار الكبينة.",
        )}
      </p>
      <Card title={L("Cabin rates", "أسعار الكبينة")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-xs">
            <thead>
              <tr className="text-muted">
                <th className="p-1.5 text-start font-semibold" />
                <th className="p-1.5 text-start font-semibold">{t.controls.normal}</th>
                <th className="p-1.5 text-start font-semibold">{t.controls.aramco}</th>
              </tr>
            </thead>
            <tbody>
              {RATE_KEYS.map((k) => (
                <tr key={k}>
                  <td className="p-1.5">{labels[k]}</td>
                  <td className="p-1.5">{cell("normal", k)}</td>
                  <td className="p-1.5">{cell("aramco", k)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title={L("Accessories & extras — per item", "الملحقات والإضافات — لكل قطعة")}>
        <div className="grid gap-2 sm:grid-cols-2">
          {EXTRA_IDS.map((id) => (
            <label key={id} className="flex items-center justify-between gap-2 text-xs">
              <span>{EXTRA_LABELS[id][locale]}</span>
              <input
                type="number"
                min={0}
                step="any"
                value={r.extras[id] ?? ""}
                placeholder={t.price.pending}
                onChange={(e) => setR({ ...r, extras: { ...r.extras, [id]: numOrNull(e.target.value) } })}
                className={`${input} num max-w-[140px]`}
              />
            </label>
          ))}
        </div>
      </Card>
      <Card title={L("Transport, installation, margin & terms", "النقل والتركيب والهامش والشروط")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["delivery", L("Delivery / transport — per cabin", "التوصيل / النقل — لكل كبينة")],
              ["installation", L("Installation — per cabin", "التركيب — لكل كبينة")],
              ["marginPct", L("Profit margin %", "هامش الربح %")],
              ["validityDays", L("Quotation validity (days)", "صلاحية العرض (أيام)")],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="block text-xs">
              <span className="text-muted">{label}</span>
              <input type="number" min={0} step="any" value={r[k] ?? ""} placeholder={t.price.pending} onChange={(e) => setR({ ...r, [k]: numOrNull(e.target.value) })} className={`${input} num mt-1`} data-testid={`rate-${k}`} />
            </label>
          ))}
          <label className="block text-xs">
            <span className="text-muted">{L("VAT %", "ضريبة القيمة المضافة %")}</span>
            <input type="number" min={0} max={100} step="any" value={Math.round(r.vatRate * 10000) / 100} onChange={(e) => setR({ ...r, vatRate: (Number(e.target.value) || 0) / 100 })} className={`${input} num mt-1`} />
          </label>
          {(["deliveryTime", "paymentTerms"] as const).map((k) => (
            <div key={k} className="space-y-1 text-xs sm:col-span-2">
              <span className="text-muted">{k === "deliveryTime" ? L("Estimated delivery time", "مدة التسليم المتوقعة") : L("Payment terms", "شروط الدفع")}</span>
              <div className="grid gap-2 sm:grid-cols-2">
                <input placeholder="English" value={r[k]?.en ?? ""} onChange={(e) => setR({ ...r, [k]: { en: e.target.value, ar: r[k]?.ar ?? "" } })} className={input} dir="ltr" />
                <input placeholder="العربية" value={r[k]?.ar ?? ""} onChange={(e) => setR({ ...r, [k]: { en: r[k]?.en ?? "", ar: e.target.value } })} className={input} dir="rtl" />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <button type="button" className="btn-primary" onClick={() => onSave({ ...settings, rates: r })} data-testid="save-prices">
        {L("Save prices", "حفظ الأسعار")}
      </button>
    </div>
  );
}

const rowsToText = (rows: DesignerSettings["specs"]["normal"]) => rows.map((r) => [r.label.en, r.value.en, r.label.ar, r.value.ar].join(" | ")).join("\n");
const textToRows = (s: string) =>
  s
    .split("\n")
    .map((l) => l.split("|").map((x) => x.trim()))
    .filter((p) => p.length >= 2 && p[0] && p[1])
    .map(([le, ve, la, va]) => ({ label: { en: le, ar: la || le }, value: { en: ve, ar: va || ve } }));

function Rules({ locale, settings, onSave }: { locale: Locale; settings: DesignerSettings; onSave: (s: DesignerSettings) => void }) {
  const L = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const t = getDesignerDict(locale);
  const [rules, setRules] = useState(settings.rules);
  const [specs, setSpecs] = useState(settings.specs);
  const [presets, setPresets] = useState(settings.rules.presets.map((p) => `${p.length}x${p.width}`).join(", "));
  const [normalText, setNormalText] = useState(rowsToText(settings.specs.normal));
  const [aramcoText, setAramcoText] = useState(rowsToText(settings.specs.aramco));
  const numField = (k: keyof typeof rules, label: string) => (
    <label key={k} className="block text-xs">
      <span className="text-muted">{label}</span>
      <input type="number" step="any" value={rules[k] as number} onChange={(e) => setRules({ ...rules, [k]: Number(e.target.value) })} className={`${input} num mt-1`} />
    </label>
  );
  const unitField = (k: "toilet" | "bathroom" | "toiletBath", label: string) => (
    <div key={k} className="text-xs">
      <span className="text-muted">{label}</span>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <input type="number" step="any" value={rules[k].length} onChange={(e) => setRules({ ...rules, [k]: { ...rules[k], length: Number(e.target.value) } })} className={`${input} num`} aria-label={`${label} length`} />
        <input type="number" step="any" value={rules[k].depth} onChange={(e) => setRules({ ...rules, [k]: { ...rules[k], depth: Number(e.target.value) } })} className={`${input} num`} aria-label={`${label} depth`} />
      </div>
    </div>
  );
  return (
    <div className="space-y-4">
      <Card title={L("Dimensions & layout rules (metres)", "الأبعاد وقواعد التوزيع (بالمتر)")}>
        <div className="grid gap-3 sm:grid-cols-3">
          {numField("minLength", L("Min length", "أقل طول"))}
          {numField("maxLength", L("Max length", "أقصى طول"))}
          {numField("minWidth", L("Min width", "أقل عرض"))}
          {numField("maxWidth", L("Max width", "أقصى عرض"))}
          {numField("minHeight", L("Min height", "أقل ارتفاع"))}
          {numField("maxHeight", L("Max height", "أقصى ارتفاع"))}
          {numField("standardHeight", L("Standard height", "الارتفاع القياسي"))}
          {numField("maxSpaces", L("Max rooms/units per cabin", "أقصى عدد غرف/وحدات"))}
          {numField("minRoom", L("Min room length", "أقل طول للغرفة"))}
          {numField("minBedroom", L("Min bedroom length", "أقل طول لغرفة النوم"))}
          {numField("minKitchenette", L("Kitchenette length", "طول المطبخ الصغير"))}
          {numField("minStorage", L("Storage length", "طول المخزن"))}
          {numField("minLobby", L("Min lobby depth", "أقل عمق للممر"))}
          {numField("doorWidth", L("Door width", "عرض الباب"))}
          {numField("windowWidth", L("Window width", "عرض النافذة"))}
          {unitField("toilet", L("Toilet: length × depth", "دورة المياه: الطول × العمق"))}
          {unitField("bathroom", L("Bathroom: length × depth", "الحمّام: الطول × العمق"))}
          {unitField("toiletBath", L("Toilet + bath: length × depth", "حمّام + مرحاض: الطول × العمق"))}
          <label className="block text-xs sm:col-span-3">
            <span className="text-muted">{L("Size presets (e.g. 12x3.75, 6x3.75)", "مقاسات جاهزة (مثل 12x3.75, 6x3.75)")}</span>
            <input value={presets} onChange={(e) => setPresets(e.target.value)} className={`${input} mt-1`} dir="ltr" />
          </label>
        </div>
      </Card>
      <Card title={L("Aramco validation", "مراجعة أرامكو")}>
        <p className="mb-2 text-xs text-muted">
          {L(
            "Mark each option as covered by your verified Aramco catalogue specification, or as requiring engineering approval.",
            "حدّد لكل خيار هل هو ضمن مواصفات أرامكو المعتمدة لديكم في الكتالوج أم يحتاج موافقة هندسية.",
          )}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SPACE_KINDS.map((k) => (
            <label key={k} className="flex items-center justify-between gap-2 text-xs">
              <span>{t.controls.kinds[k]}</span>
              <select value={specs.aramcoModules[k]} onChange={(e) => setSpecs({ ...specs, aramcoModules: { ...specs.aramcoModules, [k]: e.target.value as "catalogue" | "approval" } })} className={`${input} max-w-[200px]`}>
                <option value="catalogue">{t.price.catalogue}</option>
                <option value="approval">{t.price.approval}</option>
              </select>
            </label>
          ))}
          {EXTRA_IDS.map((id) => (
            <label key={id} className="flex items-center justify-between gap-2 text-xs">
              <span>{EXTRA_LABELS[id][locale]}</span>
              <select value={specs.aramcoExtras[id]} onChange={(e) => setSpecs({ ...specs, aramcoExtras: { ...specs.aramcoExtras, [id]: e.target.value as "catalogue" | "approval" } })} className={`${input} max-w-[200px]`}>
                <option value="catalogue">{t.price.catalogue}</option>
                <option value="approval">{t.price.approval}</option>
              </select>
            </label>
          ))}
        </div>
      </Card>
      <Card title={L("Specifications shown to customers", "المواصفات المعروضة للعملاء")}>
        <p className="mb-2 text-xs text-muted">{L("One row per line: Label EN | Value EN | Label AR | Value AR", "صف لكل سطر: العنوان EN | القيمة EN | العنوان AR | القيمة AR")}</p>
        <div className="grid gap-3 lg:grid-cols-2">
          <label className="block text-xs">
            <span className="font-semibold">{t.controls.normal}</span>
            <textarea value={normalText} onChange={(e) => setNormalText(e.target.value)} rows={10} className={`${input} mt-1 py-2 font-mono text-xs`} />
          </label>
          <label className="block text-xs">
            <span className="font-semibold">{t.controls.aramco}</span>
            <textarea value={aramcoText} onChange={(e) => setAramcoText(e.target.value)} rows={10} className={`${input} mt-1 py-2 font-mono text-xs`} />
          </label>
        </div>
      </Card>
      <button
        type="button"
        className="btn-primary"
        onClick={() =>
          onSave(
            normalizeSettings({
              ...settings,
              rules: {
                ...rules,
                presets: presets
                  .split(/[,\s]+/)
                  .map((p) => p.split(/x|×/i).map(Number))
                  .filter((p) => p.length === 2 && p[0] > 0 && p[1] > 0)
                  .map(([length, width]) => ({ length, width })),
              },
              specs: { ...specs, normal: textToRows(normalText), aramco: textToRows(aramcoText) },
            }),
          )
        }
      >
        {L("Save rules & specifications", "حفظ القواعد والمواصفات")}
      </button>
    </div>
  );
}

function Templates({ locale, settings, onSave }: { locale: Locale; settings: DesignerSettings; onSave: (s: DesignerSettings) => void }) {
  const L = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const [text, setText] = useState(JSON.stringify(settings.templates, null, 2));
  const [err, setErr] = useState<string | null>(null);
  return (
    <Card title={L("Design templates", "التصاميم الجاهزة")}>
      <p className="mb-2 text-xs text-muted">
        {L(
          'JSON list. Each template: id, name {en, ar}, length, width, spaces [{kind: room|toilet|bathroom|toiletBath|kitchenette|storage, use?: bedroom|office|living}]. The first template is the default design.',
          'قائمة JSON. كل تصميم: id و name {en, ar} و length و width و spaces [{kind, use}]. التصميم الأول هو الافتراضي.',
        )}
      </p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={18} className={`${input} py-2 font-mono text-xs`} dir="ltr" />
      {err && <p className="mt-2 text-xs font-semibold text-accent">{err}</p>}
      <button
        type="button"
        className="btn-primary mt-3"
        onClick={() => {
          try {
            const parsed = JSON.parse(text) as unknown[];
            const next = normalizeSettings({ ...settings, templates: parsed });
            if (!Array.isArray(parsed) || next.templates.length !== parsed.length) throw new Error();
            setErr(null);
            onSave(next);
          } catch {
            setErr(L("Invalid template JSON — check every template has a name and at least one valid space.", "صيغة JSON غير صحيحة — تأكد أن لكل تصميم اسماً ومساحة صالحة واحدة على الأقل."));
          }
        }}
      >
        {L("Save templates", "حفظ التصاميم")}
      </button>
    </Card>
  );
}

function Password({ locale, onDone }: { locale: Locale; onDone: () => void }) {
  const L = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (next.length < 10) return setMsg(L("Use at least 10 characters.", "استخدم 10 أحرف على الأقل."));
    const res = await fetch("/api/admin/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ current: cur, next }) });
    if (res.ok) return onDone();
    setMsg(L("Could not change the password — check the current password.", "تعذّر تغيير كلمة المرور — تحقق من كلمة المرور الحالية."));
  }
  return (
    <form onSubmit={submit} className="max-w-sm space-y-3 rounded-2xl border border-line bg-surface p-5">
      <input type="password" autoComplete="current-password" placeholder={L("Current password", "كلمة المرور الحالية")} value={cur} onChange={(e) => setCur(e.target.value)} className={input} />
      <input type="password" autoComplete="new-password" placeholder={L("New password (10+ characters)", "كلمة مرور جديدة (10 أحرف فأكثر)")} value={next} onChange={(e) => setNext(e.target.value)} className={input} />
      {msg && <p className="text-xs font-semibold text-accent">{msg}</p>}
      <button type="submit" className="btn-primary w-full">
        {L("Change password", "تغيير كلمة المرور")}
      </button>
    </form>
  );
}

function Requests({ locale, settings, onUnauthorized }: { locale: Locale; settings: DesignerSettings; onUnauthorized: () => void }) {
  const L = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const t = getDesignerDict(locale);
  const [list, setList] = useState<Req[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(() => {
    fetch("/api/admin/requests", { cache: "no-store" })
      .then((r) => {
        if (r.status === 401) onUnauthorized();
        return r.ok ? r.json() : [];
      })
      .then((j) => setList(Array.isArray(j) ? (j as Req[]) : []))
      .catch(() => setList([]));
  }, [onUnauthorized]);
  useEffect(load, [load]);

  if (!list) return <p className="text-sm text-muted">…</p>;
  const shown = list.filter((r) => filter === "all" || r.status === filter);
  const current = list.find((r) => r.ref === open);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="rounded-2xl border border-line bg-surface p-3">
        <div className="mb-2 flex flex-wrap gap-1">
          {["all", ...STATUSES].map((s) => (
            <button key={s} type="button" onClick={() => setFilter(s)} className={`min-h-[30px] rounded-full px-2.5 text-[0.7rem] font-semibold ${filter === s ? "bg-accent text-accent-ink" : "text-muted ring-1 ring-line"}`}>
              {s === "all" ? L("All", "الكل") : ((t.quote.statuses as Record<string, string>)[s] ?? s)} ({s === "all" ? list.length : list.filter((r) => r.status === s).length})
            </button>
          ))}
        </div>
        {shown.length === 0 && <p className="p-3 text-sm text-muted">{L("No requests yet.", "لا توجد طلبات بعد.")}</p>}
        <ul className="divide-y divide-line" data-testid="admin-requests">
          {shown.map((r) => {
            const d = sanitizeDesign(r.design, settings);
            return (
              <li key={r.ref}>
                <button type="button" onClick={() => setOpen(r.ref)} className={`w-full px-2 py-2.5 text-start text-xs ${open === r.ref ? "bg-surface-2" : "hover:bg-surface-2"}`}>
                  <span className="flex justify-between gap-2">
                    <span className="num font-bold">{r.ref}</span>
                    <span className="text-muted">{(t.quote.statuses as Record<string, string>)[r.status] ?? r.status}</span>
                  </span>
                  <span className="block text-ink">
                    {r.customer?.name} {r.customer?.company ? `— ${r.customer.company}` : ""}
                  </span>
                  <span className="block text-muted">{d ? summary(d, locale) : "—"}</span>
                  <span className="num block text-muted">{new Date(r.createdAt).toLocaleString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB")}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {current ? <RequestDetail key={current.ref} req={current} locale={locale} settings={settings} onSaved={load} onUnauthorized={onUnauthorized} /> : <p className="text-sm text-muted">{L("Select a request.", "اختر طلباً.")}</p>}
    </div>
  );
}

function RequestDetail({ req, locale, settings, onSaved, onUnauthorized }: { req: Req; locale: Locale; settings: DesignerSettings; onSaved: () => void; onUnauthorized: () => void }) {
  const L = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const t = getDesignerDict(locale);
  const dict = getDictionary(locale);
  const d = sanitizeDesign(req.design, settings);
  const lay = d ? layoutDesign(d, settings.rules) : null;
  const est = req.estimate;
  const qty = d?.quantity ?? 1;
  const initialLines =
    req.approved?.lines ??
    [
      ...(est?.cabinLines ?? []).map((l) => ({ l, k: qty })),
      ...(est?.extraLines ?? []).map((l) => ({ l, k: qty })),
      ...(est?.serviceLines ?? []).map((l) => ({ l, k: 1 })),
    ].map(({ l, k }) => {
      // Lines without a per-unit rate (margin, catalogue price) are a single amount per cabin.
      const hasUnit = l.unit !== undefined && l.unit !== null && l.qty !== undefined;
      const q = hasUnit ? l.qty! * k : k;
      const unit = hasUnit ? l.unit! : (l.amount ?? 0);
      return { label: lineLabel(l, req.lang), qty: q, unit, amount: Math.round(q * unit * 100) / 100 };
    });
  const [lines, setLines] = useState(initialLines);
  const [status, setStatus] = useState(req.status);
  const [notes, setNotes] = useState(req.adminNotes ?? "");
  const [terms, setTerms] = useState({
    deliveryTime: req.approved?.deliveryTime ?? settings.rates.deliveryTime?.[req.lang] ?? "",
    paymentTerms: req.approved?.paymentTerms ?? settings.rates.paymentTerms?.[req.lang] ?? "",
    validityDays: req.approved?.validityDays ?? settings.rates.validityDays ?? 30,
    notes: req.approved?.notes ?? "",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const vatRate = settings.rates.vatRate;
  const subtotal = Math.round(lines.reduce((a, l) => a + (Number(l.amount) || 0), 0) * 100) / 100;
  const vat = Math.round(subtotal * vatRate * 100) / 100;
  const link = typeof window !== "undefined" ? `${window.location.origin}/light/${req.lang}/designer/quotation#r=${req.ref}&k=${req.key}` : "";
  const phoneDigits = (req.customer?.phone ?? "").replace(/\D/g, "").replace(/^0(5\d{8})$/, "966$1").replace(/^00/, "");

  async function patch(body: Record<string, unknown>) {
    setMsg(null);
    const res = await fetch("/api/admin/requests", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ref: req.ref, ...body }) });
    if (res.status === 401) return onUnauthorized();
    setMsg(res.ok ? L("Saved.", "تم الحفظ.") : L("Could not save — check the amounts.", "تعذّر الحفظ — تحقق من المبالغ."));
    if (res.ok) onSaved();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-4" data-testid="admin-request-detail">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="num text-sm font-bold">{req.ref}</p>
          <p className="text-xs text-muted">{d ? summary(d, locale) : ""}</p>
        </div>
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-accent hover:underline">
          {L("Open customer quotation ↗", "فتح عرض العميل ↗")}
        </a>
      </div>
      <dl className="grid gap-x-6 text-xs sm:grid-cols-2">
        {(["name", "company", "phone", "email", "location", "notes"] as const).map((k) =>
          req.customer?.[k] ? (
            <div key={k} className="flex justify-between gap-3 border-b border-line py-1">
              <dt className="text-muted">{k}</dt>
              <dd className="text-end font-medium">{req.customer[k]}</dd>
            </div>
          ) : null,
        )}
        <div className="flex justify-between gap-3 border-b border-line py-1">
          <dt className="text-muted">service</dt>
          <dd className="font-medium">{req.service ? t.form.services[req.service as keyof typeof t.form.services] : "—"}</dd>
        </div>
      </dl>
      {lay?.plan && (
        <div className="grid-paper rounded-xl border border-line p-2" style={{ backgroundColor: "var(--dw-paper)" }}>
          <FloorPlan plan={lay.plan} locale={locale} dict={dict} title={req.ref} className="h-auto w-full" />
        </div>
      )}
      {est && (
        <p className="text-xs text-muted">
          {L("Website estimate at submission", "تقدير الموقع عند الإرسال")}: <span className="num font-semibold text-ink">{est.total !== null ? sar(est.total, locale) : `${t.price.pending} (${sar(est.pricedTotal ?? 0, locale)} ${L("priced", "مسعّر")})`}</span>
        </p>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs">
          <span className="text-muted">{t.quote.status}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${input} mt-1`}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {(t.quote.statuses as Record<string, string>)[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[200px] flex-1 text-xs">
          <span className="text-muted">{L("Internal notes", "ملاحظات داخلية")}</span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={`${input} mt-1`} />
        </label>
        <button type="button" onClick={() => patch({ status, adminNotes: notes })} className="min-h-[38px] rounded-full border border-line px-4 text-xs font-semibold hover:border-accent">
          {L("Save", "حفظ")}
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold">{L("Quotation lines (edit before approving)", "بنود عرض السعر (عدّلها قبل الاعتماد)")}</p>
        <div className="space-y-1.5">
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_64px_96px_104px_32px] items-center gap-1.5 text-xs">
              <input value={l.label} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className={input} aria-label="label" />
              <input
                type="number"
                min={0}
                value={l.qty}
                onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value), amount: Math.round(Number(e.target.value) * x.unit * 100) / 100 } : x)))}
                className={`${input} num`}
                aria-label="qty"
              />
              <input
                type="number"
                min={0}
                step="any"
                value={l.unit}
                onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, unit: Number(e.target.value), amount: Math.round(Number(e.target.value) * x.qty * 100) / 100 } : x)))}
                className={`${input} num`}
                aria-label="unit"
              />
              <span className="num text-end font-semibold">{sar(l.amount, locale)}</span>
              <button type="button" onClick={() => setLines(lines.filter((_, j) => j !== i))} aria-label="remove" className="h-8 w-8 rounded-full text-muted hover:bg-surface-2">
                ×
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setLines([...lines, { label: "", qty: 1, unit: 0, amount: 0 }])} className="mt-2 text-xs font-semibold text-accent">
          + {L("Add line", "إضافة بند")}
        </button>
        <dl className="num mt-3 max-w-xs space-y-0.5 text-xs">
          <div className="flex justify-between">
            <dt>{t.quote.subtotal}</dt>
            <dd>{sar(subtotal, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>VAT {Math.round(vatRate * 100)}%</dt>
            <dd>{sar(vat, locale)}</dd>
          </div>
          <div className="flex justify-between font-bold">
            <dt>{t.quote.total}</dt>
            <dd>{sar(subtotal + vat, locale)}</dd>
          </div>
        </dl>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input placeholder={t.quote.deliveryTime} value={terms.deliveryTime} onChange={(e) => setTerms({ ...terms, deliveryTime: e.target.value })} className={input} />
          <input placeholder={t.quote.paymentTerms} value={terms.paymentTerms} onChange={(e) => setTerms({ ...terms, paymentTerms: e.target.value })} className={input} />
          <input type="number" min={1} max={365} placeholder={t.quote.validity} value={terms.validityDays} onChange={(e) => setTerms({ ...terms, validityDays: Number(e.target.value) || 30 })} className={`${input} num`} />
          <input placeholder={t.quote.notes} value={terms.notes} onChange={(e) => setTerms({ ...terms, notes: e.target.value })} className={input} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary !min-h-[40px] text-xs"
            disabled={!lines.length || lines.some((l) => !l.label.trim())}
            onClick={() =>
              patch({
                status: "approved",
                adminNotes: notes,
                approved: {
                  lines: lines.map((l) => ({ ...l, label: l.label.trim() })),
                  subtotal,
                  vatRate,
                  vat,
                  total: subtotal + vat,
                  deliveryTime: terms.deliveryTime || undefined,
                  paymentTerms: terms.paymentTerms || undefined,
                  validityDays: terms.validityDays,
                  notes: terms.notes || undefined,
                },
              })
            }
            data-testid="approve"
          >
            {L("Approve quotation", "اعتماد عرض السعر")}
          </button>
          {req.approved && (
            <button type="button" onClick={() => patch({ approved: null, status: "reviewing" })} className="min-h-[40px] rounded-full border border-line px-4 text-xs font-semibold">
              {L("Withdraw approval", "سحب الاعتماد")}
            </button>
          )}
          {phoneDigits.length >= 9 && (
            <a
              href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(`${req.ref}: ${link}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center rounded-full bg-wa px-4 text-xs font-bold text-white"
            >
              {L("Send link to customer (WhatsApp)", "إرسال الرابط للعميل (واتساب)")}
            </a>
          )}
        </div>
        {msg && <p className="mt-2 text-xs font-semibold text-accent">{msg}</p>}
      </div>
    </div>
  );
}
