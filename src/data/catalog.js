export const walletBalance = "$24.60";

export const navItems = [
  { id: "dashboard", label: "لوحة التحكم", icon: "LayoutDashboard" },
  { id: "home", label: "الرئيسية", icon: "Home" },
  { id: "games", label: "الألعاب", icon: "Gamepad2" },
  { id: "voice", label: "المحادثة الصوتية", icon: "Mic2" },
  { id: "social", label: "السوشيال ميديا", icon: "Share2" },
  { id: "ai", label: "اشتراكات الذكاء الاصطناعي", icon: "Bot" },
  { id: "gift-cards", label: "بطاقات الهدايا", icon: "Gift" },
  { id: "subscriptions", label: "الاشتراكات", icon: "Crown" },
  { id: "deals", label: "العروض", icon: "BadgePercent" },
  { id: "orders", label: "الطلبات", icon: "ClipboardList", group: "account" },
  { id: "order-history", label: "سجل الطلبات", icon: "ReceiptText", group: "account" },
  { id: "order-tracking", label: "تتبع الطلب", icon: "PackageCheck", group: "account" },
  { id: "wallet", label: "المحفظة", icon: "WalletCards", group: "account" },
  { id: "notifications", label: "الإشعارات", icon: "Bell", group: "account", badge: "3" },
  { id: "support", label: "الدعم", icon: "Headphones", group: "account" },
  { id: "settings", label: "الإعدادات", icon: "Settings", group: "account" },
  { id: "language", label: "اللغة", icon: "Languages", group: "account", badge: "AR" },
  { id: "admin", label: "الإدارة", icon: "Gauge", group: "account" },
  { id: "logout", label: "تسجيل الخروج", icon: "LogOut", group: "danger" },
];

export const categories = [
  {
    id: "games",
    title: "الألعاب",
    subtitle: "اشحن ألعابك المفضلة فوراً",
    icon: "Gamepad2",
    tone: "from-royal to-pulse",
  },
  {
    id: "voice",
    title: "المحادثة الصوتية",
    subtitle: "اشحن تطبيقات الصوت والغرف",
    icon: "Mic2",
    tone: "from-aqua to-blue-600",
  },
  {
    id: "social",
    title: "السوشيال ميديا",
    subtitle: "خدمات نمو وانتشار للحسابات",
    icon: "UsersRound",
    tone: "from-fuchsia-500 to-rose-500",
  },
  {
    id: "ai",
    title: "الذكاء الاصطناعي",
    subtitle: "اشتراكات أدوات الذكاء الاصطناعي",
    icon: "Bot",
    tone: "from-sky-500 to-royal",
  },
  {
    id: "gift-cards",
    title: "بطاقات الهدايا",
    subtitle: "بطاقات رقمية بسهولة",
    icon: "Gift",
    tone: "from-amber-400 to-orange-600",
  },
  {
    id: "subscriptions",
    title: "الاشتراكات",
    subtitle: "خدمات وتطبيقات بريميوم",
    icon: "Crown",
    tone: "from-gold to-orange-500",
  },
];

