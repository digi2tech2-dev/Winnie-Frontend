import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import AdminHeader from "../components/AdminHeader";
import BackButton from "../components/BackButton";
import DashboardSidebar from "../components/DashboardSidebar";
import SiteFooter from "../components/SiteFooter";
import CustomerBottomNav from "../components/CustomerBottomNav";
import { adminNav } from "../data/navigation";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isWalletTopUpPage = location.pathname.startsWith("/admin/user/wallet/top-up/");
  const isAdminToolsPage = location.pathname.startsWith("/admin/tools");
  const notificationItems = [];
  const unreadNotificationCount = 0;

  const adminNavItems = useMemo(
    () =>
      adminNav.map((item) =>
        ({
          ...item,
          label: getAdminNavLabel(item.path, "ar"),
          badge: item.path === "/admin/user/notifications" && unreadNotificationCount ? String(unreadNotificationCount) : undefined,
        }),
      ),
    [unreadNotificationCount],
  );

  const markAllNotificationsAsRead = () => undefined;

  return (
    <div className={`admin-app-shell min-h-screen overflow-x-hidden text-slate-950 dark:text-[#C4C9D4] ${isAdminToolsPage ? "admin-tools-mode" : ""}`}>
      <div className="flex min-h-screen flex-row-reverse">
        <DashboardSidebar
          items={adminNavItems}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          walletBalance="--"
          variant="admin"
        />
        <div className="min-w-0 flex-1">
          <AdminHeader
            onOpenSidebar={() => setSidebarOpen(true)}
            unreadNotificationCount={unreadNotificationCount}
          />
          <main className={`admin-app-main mx-auto max-w-[1120px] px-4 pt-[108px] sm:px-6 sm:pt-[118px] lg:px-8 ${isAdminToolsPage ? "pb-6" : "pb-28 xl:pb-12"}`}>
            <BackButton fallbackPath="/admin/user/dashboard" hiddenPaths={["/", "/admin/user/dashboard", "/admin/user/profile", "/admin/tools/dashboard"]} />
            <Outlet
              context={{
                markAllNotificationsAsRead,
                navigate,
                notifications: notificationItems,
                unreadNotificationCount,
              }}
            />
          </main>
          <SiteFooter simple={isWalletTopUpPage} className={isAdminToolsPage ? "pb-8" : "pb-28 xl:pb-8"} />
          {!isAdminToolsPage && <CustomerBottomNav basePath="/admin/user" translate={false} />}
        </div>
      </div>
    </div>
  );
}

const adminNavLabels = {
  "/admin/user/dashboard": { ar: "الرئيسية", en: "Home" },
  "/admin/user/best-selling": { ar: "الأكثر مبيعًا", en: "Best selling" },
  "/admin/user/categories": { ar: "الأقسام", en: "Categories" },
  "/admin/user/orders": { ar: "طلباتي", en: "Orders" },
  "/admin/user/wallet": { ar: "محفظتي", en: "Wallet" },
  "/admin/user/sub-agent": { ar: "وكيل فرعي", en: "Sub-agent" },
  "/admin/user/about": { ar: "من نحن", en: "About" },
  "/admin/user/notifications": { ar: "الإشعارات", en: "Notifications" },
  "/admin/user/profile": { ar: "الملف الشخصي", en: "Profile" },
  "/admin/user/settings": { ar: "الإعدادات", en: "Settings" },
};

function getAdminNavLabel(path, language) {
  return adminNavLabels[path]?.[language] || adminNavLabels[path]?.ar || path;
}
