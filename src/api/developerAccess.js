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
    apiKey: String(source.apiKey || source.apiToken || source.token || source.key || ""),
    apiToken: String(source.apiKey || source.apiToken || source.token || source.key || ""),
    hasApiKey: source.hasApiKey === true,
    apiKeyPrefix: source.apiKeyPrefix || source.prefix || null,
    apiKeyLast4: source.apiKeyLast4 || source.last4 || null,
    createdAt: source.apiKeyCreatedAt || source.createdAt || source.issuedAt || null,
    lastRotatedAt: source.apiKeyLastRotatedAt || source.lastRotatedAt || source.rotatedAt || null,
    lastUsedAt: source.apiKeyLastUsedAt || source.lastUsedAt || null,
    revokedAt: source.apiKeyRevokedAt || source.revokedAt || null,
  };
}

export async function getMyDeveloperAccess(token) {
  const response = await apiRequest("/users/me/api-access", { token });
  return {
    message: response.message,
    access: normalizeDeveloperAccess(response.data || {}),
  };
}

export async function rotateMyDeveloperToken(token) {
  const response = await apiRequest("/users/me/api-access/regenerate", {
    method: "POST",
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
