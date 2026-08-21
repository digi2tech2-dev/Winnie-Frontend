export const DEFAULT_CURRENCY = "USD";
const DEFAULT_API_BASE_URL = "http://localhost:5000/api";

export function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.products)) return value.products;
  if (Array.isArray(value?.users)) return value.users;
  if (Array.isArray(value?.payments)) return value.payments;
  if (Array.isArray(value?.deposits)) return value.deposits;
  if (Array.isArray(value?.subAgents)) return value.subAgents;
  if (Array.isArray(value?.commissions)) return value.commissions;
  if (Array.isArray(value?.payouts)) return value.payouts;
  if (Array.isArray(value?.requests)) return value.requests;
  if (Array.isArray(value?.referredUsers)) return value.referredUsers;
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
  const page = toNumber(
    source.page ?? source.currentPage ?? source.pageNumber ?? fallback.page,
    1,
  );
  const limit = toNumber(
    source.limit ?? source.perPage ?? source.pageSize ?? source.itemsPerPage ?? fallback.limit,
    20,
  );
  const total = toNumber(
    source.total
      ?? source.totalItems
      ?? source.totalCount
      ?? source.totalRecords
      ?? source.totalDocs
      ?? source.totalTransactions
      ?? source.count
      ?? fallback.total,
    0,
  );
  const pages = Math.max(
    1,
    toNumber(
      source.pages
        ?? source.totalPages
        ?? source.pageCount
        ?? source.numberOfPages
        ?? source.lastPage
        ?? fallback.pages,
      source.hasNextPage === true || source.hasNext === true
        ? page + 1
        : Math.ceil(total / limit) || 1,
    ),
  );

  return { page, limit, total, pages };
}

export function findPaginationMetadata(value, depth = 0, visited = new Set()) {
  if (!value || typeof value !== "object" || depth > 4 || visited.has(value)) return null;
  visited.add(value);

  const paginationKeys = new Set([
    "page", "currentPage", "pageNumber", "pages", "totalPages", "pageCount",
    "numberOfPages", "lastPage", "hasNext", "hasNextPage", "total", "totalItems",
    "totalCount", "totalRecords", "totalDocs", "totalTransactions", "count",
  ]);
  if (Object.keys(value).some((key) => paginationKeys.has(key))) return value;

  for (const child of Object.values(value)) {
    if (child && typeof child === "object" && !Array.isArray(child)) {
      const match = findPaginationMetadata(child, depth + 1, visited);
      if (match) return match;
    }
  }
  return null;
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

export function formatDateTime(value, locale = "en-US", options = null) {
  const date = toDateValue(value);
  if (!date) return "Unknown date";

  return new Intl.DateTimeFormat(
    locale,
    options || {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
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
  const source = Array.isArray(path)
    ? path[0]
    : path && typeof path === "object"
      ? path.url || path.secureUrl || path.secure_url || path.path || path.location || path.src
      : path;
  const value = String(source || "").trim().replace(/\\/g, "/");
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || /^data:/i.test(value) || /^blob:/i.test(value)) return value;

  const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
  const apiUrl = new URL(apiBaseUrl);
  const uploadsIndex = value.toLowerCase().indexOf("uploads/");
  if (uploadsIndex === -1) return value;
  const normalizedPath = `/${value.slice(uploadsIndex)}`;
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
