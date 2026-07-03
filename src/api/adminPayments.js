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

const NETWORK_GATEWAY = "NETWORK_INTERNATIONAL";
const syncableStatuses = new Set(["INITIATED", "PENDING", "REQUIRES_ACTION"]);

function normalizeStatus(status) {
  return String(status || "PENDING").trim().toUpperCase() || "PENDING";
}

function toBackendFilter(value) {
  const text = String(value || "").trim();
  if (!text || text === "all") return undefined;
  return text.toUpperCase();
}

export function normalizePaymentUserSummary(user) {
  if (!user) return null;
  if (typeof user === "string") return { id: user, name: "User", email: "", phone: "" };

  const id = getItemId(user);
  return {
    id,
    _id: user._id ?? id,
    email: user.email || "",
    name: user.name || user.username || "User",
    phone: user.phone || "",
  };
}

export function normalizePaymentGatewayCharge(payment = {}) {
  const metadata = payment.metadata || {};
  const conversion = metadata.gatewayCurrencyConversion || {};
  const requestedCurrency = String(
    payment.requestedCurrency || conversion.requestedCurrency || payment.currency || DEFAULT_CURRENCY,
  ).toUpperCase();
  const requestedAmount = toNumber(
    payment.requestedAmount ?? conversion.requestedAmount ?? payment.amount ?? payment.totalAmount,
    0,
  );
  const gatewayCurrencyValue = payment.gatewayCurrency || conversion.gatewayCurrency;
  const gatewayAmountValue = payment.gatewayAmount ?? conversion.gatewayAmount;
  const hasGatewayCharge = gatewayCurrencyValue && gatewayAmountValue !== undefined && gatewayAmountValue !== null;
  const gatewayCurrency = hasGatewayCharge ? String(gatewayCurrencyValue).toUpperCase() : "";
  const gatewayAmount = hasGatewayCharge ? toNumber(gatewayAmountValue, 0) : null;

  return {
    exchangeRate: payment.exchangeRate ?? conversion.exchangeRate ?? null,
    exchangeRateSource: payment.exchangeRateSource || conversion.exchangeRateSource || "",
    gatewayAmount,
    gatewayAmountLabel: hasGatewayCharge ? formatCurrency(gatewayAmount, gatewayCurrency, "ar-EG-u-nu-latn") : "-",
    gatewayCurrency,
    hasGatewayCharge: Boolean(hasGatewayCharge),
    requestedAmount,
    requestedAmountLabel: formatCurrency(requestedAmount, requestedCurrency, "ar-EG-u-nu-latn"),
    requestedCurrency,
  };
}

function normalizeWebhookEvent(event = {}) {
  const id = getItemId(event);
  const providerStatus = event.providerStatus || "";
  const processingStatus = event.processingStatus || event.status || "";

  return {
    id,
    _id: event._id ?? id,
    dedupeKey: event.dedupeKey || "",
    errorCode: event.errorCode || "",
    errorMessage: event.errorMessage || "",
    eventId: event.eventId || "",
    processedAt: event.processedAt || null,
    processedAtLabel: event.processedAt ? formatDateTime(event.processedAt, "ar-EG-u-nu-latn") : "-",
    processingStatus,
    processingStatusLabel: humanizeToken(processingStatus, "Received"),
    providerStatus,
    providerStatusLabel: providerStatus ? humanizeToken(providerStatus, providerStatus) : "-",
    receivedAt: event.receivedAt || null,
    receivedAtLabel: event.receivedAt ? formatDateTime(event.receivedAt, "ar-EG-u-nu-latn") : "-",
    status: event.status || "",
  };
}

function normalizeRiskSummary(payment = {}) {
  const risk = payment.metadata?.risk || {};
  const baseCurrency = String(risk.baseCurrency || "").toUpperCase();
  const amountBaseCurrency = risk.amountBaseCurrency === undefined ? null : toNumber(risk.amountBaseCurrency, 0);

  return {
    amountBaseCurrency,
    amountBaseCurrencyLabel: amountBaseCurrency === null || !baseCurrency
      ? "-"
      : formatCurrency(amountBaseCurrency, baseCurrency, "ar-EG-u-nu-latn"),
    baseCurrency,
    evaluatedAt: risk.evaluatedAt || null,
    evaluatedAtLabel: risk.evaluatedAt ? formatDateTime(risk.evaluatedAt, "ar-EG-u-nu-latn") : "-",
    hasRiskSnapshot: Boolean(risk.baseCurrency || risk.amountBaseCurrency !== undefined || risk.evaluatedAt),
  };
}

