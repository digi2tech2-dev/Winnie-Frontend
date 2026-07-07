import { apiRequest, getApiBaseUrl } from "./client";

function compactPayload(payload) {
  return Object.entries(payload || {}).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) return acc;
    if (typeof value === "string" && value.trim() === "") return acc;
    acc[key] = typeof value === "string" ? value.trim() : value;
    return acc;
  }, {});
}

export async function login(credentials) {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: compactPayload({
      email: credentials?.email,
      password: credentials?.password,
    }),
  });

  return {
    ...(response.data || {}),
    message: response.data?.message || response.message,
  };
}

export async function register(payload) {
  const response = await apiRequest("/auth/register", {
    method: "POST",
    body: compactPayload({
      name: payload?.name,
      email: payload?.email,
      password: payload?.password,
      currency: payload?.currency,
      country: payload?.country,
      phone: payload?.phone,
      username: payload?.username,
      inviteCode: payload?.inviteCode,
      referralCode: payload?.referralCode,
    }),
  });

  return {
    ...(response.data || {}),
    message: response.data?.message || response.message,
  };
}

export async function verifyTwoFactor(payload) {
  const response = await apiRequest("/auth/verify-2fa", {
    method: "POST",
    body: compactPayload({
      otp: payload?.otp,
      tempToken: payload?.tempToken,
      requestId: payload?.requestId,
    }),
  });

  return {
    ...(response.data || {}),
    message: response.message,
  };
}

export function getGoogleLoginUrl() {
  return `${getApiBaseUrl()}/auth/google`;
}

export function logoutLocalOnly() {
  return { ok: true };
}
