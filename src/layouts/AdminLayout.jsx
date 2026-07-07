import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import AdminHeader from "../components/AdminHeader";
import BackButton from "../components/BackButton";
import DashboardSidebar from "../components/DashboardSidebar";
import SiteFooter from "../components/SiteFooter";
import CustomerBottomNav from "../components/CustomerBottomNav";
import { adminNav } from "../data/navigation";
import { useLanguage } from "../context/LanguageContext";
import i18n from "../i18n";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminToolsPage = location.pathname.startsWith("/admin/tools");
  const isAdminUserHome = location.pathname === "/admin/user/dashboard";
  const notificationItems = [];
  const unreadNotificationCount = 0;

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

  const adminNavItems = useMemo(
    () =>
      adminNav.map((item) =>
        ({
          ...item,
          label: getAdminNavLabel(item.path),
          badge: item.path === "/admin/user/notifications" && unreadNotificationCount ? String(unreadNotificationCount) : undefined,
        }),
      ),
    [unreadNotificationCount],
  );

  const markAllNotificationsAsRead = () => undefined;

  return (
    <div dir="rtl" lang="ar" className={`admin-app-shell min-h-screen overflow-x-hidden text-slate-950 dark:text-[#C4C9D4] ${isAdminToolsPage ? "admin-tools-mode" : ""}`}>
      <div dir="ltr" className="flex min-h-screen flex-row-reverse">
        <DashboardSidebar
          items={adminNavItems}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          walletBalance="--"
          variant="admin"
        />
        <div dir="rtl" className="admin-app-content min-w-0 flex-1">
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
