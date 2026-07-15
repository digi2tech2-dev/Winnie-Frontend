import { apiRequest } from "./client";
import { asArray, compactObject, getItemId, normalizePagination } from "./adapters";
import {
  GROUP_REQUEST_TYPES,
  normalizeGroupRequest,
} from "./groupRequests";

function normalizeUserSummary(user) {
  if (!user) return null;
  if (typeof user === "string") return { id: user, name: "User", email: "" };
  const id = getItemId(user);

  return {
    id,
    _id: user._id ?? id,
    email: user.email || "",
    isSubAgent: user.isSubAgent === true,
    name: user.name || "User",
    role: user.role || "",
    status: user.status || "",
    subAgentStatus: user.subAgentStatus || "NONE",
  };
}

export function normalizeAdminGroupRequest(request = {}) {
  const normalized = normalizeGroupRequest(request);

  return {
    ...normalized,
    metadata: request.metadata || null,
    reviewedBy: normalizeUserSummary(request.reviewedBy),
    user: normalizeUserSummary(request.user || request.userId),
  };
}

export async function getAdminGroupRequests(token, query = {}) {
  const response = await apiRequest("/admin/group-change-requests", {
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

export async function getAdminGroupRequest(token, id) {
  const response = await apiRequest(`/admin/group-change-requests/${id}`, { token });
  return {
    message: response.message,
    request: normalizeAdminGroupRequest(response.data?.request || response.data || {}),
  };
}

export async function approveGroupRequest(token, id, payload = {}) {
  const response = await apiRequest(`/admin/group-change-requests/${id}/approve`, {
    method: "PATCH",
    token,
    body: compactObject({
      approvedGroupId: payload.approvedGroupId,
      approvedCommissionPercent: payload.approvedCommissionPercent,
      adminNote: payload.adminNote,
    }),
  });

  return {
    alreadyProcessed: response.data?.alreadyProcessed === true,
    message: response.message,
    request: normalizeAdminGroupRequest(response.data?.request || response.data || {}),
  };
}

export async function rejectGroupRequest(token, id, payload = {}) {
  const response = await apiRequest(`/admin/group-change-requests/${id}/reject`, {
    method: "PATCH",
    token,
    body: compactObject({
      adminNote: payload.adminNote,
    }),
  });

  return {
    alreadyProcessed: response.data?.alreadyProcessed === true,
    message: response.message,
    request: normalizeAdminGroupRequest(response.data?.request || response.data || {}),
  };
}

export function getDefaultApprovedGroupId(request) {
  if (request?.requestType !== GROUP_REQUEST_TYPES.GROUP_CHANGE) return null;
  return request?.requestedGroup?.id || null;
}
