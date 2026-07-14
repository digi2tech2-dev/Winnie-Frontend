import { apiRequest } from "./client";
import { asArray, normalizePagination } from "./adapters";

export function normalizeWhatsAppSettings(settings = {}) {
  return {
    enabled: settings.enabled === true,
    phone: settings.phone || "",
    phoneVerified: settings.phoneVerified === true,
    verifiedAt: settings.verifiedAt || null,
    inactiveReason: settings.inactiveReason || null,
    eventPreferences: {
      walletTopupCompleted: settings.eventPreferences?.walletTopupCompleted !== false,
      manualDepositApproved: settings.eventPreferences?.manualDepositApproved !== false,
      manualDepositRejected: settings.eventPreferences?.manualDepositRejected !== false,
      orderCreated: settings.eventPreferences?.orderCreated !== false,
      orderCompleted: settings.eventPreferences?.orderCompleted !== false,
      orderFailed: settings.eventPreferences?.orderFailed !== false,
      identityVerificationRequired: settings.eventPreferences?.identityVerificationRequired !== false,
      securityAlerts: settings.eventPreferences?.securityAlerts !== false,
    },
  };
}

export async function getMyWhatsAppSettings(token) {
  const response = await apiRequest("/me/whatsapp-notifications", { token });
  return {
    message: response.message,
    settings: normalizeWhatsAppSettings(response.data?.settings || response.data || {}),
  };
}

export async function updateMyWhatsAppSettings(token, payload) {
  const response = await apiRequest("/me/whatsapp-notifications", {
    method: "PATCH",
    token,
    body: payload,
  });
  return {
    message: response.message,
    settings: normalizeWhatsAppSettings(response.data?.settings || response.data || {}),
  };
}

export async function sendMyWhatsAppCode(token, phone) {
  return apiRequest("/me/whatsapp-notifications/send-code", {
    method: "POST",
    token,
    body: { phone },
  });
}

export async function verifyMyWhatsAppCode(token, code) {
  const response = await apiRequest("/me/whatsapp-notifications/verify", {
    method: "POST",
    token,
    body: { code },
  });
  return {
    message: response.message,
    settings: normalizeWhatsAppSettings(response.data?.settings || response.data || {}),
  };
}

export async function sendMyWhatsAppTest(token) {
  return apiRequest("/me/whatsapp-notifications/test", { method: "POST", token });
}

export async function getAdminWhatsAppStatus(token) {
  const response = await apiRequest("/admin/whatsapp/status", { token });
  return response.data?.status || response.data || {};
}

export async function getAdminWhatsAppRecipients(token) {
  const response = await apiRequest("/admin/whatsapp/recipients", { token });
  return asArray(response.data?.recipients || response.data);
}

export async function createAdminWhatsAppRecipient(token, payload) {
  const response = await apiRequest("/admin/whatsapp/recipients", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data?.recipient || response.data;
}

export async function updateAdminWhatsAppRecipient(token, id, payload) {
  const response = await apiRequest(`/admin/whatsapp/recipients/${id}`, {
    method: "PATCH",
    token,
    body: payload,
  });
  return response.data?.recipient || response.data;
}

export async function deleteAdminWhatsAppRecipient(token, id) {
  return apiRequest(`/admin/whatsapp/recipients/${id}`, { method: "DELETE", token });
}

export async function sendAdminWhatsAppRecipientTest(token, id) {
  return apiRequest(`/admin/whatsapp/recipients/${id}/test`, { method: "POST", token });
}

export async function getAdminWhatsAppLogs(token, query = {}) {
  const response = await apiRequest("/admin/whatsapp/logs", { token, query });
  return {
    logs: asArray(response.data),
    pagination: normalizePagination(response.pagination, { page: query.page, limit: query.limit }),
  };
}

export async function retryAdminWhatsAppLog(token, id) {
  return apiRequest(`/admin/whatsapp/retry/${id}`, { method: "POST", token });
}
