import { apiRequest } from "./client";

export async function getAdminWhatsAppConfiguration(token) {
  const response = await apiRequest("/admin/whatsapp/status", { token });
  return {
    status: response.data?.status || {},
    settings: response.data?.settings || { eventPreferences: {} },
  };
}

export async function saveAdminWhatsAppSettings(token, { eventPreferences, providerBalanceThresholds }) {
  const response = await apiRequest("/admin/whatsapp/settings", {
    method: "PATCH",
    token,
    body: { eventPreferences, providerBalanceThresholds },
  });
  return response.data?.settings || response.data;
}

export async function reconnectAdminWhatsApp(token) {
  const response = await apiRequest("/admin/whatsapp/reconnect", { method: "POST", token });
  return response.data?.status || response.data;
}

export async function resetAdminWhatsApp(token) {
  const response = await apiRequest("/admin/whatsapp/reset", { method: "POST", token });
  return response.data?.status || response.data;
}