export const productGroups = {
  games: {
    title: "الألعاب",
    eyebrow: "رصيد ألعاب فوري",
    description: "توصيل سريع لأشهر الألعاب والمحافظ الرقمية.",
    products: [
      { name: "PUBG Mobile", price: "يبدأ من $0.99", icon: "Crosshair", tone: "from-yellow-400 via-orange-500 to-sky-700" },
      { name: "Free Fire", price: "يبدأ من $0.99", icon: "Flame", tone: "from-orange-400 via-rose-500 to-royal" },
      { name: "Mobile Legends", price: "يبدأ من $0.99", icon: "Sword", tone: "from-aqua via-blue-500 to-purple-700" },
      { name: "Call of Duty", price: "يبدأ من $0.99", icon: "Shield", tone: "from-slate-500 via-slate-800 to-black" },
      { name: "Roblox", price: "يبدأ من $0.99", icon: "Box", tone: "from-sky-400 via-blue-500 to-indigo-700" },
      { name: "Valorant", price: "يبدأ من $0.99", icon: "Target", tone: "from-rose-500 via-red-600 to-slate-900" },
      { name: "Steam Wallet", price: "يبدأ من $1.00", icon: "CircleDollarSign", tone: "from-slate-400 via-blue-700 to-slate-950" },
    ],
  },
  voice: {
    title: "المحادثة الصوتية",
    eyebrow: "غرف مباشرة وتطبيقات صوت",
    description: "اشحن العملات والماس والغرف والباقات المميزة لتطبيقات الصوت.",
    products: [
      { name: "SoulChill", price: "شحن سريع", icon: "Headphones", tone: "from-violet-500 to-fuchsia-600" },
      { name: "Xena", price: "عملات متاحة", icon: "Sparkles", tone: "from-slate-900 to-pulse" },
      { name: "Karak", price: "اشحن الآن", icon: "Leaf", tone: "from-lime-400 to-emerald-700" },
      { name: "Ahlan", price: "توصيل فوري", icon: "MessageCircle", tone: "from-emerald-300 to-teal-700" },
      { name: "Hiyoo", price: "عملات متاحة", icon: "BadgeCheck", tone: "from-cyan-400 to-blue-700" },
      { name: "Sugo", price: "اشحن الآن", icon: "Heart", tone: "from-pink-400 to-rose-700" },
      { name: "YoHo", price: "توصيل فوري", icon: "Flower2", tone: "from-amber-300 to-fuchsia-600" },
      { name: "Poppo Live", price: "عملات متاحة", icon: "PartyPopper", tone: "from-blue-500 to-pink-600" },
      { name: "Yalla", price: "اشحن الآن", icon: "RadioTower", tone: "from-teal-400 to-green-700" },
    ],
  },
  social: {
    title: "السوشيال ميديا",
    eyebrow: "خدمات نمو الحسابات",
    description: "باقات بسيطة لصناع المحتوى والعلامات التجارية والوكالات.",
    products: [
      { name: "TikTok Followers", price: "يبدأ من $1.99", icon: "Music2", tone: "from-slate-950 via-cyan-500 to-rose-500" },
      { name: "Instagram Followers", price: "يبدأ من $1.99", icon: "Instagram", tone: "from-yellow-400 via-pink-500 to-purple-700" },
      { name: "YouTube Views", price: "يبدأ من $0.99", icon: "Youtube", tone: "from-red-500 to-red-800" },
      { name: "Facebook Followers", price: "يبدأ من $1.49", icon: "Facebook", tone: "from-blue-400 to-blue-800" },
      { name: "Telegram Members", price: "يبدأ من $1.49", icon: "Send", tone: "from-sky-400 to-blue-700" },
      { name: "Snapchat Followers", price: "يبدأ من $1.99", icon: "Ghost", tone: "from-yellow-300 to-amber-500" },
      { name: "X Followers", price: "يبدأ من $1.99", icon: "X", tone: "from-slate-600 to-black" },
    ],
  },
  ai: {
    title: "اشتراكات الذكاء الاصطناعي",
    eyebrow: "أدوات ذكية وباقات إبداعية",
    description: "اشتراكات مميزة للكتابة والتصميم والبرمجة والصوت والبحث.",
    products: [
      { name: "ChatGPT Plus", price: "باقة شهرية", icon: "Bot", tone: "from-emerald-400 to-slate-800" },
      { name: "Claude Pro", price: "باقة شهرية", icon: "BrainCircuit", tone: "from-orange-300 to-stone-700" },
      { name: "Gemini Advanced", price: "باقة شهرية", icon: "Gem", tone: "from-sky-400 to-violet-700" },
      { name: "Midjourney", price: "باقة إبداعية", icon: "Palette", tone: "from-fuchsia-400 to-indigo-800" },
      { name: "Cursor Pro", price: "باقة للمطورين", icon: "MousePointer2", tone: "from-slate-700 to-aqua" },
      { name: "GitHub Copilot", price: "باقة للمطورين", icon: "Code2", tone: "from-slate-500 to-slate-950" },
      { name: "ElevenLabs", price: "باقة صوتية", icon: "AudioLines", tone: "from-cyan-300 to-blue-800" },
    ],
  },
  "gift-cards": {
    title: "بطاقات الهدايا",
    eyebrow: "بطاقات هدايا عالمية",
    description: "بطاقات رقمية بتوصيل سريع وخيارات دفع آمنة.",
    products: [
      { name: "Google Play", price: "يبدأ من $5.00", icon: "Play", tone: "from-emerald-400 via-yellow-400 to-blue-600" },
      { name: "Apple Gift Card", price: "يبدأ من $5.00", icon: "Apple", tone: "from-slate-200 to-slate-700" },
      { name: "Steam", price: "يبدأ من $5.00", icon: "CircleDollarSign", tone: "from-slate-500 to-blue-950" },
      { name: "PlayStation", price: "يبدأ من $10.00", icon: "Gamepad", tone: "from-blue-500 to-indigo-900" },
      { name: "Xbox", price: "يبدأ من $10.00", icon: "CircleDot", tone: "from-green-400 to-emerald-800" },
      { name: "Amazon", price: "يبدأ من $10.00", icon: "ShoppingBag", tone: "from-orange-300 to-slate-900" },
      { name: "Razer Gold", price: "يبدأ من $5.00", icon: "Zap", tone: "from-lime-400 to-black" },
    ],
  },
  subscriptions: {
    title: "الاشتراكات",
    eyebrow: "ترفيه وخدمات مميزة",
    description: "وصول شهري للترفيه والموسيقى والتخزين والإنتاجية.",
    products: [
      { name: "Spotify Premium", price: "باقة شهرية", icon: "Music", tone: "from-green-400 to-emerald-900" },
      { name: "Netflix", price: "باقة شهرية", icon: "Clapperboard", tone: "from-red-500 to-slate-950" },
      { name: "YouTube Premium", price: "باقة شهرية", icon: "Youtube", tone: "from-red-500 to-red-800" },
      { name: "Discord Nitro", price: "باقة شهرية", icon: "MessagesSquare", tone: "from-indigo-400 to-violet-800" },
      { name: "Canva Pro", price: "باقة شهرية", icon: "Brush", tone: "from-cyan-400 to-purple-700" },
      { name: "iCloud+", price: "باقة شهرية", icon: "Cloud", tone: "from-sky-300 to-blue-700" },
    ],
  },
  deals: {
    title: "العروض",
    eyebrow: "عروض محدودة",
    description: "عروض مختارة على الألعاب والخدمات الاجتماعية والاشتراكات وبطاقات الهدايا.",
    products: [
      { name: "PUBG Weekly Pack", price: "وفر 12%", icon: "Flame", tone: "from-orange-400 to-royal" },
      { name: "Voice Chat Bundle", price: "وفر 18%", icon: "Mic2", tone: "from-aqua to-blue-700" },
      { name: "Creator Starter", price: "وفر 20%", icon: "Sparkles", tone: "from-pink-400 to-purple-800" },
      { name: "AI Builder Pack", price: "وفر 15%", icon: "Bot", tone: "from-emerald-400 to-sky-800" },
    ],
  },
};

