import { apiRequest } from "./client";
import {
  asArray,
  compactObject,
  DEFAULT_CURRENCY,
  formatCurrency,
  formatDateTime,
  findPaginationMetadata,
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

function firstBoolean(...values) {
  return values.find((value) => typeof value === "boolean");
}

function toEntityId(value) {
  if (!value) return "";
  return typeof value === "object" ? getItemId(value) : String(value);
}

function normalizeSubAgentGroup(value, fallbackName = "") {
  if (!value) return null;
  if (typeof value === "object") return normalizeAdminGroup(value);

  const id = String(value);
  return normalizeAdminGroup({
    _id: id,
    name: fallbackName || "مجموعة غير معروفة",
  });
}

export function normalizeSubAgent(agent = {}) {
  const populatedUser = agent.user && typeof agent.user === "object"
    ? agent.user
    : agent.userId && typeof agent.userId === "object"
      ? agent.userId
      : {};
  const profile = agent.agentProfile && typeof agent.agentProfile === "object"
    ? agent.agentProfile
    : {};
  const userId = toEntityId(agent.userId) || getItemId(populatedUser) || getItemId(agent);
  const id = getItemId(agent) || userId;
  const override = agent.referralCommissionPercentOverride ?? profile.referralCommissionPercentOverride;
  const hasOverride = override !== undefined && override !== null;
  const effectivePercent = toNumber(
    agent.commissionPercentEffective
      ?? agent.commissionPercent
      ?? profile.commissionPercentEffective
      ?? profile.commissionPercent,
    0,
  );
  const defaultPercent = toNumber(agent.defaultCommissionPercent ?? profile.defaultCommissionPercent, 1);
  const code = agent.code || agent.referralCode || populatedUser.referralCode || "";
  const rawStatus = String(
    agent.status
      || profile.status
      || (firstBoolean(agent.active, agent.isActive, profile.active, profile.isActive) === false ? "inactive" : "active"),
  ).toLowerCase();
  const inactive = ["inactive", "disabled", "blocked", "suspended"].includes(rawStatus);
  const active = firstBoolean(agent.active, agent.isActive, profile.active, profile.isActive) ?? !inactive;
  const group = normalizeSubAgentGroup(
    agent.group || agent.groupId || populatedUser.group || populatedUser.groupId,
    agent.groupName || populatedUser.groupName,
  );

  return {
    ...agent,
    id,
    userId,
    active,
    approvedAt: agent.approvedAt || profile.approvedAt || null,
    approvedAtLabel: agent.approvedAt || profile.approvedAt ? formatDateTime(agent.approvedAt || profile.approvedAt) : "",
    code,
    commissionPercent: effectivePercent,
    commissionPercentEffective: effectivePercent,
    commissionPercentLabel: hasOverride ? `Custom ${toNumber(override, 0)}%` : `Default ${defaultPercent}%`,
    defaultCommissionPercent: defaultPercent,
    email: agent.email || populatedUser.email || "",
    group,
    isSubAgent: firstBoolean(agent.isSubAgent, populatedUser.isSubAgent, profile.isSubAgent) ?? true,
    name: agent.name || populatedUser.name || "User",
    referredUsersCount: toNumber(agent.referredUsersCount, 0),
    referralCommissionPercentOverride: hasOverride ? toNumber(override, 0) : null,
    referralLink: agent.referralLink || buildReferralInviteLink(code),
    status: active && !inactive ? "active" : "inactive",
    totalPaidCommissions: normalizeTotals(agent.totalPaidCommissions),
    totalPendingCommissions: normalizeTotals(agent.totalPendingCommissions),
    usingDefaultCommission: agent.usingDefaultCommission !== false && !hasOverride,
  };
}

function normalizePaginatedRows(response, rows, query = {}) {
  const metadata = findPaginationMetadata(response.raw) || response.pagination;
  const pagination = normalizePagination(metadata, {
    page: query.page,
    limit: query.limit,
    total: rows.length,
  });

  if (metadata || rows.length <= pagination.limit) {
    return { pagination, rows };
  }

  const page = Math.min(pagination.pages, Math.max(1, Number(query.page) || 1));
  const start = (page - 1) * pagination.limit;
  return {
    pagination: { ...pagination, page },
    rows: rows.slice(start, start + pagination.limit),
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
    pagination: normalizePagination(findPaginationMetadata(response.raw) || response.pagination, {
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
  const normalizedRows = asArray(response.data?.subAgents || response.data).map(normalizeSubAgent);
  const result = normalizePaginatedRows(response, normalizedRows, query);
  return {
    message: response.message,
    pagination: result.pagination,
    subAgents: result.rows,
  };
}

export async function updateSubAgent(token, userId, payload = {}) {
  const normalizedUserId = toEntityId(userId);
  if (!normalizedUserId) throw new Error("معرّف الوكيل الفرعي غير صالح.");

  const useDefault = payload.useDefault === true;
  const commissionPercent = toNumber(
    payload.commissionPercent ?? payload.referralCommissionPercentOverride,
    0,
  );
  const body = {
    groupId: toEntityId(payload.groupId) || undefined,
    status: payload.status,
    useDefault: typeof payload.useDefault === "boolean" ? payload.useDefault : undefined,
    commissionPercent: useDefault ? undefined : commissionPercent,
    referralCommissionPercentOverride: typeof payload.useDefault === "boolean"
      ? useDefault ? null : commissionPercent
      : payload.referralCommissionPercentOverride,
  };

  const response = await apiRequest(`/admin/sub-agents/${encodeURIComponent(normalizedUserId)}`, {
    method: "PATCH",
    token,
    body,
  });
  return {
    message: response.message,
    subAgent: normalizeSubAgent(response.data?.subAgent || response.data || {}),
  };
}

export async function getSubAgentReferredUsers(token, userId, query = {}) {
  const normalizedUserId = toEntityId(userId);
  const response = await apiRequest(`/admin/sub-agents/${encodeURIComponent(normalizedUserId)}/referred-users`, {
    token,
    query: compactObject(query),
  });
  const normalizedRows = asArray(response.data?.referredUsers || response.data).map(normalizeReferredUser);
  const result = normalizePaginatedRows(response, normalizedRows, query);
  return {
    message: response.message,
    pagination: result.pagination,
    referredUsers: result.rows,
  };
}

export async function getSubAgentCommissions(token, query = {}) {
  const response = await apiRequest("/admin/sub-agents/commissions", {
    token,
    query: compactObject(query),
  });
  const normalizedRows = asArray(response.data?.commissions || response.data).map(normalizeReferralCommission);
  const result = normalizePaginatedRows(response, normalizedRows, query);
  return {
    message: response.message,
    pagination: result.pagination,
    commissions: result.rows,
  };
}

export async function getReferralPayouts(token, query = {}) {
  const response = await apiRequest("/admin/referral-payouts", {
    token,
    query: compactObject(query),
  });
  const normalizedRows = asArray(response.data?.payouts || response.data).map(normalizeReferralPayout);
  const result = normalizePaginatedRows(response, normalizedRows, query);
  return {
    message: response.message,
    pagination: result.pagination,
    payouts: result.rows,
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
