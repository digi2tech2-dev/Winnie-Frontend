import { apiRequest } from "./client";
import {
  asArray,
  compactObject,
  formatDate,
  formatDateTime,
  getItemId,
  normalizePagination,
} from "./adapters";

function formatRelativeTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "غير متاح";

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const divisions = [
    { amount: 60, unit: "second" },
    { amount: 60, unit: "minute" },
    { amount: 24, unit: "hour" },
    { amount: 7, unit: "day" },
    { amount: 4.345, unit: "week" },
    { amount: 12, unit: "month" },
    { amount: Number.POSITIVE_INFINITY, unit: "year" },
  ];

  let duration = diffSeconds;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return new Intl.RelativeTimeFormat("ar-EG-u-nu-latn", { numeric: "auto" }).format(
        Math.round(duration),
        division.unit,
      );
    }
    duration /= division.amount;
  }

  return formatDateTime(value, "ar-EG-u-nu-latn");
}

export function normalizeSupervisor(supervisor = {}) {
  const id = getItemId(supervisor);
  const permissions = Array.isArray(supervisor.permissions) ? supervisor.permissions : [];
  const lastSeenAt = supervisor.lastSeenAt || supervisor.updatedAt || supervisor.createdAt || null;

  return {
    ...supervisor,
    id,
    _id: supervisor._id ?? id,
    avatarInitial: supervisor.avatarInitial || String(supervisor.name || supervisor.email || "S").slice(0, 1).toUpperCase(),
    email: supervisor.email || "",
    isActive: supervisor.isActive !== false && supervisor.status !== "deleted" && supervisor.status !== "blocked",
    lastSeen: supervisor.lastSeenLabel || formatRelativeTime(lastSeenAt),
    lastSeenAt,
    logsCount: Number(supervisor.logsCount || 0),
    name: supervisor.name || supervisor.email || "Supervisor",
    permissions,
    permissionsCount: Number(supervisor.permissionsCount ?? permissions.length),
    status: supervisor.status || "active",
    userId: supervisor.userId || id,
  };
}

export function normalizeEligibleSupervisorUser(user = {}) {
  const id = getItemId(user);

  return {
    ...user,
    id,
    _id: user._id ?? id,
    avatarInitial: user.avatarInitial || String(user.name || user.email || "U").slice(0, 1).toUpperCase(),
    currency: user.currency || "USD",
    deletedAt: user.deletedAt || null,
    email: user.email || "",
    isBlocked: user.isBlocked === true,
    name: user.name || user.email || "User",
    role: user.role || "CUSTOMER",
    status: user.status || "ACTIVE",
    walletBalance: Number(user.walletBalance || 0),
  };
}

export function normalizeSupervisorLog(log = {}) {
  const id = getItemId(log);
  const createdAt = log.createdAt || null;
  const metadata = log.metadata || {};
  const entityId = log.entityId || metadata.entityId || metadata.targetUserId || metadata.transactionId || "";
  const entityType = log.entityType || metadata.entityType || "";

  return {
    ...log,
    id,
    _id: log._id ?? id,
    action: log.action || "SUPERVISOR_ACTION",
    createdAt,
    date: createdAt ? formatDate(createdAt, "ar-EG-u-nu-latn") : "غير متاح",
    details: log.description || metadata.description || metadata.note || JSON.stringify(metadata || {}),
    ip: log.ipAddress || metadata.ipAddress || "غير متاح",
    status: "completed",
    supervisorId: String(log.actorId || metadata.actorId || ""),
    target: [entityType, entityId].filter(Boolean).join(":") || "غير محدد",
    time: createdAt
      ? new Intl.DateTimeFormat("ar-EG-u-nu-latn", { hour: "2-digit", minute: "2-digit" }).format(new Date(createdAt))
      : "غير متاح",
  };
}

