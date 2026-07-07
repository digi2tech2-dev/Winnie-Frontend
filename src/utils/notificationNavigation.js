const orderTypes = new Set(["order", "orders", "purchase"]);
const walletTransactionTypes = new Set([
  "deposit",
  "payment",
  "transaction",
  "wallet_transaction",
  "wallettransaction",
  "topup",
  "top_up",
]);

function normalizeType(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizeBackendRoute(route, basePath) {
  const value = String(route || "").trim();
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "";

  let path = value;
  if (path.startsWith("/customer/")) path = `${basePath}/${path.slice("/customer/".length)}`;
  if (path === "/customer") path = basePath;
  if (path.startsWith("/admin/user/")) path = `${basePath}/${path.slice("/admin/user/".length)}`;
  if (path === "/admin/user") path = basePath;
  if (path !== basePath && !path.startsWith(`${basePath}/`) && !path.startsWith("/customer/") && !path.startsWith("/admin/")) {
    path = `${basePath}/${path.replace(/^\/+/, "")}`;
  }

  return path.replace(/\/orders\/([^/?#]+)/, "/order/$1");
}

export function getNotificationTarget(notification = {}, basePath = "/customer") {
  const backendRoute = normalizeBackendRoute(
    notification.route || notification.url || notification.link || notification.actionUrl,
    basePath,
  );
  if (backendRoute) return backendRoute;

  const entityType = normalizeType(notification.entityType);
  const backendType = normalizeType(notification.backendType || notification.type);
  const entityId = notification.entityId?._id || notification.entityId?.id || notification.entityId || "";

  if (orderTypes.has(entityType) || orderTypes.has(backendType) || backendType.startsWith("order_")) {
    return entityId ? `${basePath}/order/${entityId}` : `${basePath}/orders`;
  }

  if (
    walletTransactionTypes.has(entityType)
    || walletTransactionTypes.has(backendType)
    || backendType.startsWith("deposit_")
    || backendType.startsWith("payment_")
  ) {
    return `${basePath}/wallet/transactions`;
  }

  if (entityType === "wallet" || backendType === "wallet") return `${basePath}/wallet`;
  if (["sub_agent", "referral", "invitation"].includes(entityType) || ["sub_agent", "referral", "invitation"].includes(backendType)) {
    return `${basePath}/sub-agent`;
  }
  if (["account", "profile", "user"].includes(entityType) || ["account", "profile"].includes(backendType)) {
    return `${basePath}/profile`;
  }
  if (["product", "category", "catalog", "offer", "offers"].includes(entityType) || ["product", "category", "catalog", "offer", "offers"].includes(backendType)) {
    return `${basePath}/categories`;
  }

  return `${basePath}/notifications`;
}

export function getNotificationIconName(notification = {}) {
  const type = normalizeType(notification.entityType || notification.backendType || notification.type);
  if (orderTypes.has(type) || type.startsWith("order_")) return "ClipboardList";
  if (type === "wallet" || walletTransactionTypes.has(type) || type.startsWith("deposit_") || type.startsWith("payment_")) return "WalletCards";
  if (["product", "category", "catalog", "offer", "offers"].includes(type)) return "Gift";
  if (["sub_agent", "referral", "invitation"].includes(type)) return "UserPlus";
  if (["account", "profile", "user"].includes(type)) return "UserRound";
  if (notification.level === "warning") return "AlertTriangle";
  if (notification.level === "success") return "CheckCircle2";
  return "Bell";
}
