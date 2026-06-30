import { apiRequest } from "./client";
import { asArray, getItemId, resolveBackendAssetUrl, toNumber } from "./adapters";

export const PAYMENT_GATEWAYS = Object.freeze(["MOCK", "NETWORK_INTERNATIONAL", "ZIINA", "TAP"]);

function normalizeGateway(value) {
  const gateway = String(value || "").trim().toUpperCase();
  return PAYMENT_GATEWAYS.includes(gateway) ? gateway : "";
}

function normalizeCurrencyList(value, fallback) {
  const source = Array.isArray(value) ? value : [value || fallback];
  const codes = source
    .map((item) => String(item || "").trim().toUpperCase())
    .filter((item) => /^[A-Z]{3}$/.test(item));

  return [...new Set(codes.length ? codes : [String(fallback || "USD").toUpperCase()])];
}

function isFileLike(value) {
  return typeof File !== "undefined" && value instanceof File;
}

function isDataUrl(value) {
  return /^data:/i.test(String(value || ""));
}

export function generatePaymentSettingId(prefix = "pm") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizePaymentMethod(method = {}, group = {}, index = 0) {
  const id = getItemId(method, method.key || method.slug || `pm-${index + 1}`);
  const groupId = method.groupId || getItemId(group);
  const gateway = normalizeGateway(method.gateway || method.provider);
  const currencies = normalizeCurrencyList(method.currencies || method.currency, group.currency || "USD");
  const isActive = method.isActive !== false && method.active !== false;
  const account = method.account || method.accountNumber || method.walletNumber || method.iban || "";
  const bank = method.bank || method.network || (gateway ? gateway : "");
  const type = String(method.type || method.methodType || (gateway ? "ONLINE" : "MANUAL")).toUpperCase();
  const image = isDataUrl(method.image || method.icon) ? "" : (method.image || method.icon || method.logo || "");

  return {
    id,
    _id: method._id ?? id,
    account,
    active: isActive,
    bank,
    currency: currencies[0] || "USD",
    currencies,
    customerVisible: method.customerVisible !== false,
    description: method.description || method.instructions || "",
    fee: toNumber(method.fee ?? method.feePercentage, 0),
    gateway,
    groupId,
    image,
    imageUrl: resolveBackendAssetUrl(image) || image || "/logo.png",
    instructions: method.instructions || method.description || "",
    isActive,
    maxAmount: method.maxAmount === undefined || method.maxAmount === null ? null : toNumber(method.maxAmount, 0),
    minAmount: method.minAmount === undefined || method.minAmount === null ? null : toNumber(method.minAmount, 0),
    name: method.name || method.title || method.label || "Payment method",
    owner: method.owner || method.accountOwner || method.holderName || "",
    provider: method.provider || gateway || "",
    requiresReceipt: method.requiresReceipt !== false,
    sortOrder: toNumber(method.sortOrder ?? method.displayOrder, index),
    title: method.title || method.name || method.label || "Payment method",
    type,
  };
}

export function normalizePaymentGroup(group = {}, index = 0) {
  const id = getItemId(group, group.key || group.slug || `pay-${index + 1}`);
  const currency = String(group.currency || "USD").toUpperCase();
  const isActive = group.isActive !== false && group.active !== false;
  const image = isDataUrl(group.image || group.icon) ? "" : (group.image || group.icon || group.logo || "");
  const normalizedGroup = {
    id,
    _id: group._id ?? id,
    active: isActive,
    currency,
    description: group.description || "",
    image,
    imageUrl: resolveBackendAssetUrl(image) || image || "/logo.png",
    isActive,
    methods: [],
    name: group.name || group.title || "Payment group",
    sortOrder: toNumber(group.sortOrder ?? group.displayOrder, index),
  };

  normalizedGroup.methods = asArray(group.methods).map((method, methodIndex) =>
    normalizePaymentMethod(method, normalizedGroup, methodIndex),
  );

  return normalizedGroup;
}

