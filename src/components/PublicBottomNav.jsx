import { createPortal } from "react-dom";
import { Home, LogIn, ShoppingCart, UserRound, WalletCards, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { isAdminAreaRole } from "../utils/authRoles";

const protectedItems = [
  { id: "home", label: "الرئيسية", icon: Home, path: "/", public: true },
  { id: "wallet", label: "محفظتي", icon: WalletCards, path: "/customer/wallet" },
  { id: "orders", label: "طلباتي", icon: ShoppingCart, path: "/customer/orders" },
  { id: "profile", label: "حسابي", icon: UserRound, path: "/customer/profile" },
];

export default function PublicBottomNav() {
  const [loginTarget, setLoginTarget] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const { favorites } = useFavorites();
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const location = useLocation();
  const firstItems = protectedItems.slice(0, 2);
  const lastItems = protectedItems.slice(2);

  const openItem = (item) => {
    if (item.public) {
      navigate(item.path);
      return;
    }
    if (!isAuthenticated) {
      setLoginTarget(item);
      return;
    }
    const base = isAdminAreaRole(user?.role) ? "/admin/user" : "/customer";
    navigate(`${base}/${item.id === "profile" ? "profile" : item.id}`);
  };

  const openFavorites = () => {
    if (!isAuthenticated) {
      setLoginTarget({ id: "favorites", path: "/customer/favorites" });
      return;
    }
    const base = isAdminAreaRole(user?.role) ? "/admin/user" : "/customer";
    navigate(`${base}/favorites`);
  };

  return (
    <>
      <nav dir="rtl" aria-label={t("nav.mobileNavigation")} className="fixed bottom-2 left-3 right-3 z-[65] grid grid-cols-5 items-center rounded-[22px] border border-violet-200/60 bg-[linear-gradient(180deg,rgba(248,250,255,0.96)_0%,rgba(242,240,255,0.93)_52%,rgba(238,246,255,0.95)_100%)] px-1.5 py-1.5 text-slate-800 shadow-[0_18px_55px_rgba(76,29,149,0.12)] backdrop-blur-2xl transition-colors duration-300 dark:border-violet-400/15 dark:bg-[radial-gradient(circle_at_50%_-80%,rgba(23,21,58,0.98)_0%,rgba(7,11,26,0.97)_58%,rgba(3,6,17,0.98)_100%)] dark:text-white dark:shadow-[0_18px_60px_rgba(0,0,0,0.42),0_0_24px_rgba(124,58,237,0.10)] lg:hidden">
        {firstItems.map((item) => <NavItem key={item.id} item={item} label={t(publicMobileLabelKeys[item.id])} active={item.public && location.pathname === "/"} onClick={() => openItem(item)} />)}
        <button type="button" onClick={openFavorites} className="group relative mx-auto grid h-[46px] w-[46px] place-items-center rounded-2xl border border-violet-200/70 bg-white/55 text-[#8B5CF6] shadow-[0_10px_24px_rgba(76,29,149,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:scale-105 hover:border-violet-400/70 hover:bg-white/80 dark:border-violet-400/20 dark:bg-[#070B19]/70 dark:text-[#A855F7] dark:shadow-[0_0_18px_rgba(124,58,237,0.10)] dark:hover:border-[#A855F7]/60 dark:hover:bg-[#11172A]" aria-label={t("nav.favorites")} title={t("nav.favorites")}>
          <span className="absolute -inset-1 -z-10 rounded-full bg-gradient-to-r from-violet-500/30 to-blue-500/30 blur-md opacity-70 transition group-hover:opacity-100" />
          <img src="/logo.png" alt="" className="relative h-8 w-8 object-contain transition duration-300 group-hover:scale-105" />
          {favorites.length ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-black text-white shadow-[0_6px_14px_rgba(244,63,94,0.38)] dark:border-[#070B19]">{favorites.length > 99 ? "99+" : favorites.length}</span> : null}
        </button>
        {lastItems.map((item) => <NavItem key={item.id} item={item} label={t(publicMobileLabelKeys[item.id])} active={false} onClick={() => openItem(item)} />)}
      </nav>
      <LoginRequiredModal item={loginTarget} onClose={() => setLoginTarget(null)} onLogin={() => navigate("/login", { state: { from: loginTarget?.path || "/customer/dashboard" } })} />
    </>
  );
}

function NavItem({ item, label, active, onClick }) {
  const Icon = item.icon;
  return <button type="button" onClick={onClick} aria-current={active ? "page" : undefined} className={`group relative flex h-[46px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 text-[9px] font-black transition duration-300 ${active ? "border border-violet-200/70 bg-white/55 text-[#7C3AED] shadow-[0_10px_24px_rgba(76,29,149,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-violet-400/20 dark:bg-[#070B19]/70 dark:text-[#C084FC] dark:shadow-[0_0_18px_rgba(124,58,237,0.10)]" : "text-slate-600 hover:-translate-y-0.5 hover:bg-white/55 hover:text-[#8B5CF6] dark:text-[#C4C9D4] dark:hover:bg-[#11172A] dark:hover:text-[#A855F7]"}`}><span className={`absolute top-0 h-0.5 w-5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] transition ${active ? "opacity-100" : "opacity-0"}`} /><Icon className={`h-[18px] w-[18px] transition duration-300 group-hover:scale-110 ${active ? "text-violet-600 drop-shadow-[0_0_8px_rgba(139,92,246,0.38)] dark:text-violet-300 dark:drop-shadow-[0_0_10px_rgba(168,85,247,0.7)]" : ""}`} /><span className="max-w-full truncate">{label}</span></button>;
}

const publicMobileLabelKeys = {
  home: "nav.home",
  wallet: "nav.wallet",
  orders: "nav.orders",
  profile: "nav.account",
  favorites: "nav.favorites",
};

function LoginRequiredModal({ item, onClose, onLogin }) {
  const { t } = useTranslation("common");
  if (!item) return null;
  const itemLabel = t(publicMobileLabelKeys[item.id] || "nav.home");
  return createPortal(<div className="fixed inset-0 z-[170] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-[5px]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section dir="rtl" className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/70 bg-white p-5 text-center shadow-[0_30px_100px_rgba(15,23,42,0.34)] dark:border-white/10 dark:bg-[#111827]"><span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-violet-500 via-fuchsia-500 to-sky-500" /><button type="button" onClick={onClose} className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300" aria-label={t("actions.close")} title={t("actions.close")}><X className="h-4 w-4" /></button><span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-[0_16px_34px_rgba(124,58,237,0.28)]"><LogIn className="h-7 w-7" /></span><h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">{t("loginRequired.title")}</h2><p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">{t("loginRequired.message", { item: itemLabel })}</p><button type="button" onClick={onLogin} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-violet-600 to-blue-500 text-sm font-black text-white shadow-[0_14px_32px_rgba(124,58,237,0.24)]"><LogIn className="h-5 w-5" />{t("loginRequired.goLogin")}</button><button type="button" onClick={onClose} className="mt-2 h-10 w-full rounded-xl text-xs font-black text-slate-500 dark:text-slate-400">{t("loginRequired.backBrowse")}</button></section></div>, document.body);
}
