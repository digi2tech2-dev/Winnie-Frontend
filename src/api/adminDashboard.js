import { apiRequest } from "./client";
import { normalizeApiError } from "./errors";
import { getAdminDeposits } from "./adminDeposits";
import { getAdminGroupRequests } from "./adminGroupRequests";
import { getAdminOrders } from "./adminOrders";
import { getAdminProducts } from "./adminProducts";
import { getAdminProviderBalance, getAdminProviders } from "./adminProviders";
import { getAdminUsers } from "./adminUsers";
import { DEFAULT_CURRENCY, formatCurrency, toNumber } from "./adapters";

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

function getStatsWalletTotal(stats) {
  return firstNumber(
    stats?.wallets?.totalBalance,
    stats?.wallets?.balanceTotal,
    stats?.wallets?.total,
    stats?.wallet?.totalBalance,
    stats?.wallet?.balanceTotal,
    stats?.users?.totalWalletBalance,
    stats?.users?.walletBalanceTotal,
    stats?.totalWalletBalance,
    stats?.walletBalanceTotal,
  );
}

function getStatsWalletCurrency(stats) {
  return String(
    stats?.wallets?.currency
      || stats?.wallet?.currency
      || stats?.users?.walletCurrency
      || stats?.currency
      || DEFAULT_CURRENCY,
  ).toUpperCase();
}

function summarizeWalletBalances(users = []) {
  if (!users.length) {
    return {
      amount: null,
      currency: DEFAULT_CURRENCY,
      label: "غير متاح",
    };
  }

  const totalsByCurrency = users.reduce((totals, user) => {
    const currency = String(user.currency || DEFAULT_CURRENCY).toUpperCase();
    totals[currency] = (totals[currency] || 0) + toNumber(user.walletBalance, 0);
    return totals;
  }, {});
  const entries = Object.entries(totalsByCurrency).sort((left, right) => right[1] - left[1]);
  const [currency, amount] = entries[0] || [DEFAULT_CURRENCY, 0];

  return {
    amount,
    currency,
    label: entries.length === 1
      ? formatCurrency(amount, currency, "ar-EG-u-nu-latn")
      : entries.map(([entryCurrency, entryAmount]) => formatCurrency(entryAmount, entryCurrency, "ar-EG-u-nu-latn")).join(" + "),
  };
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

export async function getAdminDashboardSummary(token, range = {}) {
  const response = await apiRequest("/admin/dashboard/summary", {
    query: {
      from: range.from,
      to: range.to,
      _: Date.now(),
    },
    token,
  });

  return response.data || null;
}

const profitPointDateFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  day: "numeric",
  month: "short",
});

function parseDateKey(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12);
}

