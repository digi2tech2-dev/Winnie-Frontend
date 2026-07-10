import { apiRequest } from "./client";
import { asArray, getItemId, toNumber } from "./adapters";

export function normalizeAdminGroup(group = {}) {
  const id = getItemId(group);
  const isActive = group.isActive !== false;

  return {
    ...group,
    id,
    _id: group._id ?? id,
    isActive,
    name: group.name || "Unnamed group",
    percentage: toNumber(group.percentage, 0),
    markup: toNumber(group.percentage, 0),
    membersCount: toNumber(group.membersCount, 0),
    status: isActive ? "active" : "inactive",
  };
}

function normalizeSummary(summary = {}, groups = []) {
  const totalGroups = toNumber(summary.totalGroups, groups.length);
  const activeGroups = toNumber(summary.activeGroups, groups.filter((group) => group.isActive).length);
  const groupsWithMembers = toNumber(
    summary.groupsWithMembers,
    groups.filter((group) => group.membersCount > 0).length,
  );
  const groupsWithoutMembers = toNumber(
    summary.groupsWithoutMembers,
    groups.filter((group) => group.membersCount === 0).length,
  );
  const totalMembers = toNumber(
    summary.totalMembers,
    groups.reduce((sum, group) => sum + group.membersCount, 0),
  );

  return {
    totalGroups,
    activeGroups,
    groupsWithMembers,
    groupsWithoutMembers,
    totalMembers,
  };
}

function buildGroupPayload(values = {}) {
  const percentage = values.percentage ?? values.markup ?? 0;

  return {
    name: String(values.name || "").trim(),
    percentage: toNumber(percentage, 0),
    isActive: values.isActive ?? values.status !== "inactive",
  };
}

export async function getAdminGroups(token, query = {}) {
  const response = await apiRequest("/admin/groups", {
    query,
    token,
  });
  const payload = response.data || {};
  const groups = asArray(payload.items || payload.groups || payload)
    .map(normalizeAdminGroup);
  const summary = normalizeSummary(payload.summary, groups);

  return {
    groups,
    items: groups,
    summary,
    unassignedUsers: toNumber(payload.unassignedUsers, 0),
    message: response.message,
  };
}

export async function createAdminGroup(token, values = {}) {
  const response = await apiRequest("/admin/groups", {
    body: buildGroupPayload(values),
    token,
  });

  return {
    group: normalizeAdminGroup(response.data?.group || response.data),
    message: response.message,
  };
}

export async function updateAdminGroup(token, id, values = {}) {
  const response = await apiRequest(`/admin/groups/${encodeURIComponent(id)}`, {
    body: buildGroupPayload(values),
    method: "PATCH",
    token,
  });

  return {
    group: normalizeAdminGroup(response.data?.group || response.data),
    message: response.message,
  };
}

export async function deleteAdminGroup(token, id) {
  const response = await apiRequest(`/admin/groups/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });

  return {
    group: normalizeAdminGroup(response.data?.group || response.data),
    message: response.message,
  };
}
