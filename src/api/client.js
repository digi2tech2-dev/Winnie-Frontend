import { createApiError, normalizeApiError } from "./errors";

export const DEFAULT_API_BASE_URL = "http://localhost:5000/api";

const DEFAULT_GET_CACHE_TTL_MS = 15_000;
const MAX_CACHED_GET_REQUESTS = 150;
const inFlightGetRequests = new Map();
const getResponseCache = new Map();
let cacheGeneration = 0;

export function clearApiRequestCache() {
  cacheGeneration += 1;
  getResponseCache.clear();
  inFlightGetRequests.clear();
}

function getCachedResponse(cacheKey) {
  const cached = getResponseCache.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    getResponseCache.delete(cacheKey);
    return null;
  }

  return cached.value;
}

function cacheResponse(cacheKey, value, ttl) {
  if (ttl <= 0) return;

  if (getResponseCache.size >= MAX_CACHED_GET_REQUESTS) {
    const oldestKey = getResponseCache.keys().next().value;
    if (oldestKey) getResponseCache.delete(oldestKey);
  }

  getResponseCache.set(cacheKey, {
    expiresAt: Date.now() + ttl,
    value,
  });
}

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function normalizeEndpoint(endpoint) {
  return String(endpoint || "").replace(/^\/+/, "");
}

function appendQueryParams(url, query) {
  if (!query) return url;

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          url.searchParams.append(key, item);
        }
      });
      return;
    }
    url.searchParams.set(key, value);
  });

  return url;
}

function buildUrl(endpoint, query) {
  const url = new URL(`${getApiBaseUrl()}/${normalizeEndpoint(endpoint)}`);
  return appendQueryParams(url, query).toString();
}

function isFormDataBody(body) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function normalizeEnvelope(payload) {
  if (payload && typeof payload === "object" && "success" in payload) {
    return {
      success: Boolean(payload.success),
      message: payload.message || "",
      data: payload.data ?? null,
      pagination: payload.pagination || null,
      raw: payload,
    };
  }

  return {
    success: true,
    message: "",
    data: payload ?? null,
    pagination: null,
    raw: payload,
  };
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (response.status === 204) return null;

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

export async function apiRequest(endpoint, options = {}) {
  const {
    body,
    cacheTtl = DEFAULT_GET_CACHE_TTL_MS,
    dedupe = true,
    headers: customHeaders,
    method = body ? "POST" : "GET",
    query,
    quiet = false,
    signal,
    token,
  } = options;

  const normalizedMethod = String(method || "GET").toUpperCase();
  const requestUrl = buildUrl(endpoint, query);
  const headers = new Headers(customHeaders || {});
  const requestOptions = {
    cache: "no-store",
    method: normalizedMethod,
    headers,
    signal,
  };

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (body !== undefined && body !== null) {
    if (isFormDataBody(body)) {
      requestOptions.body = body;
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      requestOptions.body = JSON.stringify(body);
    }
  }

  const executeRequest = async () => {
    try {
      const response = await fetch(requestUrl, requestOptions);
      const payload = await parseResponse(response);

      if (!response.ok) {
        if (import.meta.env.DEV && !quiet) {
          console.debug("[api] request failed", {
            endpoint,
            method: normalizedMethod,
            status: response.status,
            response: payload,
          });
        }
        if (payload?.code === "IDENTITY_VERIFICATION_REQUIRED" && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("winnie:identity-verification-required", {
            detail: { support: payload.support || null, message: payload.message || "" },
          }));
        }
        throw createApiError({ response, payload });
      }

      const envelope = normalizeEnvelope(payload);
      if (!envelope.success) {
        throw createApiError({ response, payload });
      }

      if (normalizedMethod !== "GET") clearApiRequestCache();
      return envelope;
    } catch (error) {
      throw normalizeApiError(error);
    }
  };

  const canReuseGet = normalizedMethod === "GET" && body == null && !customHeaders;
  if (!canReuseGet) return executeRequest();

  const cacheKey = `${requestUrl}::${token || "anonymous"}`;
  const cachedResponse = getCachedResponse(cacheKey);
  if (cachedResponse) return cachedResponse;

  if (dedupe && !signal) {
    const inFlightRequest = inFlightGetRequests.get(cacheKey);
    if (inFlightRequest) return inFlightRequest;
  }

  const requestGeneration = cacheGeneration;
  const requestPromise = executeRequest().then((response) => {
    if (requestGeneration === cacheGeneration) {
      cacheResponse(cacheKey, response, Math.max(0, Number(cacheTtl) || 0));
    }
    return response;
  });

  if (!dedupe || signal) return requestPromise;

  inFlightGetRequests.set(cacheKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    if (inFlightGetRequests.get(cacheKey) === requestPromise) {
      inFlightGetRequests.delete(cacheKey);
    }
  }
}
