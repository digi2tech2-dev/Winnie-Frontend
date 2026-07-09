import { apiRequest } from "./client";
import { asArray, formatDateTime, getItemId, toNumber } from "./adapters";

export function normalizeCurrency(currency = {}) {
  const code = String(currency.code || currency.currency || "").trim().toUpperCase();
  const id = getItemId(currency, code);
  const platformRate = toNumber(currency.platformRate ?? currency.rate ?? currency.exchangeRate, 0);
  const marketRate = currency.marketRate === null || currency.marketRate === undefined
    ? null
    : toNumber(currency.marketRate, 0);
  const updatedAt = currency.lastUpdatedAt || currency.updatedAt || null;

  return {
    ...currency,
    id,
    _id: currency._id ?? id,
    code,
    isActive: currency.isActive !== false && currency.active !== false,
    lastUpdatedAt: updatedAt,
    marketRate,
    markupPercentage: toNumber(currency.markupPercentage, 0),
    name: currency.name || code || "Currency",
    platformRate,
    rate: platformRate,
    symbol: currency.symbol || code,
    updatedAt,
    updatedAtLabel: updatedAt ? formatDateTime(updatedAt, "ar-EG-u-nu-latn") : "-",
  };
}

export async function getPublicCurrencies() {
  const response = await apiRequest("/currencies/active");
  const currencies = asArray(response.data?.currencies || response.data).map(normalizeCurrency);

  return {
    currencies,
    message: response.message,
  };
}
