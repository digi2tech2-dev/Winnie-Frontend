import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";
import { getWalletSummary } from "../api/wallet";
import AdminHeader from "../components/AdminHeader";
import BackButton from "../components/BackButton";
import DashboardSidebar from "../components/DashboardSidebar";
import SiteFooter from "../components/SiteFooter";
import CustomerBottomNav from "../components/CustomerBottomNav";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { adminNav } from "../data/navigation";
import { useLanguage } from "../context/LanguageContext";
import { getNotificationTarget } from "../utils/notificationNavigation";
import i18n from "../i18n";
import { getCustomerCatalog } from "../api/catalog";

export default function AdminLayout() {
  const { favorites } = useFavorites();
  const { token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletSummary, setWalletSummary] = useState(null);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminToolsPage = location.pathname.startsWith("/admin/tools");
  const isAdminDashboardPage = location.pathname === "/admin/tools/dashboard";
  const isAdminUserHome = location.pathname === "/admin/user/dashboard";
  const [notificationItems, setNotificationItems] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");
  const [notificationAction, setNotificationAction] = useState("");
  const [searchProducts, setSearchProducts] = useState([]);

  useEffect(() => {
    void i18n.changeLanguage("ar");
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";

    return () => {
      void i18n.changeLanguage(language);
      document.documentElement.lang = language;
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    };
  }, [language]);

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

  useEffect(() => {
    void refreshWallet();
  }, [refreshWallet]);

  useEffect(() => {
    if (!token) {
      setSearchProducts([]);
      return undefined;
    }

    let cancelled = false;

    const loadSearchProducts = async () => {
      try {
        const result = await getCustomerCatalog(token, { page: 1, limit: 100 });
        if (!cancelled) setSearchProducts(result.products);
      } catch {
        if (!cancelled) setSearchProducts([]);
      }
    };

    void loadSearchProducts();
    return () => {
      cancelled = true;
    };
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
      setUnreadNotificationCount(unreadResult.status === "fulfilled" ? unreadResult.value : 0);
      setNotificationsError(notificationsResult.reason?.userMessage || "تعذر تحميل الإشعارات.");
    }

    setNotificationsLoading(false);
    return notificationsResult.status === "fulfilled" ? notificationsResult.value : null;
  }, [token]);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  const runNotificationAction = useCallback(async (actionKey, action) => {
    if (!token) {
      throw new Error("يلزم تسجيل الدخول.");
    }

    setNotificationAction(actionKey);
    try {
      const result = await action();
      await refreshNotifications({ showLoading: false });
      return result;
    } finally {
      setNotificationAction("");
    }
  }, [refreshNotifications, token]);

  const handleMarkNotificationRead = useCallback((id) => (
    runNotificationAction(`read:${id}`, () => markNotificationRead(token, id))
  ), [runNotificationAction, token]);

  const handleMarkAllNotificationsRead = useCallback(() => (
    runNotificationAction("read-all", () => markAllNotificationsRead(token))
  ), [runNotificationAction, token]);

  const handleDeleteNotification = useCallback((id) => (
    runNotificationAction(`delete:${id}`, () => deleteNotification(token, id))
  ), [runNotificationAction, token]);

  const handleOpenNotification = useCallback(async (notification, options = {}) => {
    if (options.markRead !== false && notification?.unread && notification?.id) {
      try {
        await handleMarkNotificationRead(notification.id);
      } catch {
        // Navigation should still proceed if read-state update fails.
      }
    }

    navigate(getNotificationTarget(notification, "/admin/user"));
  }, [handleMarkNotificationRead, navigate]);

  const adminNavItems = useMemo(
    () =>
      adminNav.map((item) =>
        ({
          ...item,
          label: getAdminNavLabel(item.path),
          badge: item.path === "/admin/user/notifications" && unreadNotificationCount
            ? String(unreadNotificationCount)
            : item.path === "/admin/user/favorites" && favorites.length
              ? String(favorites.length)
              : undefined,
        }),
      ),
    [favorites.length, unreadNotificationCount],
  );

  return (
    <div dir="rtl" lang="ar" className={`admin-app-shell min-h-screen overflow-x-hidden text-slate-950 dark:text-[#C4C9D4] ${isAdminToolsPage ? "admin-tools-mode" : ""}`}>
      <div dir="ltr" className="flex min-h-screen flex-row-reverse">
        <DashboardSidebar
          items={adminNavItems}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          walletBalance={walletSummary?.balanceLabel || "$0.00"}
          variant="admin"
        />
        <div dir="rtl" className="admin-app-content min-w-0 flex-1">
          <AdminHeader
            fixed={isAdminToolsPage}
            onOpenSidebar={() => setSidebarOpen(true)}
            searchProducts={searchProducts}
            unreadNotificationCount={unreadNotificationCount}
          />
          <main className={`admin-app-main mx-auto ${isAdminDashboardPage ? "admin-dashboard-main max-w-[1500px]" : "max-w-[1120px]"} px-4 sm:px-6 lg:px-8 ${isAdminToolsPage ? "pb-6 pt-[108px] sm:pt-[118px]" : "pb-28 pt-5 sm:pt-6 xl:pb-12"}`}>
            <BackButton fallbackPath="/admin/user/dashboard" hiddenPaths={["/", "/admin/user/dashboard", "/admin/user/profile", "/admin/tools/dashboard"]} />
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
          {isAdminToolsPage ? (
            <SiteFooter legalOnly className="pb-8" />
          ) : (
            <SiteFooter simple={!isAdminUserHome} className="pb-28 xl:pb-8" />
          )}
          {!isAdminToolsPage && <CustomerBottomNav basePath="/admin/user" translate={false} />}
        </div>
      </div>
    </div>
  );
}

const adminNavLabels = {
  "/admin/user/dashboard": "الرئيسية",
  "/admin/user/favorites": "المنتجات المفضلة",
  "/admin/user/best-selling": "الأكثر مبيعًا",
  "/admin/user/categories": "الأقسام",
  "/admin/user/orders": "طلباتي",
  "/admin/user/wallet": "محفظتي",
  "/admin/user/sub-agent": "وكيل فرعي",
  "/admin/user/about": "من نحن",
  "/admin/user/notifications": "الإشعارات",
  "/admin/user/profile": "الملف الشخصي",
  "/admin/user/settings": "الإعدادات",
};

function getAdminNavLabel(path) {
  return adminNavLabels[path] || path;
}
