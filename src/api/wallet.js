import { apiRequest } from "./client";
import {
  asArray,
  DEFAULT_CURRENCY,
  formatCurrency,
  formatDateTime,
  getItemId,
  humanizeToken,
  normalizePagination,
  toNumber,
} from "./adapters";

export function normalizeWalletTransaction(transaction = {}) {
  const direction = String(transaction.direction || "").toUpperCase();
  const type = String(transaction.type || "").toUpperCase();
  const semanticType = String(transaction.semanticType || type || "").toUpperCase();
  const inferredDirection =
    direction || (type === "DEBIT" || semanticType.includes("DEBIT") ? "DEBIT" : "CREDIT");
  const currency = String(transaction.currency || DEFAULT_CURRENCY).toUpperCase();
  const amount = toNumber(transaction.amount, 0);
  const signedAmount = inferredDirection === "DEBIT" ? -Math.abs(amount) : Math.abs(amount);
  const id = getItemId(transaction);

  return {
    ...transaction,
    id,
    amount,
    signedAmount,
    amountLabel: `${inferredDirection === "DEBIT" ? "-" : "+"}${formatCurrency(amount, currency)}`,
    balanceAfter: toNumber(transaction.balanceAfter, 0),
    balanceBefore: toNumber(transaction.balanceBefore, 0),
    currency,
    date: transaction.createdAt || transaction.date || null,
    dateLabel: formatDateTime(transaction.createdAt || transaction.date),
    description: transaction.description || humanizeToken(semanticType || type, "Wallet transaction"),
    direction: inferredDirection,
    directionLabel: humanizeToken(inferredDirection, "Neutral"),
    reference: transaction.reference || null,
    semanticType,
    semanticTypeLabel: humanizeToken(semanticType || type, "Wallet transaction"),
    sourceType: transaction.sourceType || "",
    status: transaction.status || "COMPLETED",
    statusLabel: humanizeToken(transaction.status || "COMPLETED", "Completed"),
    type,
    typeLabel: humanizeToken(type || semanticType, "Transaction"),
  };
}

export function normalizeWalletSummary(data = {}) {
  const currency = String(data.currency || DEFAULT_CURRENCY).toUpperCase();

  return {
    balance: toNumber(data.walletBalance ?? data.balance, 0),
    balanceLabel: formatCurrency(data.walletBalance ?? data.balance, currency),
    currency,
    recentTransactions: asArray(data.recentTransactions).map(normalizeWalletTransaction),
  };
}

export async function getWalletSummary(token) {
  const response = await apiRequest("/me/wallet", { token });
  return normalizeWalletSummary(response.data || {});
}

export async function getWalletTransactions(token, query = {}) {
  const response = await apiRequest("/me/wallet/transactions", {
    token,
    query,
  });

  const transactions = asArray(response.data).map(normalizeWalletTransaction);

  return {
    transactions,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit,
      total: transactions.length,
    }),
    message: response.message,
  };
}
