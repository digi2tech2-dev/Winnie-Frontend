import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronLeft, Menu, Moon, SunMedium } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { BrandName } from "./Brand";
import HeaderSearchOverlay from "./HeaderSearchOverlay";
import { iconMap } from "./icons";
import { getNotificationIconName } from "../utils/notificationNavigation";
import HeaderWalletBadge from "./HeaderWalletBadge";

export default function AdminHeader({
  fixed = true,
  notificationItems = [],
  notificationsLoading = false,
  onNotificationsOpened,
  onOpenNotification,
  onOpenSidebar,
  searchProducts = [],
  unreadNotificationCount = 0,
  walletBalance = 0,
  walletCurrency = "USD",
}) {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const isDarkTheme = theme === "dark";
  const switchTheme = () => setTheme(isDarkTheme ? "light" : "dark");
  const latestNotifications = useMemo(() => (
    [...notificationItems]
      .sort((left, right) => (Date.parse(right.createdAt || right.date || "") || 0) - (Date.parse(left.createdAt || left.date || "") || 0))
      .slice(0, 5)
  ), [notificationItems]);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);
  const toggleNotifications = () => {
    if (notificationsOpen) {
      closeNotifications();
      return;
    }
    setNotificationsOpen(true);
    if (unreadNotificationCount > 0) void onNotificationsOpened?.();
  };
  const openNotification = (notification) => {
    closeNotifications();
    onOpenNotification?.(notification, { markRead: false });
  };

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
      <div className="admin-header-shell winnie-mobile-topbar-shell relative mx-auto flex max-w-[1120px] items-center gap-2 sm:gap-3">
        <Link to="/admin/user/dashboard" className="admin-header-brand admin-header-brand-desktop primary-header-brand winnie-mobile-brand order-3 ml-auto flex min-w-0 shrink-0 items-center gap-0.5 text-left sm:gap-1.5">
          <img src="/logo.png" alt="Winnie HUB" className="h-12 w-12 shrink-0 object-contain sm:h-[60px] sm:w-[60px]" />
          <span className="-ml-0.5 min-w-0 text-center leading-none drop-shadow-[0_0_18px_rgba(139,92,246,0.25)] sm:-ml-1">
            <BrandName size="adminHeader" />
          </span>
        </Link>

        <div className="admin-header-actions winnie-mobile-left-actions order-1 flex shrink-0 items-center gap-2 sm:gap-3">
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
              className="group relative isolate grid h-11 w-11 place-items-center overflow-visible rounded-2xl border border-sky-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(224,242,254,0.92)_48%,rgba(237,233,254,0.94))] text-sky-600 shadow-[0_10px_26px_rgba(14,165,233,0.16),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300 hover:text-violet-600 dark:border-cyan-300/20 dark:bg-[#081529] dark:text-cyan-300 sm:h-12 sm:w-12"
              aria-expanded={notificationsOpen}
              aria-haspopup="dialog"
              aria-label="الإشعارات"
              title="الإشعارات"
              onClick={toggleNotifications}
            >
              <Bell className="h-6 w-6 stroke-[2]" />
              {unreadNotificationCount > 0 && <span dir="ltr" className="absolute -right-1.5 -top-1.5 inline-flex h-[21px] min-w-[21px] items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-rose-500 via-fuchsia-500 to-violet-600 px-1 text-[9px] font-black text-white dark:border-[#080F20]">{unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}</span>}
            </button>

            {notificationsOpen && (
              <div dir="rtl" role="dialog" aria-label="آخر الإشعارات" className="customer-notifications-popover absolute left-0 top-[calc(100%+12px)] z-[90] w-[min(420px,calc(100vw-24px))] overflow-hidden rounded-[28px] border border-violet-200/80 bg-white/95 text-right shadow-[0_28px_80px_rgba(76,29,149,0.28)] backdrop-blur-2xl dark:border-violet-400/20 dark:bg-[linear-gradient(160deg,rgba(15,18,38,0.98),rgba(7,11,25,0.98))]">
                <div className="flex items-center justify-between border-b border-violet-100 bg-gradient-to-l from-violet-50 to-sky-50 px-4 py-4 dark:border-white/10 dark:from-violet-500/15 dark:to-sky-500/10">
                  <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-500 text-white"><Bell className="h-5 w-5" /></span><div><h2 className="font-black text-slate-950 dark:text-white">آخر الإشعارات</h2><p className="mt-0.5 text-[10px] font-bold text-slate-400">آخر التحديثات على لوحة الإدارة</p></div></div>
                </div>
                <div className="max-h-[390px] overflow-y-auto">
                  {notificationsLoading ? <p className="px-4 py-8 text-center text-sm font-bold text-slate-400">جارٍ تحميل الإشعارات...</p> : latestNotifications.length ? latestNotifications.map((notification) => {
                    const Icon = iconMap[getNotificationIconName(notification)] || Bell;
                    return (
                      <button key={notification.id} type="button" onClick={() => openNotification(notification)} className={`group relative flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3.5 text-right transition last:border-b-0 hover:bg-violet-50/80 dark:border-white/10 dark:hover:bg-white/[0.055] ${notification.unread ? "bg-violet-50/70 dark:bg-violet-500/10" : ""}`}>
                        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white ${notification.unread ? "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-sky-500" : "bg-gradient-to-br from-slate-400 to-slate-500"}`}><Icon className="h-5 w-5" /></span>
                        <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-950 dark:text-white">{notification.title}</strong><span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">{notification.message}</span><span className="mt-1 block text-[10px] font-bold text-slate-400">{notification.time}</span></span>
                      </button>
                    );
                  }) : <p className="px-4 py-8 text-center text-sm font-bold text-slate-400">لا توجد إشعارات حاليًا</p>}
                </div>
                <button type="button" onClick={() => { closeNotifications(); navigate("/admin/user/notifications"); }} className="flex w-full items-center justify-center gap-2 border-t border-violet-100 bg-gradient-to-r from-violet-50 to-sky-50 px-4 py-3.5 text-sm font-black text-violet-700 dark:border-white/10 dark:from-violet-500/15 dark:to-sky-500/10 dark:text-violet-200">عرض كل الإشعارات <ChevronLeft className="h-4 w-4" /></button>
              </div>
            )}
          </div>
        </div>

        <div className="admin-header-right-cluster">
          <HeaderWalletBadge
            balance={walletBalance}
            className="order-2"
            currency={walletCurrency}
            to="/admin/user/wallet"
          />

          <Link to="/admin/user/dashboard" className="admin-header-brand admin-header-brand-mobile primary-header-brand winnie-mobile-brand order-3 min-w-0 shrink-0 items-center gap-0.5 text-left">
            <img src="/logo.png" alt="Winnie HUB" className="h-10 w-10 shrink-0 object-contain" />
            <span className="-ml-0.5 min-w-0 text-center leading-none drop-shadow-[0_0_18px_rgba(139,92,246,0.25)]">
              <BrandName size="adminHeader" />
            </span>
          </Link>

          <div className="admin-header-menu winnie-mobile-right-actions order-4 flex shrink-0 items-center gap-2 sm:gap-3">
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
