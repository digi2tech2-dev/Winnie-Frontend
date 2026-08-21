import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CustomerBottomNav from "../components/CustomerBottomNav";
import CustomerHeader from "../components/CustomerHeader";
import DashboardSidebar from "../components/DashboardSidebar";
import IdentityVerificationRequiredModal from "../components/IdentityVerificationRequiredModal";
import SiteFooter from "../components/SiteFooter";
import { getCustomerCatalog } from "../api/catalog";
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";
import { getWalletSummary } from "../api/wallet";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useLanguage } from "../context/LanguageContext";
import { customerNav } from "../data/navigation";
import { getNotificationTarget } from "../utils/notificationNavigation";

const customerPages = [
  ["/customer/dashboard", "nav.home", "nav.dashboardMeta", "Home"],
  ["/customer/favorites", "nav.favorites", "nav.favoritesMeta", "Heart"],
  ["/customer/categories", "nav.categories", "nav.categoriesMeta", "ListChecks"],
  ["/customer/orders", "nav.orders", "nav.ordersMeta", "ShoppingCart"],
  ["/customer/wallet", "nav.wallet", "nav.walletMeta", "WalletCards"],
  ["/customer/api", "nav.developerApi", "nav.developerApiMeta", "Braces"],
  ["/customer/sub-agent", "nav.subAgent", "nav.subAgentMeta", "UserPlus"],
  ["/customer/notifications", "nav.notifications", "nav.notificationsMeta", "Bell"],
  ["/customer/profile", "nav.profile", "nav.profileMeta", "UserRound"],
  ["/customer/settings", "nav.settings", "nav.settingsMeta", "Settings"],
  ["/customer/about", "nav.about", "nav.aboutMeta", "Building2"],
];

