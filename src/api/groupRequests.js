import { apiRequest } from "./client";
import {
  asArray,
  formatDateTime,
  getItemId,
  humanizeToken,
  normalizePagination,
  resolveBackendAssetUrl,
  toNumber,
} from "./adapters";

export const GROUP_REQUEST_TYPES = Object.freeze({
  GROUP_CHANGE: "GROUP_CHANGE",
  SUB_AGENT: "SUB_AGENT",
});

export const GROUP_REQUEST_STATUS = Object.freeze({
  APPROVED: "APPROVED",
  CANCELED: "CANCELED",
  PENDING: "PENDING",
  REJECTED: "REJECTED",
});

function compactPayload(payload = {}) {
  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) return acc;
    if (typeof value === "string" && value.trim() === "") return acc;
    acc[key] = typeof value === "string" ? value.trim() : value;
    return acc;
  }, {});
}

function buildGroupRequestBody(payload = {}) {
  if (payload.proofImageFile) {
    const formData = new FormData();
    const compacted = compactPayload({
      requestType: payload.requestType,
      requestedGroupId: payload.requestedGroupId,
      reason: payload.reason,
    });

    Object.entries(compacted).forEach(([key, value]) => formData.append(key, value));
    formData.append("proofImage", payload.proofImageFile);

    return formData;
  }

  return compactPayload({
    requestType: payload.requestType,
    requestedGroupId: payload.requestedGroupId,
    reason: payload.reason,
  });
}

export function normalizeGroupForRequest(group = null) {
  if (!group) return null;
  const id = getItemId(group);

  return {
    ...group,
    id,
    _id: group._id ?? id,
    isActive: group.isActive ?? null,
    name: group.name || "Group",
    percentage: group.percentage === null || group.percentage === undefined ? null : toNumber(group.percentage, 0),
  };
}

export function normalizeGroupChangeOption(group = null) {
  if (!group) return null;
  const id = getItemId(group);

  return {
    id,
    name: group.name || "Group",
    isCurrent: group.isCurrent === true,
  };
}

export function normalizeGroupChangeOptions(payload = {}) {
  const currentGroup = normalizeGroupChangeOption(payload.currentGroup);

  return {
    currentGroup,
    groups: asArray(payload.groups)
      .map(normalizeGroupChangeOption)
      .filter(Boolean),
  };
}

export function normalizeGroupRequest(request = {}) {
  const id = getItemId(request);
  const status = String(request.status || GROUP_REQUEST_STATUS.PENDING).toUpperCase();
  const requestType = String(request.requestType || GROUP_REQUEST_TYPES.GROUP_CHANGE).toUpperCase();

  return {
    ...request,
    id,
    _id: request._id ?? id,
    adminNote: request.adminNote || "",
    approvedGroup: normalizeGroupForRequest(request.approvedGroup),
    canceledAt: request.canceledAt || null,
    canceledAtLabel: request.canceledAt ? formatDateTime(request.canceledAt) : "",
    canCancel: status === GROUP_REQUEST_STATUS.PENDING,
    createdAt: request.createdAt || null,
    createdAtLabel: formatDateTime(request.createdAt),
    currentGroup: normalizeGroupForRequest(request.currentGroup),
    proofImageMimeType: request.proofImageMimeType || "",
    proofImageOriginalName: request.proofImageOriginalName || "",
    proofImagePath: request.proofImagePath || "",
    proofImageSize: request.proofImageSize ?? null,
    proofImageUrl: resolveBackendAssetUrl(request.proofImageUrl || request.proofImagePath) || "",
    reason: request.reason || "",
    requestedGroup: normalizeGroupForRequest(request.requestedGroup),
    requestType,
    requestTypeLabel: requestType === GROUP_REQUEST_TYPES.SUB_AGENT ? "Sub-agent" : "Group change",
    reviewedAt: request.reviewedAt || null,
    reviewedAtLabel: request.reviewedAt ? formatDateTime(request.reviewedAt) : "",
    status,
    statusLabel: humanizeToken(status, "Pending"),
  };
}

export async function getMyGroupRequests(token, query = {}) {
  const response = await apiRequest("/me/group-change-requests", {
    token,
    query,
  });

  const requests = asArray(response.data?.requests || response.data).map(normalizeGroupRequest);

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

export async function getMyGroupRequest(token, requestId) {
  const response = await apiRequest(`/me/group-change-requests/${requestId}`, { token });
  return normalizeGroupRequest(response.data?.request || response.data || {});
}

export async function getGroupChangeOptions(token) {
  const response = await apiRequest("/me/group-change-requests/options", { token });

  return {
    message: response.message,
    options: normalizeGroupChangeOptions(response.data || {}),
  };
}

export async function createGroupRequest(token, payload = {}) {
  const response = await apiRequest("/me/group-change-requests", {
    method: "POST",
    token,
    body: buildGroupRequestBody(payload),
  });

  return {
    message: response.message,
    request: normalizeGroupRequest(response.data?.request || response.data || {}),
  };
}

export async function createSubAgentRequest(token, payload = {}) {
  return createGroupRequest(token, {
    ...payload,
    requestType: GROUP_REQUEST_TYPES.SUB_AGENT,
  });
}

export async function cancelGroupRequest(token, requestId) {
  const response = await apiRequest(`/me/group-change-requests/${requestId}/cancel`, {
    method: "POST",
    token,
  });

  return {
    message: response.message,
    request: normalizeGroupRequest(response.data?.request || response.data || {}),
  };
}
