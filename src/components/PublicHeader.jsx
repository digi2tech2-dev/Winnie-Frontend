import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Building2, CircleUserRound, Home, Languages, LayoutGrid, LogIn, Menu, Moon, SunMedium, UserPlus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getPublicCatalog } from "../api/catalog";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import GoogleMark from "./GoogleMark";
import HeaderSearchOverlay from "./HeaderSearchOverlay";
import ProductPurchaseModal from "./ProductPurchaseModal";
import ThemeToggle from "./ThemeToggle";
import { BrandName } from "./Brand";

const purchaseLinks = [
  {
    labelKey: "nav.home",
    path: "/",
    icon: Home,
    iconClass:
      "bg-[#E0F2FE] text-[#0369A1] ring-1 ring-[#7DD3FC]/60 shadow-[0_10px_22px_rgba(14,165,233,0.16)] dark:bg-[linear-gradient(135deg,#7C3AED,#38BDF8)] dark:text-white dark:ring-0 dark:shadow-[0_0_18px_rgba(139,92,246,0.25)]",
  },
  {
    labelKey: "nav.categories",
    path: "/categories",
    icon: LayoutGrid,
    iconClass:
      "bg-[#ECFEFF] text-[#0E7490] ring-1 ring-[#67E8F9]/60 shadow-[0_10px_22px_rgba(6,182,212,0.14)] dark:bg-[linear-gradient(135deg,#06B6D4,#7C3AED)] dark:text-white dark:ring-0 dark:shadow-[0_0_18px_rgba(139,92,246,0.25)]",
  },
  {
    labelKey: "nav.about",
    path: "/about",
    icon: Building2,
    iconClass:
      "bg-[#ECFEFF] text-[#0E7490] ring-1 ring-[#67E8F9]/60 shadow-[0_10px_22px_rgba(6,182,212,0.14)] dark:bg-[linear-gradient(135deg,#7C3AED,#38BDF8)] dark:text-white dark:ring-0 dark:shadow-[0_0_18px_rgba(139,92,246,0.25)]",
  },
];

const authLinks = [
  {
    labelKey: "actions.login",
    path: "/login",
    icon: LogIn,
    className:
      "border-[#BAE6FD] bg-[#E0F2FE] text-[#075985] shadow-[0_14px_30px_rgba(14,165,233,0.16)] hover:border-[#7DD3FC] hover:bg-[#BAE6FD] dark:border-transparent dark:bg-[linear-gradient(135deg,#8B5CF6,#38BDF8)] dark:text-white dark:shadow-[0_0_24px_rgba(139,92,246,0.24)]",
  },
  {
    labelKey: "actions.register",
    path: "/register",
    icon: UserPlus,
    className:
      "border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9] shadow-[0_14px_30px_rgba(124,58,237,0.14)] hover:border-[#C4B5FD] hover:bg-[#EDE9FE] dark:border-transparent dark:bg-[linear-gradient(135deg,#7C3AED,#A855F7)] dark:text-white dark:shadow-[0_0_24px_rgba(139,92,246,0.24)]",
  },
];

const PUBLIC_SIDEBAR_PANEL_Z_INDEX = 2147483647;
const PUBLIC_SIDEBAR_BACKDROP_Z_INDEX = PUBLIC_SIDEBAR_PANEL_Z_INDEX - 1;

