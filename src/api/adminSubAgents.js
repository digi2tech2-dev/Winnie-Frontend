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
import {
  buildReferralInviteLink,
  normalizeReferralCommission,
  normalizeReferralPayout,
  normalizeReferredUser,
} from "./referrals";

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
  const override = agent.referralCommissionPercentOverride;
  const hasOverride = override !== undefined && override !== null;
  const effectivePercent = toNumber(agent.commissionPercentEffective ?? agent.commissionPercent, 0);
  const defaultPercent = toNumber(agent.defaultCommissionPercent, 1);
  const code = agent.code || agent.referralCode || "";
  return {
    ...agent,
    id,
    userId: agent.userId || id,
    active: agent.active !== false,
    approvedAt: agent.approvedAt || null,
    approvedAtLabel: agent.approvedAt ? formatDateTime(agent.approvedAt) : "",
    code,
    commissionPercent: effectivePercent,
    commissionPercentEffective: effectivePercent,
    commissionPercentLabel: hasOverride ? `Custom ${toNumber(override, 0)}%` : `Default ${defaultPercent}%`,
    defaultCommissionPercent: defaultPercent,
    email: agent.email || "",
    group: normalizeAdminGroup(agent.group),
    isSubAgent: agent.isSubAgent === true,
    name: agent.name || "User",
    referredUsersCount: toNumber(agent.referredUsersCount, 0),
    referralCommissionPercentOverride: hasOverride ? toNumber(override, 0) : null,
    referralLink: agent.referralLink || buildReferralInviteLink(code),
    status: agent.status || (agent.active ? "active" : "inactive"),
    totalPaidCommissions: normalizeTotals(agent.totalPaidCommissions),
    totalPendingCommissions: normalizeTotals(agent.totalPendingCommissions),
    usingDefaultCommission: agent.usingDefaultCommission !== false && !hasOverride,
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

export async function getReferralPayouts(token, query = {}) {
  const response = await apiRequest("/admin/referral-payouts", {
    token,
    query: compactObject(query),
  });
  const payouts = asArray(response.data?.payouts || response.data).map(normalizeReferralPayout);
  return {
    message: response.message,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit,
      total: payouts.length,
    }),
    payouts,
  };
}

export async function getReferralPayout(token, id) {
  const response = await apiRequest(`/admin/referral-payouts/${id}`, {
    token,
  });
  return {
    message: response.message,
    payout: normalizeReferralPayout(response.data?.payout || response.data || {}),
  };
}

export async function approveReferralPayoutWalletCredit(token, id) {
  const response = await apiRequest(`/admin/referral-payouts/${id}/approve-wallet-credit`, {
    method: "POST",
    token,
  });
  return {
    alreadyProcessed: response.data?.alreadyProcessed === true,
    message: response.message,
    payout: normalizeReferralPayout(response.data?.payout || response.data || {}),
  };
}

export async function markReferralPayoutPaid(token, id, payload = {}) {
  const response = await apiRequest(`/admin/referral-payouts/${id}/mark-paid`, {
    method: "POST",
    token,
    body: compactObject({
      adminNotes: payload.adminNotes || payload.adminNote,
    }),
  });
  return {
    alreadyProcessed: response.data?.alreadyProcessed === true,
    message: response.message,
    payout: normalizeReferralPayout(response.data?.payout || response.data || {}),
  };
}

export async function rejectReferralPayout(token, id, payload = {}) {
  const response = await apiRequest(`/admin/referral-payouts/${id}/reject`, {
    method: "POST",
    token,
    body: compactObject({
      reason: payload.reason || payload.rejectionReason,
      rejectionReason: payload.rejectionReason || payload.reason,
      adminNotes: payload.adminNotes || payload.adminNote,
    }),
  });
  return {
    alreadyProcessed: response.data?.alreadyProcessed === true,
    message: response.message,
    payout: normalizeReferralPayout(response.data?.payout || response.data || {}),
  };
}
