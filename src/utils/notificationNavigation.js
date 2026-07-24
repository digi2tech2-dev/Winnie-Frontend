const orderTypes = new Set(["order", "orders", "purchase"]);
const walletTransactionTypes = new Set([
  "deposit",
  "payment",
  "transaction",
  "wallet_transaction",
  "wallettransaction",
  "topup",
  "top_up",
  "refund",
  "wallet_adjustment",
]);
const subAgentTypes = new Set(["sub_agent", "referral", "invitation", "group_request", "group_change_request", "commission", "payout"]);
const accountTypes = new Set(["account", "profile", "user", "security", "login", "password", "verification"]);
const catalogTypes = new Set(["product", "category", "catalog", "offer", "offers", "promotion"]);

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
  const isAdmin = String(basePath).startsWith("/admin");
  if (!isAdmin && (path === "/admin" || path.startsWith("/admin/"))) return "";
  if (path !== basePath && !path.startsWith(`${basePath}/`) && !path.startsWith("/customer/") && !path.startsWith("/admin/")) {
    path = `${basePath}/${path.replace(/^\/+/, "")}`;
  }

  return path.replace(/\/orders\/([^/?#]+)/, "/order/$1");
}

function encodeEntityId(value) {
  return encodeURIComponent(String(value || "").trim());
}

function getAdminOperationTarget(notification, entityType, backendType, entityId) {
  const route = String(notification.route || notification.url || notification.link || notification.actionUrl || "").trim();
  const routeMatch = route.match(/\/(orders?|payments?|deposits?|balance-requests)\/([^/?#]+)/i);
  const routeKind = normalizeType(routeMatch?.[1]);
  const operationId = entityId || routeMatch?.[2] || "";
  const idQuery = operationId ? `?details=${encodeEntityId(operationId)}` : "";
  const notificationText = `${notification.title || ""} ${notification.message || ""}`.toLowerCase();
  const combinedType = `${entityType} ${backendType} ${routeKind} ${notificationText}`;

  if (/supplier|provider|مورد/.test(combinedType)) return "/admin/tools/suppliers";
  if (/wallet_adjustment/.test(combinedType)) return `/admin/tools/admin-wallet-adjustments${idQuery}`;
  if (/group_change|group_request|sub_agent|referral|commission|payout/.test(combinedType)) return `/admin/tools/sub-agents${idQuery}`;
  if (/\buser|account|profile|registration|verification/.test(combinedType)) return `/admin/tools/users${idQuery}`;
  if (/product|category|catalog|offer|promotion/.test(combinedType)) return `/admin/tools/products${idQuery}`;
  if (/\bgroup/.test(combinedType)) return `/admin/tools/groups${idQuery}`;
  if (/currency|exchange_rate/.test(combinedType)) return "/admin/tools/currencies";
  if (/whatsapp/.test(combinedType)) return "/admin/tools/whatsapp-notifications";
  if (/\border|purchase/.test(combinedType)) return `/admin/tools/orders${idQuery}`;
  if (/deposit|top_up|topup|balance_request/.test(combinedType)) return `/admin/tools/balance-requests${idQuery}`;
  if (/payment|transaction|wallet_transaction/.test(combinedType)) return `/admin/tools/payments${idQuery}`;
  return "";
}

export function getNotificationTarget(notification = {}, basePath = "/customer") {
  const entityType = normalizeType(notification.entityType);
  const backendType = normalizeType(notification.backendType || notification.type);
  const notificationText = `${notification.title || ""} ${notification.message || ""}`.toLowerCase();
  const isWalletBalanceMovement =
    /wallet_(credit|debit)|balance_(added|credited|deducted|debited)|admin_adjustment|wallet_adjustment/.test(`${entityType} ${backendType}`)
    || /خصم\s+(?:مبلغ\s+)?(?:رصيد|من\s+محفظتك)|إضافة\s+(?:مبلغ\s+)?رصيد|اضافة\s+(?:مبلغ\s+)?رصيد|تمت?\s+إضافة\s+رصيد|تمت?\s+اضافة\s+رصيد/.test(notificationText)
    || /(?:wallet|balance).*(?:credited|debited|deducted|added)|(?:credited|debited|deducted|added).*(?:wallet|balance)/.test(notificationText);
  const entityId =
    notification.entityId?._id
    || notification.entityId?.id
    || notification.entityId
    || notification.orderId?._id
    || notification.orderId
    || notification.paymentId?._id
    || notification.paymentId
    || notification.depositId?._id
    || notification.depositId
    || notification.requestId?._id
    || notification.requestId
    || notification.targetUserId?._id
    || notification.targetUserId
    || "";
  const isAdmin = String(basePath).startsWith("/admin");

  // Balance credits/debits are ledger events. They must always open the
  // transaction history even if the backend supplied a generic wallet route.
  if (isWalletBalanceMovement) return `${basePath}/wallet/transactions`;

  const backendRoute = normalizeBackendRoute(
    notification.route || notification.url || notification.link || notification.actionUrl,
    basePath,
  );

  if (isAdmin) {
    const adminOperationTarget = getAdminOperationTarget(notification, entityType, backendType, entityId);
    if (adminOperationTarget) return adminOperationTarget;
  }

  if (backendRoute) return backendRoute;

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
  if (subAgentTypes.has(entityType) || subAgentTypes.has(backendType)) {
    return `${basePath}/sub-agent`;
  }
  if (accountTypes.has(entityType) || accountTypes.has(backendType)) {
    if (["security", "login", "password"].includes(entityType) || ["security", "login", "password"].includes(backendType)) {
      return `${basePath}/settings`;
    }
    return `${basePath}/profile`;
  }
  if (catalogTypes.has(entityType) || catalogTypes.has(backendType)) {
    const categoryId = notification.categoryId?._id || notification.categoryId || "";
    return categoryId ? `${basePath}/categories/${encodeEntityId(categoryId)}` : `${basePath}/categories`;
  }

  return `${basePath}/notifications`;
}

export function getNotificationIconName(notification = {}) {
  const type = normalizeType(notification.entityType || notification.backendType || notification.type);
  if (orderTypes.has(type) || type.startsWith("order_")) return "ClipboardList";
  if (type === "wallet" || walletTransactionTypes.has(type) || type.startsWith("deposit_") || type.startsWith("payment_")) return "WalletCards";
  if (catalogTypes.has(type)) return "Gift";
  if (subAgentTypes.has(type)) return "UserPlus";
  if (accountTypes.has(type)) return "UserRound";
  if (notification.level === "warning") return "AlertTriangle";
  if (notification.level === "success") return "CheckCircle2";
  return "Bell";
}
