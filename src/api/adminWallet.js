import { apiRequest } from "./client";
import { asArray, formatCurrency, normalizePagination, toNumber } from "./adapters";
import { normalizeAdminUser } from "./adminUsers";
import { normalizeWalletTransaction } from "./wallet";

function normalizeWalletPayload(wallet = {}) {
  const user = normalizeAdminUser(wallet.user || {});
  const currency = user.currency;
  const balance = toNumber(user.walletBalance, 0);
  const creditLimit = toNumber(user.creditLimit, 0);
  const creditUsed = toNumber(user.creditUsed, 0);
  const availableCredit = Math.max(creditLimit - creditUsed, 0);
  const availableToSpend = balance + availableCredit;

  return {
    availableCredit,
    availableCreditLabel: formatCurrency(availableCredit, currency, "ar-EG-u-nu-latn"),
    availableToSpend,
    availableToSpendLabel: formatCurrency(availableToSpend, currency, "ar-EG-u-nu-latn"),
    balance,
    balanceLabel: formatCurrency(balance, currency, "ar-EG-u-nu-latn"),
    creditLimit,
    creditLimitLabel: formatCurrency(creditLimit, currency, "ar-EG-u-nu-latn"),
    creditUsed,
    creditUsedLabel: formatCurrency(creditUsed, currency, "ar-EG-u-nu-latn"),
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

export async function adjustAdminUserWallet(token, userId, { type, amount, reason } = {}) {
  const action = String(type || "").toUpperCase() === "DEDUCT" ? "deduct" : "add";
  const response = await apiRequest(`/admin/wallets/${encodeURIComponent(userId)}/${action}`, {
    body: { amount, reason },
    method: "POST",
    token,
  });

  return {
    message: response.message,
    transaction: normalizeWalletTransaction(response.data?.transaction || {}),
    user: normalizeAdminUser(response.data?.user || {}),
  };
}

export async function updateAdminUserCreditLimit(token, userId, { creditLimit, reason } = {}) {
  const response = await apiRequest(`/admin/users/${encodeURIComponent(userId)}/credit-limit`, {
    body: { creditLimit, reason },
    method: "PATCH",
    token,
  });

  return {
    message: response.message,
    user: normalizeAdminUser(response.data?.user || response.data || {}),
  };
}
