/**
 * Company and contact information.
 * Every value here comes from the supplied catalogue / technical specification
 * or from the client's brief. Do not add addresses, certifications or claims
 * that are not supported by those documents.
 */
export const company = {
  brand: "SBT CABINS",
  contactPerson: { en: "Eng. Ali Abbas", ar: "م. علي عباس" },
  contactRole: { en: "CEO", ar: "الرئيس التنفيذي" },
  email: "sbt.abbas123@gmail.com",
  phones: {
    /** Primary number — used for WhatsApp enquiries. */
    primary: { local: "0508202459", international: "+966508202459", display: "+966 50 820 2459" },
    /** Additional number — shown for calls only (WhatsApp availability not confirmed). */
    secondary: { local: "0572065269", international: "+966572065269", display: "+966 57 206 5269" },
  },
  whatsappNumber: "966508202459",
  /** Location as stated in the catalogue ("Dammam — Second Industrial Area"). */
  base: { en: "Dammam — Second Industrial Area", ar: "الدمام — المنطقة الصناعية الثانية" },
} as const;

export type CoverageItem = {
  id: string;
  name: { en: string; ar: string };
  detail: { en: string; ar: string };
};

export const coverage: CoverageItem[] = [
  {
    id: "dammam",
    name: { en: "Dammam", ar: "الدمام" },
    detail: { en: "Fabrication base — Second Industrial Area", ar: "قاعدة التصنيع — المنطقة الصناعية الثانية" },
  },
  {
    id: "riyadh",
    name: { en: "Riyadh", ar: "الرياض" },
    detail: { en: "Supply & delivery", ar: "توريد وتوصيل" },
  },
  {
    id: "jeddah",
    name: { en: "Jeddah", ar: "جدة" },
    detail: { en: "Supply & delivery", ar: "توريد وتوصيل" },
  },
  {
    id: "ksa",
    name: { en: "All of Saudi Arabia", ar: "جميع أنحاء المملكة" },
    detail: { en: "Delivery across the Kingdom", ar: "التوصيل إلى جميع مناطق المملكة" },
  },
  {
    id: "gcc",
    name: { en: "Gulf region (GCC)", ar: "دول الخليج العربي" },
    detail: { en: "Delivery subject to confirmation per project", ar: "التوصيل حسب التأكيد لكل مشروع" },
  },
];
