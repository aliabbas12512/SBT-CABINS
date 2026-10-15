import type { Localized } from "@/i18n/config";

/**
 * Full technical specification of the 12.00 × 3.60 m Portable Accommodation
 * Cabin, transcribed from "Portable Accommodation Cabin — Technical
 * Specification" (17 pages). Nothing has been added beyond that document.
 */

export type SpecLine = { label: Localized; value: Localized };
export type SpecBlock = { title: Localized; lines: SpecLine[] };
export type SpecSection = {
  id: string;
  number: string;
  title: Localized;
  intro?: Localized;
  drawing?: "skid" | "lifting" | "framing" | "panel" | "elevation";
  blocks: SpecBlock[];
  note?: Localized;
};

const L = (en: string, ar: string): Localized => ({ en, ar });
const line = (le: string, la: string, ve: string, va: string): SpecLine => ({ label: L(le, la), value: L(ve, va) });

export const accommodationKeyFigures: { value: string; label: Localized; detail: Localized }[] = [
  { value: "12.00 m", label: L("Cabin length", "طول الكبينة"), detail: L("3.60 m width, 43.2 m² footprint", "عرض 3.60 م، مساحة 43.2 م²") },
  { value: "3", label: L("Layouts", "تكوينات"), detail: L("2-Men · 4-Men · 8-Men", "شخصان · 4 أشخاص · 8 أشخاص") },
  { value: "50 min", label: L("Fire resistance", "مقاومة الحريق"), detail: L("External & emergency doors", "الأبواب الخارجية وأبواب الطوارئ") },
  { value: "5 hr", label: L("Emergency lighting", "إنارة الطوارئ"), detail: L("Battery backup duration", "مدة الاحتياطي بالبطارية") },
];

export const accommodationCompliance: SpecLine[] = [
  line("Structural steel", "الحديد الإنشائي", "BS EN 10025 (I-beam) · ASTM A36 (angle frame)", "BS EN 10025 (الكمرات) · ASTM A36 (إطار الزوايا)"),
  line("Panels & finishes", "الألواح والتشطيبات", "DIN 4102 B2 fire classification · EN 13501-1 fire-rated vinyl flooring", "تصنيف الحريق DIN 4102 B2 · أرضيات فينيل مقاومة للحريق وفق EN 13501-1"),
  line("Electrical", "الكهرباء", "SASO-approved cabling, distribution panel and accessories", "كابلات ولوحة توزيع وملحقات معتمدة من ساسو (SASO)"),
  line(
    "Client standards",
    "معايير العميل",
    "Fabricated and inspected to suit Saudi Aramco site requirements (lifting MPI, grounding, fire extinguisher inspection regime)",
    "تُصنّع وتُفحص بما يتوافق مع متطلبات مواقع أرامكو السعودية (فحص نقاط الرفع بالجسيمات المغناطيسية، والتأريض، ونظام فحص طفايات الحريق)",
  ),
];

