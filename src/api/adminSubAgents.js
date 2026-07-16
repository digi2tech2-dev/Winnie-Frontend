import { apiRequest } from "./client";
import {
  asArray,
  compactObject,
  DEFAULT_CURRENCY,
  formatCurrency,
  formatDateTime,
  getItemId,
  normalizePagination,
  toNumber,
} from "./adapters";
import { normalizeAdminGroupRequest } from "./adminGroupRequests";
import { normalizeAdminGroup } from "./adminGroups";
import { normalizeReferralCommission, normalizeReferredUser } from "./referrals";

function normalizeTotals(items = []) {
  return asArray(items).map((item) => {
    const currency = String(item.currency || item._id || DEFAULT_CURRENCY).toUpperCase();
    const amount = toNumber(item.amount ?? item.total, 0);
    return {
      ...item,
      amount,
      amountLabel: formatCurrency(amount, currency),
      currency,
      count: toNumber(item.count, 0),
    };
  });
}

export function normalizeSubAgent(agent = {}) {
  const id = getItemId(agent);
  return {
    ...agent,
    id,
    userId: agent.userId || id,
    active: agent.active === true,
    approvedAt: agent.approvedAt || null,
    approvedAtLabel: agent.approvedAt ? formatDateTime(agent.approvedAt) : "",
    code: agent.code || agent.referralCode || "",
    commissionPercent: toNumber(agent.commissionPercent, 0),
    email: agent.email || "",
    group: normalizeAdminGroup(agent.group),
    name: agent.name || "User",
    status: agent.status || (agent.active ? "active" : "inactive"),
    totalPaidCommissions: normalizeTotals(agent.totalPaidCommissions),
    totalPendingCommissions: normalizeTotals(agent.totalPendingCommissions),
  };
}

export async function getSubAgentRequests(token, query = {}) {
  const response = await apiRequest("/admin/sub-agents/requests", {
    token,
    query: compactObject(query),
  });
  const requests = asArray(response.data?.requests || response.data).map(normalizeAdminGroupRequest);
  return {
    message: response.message,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit,
      total: requests.length,
    }),
    requests,
  };
}

export async function approveSubAgentRequest(token, id, payload = {}) {
  const response = await apiRequest(`/admin/sub-agents/requests/${id}/approve`, {
    method: "POST",
    token,
    body: compactObject({
      approvedGroupId: payload.approvedGroupId,
      adminNote: payload.adminNote,
    }),
  });

  return {
    alreadyProcessed: response.data?.alreadyProcessed === true,
    message: response.message,
    request: normalizeAdminGroupRequest(response.data?.request || response.data || {}),
  };
}

export async function rejectSubAgentRequest(token, id, payload = {}) {
  const response = await apiRequest(`/admin/sub-agents/requests/${id}/reject`, {
    method: "POST",
    token,
    body: compactObject({
      rejectionReason: payload.rejectionReason,
      adminNote: payload.adminNote,
    }),
  });

  return {
    alreadyProcessed: response.data?.alreadyProcessed === true,
    message: response.message,
    request: normalizeAdminGroupRequest(response.data?.request || response.data || {}),
  };
}

export async function getSubAgents(token, query = {}) {
  const response = await apiRequest("/admin/sub-agents", {
    token,
    query: compactObject(query),
  });
  const subAgents = asArray(response.data?.subAgents || response.data).map(normalizeSubAgent);
  return {
    message: response.message,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit,
      total: subAgents.length,
    }),
    subAgents,
  };
}

export async function updateSubAgent(token, userId, payload = {}) {
  const response = await apiRequest(`/admin/sub-agents/${userId}`, {
    method: "PATCH",
    token,
    body: compactObject(payload),
  });
  return {
    message: response.message,
    subAgent: normalizeSubAgent(response.data?.subAgent || response.data || {}),
  };
}

export async function getSubAgentReferredUsers(token, userId, query = {}) {
  const response = await apiRequest(`/admin/sub-agents/${userId}/referred-users`, {
    token,
    query: compactObject(query),
  });
  const referredUsers = asArray(response.data?.referredUsers || response.data).map(normalizeReferredUser);
  return {
    message: response.message,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit,
      total: referredUsers.length,
    }),
    referredUsers,
  };
}

export async function getSubAgentCommissions(token, query = {}) {
  const response = await apiRequest("/admin/sub-agents/commissions", {
    token,
    query: compactObject(query),
  });
  const commissions = asArray(response.data?.commissions || response.data).map(normalizeReferralCommission);
  return {
    message: response.message,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit,
      total: commissions.length,
    }),
    commissions,
  };
}
