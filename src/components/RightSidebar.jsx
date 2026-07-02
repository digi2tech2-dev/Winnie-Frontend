import { X } from "lucide-react";
import Brand from "./Brand";
import { iconMap } from "./icons";

export default function RightSidebar({
  activePage,
  items = [],
  onNavigate,
  open,
  onClose,
  walletBalance,
}) {
  const primary = items.filter((item) => !item.group);
  const account = items.filter((item) => item.group === "account");
  const LogOutIcon = iconMap.LogOut;

  const handleLogout = () => {
    onNavigate("logout");
    onClose();
  };

  const renderNavItem = (item) => {
    const Icon = iconMap[item.icon];
    const isActive = activePage === item.id;
    const isDanger = item.group === "danger";

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onNavigate(item.id);
          onClose();
        }}
        className={`flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-right text-sm font-bold transition ${
          isActive
            ? "bg-[linear-gradient(135deg,#7C3AED,#A855F7)] text-white shadow-[0_0_20px_rgba(139,92,246,0.20)]"
            : isDanger
              ? "text-rose-200 hover:bg-[#3A1225]"
              : "text-[#7C8598] hover:bg-[#1A2335] hover:text-[#C4C9D4]"
        }`}
      >
        <Icon className="h-5 w-5" />
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span
            className={`grid min-w-5 place-items-center rounded-md px-1.5 py-0.5 text-[11px] font-black ${
              isActive ? "bg-[#1A2335] text-white" : "bg-[#8B5CF6] text-white"
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[80] bg-[#050816] transition xl:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed right-0 top-0 z-[90] flex h-screen w-[min(88vw,332px)] flex-col rounded-l-[30px] border-l border-[rgba(255,255,255,0.08)] bg-[#0A0F1D] p-5 text-[#C4C9D4] shadow-[0_0_20px_rgba(139,92,246,0.20)] transition duration-300 xl:sticky xl:top-0 xl:z-40 xl:w-[300px] xl:translate-x-0 xl:rounded-none xl:shadow-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => onNavigate("home")} className="text-left">
            <Brand />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0D1324] text-[#C4C9D4] transition hover:border-[#A855F7]/55 hover:bg-[#1A2335] xl:hidden"
            aria-label="إغلاق القائمة"
            title="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0D1324] p-3 text-right shadow-[0_0_20px_rgba(139,92,246,0.20)]">
          <div className="relative">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#A855F7] text-2xl font-black text-white shadow-[0_0_20px_rgba(139,92,246,0.32)]">
              W
            </div>
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#0D1324] bg-emerald-400" />
          </div>
          <button type="button" onClick={() => onNavigate("profile")} className="min-w-0 flex-1 text-right">
            <p className="text-xs text-[#8A94A7]">مرحباً بعودتك،</p>
            <p className="truncate font-black">مستخدم Winnie</p>
            <p className="mt-1 inline-flex rounded-lg bg-[#1A2335] px-2 py-0.5 text-xs font-bold text-[#A78BFA]">
              عضو مميز
            </p>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-rose-400/20 bg-[#2A1020] text-rose-200 transition hover:border-rose-300/40 hover:bg-[#3A1225]"
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
          >
            <LogOutIcon className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("wallet")}
          className="mt-4 rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#0D1324] p-4 text-right shadow-[0_0_20px_rgba(139,92,246,0.20)]"
        >
          <p className="text-xs font-semibold text-[#8A94A7]">رصيد المحفظة</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-black">{walletBalance}</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] text-lg font-black text-white shadow-[0_0_20px_rgba(139,92,246,0.32)]">
              +
            </span>
          </div>
        </button>

        <nav className="no-scrollbar mt-5 flex-1 space-y-2 overflow-y-auto pb-4">
          {primary.map(renderNavItem)}
          <div className="my-4 h-px bg-[#8B5CF6]/14" />
          {account.map(renderNavItem)}
        </nav>
      </aside>
    </>
  );
}
