export const FRONTEND_ROLES = Object.freeze({
  ADMIN: "admin",
  SUPERVISOR: "supervisor",
  CUSTOMER: "customer",
});

export function normalizeRole(role) {
  const value = String(role || "").trim().toUpperCase();
  if (value === "ADMIN") return FRONTEND_ROLES.ADMIN;
  if (value === "SUPERVISOR") return FRONTEND_ROLES.SUPERVISOR;
  if (value === "CUSTOMER") return FRONTEND_ROLES.CUSTOMER;
  return null;
}

export function normalizeStatus(status) {
  return String(status || "").trim().toUpperCase();
}

export function isAdminAreaRole(role) {
  const normalizedRole = normalizeRole(role) || role;
  return normalizedRole === FRONTEND_ROLES.ADMIN || normalizedRole === FRONTEND_ROLES.SUPERVISOR;
}

export function canAccessRole(userRole, requiredRole) {
  if (!requiredRole) return true;

  const normalizedUserRole = normalizeRole(userRole) || userRole;
  const normalizedRequiredRole = normalizeRole(requiredRole) || String(requiredRole || "").toLowerCase();

  if (normalizedRequiredRole === FRONTEND_ROLES.ADMIN) {
    return isAdminAreaRole(normalizedUserRole);
  }

  return normalizedUserRole === normalizedRequiredRole;
}

export function getDefaultRouteForRole(role) {
  const normalizedRole = normalizeRole(role) || role;
  if (isAdminAreaRole(normalizedRole)) return "/admin/user/dashboard";
  if (normalizedRole === FRONTEND_ROLES.CUSTOMER) return "/customer/dashboard";
  return "/";
}

export function canUseRedirectPath(role, path) {
  const value = String(path || "");
  if (value.startsWith("/admin")) return isAdminAreaRole(role);
  if (value.startsWith("/customer")) return normalizeRole(role) === FRONTEND_ROLES.CUSTOMER;
  return false;
}

export function isActiveUser(user) {
  const status = normalizeStatus(user?.status);
  return !status || status === "ACTIVE";
}

function getRoleLabel(role) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === FRONTEND_ROLES.ADMIN) return "Platform Admin";
  if (normalizedRole === FRONTEND_ROLES.SUPERVISOR) return "Supervisor";
  return "Premium Member";
}

export function normalizeUser(rawUser) {
  if (!rawUser || typeof rawUser !== "object") return null;

  const id = rawUser.id || rawUser._id || rawUser.userId || "";
  const normalizedRole = normalizeRole(rawUser.role);
  const group = rawUser.group || rawUser.groupId || null;

  return {
    ...rawUser,
    _id: rawUser._id || id,
    id,
    backendRole: rawUser.role || null,
    role: normalizedRole || String(rawUser.role || "").toLowerCase(),
    status: normalizeStatus(rawUser.status),
    verified: Boolean(rawUser.verified),
    tier: rawUser.tier || group?.name || getRoleLabel(rawUser.role),
    group,
    walletBalance: rawUser.walletBalance ?? 0,
    identityVerificationRequired: rawUser.identityVerificationRequired === true,
    identityVerificationReason: rawUser.identityVerificationReason || "",
  };
}
