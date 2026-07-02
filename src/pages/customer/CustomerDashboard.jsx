import { useCallback, useEffect, useState } from "react";
import { CircleDollarSign, PackageCheck, ReceiptText, ShoppingBag } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCustomerCatalog } from "../../api/catalog";
import { getCustomerOrders } from "../../api/orders";
import { getWalletSummary, getWalletTransactions } from "../../api/wallet";
import HomeShowcase from "../../components/home/HomeShowcase";
import HomeSlide from "../../components/home/HomeSlide";
import RecentAdditionsSection from "../../components/home/RecentAdditionsSection";
import { useAuth } from "../../context/AuthContext";
import { useCustomerPurchase } from "../../hooks/useCustomerPurchase";

const initialDashboardData = {
  categories: [],
  orders: [],
  products: [],
  transactions: [],
  wallet: null,
};

export default function CustomerDashboard({ basePath = "/customer" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const [dashboardData, setDashboardData] = useState(initialDashboardData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshAfterPurchase = useCallback(async () => {
    if (!token) return;

    const [walletResult, transactionsResult, ordersResult] = await Promise.allSettled([
      getWalletSummary(token),
      getWalletTransactions(token, { page: 1, limit: 5 }),
      getCustomerOrders(token, { page: 1, limit: 5 }),
    ]);

    setDashboardData((current) => ({
      ...current,
      wallet: walletResult.status === "fulfilled" ? walletResult.value : current.wallet,
      transactions: transactionsResult.status === "fulfilled" ? transactionsResult.value.transactions : current.transactions,
      orders: ordersResult.status === "fulfilled" ? ordersResult.value.orders : current.orders,
    }));
  }, [token]);

  const { openPurchase, purchaseModals } = useCustomerPurchase({
    basePath,
    onSuccess: refreshAfterPurchase,
    token,
  });

  useEffect(() => {
    if (!location.hash) return undefined;

    const sectionId = location.hash.replace("#", "");
    const timeout = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [location.hash]);

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    const loadDashboardReads = async () => {
      setLoading(true);
      setError("");

      const [walletResult, transactionsResult, ordersResult, catalogResult] = await Promise.allSettled([
        getWalletSummary(token),
        getWalletTransactions(token, { page: 1, limit: 5 }),
        getCustomerOrders(token, { page: 1, limit: 5 }),
        getCustomerCatalog(token, { page: 1, limit: 12 }),
      ]);

      if (cancelled) return;

      const nextData = {
        wallet: walletResult.status === "fulfilled" ? walletResult.value : null,
        transactions: transactionsResult.status === "fulfilled" ? transactionsResult.value.transactions : [],
        orders: ordersResult.status === "fulfilled" ? ordersResult.value.orders : [],
        categories: catalogResult.status === "fulfilled" ? catalogResult.value.categories : [],
        products: catalogResult.status === "fulfilled" ? catalogResult.value.products : [],
      };

      setDashboardData(nextData);

      const failed = [walletResult, transactionsResult, ordersResult, catalogResult].find((result) => result.status === "rejected");
      setError(failed?.reason?.userMessage || "");
      setLoading(false);
    };

    void loadDashboardReads();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const goGames = () => navigate(`${basePath}/best-selling`);
  const goCategory = (category) => {
    navigate(`${basePath}/categories/${category.slug || category.id}`);
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <DashboardReadSummary
        categoriesCount={dashboardData.categories.length}
        error={error}
        loading={loading}
        ordersCount={dashboardData.orders.length}
        productsCount={dashboardData.products.length}
        transactionsCount={dashboardData.transactions.length}
        userName={user?.name || "Winnie user"}
        wallet={dashboardData.wallet}
      />

      <HomeSlide categoriesPath={`${basePath}/categories`} />
      <HomeShowcase
        categories={dashboardData.categories}
        products={dashboardData.products.slice(0, 8)}
        onViewAll={goGames}
        onCategorySelect={goCategory}
        onProductSelect={(product) => openPurchase(product, product.categoryTitle || "Customer catalog")}
      />
      <RecentAdditionsSection
        items={dashboardData.products}
        onSelect={(product) => openPurchase(product, product.categoryTitle || "Customer catalog")}
      />
      {purchaseModals}
    </div>
  );
}

function DashboardReadSummary({
  categoriesCount,
  error,
  loading,
  ordersCount,
  productsCount,
  transactionsCount,
  userName,
  wallet,
}) {
  return (
    <section className="glass-panel rounded-lg p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-royal dark:text-pulse">Customer dashboard</p>
          <h1 className="mt-2 text-3xl font-black">Welcome back, {userName}</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {loading ? "Loading your backend account data..." : "Your dashboard uses read-only backend wallet, catalog, and order data."}
          </p>
          {error && (
            <p className="mt-3 rounded-2xl border border-amber-400/30 bg-amber-400/12 px-3 py-2 text-xs font-bold leading-5 text-amber-700 dark:text-amber-300">
              Some dashboard data could not be loaded: {error}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.045]">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Current balance</p>
          <p dir="ltr" className="mt-2 text-3xl font-black">{loading ? "..." : wallet?.balanceLabel || "$0.00"}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardMetric icon={CircleDollarSign} label="Recent transactions" value={String(transactionsCount)} />
        <DashboardMetric icon={PackageCheck} label="Recent orders" value={String(ordersCount)} />
        <DashboardMetric icon={ShoppingBag} label="Products loaded" value={String(productsCount)} />
        <DashboardMetric icon={ReceiptText} label="Categories loaded" value={String(categoriesCount)} />
      </div>
    </section>
  );
}

function DashboardMetric({ icon: Icon, label, value }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.045]">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-royal/12 text-royal dark:bg-pulse/15 dark:text-pulse">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </article>
  );
}
