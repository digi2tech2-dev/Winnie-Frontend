import { createApiError, normalizeApiError } from "./errors";

export const DEFAULT_API_BASE_URL = "http://localhost:5000/api";

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
    headers: customHeaders,
    method = body ? "POST" : "GET",
    query,
    signal,
    token,
  } = options;

  const headers = new Headers(customHeaders || {});
  const requestOptions = {
    method,
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

  try {
    const response = await fetch(buildUrl(endpoint, query), requestOptions);
    const payload = await parseResponse(response);

    if (!response.ok) {
      if (import.meta.env.DEV) {
        console.error("[api] request failed", {
          endpoint,
          method,
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

    return envelope;
  } catch (error) {
    throw normalizeApiError(error);
  }
}
