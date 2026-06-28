import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import BackButton from "../components/BackButton";
import CustomerBottomNav from "../components/CustomerBottomNav";
import CustomerHeader from "../components/CustomerHeader";
import DashboardSidebar from "../components/DashboardSidebar";
import FloatingScrollProgress from "../components/FloatingScrollProgress";
import SiteFooter from "../components/SiteFooter";
import { useLanguage } from "../context/LanguageContext";
import { customerNav } from "../data/navigation";
import { notifications, productGroups, walletBalance } from "../data/catalog";

const notificationReadIdsKey = "winnie-notification-read-ids";

function getStoredNotificationReadIds() {
  try {
    return JSON.parse(localStorage.getItem(notificationReadIdsKey) || "[]");
  } catch {
    return [];
  }
}

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
  const { language } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [readNotificationIds, setReadNotificationIds] = useState(getStoredNotificationReadIds);
  const navigate = useNavigate();
  const location = useLocation();
  const isAboutPage = location.pathname === "/customer/about";
  const isWalletTopUpPage = location.pathname.startsWith("/customer/wallet/top-up/");

  const notificationItems = useMemo(() => {
    const readIds = new Set(readNotificationIds);

    return notifications.map((item) => ({
      ...item,
      unread: Boolean(item.unread && !readIds.has(item.id)),
    }));
  }, [readNotificationIds]);

  const unreadNotificationCount = useMemo(
    () => notificationItems.filter((item) => item.unread).length,
    [notificationItems],
  );

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

  const markAllNotificationsAsRead = () => {
    const allUnreadIds = notifications.filter((item) => item.unread).map((item) => item.id);

    setReadNotificationIds((currentIds) => {
      const nextIds = Array.from(new Set([...currentIds, ...allUnreadIds]));
      try {
        localStorage.setItem(notificationReadIdsKey, JSON.stringify(nextIds));
      } catch {
        // Keep the UI updated even if the browser blocks local storage.
      }
      return nextIds;
    });
  };

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const products = Object.entries(productGroups).flatMap(([groupId, group]) =>
      group.products.map((product) => ({
        kind: "product",
        name: product.name,
        meta: `${group.title} - ${product.price}`,
        icon: product.icon,
        tone: product.tone,
        target: "/customer/dashboard#best-selling",
      })),
    );

    const pages = customerPages.map(([target, name, meta, icon]) => ({
      kind: "page",
      name,
      meta,
      icon,
      tone: "from-royal to-pulse",
      target,
    }));

    return [...pages, ...products]
      .filter((item) => `${item.name} ${item.meta}`.toLowerCase().includes(query))
      .slice(0, 9);
  }, [searchQuery]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-950 dark:bg-[linear-gradient(180deg,#050816_0%,#0A1120_35%,#0D1324_100%)] dark:text-[#C4C9D4]">
      <div className="flex min-h-screen flex-row-reverse">
        <DashboardSidebar
          items={customerNavItems}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          walletBalance={walletBalance}
          variant="customer"
        />
        <div className="min-w-0 flex-1">
          <CustomerHeader
            onOpenSidebar={() => setSidebarOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchResults={searchResults}
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
                markAllNotificationsAsRead,
                navigate,
                notifications: notificationItems,
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
