export const PAYMENT_METHODS_STORAGE_KEY = "winnie-admin-payment-methods";
export const PAYMENT_GROUPS_STORAGE_KEY = "winnie-admin-payment-groups";
export const WALLET_PAYMENT_GROUP_ID = "pay-global";

export const walletPaymentMethodsSeed = [
  {
    id: "visa",
    groupId: WALLET_PAYMENT_GROUP_ID,
    name: "شحن فيزا",
    description: "ادفع بسهولة وأمان باستخدام بطاقة فيزا",
    fee: 2.9,
    account: "**** 4242",
    bank: "Visa",
    owner: "Winnie Fun",
    image: "/logo.png",
    active: true,
    walletMethod: true,
  },
  {
    id: "mastercard",
    groupId: WALLET_PAYMENT_GROUP_ID,
    name: "شحن ماستركارد",
    description: "ادفع بسهولة وأمان باستخدام بطاقة ماستركارد",
    fee: 2.9,
    account: "**** 4242",
    bank: "Mastercard",
    owner: "Winnie Fun",
    image: "/logo.png",
    active: true,
    walletMethod: true,
  },
  {
    id: "apple",
    groupId: WALLET_PAYMENT_GROUP_ID,
    name: "Apple Pay",
    description: "ادفع بسرعة وأمان باستخدام Apple Pay",
    fee: 2.9,
    account: "Apple Pay",
    bank: "Apple Pay",
    owner: "Winnie Fun",
    image: "/logo.png",
    active: true,
    walletMethod: true,
  },
];

function toCustomerMethod(method) {
  return {
    id: method.id,
    groupId: method.groupId,
    title: method.name,
    description: method.description,
    fee: Number(method.fee) || 0,
    account: method.account || "",
    bank: method.bank || "",
    owner: method.owner || "",
    image: method.image || "/logo.png",
  };
}

function readStoredList(key) {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null) return null;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readAdminPaymentMethods() {
  return readStoredList(PAYMENT_METHODS_STORAGE_KEY);
}

export function readAdminPaymentGroups() {
  return readStoredList(PAYMENT_GROUPS_STORAGE_KEY);
}

function isWalletMethod(method) {
  return method.groupId === WALLET_PAYMENT_GROUP_ID || (!method.groupId && method.walletMethod === true);
}

function isMethodGroupActive(method, activeGroupIds) {
  return !activeGroupIds || !method.groupId || activeGroupIds.has(method.groupId);
}

export function getPaymentMethods() {
  const adminMethods = readAdminPaymentMethods();
  const adminGroups = readAdminPaymentGroups();
  const source = adminMethods ?? walletPaymentMethodsSeed;
  const activeGroupIds = adminGroups
    ? new Set(adminGroups.filter((group) => group.active !== false).map((group) => group.id))
    : null;

  return source
    .filter((method) => isWalletMethod(method) && method.active !== false && isMethodGroupActive(method, activeGroupIds))
    .map(toCustomerMethod);
}

export const paymentMethods = walletPaymentMethodsSeed.map(toCustomerMethod);

export function getPaymentMethod(methodId) {
  const availableMethods = getPaymentMethods();
  return availableMethods.find((method) => method.id === methodId) || availableMethods[0] || null;
}