export function normalizeAdminPayment(payment = {}) {
  const id = getItemId(payment);
  const status = normalizeStatus(payment.status);
  const currency = String(payment.currency || DEFAULT_CURRENCY).toUpperCase();
  const amount = toNumber(payment.amount ?? payment.totalAmount, 0);
  const totalAmount = toNumber(payment.totalAmount ?? amount, amount);
  const feeAmount = toNumber(payment.feeAmount, 0);
  const user = normalizePaymentUserSummary(payment.user || payment.userId);
  const charge = normalizePaymentGatewayCharge(payment);
  const credited = Boolean(payment.creditedAt || payment.walletTransactionId);
  const gateway = String(payment.gateway || "").toUpperCase();

  return {
    ...payment,
    ...charge,
    id,
    _id: payment._id ?? id,
    amount,
    amountLabel: formatCurrency(amount, currency, "ar-EG-u-nu-latn"),
    canceledAtLabel: payment.canceledAt ? formatDateTime(payment.canceledAt, "ar-EG-u-nu-latn") : "-",
    canSync: gateway === NETWORK_GATEWAY && syncableStatuses.has(status),
    createdAtLabel: payment.createdAt ? formatDateTime(payment.createdAt, "ar-EG-u-nu-latn") : "-",
    credited,
    creditedAtLabel: payment.creditedAt ? formatDateTime(payment.creditedAt, "ar-EG-u-nu-latn") : "-",
    currency,
    displayId: id ? `#${id.slice(-8)}` : "#payment",
    failedAtLabel: payment.failedAt ? formatDateTime(payment.failedAt, "ar-EG-u-nu-latn") : "-",
    feeAmount,
    feeAmountLabel: formatCurrency(feeAmount, currency, "ar-EG-u-nu-latn"),
    gateway,
    gatewayLabel: humanizeToken(gateway, "Gateway"),
    method: payment.method || "CARD",
    purpose: payment.purpose || "WALLET_TOPUP",
    risk: normalizeRiskSummary(payment),
    status,
    statusLabel: humanizeToken(status, "Pending"),
    succeededAtLabel: payment.succeededAt ? formatDateTime(payment.succeededAt, "ar-EG-u-nu-latn") : "-",
    totalAmount,
    totalAmountLabel: formatCurrency(totalAmount, currency, "ar-EG-u-nu-latn"),
    updatedAtLabel: payment.updatedAt ? formatDateTime(payment.updatedAt, "ar-EG-u-nu-latn") : "-",
    user,
    userEmail: user?.email || "",
    userId: user?.id || (typeof payment.userId === "string" ? payment.userId : ""),
    userName: user?.name || "User",
    webhookEvents: asArray(payment.webhookEvents).map(normalizeWebhookEvent),
  };
}

function getPaymentFromResponse(data) {
  return data?.payment || data || {};
}

export async function getAdminPayments(token, query = {}) {
  const response = await apiRequest("/admin/payments", {
    token,
    query: compactObject({
      page: query.page,
      limit: query.limit,
      status: toBackendFilter(query.status),
      gateway: toBackendFilter(query.gateway),
      userId: query.userId,
      purpose: toBackendFilter(query.purpose),
      credited: query.credited === "all" ? undefined : query.credited,
      from: query.from ?? query.dateFrom,
      to: query.to ?? query.dateTo,
    }),
  });

  const payments = asArray(response.data?.payments || response.data).map(normalizeAdminPayment);

  return {
    message: response.message,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit,
      total: payments.length,
    }),
    payments,
  };
}

export async function getAdminPayment(token, paymentId) {
  const response = await apiRequest(`/admin/payments/${paymentId}`, { token });

  return {
    message: response.message,
    payment: normalizeAdminPayment(getPaymentFromResponse(response.data)),
  };
}

export async function adminSyncPaymentStatus(token, paymentId) {
  const response = await apiRequest(`/admin/payments/${paymentId}/sync-status`, {
    method: "POST",
    token,
  });

  return {
    alreadyProcessed: Boolean(response.data?.alreadyProcessed),
    message: response.message,
    payment: normalizeAdminPayment(getPaymentFromResponse(response.data)),
    providerStatus: response.data?.providerStatus || "",
  };
}
