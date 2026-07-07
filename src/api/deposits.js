import { apiRequest } from "./client";
import {
  DEFAULT_CURRENCY,
  formatCurrency,
  formatDateTime,
  getItemId,
  humanizeToken,
  normalizePagination,
  toNumber,
} from "./adapters";

export function normalizeDeposit(deposit = {}) {
  const id = getItemId(deposit);
  const currency = String(deposit.currency || DEFAULT_CURRENCY).toUpperCase();
  const requestedAmount = toNumber(deposit.requestedAmount ?? deposit.amount, 0);
  const status = String(deposit.status || "PENDING").toUpperCase();

  return {
    ...deposit,
    id,
    _id: deposit._id ?? id,
    amountLabel: formatCurrency(requestedAmount, currency),
    createdAtLabel: formatDateTime(deposit.createdAt),
    currency,
    requestedAmount,
    status,
    statusLabel: humanizeToken(status, "Pending"),
  };
}

export async function createDepositRequest(token, formData) {
  const response = await apiRequest("/me/deposits", {
    method: "POST",
    token,
    body: formData,
  });

  return {
    deposit: normalizeDeposit(response.data || {}),
    message: response.message,
    raw: response.data,
  };
}

export async function getCustomerDeposits(token, query = {}) {
  const response = await apiRequest("/me/deposits", {
    token,
    query,
  });

  const deposits = (Array.isArray(response.data) ? response.data : []).map(normalizeDeposit);

  return {
    deposits,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit,
      total: deposits.length,
    }),
    message: response.message,
  };
}
