import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Copy, Languages, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Brand from "./Brand";
import { iconMap } from "./icons";
import { verifyAdminSecurityPin } from "../api/adminSecurityPin";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const profileAvatarKey = "winnie-profile-avatar";
const profileAvatarChangedEvent = "winnie-profile-avatar-change";
const adminToolsUnlockedKey = "winnie-admin-tools-unlocked";
const adminToolItems = [
  { label: "لوحة الأدمن", path: "/admin/tools/dashboard", icon: "LayoutDashboard", badge: "مركز" },
  { label: "إدارة المستخدمين", path: "/admin/tools/users", icon: "Users" },
  { label: "إدارة المشرفين", path: "/admin/tools/supervisors", icon: "UserCog" },
  { label: "إدارة الطلبات", path: "/admin/tools/orders", icon: "ClipboardList" },
  { label: "المدفوعات", path: "/admin/tools/payments", icon: "ReceiptText" },
  { label: "التقارير المالية", path: "/admin/tools/financial-reports", icon: "ReceiptText" },
  { label: "طلبات إضافة الرصيد", path: "/admin/tools/balance-requests", icon: "WalletCards" },
  { label: "الشحن الإداري", path: "/admin/tools/admin-wallet-adjustments", icon: "WalletCards" },
  { label: "إدارة المنتجات", path: "/admin/tools/products", icon: "ShoppingBag" },
  { label: "إدارة المجموعات", path: "/admin/tools/groups", icon: "UsersRound" },
  { label: "إدارة الموردين", path: "/admin/tools/suppliers", icon: "Building2" },
  { label: "طرق الدفع", path: "/admin/tools/payment-methods", icon: "CreditCard" },
  { label: "إدارة العملات", path: "/admin/tools/currencies", icon: "Coins" },
  { label: "إشعارات واتساب", path: "/admin/tools/whatsapp-notifications", icon: "MessageCircle" },
  { label: "إعدادات النظام", path: "/admin/tools/settings", icon: "Settings" },
  { label: "طلبات الوكلاء الفرعيين", path: "/admin/tools/sub-agents", icon: "UserPlus" },
];

function getStoredProfileAvatar() {
  try {
    return localStorage.getItem(profileAvatarKey) || "";
  } catch {
    return "";
  }
}

function isImageAvatar(avatar) {
  return typeof avatar === "string" && /^(https?:|data:image|\/)/.test(avatar);
}

function getStoredAdminToolsUnlocked() {
  try {
    return sessionStorage.getItem(adminToolsUnlockedKey) === "true";
  } catch {
    return false;
  }
}

