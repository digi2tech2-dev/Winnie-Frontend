import { apiRequest } from "./client";
import { asArray, compactObject, formatDateTime, getItemId } from "./adapters";

export const ADMIN_SETTING_KEYS = Object.freeze({
  defaultPaginationLimit: "defaultPaginationLimit",
  maintenanceMode: "maintenanceMode",
  maxWalletAdjustment: "maxWalletAdjustment",
  orderTimeoutMinutes: "orderTimeoutMinutes",
  paymentCountryAccounts: "paymentCountryAccounts",
  paymentGroups: "paymentGroups",
  paymentInstructions: "paymentInstructions",
  providerRetryLimit: "providerRetryLimit",
  referrals: "referrals",
  whatsappNumber: "whatsappNumber",
});

export const MANAGED_ADMIN_SETTING_KEYS = Object.freeze([
  ADMIN_SETTING_KEYS.maintenanceMode,
  ADMIN_SETTING_KEYS.orderTimeoutMinutes,
  ADMIN_SETTING_KEYS.providerRetryLimit,
  ADMIN_SETTING_KEYS.maxWalletAdjustment,
  ADMIN_SETTING_KEYS.defaultPaginationLimit,
  ADMIN_SETTING_KEYS.paymentInstructions,
  ADMIN_SETTING_KEYS.whatsappNumber,
]);

export function normalizeSetting(setting = {}) {
  const id = getItemId(setting, setting.key);

  return {
    ...setting,
    id,
    _id: setting._id ?? id,
    description: setting.description || "",
    key: setting.key || "",
    updatedAt: setting.updatedAt || null,
    updatedAtLabel: setting.updatedAt ? formatDateTime(setting.updatedAt, "ar-EG-u-nu-latn") : "-",
    updatedBy: setting.updatedBy || null,
    value: setting.value,
  };
}

export function settingsToMap(settings = []) {
  return asArray(settings).reduce((acc, setting) => {
    const normalized = normalizeSetting(setting);
    if (normalized.key) acc[normalized.key] = normalized;
    return acc;
  }, {});
}

export async function getAdminSettings(token) {
  const response = await apiRequest("/admin/settings", { token });
  const settings = asArray(response.data?.settings || response.data).map(normalizeSetting);

  return {
    message: response.message,
    settings,
    settingsByKey: settingsToMap(settings),
  };
}

export async function getAdminSetting(token, key) {
  const response = await apiRequest(`/admin/settings/${encodeURIComponent(key)}`, { token });
  const setting = normalizeSetting(response.data?.setting || response.data || {});

  return {
    message: response.message,
    setting,
  };
}

export async function updateAdminSetting(token, key, value) {
  const response = await apiRequest(`/admin/settings/${encodeURIComponent(key)}`, {
    method: "PATCH",
    token,
    body: { value },
  });

  return {
    message: response.message,
    setting: normalizeSetting(response.data?.setting || response.data || {}),
  };
}

export async function updateManagedAdminSetting(token, key, value) {
  if (!MANAGED_ADMIN_SETTING_KEYS.includes(key)) {
    throw new Error(`Setting '${key}' is not managed by this frontend screen.`);
  }

  return updateAdminSetting(token, key, value);
}

export function buildManagedSettingsPayload(values = {}) {
  return compactObject({
    defaultPaginationLimit: values.defaultPaginationLimit,
    maintenanceMode: values.maintenanceMode,
    maxWalletAdjustment: values.maxWalletAdjustment,
    orderTimeoutMinutes: values.orderTimeoutMinutes,
    paymentInstructions: values.paymentInstructions,
    providerRetryLimit: values.providerRetryLimit,
    whatsappNumber: values.whatsappNumber,
  });
}