export default function CustomerLayout() {
  const { favorites } = useFavorites();
  const { isLoading: authLoading, refreshCurrentUser, token, user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation("common");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletSummary, setWalletSummary] = useState(null);
  const [notificationItems, setNotificationItems] = useState([]);
  const [searchProducts, setSearchProducts] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");
  const [notificationAction, setNotificationAction] = useState("");
  const [identityPromptDismissed, setIdentityPromptDismissed] = useState(false);
  const [identityPromptForced, setIdentityPromptForced] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAboutPage = location.pathname === "/customer/about";
  const isProfilePage = location.pathname.endsWith("/profile");
  const usesFullFooter = location.pathname === "/customer/dashboard";
  const identityVerificationRequired = user?.identityVerificationRequired === true;
  const showIdentityPrompt = identityVerificationRequired && !authLoading && (!identityPromptDismissed || identityPromptForced);

  const refreshWallet = useCallback(async () => {
    if (!token) {
      setWalletSummary(null);
      return null;
    }

    try {
      const nextWalletSummary = await getWalletSummary(token);
      setWalletSummary(nextWalletSummary);
      return nextWalletSummary;
    } catch {
      return null;
    }
  }, [token]);

  const refreshNotifications = useCallback(async ({ showLoading = true } = {}) => {
    if (!token) {
      setNotificationItems([]);
      setUnreadNotificationCount(0);
      setNotificationsError("");
      setNotificationsLoading(false);
      return null;
    }

    if (showLoading) setNotificationsLoading(true);

    const [notificationsResult] = await Promise.allSettled([
      getNotifications(token, { page: 1, limit: 20 }),
    ]);

    if (notificationsResult.status === "fulfilled") {
      setNotificationItems(notificationsResult.value.notifications);
      setUnreadNotificationCount(notificationsResult.value.unreadCount);
      setNotificationsError("");
    } else {
      setNotificationItems([]);
      setUnreadNotificationCount(0);
      setNotificationsError(notificationsResult.reason?.userMessage || t("notifications:loadErrorTitle", { defaultValue: "Unable to load notifications." }));
    }

    setNotificationsLoading(false);
    return notificationsResult.status === "fulfilled" ? notificationsResult.value : null;
  }, [t, token]);

  useEffect(() => {
    if (!token) {
      setWalletSummary(null);
      setNotificationItems([]);
      setSearchProducts([]);
      setUnreadNotificationCount(0);
      setNotificationsLoading(false);
      setNotificationsError("");
      return undefined;
    }

    let cancelled = false;

    const loadLayoutReads = async () => {
      setNotificationsLoading(true);
      const [walletResult, notificationsResult, catalogResult] = await Promise.allSettled([
        getWalletSummary(token),
        getNotifications(token, { page: 1, limit: 20 }),
        getCustomerCatalog(token, { page: 1, limit: 48 }),
      ]);

      if (cancelled) return;

      if (walletResult.status === "fulfilled") {
        setWalletSummary(walletResult.value);
      }

      if (notificationsResult.status === "fulfilled") {
        setNotificationItems(notificationsResult.value.notifications);
        setUnreadNotificationCount(notificationsResult.value.unreadCount);
        setNotificationsError("");
      } else {
        setNotificationItems([]);
        setUnreadNotificationCount(0);
        setNotificationsError(notificationsResult.reason?.userMessage || t("notifications:loadErrorTitle", { defaultValue: "Unable to load notifications." }));
      }

      setSearchProducts(catalogResult.status === "fulfilled" ? catalogResult.value.products : []);
      setNotificationsLoading(false);
    };

    void loadLayoutReads();

    return () => {
      cancelled = true;
    };
  }, [t, token]);

  useEffect(() => {
    if (identityVerificationRequired) {
      setIdentityPromptDismissed(false);
      return;
    }
    setIdentityPromptDismissed(false);
    setIdentityPromptForced(false);
  }, [identityVerificationRequired, user?.id]);

  useEffect(() => {
    const handleIdentityHold = () => {
      setIdentityPromptDismissed(false);
      setIdentityPromptForced(true);
      void refreshCurrentUser?.();
    };
    window.addEventListener("winnie:identity-verification-required", handleIdentityHold);
    return () => window.removeEventListener("winnie:identity-verification-required", handleIdentityHold);
  }, [refreshCurrentUser]);

  const runNotificationAction = useCallback(async (actionKey, action) => {
    if (!token) {
      throw new Error(t("errors.loginRequired"));
    }

    setNotificationAction(actionKey);
    try {
      const result = await action();
      await refreshNotifications({ showLoading: false });
      return result;
    } finally {
      setNotificationAction("");
    }
  }, [refreshNotifications, t, token]);

  const handleMarkNotificationRead = useCallback((id) => (
    runNotificationAction(`read:${id}`, () => markNotificationRead(token, id))
  ), [runNotificationAction, token]);

  const handleMarkAllNotificationsRead = useCallback(() => (
    runNotificationAction("read-all", () => markAllNotificationsRead(token))
  ), [runNotificationAction, token]);

  const handleHeaderNotificationsOpened = useCallback(async () => {
    if (!token || unreadNotificationCount <= 0) return;
    setUnreadNotificationCount(0);
    setNotificationItems((items) => items.map((item) => ({ ...item, unread: false })));
    try {
      await markAllNotificationsRead(token);
    } catch {
      await refreshNotifications({ showLoading: false });
    }
  }, [refreshNotifications, token, unreadNotificationCount]);

  const handleDeleteNotification = useCallback((id) => (
    runNotificationAction(`delete:${id}`, () => deleteNotification(token, id))
  ), [runNotificationAction, token]);

  const handleOpenNotification = useCallback(async (notification, options = {}) => {
    if (options.markRead !== false && notification?.unread && notification?.id) {
      try {
        await handleMarkNotificationRead(notification.id);
      } catch {
        // Opening the related operation should not be blocked by a read-state failure.
      }
    }

    navigate(getNotificationTarget(notification));
  }, [handleMarkNotificationRead, navigate]);

  const customerNavItems = useMemo(
    () =>
      customerNav
        .filter((item) => item.path !== "/customer/api" || user?.apiAccessEnabled === true)
        .map((item) =>
        ({
          ...item,
          label: getCustomerNavLabel(item.path, t),
          badge: item.path === "/customer/notifications" && unreadNotificationCount
            ? String(unreadNotificationCount)
            : item.path === "/customer/favorites" && favorites.length
              ? String(favorites.length)
              : undefined,
        }),
      ),
    [favorites.length, t, unreadNotificationCount, user?.apiAccessEnabled],
  );

  const searchResults = useMemo(() => {
    const pages = customerPages
      .filter(([target]) => target !== "/customer/api" || user?.apiAccessEnabled === true)
      .map(([target, nameKey, metaKey, icon]) => ({
      kind: "page",
      name: t(nameKey),
      meta: t(metaKey),
      icon,
      tone: "from-royal to-pulse",
      target,
    }));

    return pages.slice(0, 9);
  }, [t, user?.apiAccessEnabled]);

  return (
    <div className="winnie-app-shell customer-app-shell min-h-screen overflow-x-hidden bg-white text-slate-950 dark:bg-[linear-gradient(180deg,#050816_0%,#0A1120_35%,#0D1324_100%)] dark:text-[#C4C9D4]">
      <div dir="ltr" className="flex min-h-screen flex-row-reverse">
        <DashboardSidebar
          items={customerNavItems}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          walletBalance={walletSummary?.balanceLabel || "$0.00"}
          variant="customer"
        />
        <div dir={language === "ar" ? "rtl" : "ltr"} className="winnie-app-content customer-app-content min-w-0 flex-1">
          <CustomerHeader
            notificationItems={notificationItems}
            notificationsLoading={notificationsLoading}
            onNotificationsOpened={handleHeaderNotificationsOpened}
            onOpenNotification={handleOpenNotification}
            onOpenSidebar={() => setSidebarOpen(true)}
            searchResults={searchResults}
            searchProducts={searchProducts}
            unreadNotificationCount={unreadNotificationCount}
            walletBalance={walletSummary?.balance ?? 0}
            walletCurrency={walletSummary?.currency || "USD"}
          />
          <main
            className={
              isAboutPage
                ? "winnie-page-canvas pb-28 pt-4 sm:pt-6 xl:pb-12"
                : `winnie-page-canvas customer-app-main mx-auto w-full max-w-[1440px] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 ${
                    usesFullFooter ? "customer-home-main pb-4 sm:pb-5 xl:pb-6" : "pb-28 xl:pb-12"
                  } ${isProfilePage ? "customer-profile-main" : ""}`
            }
          >
            <div className="winnie-page-stage">
              <Outlet
                context={{
                  navigate,
                  notifications: notificationItems,
                  notificationAction,
                  notificationActionsSupported: true,
                  notificationsError,
                  notificationsLoading,
                  onDeleteNotification: handleDeleteNotification,
                  onMarkAllNotificationsRead: handleMarkAllNotificationsRead,
                  onMarkNotificationRead: handleMarkNotificationRead,
                  onOpenNotification: handleOpenNotification,
                  onWalletRefresh: refreshWallet,
                  refreshNotifications,
                  unreadNotificationCount,
                }}
              />
            </div>
          </main>
          <SiteFooter
            simple={!usesFullFooter}
            className={`${usesFullFooter ? "customer-home-footer" : ""} pb-28 xl:pb-8`}
          />
          <CustomerBottomNav />
        </div>
      </div>
      <IdentityVerificationRequiredModal
        open={showIdentityPrompt}
        reason={user?.identityVerificationReason || ""}
        onClose={() => {
          setIdentityPromptDismissed(true);
          setIdentityPromptForced(false);
        }}
      />
    </div>
  );
}

function getCustomerNavLabel(path, t) {
  const key = customerNavLabelKeys[path];
  if (key) return t(key);
  return path;
}

const customerNavLabelKeys = {
  "/customer/dashboard": "nav.home",
  "/customer/favorites": "nav.favorites",
  "/customer/categories": "nav.categories",
  "/customer/orders": "nav.orders",
  "/customer/wallet": "nav.wallet",
  "/customer/api": "nav.developerApi",
  "/customer/sub-agent": "nav.subAgent",
  "/customer/about": "nav.about",
  "/customer/notifications": "nav.notifications",
  "/customer/profile": "nav.profile",
  "/customer/settings": "nav.settings",
};
