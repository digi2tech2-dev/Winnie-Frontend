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
    <nav aria-label={t("nav.mobileNavigation")} className="fixed bottom-2 left-3 right-3 z-50 rounded-[22px] border border-violet-200/60 bg-[linear-gradient(180deg,rgba(248,250,255,0.96)_0%,rgba(242,240,255,0.93)_52%,rgba(238,246,255,0.95)_100%)] px-1.5 py-1.5 text-slate-800 shadow-[0_18px_55px_rgba(76,29,149,0.12)] backdrop-blur-2xl transition-colors duration-300 dark:border-violet-400/15 dark:bg-[radial-gradient(circle_at_50%_-80%,rgba(23,21,58,0.98)_0%,rgba(7,11,26,0.97)_58%,rgba(3,6,17,0.98)_100%)] dark:text-white dark:shadow-[0_18px_60px_rgba(0,0,0,0.42),0_0_24px_rgba(124,58,237,0.10)] xl:hidden">
      <div className="grid grid-cols-5 items-center gap-1">
        {navItems.slice(0, 2).map((item) => (
          <BottomItem key={item.path} item={item} />
        ))}
        <NavLink
          to={`${basePath}/best-selling`}
          className="group relative mx-auto grid h-[46px] w-[46px] place-items-center rounded-2xl border border-violet-200/70 bg-white/55 text-[#8B5CF6] shadow-[0_10px_24px_rgba(76,29,149,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:scale-105 hover:border-violet-400/70 hover:bg-white/80 dark:border-violet-400/20 dark:bg-[#070B19]/70 dark:text-[#A855F7] dark:shadow-[0_0_18px_rgba(124,58,237,0.10)] dark:hover:border-[#A855F7]/60 dark:hover:bg-[#11172A]"
          aria-label={t("nav.bestSelling")}
          title={t("nav.bestSelling")}
        >
          <span className="absolute -inset-1 -z-10 rounded-full bg-gradient-to-r from-violet-500/30 to-blue-500/30 blur-md opacity-70 transition group-hover:opacity-100" />
          <img src="/logo.png" alt="Winnie Fun" className="relative h-8 w-8 object-contain transition duration-300 group-hover:scale-105" />
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
        `group relative flex h-[46px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 text-[9px] font-black transition duration-300 ${
          isActive ? "border border-violet-200/70 bg-white/55 text-[#7C3AED] shadow-[0_10px_24px_rgba(76,29,149,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-violet-400/20 dark:bg-[#070B19]/70 dark:text-[#C084FC] dark:shadow-[0_0_18px_rgba(124,58,237,0.10)]" : "text-slate-600 hover:-translate-y-0.5 hover:bg-white/55 hover:text-[#8B5CF6] dark:text-[#C4C9D4] dark:hover:bg-[#11172A] dark:hover:text-[#A855F7]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`absolute top-0 h-0.5 w-5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] transition ${isActive ? "opacity-100" : "opacity-0"}`} />
          <Icon className={`h-[18px] w-[18px] transition duration-300 group-hover:scale-110 ${isActive ? "text-violet-600 drop-shadow-[0_0_8px_rgba(139,92,246,0.38)] dark:text-violet-300 dark:drop-shadow-[0_0_10px_rgba(168,85,247,0.7)]" : ""}`} />
          <span className="max-w-full truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}
