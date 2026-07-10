import { apiRequest } from "./client";
import {
  DEFAULT_CURRENCY,
  asArray,
  compactObject,
  formatCurrency,
  formatDateTime,
  getItemId,
  humanizeToken,
  normalizePagination,
  toNumber,
} from "./adapters";
import { formatSupplierPrice, toDecimalString } from "./adminProducts";

function toId(value) {
  if (!value) return "";
  if (typeof value === "object") return getItemId(value);
  return String(value);
}

function normalizeFeatureList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeProviderStatus(provider = {}) {
  if (provider.deletedAt) return "deleted";
  return provider.isActive === false ? "inactive" : "active";
}

function getProviderFromResponse(data) {
  return data?.provider || data || {};
}

function extractBalanceAmount(balance) {
  if (typeof balance === "number") return balance;
  if (typeof balance === "string") {
    const parsed = Number(balance.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (!balance || typeof balance !== "object") return null;

  const keys = ["balance", "Balance", "amount", "Amount", "credit", "Credit", "funds", "Funds"];
  for (const key of keys) {
    if (balance[key] !== undefined && balance[key] !== null) {
      return extractBalanceAmount(balance[key]);
    }
  }

  return null;
}

function getBalanceCurrency(balance) {
  if (!balance || typeof balance !== "object") return DEFAULT_CURRENCY;
  return String(balance.currency || balance.Currency || balance.code || DEFAULT_CURRENCY).toUpperCase();
}

export function normalizeAdminProvider(provider = {}) {
  const id = getItemId(provider);
  const status = normalizeProviderStatus(provider);
  const supportedFeatures = normalizeFeatureList(provider.supportedFeatures);

  return {
    id,
    _id: provider._id ?? id,
    active: status === "active",
    apiUrl: provider.baseUrl || "",
    authType: String(provider.authType || "NONE").toUpperCase(),
    baseUrl: provider.baseUrl || "",
    code: provider.slug || id,
    connection: "unknown",
    createdAt: provider.createdAt || null,
    createdAtLabel: provider.createdAt ? formatDateTime(provider.createdAt, "ar-EG-u-nu-latn") : "-",
    credentialConfigured: Boolean(provider.credentialConfigured || provider.credentialsConfigured),
    credentialsConfigured: Boolean(provider.credentialConfigured || provider.credentialsConfigured),
    deletedAt: provider.deletedAt || null,
    displayName: provider.name || "Provider",
    hasApiKey: Boolean(provider.hasApiKey),
    hasApiToken: Boolean(provider.hasApiToken),
    hasPassword: Boolean(provider.hasPassword),
    hasUsername: Boolean(provider.hasUsername),
    integrationType: String(provider.integrationType || provider.providerType || "API").toUpperCase(),
    isActive: status === "active",
    lastSync: provider.updatedAt ? formatDateTime(provider.updatedAt, "ar-EG-u-nu-latn") : "No backend timestamp",
    name: provider.name || "Provider",
    slug: provider.slug || "",
    status,
    statusLabel: humanizeToken(status, "Unknown"),
    supportedFeatures,
    supportedFeaturesLabel: supportedFeatures.length ? supportedFeatures.join(", ") : "Not returned",
    syncInterval: toNumber(provider.syncInterval, 60),
    updatedAt: provider.updatedAt || null,
    updatedAtLabel: provider.updatedAt ? formatDateTime(provider.updatedAt, "ar-EG-u-nu-latn") : "-",
  };
}

export function normalizeAdminProviderProduct(product = {}, index = 0) {
  const id = getItemId(product, `provider-product-${index}`);
  const provider = product.provider && typeof product.provider === "object" ? product.provider : null;
  const providerId = toId(product.provider);
  const name = product.translatedName || product.rawName || product.name || "Provider product";
  const rawPrice = product.rawPrice ?? product.price ?? null;
  const currency = String(product.currency || DEFAULT_CURRENCY).toUpperCase();
  const active = product.isActive !== false;

  return {
    id,
    _id: product._id ?? id,
    active,
    code: product.externalProductId || id,
    createdAt: product.createdAt || null,
    currency,
    externalProductId: product.externalProductId || "",
    isActive: active,
    lastSyncedAt: product.lastSyncedAt || null,
    lastSyncedAtLabel: product.lastSyncedAt ? formatDateTime(product.lastSyncedAt, "ar-EG-u-nu-latn") : "-",
    max: toNumber(product.maxQty ?? product.max, 1),
    maxQty: toNumber(product.maxQty ?? product.max, 1),
    min: toNumber(product.minQty ?? product.min, 1),
    minQty: toNumber(product.minQty ?? product.min, 1),
    name,
    price: toDecimalString(rawPrice),
    priceLabel: rawPrice === null ? "Not returned" : formatSupplierPrice(rawPrice, currency),
    providerId,
    providerName: provider?.name || "",
    rawName: product.rawName || "",
    status: active ? "available" : "unavailable",
    statusLabel: active ? "Available" : "Unavailable",
    supplierId: providerId,
    translatedName: product.translatedName || "",
    updatedAt: product.updatedAt || null,
  };
}

export function normalizeProviderBalance(data = {}) {
  const balance = data.balance;
  const amount = extractBalanceAmount(balance);
  const currency = getBalanceCurrency(balance);

  return {
    amount,
    amountLabel: amount === null ? "Balance returned without numeric amount" : formatCurrency(amount, currency, "ar-EG-u-nu-latn"),
    currency,
    message: data.message || "",
    provider: data.provider || "",
    checkedAt: new Date().toISOString(),
    checkedAtLabel: formatDateTime(new Date().toISOString(), "ar-EG-u-nu-latn"),
  };
}

export function normalizeProviderConnectionTest(data = {}) {
  return {
    connected: data.success === true,
    latencyMs: data.latencyMs === undefined ? null : toNumber(data.latencyMs, 0),
    message: data.message || (data.success ? "Connection successful" : "Connection failed"),
    provider: data.provider || "",
    testedAt: data.testedAt || new Date().toISOString(),
    testedAtLabel: formatDateTime(data.testedAt || new Date().toISOString(), "ar-EG-u-nu-latn"),
  };
}

export function normalizeProviderOrderCheck(data = {}) {
  return {
    dlq: Boolean(data.dlq),
    dlqReason: data.dlqReason || "",
    errorMessage: data.errorMessage || "",
    message: data.message || data.errorMessage || "",
    orderId: data.orderId || "",
    provider: data.provider || "",
    providerOrderId: data.providerOrderId || "",
    providerStatus: data.providerStatus || "",
    unifiedStatus: data.unifiedStatus || "",
    checkedAt: new Date().toISOString(),
    checkedAtLabel: formatDateTime(new Date().toISOString(), "ar-EG-u-nu-latn"),
  };
}

export function normalizeProviderSyncResult(data = {}) {
  return {
    deactivated: toNumber(data.deactivated, 0),
    errors: Array.isArray(data.errors) ? data.errors : [],
    pricesSynced: toNumber(data.pricesSynced, 0),
    providerId: String(data.providerId || ""),
    syncedAt: data.syncedAt || new Date().toISOString(),
    totalFetched: toNumber(data.totalFetched, 0),
    updated: toNumber(data.updated, 0),
    upserted: toNumber(data.upserted, 0),
  };
}

function buildProviderPayload(values = {}, { includeBlankToken = false } = {}) {
  const features = normalizeFeatureList(values.supportedFeaturesText ?? values.supportedFeatures);
  const apiToken = String(values.apiToken ?? values.credential ?? "").trim();
  const apiKey = String(values.apiKey ?? "").trim();
  const bearerToken = String(values.bearerToken ?? "").trim();
  const username = String(values.username ?? "").trim();
  const password = String(values.password ?? "").trim();
  const authType = String(values.authType || "NONE").toUpperCase();
  const credentials = {};

  if (authType === "API_KEY") {
    credentials.apiKey = apiKey || (includeBlankToken ? "" : undefined);
  } else if (authType === "BEARER_TOKEN") {
    credentials.apiToken = bearerToken || apiToken || (includeBlankToken ? "" : undefined);
  } else if (authType === "USERNAME_PASSWORD") {
    credentials.username = username || (includeBlankToken ? "" : undefined);
    credentials.password = password || (includeBlankToken ? "" : undefined);
  }

  return compactObject({
    authType,
    name: values.name,
    slug: values.slug || values.code,
    baseUrl: values.baseUrl || values.apiUrl,
    integrationType: values.integrationType || values.providerType,
    providerType: values.providerType,
    ...credentials,
    isActive: values.isActive ?? values.active,
    syncInterval: values.syncInterval,
    supportedFeatures: features,
  });
}

export async function getAdminProviders(token, query = {}) {
  const response = await apiRequest("/admin/providers", {
    query: compactObject({
      includeInactive: query.includeInactive === false ? "false" : "true",
    }),
    token,
  });
  const providers = asArray(response.data?.providers ?? response.data).map(normalizeAdminProvider);

  return {
    message: response.message,
    providers,
  };
}

export async function getAdminProvider(token, id) {
  const response = await apiRequest(`/admin/providers/${id}`, { token });
  return {
    message: response.message,
    provider: normalizeAdminProvider(getProviderFromResponse(response.data)),
  };
}

export async function createAdminProvider(token, values = {}) {
  const response = await apiRequest("/admin/providers", {
    body: buildProviderPayload(values),
    token,
  });

  return {
    message: response.message,
    provider: normalizeAdminProvider(getProviderFromResponse(response.data)),
  };
}

export async function updateAdminProvider(token, id, values = {}) {
  const response = await apiRequest(`/admin/providers/${id}`, {
    body: buildProviderPayload(values),
    method: "PATCH",
    token,
  });

  return {
    message: response.message,
    provider: normalizeAdminProvider(getProviderFromResponse(response.data)),
  };
}

export async function toggleAdminProvider(token, id) {
  const response = await apiRequest(`/admin/providers/${id}/toggle`, {
    method: "PATCH",
    token,
  });

  return {
    message: response.message,
    provider: normalizeAdminProvider(getProviderFromResponse(response.data)),
  };
}

export async function deleteAdminProvider(token, id) {
  const response = await apiRequest(`/admin/providers/${id}`, {
    method: "DELETE",
    token,
  });

  return {
    message: response.message,
    provider: normalizeAdminProvider(getProviderFromResponse(response.data)),
  };
}

export async function testAdminProvider(token, id) {
  const response = await apiRequest(`/admin/providers/${id}/test-connection`, {
    method: "POST",
    token,
  });

  return {
    message: response.message,
    result: normalizeProviderConnectionTest(response.data || {}),
  };
}

export async function getAdminProviderBalance(token, id) {
  const response = await apiRequest(`/admin/providers/${id}/balance`, { token });
  return {
    balance: normalizeProviderBalance(response.data || {}),
    message: response.message,
  };
}

export async function checkAdminProviderOrder(token, id, orderId) {
  const response = await apiRequest(`/admin/providers/${id}/check-order`, {
    query: compactObject({ orderId }),
    token,
  });

  return {
    message: response.message,
    result: normalizeProviderOrderCheck(response.data || {}),
  };
}

export async function getAdminProviderProducts(token, providerId, query = {}) {
  const endpoint = providerId ? `/admin/provider-products/${providerId}` : "/admin/provider-products";
  const response = await apiRequest(endpoint, {
    query: compactObject({
      page: query.page || 1,
      limit: query.limit || 50,
      search: query.search,
      includeInactive: query.includeInactive ? "true" : undefined,
      isActive: query.isActive,
      providerId: providerId ? undefined : query.providerId,
    }),
    token,
  });
  const products = asArray(response.data).map(normalizeAdminProviderProduct);

  return {
    message: response.message,
    pagination: normalizePagination(response.pagination, {
      page: query.page || 1,
      limit: query.limit || 50,
      total: products.length,
    }),
    products,
  };
}

export async function syncAdminProviderProducts(token, id) {
  const response = await apiRequest(`/admin/catalog/sync/${id}`, {
    method: "POST",
    token,
  });

  return {
    message: response.message,
    result: normalizeProviderSyncResult(response.data || {}),
  };
}
