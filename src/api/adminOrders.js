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

const statusToUi = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELED: "canceled",
  CANCELLED: "canceled",
  PARTIAL: "partial",
  MANUAL_REVIEW: "manual_review",
};

const statusToBackend = {
  pending: "PENDING",
  processing: "PROCESSING",
  completed: "COMPLETED",
  failed: "FAILED",
  canceled: "CANCELED",
  cancelled: "CANCELED",
  partial: "PARTIAL",
  manual_review: "MANUAL_REVIEW",
};

function normalizeBackendStatus(status) {
  const value = String(status || "PENDING").trim().toUpperCase();
  if (value === "CANCELLED") return "CANCELED";
  return value || "PENDING";
}

export function normalizeOrderStatus(status) {
  return statusToUi[normalizeBackendStatus(status)] || String(status || "pending").toLowerCase();
}

function toBackendStatus(status) {
  if (!status || status === "all") return undefined;
  const normalized = String(status).trim();
  return statusToBackend[normalized] || normalized.toUpperCase();
}

function normalizeUserSummary(user) {
  if (!user) return null;
  if (typeof user === "string") return { id: user, name: "User", email: "", walletBalance: null };

  const id = getItemId(user);
  return {
    id,
    _id: user._id ?? id,
    email: user.email || "",
    name: user.name || user.username || "User",
    walletBalance: user.walletBalance === undefined ? null : toNumber(user.walletBalance, 0),
  };
}

function normalizeProductSummary(product) {
  if (!product) return null;
  if (typeof product === "string") return { id: product, name: "Product", executionType: "manual" };

  const id = getItemId(product);
  return {
    id,
    _id: product._id ?? id,
    basePrice: product.basePrice ?? product.finalPrice ?? null,
    executionType: product.executionType || "manual",
    maxQty: product.maxQty ?? null,
    minQty: product.minQty ?? null,
    name: product.name || "Product",
    provider: product.provider || null,
  };
}

function normalizeProviderSummary(order = {}, product = {}) {
  const provider = order.provider || product?.provider || null;
  if (provider && typeof provider === "object") {
    return {
      id: getItemId(provider),
      code: provider.slug || provider.code || order.providerCode || "",
      name: provider.name || provider.slug || order.providerCode || "Provider",
    };
  }

  const providerId = typeof provider === "string" ? provider : "";
  const code = order.providerCode || "";
  return {
    id: providerId,
    code,
    name: code ? humanizeToken(code, "Provider") : providerId || "Manual/unknown",
  };
}

function stringifyFieldValue(value) {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function normalizeSubmittedFields(customerInput) {
  const values = customerInput?.values && typeof customerInput.values === "object" ? customerInput.values : {};
  const snapshots = Array.isArray(customerInput?.fieldsSnapshot) ? customerInput.fieldsSnapshot : [];
  const snapshotByKey = new Map(
    snapshots.map((field) => [String(field.key || field.name || "").trim(), field]),
  );

  return Object.entries(values).map(([key, value]) => {
    const field = snapshotByKey.get(key) || {};
    return {
      key,
      label: field.label || humanizeToken(key, key),
      type: field.type || "text",
      value,
      valueLabel: stringifyFieldValue(value),
    };
  });
}

function pickSubmittedIdentifier(fields = []) {
  const priority = ["playerId", "player_id", "uid", "userId", "username", "target", "link"];
  for (const key of priority) {
    const field = fields.find((item) => item.key === key);
    if (field?.valueLabel && field.valueLabel !== "-") return field.valueLabel;
  }
  return fields.find((field) => field.valueLabel && field.valueLabel !== "-")?.valueLabel || "-";
}

function buildTimeline(order = {}) {
  return [
    ["Created", order.createdAt],
    ["Updated", order.updatedAt],
    ["Last provider check", order.lastCheckedAt],
    ["Failed", order.failedAt],
    ["Refunded", order.refundedAt],
  ]
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => ({ label, value, valueLabel: formatDateTime(value, "ar-EG-u-nu-latn") }));
}