export const accommodationSections: SpecSection[] = [
  {
    id: "structure",
    number: "01",
    title: L("Structure — Heavy-Duty Skid", "الهيكل — قاعدة انزلاقية للخدمة الشاقة"),
    intro: L("The skid carries the full cabin load during lifting, transport and site placement.", "تحمل القاعدة الانزلاقية كامل حمل الكبينة أثناء الرفع والنقل والتركيب في الموقع."),
    drawing: "skid",
    blocks: [
      {
        title: L("Key data", "البيانات الرئيسية"),
        lines: [
          line("I-Beam", "الكمرة", "250 × 125 × 9.80 mm IPE, BS EN 10025", "IPE مقاس 250 × 125 × 9.80 مم، BS EN 10025"),
          line("Skid", "القاعدة الانزلاقية", "2.50 × 12.00 m, two longitudinal beams", "2.50 × 12.00 م، كمرتان طوليتان"),
          line("Deck", "السطح", "12 mm checkered plate at lifting zones", "صاج مضلّع 12 مم في مناطق الرفع"),
          line("Finish", "التشطيب", "Sandblasted, primed and painted", "سفع رملي ثم طبقة أساس وطلاء"),
          line("Welding", "اللحام", "100% inspected by SBT QC (CSWIP / CWI)", "فحص 100% من قِبل مراقبة الجودة (CSWIP / CWI)"),
          line("Handover", "التسليم", "Skid drawing, weld report and paint record", "مخطط القاعدة وتقرير اللحام وسجل الطلاء"),
        ],
      },
    ],
  },
  {
    id: "lifting",
    number: "02",
    title: L("Lifting Points", "نقاط الرفع"),
    intro: L("Bottom-lift design — every point serialised, tested and certified before dispatch.", "تصميم رفع من الأسفل — كل نقطة مرقّمة ومختبرة ومعتمدة قبل الشحن."),
    drawing: "lifting",
    blocks: [
      {
        title: L("Specification", "المواصفات"),
        lines: [
          line("Material", "المادة", "Heavy-duty 4-inch Schedule 80 pipe — ASTM standard", "أنبوب 4 بوصة Schedule 80 للخدمة الشاقة — وفق معيار ASTM"),
          line("Design", "التصميم", "Cabin lifted from the bottom; two types of lifting points", "تُرفع الكبينة من الأسفل؛ نوعان من نقاط الرفع"),
          line("Identification", "التعريف", "Each point marked with a unique serial number", "تُعلَّم كل نقطة برقم تسلسلي فريد"),
          line("NDT", "الاختبار غير الإتلافي", "Magnetic Particle Inspection by an Aramco-approved inspector", "فحص بالجسيمات المغناطيسية من قِبل مفتش معتمد لدى أرامكو"),
          line("Finish", "التشطيب", "Painted according to the applicable MPI colour code", "مطلية وفق رمز الألوان المعتمد لفحص MPI"),
          line("Handover", "التسليم", "MPI certificate and lifting point register with the cabin", "شهادة MPI وسجل نقاط الرفع مع الكبينة"),
        ],
      },
    ],
    note: L(
      "Serialised points and a stamped MPI record mean the unit can be lifted on site on day one — no hold, no re-inspection delay.",
      "النقاط المرقّمة وسجل MPI المختوم يتيحان رفع الوحدة في الموقع من اليوم الأول — دون انتظار أو تأخير لإعادة الفحص.",
    ),
  },
  {
    id: "frame",
    number: "03",
    title: L("Main Frame & Flooring System", "الإطار الرئيسي ونظام الأرضيات"),
    drawing: "framing",
    blocks: [
      {
        title: L("Main frame", "الإطار الرئيسي"),
        lines: [
          line("Section", "المقطع", "Angle iron 70 × 70 × 7 mm — ASTM A36", "حديد زاوية 70 × 70 × 7 مم — ASTM A36"),
          line("Frame size", "مقاس الإطار", "3.60 × 12.00 m, sandblasted, primed and painted", "3.60 × 12.00 م، سفع رملي وطبقة أساس وطلاء"),
        ],
      },
      {
        title: L("Floor build-up", "طبقات الأرضية"),
        lines: [
          line("Substrate", "الطبقة الأساسية", "18 mm non-asbestos cement fibre board — Class A fireproof", "لوح ألياف أسمنتية خالٍ من الأسبستوس 18 مم — مقاوم للحريق فئة A"),
          line("Finish", "التشطيب", "Gerflor Mipolam vinyl 2 mm, EN 13501-1 fire-rated", "فينيل Gerflor Mipolam بسماكة 2 مم، مقاوم للحريق وفق EN 13501-1"),
          line("Skirting", "الوزرة", "Gerflor PVC semi-rigid skirting after vinyl completion", "وزرة PVC شبه صلبة من Gerflor بعد الانتهاء من الفينيل"),
        ],
      },
      {
        title: L("Floor structure", "هيكل الأرضية"),
        lines: [
          line("Joists", "الروافد", "50 × 50 × 2 mm square steel tubing", "أنابيب فولاذية مربعة 50 × 50 × 2 مم"),
          line("Spacing", "التباعد", "610 mm centres, 1220 mm at longitudinal members", "610 مم بين المحاور، و1220 مم عند العناصر الطولية"),
        ],
      },
    ],
  },
  {
    id: "panels",
    number: "04",
    title: L("Wall & Roof Sandwich Panel System", "نظام ألواح الساندويتش للجدران والسقف"),
    intro: L("50 mm insulated panel envelope engineered for Gulf ambient conditions.", "غلاف من الألواح المعزولة بسماكة 50 مم مصمم لظروف مناخ الخليج."),
    drawing: "panel",
    blocks: [
      {
        title: L("Panel build-up", "مكونات اللوح"),
        lines: [
          line("External skin", "القشرة الخارجية", "0.5 mm pre-painted GI steel, low-rib, UV-stable coating", "حديد مجلفن مطلي مسبقاً 0.5 مم، تضليع منخفض، طلاء مقاوم للأشعة فوق البنفسجية"),
          line("Insulation core", "قلب العزل", "50 mm polyurethane, 35 kg/m³ — rockwool core on request", "بولي يوريثان 50 مم بكثافة 35 كجم/م³ — قلب صوف صخري عند الطلب"),
          line("Internal skin", "القشرة الداخلية", "0.5 mm pre-painted GI steel, wipe-clean internal finish", "حديد مجلفن مطلي مسبقاً 0.5 مم، تشطيب داخلي سهل التنظيف"),
          line("Jointing", "الوصلات", "U-Lock joint system, concealed fixing, sealed at all interfaces", "نظام وصلات U-Lock، تثبيت مخفي، ومحكم الإغلاق عند جميع الوصلات"),
        ],
      },
    ],
    note: L(
      "Fire classification DIN 4102 B2 · Heat transfer coefficient 0.48 W/m²K · Core tested to ASTM D1621 · Roof panel laid to fall with sealed edge trim",
      "تصنيف الحريق DIN 4102 B2 · معامل انتقال الحرارة 0.48 واط/م²·كلفن · قلب مختبر وفق ASTM D1621 · ألواح السقف بميل للتصريف مع حواف محكمة الإغلاق",
    ),
  },
  {
    id: "doors",
    number: "05",
    title: L("Door Systems", "أنظمة الأبواب"),
    blocks: [
      {
        title: L("Main external door", "الباب الخارجي الرئيسي"),
        lines: [
          line("Size", "المقاس", "1.00 × 2.00 m, tubular steel frame with 2 mm metal sheet", "1.00 × 2.00 م، إطار فولاذي أنبوبي مع صاج معدني 2 مم"),
          line("Core", "القلب", "PU / glass wool insulation — 50-minute fire resistance", "عزل بولي يوريثان / صوف زجاجي — مقاومة حريق 50 دقيقة"),
          line("Hardware", "الإكسسوارات", "Heavy-duty lockset, door closer and weather seal", "قفل للخدمة الشاقة وذراع إغلاق ذاتي وعازل للعوامل الجوية"),
        ],
      },
      {
        title: L("Emergency exit door", "باب الخروج للطوارئ"),
        lines: [
          line("Construction", "الإنشاء", "Same steel and insulation build as main door, 50-minute rating", "نفس تكوين الفولاذ والعزل للباب الرئيسي، مقاومة 50 دقيقة"),
          line("Hardware", "الإكسسوارات", "Outward opening with panic release and illuminated EXIT sign", "يفتح للخارج مع ذراع فتح للطوارئ ولوحة EXIT مضيئة"),
          line("Option", "خيار", "Custom UL-listed door sets available on request", "أطقم أبواب مدرجة لدى UL متوفرة عند الطلب"),
        ],
      },
      {
        title: L("Internal wooden doors", "الأبواب الخشبية الداخلية"),
        lines: [
          line("Material", "المادة", "Marandi wood (Malaysia), surface hardness 3570 N", "خشب ماراندي (ماليزيا)، صلابة سطح 3570 نيوتن"),
          line("Properties", "الخصائص", "Waterproof, anti-termite and airtight when closed", "مقاومة للماء والنمل الأبيض ومحكمة الإغلاق عند غلقها"),
          line("Use", "الاستخدام", "Bedroom and office/majlis openings", "فتحات غرف النوم والمكتب/المجلس"),
        ],
      },
      {
        title: L("Internal aluminium doors", "الأبواب الداخلية من الألمنيوم"),
        lines: [
          line("Material", "المادة", "2 mm aluminium leaf with 4–6 mm Formica facing", "ضلفة ألمنيوم 2 مم مع كسوة فورمايكا 4–6 مم"),
          line("Properties", "الخصائص", "Airtight, moisture resistant, non-warping", "محكمة الإغلاق، مقاومة للرطوبة، لا تتشوه"),
          line("Use", "الاستخدام", "Bathroom and lavatory openings", "فتحات الحمّامات ودورات المياه"),
        ],
      },
    ],
  },
  {
    id: "electrical",
    number: "06",
    title: L("Electrical System & Interior Lighting", "النظام الكهربائي والإنارة الداخلية"),
    blocks: [
      {
        title: L("Distribution panel", "لوحة التوزيع"),
        lines: [
          line("Panel", "اللوحة", "Indoor low-voltage panel, SASO compliant", "لوحة جهد منخفض داخلية مطابقة لمواصفات ساسو"),
          line("Main breaker", "القاطع الرئيسي", "100 Amp", "100 أمبير"),
          line("Protection", "الحماية", "Plug-in MCB configuration with individually numbered RCBs", "قواطع MCB قابلة للتركيب مع قواطع RCB مرقّمة بشكل فردي"),
          line("Enclosure", "الحاوية", "Double enclosure for electrical protection", "حاوية مزدوجة للحماية الكهربائية"),
          line("Supply", "التغذية", "220 V / 60 Hz single phase; 380 V three-phase option", "220 فولت / 60 هرتز أحادي الطور؛ خيار 380 فولت ثلاثي الطور"),
          line("Records", "السجلات", "Circuit schedule and test readings handed over with the unit", "جدول الدوائر وقراءات الاختبار تُسلَّم مع الوحدة"),
        ],
      },
      {
        title: L("Interior lighting", "الإنارة الداخلية"),
        lines: [
          line("Main fixtures", "الوحدات الرئيسية", "Surface-mounted LED 2 × 20 W", "وحدات LED سطحية 2 × 20 واط"),
          line("Lux levels", "مستويات الإضاءة", "220 Lux in rooms, 100 Lux in toilets", "220 لوكس في الغرف، 100 لوكس في دورات المياه"),
          line("Bed lighting", "إنارة الأسرّة", "5 W reading light provided at every bed", "مصباح قراءة 5 واط لكل سرير"),
          line("Emergency", "الطوارئ", "Emergency light fittings with 5-hour battery backup", "وحدات إنارة طوارئ مع بطارية احتياطية لمدة 5 ساعات"),
          line("Safety", "السلامة", "Each fixture secured with a 1-inch aluminium retention strip", "تثبيت كل وحدة بشريط ألمنيوم 1 بوصة"),
          line("Signage", "اللوحات", "Illuminated EXIT signage at escape doors", "لوحات EXIT مضيئة عند أبواب الهروب"),
        ],
      },
    ],
  },
  {
    id: "exterior-electrical",
    number: "07",
    title: L("Exterior Lighting, Sockets, Wiring & Grounding", "الإنارة الخارجية والمقابس والتمديدات والتأريض"),
    blocks: [
      {
        title: L("Exterior lighting", "الإنارة الخارجية"),
        lines: [
          line("Floodlights", "الكشافات", "4 × 50 W, 75 Lux each, mounted at cabin corners", "4 × 50 واط، 75 لوكس لكل منها، مثبتة في أركان الكبينة"),
          line("Door light", "إنارة الأبواب", "100 W fitting at every external door", "وحدة 100 واط عند كل باب خارجي"),
          line("Control", "التحكم", "Switched internally with weatherproof external fittings", "تشغيل من الداخل مع وحدات خارجية مقاومة للعوامل الجوية"),
        ],
      },
      {
        title: L("Sockets & outlets", "المقابس والمخارج"),
        lines: [
          line("Ratings", "التصنيفات", "10 A to 45 A, UK-standard outlets", "من 10 إلى 45 أمبير، مخارج بالمعيار البريطاني"),
          line("Wet areas", "المناطق الرطبة", "GFCI protection in toilet and shower areas", "حماية GFCI في مناطق دورات المياه والاستحمام"),
          line("Industrial", "الصناعية", "CEE type industrial outlets, IP44 waterproof", "مخارج صناعية من نوع CEE، مقاومة للماء IP44"),
        ],
      },
      {
        title: L("Wiring & containment", "التمديدات والحماية"),
        lines: [
          line("Cables", "الكابلات", "SASO-approved THHN / THWN, 600 V rated", "كابلات THHN / THWN معتمدة من ساسو، 600 فولت"),
          line("Sizes", "المقاسات", "10–14 AWG selected by circuit load", "10–14 AWG حسب حمل الدائرة"),
          line("Containment", "الحماية", "Concealed in duct trunking / EMT conduit — no exposed wiring", "مخفية داخل مجاري / مواسير EMT — دون تمديدات مكشوفة"),
        ],
      },
      {
        title: L("Grounding", "التأريض"),
        lines: [
          line("System", "النظام", "Earthing loop system, one dedicated earth pit per cabin", "نظام حلقة تأريض، مع حفرة تأريض مخصصة لكل كبينة"),
          line("Rod", "القضيب", "Earthing rod driven 1 metre deep, bonded to cabin steel", "قضيب تأريض بعمق متر واحد، موصول بهيكل الكبينة الفولاذي"),
          line("Standard", "المعيار", "Installed per Saudi Aramco grounding instructions", "يُركّب وفق تعليمات التأريض لدى أرامكو السعودية"),
        ],
      },
    ],
  },
  {
    id: "plumbing",
    number: "08",
    title: L("Plumbing & Sanitary Ware", "السباكة والأدوات الصحية"),
    blocks: [
      {
        title: L("Plumbing system", "نظام السباكة"),
        lines: [
          line("Water supply", "تغذية المياه", "CPVC Schedule 80 — 1\" and ½\" hot and cold lines", "CPVC Schedule 80 — خطوط ساخنة وباردة 1 بوصة و½ بوصة"),
          line("Drainage", "الصرف", "PVC Schedule 80 — 4\" and 2\" lines with P-trap and U-trap", "PVC Schedule 80 — خطوط 4 بوصة و2 بوصة مع سيفون P وسيفون U"),
          line("Hot water", "المياه الساخنة", "50-litre electric water heater", "سخان مياه كهربائي سعة 50 لتراً"),
          line("Ventilation", "التهوية", "20 cm exhaust fan in bathroom", "مروحة شفط 20 سم في الحمّام"),
          line("Odour control", "التحكم في الروائح", "Carbon vent canister on the drainage vent", "عبوة تهوية كربونية على فتحة تهوية الصرف"),
          line("Connections", "التوصيلات", "External inlet and outlet points for camp mains or tanker service", "نقاط دخول وخروج خارجية للتوصيل بشبكة المعسكر أو خدمة الصهاريج"),
        ],
      },
      {
        title: L("Sanitary ware", "الأدوات الصحية"),
        lines: [
          line("WC", "المرحاض", "Western style, floor-mounted elongated bowl, siphon-jet action", "إفرنجي، مثبت على الأرض بحوض بيضاوي ونظام دفق سيفوني"),
          line("Wash basin", "المغسلة", "Vanity type with aluminium storage cabinet", "مغسلة بخزانة تخزين من الألمنيوم"),
          line("Shower", "الدش", "80 × 80 cm shower tray with mixer and flexible hose", "قاعدة دش 80 × 80 سم مع خلاط وخرطوم مرن"),
          line("Accessories", "الملحقات", "Mirror, soap dish, towel rail and coat hook", "مرآة وصحن صابون وحامل مناشف وعلّاقة ملابس"),
          line("Finishes", "التشطيبات", "Moisture-resistant wall cladding to full bathroom height", "تكسية جدران مقاومة للرطوبة بكامل ارتفاع الحمّام"),
        ],
      },
    ],
  },
  {
    id: "hvac",
    number: "09",
    title: L("HVAC & Refrigeration", "التكييف والتبريد"),
    blocks: [
      {
        title: L("Air conditioning", "التكييف"),
        lines: [
          line("Type", "النوع", "Hot & cold split units sized to room load", "وحدات سبليت حار/بارد حسب حمل الغرفة"),
          line("Capacity", "السعة", "22,000 – 27,500 BTU per unit", "22,000 – 27,500 وحدة حرارية بريطانية لكل وحدة"),
          line("Supply", "التغذية", "60 Hz, 220 – 380 V", "60 هرتز، 220 – 380 فولت"),
          line("Isolation", "الفصل", "Independent external cut-out switch for every unit", "مفتاح فصل خارجي مستقل لكل وحدة"),
          line("Fixing", "التثبيت", "Indoor and outdoor units secured with 2\" × 4 mm metal flat bar", "تثبيت الوحدات الداخلية والخارجية بشريط معدني 2 بوصة × 4 مم"),
          line("Commissioning", "التشغيل التجريبي", "Gas pressure, airflow and drainage tested before dispatch", "اختبار ضغط الغاز وتدفق الهواء والتصريف قبل الشحن"),
        ],
      },
      {
        title: L("Refrigerators", "الثلاجات"),
        lines: [
          line("2-Men & 4-Men rooms", "غرف الشخصين و4 أشخاص", "3.2 cu.ft", "3.2 قدم مكعب"),
          line("Office / Majlis", "المكتب / المجلس", "9.2 cu.ft", "9.2 قدم مكعب"),
          line("Mess hall", "صالة الطعام", "14.3 cu.ft", "14.3 قدم مكعب"),
          line("Fixing", "التثبيت", "Secured with safety strips to prevent movement in transit", "تثبيت بأشرطة أمان لمنع الحركة أثناء النقل"),
          line("Maintenance", "الصيانة", "Monthly preventive maintenance schedule available under service contract", "جدول صيانة وقائية شهرية متاح بموجب عقد خدمة"),
        ],
      },
    ],
  },
  {
    id: "fire",
    number: "10",
    title: L("Fire & Safety System", "نظام الحريق والسلامة"),
    blocks: [
      {
        title: L("Smoke detection", "كشف الدخان"),
        lines: [
          line("Coverage", "التغطية", "One standalone battery-operated detector in every room", "كاشف مستقل يعمل بالبطارية في كل غرفة"),
          line("Testing", "الاختبار", "Function-tested periodically by the Quality & Safety team", "اختبار دوري للأداء من قِبل فريق الجودة والسلامة"),
          line("Option", "خيار", "Addressable panel and interlinked detection on request", "لوحة عنونة وكشف مترابط عند الطلب"),
        ],
      },
      {
        title: L("Internal extinguisher", "الطفاية الداخلية"),
        lines: [
          line("Type", "النوع", "10 lbs CO₂ extinguisher", "طفاية ثاني أكسيد الكربون 10 رطل"),
          line("Location", "الموقع", "Office / majlis room, wall-mounted near the exit", "غرفة المكتب / المجلس، مثبتة على الجدار بالقرب من المخرج"),
          line("Signage", "اللوحات", "Photoluminescent identification sign at each location", "لوحة تعريف فوسفورية عند كل موقع"),
        ],
      },
      {
        title: L("External extinguisher", "الطفاية الخارجية"),
        lines: [
          line("Type", "النوع", "30 lbs ABC dry powder extinguisher per cabin", "طفاية بودرة جافة ABC بوزن 30 رطل لكل كبينة"),
          line("Mounting", "التثبيت", "Positioned approximately 1 ft above ground level", "على ارتفاع قدم واحد تقريباً فوق مستوى الأرض"),
          line("Access", "الوصول", "Located on the external wall beside the main door", "على الجدار الخارجي بجوار الباب الرئيسي"),
        ],
      },
      {
        title: L("Inspection regime", "نظام الفحص"),
        lines: [
          line("Frequency", "التكرار", "Fire extinguishers inspected every 6 months", "فحص طفايات الحريق كل 6 أشهر"),
          line("Inspector", "المفتش", "Carried out by an Aramco-certified inspection company", "يُنفَّذ من قِبل شركة فحص معتمدة لدى أرامكو"),
          line("Escape", "الإخلاء", "Emergency door, EXIT signage and 5-hour emergency lighting", "باب طوارئ ولوحات EXIT وإنارة طوارئ لمدة 5 ساعات"),
        ],
      },
    ],
  },
];