export function normalizeSupervisorPermissionGroups(data = {}) {
  const groups = asArray(data.groups).length ? asArray(data.groups) : [];
  if (groups.length) {
    return groups.map((group) => ({
      ...group,
      title: group.titleAr || group.titleEn || group.group,
      items: asArray(group.items).map((item) => ({
        ...item,
        label: item.labelAr || item.labelEn || item.key,
        key: item.key,
      })),
    }));
  }

  const items = asArray(data.items);
  const byGroup = new Map();
  items.forEach((item) => {
    const groupKey = item.group || "general";
    if (!byGroup.has(groupKey)) {
      byGroup.set(groupKey, { group: groupKey, title: groupKey, items: [] });
    }
    byGroup.get(groupKey).items.push({
      ...item,
      label: item.labelAr || item.labelEn || item.key,
      key: item.key,
    });
  });

  return [...byGroup.values()];
}

export async function listSupervisors(token, params = {}) {
  const response = await apiRequest("/admin/supervisors", {
    query: compactObject(params),
    token,
  });
  const data = response.data || {};
  const supervisors = asArray(data.items || data).map(normalizeSupervisor);

  return {
    message: response.message,
    pagination: normalizePagination(data.pagination || response.pagination, {
      page: params.page,
      limit: params.limit,
      total: supervisors.length,
    }),
    summary: data.summary || { total: supervisors.length, active: supervisors.length, blocked: 0, deleted: 0 },
    supervisors,
  };
}

export async function listEligibleSupervisorUsers(token, params = {}) {
  const response = await apiRequest("/admin/supervisors/eligible-users", {
    query: compactObject(params),
    token,
  });
  const data = response.data || {};
  const users = asArray(data.items || data).map(normalizeEligibleSupervisorUser);

  return {
    message: response.message,
    pagination: normalizePagination(data.pagination || response.pagination, {
      page: params.page,
      limit: params.limit,
      total: users.length,
    }),
    users,
  };
}

export async function assignSupervisor(token, payload = {}) {
  const response = await apiRequest("/admin/supervisors", {
    body: {
      userId: payload.userId,
      permissions: payload.permissions || [],
    },
    method: "POST",
    token,
  });

  return {
    message: response.message,
    supervisor: normalizeSupervisor(response.data?.supervisor || response.data || {}),
  };
}

export async function updateSupervisorPermissions(token, id, permissions = []) {
  const response = await apiRequest(`/admin/supervisors/${encodeURIComponent(id)}/permissions`, {
    body: { permissions },
    method: "PATCH",
    token,
  });

  return {
    message: response.message,
    supervisor: normalizeSupervisor(response.data?.supervisor || response.data?.user || response.data || {}),
  };
}

export async function removeSupervisor(token, id) {
  const response = await apiRequest(`/admin/supervisors/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });

  return {
    message: response.message,
    supervisor: normalizeSupervisor(response.data?.supervisor || response.data || {}),
  };
}

export async function restoreSupervisor(token, id) {
  const response = await apiRequest(`/admin/supervisors/${encodeURIComponent(id)}/restore`, {
    method: "PATCH",
    token,
  });

  return {
    message: response.message,
    supervisor: normalizeSupervisor(response.data?.supervisor || response.data || {}),
  };
}

export async function getSupervisorLogs(token, id, params = {}) {
  const response = await apiRequest(`/admin/supervisors/${encodeURIComponent(id)}/logs`, {
    query: compactObject(params),
    token,
  });
  const data = response.data || {};
  const logs = asArray(data.items || data).map(normalizeSupervisorLog);

  return {
    logs,
    message: response.message,
    pagination: normalizePagination(data.pagination || response.pagination, {
      page: params.page,
      limit: params.limit,
      total: logs.length,
    }),
  };
}

export async function getAllSupervisorLogs(token, params = {}) {
  const response = await apiRequest("/admin/supervisors/logs", {
    query: compactObject(params),
    token,
  });
  const data = response.data || {};
  const logs = asArray(data.items || data).map(normalizeSupervisorLog);

  return {
    logs,
    message: response.message,
    pagination: normalizePagination(data.pagination || response.pagination, {
      page: params.page,
      limit: params.limit,
      total: logs.length,
    }),
  };
}

export async function listSupervisorPermissions(token) {
  const response = await apiRequest("/admin/supervisors/permissions", { token });

  return {
    groups: normalizeSupervisorPermissionGroups(response.data || {}),
    message: response.message,
    permissions: asArray(response.data?.items),
  };
}
