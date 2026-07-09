import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronLeft, Menu, Moon, SunMedium } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { resolveBackendAssetUrl } from "../api/adapters";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import HeaderSearchOverlay from "./HeaderSearchOverlay";
import { iconMap } from "./icons";
import { getNotificationIconName } from "../utils/notificationNavigation";
import { BrandName } from "./Brand";

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

export default function CustomerHeader({
  notificationItems = [],
  notificationsLoading = false,
  onMarkVisibleNotificationsRead,
  onOpenNotification,
  onOpenSidebar,
  searchProducts = [],
  unreadNotificationCount = 0,
}) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(getStoredProfileAvatar);
  const notificationsRef = useRef(null);
  const openedUnreadIdsRef = useRef([]);
  const backendAvatarUrl = resolveBackendAssetUrl(user?.avatar);
  const headerAvatarUrl = (isImageAvatar(backendAvatarUrl) ? backendAvatarUrl : "") || profileAvatarUrl || "/hero-winnie-fun.png";
  const latestNotifications = useMemo(() => (
    notificationItems
      .map((notification, index) => ({
        notification,
        index,
        timestamp: Date.parse(notification.createdAt || notification.date || "") || 0,
      }))
      .sort((left, right) => right.timestamp - left.timestamp || left.index - right.index)
      .slice(0, 5)
      .map(({ notification }) => notification)
  ), [notificationItems]);

  const closeNotifications = useCallback(() => {
    setNotificationsOpen(false);
    const unreadIds = openedUnreadIdsRef.current;
    openedUnreadIdsRef.current = [];
    if (unreadIds.length) void onMarkVisibleNotificationsRead?.(unreadIds);
  }, [onMarkVisibleNotificationsRead]);

  const toggleNotifications = () => {
    if (notificationsOpen) {
      closeNotifications();
      return;
    }

    openedUnreadIdsRef.current = latestNotifications
      .filter((notification) => notification.unread)
      .map((notification) => notification.id)
      .filter(Boolean);
    setNotificationsOpen(true);
  };

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

  useEffect(() => {
    if (!notificationsOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!notificationsRef.current?.contains(event.target)) closeNotifications();
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeNotifications();
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeNotifications, notificationsOpen]);

  const openNotification = (notification) => {
    closeNotifications();
    onOpenNotification?.(notification, { markRead: false });
  };

  const openAllNotifications = () => {
    closeNotifications();
    navigate("/customer/notifications");
  };
  const isDarkTheme = theme === "dark";
  const switchTheme = () => setTheme(isDarkTheme ? "light" : "dark");

  return (
    <>
      <header dir="ltr" className="customer-header winnie-mobile-topbar site-header-warm fixed inset-x-0 top-0 z-[70] overflow-visible border-b border-violet-200/60 bg-[linear-gradient(180deg,rgba(248,250,255,0.96)_0%,rgba(242,240,255,0.93)_52%,rgba(238,246,255,0.95)_100%)] px-4 py-2.5 text-slate-800 shadow-[0_18px_55px_rgba(76,29,149,0.12)] backdrop-blur-2xl dark:border-violet-400/15 dark:bg-[radial-gradient(circle_at_50%_-80%,rgba(23,21,58,0.98)_0%,rgba(7,11,26,0.97)_58%,rgba(3,6,17,0.98)_100%)] dark:text-white dark:shadow-[0_18px_60px_rgba(0,0,0,0.42),0_0_24px_rgba(124,58,237,0.10)] lg:px-8">
        <span aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/15" />
        <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-400/10" />
        <div className="winnie-mobile-topbar-shell relative mx-auto flex max-w-[1120px] items-center gap-2 sm:gap-3">
          <Link to="/customer/dashboard" className="primary-header-brand winnie-mobile-brand flex min-w-0 items-center gap-0.5 text-left sm:gap-1.5">
            <img src="/logo.png" alt={t("app.logoAlt")} className="h-12 w-12 shrink-0 object-contain sm:h-[60px] sm:w-[60px]" />
            <span className="-ml-0.5 min-w-0 text-center leading-none drop-shadow-[0_0_18px_rgba(139,92,246,0.25)] sm:-ml-1">
              <BrandName size="adminHeader" />
            </span>
          </Link>

          <div className="winnie-mobile-left-actions ml-auto flex items-center gap-2 sm:gap-3">
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

            <div ref={notificationsRef} className="relative">
              <button
                type="button"
                className="relative grid h-11 w-11 place-items-center rounded-2xl border border-violet-200/70 bg-white/55 text-[#8B5CF6] shadow-[0_10px_24px_rgba(76,29,149,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-violet-400/70 hover:bg-white/80 dark:border-violet-400/20 dark:bg-[#070B19]/70 dark:text-[#A855F7] dark:shadow-[0_0_18px_rgba(124,58,237,0.10)] dark:hover:border-[#A855F7]/60 dark:hover:bg-[#11172A] sm:h-12 sm:w-12"
                aria-expanded={notificationsOpen}
                aria-haspopup="dialog"
                aria-label={t("nav.notifications")}
                title={t("nav.notifications")}
                onClick={toggleNotifications}
              >
                <Bell className="h-6 w-6 stroke-[1.8]" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute right-0 top-0 grid h-6 min-w-6 place-items-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] px-1 text-[11px] font-black leading-none text-white shadow-[0_0_16px_rgba(168,85,247,0.80)]">
                    {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                  </span>
                )}
              </button>

              {notificationsOpen ? (
                <div dir="rtl" role="dialog" aria-label={t("nav.notifications")} className="customer-notifications-popover absolute -right-14 top-[calc(100%+12px)] z-[90] w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-[28px] border border-violet-200/80 bg-white/95 text-right shadow-[0_28px_80px_rgba(76,29,149,0.28),0_0_0_1px_rgba(255,255,255,0.65)] backdrop-blur-2xl dark:border-violet-400/20 dark:bg-[linear-gradient(160deg,rgba(15,18,38,0.98),rgba(7,11,25,0.98))] dark:shadow-[0_30px_90px_rgba(0,0,0,0.58),0_0_35px_rgba(139,92,246,0.14)] sm:right-0">
                  <div className="relative flex items-center justify-between overflow-hidden border-b border-violet-100 bg-[linear-gradient(135deg,rgba(245,243,255,0.96),rgba(240,249,255,0.9))] px-4 py-4 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(124,58,237,0.16),rgba(14,165,233,0.08))]">
                    <span aria-hidden="true" className="absolute -left-8 -top-12 h-24 w-24 rounded-full bg-sky-400/20 blur-2xl" />
                    <div className="relative flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-500 text-white shadow-[0_10px_28px_rgba(124,58,237,0.35)]"><Bell className="h-5 w-5" /></span>
                      <div><h2 className="font-black text-slate-950 dark:text-white">{t("notifications:previewTitle")}</h2><p className="mt-0.5 text-[10px] font-bold text-slate-400">{t("notifications:previewHint")}</p></div>
                    </div>
                    {unreadNotificationCount > 0 ? <span className="relative rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-black text-white shadow-[0_6px_18px_rgba(124,58,237,0.3)]">{unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}</span> : null}
                  </div>

                  <div className="max-h-[390px] overflow-y-auto">
                    {notificationsLoading ? (
                      <p className="px-4 py-8 text-center text-sm font-bold text-slate-400">{t("notifications:loading")}</p>
                    ) : notificationItems.length ? (
                      latestNotifications.map((notification) => {
                        const Icon = iconMap[getNotificationIconName(notification)] || Bell;
                        return (
                          <button key={notification.id} type="button" onClick={() => openNotification(notification)} className={`group relative flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3.5 text-right transition last:border-b-0 hover:bg-violet-50/80 dark:border-white/10 dark:hover:bg-white/[0.055] ${notification.unread ? "bg-[linear-gradient(90deg,rgba(245,243,255,0.95),rgba(240,249,255,0.62))] dark:bg-[linear-gradient(90deg,rgba(124,58,237,0.12),rgba(14,165,233,0.04))]" : ""}`}>
                            {notification.unread ? <span aria-hidden="true" className="absolute bottom-0 right-0 top-0 w-1 bg-gradient-to-b from-violet-600 to-sky-400" /> : null}
                            <span className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white transition group-hover:scale-105 ${notification.unread ? "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-sky-500 shadow-[0_10px_25px_rgba(124,58,237,0.32)]" : "bg-gradient-to-br from-slate-400 to-slate-500 shadow-[0_8px_18px_rgba(71,85,105,0.2)] dark:from-slate-600 dark:to-slate-700"}`}>
                              <span aria-hidden="true" className="absolute inset-1 rounded-xl border border-white/20" />
                              <Icon className="relative h-5 w-5 drop-shadow" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2"><strong className="truncate text-sm text-slate-950 dark:text-white">{notification.title}</strong>{notification.unread ? <span className="shrink-0 rounded-full bg-violet-100 px-1.5 py-0.5 text-[8px] font-black text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">{t("notifications:new")}</span> : null}</span>
                              <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">{notification.message}</span>
                              <span className="mt-1 block text-[10px] font-bold text-slate-400">{notification.time}</span>
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-4 py-8 text-center text-sm font-bold text-slate-400">{t("notifications:emptyTitle")}</p>
                    )}
                  </div>

                  <button type="button" onClick={openAllNotifications} className="flex w-full items-center justify-center gap-2 border-t border-violet-100 bg-gradient-to-r from-violet-50 to-sky-50 px-4 py-3.5 text-sm font-black text-violet-700 transition hover:from-violet-100 hover:to-sky-100 dark:border-white/10 dark:bg-[linear-gradient(90deg,rgba(124,58,237,0.12),rgba(14,165,233,0.08))] dark:text-violet-200 dark:hover:bg-white/[0.08]">
                    {t("notifications:more")}
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="winnie-mobile-right-actions flex items-center gap-2 sm:gap-3">
            <Link
              to="/customer/profile"
              className="relative block h-11 w-11 overflow-hidden rounded-full border-2 border-[#C4B5FD]/72 bg-white shadow-[0_12px_28px_rgba(14,165,233,0.16)] transition hover:-translate-y-0.5 hover:border-[#8B5CF6] dark:border-[#A855F7]/72 dark:bg-[#151827] dark:shadow-[0_0_24px_rgba(168,85,247,0.30)] sm:h-12 sm:w-12"
              aria-label={t("nav.profile")}
              title={user?.name || t("nav.profile")}
            >
              <img
                src={headerAvatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#050816] bg-emerald-400 sm:h-4 sm:w-4" />
              <span className="sr-only">{user?.name || t("nav.profile")}</span>
            </Link>

            <button
              type="button"
              onClick={onOpenSidebar}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-200/70 bg-white/55 text-[#8B5CF6] shadow-[0_10px_24px_rgba(76,29,149,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-violet-400/70 hover:bg-white/80 dark:border-violet-400/20 dark:bg-[#070B19]/70 dark:text-[#C4C9D4] dark:shadow-[0_0_18px_rgba(124,58,237,0.10)] dark:hover:border-[#A855F7]/60 dark:hover:bg-[#11172A] xl:hidden"
              aria-label={t("sidebar.openMenu")}
              title={t("sidebar.openMenu")}
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
        mode="customer"
        products={searchProducts}
      />
    </>
  );
}
