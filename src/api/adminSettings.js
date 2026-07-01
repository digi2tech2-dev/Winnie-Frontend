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
  paymentRiskLimits: "paymentRiskLimits",
  providerRetryLimit: "providerRetryLimit",
  referrals: "referrals",
  whatsappNumber: "whatsappNumber",
});

export const DEFAULT_PAYMENT_RISK_LIMITS = Object.freeze({
  enabled: true,
  maxSingleAmount: 1000,
  hourlyAmountLimit: 1000,
  dailyAmountLimit: 1500,
  hourlyAttemptLimit: 3,
  dailyAttemptLimit: 5,
  newAccountHours: 24,
  newAccountSingleAmount: 100,
  newAccountDailyAmount: 200,
  action: "BLOCK_ONLINE_PAYMENT",
  customerMessage: "Your online top-up limit has been reached. Please use manual deposit or contact support.",
});

export const MANAGED_ADMIN_SETTING_KEYS = Object.freeze([
  ADMIN_SETTING_KEYS.maintenanceMode,
  ADMIN_SETTING_KEYS.orderTimeoutMinutes,
  ADMIN_SETTING_KEYS.providerRetryLimit,
  ADMIN_SETTING_KEYS.maxWalletAdjustment,
  ADMIN_SETTING_KEYS.defaultPaginationLimit,
  ADMIN_SETTING_KEYS.paymentInstructions,
  ADMIN_SETTING_KEYS.paymentRiskLimits,
  ADMIN_SETTING_KEYS.whatsappNumber,
]);

function toNonNegativeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

function toNonNegativeInteger(value, fallback = 0) {
  return Math.trunc(toNonNegativeNumber(value, fallback));
}

export function normalizePaymentRiskLimits(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const merged = { ...DEFAULT_PAYMENT_RISK_LIMITS, ...source };

  return {
    enabled: merged.enabled === true,
    maxSingleAmount: toNonNegativeNumber(merged.maxSingleAmount, DEFAULT_PAYMENT_RISK_LIMITS.maxSingleAmount),
    hourlyAmountLimit: toNonNegativeNumber(merged.hourlyAmountLimit, DEFAULT_PAYMENT_RISK_LIMITS.hourlyAmountLimit),
    dailyAmountLimit: toNonNegativeNumber(merged.dailyAmountLimit, DEFAULT_PAYMENT_RISK_LIMITS.dailyAmountLimit),
    hourlyAttemptLimit: toNonNegativeInteger(merged.hourlyAttemptLimit, DEFAULT_PAYMENT_RISK_LIMITS.hourlyAttemptLimit),
    dailyAttemptLimit: toNonNegativeInteger(merged.dailyAttemptLimit, DEFAULT_PAYMENT_RISK_LIMITS.dailyAttemptLimit),
    newAccountHours: toNonNegativeNumber(merged.newAccountHours, DEFAULT_PAYMENT_RISK_LIMITS.newAccountHours),
    newAccountSingleAmount: toNonNegativeNumber(merged.newAccountSingleAmount, DEFAULT_PAYMENT_RISK_LIMITS.newAccountSingleAmount),
    newAccountDailyAmount: toNonNegativeNumber(merged.newAccountDailyAmount, DEFAULT_PAYMENT_RISK_LIMITS.newAccountDailyAmount),
    action: "BLOCK_ONLINE_PAYMENT",
    customerMessage: String(merged.customerMessage || DEFAULT_PAYMENT_RISK_LIMITS.customerMessage).trim(),
  };
}

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

export async function getPaymentRiskLimits(token) {
  const response = await getAdminSetting(token, ADMIN_SETTING_KEYS.paymentRiskLimits);
  return {
    message: response.message,
    setting: response.setting,
    value: normalizePaymentRiskLimits(response.setting.value),
  };
}

export async function updatePaymentRiskLimits(token, payload) {
  const response = await updateAdminSetting(
    token,
    ADMIN_SETTING_KEYS.paymentRiskLimits,
    normalizePaymentRiskLimits(payload),
  );

  return {
    message: response.message,
    setting: response.setting,
    value: normalizePaymentRiskLimits(response.setting.value),
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
    paymentRiskLimits: values.paymentRiskLimits ? normalizePaymentRiskLimits(values.paymentRiskLimits) : undefined,
    providerRetryLimit: values.providerRetryLimit,
    whatsappNumber: values.whatsappNumber,
  });
}