export function normalizePaymentSettings(data = {}) {
  const instructions = data.instructions || data.paymentInstructions || "";
  const groups = asArray(data.paymentGroups || data.groups).map((group, index) => {
    const normalizedGroup = normalizePaymentGroup(group, index);
    normalizedGroup.methods = normalizedGroup.methods.map((method) => ({
      ...method,
      instructions: method.instructions || instructions,
    }));
    return normalizedGroup;
  });
  const methods = groups.flatMap((group) => group.methods);

  return {
    countryAccounts: asArray(data.countryAccounts || data.paymentCountryAccounts),
    groups,
    instructions,
    methods,
    paymentGroups: groups,
    whatsappNumber: data.whatsappNumber || "",
  };
}

export function getActiveCustomerMethods(settings = {}) {
  const normalized = settings.groups ? settings : normalizePaymentSettings(settings);
  return asArray(normalized.groups)
    .filter((group) => group.isActive !== false)
    .flatMap((group) =>
      asArray(group.methods)
        .filter((method) => method.isActive !== false && method.customerVisible !== false)
        .map((method) => ({
          ...method,
          description: method.description || group.description,
          groupCurrency: group.currency,
          groupName: group.name,
          title: method.title || method.name,
        })),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export function buildPaymentMethodSetting(method = {}) {
  const gateway = normalizeGateway(method.gateway);
  const currencies = normalizeCurrencyList(method.currencies || method.currency, method.currency || "USD");

  return {
    id: method.id || generatePaymentSettingId("pm"),
    account: method.account || "",
    bank: method.bank || "",
    currencies,
    currency: currencies[0] || "USD",
    customerVisible: method.customerVisible !== false,
    description: method.description || "",
    fee: toNumber(method.fee, 0),
    gateway,
    image: isDataUrl(method.image) ? "" : (method.image || ""),
    instructions: method.instructions || method.description || "",
    isActive: method.isActive ?? method.active ?? true,
    maxAmount: method.maxAmount === "" ? null : method.maxAmount ?? null,
    minAmount: method.minAmount === "" ? null : method.minAmount ?? null,
    name: method.name || method.title || "Payment method",
    owner: method.owner || "",
    provider: method.provider || gateway || "",
    requiresReceipt: method.requiresReceipt !== false,
    sortOrder: toNumber(method.sortOrder, 0),
    type: String(method.type || (gateway ? "ONLINE" : "MANUAL")).toUpperCase(),
  };
}

export function buildPaymentGroupSetting(group = {}) {
  return {
    id: group.id || generatePaymentSettingId("pay"),
    currency: String(group.currency || "USD").toUpperCase(),
    description: group.description || "",
    image: isDataUrl(group.image) ? "" : (group.image || ""),
    isActive: group.isActive ?? group.active ?? true,
    methods: asArray(group.methods).map(buildPaymentMethodSetting),
    name: group.name || "Payment group",
    sortOrder: toNumber(group.sortOrder, 0),
  };
}

export async function uploadPaymentImage(token, file) {
  if (!isFileLike(file)) return "";

  const formData = new FormData();
  formData.append("image", file);

  const response = await apiRequest("/upload/payments", {
    method: "POST",
    token,
    body: formData,
  });

  return response.data?.path || "";
}

export async function getPublicPaymentSettings() {
  const response = await apiRequest("/settings/payment");

  return {
    message: response.message,
    settings: normalizePaymentSettings(response.data || {}),
  };
}

export async function getCustomerPaymentMethods() {
  const result = await getPublicPaymentSettings();

  return {
    groups: result.settings.groups,
    methods: getActiveCustomerMethods(result.settings),
    settings: result.settings,
    message: result.message,
  };
}

export async function getCustomerPaymentMethod(methodId) {
  const result = await getCustomerPaymentMethods();
  const method = result.methods.find((item) => String(item.id) === String(methodId)) || null;

  return {
    ...result,
    method,
  };
}