export default function PublicHeader() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchProducts, setSearchProducts] = useState([]);
  const [purchaseItem, setPurchaseItem] = useState(null);
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation("common");
  const location = useLocation();
  const navigate = useNavigate();
  const closeSidebar = () => setSidebarOpen(false);
  const nextLanguage = language === "ar" ? "en" : "ar";
  const isLoginPage = location.pathname === "/login";
  const isAuthPage = isLoginPage || location.pathname === "/register";
  const isDarkTheme = theme === "dark";
  const switchTheme = () => setTheme(isDarkTheme ? "light" : "dark");

  useEffect(() => {
    let cancelled = false;

    const loadSearchProducts = async () => {
      try {
        const result = await getPublicCatalog({ page: 1, limit: 24 });
        if (!cancelled) setSearchProducts(result.products);
      } catch {
        if (!cancelled) setSearchProducts([]);
      }
    };

    void loadSearchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const openSearchFromPage = () => setSearchOpen(true);

    window.addEventListener("winnie-open-search", openSearchFromPage);
    return () => window.removeEventListener("winnie-open-search", openSearchFromPage);
  }, []);

  const confirmPurchase = () => {
    setPurchaseItem(null);
    navigate("/login", { state: { from: "/customer/dashboard" } });
  };

  return (
    <>
      <header dir="ltr" className="winnie-mobile-topbar site-header-warm fixed inset-x-0 top-0 z-[70] overflow-hidden border-b border-violet-200/60 bg-[linear-gradient(180deg,rgba(248,250,255,0.96)_0%,rgba(242,240,255,0.93)_52%,rgba(238,246,255,0.95)_100%)] px-4 py-4 text-slate-800 shadow-[0_18px_55px_rgba(76,29,149,0.12)] backdrop-blur-2xl dark:border-violet-400/15 dark:bg-[radial-gradient(circle_at_50%_-80%,rgba(23,21,58,0.98)_0%,rgba(7,11,26,0.97)_58%,rgba(3,6,17,0.98)_100%)] dark:text-white dark:shadow-[0_18px_60px_rgba(0,0,0,0.42),0_0_24px_rgba(124,58,237,0.10)] lg:px-8">
        <span aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/15" />
        <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-400/10" />
        <div className="winnie-mobile-topbar-shell relative mx-auto flex max-w-[1120px] items-center gap-2 sm:gap-3">
          <Link to="/" className="primary-header-brand winnie-mobile-brand flex min-w-0 items-center gap-0.5 sm:gap-1">
            <span className="grid h-12 w-12 shrink-0 place-items-center sm:h-[60px] sm:w-[60px]">
              <img src="/logo.png" alt={t("app.logoAlt")} className="h-12 w-12 object-contain sm:h-[60px] sm:w-[60px]" />
            </span>
            <span className="-ml-0.5 min-w-0 text-center leading-none drop-shadow-[0_0_16px_rgba(139,92,246,0.25)]">
              <BrandName size="adminHeader" />
            </span>
          </Link>

          <div className="winnie-mobile-left-actions ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={switchTheme}
              aria-label={isDarkTheme ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الغامق"}
              title={isDarkTheme ? "الوضع الفاتح" : "الوضع الغامق"}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-200/70 bg-white/55 text-[#8B5CF6] shadow-[0_10px_24px_rgba(76,29,149,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-violet-400/70 hover:bg-white/80 hover:text-[#6D28D9] dark:border-violet-400/20 dark:bg-[#070B19]/70 dark:text-[#C084FC] dark:shadow-[0_0_18px_rgba(124,58,237,0.10)] dark:hover:border-[#A855F7]/60 dark:hover:bg-[#11172A]"
            >
              {isDarkTheme ? (
                <SunMedium className="h-6 w-6 stroke-[1.9] text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.48)]" />
              ) : (
                <Moon className="h-6 w-6 stroke-[1.9] text-violet-700 drop-shadow-[0_0_10px_rgba(124,58,237,0.22)]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setLanguage(nextLanguage)}
              aria-label={t("language.change")}
              title={t("language.change")}
              className="hidden h-11 shrink-0 items-center gap-1 rounded-2xl border border-violet-200/70 bg-white/55 p-1 text-[11px] font-black text-slate-600 shadow-[0_10px_24px_rgba(76,29,149,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition hover:border-violet-400/70 hover:bg-white/80 dark:border-violet-400/20 dark:bg-[#070B19]/70 dark:text-[#C4C9D4] dark:hover:border-[#A855F7]/60 dark:hover:bg-[#11172A] sm:inline-flex"
            >
              <Languages className="hidden h-4 w-4 text-[#8B5CF6] sm:block" />
              <span className={`rounded-xl px-2 py-1.5 transition ${language === "ar" ? "bg-[#7C3AED] text-white shadow-[0_8px_18px_rgba(124,58,237,0.24)]" : "text-slate-500 dark:text-[#8A94A7]"}`}>
                AR
              </span>
              <span className={`rounded-xl px-2 py-1.5 transition ${language === "en" ? "bg-[#38BDF8] text-[#050816] shadow-[0_8px_18px_rgba(56,189,248,0.24)]" : "text-slate-500 dark:text-[#8A94A7]"}`}>
                EN
              </span>
            </button>
          </div>

          <div className="winnie-mobile-right-actions flex items-center gap-2 sm:gap-3">
            {!isAuthPage && (
              <Link
                to="/login"
                aria-label={t("actions.login")}
                title={t("actions.login")}
                className="group relative inline-flex h-12 min-w-12 w-12 items-center justify-center gap-2 rounded-full border border-[#C4B5FD]/80 bg-[linear-gradient(135deg,#FFFFFF_0%,#EEF6FF_50%,#F5F3FF_100%)] px-0 text-[#7C3AED] shadow-[0_12px_28px_rgba(14,165,233,0.18)] transition hover:-translate-y-0.5 hover:border-[#38BDF8]/80 hover:text-[#0369A1] dark:border-[#A855F7]/55 dark:bg-[linear-gradient(135deg,#111827,#1A2335)] dark:text-[#E9D5FF] dark:shadow-[0_0_28px_rgba(168,85,247,0.28)] dark:hover:border-[#38BDF8]/70 dark:hover:text-[#38BDF8]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/70 ring-1 ring-[#DDD6FE]/80 transition group-hover:bg-white group-hover:ring-[#7DD3FC] dark:bg-[#0D1324]/90 dark:ring-white/10 dark:group-hover:ring-[#38BDF8]/55">
                  <CircleUserRound className="h-7 w-7 transition group-hover:scale-105" />
                </span>
                <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-[linear-gradient(135deg,#7C3AED,#38BDF8)] text-white shadow-[0_8px_18px_rgba(15,23,42,0.25)] dark:border-[#0A0F1D]">
                  <LogIn className="h-3 w-3" />
                </span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={t("sidebar.openPurchaseMenu")}
              title={t("sidebar.openPurchaseMenu")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-violet-200/70 bg-white/55 px-3 text-sm font-black text-[#8B5CF6] shadow-[0_10px_24px_rgba(76,29,149,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-violet-400/70 hover:bg-white/80 dark:border-violet-400/20 dark:bg-[#070B19]/70 dark:text-[#A855F7] dark:shadow-[0_0_18px_rgba(124,58,237,0.10)] dark:hover:border-[#A855F7]/60 dark:hover:bg-[#11172A]"
            >
              <Menu className="h-5 w-5" />
              <span className="hidden sm:inline">{t("sidebar.menu")}</span>
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
        products={searchProducts}
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
      <PublicPurchaseSidebar open={sidebarOpen} onClose={closeSidebar} />
    </>
  );
}

function PublicPurchaseSidebar({ open, onClose }) {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation("common");

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
            <div className="min-w-0 flex-1 text-center">
              <div dir="ltr" className="mx-auto flex min-w-0 w-fit items-center justify-center gap-1 text-left">
                <span className="grid h-11 w-11 shrink-0 place-items-center">
                  <img src="/logo.png" alt={t("app.logoAlt")} className="h-10 w-10 object-contain" />
                </span>
                <span className="-ml-0.5 min-w-0 text-center leading-none drop-shadow-[0_0_16px_rgba(139,92,246,0.22)]">
                  <BrandName size="compact" />
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-2xl border border-[#BAE6FD] bg-white text-[#0369A1] shadow-[0_8px_18px_rgba(14,165,233,0.12)] transition hover:border-[#C4B5FD] hover:bg-[#F5F3FF] hover:text-[#7C3AED] dark:border-white/10 dark:bg-[#111827] dark:text-[#E9D5FF] dark:shadow-none dark:hover:border-[#A855F7]/70 dark:hover:bg-[#1A2335]"
              aria-label={t("sidebar.closeMenu")}
              title={t("sidebar.closeMenu")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="mt-3 flex-1 space-y-1.5">
          {purchaseLinks.map(({ labelKey, path, icon: Icon, iconClass }) => (
            <SidebarLink key={path} to={path} icon={Icon} iconClass={iconClass} label={t(labelKey)} onClick={onClose} />
          ))}
        </nav>

        <div className="mb-2.5 space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            {authLinks.map(({ labelKey, path, icon: Icon, className }) => (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                className={`flex min-h-10 items-center justify-center gap-1.5 rounded-2xl border px-2.5 text-center text-xs font-black transition hover:-translate-y-0.5 ${className}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 leading-5">{t(labelKey)}</span>
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
              <span>{t("sidebar.googleLogin")}</span>
            </span>
          </Link>
        </div>

        <div className="mb-2.5 space-y-2 rounded-2xl border border-[#D7EAFE] bg-white/88 p-2.5 shadow-[0_10px_24px_rgba(14,165,233,0.10)] dark:border-white/10 dark:bg-[#0D1324] dark:shadow-none">
          <p className="text-sm font-black text-slate-950 dark:text-white">{t("sidebar.settings")}</p>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-slate-600 dark:text-[#D9E4EA]">{t("language.label")}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-[#8A94A7]">{language === "ar" ? t("language.arabic") : t("language.english")}</p>
            </div>
            <div className="inline-flex rounded-2xl border border-sky-100 bg-slate-50 p-1 text-[10px] font-black dark:border-white/10 dark:bg-[#111827]">
              <button type="button" onClick={() => setLanguage("ar")} className={`rounded-xl px-2 py-1.5 ${language === "ar" ? "bg-[#7C3AED] text-white" : "text-slate-500 dark:text-[#8A94A7]"}`}>AR</button>
              <button type="button" onClick={() => setLanguage("en")} className={`rounded-xl px-2 py-1.5 ${language === "en" ? "bg-[#38BDF8] text-[#050816]" : "text-slate-500 dark:text-[#8A94A7]"}`}>EN</button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-slate-600 dark:text-[#D9E4EA]">{t("theme.title")}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-[#8A94A7]">
                {theme === "dark" ? t("theme.dark") : t("theme.light")}
              </p>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} compact />
          </div>
        </div>

        <p className="rounded-2xl border border-[#D7EAFE] bg-white/88 p-2.5 text-[11px] font-semibold leading-5 text-slate-600 shadow-[0_10px_24px_rgba(14,165,233,0.08)] dark:border-white/10 dark:bg-[#0D1324] dark:text-[#8A94A7] dark:shadow-none">
          {t("sidebar.purchaseNote")}
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
