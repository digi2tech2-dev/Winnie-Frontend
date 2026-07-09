const dayMs = 24 * 60 * 60 * 1000;

export const startOfDay = (date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

export const addDays = (date, amount) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return startOfDay(nextDate);
};

export const addMonths = (date, amount) => {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + amount);
  return startOfDay(nextDate);
};

export const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
export const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
export const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);

export const today = startOfDay(new Date());

export function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateInputValue(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return startOfDay(new Date(year, month - 1, day));
}

export function isSameDay(firstDate, secondDate) {
  return toDateInputValue(firstDate) === toDateInputValue(secondDate);
}

export function isWithinRange(date, range) {
  const currentDate = startOfDay(date).getTime();
  return currentDate >= startOfDay(range.start).getTime() && currentDate <= startOfDay(range.end).getTime();
}

export function getRangeDays(range) {
  return Math.max(1, Math.round((startOfDay(range.end).getTime() - startOfDay(range.start).getTime()) / dayMs) + 1);
}

export function getPreviousRange(range) {
  const days = getRangeDays(range);
  return {
    start: addDays(range.start, -days),
    end: addDays(range.start, -1),
  };
}

export const arabicDateFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const compactDateFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  day: "2-digit",
  month: "short",
});

export const monthFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  month: "long",
  year: "numeric",
});

export const numberFormatter = new Intl.NumberFormat("ar-EG-u-nu-latn");

