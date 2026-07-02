import { apiRequest } from "./client";
import {
  DEFAULT_CURRENCY,
  formatCurrency,
  formatDateTime,
  getItemId,
  humanizeToken,
  normalizePagination,
  toNumber,
} from "./adapters";

export const PAYMENT_RISK_LIMIT_REACHED_CODE = "PAYMENT_RISK_LIMIT_REACHED";
export const PAYMENT_CURRENCY_CONVERSION_UNAVAILABLE_CODE = "PAYMENT_CURRENCY_CONVERSION_UNAVAILABLE";

export function isPaymentRiskLimitError(error) {
  return String(error?.code || "").toUpperCase() === PAYMENT_RISK_LIMIT_REACHED_CODE;
}

export function isPaymentCurrencyConversionError(error) {
  return String(error?.code || "").toUpperCase() === PAYMENT_CURRENCY_CONVERSION_UNAVAILABLE_CODE;
}

export function normalizePaymentIntent(payload = {}) {
  const payment = payload.payment || payload;
  const id = getItemId(payment);
  const currency = String(payment.currency || DEFAULT_CURRENCY).toUpperCase();
  const amount = toNumber(payment.amount ?? payment.totalAmount, 0);
  const status = String(payment.status || "PENDING").toUpperCase();
  const checkout = payload.checkout || {};
  const checkoutUrl = checkout.url || payment.checkoutUrl || "";
  const requestedAmount = toNumber(payment.requestedAmount ?? checkout.requestedAmount ?? amount, amount);
  const requestedCurrency = String(payment.requestedCurrency || checkout.requestedCurrency || currency).toUpperCase();
  const gatewayAmountValue = payment.gatewayAmount ?? checkout.gatewayAmount;
  const gatewayCurrencyValue = payment.gatewayCurrency || checkout.gatewayCurrency;
  const hasGatewayCharge = gatewayAmountValue !== undefined && gatewayAmountValue !== null && gatewayCurrencyValue;
  const gatewayAmount = hasGatewayCharge ? toNumber(gatewayAmountValue, 0) : null;
  const gatewayCurrency = hasGatewayCharge ? String(gatewayCurrencyValue).toUpperCase() : "";
  const exchangeRate = payment.exchangeRate ?? checkout.exchangeRate ?? null;

  return {
    ...payment,
    id,
    _id: payment._id ?? id,
    amount,
    amountLabel: formatCurrency(amount, currency),
    checkout,
    checkoutUrl,
    createdAtLabel: formatDateTime(payment.createdAt),
    currency,
    exchangeRate,
    gatewayAmount,
    gatewayAmountLabel: hasGatewayCharge ? formatCurrency(gatewayAmount, gatewayCurrency) : "",
    gatewayCurrency,
    hasGatewayCharge: Boolean(hasGatewayCharge),
    idempotent: Boolean(payload.idempotent),
    requestedAmount,
    requestedAmountLabel: formatCurrency(requestedAmount, requestedCurrency),
    requestedCurrency,
    status,
    statusLabel: humanizeToken(status, "Pending"),
    totalAmount: toNumber(payment.totalAmount ?? amount, amount),
    totalAmountLabel: formatCurrency(payment.totalAmount ?? amount, currency),
  };
}

export async function createPaymentIntent(token, payload, options = {}) {
  const headers = {};
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const response = await apiRequest("/payments/intents", {
    method: "POST",
    token,
    headers,
    body: payload,
  });

  return {
    payment: normalizePaymentIntent(response.data || {}),
    message: response.message,
    raw: response.data,
  };
}

export async function getPaymentStatus(token, paymentId) {
  const response = await apiRequest(`/payments/${paymentId}`, { token });
  return normalizePaymentIntent(response.data || {});
}

export async function syncPaymentStatus(token, paymentId) {
  const response = await apiRequest(`/payments/${paymentId}/sync-status`, {
    method: "POST",
    token,
  });

  return {
    payment: normalizePaymentIntent(response.data || {}),
    alreadyProcessed: Boolean(response.data?.alreadyProcessed),
    providerStatus: response.data?.providerStatus || "",
    message: response.message,
  };
}

export async function getCustomerPayments(token, query = {}) {
  const response = await apiRequest("/payments", {
    token,
    query,
  });

  const payments = (response.data?.payments || []).map(normalizePaymentIntent);

  return {
    payments,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit,
      total: payments.length,
    }),
    message: response.message,
  };
}
