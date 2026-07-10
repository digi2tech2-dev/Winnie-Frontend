import { apiRequest } from "./client";
import { asArray, compactObject, formatCurrency, formatDateTime, getItemId, normalizePagination, toNumber } from "./adapters";

function normalizePerson(person = {}) {
  const id = getItemId(person);
  return {
    ...person,
    id,
    name: person.name || "",
    email: person.email || "",
  };
}

export function normalizeAdminWalletAdjustment(item = {}) {
  const action = String(item.action || item.metadata?.operation || "").toUpperCase() === "DEDUCT" ? "DEDUCT" : "ADD";
  const currency = String(item.currency || "USD").toUpperCase();
  const amount = toNumber(item.amount, 0);

  return {
    ...item,
    id: getItemId(item),
    action,
    actionLabel: action === "DEDUCT" ? "خصم" : "إضافة",
    actor: normalizePerson(item.actor),
    afterBalance: toNumber(item.afterBalance ?? item.balanceAfter, 0),
    amount,
    amountLabel: formatCurrency(amount, currency, "ar-EG-u-nu-latn"),
    beforeBalance: toNumber(item.beforeBalance ?? item.balanceBefore, 0),
    createdAtLabel: formatDateTime(item.createdAt, "ar-EG-u-nu-latn"),
    currency,
    reason: item.reason || item.note || item.description || "",
    user: normalizePerson(item.user),
  };
}

function normalizeCurrencyTotal(item = {}) {
  const currency = String(item.currency || "USD").toUpperCase();
  return {
    currency,
    count: toNumber(item.count, 0),
    net: toNumber(item.net, 0),
    totalAdded: toNumber(item.totalAdded ?? item.totalAdditions, 0),
    totalAdditions: toNumber(item.totalAdditions ?? item.totalAdded, 0),
    totalDeducted: toNumber(item.totalDeducted ?? item.totalDeductions, 0),
    totalDeductions: toNumber(item.totalDeductions ?? item.totalDeducted, 0),
  };
}

function normalizeAdjustmentSummary(summary = {}, adjustments = []) {
  if (!summary || Object.keys(summary).length === 0) return null;

  const totalsByCurrency = asArray(summary.totalsByCurrency).map(normalizeCurrencyTotal);
  const currency = summary.currency ? String(summary.currency).toUpperCase() : "";
  const mode = String(summary.mode || "").toLowerCase();
  const singleCurrencyTotal = currency
    ? (totalsByCurrency.find((item) => item.currency === currency) || normalizeCurrencyTotal({ ...summary, currency }))
    : (mode !== "grouped" && totalsByCurrency.length === 1 ? totalsByCurrency[0] : null);

  if (singleCurrencyTotal) {
    return {
      ...singleCurrencyTotal,
      count: toNumber(summary.count, singleCurrencyTotal.count || adjustments.length),
      currency: singleCurrencyTotal.currency,
      mode: "single",
      hasMixedCurrencies: false,
      totalsByCurrency,
    };
  }

  return {
    count: toNumber(summary.count, adjustments.length),
    currency: "",
    hasMixedCurrencies: mode === "grouped" && totalsByCurrency.length > 0,
    mode: "grouped",
    net: summary.net == null ? null : toNumber(summary.net, 0),
    totalAdded: summary.totalAdded == null ? null : toNumber(summary.totalAdded, 0),
    totalAdditions: summary.totalAdditions == null ? null : toNumber(summary.totalAdditions, 0),
    totalDeducted: summary.totalDeducted == null ? null : toNumber(summary.totalDeducted, 0),
    totalDeductions: summary.totalDeductions == null ? null : toNumber(summary.totalDeductions, 0),
    totalsByCurrency,
  };
}

function buildAdjustmentQuery(query = {}) {
  const currency = String(query.currency || "").trim().toUpperCase();
  return compactObject({
    ...query,
    currency: /^[A-Z]{3}$/.test(currency) ? currency : undefined,
  });
}

function normalizeAdjustmentResponse(response = {}) {
  const root = response.raw && typeof response.raw === "object" ? response.raw : response;
  const payload = response.data ?? root?.data ?? root ?? {};

  return {
    items: payload?.items ?? payload?.adjustments ?? payload?.data ?? root?.items ?? [],
    pagination: payload?.pagination ?? response.pagination ?? root?.pagination ?? null,
    summary: payload?.summary ?? root?.summary ?? response.summary ?? null,
  };
}

export async function getAdminWalletAdjustments(token, query = {}) {
  const response = await apiRequest("/admin/wallet-adjustments", { query: buildAdjustmentQuery(query), token });
  const payload = normalizeAdjustmentResponse(response);
  const adjustments = asArray(payload.items).map(normalizeAdminWalletAdjustment);

  return {
    adjustments,
    message: response.message,
    pagination: normalizePagination(payload.pagination, {
      page: query.page,
      limit: query.limit,
      total: adjustments.length,
    }),
    summary: normalizeAdjustmentSummary(payload.summary, adjustments),
  };
}
