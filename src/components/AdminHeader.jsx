import { Link, useNavigate } from "react-router-dom";
import { Bell, Menu, Moon, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { BrandName } from "./Brand";
import HeaderSearchOverlay from "./HeaderSearchOverlay";

const profileAvatarKey = "winnie-profile-avatar";
const profileAvatarChangedEvent = "winnie-profile-avatar-change";

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

export default function AdminHeader({ fixed = true, onOpenSidebar, searchProducts = [], unreadNotificationCount = 0 }) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(getStoredProfileAvatar);
  const [searchOpen, setSearchOpen] = useState(false);
  const headerAvatarUrl = profileAvatarUrl || (isImageAvatar(user?.avatar) ? user.avatar : "") || "/hero-winnie-fun.png";
  const isDarkTheme = theme === "dark";
  const switchTheme = () => setTheme(isDarkTheme ? "light" : "dark");

  useEffect(() => {
    const refreshAvatar = () => setProfileAvatarUrl(getStoredProfileAvatar());

    window.addEventListener("storage", refreshAvatar);
    window.addEventListener(profileAvatarChangedEvent, refreshAvatar);

    return () => {
      window.removeEventListener("storage", refreshAvatar);
      window.removeEventListener(profileAvatarChangedEvent, refreshAvatar);
    };
  }, []);

  useEffect(() => {
    const openSearchFromPage = () => setSearchOpen(true);

    window.addEventListener("winnie-open-search", openSearchFromPage);
    return () => window.removeEventListener("winnie-open-search", openSearchFromPage);
  }, []);

  return (
    <>
      <header dir="ltr" className={`admin-header winnie-mobile-topbar site-header-warm overflow-visible border-b border-violet-200/60 bg-[linear-gradient(180deg,rgba(248,250,255,0.96)_0%,rgba(242,240,255,0.93)_52%,rgba(238,246,255,0.95)_100%)] px-4 py-2.5 text-slate-800 shadow-[0_18px_55px_rgba(76,29,149,0.12)] backdrop-blur-2xl dark:border-violet-400/15 dark:bg-[radial-gradient(circle_at_50%_-80%,rgba(23,21,58,0.98)_0%,rgba(7,11,26,0.97)_58%,rgba(3,6,17,0.98)_100%)] dark:text-white dark:shadow-[0_18px_60px_rgba(0,0,0,0.42),0_0_24px_rgba(124,58,237,0.10)] lg:px-8 ${fixed ? "fixed inset-x-0 top-0 z-[70]" : "relative z-40"}`}>
      <span aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/15" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-400/10" />
      <div className="winnie-mobile-topbar-shell relative mx-auto grid max-w-[1120px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
        <Link to="/admin/user/dashboard" className="primary-header-brand winnie-mobile-brand col-start-2 row-start-1 flex min-w-0 items-center justify-self-center gap-0.5 text-left sm:gap-1.5">
          <img src="/logo.png" alt="Winnie Fun" className="h-12 w-12 shrink-0 object-contain sm:h-[60px] sm:w-[60px]" />
          <span className="-ml-0.5 min-w-0 text-center leading-none drop-shadow-[0_0_18px_rgba(139,92,246,0.25)] sm:-ml-1">
            <BrandName size="adminHeader" />
          </span>
        </Link>

        <div className="winnie-mobile-left-actions col-start-1 row-start-1 flex items-center justify-self-start gap-2 sm:gap-3">
          <button
            type="button"
            onClick={switchTheme}
            className="grid h-11 w-11 place-items-center rounded-2xl border border-violet-200/70 bg-white/55 text-[#8B5CF6] shadow-[0_10px_24px_rgba(76,29,149,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-violet-400/70 hover:bg-white/80 dark:border-violet-400/20 dark:bg-[#070B19]/70 dark:text-[#A855F7] dark:shadow-[0_0_18px_rgba(124,58,237,0.10)] dark:hover:border-[#A855F7]/60 dark:hover:bg-[#11172A] sm:h-12 sm:w-12"
            aria-label={isDarkTheme ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الغامق"}
            title={isDarkTheme ? "الوضع الفاتح" : "الوضع الغامق"}
          >
            {isDarkTheme ? (
              <SunMedium className="h-6 w-6 stroke-[1.9] text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.48)]" />
            ) : (
              <Moon className="h-6 w-6 stroke-[1.9] text-violet-700 drop-shadow-[0_0_10px_rgba(124,58,237,0.22)]" />
            )}
          </button>

          <button
            type="button"
            className="group relative isolate grid h-11 w-11 place-items-center overflow-visible rounded-2xl border border-sky-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(224,242,254,0.92)_48%,rgba(237,233,254,0.94))] text-sky-600 shadow-[0_10px_26px_rgba(14,165,233,0.16),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300 hover:text-violet-600 hover:shadow-[0_14px_30px_rgba(124,58,237,0.18),0_0_20px_rgba(34,211,238,0.16)] dark:border-cyan-300/20 dark:bg-[linear-gradient(145deg,rgba(8,15,32,0.96),rgba(12,31,52,0.94)_48%,rgba(40,20,70,0.92))] dark:text-cyan-300 dark:shadow-[0_0_22px_rgba(34,211,238,0.12)] dark:hover:border-fuchsia-400/45 dark:hover:text-fuchsia-300 sm:h-12 sm:w-12"
            aria-label="الإشعارات"
            title="الإشعارات"
            onClick={() => navigate("/admin/user/notifications")}
          >
            <span aria-hidden="true" className="absolute inset-1.5 -z-10 rounded-xl bg-white/45 opacity-70 transition group-hover:bg-white/70 dark:bg-white/[0.04] dark:group-hover:bg-fuchsia-400/[0.08]" />
            <Bell className="h-6 w-6 stroke-[2] drop-shadow-[0_3px_8px_rgba(14,165,233,0.24)] transition duration-300 group-hover:-rotate-6 group-hover:scale-105 dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.38)]" />
            {unreadNotificationCount > 0 && (
              <span dir="ltr" className="absolute -right-1.5 -top-1.5 inline-flex h-[21px] min-w-[21px] items-center justify-center rounded-full border-2 border-white bg-[linear-gradient(135deg,#F43F5E,#D946EF_52%,#7C3AED)] px-1 text-[9px] font-black tabular-nums leading-none tracking-[-0.02em] text-white shadow-[0_5px_14px_rgba(217,70,239,0.48),0_0_0_1px_rgba(244,63,94,0.12)] dark:border-[#080F20] dark:shadow-[0_0_14px_rgba(244,114,182,0.62)]">
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            )}
          </button>
        </div>

        <div className="winnie-mobile-right-actions col-start-3 row-start-1 flex items-center justify-self-end gap-2 sm:gap-3">
          <Link
            to="/admin/user/profile"
            className="relative block h-11 w-11 overflow-hidden rounded-full border-2 border-[#C4B5FD]/72 bg-white shadow-[0_12px_28px_rgba(14,165,233,0.16)] transition hover:-translate-y-0.5 hover:border-[#8B5CF6] dark:border-[#A855F7]/72 dark:bg-[#151827] dark:shadow-[0_0_24px_rgba(168,85,247,0.30)] sm:h-12 sm:w-12"
            title={user?.name || "الملف الشخصي"}
            aria-label="فتح الملف الشخصي"
          >
            <img
              src={headerAvatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#050816] bg-emerald-400 sm:h-4 sm:w-4" />
            <span className="sr-only">{user?.name || "الملف الشخصي"}</span>
          </Link>

          <button
            type="button"
            onClick={onOpenSidebar}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-200/70 bg-white/55 text-[#8B5CF6] shadow-[0_10px_24px_rgba(76,29,149,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-violet-400/70 hover:bg-white/80 dark:border-violet-400/20 dark:bg-[#070B19]/70 dark:text-[#C4C9D4] dark:shadow-[0_0_18px_rgba(124,58,237,0.10)] dark:hover:border-[#A855F7]/60 dark:hover:bg-[#11172A] xl:hidden"
            aria-label="فتح القائمة"
            title="فتح القائمة"
          >
            <Menu className="h-6 w-6 stroke-[1.8]" />
          </button>
        </div>
      </div>
      </header>
      <HeaderSearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={navigate}
        mode="admin-user"
        products={searchProducts}
      />
    </>
  );
}
