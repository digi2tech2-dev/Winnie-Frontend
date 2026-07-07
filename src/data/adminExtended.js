export const permissionGroups = [
  { title: "المستخدمون", items: ["عرض المستخدمين", "إدارة المستخدمين", "تأكيد الحسابات"] },
  { title: "الطلبات", items: ["عرض الطلبات", "تأكيد الطلبات"] },
  { title: "المنتجات والمجموعات", items: ["إدارة المجموعات", "إدارة المنتجات"] },
  { title: "المالية", items: ["سجل المدفوعات", "إدارة الأرصدة", "المحافظ", "طرق الدفع"] },
  { title: "أخرى", items: ["إدارة الموردين", "العملاء", "تأكيد طلبات الجهة المستهدفة", "سجلات النشاط", "إدارة إعدادات الواتساب"] },
];

export const supervisorsSeed = [
  { id: "SUP-1001", userId: "USR-10010", name: "كريم منصور", email: "karim@example.com", status: "active", lastSeen: "منذ 8 دقائق", permissions: ["عرض المستخدمين", "إدارة المستخدمين", "عرض الطلبات", "تأكيد الطلبات", "إدارة المنتجات", "سجل المدفوعات", "إدارة الأرصدة", "سجلات النشاط"] },
  { id: "SUP-1002", userId: "USR-10076", name: "سارة علي", email: "sara@example.com", status: "active", lastSeen: "منذ 28 دقيقة", permissions: ["عرض المستخدمين", "تأكيد الحسابات", "عرض الطلبات", "تأكيد طلبات الجهة المستهدفة"] },
];

export const supervisorLogsSeed = [
  { id: "LOG-88210", supervisorId: "SUP-1001", action: "اعتماد طلب إضافة رصيد", target: "REQ-44018", status: "completed", date: "21 يونيو 2026", time: "10:42 ص", details: "تمت مراجعة إيصال التحويل وإضافة 150.00 USD إلى محفظة المستخدم USR-10087.", ip: "89.39.20.7" },
  { id: "LOG-88204", supervisorId: "SUP-1001", action: "تعديل حالة منتج", target: "PRD-1032", status: "completed", date: "21 يونيو 2026", time: "09:18 ص", details: "تغيير حالة منتج Free Fire 530 Diamonds إلى غير متوفر.", ip: "89.39.20.7" },
  { id: "LOG-88198", supervisorId: "SUP-1002", action: "مراجعة حساب مستخدم", target: "USR-10022", status: "pending", date: "20 يونيو 2026", time: "08:06 م", details: "بدأت مراجعة بيانات الحساب ومستندات التحقق وما زالت العملية قيد التنفيذ.", ip: "185.61.44.8" },
  { id: "LOG-88176", supervisorId: "SUP-1002", action: "رفض طلب الجهة المستهدفة", target: "TRG-2091", status: "completed", date: "20 يونيو 2026", time: "04:31 م", details: "تم رفض الطلب لعدم اكتمال بيانات الحساب المستهدف.", ip: "185.61.44.8" },
];

export const balanceRequestsSeed = [
  { id: "TOP-55021", userId: "USR-10087", name: "مروان عادل", email: "marwan@example.com", amount: 150, actualAmount: 150, currency: "USD", status: "pending", date: "21 يونيو 2026 · 10:20 ص", paymentMethod: "تحويل بنكي CIB", walletFrom: "EG12 0010 9931", execution: "manual", receipt: "/اسلايد وكيل.jpg" },
  { id: "TOP-55018", userId: "USR-10076", name: "سارة علي", email: "sara@example.com", amount: 500, actualAmount: 500, currency: "SAR", status: "approved", date: "21 يونيو 2026 · 09:05 ص", paymentMethod: "STC Pay", walletFrom: "+966 55 201 4470", execution: "automatic", receipt: "/hero-winnie-fun.png" },
  { id: "TOP-55012", userId: "USR-10051", name: "ليان محمد", email: "layan@example.com", amount: 200, actualAmount: 200, currency: "AED", status: "processing", date: "20 يونيو 2026 · 07:48 م", paymentMethod: "تحويل بنكي", walletFrom: "AE44 2100 1182", execution: "manual", receipt: "/اسلايد1.jpg" },
  { id: "TOP-55003", userId: "USR-10022", name: "نادين حسن", email: "nadin@example.com", amount: 1000, actualAmount: 950, currency: "EGP", status: "rejected", date: "20 يونيو 2026 · 02:11 م", paymentMethod: "Vodafone Cash", walletFrom: "0111 774 2210", execution: "manual", receipt: "/logo.png" },
];

