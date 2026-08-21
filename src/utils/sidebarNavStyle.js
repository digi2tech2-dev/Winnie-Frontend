const navIdentityBySegment = {
  dashboard: { tone: "indigo", shape: "soft-square" },
  favorites: { tone: "rose", shape: "circle" },
  "best-selling": { tone: "amber", shape: "gem" },
  categories: { tone: "cyan", shape: "tiles" },
  orders: { tone: "orange", shape: "ticket" },
  wallet: { tone: "emerald", shape: "wallet" },
  api: { tone: "blue", shape: "hex" },
  "sub-agent": { tone: "fuchsia", shape: "agent" },
  about: { tone: "teal", shape: "building" },
  notifications: { tone: "gold", shape: "bell" },
  profile: { tone: "sky", shape: "circle" },
  settings: { tone: "slate", shape: "gear" },
  users: { tone: "blue", shape: "profile" },
  payments: { tone: "emerald", shape: "card" },
  "financial-reports": { tone: "teal", shape: "chart" },
  "balance-requests": { tone: "amber", shape: "request" },
  "admin-wallet-adjustments": { tone: "rose", shape: "wallet" },
  products: { tone: "violet", shape: "box" },
  groups: { tone: "cyan", shape: "cluster" },
  suppliers: { tone: "indigo", shape: "building" },
  "payment-methods": { tone: "sky", shape: "card" },
  currencies: { tone: "gold", shape: "coins" },
  "whatsapp-notifications": { tone: "emerald", shape: "message" },
  "sub-agents": { tone: "fuchsia", shape: "agent" },
};

const homeIdentity = { tone: "indigo", shape: "soft-square" };

export function getSidebarNavIdentity(path = "") {
  const normalizedPath = String(path).split(/[?#]/, 1)[0].replace(/\/+$/, "");
  const segment = normalizedPath.split("/").filter(Boolean).at(-1);

  if (!segment || segment === "home") return homeIdentity;
  return navIdentityBySegment[segment] || { tone: "violet", shape: "soft-square" };
}