function toDateKey(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addCalendarDays(value, amount) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function buildProfitBuckets(range = {}) {
  const start = parseDateKey(range.from);
  const end = parseDateKey(range.to);
  if (!start || !end) return [];

  const normalizedStart = start <= end ? start : end;
  const normalizedEnd = start <= end ? end : start;
  const totalDays = Math.max(1, Math.round((normalizedEnd - normalizedStart) / 86400000) + 1);
  const bucketDays = totalDays <= 14 ? 1 : Math.ceil(totalDays / 12);
  const buckets = [];

  for (let offset = 0; offset < totalDays; offset += bucketDays) {
    const bucketStart = addCalendarDays(normalizedStart, offset);
    const bucketEnd = addCalendarDays(normalizedStart, Math.min(totalDays - 1, offset + bucketDays - 1));
    const singleDay = toDateKey(bucketStart) === toDateKey(bucketEnd);

    buckets.push({
      from: toDateKey(bucketStart),
      id: `${toDateKey(bucketStart)}-${toDateKey(bucketEnd)}`,
      label: singleDay
        ? profitPointDateFormatter.format(bucketStart)
        : `${profitPointDateFormatter.format(bucketStart)} – ${profitPointDateFormatter.format(bucketEnd)}`,
      shortLabel: profitPointDateFormatter.format(bucketStart),
      to: toDateKey(bucketEnd),
    });
  }

  return buckets;
}

async function getAdminDashboardProfitSeries(token, range = {}) {
  const buckets = buildProfitBuckets(range);
  if (!buckets.length) return [];

  const points = [];
  let successfulRequests = 0;

  for (let index = 0; index < buckets.length; index += 4) {
    const batch = buckets.slice(index, index + 4);
    const results = await Promise.allSettled(
      batch.map((bucket) => getAdminDashboardSummary(token, {
        from: bucket.from,
        to: bucket.to,
      })),
    );

    results.forEach((result, resultIndex) => {
      const bucket = batch[resultIndex];
      const value = result.status === "fulfilled"
        ? nullableNumber(result.value?.cards?.netProfitUsd?.value)
        : null;

      if (result.status === "fulfilled") successfulRequests += 1;
      points.push({ ...bucket, value });
    });
  }

  if (!successfulRequests) {
    throw new Error("Profit chart data could not be loaded.");
  }

  return points;
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

async function getWalletBalancesSummary(token) {
  const walletUsersLimit = 100;
  const firstPage = await getAdminUsers(token, { page: 1, limit: walletUsersLimit });
  const totalPages = firstPage.pagination?.pages || 1;
  const remainingPages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => index + 2);
  const remainingResults = remainingPages.length
    ? await Promise.all(remainingPages.map((page) => getAdminUsers(token, { page, limit: walletUsersLimit })))
    : [];
  const users = [firstPage, ...remainingResults].flatMap((result) => result.users || []);

  return summarizeWalletBalances(users);
}

export async function getAdminDashboardData(token, range = {}) {
  const results = await Promise.all([
    settle("summary", "Dashboard period summary", getAdminDashboardSummary(token, range)),
    settle("profitSeries", "بيانات رسم الأرباح", getAdminDashboardProfitSeries(token, range)),
    settle("stats", "Dashboard statistics", getAdminDashboardStats(token)),
    settle("recentOrders", "أحدث طلبات الشراء", getAdminOrders(token, { page: 1, limit: 8 })),
    settle("recentDeposits", "طلبات إضافة الرصيد اليدوي", getAdminDeposits(token, { page: 1, limit: 8 })),
    settle("users", "User total", getAdminUsers(token, { page: 1, limit: 1 })),
    settle("pendingUsers", "Pending users", getAdminUsers(token, { page: 1, limit: 1, status: "PENDING" })),
    settle("products", "Product total", getAdminProducts(token, { page: 1, limit: 1 })),
    settle("walletBalances", "أرصدة المحافظ", getWalletBalancesSummary(token)),
    settle("pendingDeposits", "طلبات إضافة الرصيد", getAdminDeposits(token, { page: 1, limit: 1, status: "PENDING" })),
    settle(
      "pendingGroupRequests",
      "Pending group/sub-agent requests",
      getAdminGroupRequests(token, { page: 1, limit: 1, status: "PENDING" }),
    ),
    settle("providers", "Providers", getAdminProviders(token, { includeInactive: true })),
  ]);

  const stats = getSettledValue(results, "stats");
  const recentOrders = getSettledValue(results, "recentOrders");
  const recentDeposits = getSettledValue(results, "recentDeposits");
  const users = getSettledValue(results, "users");
  const pendingUsers = getSettledValue(results, "pendingUsers");
  const products = getSettledValue(results, "products");
  const walletBalances = getSettledValue(results, "walletBalances");
  const pendingDeposits = getSettledValue(results, "pendingDeposits");
  const pendingGroupRequests = getSettledValue(results, "pendingGroupRequests");
  const providers = getSettledValue(results, "providers");
  const profitSeries = getSettledValue(results, "profitSeries");
  const summary = getSettledValue(results, "summary");

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
      totalOrders: firstNumber(stats?.orders?.total, paginationTotal(recentOrders)),
      totalProducts: firstNumber(stats?.products?.total, paginationTotal(products)),
      totalUsers: firstNumber(stats?.users?.total, paginationTotal(users)),
      totalWalletBalances: firstNumber(getStatsWalletTotal(stats), walletBalances?.amount),
      totalWalletBalancesCurrency: getStatsWalletTotal(stats) !== null ? getStatsWalletCurrency(stats) : walletBalances?.currency,
      totalWalletBalancesLabel: getStatsWalletTotal(stats) !== null
        ? formatCurrency(getStatsWalletTotal(stats), getStatsWalletCurrency(stats), "ar-EG-u-nu-latn")
        : walletBalances?.label,
    },
    periodSummary: summary,
    profitSeries: Array.isArray(profitSeries) ? profitSeries : [],
    recentOrders: Array.isArray(recentOrders?.orders) ? recentOrders.orders : [],
    recentDeposits: Array.isArray(recentDeposits?.deposits) ? recentDeposits.deposits : [],
    providers: providersWithBalances,
    refreshedAt: summary?.updatedAt || new Date().toISOString(),
    sources: {
      dashboardStats: Boolean(stats),
      providersCount: providers ? providerItems.length : null,
      recentOrdersCount: toNumber(recentOrders?.orders?.length, 0),
      recentDepositsCount: toNumber(recentDeposits?.deposits?.length, 0),
    },
  };
}
