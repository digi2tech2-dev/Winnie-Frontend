import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext";
import { customerMobileNav } from "../data/navigation";
import { iconMap } from "./icons";

export default function CustomerBottomNav({ basePath = "/customer", translate = true }) {
  const { language } = useLanguage();
  const { t } = useTranslation("common");
  const displayLanguage = translate ? language : "ar";
  const navItems = customerMobileNav.map((item) => ({
    ...item,
    label: translate ? t(mobileLabelKeys[item.path] || "nav.home") : mobileLabels[item.path]?.[displayLanguage] || item.label,
    path: item.path.replace("/customer", basePath),
  }));
  return (
    <nav aria-label={t("nav.mobileNavigation")} className="fixed bottom-3 left-3 right-3 z-50 rounded-[28px] border border-white/80 bg-white/75 px-2 pb-2 pt-2.5 shadow-[0_20px_55px_rgba(76,29,149,0.18),0_0_0_1px_rgba(139,92,246,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl transition-colors duration-300 dark:border-violet-400/20 dark:bg-[#070B19]/80 dark:shadow-[0_22px_60px_rgba(0,0,0,0.45),0_0_28px_rgba(139,92,246,0.16),inset_0_1px_0_rgba(255,255,255,0.06)] xl:hidden">
      <div className="grid grid-cols-5 items-end gap-1">
        {navItems.slice(0, 2).map((item) => (
          <BottomItem key={item.path} item={item} />
        ))}
        <NavLink
          to={`${basePath}/dashboard`}
          className="group relative mx-auto -mt-9 grid h-[68px] w-[68px] place-items-center rounded-full border border-violet-300/80 bg-gradient-to-br from-white via-violet-50 to-blue-50 shadow-[0_15px_34px_rgba(124,58,237,0.27),0_0_22px_rgba(59,130,246,0.12)] transition duration-300 hover:-translate-y-1 hover:scale-105 dark:border-violet-400/55 dark:from-[#17142F] dark:via-[#11152B] dark:to-[#0B1730] dark:shadow-[0_0_30px_rgba(168,85,247,0.32)]"
          aria-label="Winnie Fun dashboard"
          title="Winnie Fun"
        >
          <span className="absolute inset-1 rounded-full border border-white/70 dark:border-white/10" />
          <span className="absolute -inset-1 -z-10 rounded-full bg-gradient-to-r from-violet-500/30 to-blue-500/30 blur-md opacity-70 transition group-hover:opacity-100" />
          <img src="/logo.png" alt="Winnie Fun" className="relative h-10 w-10 object-contain transition duration-300 group-hover:scale-105" />
        </NavLink>
        {navItems.slice(2).map((item) => (
          <BottomItem key={item.path} item={item} />
        ))}
      </div>
    </nav>
  );
}

const mobileLabels = {
  "/customer/dashboard": { ar: "الرئيسية", en: "Home" },
  "/customer/wallet": { ar: "محفظتي", en: "Wallet" },
  "/customer/orders": { ar: "طلباتي", en: "Orders" },
  "/customer/profile": { ar: "حسابي", en: "Account" },
};

const mobileLabelKeys = {
  "/customer/dashboard": "nav.home",
  "/customer/wallet": "nav.wallet",
  "/customer/orders": "nav.orders",
  "/customer/profile": "nav.account",
};

function BottomItem({ item }) {
  const Icon = iconMap[item.icon];

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `group relative flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-black transition duration-300 ${
          isActive ? "bg-gradient-to-b from-violet-100/90 to-blue-50/50 text-violet-700 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.12)] dark:from-violet-500/18 dark:to-blue-500/5 dark:text-violet-200" : "text-slate-400 hover:-translate-y-0.5 hover:bg-violet-50/70 hover:text-violet-600 dark:text-slate-500 dark:hover:bg-white/[0.05] dark:hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`absolute top-0 h-0.5 w-5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] transition ${isActive ? "opacity-100" : "opacity-0"}`} />
          <Icon className={`h-5 w-5 transition duration-300 group-hover:scale-110 ${isActive ? "text-violet-600 drop-shadow-[0_0_8px_rgba(139,92,246,0.38)] dark:text-violet-300 dark:drop-shadow-[0_0_10px_rgba(168,85,247,0.7)]" : ""}`} />
          <span className="max-w-full truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}
