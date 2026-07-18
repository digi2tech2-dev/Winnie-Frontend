import { apiRequest } from "./client";

export async function getAdminSecurityPinStatus(token) {
  const response = await apiRequest("/admin/security-pin/status", { token });
  return {
    configured: Boolean(response.data?.configured ?? response.raw?.configured),
  };
}

export async function verifyAdminSecurityPin(token, pin) {
  const response = await apiRequest("/admin/security-pin/verify", {
    method: "POST",
    token,
    body: { pin },
  });

  return {
    valid: response.data?.valid === true || response.raw?.valid === true,
  };
}

export async function updateAdminSecurityPin(token, payload) {
  const response = await apiRequest("/admin/security-pin", {
    method: "PATCH",
    token,
    body: payload,
  });

  return {
    success: response.data?.success === true || response.raw?.success === true,
    configured: response.data?.configured === true || response.raw?.configured === true,
  };
}
