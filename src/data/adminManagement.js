import { walletPaymentMethodsSeed } from "./paymentMethods";

export const groupsSeed = [
  { id: "grp-vip", name: "عملاء VIP", markup: 4.5, status: "active" },
  { id: "grp-agents", name: "الوكلاء", markup: 2, status: "active" },
  { id: "grp-retail", name: "العملاء الأفراد", markup: 7.5, status: "active" },
  { id: "grp-new", name: "مجموعة جديدة", markup: 5, status: "inactive" },
];

export const groupMembersSeed = [
  { id: "mem-1", name: "أحمد سامي", email: "ahmed.samy@example.com", phone: "+20 100 123 4411", groupId: "grp-vip" },
  { id: "mem-2", name: "سارة عادل", email: "sara.adel@example.com", phone: "+20 111 552 9031", groupId: "grp-vip" },
  { id: "mem-3", name: "محمد خالد", email: "m.khaled@example.com", phone: "+971 50 123 4567", groupId: "grp-agents" },
  { id: "mem-4", name: "نور ياسر", email: "nour.yasser@example.com", phone: "", groupId: "grp-retail" },
  { id: "mem-5", name: "عمر حسين", email: "omar.h@example.com", phone: "+20 122 773 1200", groupId: "grp-retail" },
  { id: "mem-6", name: "لينا محمود", email: "lina.m@example.com", phone: "", groupId: "grp-retail" },
];

export const suppliersSeed = [
  { id: "sup-midas", name: "Midasbuy", code: "MIDAS", apiUrl: "https://api.midasbuy.example/v1", authType: "apiKey", credential: "••••••••••••", active: true, autoExecution: true, connection: "connected", synced: true, lastSync: "منذ 8 دقائق", balance: 2840.65, email: "merchant@winniefun.com" },
  { id: "sup-garena", name: "Garena Partner", code: "GARENA", apiUrl: "https://partner.garena.example/api", authType: "token", credential: "••••••••••••", active: true, autoExecution: true, connection: "connected", synced: true, lastSync: "منذ 24 دقيقة", balance: 1190.2, email: "ops@winniefun.com" },
  { id: "sup-reloadly", name: "Reloadly", code: "RELOAD", apiUrl: "https://giftcards.reloadly.example", authType: "token", credential: "••••••••••••", active: true, autoExecution: false, connection: "connected", synced: false, lastSync: "منذ ساعتين", balance: 720.45, email: "payments@winniefun.com" },
  { id: "sup-legacy", name: "Legacy Social API", code: "SOCIAL-X", apiUrl: "https://social-api.example/v2", authType: "apiKey", credential: "••••••••••••", active: false, autoExecution: false, connection: "failed", synced: false, lastSync: "منذ 3 أيام", balance: 0, email: "admin@winniefun.com" },
];

export const supplierCatalogSeed = [
  { id: "sp-1", supplierId: "sup-midas", code: "MB-660", name: "PUBG Mobile 660 UC", price: 10.82, min: 1, max: 20, status: "available" },
  { id: "sp-2", supplierId: "sup-midas", code: "MB-1800", name: "PUBG Mobile 1800 UC", price: 25.6, min: 1, max: 10, status: "available" },
  { id: "sp-3", supplierId: "sup-garena", code: "GR-530", name: "Free Fire 530 Diamonds", price: 7.74, min: 1, max: 15, status: "available" },
  { id: "sp-4", supplierId: "sup-garena", code: "GR-1080", name: "Free Fire 1080 Diamonds", price: 14.95, min: 1, max: 10, status: "unavailable" },
  { id: "sp-5", supplierId: "sup-reloadly", code: "RL-APPLE25", name: "Apple Gift Card US 25 USD", price: 24.15, min: 1, max: 5, status: "available" },
  { id: "sp-6", supplierId: "sup-reloadly", code: "RL-GOOGLE10", name: "Google Play US 10 USD", price: 9.64, min: 1, max: 10, status: "available" },
  { id: "sp-7", supplierId: "sup-legacy", code: "SX-IG1K", name: "Instagram 1000 Followers", price: 5.4, min: 100, max: 10000, status: "unavailable" },
];

export const paymentGroupsSeed = [
  { id: "pay-global", name: "عالمي", currency: "USD", description: "Visa وMastercard وApple Pay المتاحة لشحن رصيد العملاء.", image: "/logo.png", active: true },
  { id: "pay-egp", name: "الدفع المحلي", currency: "EGP", description: "محافظ إلكترونية وتحويلات بنكية داخل مصر.", image: "/اسلايد وكيل.jpg", active: true },
  { id: "pay-usd", name: "الدفع الدولي", currency: "USD", description: "وسائل دفع دولية للحسابات بالدولار.", image: "/hero-winnie-fun.png", active: true },
  { id: "pay-agent", name: "تحويلات الوكلاء", currency: "USD", description: "حسابات مخصصة لتسويات الوكلاء.", image: "/اسلايد1.jpg", active: false },
];

export const paymentMethodsSeed = [
  ...walletPaymentMethodsSeed,
  { id: "pm-vcash", groupId: "pay-egp", name: "Vodafone Cash", description: "محفظة إلكترونية", fee: 1.5, account: "0100 123 4567", bank: "Vodafone", owner: "Winnie Fun", image: "/logo.png", active: true },
  { id: "pm-bank-eg", groupId: "pay-egp", name: "تحويل بنكي CIB", description: "تحويل بنكي", fee: 0, account: "EG12 0010 0000 1234", bank: "CIB", owner: "Winnie Fun LLC", image: "/logo.png", active: true },
  { id: "pm-usdt", groupId: "pay-usd", name: "USDT TRC20", description: "عملة رقمية", fee: 0.8, account: "TX8a...P91x", bank: "TRON Network", owner: "Winnie Treasury", image: "/logo.png", active: true },
  { id: "pm-wire", groupId: "pay-agent", name: "Agent Wire", description: "تحويل دولي", fee: 2, account: "AE07 0000 0199", bank: "Emirates NBD", owner: "Winnie Agents", image: "/logo.png", active: false },
];
