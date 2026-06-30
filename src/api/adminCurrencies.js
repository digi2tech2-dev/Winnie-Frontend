import { apiRequest } from "./client";
import { asArray, compactObject } from "./adapters";
import { normalizeCurrency } from "./currencies";

export const ADMIN_CURRENCY_DELETE_SUPPORTED = false;

function currencyFromResponse(data) {
  return data?.currency || data || {};
}

function buildCreateCurrencyPayload(values = {}) {
  return compactObject({
    code: String(values.code || "").toUpperCase(),
    name: values.name,
    symbol: values.symbol,
    platformRate: Number(values.platformRate),
    marketRate: values.marketRate === "" ? null : values.marketRate,
    markupPercentage: values.markupPercentage === "" ? undefined : values.markupPercentage,
    isActive: values.isActive,
  });
}

function buildUpdateCurrencyPayload(values = {}) {
  return compactObject({
    platformRate: Number(values.platformRate),
    markupPercentage: values.markupPercentage === "" ? undefined : values.markupPercentage,
    applyDebtAdjustment: values.applyDebtAdjustment === true,
  });
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
