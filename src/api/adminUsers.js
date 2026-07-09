import { apiRequest } from "./client";
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

function normalizeGroup(group) {
  if (!group) return null;
  if (typeof group === "string") return { id: group, name: "Unassigned", percentage: null };

  const id = getItemId(group);
  return {
    id,
    _id: group._id ?? id,
    isActive: group.isActive ?? null,
    name: group.name || "Unassigned",
    percentage: group.percentage ?? null,
  };
}

export function normalizeAdminUser(user = {}) {
  const id = getItemId(user);
  const group = normalizeGroup(user.groupId || user.group);
  const status = String(user.status || "PENDING").toUpperCase();
  const role = String(user.role || "CUSTOMER").toUpperCase();
  const currency = String(user.currency || DEFAULT_CURRENCY).toUpperCase();
  const walletBalance = toNumber(user.walletBalance ?? user.balance, 0);
  const creditLimit = toNumber(user.creditLimit ?? user.debtLimit, 0);
  const creditUsed = toNumber(user.creditUsed, 0);

  return {
    ...user,
    id,
    _id: user._id ?? id,
    approvedAt: user.approvedAt || null,
    avatar: user.avatar || "",
    country: user.country || "",
    createdAt: user.createdAt || user.registeredAt || null,
    createdAtLabel: formatDateTime(user.createdAt || user.registeredAt, "ar-EG-u-nu-latn"),
    creditLimit,
    creditUsed,
    currency,
    email: user.email || "",
    group,
    groupName: group?.name || "Unassigned",
    groupPercentage: group?.percentage ?? null,
    isSubAgent: user.isSubAgent === true,
    identityVerificationRequired: user.identityVerificationRequired === true,
    identityVerificationReason: user.identityVerificationReason || "",
    identityVerificationRequestedAt: user.identityVerificationRequestedAt || null,
    identityVerificationClearedAt: user.identityVerificationClearedAt || null,
    name: user.name || user.username || "Winnie user",
    phone: user.phone || "",
    rejectedAt: user.rejectedAt || null,
    role,
    roleLabel: humanizeToken(role, "Customer"),
    status,
    statusLabel: humanizeToken(status, "Pending"),
    subAgentStatus: String(user.subAgentStatus || "NONE").toUpperCase(),
    verified: user.verified === true,
    walletBalance,
    walletBalanceLabel: formatCurrency(walletBalance, currency, "ar-EG-u-nu-latn"),
  };
}

export async function getAdminUsers(token, query = {}) {
  const response = await apiRequest("/admin/users", {
    token,
    query: compactObject(query),
  });
  const users = asArray(response.data).map(normalizeAdminUser);

  return {
    message: response.message,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit,
      total: users.length,
    }),
    users,
  };
}

export async function getAdminUser(token, id) {
  const response = await apiRequest(`/admin/users/${encodeURIComponent(id)}`, { token });

  return {
    message: response.message,
    user: normalizeAdminUser(response.data?.user || response.data || {}),
  };
}

export async function approveUser(token, id) {
  const response = await apiRequest(`/admin/users/${id}/approve`, {
    method: "PATCH",
    token,
  });

  return {
    message: response.message,
    user: normalizeAdminUser(response.data?.user || response.data || {}),
  };
}

export async function rejectUser(token, id) {
  const response = await apiRequest(`/admin/users/${id}/reject`, {
    method: "PATCH",
    token,
  });

  return {
    message: response.message,
    user: normalizeAdminUser(response.data?.user || response.data || {}),
  };
}

export async function updateAdminUserGroup(token, id, { groupId, reason } = {}) {
  const response = await apiRequest(`/admin/users/${encodeURIComponent(id)}/group`, {
    body: compactObject({ groupId, reason }),
    method: "PATCH",
    token,
  });

  return {
    message: response.message,
    user: normalizeAdminUser(response.data?.user || response.data || {}),
  };
}

export async function updateAdminUserCurrency(token, id, currency, reason = "Admin update") {
  const response = await apiRequest(`/admin/users/${encodeURIComponent(id)}/currency`, {
    body: {
      currency: String(currency || "").trim().toUpperCase(),
      reason,
    },
    method: "PATCH",
    token,
  });

  return {
    message: response.message,
    user: normalizeAdminUser(response.data?.user || response.data || {}),
  };
}

export async function updateUserIdentityVerification(token, id, { required, reason } = {}) {
  const response = await apiRequest(`/admin/users/${encodeURIComponent(id)}/identity-verification`, {
    body: compactObject({
      required,
      reason,
    }),
    method: "PATCH",
    token,
  });

  return {
    message: response.message,
    user: normalizeAdminUser(response.data?.user || response.data || {}),
  };
}