function buildActionAvailability(order = {}, backendStatus) {
  const refunded = order.refunded === true || Boolean(order.refundedAt);
  const hasProviderOrder = Boolean(order.providerOrderId);

  return {
    complete: {
      enabled: backendStatus !== "COMPLETED",
      reason: backendStatus === "COMPLETED" ? "Order is already completed." : "",
    },
    refund: {
      enabled: !refunded && backendStatus !== "COMPLETED",
      reason: refunded
        ? "Backend reports this order is already refunded."
        : backendStatus === "COMPLETED"
          ? "Completed-order refunds are not enabled in this UI."
          : "",
    },
    retry: {
      enabled: backendStatus === "FAILED",
      reason: backendStatus === "FAILED" ? "" : "Backend retry only accepts FAILED orders.",
    },
    sync: {
      enabled: hasProviderOrder,
      reason: hasProviderOrder ? "" : "No provider order id was returned for this order.",
    },
  };
}

export function normalizeAdminOrder(order = {}) {
  const id = getItemId(order);
  const backendStatus = normalizeBackendStatus(order.status);
  const status = normalizeOrderStatus(backendStatus);
  const product = normalizeProductSummary(order.productId || order.product);
  const user = normalizeUserSummary(order.userId || order.user || order.customer);
  const provider = normalizeProviderSummary(order, product);
  const currency = String(order.currency || DEFAULT_CURRENCY).toUpperCase();
  const amount = toNumber(order.chargedAmount ?? order.totalPrice ?? order.usdAmount ?? order.walletDeducted, 0);
  const unitPrice = toNumber(order.finalPriceCharged ?? order.unitPrice ?? product?.basePrice, 0);
  const fields = normalizeSubmittedFields(order.customerInput);
  const submittedFieldsSummary = fields.length
    ? fields.slice(0, 3).map((field) => `${field.label}: ${field.valueLabel}`).join(" | ")
    : "No submitted fields returned";
  const displayId = order.orderNumber ? `#${order.orderNumber}` : id;
  const executionType = String(order.executionType || product?.executionType || "manual").toLowerCase();
  const providerStatusLabel = order.providerStatus || humanizeToken(backendStatus, "Pending");
  const lastCheckedAtLabel = order.lastCheckedAt ? formatDateTime(order.lastCheckedAt, "ar-EG-u-nu-latn") : "";

  return {
    id,
    _id: order._id ?? id,
    actionAvailability: buildActionAvailability(order, backendStatus),
    amount,
    amountLabel: formatCurrency(amount, currency, "ar-EG-u-nu-latn"),
    backendStatus,
    chargedAmount: order.chargedAmount === undefined ? null : toNumber(order.chargedAmount, 0),
    createdAt: order.createdAt || null,
    createdAtLabel: order.createdAt ? formatDateTime(order.createdAt, "ar-EG-u-nu-latn") : "-",
    creditUsedAmount: toNumber(order.creditUsedAmount, 0),
    currency,
    displayId,
    executionType,
    failedAt: order.failedAt || null,
    failedAtLabel: order.failedAt ? formatDateTime(order.failedAt, "ar-EG-u-nu-latn") : "-",
    orderNumber: order.orderNumber || "",
    playerId: pickSubmittedIdentifier(fields),
    price: amount,
    priceLabel: formatCurrency(amount, currency, "ar-EG-u-nu-latn"),
    product: product?.name || "Product",
    productId: product?.id || "",
    productImage: "/logo.png",
    productSummary: product,
    provider: provider.name,
    providerCode: provider.code || order.providerCode || "",
    providerId: provider.id || "",
    providerOrderId: order.providerOrderId || "-",
    providerStatus: order.providerStatus || "",
    providerStatusLabel,
    quantity: toNumber(order.quantity, 1),
    refunded: order.refunded === true,
    refundedAt: order.refundedAt || null,
    refundedAtLabel: order.refundedAt ? formatDateTime(order.refundedAt, "ar-EG-u-nu-latn") : "-",
    rejectionReason: order.rejectionReason || "",
    remains: toNumber(order.remains, 0),
    retryCount: toNumber(order.retryCount, 0),
    status,
    statusLabel: humanizeToken(status, "Pending"),
    submittedFields: fields,
    submittedFieldsSummary,
    supplier: provider.name,
    supplierSync: lastCheckedAtLabel ? `Last checked ${lastCheckedAtLabel}` : "No provider sync timestamp",
    timeline: buildTimeline(order),
    totalPrice: order.totalPrice ?? null,
    unitPrice,
    unitPriceLabel: formatCurrency(unitPrice, currency, "ar-EG-u-nu-latn"),
    updatedAt: order.updatedAt || null,
    updatedAtLabel: order.updatedAt ? formatDateTime(order.updatedAt, "ar-EG-u-nu-latn") : "-",
    usdAmount: order.usdAmount ?? null,
    user,
    userEmail: user?.email || "",
    userId: user?.id || "",
    username: user?.name || "User",
    walletDeducted: toNumber(order.walletDeducted, 0),
    walletDeductedLabel: formatCurrency(order.walletDeducted, currency, "ar-EG-u-nu-latn"),
  };
}