export type AccommodationConfig = {
  id: "2-men" | "4-men" | "8-men";
  name: Localized;
  berths: number;
  bedsLabel: Localized;
  audience: Localized;
  bunk: boolean;
  furniture: SpecLine[];
};

export const accommodationConfigs: AccommodationConfig[] = [
  {
    id: "2-men",
    name: L("2-Men", "شخصان"),
    berths: 2,
    bedsLabel: L("2 single beds", "سريران مفردان"),
    audience: L("Senior staff / supervisor accommodation", "سكن كبار الموظفين / المشرفين"),
    bunk: false,
    furniture: [
      line("Beds", "الأسرّة", "Wooden bed 1.40 × 2.00 m (×2) with spring mattress (×2)", "سرير خشبي 1.40 × 2.00 م (×2) مع مرتبة زنبركية (×2)"),
      line("Storage", "التخزين", "Double-door cabinet (×2)", "خزانة بابين (×2)"),
      line("Workspace", "مساحة العمل", "Writing table and chair (×2)", "طاولة كتابة وكرسي (×2)"),
      line("Appliances", "الأجهزة", "Refrigerator (×2), microwave (×2), electric kettle (×2)", "ثلاجة (×2)، ميكروويف (×2)، غلاية كهربائية (×2)"),
      line("Entertainment", "الترفيه", "LED TV 42\" or 32\" (×2)", "تلفزيون LED مقاس 42 أو 32 بوصة (×2)"),
      line("Linen", "المفروشات", "Blanket (×4), pillow set with cover and bed sheet (×4)", "بطانية (×4)، طقم وسائد مع غطاء وملاءة سرير (×4)"),
    ],
  },
  {
    id: "4-men",
    name: L("4-Men", "4 أشخاص"),
    berths: 4,
    bedsLabel: L("4 single beds", "4 أسرّة مفردة"),
    audience: L("Staff accommodation", "سكن الموظفين"),
    bunk: false,
    furniture: [
      line("Beds", "الأسرّة", "Wooden bed 1.20 × 2.00 m with mattress", "سرير خشبي 1.20 × 2.00 م مع مرتبة"),
      line("Storage", "التخزين", "Double-door cabinet per occupant", "خزانة بابين لكل شاغل"),
      line("Workspace", "مساحة العمل", "Writing table and chair per occupant", "طاولة كتابة وكرسي لكل شاغل"),
      line("Appliances", "الأجهزة", "Refrigerator, microwave and electric kettle per room", "ثلاجة وميكروويف وغلاية كهربائية لكل غرفة"),
      line("Entertainment", "الترفيه", "LED TV 42\" or 32\"", "تلفزيون LED مقاس 42 أو 32 بوصة"),
      line("Linen", "المفروشات", "Blanket (×2) and pillow set with cover and bed sheet (×2) per bed", "بطانية (×2) وطقم وسائد مع غطاء وملاءة سرير (×2) لكل سرير"),
    ],
  },
  {
    id: "8-men",
    name: L("8-Men", "8 أشخاص"),
    berths: 8,
    bedsLabel: L("4 bunk beds = 8 berths", "4 أسرّة بطابقين = 8 أسرّة"),
    audience: L("Workforce accommodation", "سكن العمالة"),
    bunk: true,
    furniture: [
      line("Beds", "الأسرّة", "Bunk bed 1.20 × 2.00 m (×4) with foam mattress (×8)", "سرير بطابقين 1.20 × 2.00 م (×4) مع مرتبة إسفنجية (×8)"),
      line("Storage", "التخزين", "Four-door wooden cabinet (×2)", "خزانة خشبية بأربعة أبواب (×2)"),
      line("Lighting", "الإنارة", "Individual bed light (×8)", "إنارة فردية لكل سرير (×8)"),
      line("Linen", "المفروشات", "Blanket (×16), pillow set with cover and bed sheet (×16)", "بطانية (×16)، طقم وسائد مع غطاء وملاءة سرير (×16)"),
      line("Appliances", "الأجهزة", "Refrigerator, microwave and electric kettle as per client scope", "ثلاجة وميكروويف وغلاية كهربائية حسب نطاق العميل"),
      line("Layout", "التصميم", "Sleeping area plus attached bathroom / lavatory within the 12.00 × 3.60 m shell", "منطقة نوم مع حمّام / دورة مياه ملحقة ضمن هيكل 12.00 × 3.60 م"),
    ],
  },
];

export const prayerRoom: SpecLine[] = [
  line("Audio", "الصوت", "Speaker and microphone (×1)", "سماعة وميكروفون (×1)"),
  line("Storage", "التخزين", "Bookshelf (×1)", "رف كتب (×1)"),
  line("Entrance", "المدخل", "Shoe rack (×2)", "رف أحذية (×2)"),
  line("Finish", "التشطيب", "Carpeted floor area with qibla direction marked", "أرضية مفروشة بالسجاد مع تحديد اتجاه القبلة"),
  line("Lighting & AC", "الإنارة والتكييف", "Same lighting, AC and fire detection standard as sleeper rooms", "نفس معايير الإنارة والتكييف وكشف الحريق المعتمدة لغرف النوم"),
];

export const accommodationOtherUnits: Localized = L(
  "Mess hall, kitchen, office, majlis, laundry and toilet-block units are fabricated to the same specification on request.",
  "تُصنّع وحدات صالة الطعام والمطبخ والمكتب والمجلس والمغسلة ودورات المياه بنفس المواصفات عند الطلب.",
);