export const paymentMethods = ["Visa", "Mastercard"];

export const orders = [
  { id: "#WF-9041", product: "PUBG Mobile UC", status: "مكتمل", price: "$9.99", date: "07 يونيو 2026", delivery: "تم التسليم", progress: 100 },
  { id: "#WF-9038", product: "ChatGPT Plus", status: "قيد التنفيذ", price: "$20.00", date: "06 يونيو 2026", delivery: "تفعيل الاشتراك", progress: 68 },
  { id: "#WF-9027", product: "SoulChill Coins", status: "مكتمل", price: "$4.99", date: "05 يونيو 2026", delivery: "تم التسليم", progress: 100 },
  { id: "#WF-9014", product: "Apple Gift Card", status: "معلق", price: "$25.00", date: "04 يونيو 2026", delivery: "مراجعة الدفع", progress: 35 },
  { id: "#WF-9002", product: "Instagram Followers", status: "مكتمل", price: "$7.50", date: "02 يونيو 2026", delivery: "تم التسليم", progress: 100 },
  { id: "#WF-8998", product: "Steam Wallet", status: "ملغي", price: "$10.00", date: "30 مايو 2026", delivery: "تم الإلغاء بواسطة المستخدم", progress: 0 },
];

export const walletTransactions = [
  { id: "TX-2204", type: "شحن رصيد", method: "Visa", amount: "+$50.00", date: "07 يونيو 2026" },
  { id: "TX-2198", type: "طلب", method: "PUBG Mobile", amount: "-$9.99", date: "07 يونيو 2026" },
  { id: "TX-2175", type: "طلب", method: "SoulChill", amount: "-$4.99", date: "05 يونيو 2026" },
  { id: "TX-2144", type: "استرداد", method: "المحفظة", amount: "+$3.00", date: "01 يونيو 2026" },
];

