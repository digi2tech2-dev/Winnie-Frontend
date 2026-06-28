import { NavLink } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { customerMobileNav } from "../data/navigation";
import { iconMap } from "./icons";

export default function CustomerBottomNav({ basePath = "/customer", translate = true }) {
  const { language } = useLanguage();
  const displayLanguage = translate ? language : "ar";
  const navItems = customerMobileNav.map((item) => ({
    ...item,
    label: mobileLabels[item.path]?.[displayLanguage] || item.label,
    path: item.path.replace("/customer", basePath),
  }));
  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-[26px] border border-sky-100 bg-white/[0.92] px-2 pb-2 pt-2.5 shadow-[0_14px_34px_rgba(14,165,233,0.15)] backdrop-blur-2xl dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(10,15,29,0.95)] dark:shadow-[0_0_16px_rgba(139,92,246,0.18)] xl:hidden">
      <div className="grid grid-cols-5 items-end gap-1">
        {navItems.slice(0, 2).map((item) => (
          <BottomItem key={item.path} item={item} />
        ))}
        <NavLink
          to={`${basePath}/dashboard`}
          className="relative mx-auto -mt-8 grid h-16 w-16 place-items-center rounded-full border border-[#C4B5FD]/70 bg-white shadow-[0_14px_32px_rgba(168,85,247,0.24)] dark:border-[#A855F7]/55 dark:bg-[#111827] dark:shadow-[0_0_16px_rgba(139,92,246,0.18)]"
          aria-label="Winnie Fun dashboard"
          title="Winnie Fun"
        >
          <span className="absolute inset-1 rounded-full border border-white/10" />
          <img src="/logo.png" alt="Winnie Fun" className="relative h-10 w-10 object-contain" />
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

function BottomItem({ item }) {
  const Icon = iconMap[item.icon];

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-1 text-[10px] font-bold transition ${
          isActive ? "text-[#8B5CF6] dark:text-[#A855F7]" : "text-slate-400 dark:text-[#7C8598]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`h-5 w-5 ${isActive ? "text-[#8B5CF6] drop-shadow-[0_0_10px_rgba(139,92,246,0.35)] dark:text-[#A855F7] dark:drop-shadow-[0_0_10px_rgba(168,85,247,0.90)]" : "text-slate-400 dark:text-[#7C8598]"}`} />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}
