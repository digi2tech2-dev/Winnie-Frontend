import { apiRequest } from "./client";
import {
  asArray,
  compactObject,
  formatDateTime,
  findPaginationMetadata,
  getItemId,
  humanizeToken,
  normalizePagination,
  toNumber,
} from "./adapters";

const typeMap = {
  order: "orders",
  deposit: "wallet",
  wallet: "wallet",
  account: "account",
  admin: "account",
  system: "account",
};

export function normalizeNotification(notification = {}) {
  const id = getItemId(notification);
  const metadata = notification.data || notification.metadata || notification.meta || {};
  const backendType = String(
    notification.type || notification.eventType || notification.category || metadata.type || "system",
  ).toLowerCase();
  const priority = String(notification.priority || "normal").toLowerCase();
  const isRead = Boolean(notification.isRead ?? notification.read);
  const entityType =
    notification.entityType
    || notification.resourceType
    || notification.relatedModel
    || metadata.entityType
    || metadata.resourceType
    || "";
  const entityId =
    notification.entityId
    || notification.resourceId
    || notification.relatedId
    || notification.orderId
    || notification.paymentId
    || notification.depositId
    || notification.requestId
    || metadata.entityId
    || metadata.resourceId
    || metadata.orderId
    || metadata.paymentId
    || metadata.depositId
    || metadata.requestId
    || null;

  return {
    ...notification,
    id,
    _id: notification._id ?? id,
    backendType,
    entityId,
    entityType,
    level: priority === "high" ? "warning" : "info",
    message: notification.message || "",
    priority,
    readAt: notification.readAt || null,
    route:
      notification.route
      || notification.actionUrl
      || notification.url
      || notification.link
      || metadata.route
      || metadata.actionUrl
      || "",
    time: formatDateTime(notification.createdAt || notification.date),
    title: notification.title || humanizeToken(backendType, "Notification"),
    type: typeMap[backendType] || "account",
    unread: !isRead,
  };
}

export async function getNotifications(token, query = {}) {
  const response = await apiRequest("/me/notifications", {
    token,
    query: compactObject(query),
  });
  const payload = response.data || {};
  const notifications = asArray(payload.notifications || payload).map(normalizeNotification);
  const unreadCount = toNumber(payload.unreadCount, notifications.filter((item) => item.unread).length);

  return {
    notifications,
    unreadCount,
    pagination: normalizePagination(
      findPaginationMetadata(response.pagination)
        || findPaginationMetadata(payload)
        || findPaginationMetadata(response.raw),
      {
      page: query.page,
      limit: query.limit,
      total: notifications.length,
      },
    ),
    message: response.message,
  };
}

export async function getMyNotifications(token, query = {}) {
  return getNotifications(token, query);
}

export async function getUnreadNotificationCount(token) {
  const response = await apiRequest("/me/notifications/unread-count", { token });
  return toNumber(response.data?.unreadCount, 0);
}

export async function markNotificationRead(token, id) {
  const response = await apiRequest(`/me/notifications/${id}/read`, {
    method: "PATCH",
    token,
  });

  return {
    message: response.message,
    notification: normalizeNotification(response.data || {}),
  };
}

export async function markAllNotificationsRead(token) {
  const response = await apiRequest("/me/notifications/read-all", {
    method: "PATCH",
    token,
  });

  return {
    message: response.message,
    modifiedCount: toNumber(response.data?.modifiedCount, 0),
  };
}

export async function deleteNotification(token, id) {
  const response = await apiRequest(`/me/notifications/${id}`, {
    method: "DELETE",
    token,
  });

  return {
    message: response.message,
  };
}

export async function clearReadNotifications(token) {
  const response = await apiRequest("/me/notifications/read", {
    method: "DELETE",
    token,
  });

  return {
    deletedCount: toNumber(response.data?.deletedCount, 0),
    message: response.message,
  };
}