export const profile = {
  name: "مستخدم Winnie",
  email: "user@winniefun.com",
  phone: "+1 555 0148",
  country: "الولايات المتحدة",
  tier: "عضو مميز",
};

export const stats = [
  { label: "خدمة متاحة", value: "100+", icon: "Sparkles" },
  { label: "مستخدم سعيد", value: "2M+", icon: "UsersRound" },
  { label: "طلب مكتمل", value: "5M+", icon: "Gift" },
  { label: "معدل الرضا", value: "99.9%", icon: "BadgeCheck" },
  { label: "ثقة عالمية", value: "عالمي", icon: "Globe2" },
];

export const dashboardMetrics = [
  { label: "الرصيد الحالي", value: "$24.60", trend: "+12.4%", icon: "WalletCards", tone: "from-royal to-pulse" },
  { label: "طلبات نشطة", value: "2", trend: "طلب معلق", icon: "PackageOpen", tone: "from-aqua to-blue-600" },
  { label: "المكافآت", value: "840 نقطة", trend: "+90 اليوم", icon: "Star", tone: "from-gold to-orange-500" },
  { label: "منتجات محفوظة", value: "12", trend: "4 عروض", icon: "Heart", tone: "from-pink-500 to-rose-600" },
];

export const notifications = [
  { id: "N-104", title: "تم تسليم الطلب", message: "تم تسليم PUBG Mobile UC بنجاح.", type: "orders", level: "success", time: "منذ دقيقتين", unread: true },
  { id: "N-103", title: "شحن المحفظة", message: "تمت إضافة $50.00 إلى رصيدك عبر Visa.", type: "wallet", level: "success", time: "منذ ساعة", unread: true },
  { id: "N-102", title: "عرض اليوم", message: "باقة Creator Starter عليها خصم 20% اليوم.", type: "offers", level: "warning", time: "منذ 3 ساعات", unread: true },
  { id: "N-101", title: "فحص أمني", message: "تم رصد تسجيل دخول جديد من القاهرة.", type: "account", level: "info", time: "أمس", unread: false },
];

export const favoriteProducts = [
  { name: "ChatGPT Plus", group: "اشتراكات الذكاء الاصطناعي", price: "$20.00", icon: "Bot", tone: "from-emerald-400 to-slate-800" },
  { name: "PUBG Mobile", group: "الألعاب", price: "يبدأ من $0.99", icon: "Crosshair", tone: "from-yellow-400 via-orange-500 to-sky-700" },
  { name: "Apple Gift Card", group: "بطاقات الهدايا", price: "يبدأ من $5.00", icon: "Apple", tone: "from-slate-200 to-slate-700" },
];

