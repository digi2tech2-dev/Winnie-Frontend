import { apiRequest } from "./client";
import { normalizeApiError } from "./errors";
import { getAdminDeposits } from "./adminDeposits";
import { getAdminGroupRequests } from "./adminGroupRequests";
import { getAdminOrders } from "./adminOrders";
import { getAdminProducts } from "./adminProducts";
import { getAdminProviderBalance, getAdminProviders } from "./adminProviders";
import { getAdminUsers } from "./adminUsers";
import { toNumber } from "./adapters";

function nullableNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function firstNumber(...values) {
  for (const value of values) {
    const number = nullableNumber(value);
    if (number !== null) return number;
  }
  return null;
}

function paginationTotal(result) {
  return nullableNumber(result?.pagination?.total);
}

async function getAdminDashboardStats(token) {
  const response = await apiRequest("/admin/dashboard/stats", { token });
  const data = response.data || {};

  return {
    message: response.message,
    orders: data.orders || {},
    products: data.products || {},
    users: data.users || {},
  };
}

async function settle(name, label, promise) {
  try {
    return { label, name, ok: true, value: await promise };
  } catch (error) {
    const normalized = normalizeApiError(error, `${label} could not be loaded.`);
    return {
      error: normalized.userMessage || normalized.message,
      label,
      name,
      ok: false,
    };
  }
}

function getSettledValue(results, name) {
  return results.find((result) => result.name === name && result.ok)?.value || null;
}

async function getProvidersWithBalances(token, providers = []) {
  return Promise.all(
    providers.map(async (provider) => {
      try {
        const result = await getAdminProviderBalance(token, provider.id);
        return {
          ...provider,
          balance: result.balance,
          balanceError: "",
          balanceLabel: result.balance?.amountLabel || "غير متاح",
          balanceStatus: "ok",
        };
      } catch (error) {
        const normalized = normalizeApiError(error, "تعذر تحميل رصيد المورد.");
        return {
          ...provider,
          balance: null,
          balanceError: normalized.userMessage || normalized.message,
          balanceLabel: "غير متاح",
          balanceStatus: "error",
        };
      }
    }),
  );
}

export async function getAdminDashboardData(token) {
  const results = await Promise.all([
    settle("stats", "Dashboard statistics", getAdminDashboardStats(token)),
    settle("recentOrders", "Recent orders", getAdminOrders(token, { page: 1, limit: 5 })),
    settle("allOrders", "Order total", getAdminOrders(token, { page: 1, limit: 1 })),
    settle("users", "User total", getAdminUsers(token, { page: 1, limit: 1 })),
    settle("pendingUsers", "Pending users", getAdminUsers(token, { page: 1, limit: 1, status: "PENDING" })),
    settle("products", "Product total", getAdminProducts(token, { page: 1, limit: 1 })),
    settle("pendingDeposits", "Pending deposits", getAdminDeposits(token, { page: 1, limit: 1, status: "PENDING" })),
    settle(
      "pendingGroupRequests",
      "Pending group/sub-agent requests",
      getAdminGroupRequests(token, { page: 1, limit: 1, status: "PENDING" }),
    ),
    settle("providers", "Providers", getAdminProviders(token, { includeInactive: true })),
  ]);

  const stats = getSettledValue(results, "stats");
  const recentOrders = getSettledValue(results, "recentOrders");
  const allOrders = getSettledValue(results, "allOrders");
  const users = getSettledValue(results, "users");
  const pendingUsers = getSettledValue(results, "pendingUsers");
  const products = getSettledValue(results, "products");
  const pendingDeposits = getSettledValue(results, "pendingDeposits");
  const pendingGroupRequests = getSettledValue(results, "pendingGroupRequests");
  const providers = getSettledValue(results, "providers");

  const providerItems = Array.isArray(providers?.providers) ? providers.providers : [];
  const providersWithBalances = providerItems.length ? await getProvidersWithBalances(token, providerItems) : [];

  return {
    failures: results
      .filter((result) => !result.ok)
      .map((result) => ({ label: result.label, message: result.error })),
    metrics: {
      completedOrders: firstNumber(stats?.orders?.completed),
      failedOrders: firstNumber(stats?.orders?.failed),
      pendingOrders: firstNumber(stats?.orders?.pendingProcessing, stats?.orders?.pending),
      pendingDeposits: paginationTotal(pendingDeposits),
      pendingGroupRequests: paginationTotal(pendingGroupRequests),
      pendingUsers: paginationTotal(pendingUsers),
      providersCount: providers ? providerItems.length : null,
      totalOrders: firstNumber(stats?.orders?.total, paginationTotal(allOrders), paginationTotal(recentOrders)),
      totalProducts: firstNumber(stats?.products?.total, paginationTotal(products)),
      totalUsers: firstNumber(stats?.users?.total, paginationTotal(users)),
    },
    recentOrders: Array.isArray(recentOrders?.orders) ? recentOrders.orders : [],
    providers: providersWithBalances,
    refreshedAt: new Date().toISOString(),
    sources: {
      dashboardStats: Boolean(stats),
      providersCount: providers ? providerItems.length : null,
      recentOrdersCount: toNumber(recentOrders?.orders?.length, 0),
    },
  };
}
