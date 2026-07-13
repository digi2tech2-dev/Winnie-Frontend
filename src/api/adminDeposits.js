import { apiRequest, getApiBaseUrl } from "./client";
import {
  DEFAULT_CURRENCY,
  asArray,
  compactObject,
  formatCurrency,
  formatDateTime,
  getItemId,
  humanizeToken,
  normalizePagination,
  toNumber,
} from "./adapters";

function normalizeUserSummary(user) {
  if (!user) return null;
  if (typeof user === "string") return { id: user, name: "User", email: "" };
  const id = getItemId(user);

  return {
    id,
    _id: user._id ?? id,
    currency: user.currency || "",
    email: user.email || "",
    name: user.name || user.username || "User",
    walletBalance: toNumber(user.walletBalance, 0),
  };
}

function resolveReceiptUrl(path) {
  const value = String(path || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  const apiUrl = new URL(getApiBaseUrl());
  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${apiUrl.origin}${normalizedPath}`;
}

function normalizeReviewer(user) {
  if (!user) return null;
  if (typeof user === "string") return { id: user, name: "Admin", email: "" };
  const id = getItemId(user);
  return {
    id,
    email: user.email || "",
    name: user.name || "Admin",
  };
}

export function normalizeAdminDeposit(deposit = {}) {
  const id = getItemId(deposit);
  const currency = String(deposit.currency || DEFAULT_CURRENCY).toUpperCase();
  const requestedAmount = toNumber(deposit.requestedAmount ?? deposit.amount, 0);
  const amountUsd = toNumber(deposit.amountUsd, 0);
  const status = String(deposit.status || "PENDING").toUpperCase();
  const receiptImage = deposit.receiptImage || deposit.receipt || "";

  return {
    ...deposit,
    id,
    _id: deposit._id ?? id,
    adminNotes: deposit.adminNotes || "",
    amountLabel: formatCurrency(requestedAmount, currency, "ar-EG-u-nu-latn"),
    amountUsd,
    amountUsdLabel: formatCurrency(amountUsd, "USD", "ar-EG-u-nu-latn"),
    createdAt: deposit.createdAt || null,
    createdAtLabel: formatDateTime(deposit.createdAt, "ar-EG-u-nu-latn"),
    currency,
    exchangeRate: toNumber(deposit.exchangeRate, 0),
    notes: deposit.notes || "",
    paymentMethodId: deposit.paymentMethodId || "",
    receiptImage,
    receiptUrl: resolveReceiptUrl(receiptImage),
    requestedAmount,
    reviewedAt: deposit.reviewedAt || null,
    reviewedAtLabel: deposit.reviewedAt ? formatDateTime(deposit.reviewedAt, "ar-EG-u-nu-latn") : "",
    reviewedBy: normalizeReviewer(deposit.reviewedBy),
    status,
    statusLabel: humanizeToken(status, "Pending"),
    user: normalizeUserSummary(deposit.userId || deposit.user),
  };
}

export async function getAdminDeposits(token, query = {}) {
  const response = await apiRequest("/admin/deposits", {
    token,
    query: compactObject(query),
  });
  const deposits = asArray(response.data).map(normalizeAdminDeposit);

  return {
    deposits,
    message: response.message,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit,
      total: deposits.length,
    }),
    summary: response.raw?.summary || null,
  };
}

export async function getAdminDeposit(token, id) {
  const response = await apiRequest(`/admin/deposits/${id}`, { token });
  return {
    deposit: normalizeAdminDeposit(response.data?.deposit || response.data || {}),
    message: response.message,
  };
}

export async function approveDeposit(token, id, payload = {}) {
  const response = await apiRequest(`/admin/deposits/${id}/approve`, {
    method: "PATCH",
    token,
    body: compactObject({
      adminNotes: payload.adminNotes,
    }),
  });

  return {
    deposit: normalizeAdminDeposit(response.data?.deposit || response.data || {}),
    message: response.message,
  };
}

export async function rejectDeposit(token, id, payload = {}) {
  const response = await apiRequest(`/admin/deposits/${id}/reject`, {
    method: "PATCH",
    token,
    body: compactObject({
      adminNotes: payload.adminNotes,
    }),
  });

  return {
    deposit: normalizeAdminDeposit(response.data?.deposit || response.data || {}),
    message: response.message,
  };
}