export const currencyCatalog = [
  { code: "USD", name: "الدولار الأمريكي", symbol: "$", flag: "🇺🇸", rate: 1 },
  { code: "EGP", name: "الجنيه المصري", symbol: "ج.م", flag: "🇪🇬", rate: 48.65 },
  { code: "SAR", name: "الريال السعودي", symbol: "ر.س", flag: "🇸🇦", rate: 3.75 },
  { code: "AED", name: "الدرهم الإماراتي", symbol: "د.إ", flag: "🇦🇪", rate: 3.6725 },
  { code: "EUR", name: "اليورو", symbol: "€", flag: "🇪🇺", rate: 0.93 },
  { code: "GBP", name: "الجنيه الإسترليني", symbol: "£", flag: "🇬🇧", rate: 0.79 },
  { code: "KWD", name: "الدينار الكويتي", symbol: "د.ك", flag: "🇰🇼", rate: 0.307 },
  { code: "QAR", name: "الريال القطري", symbol: "ر.ق", flag: "🇶🇦", rate: 3.64 },
  { code: "BHD", name: "الدينار البحريني", symbol: "د.ب", flag: "🇧🇭", rate: 0.376 },
  { code: "OMR", name: "الريال العُماني", symbol: "ر.ع", flag: "🇴🇲", rate: 0.385 },
  { code: "TRY", name: "الليرة التركية", symbol: "₺", flag: "🇹🇷", rate: 33.9 },
  { code: "JOD", name: "الدينار الأردني", symbol: "د.أ", flag: "🇯🇴", rate: 0.709 },
];

export const subAgentRequestsSeed = [
  { id: "SAR-2018", userId: "USR-10076", name: "سارة علي", email: "sara@example.com", message: "أنا وكيلة وأرغب في الحصول على أسعار التجار وتوسيع شبكة العملاء.", currentGroup: "Gold", currentRate: 5, invitedBy: "مروان عادل", status: "pending", date: "21 يونيو 2026 · 09:40 ص" },
  { id: "SAR-2014", userId: "USR-10051", name: "ليان محمد", email: "layan@example.com", message: "أعمل في بيع الخدمات الرقمية وأرغب في الانضمام كوكلاء فرعيين.", currentGroup: "Silver", currentRate: 3, invitedBy: "سارة علي", status: "pending", date: "20 يونيو 2026 · 06:15 م" },
  { id: "SAR-2009", userId: "USR-10044", name: "Omar Stone", email: "omar.stone@example.com", message: "طلب أسعار موزعين.", currentGroup: "Retail", currentRate: 7, invitedBy: "Yara Kim", status: "rejected", date: "19 يونيو 2026 · 03:10 م" },
];

export const agentEarningsSeed = [
  { id: "AE-1", agent: "مروان عادل", invited: "سارة علي", orders: 18, revenue: 420, earning: 31.5 },
  { id: "AE-2", agent: "مروان عادل", invited: "نادين حسن", orders: 7, revenue: 145, earning: 10.88 },
  { id: "AE-3", agent: "سارة علي", invited: "ليان محمد", orders: 12, revenue: 280, earning: 14 },
  { id: "AE-4", agent: "Yara Kim", invited: "Omar Stone", orders: 31, revenue: 990, earning: 118.8 },
];

export const subAgentRequestStorageKey = "winnie-sub-agent-request";
