import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import BackButton from "../components/BackButton";
import CustomerBottomNav from "../components/CustomerBottomNav";
import CustomerHeader from "../components/CustomerHeader";
import DashboardSidebar from "../components/DashboardSidebar";
import FloatingScrollProgress from "../components/FloatingScrollProgress";
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
import { useLanguage } from "../context/LanguageContext";
import { customerNav } from "../data/navigation";

const customerPages = [
  ["/customer/dashboard", "الرئيسية", "واجهة حسابك", "Home"],
  ["/customer/categories", "الأقسام", "كل أقسام الخدمات", "ListChecks"],
  ["/customer/orders", "طلباتي", "الطلبات والتتبع", "ClipboardList"],
  ["/customer/wallet", "المحفظة", "الرصيد والتحويلات", "WalletCards"],
  ["/customer/sub-agent", "وكيل فرعي", "برنامج الوكلاء والإحالات", "UserPlus"],
  ["/customer/notifications", "الإشعارات", "التنبيهات والتحديثات", "Bell"],
  ["/customer/profile", "الملف الشخصي", "بيانات الحساب", "UserRound"],
  ["/customer/settings", "الإعدادات", "التفضيلات", "Settings"],
  ["/customer/about", "من نحن", "تعرف على Winnie Fun", "Building2"],
];

export default function CustomerLayout() {
  const { token } = useAuth();
  const { language } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletSummary, setWalletSummary] = useState(null);
  const [notificationItems, setNotificationItems] = useState([]);
  const [searchProducts, setSearchProducts] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");
  const [notificationAction, setNotificationAction] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const isAboutPage = location.pathname === "/customer/about";
  const isWalletTopUpPage = location.pathname.startsWith("/customer/wallet/top-up/");

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
      setNotificationsError(notificationsResult.reason?.userMessage || "Unable to load notifications.");
    }

    setNotificationsLoading(false);
    return notificationsResult.status === "fulfilled" ? notificationsResult.value : null;
  }, [token]);

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
        setNotificationsError(notificationsResult.reason?.userMessage || "Unable to load notifications.");
      }

      setSearchProducts(catalogResult.status === "fulfilled" ? catalogResult.value.products : []);
      setNotificationsLoading(false);
    };

    void loadLayoutReads();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const runNotificationAction = useCallback(async (actionKey, action) => {
    if (!token) {
      throw new Error("Please sign in before updating notifications.");
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

  const customerNavItems = useMemo(
    () =>
      customerNav.map((item) =>
        ({
          ...item,
          label: getCustomerNavLabel(item.path, language),
          badge: item.path === "/customer/notifications" && unreadNotificationCount ? String(unreadNotificationCount) : undefined,
        }),
      ),
    [language, unreadNotificationCount],
  );

  const searchResults = useMemo(() => {
    const pages = customerPages.map(([target, name, meta, icon]) => ({
      kind: "page",
      name,
      meta,
      icon,
      tone: "from-royal to-pulse",
      target,
    }));

    return pages.slice(0, 9);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-950 dark:bg-[linear-gradient(180deg,#050816_0%,#0A1120_35%,#0D1324_100%)] dark:text-[#C4C9D4]">
      <div className="flex min-h-screen flex-row-reverse">
        <DashboardSidebar
          items={customerNavItems}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          walletBalance={walletSummary?.balanceLabel || "$0.00"}
          variant="customer"
        />
        <div className="min-w-0 flex-1">
          <CustomerHeader
            onOpenSidebar={() => setSidebarOpen(true)}
            searchResults={searchResults}
            searchProducts={searchProducts}
            unreadNotificationCount={unreadNotificationCount}
          />
          <main
            className={
              isAboutPage
                ? "pb-28 pt-[98px] sm:pt-[106px] xl:pb-12"
                : "mx-auto max-w-[1120px] px-4 pb-28 pt-[108px] sm:px-6 sm:pt-[118px] lg:px-8 xl:pb-12"
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
                refreshNotifications,
                unreadNotificationCount,
              }}
            />
          </main>
          <SiteFooter simple={isWalletTopUpPage} className="pb-28 xl:pb-8" />
          <FloatingScrollProgress />
          <CustomerBottomNav />
        </div>
      </div>
    </div>
  );
}

const customerNavLabels = {
  "/customer/dashboard": { ar: "الرئيسية", en: "Home" },
  "/customer/categories": { ar: "الأقسام", en: "Categories" },
  "/customer/orders": { ar: "طلباتي", en: "Orders" },
  "/customer/wallet": { ar: "محفظتي", en: "Wallet" },
  "/customer/sub-agent": { ar: "وكيل فرعي", en: "Sub-agent" },
  "/customer/about": { ar: "من نحن", en: "About" },
  "/customer/notifications": { ar: "الإشعارات", en: "Notifications" },
  "/customer/profile": { ar: "الملف الشخصي", en: "Profile" },
  "/customer/settings": { ar: "الإعدادات", en: "Settings" },
};

function getCustomerNavLabel(path, language) {
  return customerNavLabels[path]?.[language] || customerNavLabels[path]?.ar || path;
}