export const currencyFormatter = new Intl.NumberFormat("ar-EG-u-nu-latn", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const preciseCurrencyFormatter = new Intl.NumberFormat("ar-EG-u-nu-latn", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export const datePresets = [
  { id: "today", label: "اليوم" },
  { id: "yesterday", label: "أمس" },
  { id: "thisMonth", label: "هذا الشهر" },
  { id: "last7", label: "آخر 7 أيام" },
  { id: "last30", label: "آخر 30 يوم" },
  { id: "lastMonth", label: "الشهر السابق" },
  { id: "thisYear", label: "هذا العام" },
  { id: "custom", label: "مدة مخصصة" },
];

export function getPresetRange(presetId) {
  const currentMonthStart = startOfMonth(today);
  const lastMonthDate = addMonths(today, -1);

  const ranges = {
    today: { start: today, end: today },
    yesterday: { start: addDays(today, -1), end: addDays(today, -1) },
    last7: { start: addDays(today, -6), end: today },
    last30: { start: addDays(today, -29), end: today },
    thisMonth: { start: currentMonthStart, end: today },
    lastMonth: { start: startOfMonth(lastMonthDate), end: endOfMonth(lastMonthDate) },
    thisYear: { start: startOfYear(today), end: today },
  };

  const preset = datePresets.find((item) => item.id === presetId) || datePresets.find((item) => item.id === "thisMonth");
  const range = ranges[preset.id] || ranges.thisMonth;

  return {
    ...range,
    key: `${preset.id}-${toDateInputValue(range.start)}-${toDateInputValue(range.end)}`,
    label: preset.label,
    preset: preset.id,
  };
}

export function createCustomRange(start, end) {
  const normalizedStart = startOfDay(start);
  const normalizedEnd = startOfDay(end);
  const rangeStart = normalizedStart <= normalizedEnd ? normalizedStart : normalizedEnd;
  const rangeEnd = normalizedStart <= normalizedEnd ? normalizedEnd : normalizedStart;

  return {
    start: rangeStart,
    end: rangeEnd,
    key: `custom-${toDateInputValue(rangeStart)}-${toDateInputValue(rangeEnd)}`,
    label: "مدة مخصصة",
    preset: "custom",
  };
}

export function formatRangeLabel(range) {
  if (isSameDay(range.start, range.end)) {
    return arabicDateFormatter.format(range.start);
  }

  return `${compactDateFormatter.format(range.start)} - ${arabicDateFormatter.format(range.end)}`;
}

export const analyticsDaily = Array.from({ length: 420 }, (_, index) => {
  const daysBack = 419 - index;
  const date = addDays(today, -daysBack);
  const weekday = date.getDay();
  const wave = Math.sin(index / 5) + Math.cos(index / 11);
  const demand = 1 + Math.max(-0.22, Math.min(0.34, wave * 0.12));
  const weekendLift = weekday === 5 || weekday === 6 ? 1.18 : 1;
  const orders = Math.round((94 + (index % 17) * 6) * demand * weekendLift);
  const completedOrders = Math.round(orders * (0.72 + ((index % 5) * 0.025)));
  const pendingOrders = Math.max(4, orders - completedOrders - Math.round((index % 7) * 1.8));
  const revenue = Math.round(orders * (8.6 + (index % 9) * 0.72) * demand);
  const walletBalances = Math.round(42000 + index * 120 + orders * 22);
  const users = Math.round(16 + (index % 13) * 1.7 + demand * 7);
  const products = index % 8 === 0 ? 2 : index % 11 === 0 ? 1 : 0;
  const manualPending = Math.max(0, Math.round(pendingOrders * 0.18 + (index % 3)));

  return {
    date,
    revenue,
    profit: Math.round(revenue * 0.23),
    balances: Math.round(walletBalances * 1.62),
    orders,
    users,
    products,
    pendingOrders,
    completedOrders,
    manualPending,
    walletBalances,
  };
});

function createReceiptImage({ id, user, amount, provider, tone = "#0f766e" }) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="540" height="340" viewBox="0 0 540 340">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="#f8fafc"/>
          <stop offset="1" stop-color="#e0f2fe"/>
        </linearGradient>
      </defs>
      <rect width="540" height="340" rx="26" fill="url(#bg)"/>
      <rect x="28" y="28" width="484" height="284" rx="18" fill="white" stroke="#cbd5e1" stroke-width="2"/>
      <circle cx="86" cy="84" r="32" fill="${tone}" opacity="0.14"/>
      <path d="M72 84h28M86 70v28" stroke="${tone}" stroke-width="8" stroke-linecap="round"/>
      <text x="126" y="78" fill="#0f172a" font-family="Arial" font-size="24" font-weight="700">Transfer Receipt</text>
      <text x="126" y="108" fill="#64748b" font-family="Arial" font-size="16">${id}</text>
      <line x1="56" y1="138" x2="484" y2="138" stroke="#e2e8f0" stroke-width="2"/>
      <text x="56" y="180" fill="#64748b" font-family="Arial" font-size="17">Customer</text>
      <text x="220" y="180" fill="#0f172a" font-family="Arial" font-size="18" font-weight="700">${user}</text>
      <text x="56" y="220" fill="#64748b" font-family="Arial" font-size="17">Provider</text>
      <text x="220" y="220" fill="#0f172a" font-family="Arial" font-size="18" font-weight="700">${provider}</text>
      <text x="56" y="260" fill="#64748b" font-family="Arial" font-size="17">Amount</text>
      <text x="220" y="260" fill="${tone}" font-family="Arial" font-size="24" font-weight="800">$${amount.toFixed(2)}</text>
      <rect x="382" y="222" width="72" height="72" rx="12" fill="#f1f5f9"/>
      <path d="M398 258h40M418 238v40" stroke="#94a3b8" stroke-width="5" stroke-linecap="round"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function createInitialOrders() {
  return [
    { id: "#WF-9184", customer: "مروان عادل", product: "PUBG Mobile UC", amount: 49.99, status: "pending", date: addDays(today, 0), channel: "محفظة", note: "تأكيد دفع مكتمل وينتظر التنفيذ." },
    { id: "#WF-9183", customer: "سارة علي", product: "ChatGPT Plus", amount: 20, status: "completed", date: addDays(today, 0), channel: "Visa", note: "تم التفعيل وإرسال بيانات الاشتراك." },
    { id: "#WF-9182", customer: "Omar Stone", product: "Steam Wallet", amount: 75, status: "reviewing", date: addDays(today, -1), channel: "تحويل", note: "الطلب يحتاج مراجعة فرق السعر." },
    { id: "#WF-9179", customer: "ليان محمد", product: "SoulChill Coins", amount: 32.5, status: "pending", date: addDays(today, -2), channel: "محفظة", note: "المزود متاح، التنفيذ يدوي." },
    { id: "#WF-9173", customer: "Yousef GM", product: "Apple Gift Card", amount: 100, status: "completed", date: addDays(today, -3), channel: "Mastercard", note: "تم تسليم الكود بنجاح." },
    { id: "#WF-9168", customer: "ندى حسن", product: "Instagram Followers", amount: 18.75, status: "rejected", date: addDays(today, -5), channel: "محفظة", note: "تم رفض الطلب بسبب بيانات ناقصة." },
    { id: "#WF-9162", customer: "Maya Carter", product: "Canva Pro", amount: 14.99, status: "completed", date: addDays(today, -8), channel: "Visa", note: "تم تسليم الاشتراك." },
    { id: "#WF-9156", customer: "أحمد سمير", product: "Razer Gold", amount: 45, status: "pending", date: addDays(today, -13), channel: "تحويل", note: "بانتظار اعتماد التحويل." },
  ];
}

export function createInitialManualRequests() {
  const rows = [
    { id: "TR-2048", user: "أحمد سمير", amount: 45, provider: "Binance Pay", status: "pending", offset: 0, tone: "#0f766e" },
    { id: "TR-2047", user: "ليان محمد", amount: 80, provider: "Vodafone Cash", status: "pending", offset: -1, tone: "#2563eb" },
    { id: "TR-2042", user: "Omar Stone", amount: 75, provider: "USDT Wallet", status: "approved", offset: -2, tone: "#7c3aed" },
    { id: "TR-2039", user: "سارة علي", amount: 22, provider: "PayPal", status: "rejected", offset: -5, tone: "#e11d48" },
  ];

  return rows.map((item) => ({
    ...item,
    date: addDays(today, item.offset),
    receiptImage: createReceiptImage(item),
  }));
}

export const initialSuppliers = [
  { id: "sp-1", name: "GameHub Direct", balance: 18420, lastUpdate: "منذ 4 دقائق", status: "online", threshold: 5000 },
  { id: "sp-2", name: "GiftFlow Cards", balance: 2640, lastUpdate: "منذ 11 دقيقة", status: "online", threshold: 4500 },
  { id: "sp-3", name: "Voice Topup Pro", balance: 910, lastUpdate: "منذ 22 دقيقة", status: "degraded", threshold: 2000 },
  { id: "sp-4", name: "AI Subscriptions", balance: 12680, lastUpdate: "منذ ساعة", status: "online", threshold: 3500 },
];

export const initialWallets = [
  { id: "wallet-main", name: "المحفظة الرئيسية", balance: 58240, lastTransaction: "إضافة $450 منذ 8 دقائق", threshold: 8000 },
  { id: "wallet-cash", name: "محفظة التحويل اليدوي", balance: 3460, lastTransaction: "خصم $75 منذ 24 دقيقة", threshold: 4000 },
  { id: "wallet-refund", name: "محفظة الاسترداد", balance: 8920, lastTransaction: "إضافة $110 أمس", threshold: 2500 },
  { id: "wallet-agent", name: "محفظة الوكلاء", balance: 12100, lastTransaction: "خصم $320 منذ ساعتين", threshold: 5000 },
];

export const initialProducts = [
  { id: "pr-1", name: "PUBG Mobile UC", category: "الألعاب", price: 9.99, stock: 148, status: "active", provider: "GameHub Direct" },
  { id: "pr-2", name: "ChatGPT Plus", category: "اشتراكات AI", price: 20, stock: 32, status: "active", provider: "AI Subscriptions" },
  { id: "pr-3", name: "Apple Gift Card", category: "بطاقات الهدايا", price: 25, stock: 0, status: "paused", provider: "GiftFlow Cards" },
  { id: "pr-4", name: "SoulChill Coins", category: "المحادثة الصوتية", price: 4.99, stock: 18, status: "active", provider: "Voice Topup Pro" },
  { id: "pr-5", name: "Steam Wallet", category: "الألعاب", price: 10, stock: 63, status: "active", provider: "GameHub Direct" },
];

export const initialUsers = [
  { id: "us-1", name: "مروان عادل", email: "marwan@example.com", balance: 132.4, tier: "VIP", visits: 184, orders: 39, score: 98, lastActivity: "منذ 4 دقائق" },
  { id: "us-2", name: "سارة علي", email: "sara@example.com", balance: 48.75, tier: "Premium", visits: 141, orders: 27, score: 91, lastActivity: "منذ 12 دقيقة" },
  { id: "us-3", name: "ليان محمد", email: "layan@example.com", balance: 7.1, tier: "New", visits: 96, orders: 14, score: 84, lastActivity: "منذ 25 دقيقة" },
];

export const popularPaymentMethods = [
  { id: "wallet", name: "المحفظة", usage: 42, transactions: 612, volume: 28450, tone: "from-amber-400 to-orange-500" },
  { id: "visa", name: "Visa", usage: 27, transactions: 391, volume: 19280, tone: "from-sky-400 to-blue-600" },
  { id: "manual", name: "تحويل يدوي", usage: 19, transactions: 276, volume: 12840, tone: "from-emerald-400 to-teal-600" },
  { id: "mastercard", name: "Mastercard", usage: 12, transactions: 174, volume: 8690, tone: "from-rose-400 to-orange-500" },
];

export const initialActivities = [
  { id: "ac-1", title: "اعتماد طلب #WF-9183", detail: "ChatGPT Plus", type: "success", time: "منذ 6 دقائق" },
  { id: "ac-2", title: "تعديل سعر Steam Wallet", detail: "السعر الجديد $10.00", type: "price", time: "منذ 18 دقيقة" },
  { id: "ac-3", title: "إضافة رصيد للمحفظة الرئيسية", detail: "$450.00", type: "wallet", time: "منذ 31 دقيقة" },
  { id: "ac-4", title: "إيقاف منتج Apple Gift Card", detail: "نفاد المخزون", type: "warning", time: "منذ ساعة" },
  { id: "ac-5", title: "إنشاء كوبون WEEKEND12", detail: "خصم 12%", type: "coupon", time: "أمس" },
];

export const systemServices = [
  { id: "database", label: "Database", status: "healthy", latency: "18ms" },
  { id: "api", label: "API", status: "healthy", latency: "42ms" },
  { id: "server", label: "Server", status: "healthy", latency: "99.98%" },
  { id: "cache", label: "Cache", status: "healthy", latency: "7ms" },
];

export const statusLabels = {
  pending: "معلق",
  completed: "مكتمل",
  reviewing: "مراجعة",
  rejected: "مرفوض",
  approved: "معتمد",
  active: "مفعل",
  paused: "متوقف",
  online: "متصل",
  degraded: "بطيء",
  healthy: "يعمل",
};
