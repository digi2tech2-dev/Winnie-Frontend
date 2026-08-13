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
  const value = provider || {};
  if (value.deletedAt) return "deleted";
  return value.isActive === false ? "inactive" : "active";
}

const FAZERCARDS_FAMILIES = [
  "TOPUPS",
  "GIFTCARDS",
  "GAME_KEYS",
  "TELEGRAM",
  "STEAM_TOPUP",
  "MANUAL_SERVICES",
  "STEAM_GIFTS",
];

function normalizeCountBucket(value = {}) {
  return {
    blocked: toNumber(value.blocked, 0),
    imported: toNumber(value.imported, 0),
    supported: toNumber(value.supported, 0),
    total: toNumber(value.total, 0),
  };
}

function normalizeFazerCardsContract(contract = {}) {
  const value = contract || {};
  return {
    blockers: asArray(value.blockers),
    canCustomerPurchase: value.canCustomerPurchase === true,
    canDryRun: value.canDryRun === true,
    canImportDraft: value.canImportDraft === true,
    canLivePilot: value.canLivePilot === true,
    catalogStatus: value.catalogStatus || "",
    customerDeliveryStrategy: value.customerDeliveryStrategy || "",
    customerInputSchema: value.customerInputSchema || { fields: [] },
    displayName: value.displayName || humanizeToken(value.familyKey, "Family"),
    executionStage: value.executionStage || "",
    expectedResponseSchema: value.expectedResponseSchema || {},
    familyKey: value.familyKey || "",
    fulfillmentMode: value.fulfillmentMode || "",
    providerPayloadSchema: value.providerPayloadSchema || {},
    requiredCapabilities: asArray(value.requiredCapabilities),
    riskLevel: value.riskLevel || "",
    storageStrategy: value.storageStrategy || "",
    supportStage: value.supportStage || "",
    warnings: asArray(value.warnings),
  };
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
  provider = provider || {};
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
    providerCode: String(provider.providerCode || "").toUpperCase(),
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
  product = product || {};
  const id = getItemId(product, `provider-product-${index}`);
  const provider = product.provider && typeof product.provider === "object" ? product.provider : null;
  const providerId = toId(product.provider);
  const name = product.translatedName || product.rawName || product.name || "Provider product";
  const rawPrice = product.rawPrice ?? product.price ?? null;
  const requiredFields = asArray(product.requiredFields);
  const importedProduct = product.importedProduct && typeof product.importedProduct === "object" ? product.importedProduct : null;
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
    blockReason: product.blockReason || "",
    category: product.category || "",
    categoryName: product.categoryName || product.category || "",
    costPrice: toDecimalString(product.costPrice ?? rawPrice),
    costPriceLabel: formatSupplierPrice(product.costPrice ?? rawPrice, currency),
    executionBlocked: Boolean(product.executionBlocked),
    familyKey: product.familyKey || "",
    fulfillmentMode: product.fulfillmentMode || "",
    imported: Boolean(product.imported),
    importedProduct: importedProduct ? {
      id: toId(importedProduct.id || importedProduct._id),
      isActive: importedProduct.isActive !== false,
      name: importedProduct.name || "",
      status: importedProduct.status || "",
      visibleInStore: importedProduct.visibleInStore !== false,
    } : null,
    isActive: active,
    isBlocked: Boolean(product.isBlocked),
    isSupported: Boolean(product.isSupported),
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
    requiredFields,
    requiredFieldsLabel: requiredFields.length ? requiredFields.map((field) => field.label || field.key).join(", ") : "No fields",
    offerId: product.offerId || "",
    offerName: product.offerName || "",
    platform: product.platform || "",
    region: product.region || "",
    stock: product.stock ?? null,
    stockLabel: product.stock === undefined || product.stock === null ? "Unknown" : String(product.stock),
    supportLevel: product.supportLevel || "",
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

export function normalizeFazerCardsImportPreview(preview = {}) {
  preview = preview || {};
  return {
    blockReason: preview.blockReason || "",
    costPrice: preview.costPrice ?? "",
    currency: String(preview.currency || DEFAULT_CURRENCY).toUpperCase(),
    executionBlocked: Boolean(preview.executionBlocked),
    externalProductId: preview.externalProductId || "",
    familyKey: preview.familyKey || "",
    fulfillmentMode: preview.fulfillmentMode || "",
    maxQty: toNumber(preview.maxQty, 1),
    minQty: toNumber(preview.minQty, 1),
    platform: preview.platform || "",
    providerProductId: preview.providerProductId || "",
    providerProductName: preview.providerProductName || "",
    region: preview.region || "",
    requiredFields: asArray(preview.requiredFields),
    suggestedOrderFields: asArray(preview.suggestedOrderFields),
    suggestedProductName: preview.suggestedProductName || preview.providerProductName || "",
    supportLevel: preview.supportLevel || "",
    stock: preview.stock ?? null,
    warning: preview.warning || "",
  };
}

function normalizeImportedProduct(product = {}) {
  const value = product?.product && typeof product.product === "object" ? product.product : product;
  const safeValue = value || {};
  const id = toId(safeValue);
  return {
    id,
    _id: safeValue._id ?? id,
    basePrice: safeValue.basePrice === undefined || safeValue.basePrice === null ? "" : String(safeValue.basePrice),
    currency: String(safeValue.currency || DEFAULT_CURRENCY).toUpperCase(),
    executionType: safeValue.executionType || "",
    externalProductId: safeValue.externalProductId || "",
    familyKey: safeValue.familyKey || "",
    fulfillmentMode: safeValue.fulfillmentMode || "",
    isActive: safeValue.isActive !== false,
    name: safeValue.name || "",
    providerBlockReason: safeValue.providerBlockReason || "",
    providerExecutionBlocked: Boolean(safeValue.providerExecutionBlocked),
    providerExecutionEnabled: safeValue.providerExecutionEnabled !== false,
    status: safeValue.status || "",
    visibleInStore: safeValue.visibleInStore !== false,
  };
}

export function normalizeXenaStatus(data = {}) {
  return {
    displayName: data.displayName || "",
    lastCheckedAt: data.lastCheckedAt || null,
    lastCheckedAtLabel: data.lastCheckedAt ? formatDateTime(data.lastCheckedAt, "ar-EG-u-nu-latn") : "-",
    lastErrorCode: data.lastErrorCode || "",
    lastErrorMessage: data.lastErrorMessage || "",
    maskedUsername: data.maskedUsername || "",
    needsReconnect: Boolean(data.needsReconnect),
    status: data.status || "unknown",
    tokenExpiresAt: data.tokenExpiresAt || null,
    tokenExpiresAtLabel: data.tokenExpiresAt ? formatDateTime(data.tokenExpiresAt, "ar-EG-u-nu-latn") : "-",
  };
}

export function normalizeXenaBalance(data = {}) {
  const value = data.balance;
  const balance = value === undefined || value === null || typeof value === "object" ? "" : String(value);
  const checkedAt = data.checkedAt || new Date().toISOString();

  return {
    balance,
    checkedAt,
    checkedAtLabel: formatDateTime(checkedAt, "ar-EG-u-nu-latn"),
    currency: data.currency || null,
    requestId: data.requestId || "",
    source: data.source || "xena_live",
  };
}

export function normalizeXenaProductConfig(data = {}) {
  return {
    externalProductId: data.externalProductId || "xena-dynamic-recharge",
    isActive: data.isActive !== false,
    maxAmount: data.maxAmount ?? "",
    minAmount: data.minAmount ?? "",
    name: data.name || "Xena Dynamic Recharge (Any Amount)",
    orderField: data.orderField || {
      key: "target_uid",
      label: "Xena ID",
      required: true,
      type: "text",
    },
    providerUnitPrice: data.providerUnitPrice === undefined || data.providerUnitPrice === null
      ? ""
      : String(data.providerUnitPrice),
  };
}

export function normalizeXenaTargetVerification(data = {}) {
  const user = data.user && typeof data.user === "object" ? data.user : {};
  return {
    targetUid: data.targetUid === undefined || data.targetUid === null ? "" : String(data.targetUid),
    valid: data.valid === true,
    user: data.valid === true ? {
      avatar: user.avatar || null,
      country: user.country || null,
      nickname: user.nickname || "",
      uid: user.uid === undefined || user.uid === null ? "" : String(user.uid),
    } : null,
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

export async function getFazerCardsProviderProducts(token, query = {}) {
  const response = await apiRequest("/admin/providers/fazercards/provider-products", {
    query: compactObject({
      page: query.page || 1,
      limit: query.limit || 50,
      search: query.search,
      category: query.category,
      supported: query.supported,
      blocked: query.blocked,
      imported: query.imported,
      fulfillmentMode: query.fulfillmentMode,
      familyKey: query.familyKey,
      supportLevel: query.supportLevel,
      blockReason: query.blockReason,
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

export async function getFazerCardsCatalogFamilies(token) {
  const response = await apiRequest("/admin/providers/fazercards/catalog/families", { token });
  const families = asArray(response.data?.families ?? response.data).map((family) => ({
    catalogAvailable: family.catalogAvailable !== false,
    catalogEndpoints: asArray(family.catalogEndpoints),
    displayName: family.displayName || humanizeToken(family.familyKey, "Family"),
    executionAvailable: family.executionAvailable === true,
    executionEnabled: family.executionEnabled === true,
    executionGloballyGated: family.executionGloballyGated === true,
    familyKey: family.familyKey || "",
    fulfillmentMode: family.fulfillmentMode || "",
    status: family.status || "",
    supportLevel: family.supportLevel || "",
    warning: family.warning || "",
  }));

  return {
    families,
    message: response.message,
  };
}

export async function getFazerCardsCatalogSummary(token) {
  const response = await apiRequest("/admin/providers/fazercards/catalog/summary", { token });
  const byFamily = response.data?.byFamily || {};
  const normalized = {};
  FAZERCARDS_FAMILIES.forEach((familyKey) => {
    normalized[familyKey] = normalizeCountBucket(byFamily[familyKey]);
  });
  Object.entries(byFamily).forEach(([familyKey, value]) => {
    if (!normalized[familyKey]) normalized[familyKey] = normalizeCountBucket(value);
  });

  return {
    byFamily: normalized,
    message: response.message,
    nextRecommendedFamilies: asArray(response.data?.nextRecommendedFamilies),
    totalProviderProducts: toNumber(response.data?.totalProviderProducts, 0),
  };
}

export async function getFazerCardsContracts(token) {
  const response = await apiRequest("/admin/providers/fazercards/contracts", { token });
  return {
    contracts: asArray(response.data?.contracts ?? response.data).map(normalizeFazerCardsContract),
    message: response.message,
  };
}

export async function getFazerCardsContract(token, familyKey) {
  const response = await apiRequest(`/admin/providers/fazercards/contracts/${encodeURIComponent(familyKey)}`, { token });
  return {
    contract: normalizeFazerCardsContract(response.data?.contract || response.data || {}),
    message: response.message,
  };
}

export async function getFazerCardsContractsSummary(token) {
  const response = await apiRequest("/admin/providers/fazercards/contracts/summary", { token });
  const families = {};
  Object.entries(response.data?.families || {}).forEach(([familyKey, value]) => {
    families[familyKey] = {
      blockers: asArray(value.blockers),
      canCustomerPurchase: value.canCustomerPurchase === true,
      canDryRun: value.canDryRun === true,
      canImportDraft: value.canImportDraft === true,
      canLivePilot: value.canLivePilot === true,
      executionStage: value.executionStage || "",
      supportStage: value.supportStage || "",
    };
  });

  return {
    families,
    message: response.message,
    nextBestExecutionOrder: asArray(response.data?.nextBestExecutionOrder),
  };
}

export async function syncFazerCardsCatalogFamily(token, payload = {}) {
  const response = await apiRequest("/admin/providers/fazercards/catalog/sync-family", {
    body: compactObject({
      cursor: payload.cursor,
      family: payload.family,
      limit: payload.limit,
    }),
    method: "POST",
    token,
  });

  return {
    message: response.message,
    result: response.data || {},
  };
}

export async function syncFazerCardsCatalogAll(token, payload = {}) {
  const response = await apiRequest("/admin/providers/fazercards/catalog/sync-all", {
    body: compactObject({
      cursors: payload.cursors,
      families: payload.families,
      includeSteamGifts: payload.includeSteamGifts,
      limit: payload.limit,
      limits: payload.limits,
    }),
    method: "POST",
    token,
  });

  return {
    message: response.message,
    result: response.data || {},
  };
}

export async function getFazerCardsCatalogSyncStatus(token) {
  const response = await apiRequest("/admin/providers/fazercards/catalog/sync-status", { token });
  return {
    message: response.message,
    status: response.data || {},
  };
}

export async function getFazerCardsLaunchHealth(token) {
  const response = await apiRequest("/admin/providers/fazercards/launch-health", { token });
  return {
    health: response.data || {},
    message: response.message,
  };
}

export async function getFazerCardsManualOrders(token, query = {}) {
  const response = await apiRequest("/admin/providers/fazercards/orders/manual", {
    query: compactObject({
      familyKey: query.familyKey,
      fulfillmentMode: query.fulfillmentMode,
      from: query.from,
      limit: query.limit || 20,
      page: query.page || 1,
      productId: query.productId,
      status: query.status,
      to: query.to,
      userId: query.userId,
    }),
    token,
  });

  return {
    manualOrders: asArray(response.data),
    message: response.message,
    pagination: normalizePagination(response.pagination, {
      page: query.page || 1,
      limit: query.limit || 20,
      total: asArray(response.data).length,
    }),
  };
}

export async function getFazerCardsManualOrder(token, orderId) {
  const response = await apiRequest(`/admin/providers/fazercards/orders/${encodeURIComponent(orderId)}/manual`, { token });
  return {
    message: response.message,
    order: response.data?.order || response.data || {},
  };
}

export async function completeFazerCardsManualOrder(token, orderId, payload = {}) {
  const response = await apiRequest(`/admin/providers/fazercards/orders/${encodeURIComponent(orderId)}/manual/complete`, {
    body: compactObject({
      adminNote: payload.adminNote,
      proof: payload.proof,
      deliveredCodes: payload.deliveredCodes,
    }),
    method: "POST",
    token,
  });
  return {
    message: response.message,
    result: response.data || {},
  };
}

export async function failFazerCardsManualOrder(token, orderId, payload = {}) {
  const response = await apiRequest(`/admin/providers/fazercards/orders/${encodeURIComponent(orderId)}/manual/fail`, {
    body: compactObject({
      reason: payload.reason,
      refund: payload.refund,
    }),
    method: "POST",
    token,
  });
  return {
    message: response.message,
    result: response.data || {},
  };
}

export async function addFazerCardsManualOrderNote(token, orderId, payload = {}) {
  const response = await apiRequest(`/admin/providers/fazercards/orders/${encodeURIComponent(orderId)}/manual/note`, {
    body: compactObject({
      adminNote: payload.adminNote,
      proof: payload.proof,
    }),
    method: "POST",
    token,
  });
  return {
    message: response.message,
    result: response.data || {},
  };
}

export async function bulkUpdateFazerCardsLaunch(token, payload = {}) {
  const response = await apiRequest("/admin/providers/fazercards/products/bulk-update-launch", {
    body: compactObject({
      customerPurchaseEnabled: payload.customerPurchaseEnabled,
      dryRun: payload.dryRun,
      isActive: payload.isActive,
      productIds: payload.productIds,
      providerBlockReason: payload.providerBlockReason,
      providerExecutionBlocked: payload.providerExecutionBlocked,
      providerExecutionMode: payload.providerExecutionMode,
      status: payload.status,
      visibleInStore: payload.visibleInStore,
    }),
    method: "POST",
    token,
  });
  return {
    message: response.message,
    result: response.data || {},
  };
}

export async function getFazerCardsProductReadiness(token, productId) {
  const response = await apiRequest(`/admin/providers/fazercards/products/${productId}/readiness`, { token });
  return {
    message: response.message,
    readiness: response.data || {},
  };
}

export async function dryRunFazerCardsProduct(token, productId, payload = {}) {
  const response = await apiRequest(`/admin/providers/fazercards/products/${productId}/dry-run`, {
    body: compactObject({
      fields: payload.fields || {},
      orderId: payload.orderId,
      quantity: payload.quantity,
    }),
    method: "POST",
    token,
  });

  return {
    dryRun: response.data || {},
    message: response.message,
  };
}

export async function getFazerCardsImportPreview(token, providerProductId) {
  const response = await apiRequest(`/admin/providers/fazercards/provider-products/${providerProductId}/import-preview`, { token });
  return {
    message: response.message,
    preview: normalizeFazerCardsImportPreview(response.data?.preview || response.data || {}),
  };
}

export async function importFazerCardsProviderProduct(token, providerProductId, payload = {}) {
  const sellPrice = payload.sellPrice === "" || payload.sellPrice === undefined || payload.sellPrice === null
    ? undefined
    : Number(payload.sellPrice);

  const response = await apiRequest(`/admin/providers/fazercards/provider-products/${providerProductId}/import`, {
    body: compactObject({
      categoryId: payload.categoryId,
      currency: payload.currency,
      description: payload.description,
      image: payload.image,
      name: payload.name,
      sellPrice,
      syncAvailabilityFromProvider: payload.syncAvailabilityFromProvider,
      syncNameFromProvider: payload.syncNameFromProvider,
      syncPriceFromProvider: payload.syncPriceFromProvider,
      updateExisting: payload.updateExisting,
    }),
    method: "POST",
    token,
  });

  return {
    action: response.data?.action || "created",
    message: response.message,
    preview: normalizeFazerCardsImportPreview(response.data?.preview || {}),
    product: normalizeImportedProduct(response.data?.product || {}),
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

export async function getXenaStatus(token, providerId) {
  const response = await apiRequest(`/admin/providers/${providerId}/xena/status`, { token });
  return {
    message: response.message,
    status: normalizeXenaStatus(response.data || {}),
  };
}

export async function challengeXena(token, providerId, payload = {}) {
  const response = await apiRequest(`/admin/providers/${providerId}/xena/challenge`, {
    body: {
      displayName: payload.displayName,
      password: payload.password,
      username: payload.username,
    },
    method: "POST",
    token,
  });
  return {
    message: response.message,
    status: normalizeXenaStatus(response.data || {}),
  };
}

export async function reconnectXena(token, providerId, payload = {}) {
  const response = await apiRequest(`/admin/providers/${providerId}/xena/reconnect`, {
    body: {
      displayName: payload.displayName,
      password: payload.password,
      username: payload.username,
    },
    method: "POST",
    token,
  });
  return {
    message: response.message,
    status: normalizeXenaStatus(response.data || {}),
  };
}

export async function verifyXenaOtp(token, providerId, code) {
  const response = await apiRequest(`/admin/providers/${providerId}/xena/verify`, {
    body: { code },
    method: "POST",
    token,
  });
  return {
    message: response.message,
    status: normalizeXenaStatus(response.data || {}),
  };
}

export async function refreshXenaBalance(token, providerId) {
  const response = await apiRequest(`/admin/providers/${providerId}/xena/balance/refresh`, {
    method: "POST",
    token,
  });
  return {
    balance: normalizeXenaBalance(response.data || {}),
    message: response.message,
  };
}

export async function getXenaProductConfig(token, providerId) {
  const response = await apiRequest(`/admin/providers/${providerId}/xena/product-config`, { token });
  return {
    config: normalizeXenaProductConfig(response.data || {}),
    message: response.message,
  };
}

export async function updateXenaProductConfig(token, providerId, payload = {}) {
  const response = await apiRequest(`/admin/providers/${providerId}/xena/product-config`, {
    body: {
      isActive: payload.isActive,
      maxAmount: payload.maxAmount,
      minAmount: payload.minAmount,
      name: payload.name,
      providerUnitPrice: payload.providerUnitPrice,
    },
    method: "PATCH",
    token,
  });
  return {
    config: normalizeXenaProductConfig(response.data || {}),
    message: response.message,
  };
}

export async function syncXenaProduct(token, providerId) {
  const response = await apiRequest(`/admin/providers/${providerId}/xena/sync-product`, {
    method: "POST",
    token,
  });
  return {
    message: response.message,
    result: response.data || {},
  };
}

export async function adminVerifyXenaTarget(token, providerId, targetUid) {
  const response = await apiRequest(`/admin/providers/${providerId}/xena/verify-target`, {
    body: { targetUid },
    method: "POST",
    token,
  });
  return {
    message: response.message,
    verification: normalizeXenaTargetVerification(response.data || {}),
  };
}
