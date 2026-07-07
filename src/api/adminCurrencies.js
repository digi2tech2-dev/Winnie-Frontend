import { apiRequest } from "./client";
import { asArray, compactObject } from "./adapters";
import { normalizeCurrency } from "./currencies";

export const ADMIN_CURRENCY_DELETE_SUPPORTED = true;

function currencyFromResponse(data) {
  return data?.currency || data || {};
}

function optionalNumber(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function nullableNumber(value) {
  if (value === "" || value === null) return null;
  if (value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function nonNegativeNumber(value, fallback = 0) {
  if (value === "" || value === null || value === undefined) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function buildCreateCurrencyPayload(values = {}) {
  return compactObject({
    code: String(values.code || "").toUpperCase(),
    name: values.name,
    symbol: values.symbol,
    platformRate: Number(values.platformRate),
    marketRate: optionalNumber(values.marketRate),
    markupPercentage: nonNegativeNumber(values.markupPercentage),
    isActive: values.isActive,
  });
}

function buildUpdateCurrencyPayload(values = {}) {
  const payload = compactObject({
    name: values.name,
    symbol: values.symbol,
    platformRate: Number(values.platformRate),
    markupPercentage: nonNegativeNumber(values.markupPercentage),
    isActive: values.isActive,
    applyDebtAdjustment: values.applyDebtAdjustment === true,
  });

  const marketRate = nullableNumber(values.marketRate);
  if (marketRate !== undefined) {
    payload.marketRate = marketRate;
  }

  return payload;
}

export async function getAdminCurrencies(token, query = {}) {
  const response = await apiRequest("/admin/currencies", {
    token,
    query: compactObject(query),
  });
  const currencies = asArray(response.data?.currencies || response.data).map(normalizeCurrency);

  return {
    currencies,
    message: response.message,
  };
}

export async function createAdminCurrency(token, values = {}) {
  const response = await apiRequest("/admin/currencies", {
    method: "POST",
    token,
    body: buildCreateCurrencyPayload(values),
  });

  return {
    currency: normalizeCurrency(currencyFromResponse(response.data)),
    message: response.message,
  };
}

export async function updateAdminCurrency(token, code, values = {}) {
  const response = await apiRequest(`/admin/currencies/${encodeURIComponent(String(code).toUpperCase())}`, {
    method: "PATCH",
    token,
    body: buildUpdateCurrencyPayload(values),
  });

  return {
    currency: normalizeCurrency(currencyFromResponse(response.data)),
    debtAdjustment: response.data?.debtAdjustment || null,
    message: response.message,
  };
}

export async function toggleAdminCurrency(token, code, isActive) {
  const response = await apiRequest(`/admin/currencies/${encodeURIComponent(String(code).toUpperCase())}/status`, {
    method: "PATCH",
    token,
    body: { isActive: Boolean(isActive) },
  });

  return {
    currency: normalizeCurrency(currencyFromResponse(response.data)),
    message: response.message,
  };
}

export async function deleteAdminCurrency(token, code) {
  const response = await apiRequest(`/admin/currencies/${encodeURIComponent(String(code).toUpperCase())}`, {
    method: "DELETE",
    token,
  });

  return {
    currency: normalizeCurrency(currencyFromResponse(response.data)),
    message: response.message,
  };
}
