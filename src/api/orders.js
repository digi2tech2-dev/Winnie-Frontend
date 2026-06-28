import { apiRequest } from "./client";
import {
  asArray,
  DEFAULT_CURRENCY,
  formatCurrency,
  formatDate,
  formatDateTime,
  getItemId,
  humanizeToken,
  normalizePagination,
  toNumber,
} from "./adapters";

const progressByStatus = {
  PENDING: 20,
  PROCESSING: 60,
  MANUAL_REVIEW: 65,
  PARTIAL: 85,
  COMPLETED: 100,
  CANCELED: 0,
  CANCELLED: 0,
  FAILED: 0,
};

export function normalizeOrder(order = {}) {
  const id = getItemId(order);
  const status = String(order.status || "PENDING").toUpperCase();
  const product = order.productId || order.product || {};
  const productName = product?.name || order.productName || "Order item";
  const currency = String(order.currency || DEFAULT_CURRENCY).toUpperCase();
  const amount = toNumber(order.chargedAmount ?? order.totalPrice ?? order.usdAmount, 0);
  const createdAt = order.createdAt || order.date || null;
  const orderNumber = order.orderNumber ? `#${order.orderNumber}` : id;

  return {
    ...order,
    id,
    _id: order._id ?? id,
    amount,
    currency,
    date: createdAt,
    dateLabel: formatDate(createdAt),
    dateTimeLabel: formatDateTime(createdAt),
    delivery: status === "COMPLETED" ? "Delivered" : humanizeToken(status, "Pending"),
    displayId: orderNumber,
    price: formatCurrency(amount, currency),
    product,
    productImage: product?.image || "",
    productName,
    progress: progressByStatus[status] ?? 35,
    quantity: toNumber(order.quantity, 1),
    rejectionReason: order.rejectionReason || "",
    status,
    statusLabel: humanizeToken(status, "Pending"),
  };
}

export async function getCustomerOrders(token, query = {}) {
  const response = await apiRequest("/me/orders", {
    token,
    query,
  });

  const orders = asArray(response.data).map(normalizeOrder);

  return {
    orders,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit,
      total: orders.length,
    }),
    message: response.message,
  };
}

export async function getCustomerOrder(token, orderId) {
  const response = await apiRequest(`/me/orders/${orderId}`, { token });
  return normalizeOrder(response.data || {});
}
