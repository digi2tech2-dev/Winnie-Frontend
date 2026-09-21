import { apiRequest, getApiBaseUrl } from "./client";

export function toCanonicalApiBaseUrl(value, relativeOrigin) {
  const apiBaseUrl = String(value || "").trim().replace(/\/+$/, "");
  const url = new URL(apiBaseUrl, relativeOrigin);
  const path = url.pathname.replace(/\/+$/, "");
  const originPath = path
    .replace(/\/api\/client(?:\/api)?$/i, "")
    .replace(/\/api$/i, "");

  url.pathname = `${originPath}/client/api`.replace(/\/+/g, "/");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/+$/, "");
}

export function getCanonicalApiBaseUrl() {
  const apiBaseUrl = getApiBaseUrl().replace(/\/+$/, "");
  const relativeOrigin = typeof window !== "undefined" ? window.location.origin : undefined;

  try {
    return toCanonicalApiBaseUrl(apiBaseUrl, relativeOrigin);
  } catch {
    return apiBaseUrl
      .replace(/\/api\/client(?:\/api)?$/i, "")
      .replace(/\/api$/i, "")
      .replace(/\/+$/, "") + "/client/api";
  }
}

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
    apiBaseUrl: getCanonicalApiBaseUrl(),
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
