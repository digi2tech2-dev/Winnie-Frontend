import { apiRequest, getApiBaseUrl } from "./client";

function getAccessSource(value = {}) {
  return {
    ...value,
    ...(value.user || {}),
    ...(value.apiAccess || value.developerAccess || {}),
  };
}

export function normalizeDeveloperAccess(value = {}) {
  const source = getAccessSource(value);
  const enabled = source.enabled === true
    || source.isEnabled === true
    || source.isApiEnabled === true
    || source.apiAccessEnabled === true
    || value.apiAccessEnabled === true;

  return {
    enabled,
    apiBaseUrl: String(source.apiBaseUrl || source.baseUrl || `${getApiBaseUrl().replace(/\/+$/, "")}/client`).replace(/\/+$/, ""),
    apiToken: String(source.apiToken || source.token || source.key || ""),
    createdAt: source.createdAt || source.issuedAt || null,
    lastRotatedAt: source.lastRotatedAt || source.rotatedAt || null,
    lastUsedAt: source.lastUsedAt || null,
  };
}

export async function getMyDeveloperAccess(token) {
  const response = await apiRequest("/users/me", { token });
  return {
    message: response.message,
    access: normalizeDeveloperAccess(response.data || {}),
  };
}

export async function rotateMyDeveloperToken(token) {
  const response = await apiRequest("/users/me/api-token", {
    method: "PATCH",
    token,
  });

  const access = normalizeDeveloperAccess(response.data || {});
  return {
    message: response.message,
    access: {
      ...access,
      lastRotatedAt: access.lastRotatedAt || new Date().toISOString(),
    },
  };
}
