import { Link, useNavigate } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

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

export default function AdminHeader({ onOpenSidebar, unreadNotificationCount = 0 }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(getStoredProfileAvatar);
  const headerAvatarUrl = profileAvatarUrl || (isImageAvatar(user?.avatar) ? user.avatar : "") || "/hero-winnie-fun.png";

  useEffect(() => {
    const refreshAvatar = () => setProfileAvatarUrl(getStoredProfileAvatar());

    window.addEventListener("storage", refreshAvatar);
    window.addEventListener(profileAvatarChangedEvent, refreshAvatar);

    return () => {
      window.removeEventListener("storage", refreshAvatar);
      window.removeEventListener(profileAvatarChangedEvent, refreshAvatar);
    };
  }, []);

  return (
    <header dir="ltr" className="admin-header site-header-warm fixed inset-x-0 top-0 z-[70] border-b border-sky-100 bg-white/90 px-4 py-3.5 shadow-[0_14px_36px_rgba(14,165,233,0.10)] backdrop-blur-2xl dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(10,15,29,0.95)] dark:shadow-[0_0_18px_rgba(139,92,246,0.18)] lg:px-8">
      <div className="mx-auto flex max-w-[1120px] items-center gap-2 sm:gap-3">
        <Link to="/admin/user/dashboard" className="flex min-w-0 items-center gap-0.5 text-left sm:gap-1.5">
          <img src="/logo.png" alt="Winnie Fun" className="h-11 w-11 shrink-0 object-contain sm:h-16 sm:w-16" />
          <span className="-ml-0.5 min-w-0 text-center leading-none drop-shadow-[0_0_18px_rgba(139,92,246,0.25)] sm:-ml-1">
            <span className="block truncate text-2xl font-black italic tracking-wide text-slate-950 dark:text-white sm:text-4xl">
              innie
            </span>
            <span className="mt-0.5 block text-[9px] font-black uppercase tracking-[0.3em] text-[#A855F7] sm:text-xs sm:tracking-[0.34em]">
              Fun
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/user/best-selling")}
            className="grid h-12 w-12 place-items-center rounded-2xl border border-transparent bg-transparent text-[#8B5CF6] transition hover:bg-[#F5F3FF] dark:text-[#A855F7] dark:hover:bg-[#1A2335] dark:hover:shadow-[0_0_18px_rgba(139,92,246,0.18)] sm:h-[52px] sm:w-[52px]"
            aria-label="فتح البحث"
            title="بحث"
          >
            <Search className="h-7 w-7 stroke-[1.8]" />
          </button>

          <button
            type="button"
            className="relative grid h-12 w-12 place-items-center rounded-2xl border border-transparent bg-transparent text-[#8B5CF6] transition hover:bg-[#F5F3FF] dark:text-[#A855F7] dark:hover:bg-[#1A2335] dark:hover:shadow-[0_0_18px_rgba(139,92,246,0.18)] sm:h-[52px] sm:w-[52px]"
            aria-label="الإشعارات"
            title="الإشعارات"
            onClick={() => navigate("/admin/user/notifications")}
          >
            <Bell className="h-7 w-7 stroke-[1.8]" />
            {unreadNotificationCount > 0 && (
              <span className="absolute right-0 top-0 grid h-6 min-w-6 place-items-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] px-1 text-[11px] font-black leading-none text-white shadow-[0_0_16px_rgba(168,85,247,0.80)]">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          <Link
            to="/admin/user/profile"
            className="relative block h-12 w-12 overflow-hidden rounded-full border-2 border-[#C4B5FD]/72 bg-white shadow-[0_12px_28px_rgba(14,165,233,0.16)] transition hover:-translate-y-0.5 hover:border-[#8B5CF6] dark:border-[#A855F7]/72 dark:bg-[#151827] dark:shadow-[0_0_24px_rgba(168,85,247,0.30)] sm:h-14 sm:w-14"
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
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white/85 text-slate-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/10 dark:bg-[#0D1324] dark:text-slate-300 dark:hover:border-violet-400/45 dark:hover:bg-[#171F33] dark:hover:text-white sm:h-11 sm:w-11 xl:hidden"
            aria-label="فتح القائمة"
            title="فتح القائمة"
          >
            <span className="flex flex-col items-end gap-1" aria-hidden="true">
              <span className="h-0.5 w-4.5 rounded-full bg-current" />
              <span className="h-0.5 w-3.5 rounded-full bg-current" />
              <span className="h-0.5 w-2.5 rounded-full bg-current" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