export default function DashboardSidebar({ items, open, onClose, walletBalance, variant = "customer" }) {
  const { user, logout, token } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const location = useLocation();
  const LogOutIcon = iconMap.LogOut;
  const UserIcon = iconMap.UserRound;
  const AdminIcon = iconMap.ShieldCheck;
  const ChevronDownIcon = iconMap.ChevronDown;
  const CrownIcon = iconMap.Crown;
  const SparklesIcon = iconMap.Sparkles;
  const accountPrefix = variant === "admin" ? "/admin/user" : "/customer";
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(getStoredProfileAvatar);
  const [adminUserNavOpen, setAdminUserNavOpen] = useState(() =>
    variant === "admin" && isAdminUserPath(location.pathname),
  );
  const [adminToolsOpen, setAdminToolsOpen] = useState(() =>
    variant === "admin" && isAdminToolsPath(location.pathname) && getStoredAdminToolsUnlocked(),
  );
  const [adminToolsUnlocked, setAdminToolsUnlocked] = useState(getStoredAdminToolsUnlocked);
  const [adminGateOpen, setAdminGateOpen] = useState(false);
  const [adminGatePin, setAdminGatePin] = useState("");
  const [visibleAdminPinIndex, setVisibleAdminPinIndex] = useState(null);
  const adminPinRevealTimeoutRef = useRef(null);
  const [adminGateError, setAdminGateError] = useState("");
  const [adminGateVerifying, setAdminGateVerifying] = useState(false);
  const [adminExitConfirmOpen, setAdminExitConfirmOpen] = useState(false);
  const sidebarAvatarUrl = (isImageAvatar(user?.avatar) ? user.avatar : "") || profileAvatarUrl;
  const sidebarAvatarInitial = String(user?.avatar || user?.name || "W").slice(0, 1).toUpperCase();
  const visibleItems = variant === "admin" ? [] : items;
  const adminUserItems = variant === "admin" ? items : [];
  const adminUserNavActive = variant === "admin" && isAdminUserPath(location.pathname);
  const adminToolsRouteActive = variant === "admin" && isAdminToolsPath(location.pathname);
  const userSectionLabel = adminToolsOpen ? "الرجوع لصلاحيات المستخدم" : "المستخدم";
  const userSectionTitle = adminToolsOpen ? "الرجوع لصلاحيات المستخدم" : "فتح صفحات المستخدم";
  const UserSectionIcon = adminToolsOpen ? iconMap.UserCog : UserIcon;
  const sidebarText = variant === "admin" ? sidebarCopy.ar : {
    defaultUser: t("app.defaultUser"),
    language: t("language.label"),
    member: t("app.member"),
    walletBalance: t("sidebar.walletBalance"),
  };

  useEffect(() => {
    const refreshAvatar = () => setProfileAvatarUrl(getStoredProfileAvatar());

    window.addEventListener("storage", refreshAvatar);
    window.addEventListener(profileAvatarChangedEvent, refreshAvatar);

    return () => {
      window.removeEventListener("storage", refreshAvatar);
      window.removeEventListener(profileAvatarChangedEvent, refreshAvatar);
    };
  }, []);

  useEffect(() => () => window.clearTimeout(adminPinRevealTimeoutRef.current), []);

  useEffect(() => {
    if (adminToolsRouteActive && adminToolsUnlocked) {
      setAdminToolsOpen(true);
      setAdminUserNavOpen(false);
      return;
    }

    if (adminUserNavActive) {
      setAdminToolsOpen(false);
      setAdminUserNavOpen(true);
    }
  }, [adminToolsRouteActive, adminToolsUnlocked, adminUserNavActive, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const copyAccountId = async () => {
    const accountId = user?.id || "usr_admin_001";
    try {
      await navigator.clipboard.writeText(accountId);
    } catch {
      // The ID remains visible for manual copying if clipboard access is blocked.
    }
  };

  const handleUserButtonClick = () => {
    if (variant === "admin") {
      if (adminToolsOpen) {
        setAdminExitConfirmOpen(true);
        return;
      }

      setAdminToolsOpen(false);
      setAdminUserNavOpen((current) => !current);
      return;
    }

    onClose?.();
    navigate(`${accountPrefix}/profile`);
  };

  const handleAdminButtonClick = () => {
    if (!adminToolsUnlocked) {
      setAdminGateOpen(true);
      setAdminGatePin("");
      setVisibleAdminPinIndex(null);
      setAdminGateError("");
      return;
    }

    setAdminUserNavOpen(false);
    setAdminToolsOpen((current) => !current);
    navigate("/admin/tools/dashboard");
  };

  const unlockAdminTools = async (pin) => {
    if (adminGateVerifying) return false;

    window.clearTimeout(adminPinRevealTimeoutRef.current);
    setVisibleAdminPinIndex(null);

    if (pin.length !== 4 || !token) {
      setAdminGateError("الرقم السري غير صحيح");
      return false;
    }

    setAdminGateVerifying(true);
    setAdminGateError("");

    try {
      const result = await verifyAdminSecurityPin(token, pin);
      if (!result.valid) {
        throw new Error("Invalid security PIN");
      }
      setAdminToolsUnlocked(true);
      try {
        sessionStorage.setItem(adminToolsUnlockedKey, "true");
      } catch {
        // Keep this as a UI-only temporary gate if session storage is unavailable.
      }
      setAdminToolsOpen(true);
      setAdminUserNavOpen(false);
      setAdminGateOpen(false);
      setAdminGatePin("");
      setAdminGateError("");
      navigate("/admin/tools/dashboard");
      return true;
    } catch {
      setAdminGateError("الرقم السري غير صحيح");
      return false;
    } finally {
      setAdminGateVerifying(false);
    }
  };

  const handleAdminGateSubmit = async (event) => {
    event.preventDefault();
    await unlockAdminTools(adminGatePin);
  };

  const closeAdminGate = () => {
    window.clearTimeout(adminPinRevealTimeoutRef.current);
    setAdminGateOpen(false);
    setAdminGatePin("");
    setVisibleAdminPinIndex(null);
    setAdminGateError("");
  };

  const handleAdminPinChange = (event) => {
    const nextPin = event.target.value.replace(/\D/g, "").slice(0, 4);
    window.clearTimeout(adminPinRevealTimeoutRef.current);

    if (nextPin.length > adminGatePin.length) {
      setVisibleAdminPinIndex(nextPin.length - 1);
    } else {
      setVisibleAdminPinIndex(null);
    }

    setAdminGatePin(nextPin);
    setAdminGateError("");

    adminPinRevealTimeoutRef.current = window.setTimeout(() => {
      setVisibleAdminPinIndex(null);
      if (nextPin.length === 4) void unlockAdminTools(nextPin);
    }, nextPin.length === 4 ? 140 : 650);
  };

  const closeAdminExitConfirm = () => {
    setAdminExitConfirmOpen(false);
  };

  const confirmAdminExit = () => {
    setAdminToolsOpen(false);
    setAdminToolsUnlocked(false);
    setAdminUserNavOpen(true);
    setAdminExitConfirmOpen(false);

    try {
      sessionStorage.removeItem(adminToolsUnlockedKey);
    } catch {
      // The UI still leaves admin tools even if storage cannot be updated.
    }

    navigate("/admin/user/dashboard");
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[80] bg-slate-950/35 backdrop-blur-[2px] transition duration-300 dark:bg-[#050816]/55 xl:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        dir={variant === "admin" || language === "ar" ? "rtl" : "ltr"}
        className={`${variant === "admin" ? "admin-control-sidebar" : ""} no-scrollbar fixed right-0 top-0 z-[90] flex h-screen w-[min(86vw,286px)] flex-col overflow-x-hidden overflow-y-auto rounded-l-[24px] border-l border-sky-100 bg-white p-3.5 text-slate-950 shadow-[0_24px_70px_rgba(14,165,233,0.16)] transition duration-300 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#0A0F1D] dark:text-[#C4C9D4] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)] sm:w-[min(78vw,300px)] sm:rounded-l-[28px] sm:p-4 xl:top-0 xl:z-[90] xl:w-[284px] xl:shrink-0 xl:translate-x-0 xl:rounded-none xl:p-4 xl:shadow-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex shrink-0 items-center justify-center">
          <NavLink
            to={variant === "admin" ? "/admin/user/dashboard" : "/customer/dashboard"}
            onClick={onClose}
            className="flex justify-center"
          >
            <Brand compact tagline={false} />
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            className="absolute left-0 grid h-10 w-10 place-items-center rounded-2xl border border-sky-100 bg-[#EFFBFF] text-slate-700 transition hover:border-[#C4B5FD] hover:bg-[#F5F3FF] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111827] dark:text-[#C4C9D4] dark:hover:border-[#A855F7]/55 dark:hover:bg-[#1A2335] xl:hidden"
            aria-label={variant === "admin" ? "إغلاق القائمة" : t("sidebar.closeMenu")}
            title={variant === "admin" ? "إغلاق القائمة" : t("sidebar.closeMenu")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 shrink-0 rounded-[20px] bg-gradient-to-br from-[#FBCFE8] via-[#E0F2FE] to-[#DDD6FE] p-px shadow-[0_18px_38px_rgba(14,165,233,0.10)] dark:from-[#312E81]/70 dark:via-[#111827] dark:to-[#0B1020] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)]">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[19px] bg-[#EFFBFF] p-2 dark:bg-[#0D1324] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <button
            type="button"
            onClick={handleUserButtonClick}
            className="interactive-ring relative block shrink-0 rounded-2xl transition hover:-translate-y-0.5"
            aria-label={variant === "admin" ? "فتح صفحات المستخدم" : t("sidebar.profile")}
            title={variant === "admin" ? "صفحات المستخدم" : t("sidebar.profile")}
          >
            <div className="grid h-11 w-11 overflow-hidden rounded-2xl bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#A855F7] text-xl font-black text-white shadow-[0_0_20px_rgba(139,92,246,0.32)] ring-2 ring-white/70 transition hover:ring-[#8B5CF6]/60 dark:ring-white/10 dark:hover:ring-[#A855F7]/65">
              {sidebarAvatarUrl ? (
                <img src={sidebarAvatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center">{sidebarAvatarInitial}</span>
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400 dark:border-[#0D1324]" />
          </button>
          <div className="min-w-0">
            <button
              type="button"
              onClick={copyAccountId}
              className="flex h-4 max-w-full items-center gap-1 text-right text-[11px] font-black text-[#7C3AED] transition hover:text-[#A855F7] dark:text-[#C084FC] dark:hover:text-[#E9D5FF]"
              title={variant === "admin" ? "اضغط لنسخ معرّف الحساب" : t("sidebar.copyAccountId")}
              aria-label={variant === "admin" ? `نسخ معرّف الحساب ${user?.id || "usr_admin_001"}` : t("sidebar.copyAccountIdAria", { id: user?.id || "usr_admin_001" })}
            >
              <Copy className="h-3 w-3 shrink-0" />
              <span className="truncate">{user?.id || "usr_admin_001"}</span>
            </button>
            <p className="truncate text-sm font-black text-slate-950 dark:text-white">{user?.name || sidebarText.defaultUser}</p>
            <p className="mt-1 inline-flex max-w-full rounded-lg bg-[#F5F3FF] px-2 py-0.5 text-[11px] font-bold text-[#8B5CF6] dark:bg-[#1A2335] dark:text-[#A78BFA]">
              {user?.tier || sidebarText.member}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-500 transition hover:border-rose-200 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-[#2A1020] dark:text-rose-200 dark:hover:border-rose-300/40 dark:hover:bg-[#3A1225]"
            aria-label={variant === "admin" ? "تسجيل الخروج" : t("sidebar.logout")}
            title={variant === "admin" ? "تسجيل الخروج" : t("sidebar.logout")}
          >
            <LogOutIcon className="h-5 w-5" />
          </button>
          </div>
        </div>

        {variant === "customer" && (
          <div className="mt-2 flex h-10 w-full shrink-0 items-center justify-between gap-2 rounded-2xl border border-sky-100 bg-white/90 px-2.5 text-xs font-black text-slate-600 dark:border-white/10 dark:bg-[#0D1324] dark:text-[#C4C9D4]">
            <span className="inline-flex items-center gap-1.5">
              <Languages className="h-4 w-4 text-[#8B5CF6]" />
              {sidebarText.language}
            </span>
            <span className="inline-flex rounded-xl bg-slate-50 p-0.5 dark:bg-[#111827]">
              <button type="button" onClick={() => setLanguage("ar")} className={`rounded-lg px-2 py-1 ${language === "ar" ? "bg-[#7C3AED] text-white" : "text-slate-500 dark:text-[#8A94A7]"}`}>AR</button>
              <button type="button" onClick={() => setLanguage("en")} className={`rounded-lg px-2 py-1 ${language === "en" ? "bg-[#38BDF8] text-[#050816]" : "text-slate-500 dark:text-[#8A94A7]"}`}>EN</button>
            </span>
          </div>
        )}

        {variant === "admin" && adminUserItems.length > 0 && (
          <div className="mt-4 shrink-0 space-y-2 pb-4">
            <button
              type="button"
              onClick={handleUserButtonClick}
              className={`group flex h-14 w-full items-center gap-3 rounded-[22px] border px-3 text-right text-sm font-black transition hover:-translate-y-0.5 ${
                adminToolsOpen
                  ? "border-[#BAE6FD] bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(236,253,245,0.94),rgba(255,247,237,0.9))] text-slate-900 shadow-[0_18px_36px_rgba(14,165,233,0.13)] hover:border-[#38BDF8] dark:border-[#38BDF8]/25 dark:bg-[linear-gradient(135deg,rgba(8,47,73,0.78),rgba(6,78,59,0.58),rgba(17,24,39,0.84))] dark:text-white dark:hover:border-[#7DD3FC]/55"
                  : adminUserNavActive
                  ? "border-[#FB7185]/45 bg-[linear-gradient(135deg,rgba(255,241,242,0.96),rgba(236,253,245,0.94),rgba(240,249,255,0.92))] text-slate-950 shadow-[0_18px_36px_rgba(20,184,166,0.16)] dark:border-[#F59E0B]/35 dark:bg-[linear-gradient(135deg,rgba(45,18,37,0.96),rgba(15,44,43,0.88),rgba(17,24,39,0.92))] dark:text-white dark:shadow-[0_0_24px_rgba(251,113,133,0.16)]"
                  : "border-[#FBCFE8] bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(236,253,245,0.9),rgba(240,249,255,0.9))] text-slate-700 shadow-[0_14px_30px_rgba(15,118,110,0.10)] hover:border-[#FDBA74] hover:text-slate-950 dark:border-[rgba(251,191,36,0.18)] dark:bg-[linear-gradient(135deg,rgba(34,18,43,0.72),rgba(10,47,45,0.62),rgba(17,24,39,0.86))] dark:text-[#D9E4EA] dark:hover:border-[#F59E0B]/45 dark:hover:text-white"
              }`}
              aria-expanded={adminUserNavOpen}
              aria-controls="admin-user-pages"
              title={userSectionTitle}
            >
              <span
                className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-[18px] text-white shadow-[0_10px_24px_rgba(20,184,166,0.25)] ring-2 ring-white/80 transition group-hover:rotate-0 dark:ring-white/10 ${
                  adminToolsOpen
                    ? "-rotate-3 bg-[conic-gradient(from_40deg,#38BDF8,#22C55E,#FACC15,#6366F1,#38BDF8)]"
                    : "rotate-3 bg-[conic-gradient(from_160deg,#FB7185,#F59E0B,#14B8A6,#6366F1,#FB7185)]"
                }`}
              >
                <UserSectionIcon className={`h-5 w-5 transition group-hover:rotate-0 ${adminToolsOpen ? "rotate-3" : "-rotate-3"}`} />
                <span className="absolute -left-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-white text-[#FB7185] shadow-sm dark:bg-[#111827] dark:text-[#FDE68A]">
                  <SparklesIcon className="h-2.5 w-2.5" />
                </span>
              </span>
              <span className="min-w-0 flex-1 truncate">{userSectionLabel}</span>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/75 text-[#0F766E] shadow-sm transition dark:bg-white/10 dark:text-[#FDE68A]">
                <ChevronDownIcon className={`h-4.5 w-4.5 transition ${adminUserNavOpen ? "rotate-180" : ""}`} />
              </span>
            </button>

            <button
              type="button"
              onClick={handleAdminButtonClick}
              className={`group flex h-[52px] w-full items-center gap-3 overflow-hidden rounded-[22px] border px-3 text-right text-sm font-black transition hover:-translate-y-0.5 ${
                adminToolsOpen
                  ? "border-[#FACC15]/55 bg-[linear-gradient(135deg,rgba(255,251,235,0.96),rgba(239,246,255,0.94),rgba(236,253,245,0.9))] text-slate-950 shadow-[0_18px_36px_rgba(245,158,11,0.16)] dark:border-[#FDE68A]/35 dark:bg-[linear-gradient(135deg,rgba(68,42,12,0.78),rgba(30,41,59,0.82),rgba(6,78,59,0.62))] dark:text-white dark:shadow-[0_0_24px_rgba(250,204,21,0.14)]"
                  : "border-[#FDE68A] bg-[linear-gradient(135deg,rgba(255,251,235,0.92),rgba(240,249,255,0.9),rgba(236,253,245,0.86))] text-slate-800 shadow-[0_14px_30px_rgba(245,158,11,0.10)] hover:border-[#F59E0B] hover:text-slate-950 dark:border-[rgba(253,230,138,0.18)] dark:bg-[linear-gradient(135deg,rgba(55,35,12,0.68),rgba(15,23,42,0.86),rgba(6,78,59,0.46))] dark:text-[#F7E7B7] dark:hover:border-[#FDE68A]/45 dark:hover:text-white"
              }`}
              title="الأدمن"
              aria-expanded={adminToolsOpen}
            >
              <span className="relative grid h-10 w-10 shrink-0 -rotate-3 place-items-center rounded-[18px] bg-[conic-gradient(from_20deg,#FACC15,#22C55E,#38BDF8,#A855F7,#FACC15)] text-white shadow-[0_10px_24px_rgba(245,158,11,0.24)] ring-2 ring-white/80 transition group-hover:rotate-0 dark:ring-white/10">
                <AdminIcon className="h-5 w-5 rotate-3 transition group-hover:rotate-0" />
                <span className="absolute -left-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-white text-[#D97706] shadow-sm dark:bg-[#111827] dark:text-[#FDE68A]">
                  <CrownIcon className="h-2.5 w-2.5" />
                </span>
              </span>
              <span className="min-w-0 flex-1 truncate">الأدمن</span>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.75)]" />
            </button>

            {adminToolsOpen && (
              <div className="space-y-1.5 pe-4">
                {adminToolItems.map((item) => {
                  const Icon = iconMap[item.icon] || iconMap.Gauge;
                  return (
                    <NavLink
                      key={item.label}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-right text-sm font-bold transition ${
                          isActive
                            ? "bg-amber-50 text-[#B45309] shadow-[inset_3px_0_0_#F59E0B] dark:bg-[#2A2112] dark:text-[#FDE68A] dark:shadow-[inset_3px_0_0_#FACC15]"
                            : "text-slate-500 hover:bg-amber-50 hover:text-[#B45309] dark:text-[#9CA3AF] dark:hover:bg-[#241F16] dark:hover:text-[#FDE68A]"
                        }`
                      }
                    >
                      <Icon className="sidebar-stable-tool-icon h-4.5 w-4.5 shrink-0 text-amber-600 transition dark:text-amber-300" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="grid min-w-5 place-items-center rounded-lg bg-[#F59E0B] px-1.5 py-0.5 text-[11px] font-black text-white">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            )}

            {adminUserNavOpen && (
              <div id="admin-user-pages" className="space-y-2.5 pe-4">
                <NavLink
                  to={`${accountPrefix}/wallet`}
                  onClick={onClose}
                  className="admin-user-wallet-card group relative block overflow-hidden rounded-[17px] border px-2.5 py-2 text-right transition duration-300 hover:-translate-y-0.5"
                >
                  <span aria-hidden="true" className="pointer-events-none absolute -right-7 -top-9 h-24 w-24 rounded-full bg-fuchsia-400/20 blur-2xl transition group-hover:bg-fuchsia-400/30 dark:bg-fuchsia-500/15" />
                  <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 -left-7 h-24 w-24 rounded-full bg-cyan-300/24 blur-2xl transition group-hover:bg-cyan-300/34 dark:bg-cyan-400/12" />
                  <p className="relative text-center text-[9px] font-black leading-3 tracking-wide text-violet-600 dark:text-violet-200">{sidebarText.walletBalance}</p>
                  <div className="relative mt-1 flex flex-col items-center gap-1.5 text-center">
                    <span dir="ltr" className="admin-wallet-balance max-w-full truncate text-base font-black leading-5">{walletBalance}</span>
                    <span className="admin-wallet-plus grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/75 text-white transition duration-300 group-hover:rotate-90 group-hover:scale-110 dark:border-white/15">
                      <Plus className="h-3.5 w-3.5 stroke-[2.6]" />
                    </span>
                  </div>
                </NavLink>

                {adminUserItems.map((item) => {
                  const Icon = iconMap[item.icon] || iconMap.Home;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `admin-user-nav-link group relative flex h-11 w-full items-center gap-2.5 overflow-hidden rounded-[15px] border px-2.5 text-right text-sm font-black transition duration-200 hover:-translate-y-px ${
                          isActive
                            ? "border-indigo-400/70 bg-[linear-gradient(135deg,#4338CA,#6D28D9)] text-white shadow-[0_8px_20px_rgba(79,70,229,0.24)] dark:border-violet-300/30 dark:bg-[linear-gradient(135deg,#3730A3,#6D28D9)] dark:shadow-[0_0_18px_rgba(109,40,217,0.20)]"
                            : "border-slate-200/90 bg-white/75 text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.045)] hover:border-indigo-300 hover:bg-indigo-50/80 hover:text-indigo-700 hover:shadow-[0_7px_16px_rgba(79,70,229,0.10)] dark:border-white/10 dark:bg-white/[0.035] dark:text-[#AAB3C2] dark:hover:border-indigo-400/30 dark:hover:bg-indigo-400/[0.08] dark:hover:text-indigo-200"
                        }`
                      }
                    >
                      <span className="admin-user-nav-icon sidebar-stable-nav-icon relative grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-indigo-200 bg-indigo-50 text-indigo-700 transition duration-200 group-hover:border-indigo-300 group-hover:bg-indigo-100 group-hover:text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200 dark:group-hover:text-indigo-200">
                        <Icon className="h-4 w-4 stroke-[2]" />
                      </span>
                      <span className="relative min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span dir="ltr" className="admin-user-nav-badge inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#312E81] px-1.5 text-[9px] font-black tabular-nums text-white shadow-[0_3px_9px_rgba(49,46,129,0.22)] dark:bg-indigo-400 dark:text-[#0B1020]">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {variant === "customer" && (
          <NavLink
            to={`${accountPrefix}/wallet`}
            onClick={onClose}
            className="admin-user-wallet-card group relative mt-2.5 block overflow-hidden rounded-[17px] border px-2.5 py-2 text-right transition duration-300 hover:-translate-y-0.5"
          >
            <span aria-hidden="true" className="pointer-events-none absolute -right-7 -top-9 h-24 w-24 rounded-full bg-fuchsia-400/20 blur-2xl transition group-hover:bg-fuchsia-400/30 dark:bg-fuchsia-500/15" />
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 -left-7 h-24 w-24 rounded-full bg-cyan-300/24 blur-2xl transition group-hover:bg-cyan-300/34 dark:bg-cyan-400/12" />
            <p className="relative text-center text-[9px] font-black leading-3 tracking-wide text-violet-600 dark:text-violet-200">{sidebarText.walletBalance}</p>
            <div className="relative mt-1 flex flex-col items-center gap-1.5 text-center">
              <span dir="ltr" className="admin-wallet-balance max-w-full truncate text-base font-black leading-5">{walletBalance}</span>
              <span className="admin-wallet-plus grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/75 text-white transition duration-300 group-hover:rotate-90 group-hover:scale-110 dark:border-white/15">
                <Plus className="h-3.5 w-3.5 stroke-[2.6]" />
              </span>
            </div>
          </NavLink>
        )}

        <nav className="no-scrollbar mt-3 flex-1 space-y-2.5 overflow-y-auto pb-4">
          {visibleItems.map((item) => {
            const Icon = iconMap[item.icon] || iconMap.Home;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `admin-user-nav-link group relative flex h-11 w-full items-center gap-2.5 overflow-hidden rounded-[15px] border px-2.5 text-right text-sm font-black transition duration-200 hover:-translate-y-px ${
                    isActive
                      ? "border-indigo-400/70 bg-[linear-gradient(135deg,#4338CA,#6D28D9)] text-white shadow-[0_8px_20px_rgba(79,70,229,0.24)] dark:border-violet-300/30 dark:bg-[linear-gradient(135deg,#3730A3,#6D28D9)] dark:shadow-[0_0_18px_rgba(109,40,217,0.20)]"
                      : "border-slate-200/90 bg-white/75 text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.045)] hover:border-indigo-300 hover:bg-indigo-50/80 hover:text-indigo-700 hover:shadow-[0_7px_16px_rgba(79,70,229,0.10)] dark:border-white/10 dark:bg-white/[0.035] dark:text-[#AAB3C2] dark:hover:border-indigo-400/30 dark:hover:bg-indigo-400/[0.08] dark:hover:text-indigo-200"
                  }`
                }
              >
                <span className="admin-user-nav-icon sidebar-stable-nav-icon relative grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-indigo-200 bg-indigo-50 text-indigo-700 transition duration-200 group-hover:border-indigo-300 group-hover:bg-indigo-100 group-hover:text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200 dark:group-hover:text-indigo-200">
                  <Icon className="h-4 w-4 stroke-[2]" />
                </span>
                <span className="relative min-w-0 flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span dir="ltr" className="admin-user-nav-badge inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#312E81] px-1.5 text-[9px] font-black tabular-nums text-white shadow-[0_3px_9px_rgba(49,46,129,0.22)] dark:bg-indigo-400 dark:text-[#0B1020]">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <footer dir="rtl" className="mt-auto shrink-0 border-t border-violet-100/80 px-2 pb-1 pt-3 text-center dark:border-white/10">
          <p className="text-[10px] font-bold leading-5 text-slate-400 dark:text-[#7C8598] sm:text-[11px]">
            جميع الحقوق محفوظة لدى © <span className="winnie-brand-name font-black not-italic">ويني</span> 2026
          </p>
        </footer>

      </aside>

      {adminGateOpen && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <form
            onSubmit={handleAdminGateSubmit}
            className="w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/70 bg-white text-right shadow-[0_30px_90px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[#0D1324] dark:text-white"
          >
            <div className="bg-[linear-gradient(135deg,#FFF7ED,#ECFDF5,#EFF6FF)] p-5 dark:bg-[linear-gradient(135deg,#2A160A,#052E2B,#111827)]">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[20px] bg-[conic-gradient(from_20deg,#FACC15,#22C55E,#38BDF8,#A855F7,#FACC15)] text-white shadow-[0_12px_26px_rgba(245,158,11,0.24)]">
                  <AdminIcon className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-slate-950 dark:text-white">هل أنت متأكد من التوجه إلى صفحة الأدمن؟</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-[#AAB3C2]">أدخل الرقم السري المكوّن من 4 أرقام لفتح أدوات الأدمن.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700 dark:text-[#D9E4EA]">الرقم السري</span>
                <div className="group relative mx-auto grid max-w-[260px] grid-cols-4 gap-2.5" dir="ltr">
                  <input
                    type="text"
                    value={adminGatePin}
                    onChange={handleAdminPinChange}
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    autoComplete="one-time-code"
                    aria-label="الرقم السري المكوّن من 4 أرقام"
                    disabled={adminGateVerifying}
                    autoFocus
                    className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
                  />
                  {Array.from({ length: 4 }, (_, index) => {
                    const digit = adminGatePin[index];
                    const isActive = index === adminGatePin.length && adminGatePin.length < 4;

                    return (
                      <span
                        key={index}
                        aria-hidden="true"
                        className={`grid h-14 place-items-center rounded-2xl border text-2xl font-black shadow-sm transition-all duration-200 ${
                          digit
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-emerald-100 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-200"
                            : isActive
                              ? "border-amber-400 bg-amber-50 text-slate-950 ring-4 ring-amber-100 dark:border-amber-300/70 dark:bg-amber-300/10 dark:text-white dark:ring-amber-300/10"
                              : "border-sky-100 bg-[#F8FCFF] text-slate-950 group-focus-within:border-sky-200 dark:border-white/10 dark:bg-[#111827] dark:text-white"
                        }`}
                      >
                        {digit ? (visibleAdminPinIndex === index ? digit : "•") : "\u00A0"}
                      </span>
                    );
                  })}
                </div>
              </label>

              {adminGateError && (
                <p className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600 dark:border-rose-400/20 dark:bg-[#2A1020] dark:text-rose-200">
                  {adminGateError}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={adminGateVerifying}
                  aria-busy={adminGateVerifying}
                  className="h-12 flex-1 rounded-2xl bg-[linear-gradient(135deg,#F59E0B,#22C55E,#38BDF8)] px-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(34,197,94,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  فتح أدوات الأدمن
                </button>
                <button
                  type="button"
                  onClick={closeAdminGate}
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#111827] dark:text-[#C4C9D4] dark:hover:bg-[#1A2335]"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {adminExitConfirmOpen && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-exit-title"
            dir="rtl"
            className="w-full max-w-[340px] overflow-hidden rounded-[24px] border border-white/70 bg-white text-right shadow-[0_24px_70px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-[#0D1324] dark:text-white"
          >
            <div className="bg-[linear-gradient(135deg,#EFF6FF,#ECFDF5,#FFF7ED)] p-4 dark:bg-[linear-gradient(135deg,#082F49,#052E2B,#111827)]">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[16px] bg-[conic-gradient(from_40deg,#38BDF8,#22C55E,#FACC15,#6366F1,#38BDF8)] text-white shadow-[0_10px_22px_rgba(14,165,233,0.22)]">
                  <UserSectionIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 id="admin-exit-title" className="text-base font-black leading-6 text-slate-950 dark:text-white">
                    مغادرة صلاحيات الأدمن؟
                  </h2>
                  <p className="mt-1 text-xs font-bold leading-5 text-slate-500 dark:text-[#AAB3C2]">
                    سيتم الرجوع إلى واجهة المستخدم وإغلاق أدوات الأدمن.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <p className="rounded-2xl border border-sky-100 bg-[#F8FCFF] px-3 py-2 text-xs font-bold leading-6 text-slate-600 dark:border-white/10 dark:bg-[#111827] dark:text-[#C4C9D4]">
                ستحتاج لإدخال الرقم السري الخاص بالأدمن مرة أخرى عند العودة للصلاحيات.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={closeAdminExitConfirm}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#111827] dark:text-[#C4C9D4] dark:hover:bg-[#1A2335]"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={confirmAdminExit}
                  className="h-11 rounded-2xl bg-[linear-gradient(135deg,#38BDF8,#22C55E,#FACC15)] px-4 text-sm font-black text-white shadow-[0_14px_28px_rgba(14,165,233,0.20)] transition hover:-translate-y-0.5"
                >
                  نعم
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function isAdminUserPath(pathname) {
  return pathname === "/admin" || pathname === "/admin/user" || pathname.startsWith("/admin/user/");
}

function isAdminToolsPath(pathname) {
  return pathname === "/admin/tools" || pathname.startsWith("/admin/tools/");
}

const sidebarCopy = {
  ar: {
    defaultUser: "مستخدم ويني",
    language: "اللغة",
    member: "عضو مميز",
    walletBalance: "رصيد المحفظة",
  },
  en: {
    defaultUser: "Winnie user",
    language: "Language",
    member: "Premium member",
    walletBalance: "Wallet balance",
  },
};
