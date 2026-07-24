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
  const transactionCountValue = data.transactionCount ?? data.transactionsCount ?? data.totalTransactions;
  const totalDepositsValue = data.totalDeposits ?? data.totalRechargeAmount ?? data.totalTopUps;
  const transactionCount = transactionCountValue === null || transactionCountValue === undefined
    ? null
    : toNumber(transactionCountValue, 0);
  const totalDeposits = totalDepositsValue === null || totalDepositsValue === undefined
    ? null
    : toNumber(totalDepositsValue, 0);

  return {
    balance: toNumber(data.walletBalance ?? data.balance, 0),
    balanceLabel: formatCurrency(data.walletBalance ?? data.balance, currency),
    currency,
    transactionCount,
    totalDeposits,
    totalDepositsLabel: totalDeposits === null ? "" : formatCurrency(totalDeposits, currency),
    recentTransactions: asArray(data.recentTransactions).map(normalizeWalletTransaction),
  };
}

export async function getWalletSummary(token) {
  const response = await apiRequest("/me/wallet", { token });
  return normalizeWalletSummary(response.data || {});
}

function findPaginationMetadata(value, depth = 0, visited = new Set()) {
  if (!value || typeof value !== "object" || depth > 4 || visited.has(value)) return null;
  visited.add(value);

  const keys = Object.keys(value);
  const hasPageField = keys.some((key) => [
    "page",
    "currentPage",
    "pageNumber",
    "pages",
    "totalPages",
    "pageCount",
    "numberOfPages",
    "lastPage",
    "hasNext",
    "hasNextPage",
  ].includes(key));
  const hasTotalField = keys.some((key) => [
    "total",
    "totalItems",
    "totalCount",
    "totalRecords",
    "totalDocs",
    "totalTransactions",
    "count",
  ].includes(key));

  if (hasPageField || hasTotalField) return value;

  for (const child of Object.values(value)) {
    if (child && typeof child === "object" && !Array.isArray(child)) {
      const match = findPaginationMetadata(child, depth + 1, visited);
      if (match) return match;
    }
  }

  return null;
}

export async function getWalletTransactions(token, query = {}) {
  const response = await apiRequest("/me/wallet/transactions", {
    token,
    query,
  });

  const transactions = asArray(response.data).map(normalizeWalletTransaction);
  const dataEnvelope =
    response.data && !Array.isArray(response.data) && typeof response.data === "object"
      ? response.data
      : null;
  const rawEnvelope =
    response.raw && typeof response.raw === "object"
      ? response.raw
      : null;
  const nestedPagination =
    findPaginationMetadata(response.pagination) ||
    findPaginationMetadata(dataEnvelope) ||
    findPaginationMetadata(rawEnvelope) ||
    null;

  return {
    transactions,
    pagination: normalizePagination(nestedPagination, {
      page: query.page,
      limit: query.limit,
      total: transactions.length,
    }),
    message: response.message,
  };
}
