import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import BackButton from "../components/BackButton";
import CustomerBottomNav from "../components/CustomerBottomNav";
import CustomerHeader from "../components/CustomerHeader";
import DashboardSidebar from "../components/DashboardSidebar";
import IdentityVerificationRequiredModal from "../components/IdentityVerificationRequiredModal";
import SiteFooter from "../components/SiteFooter";
import { getCustomerCatalog } from "../api/catalog";
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
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

    const [notificationsResult, unreadResult] = await Promise.allSettled([
      getNotifications(token, { page: 1, limit: 20 }),
      getUnreadNotificationCount(token),
    ]);

    if (notificationsResult.status === "fulfilled") {
      setNotificationItems(notificationsResult.value.notifications);
      setUnreadNotificationCount(
        unreadResult.status === "fulfilled"
          ? unreadResult.value
          : notificationsResult.value.unreadCount,
      );
      setNotificationsError("");
    } else {
      setNotificationItems([]);
      if (unreadResult.status === "fulfilled") {
        setUnreadNotificationCount(unreadResult.value);
      } else {
        setUnreadNotificationCount(0);
      }
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
      const [walletResult, notificationsResult, unreadResult, catalogResult] = await Promise.allSettled([
        getWalletSummary(token),
        getNotifications(token, { page: 1, limit: 20 }),
        getUnreadNotificationCount(token),
        getCustomerCatalog(token, { page: 1, limit: 24 }),
      ]);

      if (cancelled) return;

      if (walletResult.status === "fulfilled") {
        setWalletSummary(walletResult.value);
      }

      if (notificationsResult.status === "fulfilled") {
        setNotificationItems(notificationsResult.value.notifications);
        setUnreadNotificationCount(
          unreadResult.status === "fulfilled"
            ? unreadResult.value
            : notificationsResult.value.unreadCount,
        );
        setNotificationsError("");
      } else {
        setNotificationItems([]);
        setUnreadNotificationCount(unreadResult.status === "fulfilled" ? unreadResult.value : 0);
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

  const handleMarkNotificationsRead = useCallback(async (ids = []) => {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (!token || !uniqueIds.length) return;

    setNotificationAction("read-preview");
    try {
      await Promise.allSettled(uniqueIds.map((id) => markNotificationRead(token, id)));
      await refreshNotifications({ showLoading: false });
    } finally {
      setNotificationAction("");
    }
  }, [refreshNotifications, token]);

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
      customerNav.map((item) =>
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
    [favorites.length, t, unreadNotificationCount],
  );

  const searchResults = useMemo(() => {
    const pages = customerPages.map(([target, nameKey, metaKey, icon]) => ({
      kind: "page",
      name: t(nameKey),
      meta: t(metaKey),
      icon,
      tone: "from-royal to-pulse",
      target,
    }));

    return pages.slice(0, 9);
  }, [t]);

  return (
    <div className="customer-app-shell min-h-screen overflow-x-hidden bg-white text-slate-950 dark:bg-[linear-gradient(180deg,#050816_0%,#0A1120_35%,#0D1324_100%)] dark:text-[#C4C9D4]">
      <div dir="ltr" className="flex min-h-screen flex-row-reverse">
        <DashboardSidebar
          items={customerNavItems}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          walletBalance={walletSummary?.balanceLabel || "$0.00"}
          variant="customer"
        />
        <div dir={language === "ar" ? "rtl" : "ltr"} className="customer-app-content min-w-0 flex-1">
          <CustomerHeader
            notificationItems={notificationItems}
            notificationsLoading={notificationsLoading}
            onMarkVisibleNotificationsRead={handleMarkNotificationsRead}
            onOpenNotification={handleOpenNotification}
            onOpenSidebar={() => setSidebarOpen(true)}
            searchResults={searchResults}
            searchProducts={searchProducts}
            unreadNotificationCount={unreadNotificationCount}
          />
          <main
            className={
              isAboutPage
                ? "pb-28 pt-4 sm:pt-6 xl:pb-12"
                : "customer-app-main mx-auto w-full max-w-[1440px] px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8 xl:pb-12"
            }
          >
            <BackButton
              className={isAboutPage ? "mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8" : ""}
              fallbackPath="/customer/dashboard"
              hiddenPaths={["/", "/customer/dashboard", "/admin/user/dashboard", "/customer/profile"]}
            />
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
          </main>
          <SiteFooter simple={!usesFullFooter} className="pb-28 xl:pb-8" />
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
  "/customer/sub-agent": "nav.subAgent",
  "/customer/about": "nav.about",
  "/customer/notifications": "nav.notifications",
  "/customer/profile": "nav.profile",
  "/customer/settings": "nav.settings",
};