export const specialOffers = [
  { title: "عرض الألعاب اليومي", description: "وفر حتى 18% على شحنات ألعاب مختارة.", badge: "اليوم", icon: "Flame" },
  { title: "باقة قوة الذكاء الاصطناعي", description: "باقات AI مميزة مع تفعيل بأولوية.", badge: "جديد", icon: "Bot" },
  { title: "تعزيز صناع المحتوى", description: "باقات سوشيال ميديا لبداية حملة سريعة.", badge: "خصم 20%", icon: "Sparkles" },
];

export const walletStats = [
  { label: "إجمالي الإيداعات", value: "$420.00", icon: "TrendingUp" },
  { label: "إجمالي الإنفاق", value: "$395.40", icon: "CreditCard" },
  { label: "التحويلات", value: "$80.00", icon: "SendHorizontal" },
  { label: "المستردات", value: "$18.00", icon: "RefreshCw" },
];

export const supportTickets = [
  { id: "TK-5110", subject: "تفعيل ChatGPT Plus", status: "مفتوح", priority: "عالي", updated: "منذ 8 دقائق" },
  { id: "TK-5098", subject: "إيصال شحن المحفظة", status: "تم الحل", priority: "عادي", updated: "أمس" },
  { id: "TK-5071", subject: "مراجعة كود بطاقة هدايا", status: "بانتظار الرد", priority: "عادي", updated: "04 يونيو 2026" },
];

export const faqs = [
  { question: "ما سرعة تسليم الشحن؟", answer: "معظم الشحنات الرقمية تتم فوراً. بعض الاشتراكات قد تستغرق دقائق قليلة للتفعيل." },
  { question: "هل يمكن تغيير العملة؟", answer: "نعم، من الإعدادات يمكنك تغيير عرض العملة بين USD وEUR وAED و$ وEGP." },
  { question: "هل المدفوعات آمنة؟", answer: "تم تصميم المدفوعات حول خطوات دفع آمنة وتأكيد الطلب عبر المحفظة." },
];

export const adminStats = [
  { label: "المستخدمون", value: "48,920", icon: "Users" },
  { label: "طلبات اليوم", value: "1,284", icon: "ClipboardList" },
  { label: "الإيرادات", value: "$92.4K", icon: "CircleDollarSign" },
  { label: "تذاكر مفتوحة", value: "36", icon: "Ticket" },
];

export const adminTables = {
  users: [
    { name: "مستخدم Winnie", email: "user@winniefun.com", phone: "+971 50 123 4567", status: "مميز", balance: "$24.60" },
    { name: "Alex Carter", email: "alex@example.com", phone: "+971 55 840 2193", status: "نشط", balance: "$140.00" },
    { name: "Maya Stone", email: "maya@example.com", phone: "+971 58 632 7741", status: "مراجعة", balance: "$0.00" },
  ],
  products: [
    { name: "PUBG Mobile", category: "الألعاب", status: "متاح", margin: "12%" },
    { name: "ChatGPT Plus", category: "AI", status: "متاح", margin: "9%" },
    { name: "Apple Gift Card", category: "بطاقات الهدايا", status: "متاح", margin: "6%" },
  ],
  categories: [
    { name: "الألعاب", products: 42, status: "متاح", owner: "فريق الألعاب" },
    { name: "المحادثة الصوتية", products: 18, status: "متاح", owner: "فريق السوشيال" },
    { name: "اشتراكات الذكاء الاصطناعي", products: 12, status: "متاح", owner: "فريق AI" },
  ],
};

export const currencies = ["USD", "EUR", "AED", "$", "EGP"];
export const languages = ["العربية", "English"];

export const orderTimeline = [
  { title: "تم إنشاء الطلب", text: "استلمنا طلبك وتم تثبيت السعر.", state: "done" },
  { title: "تم تأكيد الدفع", text: "تم خصم الرصيد من المحفظة بنجاح.", state: "done" },
  { title: "معالجة المزود", text: "المزود يقوم بتفعيل المنتج الآن.", state: "active" },
  { title: "التسليم", text: "سيتم تعليم المنتج كمكتمل بعد التسليم.", state: "pending" },
];
