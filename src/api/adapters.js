export const DEFAULT_CURRENCY = "USD";
const DEFAULT_API_BASE_URL = "http://localhost:5000/api";

export function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.products)) return value.products;
  if (Array.isArray(value?.categories)) return value.categories;
  if (Array.isArray(value?.orders)) return value.orders;
  if (Array.isArray(value?.transactions)) return value.transactions;
  if (Array.isArray(value?.notifications)) return value.notifications;
  return [];
}

export function compactObject(payload = {}) {
  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) return acc;
    if (typeof value === "string" && value.trim() === "") return acc;
    acc[key] = typeof value === "string" ? value.trim() : value;
    return acc;
  }, {});
}

export function normalizePagination(pagination, fallback = {}) {
  const source = pagination || {};
  const page = toNumber(source.page ?? fallback.page, 1);
  const limit = toNumber(source.limit ?? fallback.limit, 20);
  const total = toNumber(source.total ?? fallback.total, 0);
  const pages = Math.max(1, toNumber(source.pages ?? fallback.pages, Math.ceil(total / limit) || 1));

  return { page, limit, total, pages };
}

export function getItemId(item, fallback = "") {
  return String(item?._id ?? item?.id ?? item?.orderNumber ?? fallback ?? "");
}

export function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function toDateValue(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export function formatDateTime(value, locale = "en-US") {
  const date = toDateValue(value);
  if (!date) return "Unknown date";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(value, locale = "en-US") {
  const date = toDateValue(value);
  if (!date) return "Unknown date";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(date);
}

export function formatCurrency(value, currency = DEFAULT_CURRENCY, locale = "en-US") {
  const amount = toNumber(value, 0);
  const safeCurrency = String(currency || DEFAULT_CURRENCY).toUpperCase();

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${safeCurrency}`;
  }
}

export function resolveBackendAssetUrl(path) {
  const value = String(path || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || /^data:/i.test(value)) return value;
  if (!/^\/?uploads\//i.test(value)) return value;

  const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
  const apiUrl = new URL(apiBaseUrl);
  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${apiUrl.origin}${normalizedPath}`;
}

export function humanizeToken(value, fallback = "Unknown") {
  const text = String(value || "").trim();
  if (!text) return fallback;

  return text
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function normalizeUserProfile(user = {}) {
  const id = getItemId(user);
  const group = user.group || user.groupId || null;

  return {
    ...user,
    id,
    _id: user._id ?? id,
    name: user.name || user.username || "Winnie user",
    email: user.email || "",
    username: user.username || "",
    phone: user.phone || "",
    country: user.country || "",
    avatar: user.avatar || "",
    role: user.role || "CUSTOMER",
    status: user.status || "",
    verified: Boolean(user.verified),
    currency: String(user.currency || DEFAULT_CURRENCY).toUpperCase(),
    walletBalance: toNumber(user.walletBalance, 0),
    group,
    tier: group?.name || user.tier || "Member",
    createdAt: user.createdAt || null,
  };
}
