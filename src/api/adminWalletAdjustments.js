import { apiRequest } from "./client";
import { asArray, formatCurrency, formatDateTime, getItemId, normalizePagination, toNumber } from "./adapters";

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

export async function getAdminWalletAdjustments(token, query = {}) {
  const response = await apiRequest("/admin/wallet-adjustments", { query, token });
  const source = response.data?.items || response.data;
  const adjustments = asArray(source).map(normalizeAdminWalletAdjustment);
  const summary = response.summary || response.data?.summary || {};

  return {
    adjustments,
    message: response.message,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit,
      total: adjustments.length,
    }),
    summary: {
      count: toNumber(summary.count, adjustments.length),
      net: toNumber(summary.net, 0),
      totalAdded: toNumber(summary.totalAdded, 0),
      totalDeducted: toNumber(summary.totalDeducted, 0),
    },
  };
}