export function normalizeAdminOrderItem(order = {}) {
  return normalizeAdminOrder(order);
}

function getOrderFromResponseData(data) {
  return data?.order || data || {};
}

export async function getAdminOrders(token, query = {}) {
  const response = await apiRequest("/admin/orders", {
    token,
    query: compactObject({
      page: query.page,
      limit: query.limit,
      search: query.search ?? query.query,
      status: toBackendStatus(query.status),
      userId: query.userId,
      from: query.from,
      to: query.to,
    }),
  });
  const orders = asArray(response.data).map(normalizeAdminOrderItem);

  return {
    message: response.message,
    orders,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit,
      total: orders.length,
    }),
  };
}

export async function getAdminOrder(token, id) {
  const response = await apiRequest(`/admin/orders/${id}`, { token });
  return {
    message: response.message,
    order: normalizeAdminOrder(getOrderFromResponseData(response.data)),
  };
}

export async function updateAdminOrderStatus(token, id, payload = {}) {
  const response = await apiRequest(`/admin/orders/${id}/status`, {
    method: "PATCH",
    token,
    body: compactObject({
      status: payload.status,
      rejectionReason: payload.rejectionReason,
    }),
  });

  return {
    message: response.message,
    order: normalizeAdminOrder(getOrderFromResponseData(response.data)),
  };
}

export async function markAdminOrderManualSuccess(token, id) {
  const response = await apiRequest(`/admin/orders/${id}/complete`, {
    method: "POST",
    token,
  });

  return {
    message: response.message,
    order: normalizeAdminOrder(getOrderFromResponseData(response.data)),
  };
}

export async function markAdminOrderManualFail(token, id, payload = {}) {
  return refundAdminOrder(token, id, payload);
}

export async function refundAdminOrder(token, id, payload = {}) {
  if (payload.rejectionReason) {
    return updateAdminOrderStatus(token, id, {
      status: "failed",
      rejectionReason: payload.rejectionReason,
    });
  }

  const response = await apiRequest(`/admin/orders/${id}/refund`, {
    method: "POST",
    token,
  });

  return {
    message: response.message,
    order: normalizeAdminOrder(getOrderFromResponseData(response.data)),
  };
}

export async function retryAdminOrder(token, id) {
  const response = await apiRequest(`/admin/orders/${id}/retry`, {
    method: "POST",
    token,
  });

  return {
    message: response.message,
    order: normalizeAdminOrder(getOrderFromResponseData(response.data)),
  };
}

export async function syncAdminOrder(token, id) {
  const response = await apiRequest(`/admin/orders/${id}/sync-status`, {
    method: "POST",
    token,
  });

  return {
    message: response.message,
    order: normalizeAdminOrder(getOrderFromResponseData(response.data)),
  };
}
