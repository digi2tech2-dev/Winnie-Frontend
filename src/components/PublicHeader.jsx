import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Building2, CircleUserRound, Home, Languages, LayoutGrid, LogIn, Menu, Search, UserPlus, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import GoogleMark from "./GoogleMark";
import HeaderSearchOverlay from "./HeaderSearchOverlay";
import ProductPurchaseModal from "./ProductPurchaseModal";
import ThemeToggle from "./ThemeToggle";

const purchaseLinks = [
  {
    label: { ar: "الرئيسية", en: "Home" },
    path: "/",
    icon: Home,
    iconClass:
      "bg-[#E0F2FE] text-[#0369A1] ring-1 ring-[#7DD3FC]/60 shadow-[0_10px_22px_rgba(14,165,233,0.16)] dark:bg-[linear-gradient(135deg,#7C3AED,#38BDF8)] dark:text-white dark:ring-0 dark:shadow-[0_0_18px_rgba(139,92,246,0.25)]",
  },
  {
    label: { ar: "الأقسام", en: "Categories" },
    path: "/categories",
    icon: LayoutGrid,
    iconClass:
      "bg-[#ECFEFF] text-[#0E7490] ring-1 ring-[#67E8F9]/60 shadow-[0_10px_22px_rgba(6,182,212,0.14)] dark:bg-[linear-gradient(135deg,#06B6D4,#7C3AED)] dark:text-white dark:ring-0 dark:shadow-[0_0_18px_rgba(139,92,246,0.25)]",
  },
  {
    label: { ar: "من نحن", en: "About" },
    path: "/about",
    icon: Building2,
    iconClass:
      "bg-[#ECFEFF] text-[#0E7490] ring-1 ring-[#67E8F9]/60 shadow-[0_10px_22px_rgba(6,182,212,0.14)] dark:bg-[linear-gradient(135deg,#7C3AED,#38BDF8)] dark:text-white dark:ring-0 dark:shadow-[0_0_18px_rgba(139,92,246,0.25)]",
  },
];

const authLinks = [
  {
    label: { ar: "تسجيل الدخول", en: "Login" },
    path: "/login",
    icon: LogIn,
    className:
      "border-[#BAE6FD] bg-[#E0F2FE] text-[#075985] shadow-[0_14px_30px_rgba(14,165,233,0.16)] hover:border-[#7DD3FC] hover:bg-[#BAE6FD] dark:border-transparent dark:bg-[linear-gradient(135deg,#8B5CF6,#38BDF8)] dark:text-white dark:shadow-[0_0_24px_rgba(139,92,246,0.24)]",
  },
  {
    label: { ar: "إنشاء حساب", en: "Register" },
    path: "/register",
    icon: UserPlus,
    className:
      "border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9] shadow-[0_14px_30px_rgba(124,58,237,0.14)] hover:border-[#C4B5FD] hover:bg-[#EDE9FE] dark:border-transparent dark:bg-[linear-gradient(135deg,#7C3AED,#A855F7)] dark:text-white dark:shadow-[0_0_24px_rgba(139,92,246,0.24)]",
  },
];

const PUBLIC_SIDEBAR_PANEL_Z_INDEX = 2147483647;
const PUBLIC_SIDEBAR_BACKDROP_Z_INDEX = PUBLIC_SIDEBAR_PANEL_Z_INDEX - 1;

const publicText = {
  ar: {
    menuButton: "القائمة",
    openMenu: "فتح قائمة الشراء",
    closeMenu: "إغلاق القائمة",
    menuTitle: "القائمة",
    themeTitle: "تغيير المظهر",
    lightMode: "الوضع الفاتح",
    darkMode: "الوضع الغامق",
    googleLogin: "تسجيل عبر جوجل",
    note: "تصفح الأقسام من الصفحة العامة، وعند إتمام الطلب هتدخل لحسابك.",
    loginAria: "تسجيل الدخول",
    languageTitle: "تغيير اللغة",
    settingsTitle: "الإعدادات",
    languageLabel: "اللغة",
  },
  en: {
    menuButton: "Menu",
    openMenu: "Open purchase menu",
    closeMenu: "Close menu",
    menuTitle: "Menu",
    themeTitle: "Appearance",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    googleLogin: "Continue with Google",
    note: "Browse categories from the public pages. You can sign in when you are ready to place an order.",
    loginAria: "Login",
    languageTitle: "Change language",
    settingsTitle: "Settings",
    languageLabel: "Language",
  },
};

