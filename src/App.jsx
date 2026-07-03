import { lazy, Suspense, useLayoutEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PageTransition from "./components/PageTransition";
import { PageSkeleton } from "./components/Skeletons";
import AdminLayout from "./layouts/AdminLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import PublicLayout from "./layouts/PublicLayout";
import { importantLinks } from "./data/importantLinks";

const PublicHome = lazy(() => import("./pages/public/PublicHome"));
const About = lazy(() => import("./pages/public/About"));
const PublicCategories = lazy(() => import("./pages/public/PublicCategories"));
const PublicCategoryProducts = lazy(() => import("./pages/public/PublicCategoryProducts"));
const Login = lazy(() => import("./pages/public/Login"));
const Register = lazy(() => import("./pages/public/Register"));
const ForgotPassword = lazy(() => import("./pages/public/ForgotPassword"));
const ImportantArticlePage = lazy(() => import("./pages/public/ImportantArticlePage"));
const PaymentReturnPage = lazy(() => import("./pages/PaymentReturnPage"));

const CustomerDashboard = lazy(() => import("./pages/customer/CustomerDashboard"));
const CustomerBestSelling = lazy(() => import("./pages/customer/CustomerBestSelling"));
const CustomerCategories = lazy(() => import("./pages/customer/CustomerCategories"));
const CustomerCategoryProducts = lazy(() => import("./pages/customer/CustomerCategoryProducts"));
const CustomerOrders = lazy(() => import("./pages/customer/CustomerOrders"));
const CustomerOrderDetails = lazy(() => import("./pages/customer/CustomerOrderDetails"));
const CustomerWallet = lazy(() => import("./pages/customer/CustomerWallet"));
const CustomerWalletTopUp = lazy(() => import("./pages/customer/CustomerWalletTopUp"));
const CustomerWalletTransactions = lazy(() => import("./pages/customer/CustomerWalletTransactions"));
const CustomerNotifications = lazy(() => import("./pages/customer/CustomerNotifications"));
const CustomerProfile = lazy(() => import("./pages/customer/CustomerProfile"));
const CustomerSettings = lazy(() => import("./pages/customer/CustomerSettings"));
const CustomerSubAgent = lazy(() => import("./pages/customer/CustomerSubAgent"));

const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminPaymentsPage = lazy(() => import("./pages/admin/AdminPaymentsPage"));
const ProductsManagementPage = lazy(() => import("./pages/admin/ProductsManagementPage"));
const GroupsManagementPage = lazy(() => import("./pages/admin/GroupsManagementPage"));
const SuppliersManagementPage = lazy(() => import("./pages/admin/SuppliersManagementPage"));
const PaymentMethodsPage = lazy(() => import("./pages/admin/PaymentMethodsPage"));
const AdminSupervisorsPage = lazy(() => import("./pages/admin/AdminSupervisorsPage"));
const AdminBalanceRequestsPage = lazy(() => import("./pages/admin/AdminBalanceRequestsPage"));
const AdminCurrenciesPage = lazy(() => import("./pages/admin/AdminCurrenciesPage"));
const AdminSubAgentsPage = lazy(() => import("./pages/admin/AdminSubAgentsPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminUserWalletPage = lazy(() => import("./pages/admin/AdminUserWalletPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const AdminToolsPage = lazy(() => import("./pages/admin/AdminToolsPage"));

const ErrorPage = lazy(() => import("./pages/ErrorPage"));

const adminToolsUnlockedKey = "winnie-admin-tools-unlocked";

export default function App() {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  return (
    <Suspense fallback={<PageSkeleton />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<PublicLayout />}>
            <Route index element={<Animated><PublicHome /></Animated>} />
            <Route path="about" element={<Animated><About /></Animated>} />
            <Route path="categories" element={<Animated><PublicCategories /></Animated>} />
            <Route path="categories/:categoryId" element={<Animated><PublicCategoryProducts /></Animated>} />
            <Route path="best-selling" element={<Animated><CustomerBestSelling loginOnPurchase /></Animated>} />
            <Route path="login" element={<Animated><Login /></Animated>} />
            <Route path="register" element={<Animated><Register /></Animated>} />
            <Route path="forgot-password" element={<Animated><ForgotPassword /></Animated>} />
            <Route path="payment/success" element={<Animated><PaymentReturnPage variant="success" /></Animated>} />
            <Route path="payment/cancel" element={<Animated><PaymentReturnPage variant="cancel" /></Animated>} />
            <Route path="payment/pending" element={<Animated><PaymentReturnPage variant="pending" /></Animated>} />
            {importantLinks.map((article) => (
              <Route
                key={article.slug}
                path={article.slug}
                element={<Animated><ImportantArticlePage articleSlug={article.slug} /></Animated>}
              />
            ))}
            <Route path="500" element={<Animated><RouteError code={500} /></Animated>} />
          </Route>

          <Route
            path="customer"
            element={
              <ProtectedRoute role="customer">
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="dashboard" element={<Animated><CustomerDashboard /></Animated>} />
            <Route path="best-selling" element={<Animated><CustomerBestSelling /></Animated>} />
            <Route path="categories" element={<Animated><CustomerCategories /></Animated>} />
            <Route path="categories/:categoryId" element={<Animated><CustomerCategoryProducts /></Animated>} />
            <Route path="orders" element={<Animated><CustomerOrders /></Animated>} />
            <Route path="order/:id" element={<Animated><CustomerOrderDetails /></Animated>} />
            <Route path="wallet" element={<Animated><CustomerWallet /></Animated>} />
            <Route path="wallet/top-up/:methodId" element={<Animated><CustomerWalletTopUp /></Animated>} />
            <Route path="wallet/transactions" element={<Animated><CustomerWalletTransactions /></Animated>} />
            <Route path="notifications" element={<Animated><CustomerNotifications /></Animated>} />
            <Route path="profile" element={<Animated><CustomerProfile /></Animated>} />
            <Route path="settings" element={<Animated><CustomerSettings /></Animated>} />
            <Route path="sub-agent" element={<Animated><CustomerSubAgent /></Animated>} />
            <Route path="about" element={<Animated><About /></Animated>} />
            {importantLinks.map((article) => (
              <Route
                key={`customer-${article.slug}`}
                path={article.slug}
                element={<Animated><ImportantArticlePage articleSlug={article.slug} /></Animated>}
              />
            ))}
          </Route>

          <Route
            path="admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/tools/dashboard" replace />} />

            <Route path="user">
              <Route index element={<Navigate to="/admin/user/dashboard" replace />} />
              <Route path="dashboard" element={<Animated><CustomerDashboard basePath="/admin/user" /></Animated>} />
              <Route path="best-selling" element={<Animated><CustomerBestSelling basePath="/admin/user" /></Animated>} />
              <Route path="categories" element={<Animated><CustomerCategories basePath="/admin/user" /></Animated>} />
              <Route path="categories/:categoryId" element={<Animated><CustomerCategoryProducts basePath="/admin/user" /></Animated>} />
              <Route path="orders" element={<Animated><CustomerOrders basePath="/admin/user" /></Animated>} />
              <Route path="order/:id" element={<Animated><CustomerOrderDetails basePath="/admin/user" /></Animated>} />
              <Route path="wallet" element={<Animated><CustomerWallet basePath="/admin/user" /></Animated>} />
              <Route path="wallet/top-up/:methodId" element={<Animated><CustomerWalletTopUp basePath="/admin/user" /></Animated>} />
              <Route path="wallet/transactions" element={<Animated><CustomerWalletTransactions basePath="/admin/user" /></Animated>} />
              <Route path="notifications" element={<Animated><CustomerNotifications /></Animated>} />
              <Route path="profile" element={<Animated><CustomerProfile basePath="/admin/user" /></Animated>} />
              <Route path="settings" element={<Animated><CustomerSettings /></Animated>} />
              <Route path="sub-agent" element={<Animated><CustomerSubAgent basePath="/admin/user" /></Animated>} />
              <Route path="about" element={<Animated><About /></Animated>} />
              {importantLinks.map((article) => (
                <Route
                  key={`admin-user-${article.slug}`}
                  path={article.slug}
                  element={<Animated><ImportantArticlePage articleSlug={article.slug} /></Animated>}
                />
              ))}
            </Route>

            <Route path="tools" element={<AdminToolsGate />}>
              <Route index element={<Navigate to="/admin/tools/dashboard" replace />} />
              <Route path="dashboard" element={<Animated><AdminDashboardPage /></Animated>} />
              <Route path="users" element={<Animated><AdminUsersPage /></Animated>} />
              <Route path="users/:id/wallet" element={<Animated><AdminUserWalletPage /></Animated>} />
              <Route path="orders" element={<Animated><AdminOrdersPage /></Animated>} />
              <Route path="payments" element={<Animated><AdminPaymentsPage /></Animated>} />
              <Route path="products" element={<Animated><ProductsManagementPage /></Animated>} />
              <Route path="groups" element={<Animated><GroupsManagementPage /></Animated>} />
              <Route path="suppliers" element={<Animated><SuppliersManagementPage /></Animated>} />
              <Route path="payment-methods" element={<Animated><PaymentMethodsPage /></Animated>} />
              <Route path="supervisors" element={<Animated><AdminSupervisorsPage /></Animated>} />
              <Route path="balance-requests" element={<Animated><AdminBalanceRequestsPage /></Animated>} />
              <Route path="currencies" element={<Animated><AdminCurrenciesPage /></Animated>} />
              <Route path="settings" element={<Animated><AdminSettingsPage /></Animated>} />
              <Route path="sub-agents" element={<Animated><AdminSubAgentsPage /></Animated>} />
              <Route path="notifications" element={<Animated><AdminToolsPage /></Animated>} />
            </Route>

            <Route path="dashboard" element={<LegacyAdminRedirect from="/admin/dashboard" to="/admin/tools/dashboard" />} />
            <Route path="best-selling" element={<LegacyAdminRedirect from="/admin/best-selling" to="/admin/user/best-selling" />} />
            <Route path="categories" element={<LegacyAdminRedirect from="/admin/categories" to="/admin/user/categories" />} />
            <Route path="categories/:categoryId" element={<LegacyAdminRedirect from="/admin/categories" to="/admin/user/categories" />} />
            <Route path="orders" element={<LegacyAdminRedirect from="/admin/orders" to="/admin/user/orders" />} />
            <Route path="payments" element={<LegacyAdminRedirect from="/admin/payments" to="/admin/tools/payments" />} />
            <Route path="order/:id" element={<LegacyAdminRedirect from="/admin/order" to="/admin/user/order" />} />
            <Route path="wallet" element={<LegacyAdminRedirect from="/admin/wallet" to="/admin/user/wallet" />} />
            <Route path="wallet/top-up/:methodId" element={<LegacyAdminRedirect from="/admin/wallet" to="/admin/user/wallet" />} />
            <Route path="wallet/transactions" element={<LegacyAdminRedirect from="/admin/wallet" to="/admin/user/wallet" />} />
            <Route path="notifications" element={<LegacyAdminRedirect from="/admin/notifications" to="/admin/user/notifications" />} />
            <Route path="sub-agent" element={<LegacyAdminRedirect from="/admin/sub-agent" to="/admin/user/sub-agent" />} />
            <Route path="about" element={<LegacyAdminRedirect from="/admin/about" to="/admin/user/about" />} />
            {importantLinks.map((article) => (
              <Route
                key={`admin-${article.slug}`}
                path={article.slug}
                element={<LegacyAdminRedirect from={`/admin/${article.slug}`} to={`/admin/user/${article.slug}`} />}
              />
            ))}
          </Route>

          <Route path="*" element={<Animated><RouteError code={404} /></Animated>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

function Animated({ children }) {
  return <PageTransition>{children}</PageTransition>;
}

function RouteError({ code }) {
  const navigate = useNavigate();
  return <ErrorPage code={code} onNavigate={() => navigate("/")} />;
}

function AdminToolsGate() {
  let unlocked = false;

  try {
    unlocked = sessionStorage.getItem(adminToolsUnlockedKey) === "true";
  } catch {
    unlocked = false;
  }

  return unlocked ? <Outlet /> : <Navigate to="/admin/user/dashboard" replace />;
}

function LegacyAdminRedirect({ from, to }) {
  const location = useLocation();
  const nextPath = location.pathname.replace(from, to);

  return <Navigate to={`${nextPath}${location.search}${location.hash}`} replace />;
}
