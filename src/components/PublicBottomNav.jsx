import { createPortal } from "react-dom";
import { ClipboardList, Home, LogIn, UserRound, WalletCards, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const protectedItems = [
  { id: "home", label: "الرئيسية", icon: Home, path: "/", public: true },
  { id: "wallet", label: "محفظتي", icon: WalletCards, path: "/customer/wallet" },
  { id: "orders", label: "طلباتي", icon: ClipboardList, path: "/customer/orders" },
  { id: "profile", label: "حسابي", icon: UserRound, path: "/customer/profile" },
];

export default function PublicBottomNav() {
  const [loginTarget, setLoginTarget] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
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
    const base = user?.role === "admin" ? "/admin/user" : "/customer";
    navigate(`${base}/${item.id === "profile" ? "profile" : item.id}`);
  };

  return (
    <>
      <nav dir="rtl" className="fixed bottom-3 left-3 right-3 z-[65] grid grid-cols-5 items-end rounded-[26px] border border-sky-100 bg-white/[0.94] px-2 pb-2 pt-2.5 shadow-[0_16px_42px_rgba(14,165,233,0.16),0_0_20px_rgba(139,92,246,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#080E1D]/95 dark:shadow-[0_18px_48px_rgba(2,6,23,0.38),0_0_24px_rgba(139,92,246,0.16)] lg:hidden">
        {firstItems.map((item) => <NavItem key={item.id} item={item} label={publicMobileLabels[item.id][language]} active={item.public && location.pathname === "/"} onClick={() => openItem(item)} />)}
        <button type="button" onClick={() => navigate("/")} className="relative mx-auto -mt-8 grid h-16 w-16 place-items-center rounded-full border border-violet-200 bg-white shadow-[0_14px_32px_rgba(168,85,247,0.22)] dark:border-violet-400/55 dark:bg-[#111827] dark:shadow-[0_0_28px_rgba(168,85,247,0.30)]" aria-label="الرئيسية">
          <span className="absolute inset-1 rounded-full border border-white/10" />
          <img src="/logo.png" alt="" className="relative h-10 w-10 object-contain" />
        </button>
        {lastItems.map((item) => <NavItem key={item.id} item={item} label={publicMobileLabels[item.id][language]} active={false} onClick={() => openItem(item)} />)}
      </nav>
      <LoginRequiredModal item={loginTarget} onClose={() => setLoginTarget(null)} onLogin={() => navigate("/login", { state: { from: loginTarget?.path || "/customer/dashboard" } })} />
    </>
  );
}

function NavItem({ item, label, active, onClick }) {
  const Icon = item.icon;
  return <button type="button" onClick={onClick} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-1 text-[10px] font-black transition ${active ? "text-[#7C3AED] dark:text-[#C084FC]" : "text-slate-400 hover:text-violet-600 dark:text-slate-500 dark:hover:text-white"}`}><Icon className={`h-5 w-5 ${active ? "text-[#8B5CF6] drop-shadow-[0_0_8px_rgba(139,92,246,0.38)] dark:text-[#A855F7] dark:drop-shadow-[0_0_10px_rgba(168,85,247,0.9)]" : ""}`} /><span className="truncate">{label}</span></button>;
}

const publicMobileLabels = {
  home: { ar: "الرئيسية", en: "Home" },
  wallet: { ar: "محفظتي", en: "Wallet" },
  orders: { ar: "طلباتي", en: "Orders" },
  profile: { ar: "حسابي", en: "Account" },
};

function LoginRequiredModal({ item, onClose, onLogin }) {
  if (!item) return null;
  return createPortal(<div className="fixed inset-0 z-[170] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-[5px]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section dir="rtl" className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/70 bg-white p-5 text-center shadow-[0_30px_100px_rgba(15,23,42,0.34)] dark:border-white/10 dark:bg-[#111827]"><span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-violet-500 via-fuchsia-500 to-sky-500" /><button type="button" onClick={onClose} className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300"><X className="h-4 w-4" /></button><span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-[0_16px_34px_rgba(124,58,237,0.28)]"><LogIn className="h-7 w-7" /></span><h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">تسجيل الدخول مطلوب</h2><p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">لازم تسجل دخول أولًا علشان تقدر تفتح <strong className="text-violet-700 dark:text-violet-300">{item.label}</strong> وتستخدم بيانات حسابك بأمان.</p><button type="button" onClick={onLogin} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-violet-600 to-blue-500 text-sm font-black text-white shadow-[0_14px_32px_rgba(124,58,237,0.24)]"><LogIn className="h-5 w-5" />الذهاب إلى تسجيل الدخول</button><button type="button" onClick={onClose} className="mt-2 h-10 w-full rounded-xl text-xs font-black text-slate-500 dark:text-slate-400">العودة للتصفح</button></section></div>, document.body);
}