export default function PublicHeader() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState(null);
  const { language, setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const closeSidebar = () => setSidebarOpen(false);
  const t = publicText[language];
  const nextLanguage = language === "ar" ? "en" : "ar";
  const isLoginPage = location.pathname === "/login";

  const confirmPurchase = () => {
    setPurchaseItem(null);
    navigate("/login", { state: { from: "/customer/dashboard" } });
  };

  return (
    <>
      <header dir="ltr" className="site-header-warm fixed inset-x-0 top-0 z-[70] border-b border-sky-100/90 bg-white/[0.88] px-4 py-4 shadow-[0_18px_55px_rgba(14,165,233,0.12)] backdrop-blur-2xl dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(10,15,29,0.95)] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)] lg:px-8">
        <div className="mx-auto flex max-w-[1120px] items-center gap-2 sm:gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-0.5 sm:gap-1">
            <span className="grid h-11 w-11 shrink-0 place-items-center sm:h-14 sm:w-14">
              <img src="/logo.png" alt="شعار Winnie Fun" className="h-10 w-10 object-contain sm:h-[52px] sm:w-[52px]" />
            </span>
            <span className="-ml-0.5 min-w-0 text-center leading-none drop-shadow-[0_0_16px_rgba(139,92,246,0.25)]">
              <span className="block truncate text-xl font-black italic tracking-wide text-slate-950 dark:text-white sm:text-3xl">
                innie
              </span>
              <span className="mt-0.5 block text-[8px] font-black uppercase tracking-[0.3em] text-[#A855F7] sm:text-[11px] sm:tracking-[0.34em]">
                Fun
              </span>
            </span>
          </Link>

          <div className="mx-auto" />

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="فتح البحث"
              title="بحث"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-sky-100 bg-white/90 text-[#8B5CF6] shadow-[0_10px_24px_rgba(14,165,233,0.10)] transition hover:border-[#C4B5FD] hover:bg-[#F5F3FF] hover:text-[#6D28D9] dark:border-white/10 dark:bg-[#111827] dark:text-[#C084FC] dark:hover:border-[#A855F7]/70 dark:hover:bg-[#1A2335]"
            >
              <Search className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setLanguage(nextLanguage)}
              aria-label={t.languageTitle}
              title={t.languageTitle}
              className="hidden h-11 shrink-0 items-center gap-1 rounded-2xl border border-sky-100 bg-white/90 p-1 text-[11px] font-black text-slate-600 shadow-[0_10px_24px_rgba(14,165,233,0.10)] transition hover:border-[#C4B5FD] hover:bg-[#F5F3FF] dark:border-white/10 dark:bg-[#111827] dark:text-[#C4C9D4] dark:hover:border-[#A855F7]/70 dark:hover:bg-[#1A2335] sm:inline-flex"
            >
              <Languages className="hidden h-4 w-4 text-[#8B5CF6] sm:block" />
              <span className={`rounded-xl px-2 py-1.5 transition ${language === "ar" ? "bg-[#7C3AED] text-white shadow-[0_8px_18px_rgba(124,58,237,0.24)]" : "text-slate-500 dark:text-[#8A94A7]"}`}>
                AR
              </span>
              <span className={`rounded-xl px-2 py-1.5 transition ${language === "en" ? "bg-[#38BDF8] text-[#050816] shadow-[0_8px_18px_rgba(56,189,248,0.24)]" : "text-slate-500 dark:text-[#8A94A7]"}`}>
                EN
              </span>
            </button>

            <Link
              to="/login"
              aria-label={t.loginAria}
              title={t.loginAria}
              className={`group relative inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-full border text-[#7C3AED] shadow-[0_12px_28px_rgba(14,165,233,0.18)] transition hover:-translate-y-0.5 hover:border-[#38BDF8]/80 hover:text-[#0369A1] dark:text-[#E9D5FF] dark:shadow-[0_0_28px_rgba(168,85,247,0.28)] dark:hover:border-[#38BDF8]/70 dark:hover:text-[#38BDF8] ${
                isLoginPage
                  ? "border-[#38BDF8]/80 bg-[linear-gradient(135deg,#ECFEFF_0%,#FFFFFF_45%,#F5F3FF_100%)] px-3 sm:px-4 dark:border-[#38BDF8]/60 dark:bg-[linear-gradient(135deg,#0D1324,#1A2335,#24133D)]"
                  : "w-12 border-[#C4B5FD]/80 bg-[linear-gradient(135deg,#FFFFFF_0%,#EEF6FF_50%,#F5F3FF_100%)] px-0 dark:border-[#A855F7]/55 dark:bg-[linear-gradient(135deg,#111827,#1A2335)]"
              }`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/70 ring-1 ring-[#DDD6FE]/80 transition group-hover:bg-white group-hover:ring-[#7DD3FC] dark:bg-[#0D1324]/90 dark:ring-white/10 dark:group-hover:ring-[#38BDF8]/55">
                <CircleUserRound className="h-7 w-7 transition group-hover:scale-105" />
              </span>
              {isLoginPage && (
                <span className="hidden whitespace-nowrap pe-2 text-sm font-black sm:inline">
                  {t.loginAria}
                </span>
              )}
              <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-[linear-gradient(135deg,#7C3AED,#38BDF8)] text-white shadow-[0_8px_18px_rgba(15,23,42,0.25)] dark:border-[#0A0F1D]">
                <LogIn className="h-3 w-3" />
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={t.openMenu}
              title={t.openMenu}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-sky-100 bg-sky-50/90 px-3 text-sm font-black text-[#8B5CF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:border-[#C4B5FD] hover:bg-[#F5F3FF] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111827] dark:text-[#A855F7] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)] dark:hover:border-[#A855F7]/70 dark:hover:bg-[#1A2335]"
            >
              <Menu className="h-5 w-5" />
              <span className="hidden sm:inline">{t.menuButton}</span>
            </button>
          </div>
        </div>
      </header>

      <HeaderSearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={navigate}
        onProductSelect={(product) => setPurchaseItem({ product, category: product.groupTitle })}
        mode="public"
      />
      <AnimatePresence>
        {purchaseItem && (
          <ProductPurchaseModal
            product={purchaseItem.product}
            category={purchaseItem.category}
            onClose={() => setPurchaseItem(null)}
            onConfirm={confirmPurchase}
            requireAccountId={false}
          />
        )}
      </AnimatePresence>
      <PublicPurchaseSidebar language={language} open={sidebarOpen} onClose={closeSidebar} />
    </>
  );
}

function PublicPurchaseSidebar({ language, open, onClose }) {
  const { setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const t = publicText[language];

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  const sidebar = (
    <>
      <div
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition duration-200 dark:bg-[#050816]/78 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ zIndex: PUBLIC_SIDEBAR_BACKDROP_Z_INDEX }}
        onClick={onClose}
      />

      <aside
        dir="rtl"
        className={`fixed bottom-3 right-3 top-3 flex w-[min(82vw,286px)] flex-col rounded-[28px] border border-[#D7EAFE] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FCFF_58%,#F5F3FF_100%)] p-3 text-slate-950 shadow-[0_24px_90px_rgba(14,165,233,0.22)] transition duration-300 dark:border-white/10 dark:bg-[#0A0F1D] dark:text-[#F8F9FA] dark:shadow-[0_0_42px_rgba(139,92,246,0.30)] ${
          open ? "pointer-events-auto translate-x-0 opacity-100" : "pointer-events-none translate-x-[calc(100%_+_1rem)] opacity-0"
        }`}
        style={{ zIndex: PUBLIC_SIDEBAR_PANEL_Z_INDEX }}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="rounded-[22px] border border-[#CDEBFF] bg-[linear-gradient(135deg,#E0F2FE_0%,#FFFFFF_46%,#F5F3FF_100%)] p-2.5 shadow-[0_14px_32px_rgba(14,165,233,0.12)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827,#0D1324,#1A1024)] dark:shadow-none">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-[0_10px_22px_rgba(14,165,233,0.12)] ring-1 ring-[#BAE6FD] dark:bg-[#111827] dark:shadow-none dark:ring-0">
                <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
              </span>
              <div>
                <p className="text-xs font-black text-[#0284C7] dark:text-[#38BDF8]">Winnie Fun</p>
                <h2 className="mt-0.5 text-lg font-black text-slate-950 dark:text-white">{t.menuTitle}</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-2xl border border-[#BAE6FD] bg-white text-[#0369A1] shadow-[0_8px_18px_rgba(14,165,233,0.12)] transition hover:border-[#C4B5FD] hover:bg-[#F5F3FF] hover:text-[#7C3AED] dark:border-white/10 dark:bg-[#111827] dark:text-[#E9D5FF] dark:shadow-none dark:hover:border-[#A855F7]/70 dark:hover:bg-[#1A2335]"
              aria-label={t.closeMenu}
              title={t.closeMenu}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="mt-3 flex-1 space-y-1.5">
          {purchaseLinks.map(({ label, path, icon: Icon, iconClass }) => (
            <SidebarLink key={path} to={path} icon={Icon} iconClass={iconClass} label={label[language]} onClick={onClose} />
          ))}
        </nav>

        <div className="mb-2.5 space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            {authLinks.map(({ label, path, icon: Icon, className }) => (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                className={`flex min-h-10 items-center justify-center gap-1.5 rounded-2xl border px-2.5 text-center text-xs font-black transition hover:-translate-y-0.5 ${className}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 leading-5">{label[language]}</span>
              </Link>
            ))}
          </div>

          <Link
            to="/login"
            onClick={onClose}
            className="group block rounded-2xl bg-[linear-gradient(135deg,#4285F4,#34A853,#FBBC05,#EA4335)] p-[1px] shadow-[0_14px_34px_rgba(66,133,244,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(66,133,244,0.28)]"
          >
            <span className="flex min-h-10 items-center justify-center gap-2 rounded-[15px] bg-white px-3 text-center text-xs font-black text-slate-800 transition group-hover:bg-[#F8FCFF] dark:bg-[#111827] dark:text-white dark:group-hover:bg-[#0D1324]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
                <GoogleMark className="h-4 w-4" />
              </span>
              <span>{t.googleLogin}</span>
            </span>
          </Link>
        </div>

        <div className="mb-2.5 space-y-2 rounded-2xl border border-[#D7EAFE] bg-white/88 p-2.5 shadow-[0_10px_24px_rgba(14,165,233,0.10)] dark:border-white/10 dark:bg-[#0D1324] dark:shadow-none">
          <p className="text-sm font-black text-slate-950 dark:text-white">{t.settingsTitle}</p>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-slate-600 dark:text-[#D9E4EA]">{t.languageLabel}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-[#8A94A7]">{language === "ar" ? "العربية" : "English"}</p>
            </div>
            <div className="inline-flex rounded-2xl border border-sky-100 bg-slate-50 p-1 text-[10px] font-black dark:border-white/10 dark:bg-[#111827]">
              <button type="button" onClick={() => setLanguage("ar")} className={`rounded-xl px-2 py-1.5 ${language === "ar" ? "bg-[#7C3AED] text-white" : "text-slate-500 dark:text-[#8A94A7]"}`}>AR</button>
              <button type="button" onClick={() => setLanguage("en")} className={`rounded-xl px-2 py-1.5 ${language === "en" ? "bg-[#38BDF8] text-[#050816]" : "text-slate-500 dark:text-[#8A94A7]"}`}>EN</button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-slate-600 dark:text-[#D9E4EA]">{t.themeTitle}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-[#8A94A7]">
                {theme === "dark" ? t.darkMode : t.lightMode}
              </p>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} compact />
          </div>
        </div>

        <p className="rounded-2xl border border-[#D7EAFE] bg-white/88 p-2.5 text-[11px] font-semibold leading-5 text-slate-600 shadow-[0_10px_24px_rgba(14,165,233,0.08)] dark:border-white/10 dark:bg-[#0D1324] dark:text-[#8A94A7] dark:shadow-none">
          {t.note}
        </p>
      </aside>
    </>
  );

  if (typeof document === "undefined") {
    return sidebar;
  }

  return createPortal(sidebar, document.body);
}

function SidebarLink({ to, icon: Icon, iconClass, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex h-12 items-center gap-2.5 rounded-2xl border border-[#D7EAFE] bg-white/88 p-2.5 text-start shadow-[0_10px_24px_rgba(14,165,233,0.10)] transition hover:-translate-y-0.5 hover:border-[#C4B5FD] hover:bg-[#F8FCFF] hover:shadow-[0_14px_30px_rgba(124,58,237,0.13)] dark:border-white/10 dark:bg-[#111827] dark:shadow-none dark:hover:border-[#A855F7]/55 dark:hover:bg-[#1A2335]"
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-black text-slate-800 dark:text-white">{label}</span>
      </span>
    </Link>
  );
}
