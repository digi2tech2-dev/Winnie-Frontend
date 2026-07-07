import { createPortal } from "react-dom";
import { ClipboardList, Home, LogIn, UserRound, WalletCards, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { isAdminAreaRole } from "../utils/authRoles";

const protectedItems = [
  { id: "home", label: "الرئيسية", icon: Home, path: "/", public: true },
  { id: "wallet", label: "محفظتي", icon: WalletCards, path: "/customer/wallet" },
  { id: "orders", label: "طلباتي", icon: ClipboardList, path: "/customer/orders" },
  { id: "profile", label: "حسابي", icon: UserRound, path: "/customer/profile" },
];

export default function PublicBottomNav() {
  const [loginTarget, setLoginTarget] = useState(null);
  const { user, isAuthenticated } = useAuth();
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

  return (
    <>
      <nav dir="rtl" aria-label={t("nav.mobileNavigation")} className="fixed bottom-3 left-3 right-3 z-[65] grid grid-cols-5 items-end rounded-[28px] border border-white/80 bg-white/75 px-2 pb-2 pt-2.5 shadow-[0_20px_55px_rgba(76,29,149,0.18),0_0_0_1px_rgba(139,92,246,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl transition-colors duration-300 dark:border-violet-400/20 dark:bg-[#070B19]/80 dark:shadow-[0_22px_60px_rgba(0,0,0,0.45),0_0_28px_rgba(139,92,246,0.16),inset_0_1px_0_rgba(255,255,255,0.06)] lg:hidden">
        {firstItems.map((item) => <NavItem key={item.id} item={item} label={t(publicMobileLabelKeys[item.id])} active={item.public && location.pathname === "/"} onClick={() => openItem(item)} />)}
        <button type="button" onClick={() => navigate("/")} className="group relative mx-auto -mt-9 grid h-[68px] w-[68px] place-items-center rounded-full border border-violet-300/80 bg-gradient-to-br from-white via-violet-50 to-blue-50 shadow-[0_15px_34px_rgba(124,58,237,0.27),0_0_22px_rgba(59,130,246,0.12)] transition duration-300 hover:-translate-y-1 hover:scale-105 dark:border-violet-400/55 dark:from-[#17142F] dark:via-[#11152B] dark:to-[#0B1730] dark:shadow-[0_0_30px_rgba(168,85,247,0.32)]" aria-label={t("nav.home")}>
          <span className="absolute inset-1 rounded-full border border-white/70 dark:border-white/10" />
          <span className="absolute -inset-1 -z-10 rounded-full bg-gradient-to-r from-violet-500/30 to-blue-500/30 blur-md opacity-70 transition group-hover:opacity-100" />
          <img src="/logo.png" alt="" className="relative h-10 w-10 object-contain transition duration-300 group-hover:scale-105" />
        </button>
        {lastItems.map((item) => <NavItem key={item.id} item={item} label={t(publicMobileLabelKeys[item.id])} active={false} onClick={() => openItem(item)} />)}
      </nav>
      <LoginRequiredModal item={loginTarget} onClose={() => setLoginTarget(null)} onLogin={() => navigate("/login", { state: { from: loginTarget?.path || "/customer/dashboard" } })} />
    </>
  );
}

function NavItem({ item, label, active, onClick }) {
  const Icon = item.icon;
  return <button type="button" onClick={onClick} aria-current={active ? "page" : undefined} className={`group relative flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-black transition duration-300 ${active ? "bg-gradient-to-b from-violet-100/90 to-blue-50/50 text-violet-700 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.12)] dark:from-violet-500/18 dark:to-blue-500/5 dark:text-violet-200" : "text-slate-400 hover:-translate-y-0.5 hover:bg-violet-50/70 hover:text-violet-600 dark:text-slate-500 dark:hover:bg-white/[0.05] dark:hover:text-white"}`}><span className={`absolute top-0 h-0.5 w-5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] transition ${active ? "opacity-100" : "opacity-0"}`} /><Icon className={`h-5 w-5 transition duration-300 group-hover:scale-110 ${active ? "text-violet-600 drop-shadow-[0_0_8px_rgba(139,92,246,0.38)] dark:text-violet-300 dark:drop-shadow-[0_0_10px_rgba(168,85,247,0.7)]" : ""}`} /><span className="max-w-full truncate">{label}</span></button>;
}

const publicMobileLabelKeys = {
  home: "nav.home",
  wallet: "nav.wallet",
  orders: "nav.orders",
  profile: "nav.account",
};

function LoginRequiredModal({ item, onClose, onLogin }) {
  const { t } = useTranslation("common");
  if (!item) return null;
  const itemLabel = t(publicMobileLabelKeys[item.id] || "nav.home");
  return createPortal(<div className="fixed inset-0 z-[170] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-[5px]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section dir="rtl" className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/70 bg-white p-5 text-center shadow-[0_30px_100px_rgba(15,23,42,0.34)] dark:border-white/10 dark:bg-[#111827]"><span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-violet-500 via-fuchsia-500 to-sky-500" /><button type="button" onClick={onClose} className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300" aria-label={t("actions.close")} title={t("actions.close")}><X className="h-4 w-4" /></button><span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-[0_16px_34px_rgba(124,58,237,0.28)]"><LogIn className="h-7 w-7" /></span><h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">{t("loginRequired.title")}</h2><p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">{t("loginRequired.message", { item: itemLabel })}</p><button type="button" onClick={onLogin} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-violet-600 to-blue-500 text-sm font-black text-white shadow-[0_14px_32px_rgba(124,58,237,0.24)]"><LogIn className="h-5 w-5" />{t("loginRequired.goLogin")}</button><button type="button" onClick={onClose} className="mt-2 h-10 w-full rounded-xl text-xs font-black text-slate-500 dark:text-slate-400">{t("loginRequired.backBrowse")}</button></section></div>, document.body);
}
