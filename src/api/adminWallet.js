import { apiRequest } from "./client";
import { asArray, formatCurrency, normalizePagination, toNumber } from "./adapters";
import { normalizeAdminUser } from "./adminUsers";
import { normalizeWalletTransaction } from "./wallet";

function normalizeWalletPayload(wallet = {}) {
  const user = normalizeAdminUser(wallet.user || {});
  const currency = user.currency;
  const balance = toNumber(user.walletBalance, 0);

  return {
    balance,
    balanceLabel: formatCurrency(balance, currency, "ar-EG-u-nu-latn"),
    creditLimit: toNumber(user.creditLimit, 0),
    creditUsed: toNumber(user.creditUsed, 0),
    currency,
    recentTransactions: asArray(wallet.recentTransactions).map(normalizeWalletTransaction),
    user,
  };
}

export async function getAdminUserWallet(token, userId) {
  const response = await apiRequest(`/admin/wallets/${encodeURIComponent(userId)}`, { token });
  const wallet = response.data?.wallet || response.data || {};

  return {
    message: response.message,
    wallet: normalizeWalletPayload(wallet),
  };
}

export async function getAdminUserWalletTransactions(token, userId, query = {}) {
  const response = await apiRequest(`/admin/wallets/${encodeURIComponent(userId)}/transactions`, {
    query,
    token,
  });
  const transactions = asArray(response.data).map(normalizeWalletTransaction);

  return {
    message: response.message,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit,
      total: transactions.length,
    }),
    transactions,
  };
}
