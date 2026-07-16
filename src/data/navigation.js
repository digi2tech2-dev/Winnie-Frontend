export const publicServices = [
  { id: "games", label: "الألعاب", path: "/categories/games", icon: "Gamepad2" },
  { id: "voice", label: "المحادثة الصوتية", path: "/categories/voice", icon: "Mic2" },
  { id: "social", label: "السوشيال ميديا", path: "/categories/social", icon: "Share2" },
  { id: "ai", label: "اشتراكات الذكاء الاصطناعي", path: "/categories/ai", icon: "Bot" },
  { id: "gift-cards", label: "بطاقات الهدايا", path: "/categories/gift-cards", icon: "Gift" },
  { id: "subscriptions", label: "الاشتراكات", path: "/categories/subscriptions", icon: "Crown" },
  { id: "deals", label: "العروض", path: "/categories/deals", icon: "BadgePercent" },
];

export const customerNav = [
  { label: "الرئيسية", path: "/customer/dashboard", icon: "Home" },
  { label: "المنتجات المفضلة", path: "/customer/favorites", icon: "Heart" },
  { label: "الأقسام", path: "/customer/categories", icon: "ListChecks" },
  { label: "طلباتي", path: "/customer/orders", icon: "ShoppingCart" },
  { label: "محفظتي", path: "/customer/wallet", icon: "WalletCards" },
  { label: "وكيل فرعي", path: "/customer/sub-agent", icon: "UserPlus" },
  { label: "من نحن", path: "/customer/about", icon: "Building2" },
  { label: "الإشعارات", path: "/customer/notifications", icon: "Bell", badge: "3" },
  { label: "الملف الشخصي", path: "/customer/profile", icon: "UserRound" },
  { label: "الإعدادات", path: "/customer/settings", icon: "Settings" },
];

export const customerMobileNav = [
  { label: "الرئيسية", path: "/customer/dashboard", icon: "Home" },
  { label: "محفظتي", path: "/customer/wallet", icon: "WalletCards" },
  { label: "طلباتي", path: "/customer/orders", icon: "ShoppingCart" },
  { label: "حسابي", path: "/customer/profile", icon: "UserRound" },
];

export const adminNav = [
  { label: "الرئيسية", path: "/admin/user/dashboard", icon: "Home" },
  { label: "المنتجات المفضلة", path: "/admin/user/favorites", icon: "Heart" },
  { label: "الأكثر مبيعاً", path: "/admin/user/best-selling", icon: "ShoppingBag" },
  { label: "الأقسام", path: "/admin/user/categories", icon: "ListChecks" },
  { label: "طلباتي", path: "/admin/user/orders", icon: "ShoppingCart" },
  { label: "محفظتي", path: "/admin/user/wallet", icon: "WalletCards" },
  { label: "وكيل فرعي", path: "/admin/user/sub-agent", icon: "UserPlus" },
  { label: "من نحن", path: "/admin/user/about", icon: "Building2" },
  { label: "الإشعارات", path: "/admin/user/notifications", icon: "Bell" },
  { label: "الملف الشخصي", path: "/admin/user/profile", icon: "UserRound" },
  { label: "الإعدادات", path: "/admin/user/settings", icon: "Settings" },
];
