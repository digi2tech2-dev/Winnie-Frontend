export const demoUsers = [
  {
    id: "usr_admin_001",
    name: "Winnie Admin",
    email: "admin@winniefun.com",
    role: "admin",
    tier: "Platform Owner",
    avatar: "A",
    passwordHash: "ad89b64d66caa8e30e5d5ce4a9763f4ecc205814c412175f3e2c50027471426d",
  },
  {
    id: "usr_customer_001",
    name: "Winnie Customer",
    email: "customer@winniefun.com",
    role: "customer",
    tier: "Premium Member",
    avatar: "W",
    passwordHash: "dca3c4b909ce609ff9c33e704304bbda4bad5349098e4bfaa685323a1e8cdadf",
  },
];

export async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
